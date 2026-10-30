import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useSession } from '../features/auth/useSession';
import { Button } from '../components/ui/Button';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resetPassword } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Password reset token is missing from the URL.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(token, newPassword);
    setIsSubmitting(false);

    if (result.ok) {
      setSuccess(result.message);
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-calm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text">Choose New Password</h1>
            <p className="text-xs text-text-muted">Enter and confirm your new secure password.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-input bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-input bg-accent/10 border border-accent/30 text-accent text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{success} Redirecting to app...</span>
          </div>
        )}

        {!token ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-danger font-medium">
              Invalid or missing reset token in the link.
            </p>
            <Link to="/">
              <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />}>
                Back to Home
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">New Password</label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-9 pl-9 pr-3 rounded-input bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full h-9 pl-9 pr-3 rounded-input bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </form>
        )}

        <div className="pt-2 text-center border-t border-border">
          <Link
            to="/"
            className="text-xs text-text-muted hover:text-text transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={13} />
            <span>Return to SyncTask</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
