import 'dotenv/config';
import express from 'express';
import path from 'path';
import { connectDatabase, isMongoConnected } from './server/config/db.ts';
import authRoutes from './server/routes/auth.ts';
import ordersRoutes from './server/routes/orders.ts';
import productsRoutes from './server/routes/products.ts';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  await connectDatabase();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      database: isMongoConnected() ? 'mongodb' : 'local-json',
    });
  });

  app.use('/api/products', productsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/orders', ordersRoutes);

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NavaKart server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
