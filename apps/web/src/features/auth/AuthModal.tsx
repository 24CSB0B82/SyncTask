import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useSession } from './useSession';
import { IconButton } from '../../components/ui/IconButton';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onOpenChange,
  defaultMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register, oauthLogin, forgotPassword, isLoading, error, clearError } =
    useSession();

  React.useEffect(() => {
    if (open) {
      setMode(defaultMode);
      clearError();
      setSuccessMsg('');
    }
  }, [open, defaultMode, clearError]);

  const handleOAuth = async (provider: 'google' | 'github') => {
    clearError();
    setSuccessMsg('');
    const ok = await oauthLogin(provider);
    if (ok) {
      setSuccessMsg(`Signed in with ${provider === 'google' ? 'Google' : 'GitHub'}!`);
      setTimeout(() => onOpenChange(false), 900);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg('');

    if (mode === 'login') {
      const ok = await login({ email, password });
      if (ok) {
        setSuccessMsg('Welcome back! Syncing your data...');
        setTimeout(() => onOpenChange(false), 900);
      }
    } else if (mode === 'register') {
      const ok = await register({ email, password, username });
      if (ok) {
        setSuccessMsg('Account created successfully!');
        setTimeout(() => onOpenChange(false), 900);
      }
    } else if (mode === 'forgot') {
      const result = await forgotPassword(email);
      if (result.ok) {
        setSuccessMsg(result.message);
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl p-6 z-50 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-text">
                  {mode === 'login'
                    ? 'Sign in to SyncTask'
                    : mode === 'register'
                      ? 'Create an Account'
                      : 'Reset Password'}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-text-muted">
                  {mode === 'login'
                    ? 'Sync your deadlines & planner across all your devices'
                    : mode === 'register'
                      ? 'Start seamless offline-first synchronization'
                      : 'Enter your email to receive a password reset link'}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <IconButton variant="ghost" size="sm" aria-label="Close dialog">
                <X size={16} />
              </IconButton>
            </Dialog.Close>
          </div>

          {/* Social OAuth Buttons (FR-AUTH-5) */}
          {mode !== 'forgot' && (
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 h-9 px-3 rounded-input border border-border bg-surface-2 hover:bg-surface text-xs font-medium text-text transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 h-9 px-3 rounded-input border border-border bg-surface-2 hover:bg-surface text-xs font-medium text-text transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-border w-full absolute" />
                <span className="bg-surface px-2 text-[10px] uppercase font-mono tracking-wider text-text-muted relative">
                  Or with email
                </span>
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-surface-2 p-1 rounded-input mb-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearError();
              }}
              className={`py-1.5 rounded-[8px] transition-all ${
                mode === 'login'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                clearError();
              }}
              className={`py-1.5 rounded-[8px] transition-all ${
                mode === 'register'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Full Name / Username
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full h-9 pl-9 pr-3 rounded-input bg-surface-2 border border-border text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full h-9 pl-9 pr-3 rounded-input bg-surface-2 border border-border text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-text-muted">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        clearError();
                      }}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                    className="w-full h-9 pl-9 pr-3 rounded-input bg-surface-2 border border-border text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 mt-2 rounded-input bg-primary text-primary-contrast font-medium text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {mode === 'login'
                      ? 'Signing in...'
                      : mode === 'register'
                        ? 'Creating account...'
                        : 'Sending reset link...'}
                  </span>
                </>
              ) : (
                <span>
                  {mode === 'login'
                    ? 'Sign In'
                    : mode === 'register'
                      ? 'Create Free Account'
                      : 'Send Password Reset Link'}
                </span>
              )}
            </button>

            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearError();
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </form>

          {/* Offline Notice Footer */}
          <div className="mt-5 pt-4 border-t border-border text-center">
            <p className="text-[11px] text-text-muted leading-relaxed">
              💡 <span className="font-medium text-text">No account required for local use.</span>{' '}
              All tasks and reminders are safely stored in your browser's offline storage.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
