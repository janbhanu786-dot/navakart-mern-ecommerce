import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { SafeImage } from './SafeImage';
import type { AuthUser } from '../types';

interface AuthGateProps {
  onAuthSuccess: (token: string, user: AuthUser) => void;
}

const DEPARTMENTS = [
  { name: 'Dresses', hex: '#BE185D' },
  { name: 'Fruits', hex: '#EA580C' },
  { name: 'Vegetables', hex: '#059669' },
  { name: 'Groceries', hex: '#B45309' },
  { name: 'Shoes', hex: '#1D4ED8' },
  { name: 'Cosmetics', hex: '#E11D48' },
];

export function AuthGate({ onAuthSuccess }: AuthGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint =
        mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body =
        mode === 'register'
          ? { name: name.trim(), email: email.trim(), password }
          : { email: email.trim(), password };

      const res = await apiRequest<{ token: string; user: AuthUser }>(endpoint, {
        method: 'POST',
        body,
      });

      onAuthSuccess(res.token, res.user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-stretch">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual Marketplace Showcase */}
        <div className="lg:col-span-7 relative min-h-[280px] lg:min-h-screen bg-zinc-900 flex flex-col justify-between overflow-hidden">
          <SafeImage
            src="/src/assets/images/hero_bazaar_showcase_1795424698066.jpg"
            alt="NavaKart marketplace showcase featuring dresses, fresh fruits, sneakers, spices, and cosmetics"
            className="absolute inset-0 w-full h-full object-cover"
            accentHex="#BE185D"
            title="NavaKart Marketplace"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30"
            aria-hidden="true"
          />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex items-center justify-between">
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              NavaKart
            </span>
            <span className="text-xs font-medium text-white/85">
              Six Departments · One Account
            </span>
          </div>

          <div className="relative z-10 p-6 sm:p-10 lg:p-12 space-y-6 max-w-2xl">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight text-white text-balance">
                Dresses, fresh produce, pantry staples, shoes &amp; beauty.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed">
                Sign in or create your shopper account to browse all six departments, unlock
                welcome savings, and track Cash on Delivery orders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/90">
              {DEPARTMENTS.map((dept) => (
                <span key={dept.name} className="inline-flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: dept.hex }}
                    aria-hidden="true"
                  />
                  <span>{dept.name}</span>
                </span>
              ))}
            </div>

            <div className="pt-4 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/90">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Free delivery ₹499+</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-300 shrink-0" />
                <span>7-day easy returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sign In & Registration Panel */}
        <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white border-t lg:border-t-0 lg:border-l border-zinc-200">
          <div className="w-full max-w-md space-y-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-800">
                Shopper Access
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1.5">
                {mode === 'login' ? 'Sign in to NavaKart' : 'Create your account'}
              </h2>
              <p className="text-sm text-zinc-600 mt-1.5">
                {mode === 'login'
                  ? 'Enter your email and password to open the storefront.'
                  : 'Register in seconds to start shopping across all 6 departments.'}
              </p>
            </div>

            {/* Segmented Mode Switch */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-semibold text-zinc-700 mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={60}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ananya Sharma"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-700/20 focus:border-fuchsia-700"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-700/20 focus:border-fuchsia-700"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-700/20 focus:border-fuchsia-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#9D174D] hover:bg-fuchsia-900 disabled:bg-zinc-400 rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {loading
                    ? 'Please wait...'
                    : mode === 'login'
                      ? 'Sign In & Open Store'
                      : 'Create Account & Open Store'}
                </span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-xs text-zinc-500 text-center">
              {mode === 'login' ? (
                <>
                  New to NavaKart?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="font-semibold text-fuchsia-800 hover:underline cursor-pointer"
                  >
                    Create a free account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="font-semibold text-fuchsia-800 hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
