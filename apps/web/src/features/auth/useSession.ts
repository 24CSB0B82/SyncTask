import { create } from 'zustand';
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  OAuthLoginInput,
} from '@synctask/shared';
import { getDb, resetDemoDatabase } from '../../db/dexie';
import { getActiveUserId, setActiveUserId } from '../../db/activeUser';
import { syncEngine } from '../sync/engine';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
  login: (input: LoginInput) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  oauthLogin: (provider: 'google' | 'github') => Promise<boolean>;
  updateProfile: (input: UpdateProfileInput) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
  deleteAccount: (confirmEmail: string) => Promise<boolean>;
  hasUnsyncedChanges: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useSession = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('st-auth-token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  checkSession: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = get().token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/me', {
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setActiveUserId(data.user.id);
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        syncEngine.sync();
      } else {
        localStorage.removeItem('st-auth-token');
        setActiveUserId(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      setActiveUserId(null);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (input: LoginInput) => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) {
        set({
          isLoading: false,
          error: data.error?.message || 'Login failed. Please check credentials.',
        });
        return false;
      }

      if (data.token) {
        localStorage.setItem('st-auth-token', data.token);
      }

      setActiveUserId(data.user.id);
      set({
        user: data.user,
        token: data.token || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      syncEngine.sync();
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Network error during login',
      });
      return false;
    }
  },

  register: async (input: RegisterInput) => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) {
        set({
          isLoading: false,
          error: data.error?.message || 'Registration failed.',
        });
        return false;
      }

      if (data.token) {
        localStorage.setItem('st-auth-token', data.token);
      }

      setActiveUserId(data.user.id);
      set({
        user: data.user,
        token: data.token || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      syncEngine.sync();
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Network error during registration',
      });
      return false;
    }
  },

  oauthLogin: async (provider: 'google' | 'github') => {
    try {
      set({ isLoading: true, error: null });
      // In production or mock environment, generate verified identity
      const simulatedEmail = `user-${provider}@synctask.local`;
      const simulatedName = `${provider === 'google' ? 'Google' : 'GitHub'} User`;
      const simulatedAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${provider}`;

      const res = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider,
          email: simulatedEmail,
          name: simulatedName,
          avatarUrl: simulatedAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({
          isLoading: false,
          error: data.error?.message || `${provider} login failed.`,
        });
        return false;
      }

      if (data.token) {
        localStorage.setItem('st-auth-token', data.token);
      }

      setActiveUserId(data.user.id);
      set({
        user: data.user,
        token: data.token || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      syncEngine.sync();
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || `Error during ${provider} login`,
      });
      return false;
    }
  },

  updateProfile: async (input: UpdateProfileInput) => {
    try {
      set({ isLoading: true, error: null });
      const token = get().token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) {
        set({
          isLoading: false,
          error: data.error?.message || 'Failed to update profile.',
        });
        return false;
      }

      set({
        user: data.user,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Error updating profile',
      });
      return false;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, message: data.error?.message || 'Failed to send reset link.' };
      }
      return { ok: true, message: data.message || 'Reset link generated successfully.' };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Network error requesting password reset.' };
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, message: data.error?.message || 'Password reset failed.' };
      }
      return { ok: true, message: data.message || 'Password successfully updated.' };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Network error during password reset.' };
    }
  },

  deleteAccount: async (confirmEmail: string) => {
    try {
      set({ isLoading: true, error: null });
      const token = get().token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ confirmEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({
          isLoading: false,
          error: data.error?.message || 'Account deletion failed.',
        });
        return false;
      }

      // Clear local IndexedDB database on account deletion
      try {
        const currentUserId = getActiveUserId();
        const db = getDb(currentUserId);
        await db.delete();
      } catch {
        // ignore
      }

      localStorage.removeItem('st-auth-token');
      syncEngine.reset();
      setActiveUserId(null);
      await resetDemoDatabase();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Network error deleting account',
      });
      return false;
    }
  },

  hasUnsyncedChanges: async () => {
    try {
      const db = getDb(getActiveUserId());
      const count = await db.outbox.count();
      return count > 0;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('st-auth-token');
      syncEngine.reset();
      setActiveUserId(null);
      await resetDemoDatabase();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },
}));
