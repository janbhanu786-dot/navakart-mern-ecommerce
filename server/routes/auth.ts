import crypto from 'crypto';
import { Router, type Response } from 'express';
import {
  hashPassword,
  requireAuth,
  signSessionToken,
  timingSafeStringEqual,
  verifyPassword,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import {
  createUser,
  findAdminUser,
  findUserByEmail,
} from '../services/repository.ts';

const router = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (name.length < 2 || name.length > 60) {
      res.status(400).json({ error: 'Name must be between 2 and 60 characters' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please enter a valid email address' });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const user = await createUser({
      id: `usr_${crypto.randomBytes(6).toString('hex')}`,
      name,
      email,
      passwordHash: hashPassword(password),
      role: 'customer',
      createdAt: new Date().toISOString(),
    });

    const token = signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: (err as Error).message });
  }
});

router.post('/login', async (req, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: (err as Error).message });
  }
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

router.get('/admin-status', async (_req, res: Response) => {
  try {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      res.json({ configured: true, bootstrapAvailable: false });
      return;
    }
    const adminUser = await findAdminUser();
    res.json({
      configured: Boolean(adminUser),
      bootstrapAvailable: !adminUser,
    });
  } catch (err) {
    res.status(500).json({ error: 'Unable to check admin status', details: (err as Error).message });
  }
});

router.post('/admin-setup', async (req, res: Response) => {
  try {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      res.status(403).json({ error: 'Admin passcode is managed by environment configuration' });
      return;
    }

    const existingAdmin = await findAdminUser();
    if (existingAdmin) {
      res.status(409).json({ error: 'Studio Admin passcode has already been claimed' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const passcode = typeof body.passcode === 'string' ? body.passcode : '';
    if (passcode.length < 6 || passcode.length > 128) {
      res.status(400).json({ error: 'Passcode must be at least 6 characters' });
      return;
    }

    const adminUser = await createUser({
      id: `adm_${crypto.randomBytes(6).toString('hex')}`,
      name: 'Studio Admin',
      email: 'admin@navakart.local',
      passwordHash: hashPassword(passcode),
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    const token = signSessionToken({
      sub: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: 'admin',
    });

    res.status(201).json({
      token,
      user: { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: 'admin' },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim admin access', details: (err as Error).message });
  }
});

router.post('/admin-login', async (req, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const passcode = typeof body.passcode === 'string' ? body.passcode : '';
    if (!passcode) {
      res.status(400).json({ error: 'Passcode is required' });
      return;
    }

    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      if (!timingSafeStringEqual(passcode, envPasscode)) {
        res.status(401).json({ error: 'Incorrect studio passcode' });
        return;
      }
      const token = signSessionToken({
        sub: 'adm_env',
        email: 'admin@navakart.local',
        name: 'Studio Admin',
        role: 'admin',
      });
      res.json({
        token,
        user: { id: 'adm_env', name: 'Studio Admin', email: 'admin@palomagoods.local', role: 'admin' },
      });
      return;
    }

    const adminUser = await findAdminUser();
    if (!adminUser) {
      res.status(409).json({ error: 'Admin passcode not yet initialized' });
      return;
    }

    if (!verifyPassword(passcode, adminUser.passwordHash)) {
      res.status(401).json({ error: 'Incorrect studio passcode' });
      return;
    }

    const token = signSessionToken({
      sub: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: 'admin',
    });

    res.json({
      token,
      user: { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: 'admin' },
    });
  } catch (err) {
    res.status(500).json({ error: 'Admin sign-in failed', details: (err as Error).message });
  }
});

export default router;
