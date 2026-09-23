import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, LoginInput, RegisterInput } from '@realtime-chat/shared';
import { useAuthStore } from '../../stores/auth-store.js';
import { Lock, User, Mail, Sparkles } from 'lucide-react';

export function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const { login, register: registerUser, error: authError } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '' },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', displayName: '' },
  });

  const onLoginSubmit = async (data: LoginInput) => {
    try {
      setLoading(true);
      await login(data);
    } catch {
      // Handled in store
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterInput) => {
    try {
      setLoading(true);
      await registerUser(data);
    } catch {
      // Handled in store
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (loginValue: string) => {
    setTab('login');
    loginForm.setValue('login', loginValue);
    loginForm.setValue('password', 'Password123!');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 font-bold text-2xl">
            ⚡
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">PulseChat</h1>
          <p className="text-sm text-slate-400">
            Real-time team communication with channels, presence, and direct messages.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'login'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'register'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
              {authError}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    {...loginForm.register('login')}
                    type="text"
                    placeholder="e.g. alice or alice@example.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {loginForm.formState.errors.login && (
                  <p className="mt-1 text-xs text-rose-400">
                    {loginForm.formState.errors.login.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    {...loginForm.register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-rose-400">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                <input
                  {...registerForm.register('displayName')}
                  type="text"
                  placeholder="Alice Smith"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                {registerForm.formState.errors.displayName && (
                  <p className="mt-1 text-xs text-rose-400">
                    {registerForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
                <input
                  {...registerForm.register('username')}
                  type="text"
                  placeholder="alice"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                {registerForm.formState.errors.username && (
                  <p className="mt-1 text-xs text-rose-400">
                    {registerForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    {...registerForm.register('email')}
                    type="email"
                    placeholder="alice@example.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-rose-400">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    {...registerForm.register('password')}
                    type="password"
                    placeholder="Min 8 characters"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-rose-400">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Demo Users Quick Fill */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick Login Demo Accounts (Password: Password123!)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFill('alice')}
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-left hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all"
              >
                <div className="text-xs font-medium text-white">Alice (Owner)</div>
                <div className="text-[10px] text-slate-500">alice@example.com</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill('bob')}
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-left hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all"
              >
                <div className="text-xs font-medium text-white">Bob (Admin)</div>
                <div className="text-[10px] text-slate-500">bob@example.com</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill('charlie')}
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-left hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all"
              >
                <div className="text-xs font-medium text-white">Charlie (Member)</div>
                <div className="text-[10px] text-slate-500">charlie@example.com</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill('moderator')}
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-left hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all"
              >
                <div className="text-xs font-medium text-white">Moderator</div>
                <div className="text-[10px] text-slate-500">moderator@example.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
