import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Laptop,
  Palette,
  Bell,
  User as UserIcon,
  Database,
  Lock,
  Download,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useThemeStore, ThemeMode } from '../lib/theme';
import { useLiveSettings } from '../db/useDatabase';
import { updateUserSettings } from '../db/repositories';
import { useSession } from '../features/auth/useSession';
import { AuthModal } from '../features/auth/AuthModal';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';
import { getDb } from '../db/dexie';

export const SettingsPage: React.FC = () => {
  const { tab = 'appearance' } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const settings = useLiveSettings();
  const { user, isAuthenticated, updateProfile, deleteAccount, logout } = useSession();
  const { show: showToast } = useToast();

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Profile Form State
  const [username, setUsername] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data / Account Deletion State
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  React.useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]);

  const [browserPermission, setBrowserPermission] = useState<string>(() => {
    if (typeof Notification !== 'undefined') {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const handleRequestPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        await updateUserSettings({ browserNotifications: true });
        showToast({ title: 'Browser notifications enabled', type: 'success' });
      } else {
        await updateUserSettings({ browserNotifications: false });
        showToast({ title: 'Browser notifications denied', type: 'warn' });
      }
    }
  };

  // Client-side canvas resize to 256px WebP (max 100 KB) per FR-AUTH-4
  const handleAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast({ title: 'Please select an image file', type: 'warn' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);
          const webpData = canvas.toDataURL('image/webp', 0.85);

          // Check max size 100 KB
          if (webpData.length > 100 * 1024 * 1.37) {
            showToast({
              title: 'Avatar image too large',
              description: 'Image must be under 100 KB after compression',
              type: 'warn',
            });
            return;
          }

          setAvatarPreview(webpData);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    setIsUpdatingProfile(true);
    const payload: {
      username?: string;
      avatarUrl?: string | null;
      currentPassword?: string;
      newPassword?: string;
    } = {};

    if (username.trim() && username !== user?.username) {
      payload.username = username.trim();
    }

    if (avatarPreview !== user?.avatarUrl) {
      payload.avatarUrl = avatarPreview;
    }

    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    const ok = await updateProfile(payload);
    setIsUpdatingProfile(false);

    if (ok) {
      showToast({ title: 'Profile updated successfully', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  // Data Export per FR-GAP-6
  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('st-auth-token');
      if (token && isAuthenticated) {
        // Cloud export
        const res = await fetch('/api/auth/export', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `synctask-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
          showToast({ title: 'Data exported successfully', type: 'success' });
          return;
        }
      }

      // Local Dexie export
      const db = getDb();
      const [lists, tasks, subtasks, notifications, userSettings] = await Promise.all([
        db.lists.toArray(),
        db.tasks.toArray(),
        db.subtasks.toArray(),
        db.notifications.toArray(),
        db.settings.toArray(),
      ]);

      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        source: 'local_indexeddb',
        lists,
        tasks,
        subtasks,
        notifications,
        settings: userSettings[0] || null,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synctask-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast({ title: 'Local backup downloaded', type: 'success' });
    } catch (err: any) {
      showToast({
        title: 'Export failed',
        description: err.message || 'Unable to serialize data',
        type: 'error',
      });
    }
  };

  // Account Deletion per FR-GAP-6
  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteEmailConfirm.trim().toLowerCase() !== user.email.toLowerCase()) {
      showToast({
        title: 'Email confirmation mismatch',
        description: 'Please type your exact email address to confirm.',
        type: 'warn',
      });
      return;
    }

    if (
      !window.confirm(
        'Are you absolutely sure? This will delete all your tasks, collections, and cloud records permanently.'
      )
    ) {
      return;
    }

    setIsDeletingAccount(true);
    const ok = await deleteAccount(deleteEmailConfirm.trim());
    setIsDeletingAccount(false);

    if (ok) {
      showToast({ title: 'Account deleted', description: 'All records removed.' });
      navigate('/');
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'data', label: 'Data', icon: Database },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-text tracking-tight">Settings</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Manage appearance, defaults, notifications, and profile preferences.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-2 text-xs">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <Link
              key={t.id}
              to={`/settings/${t.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-input font-medium transition-colors ${
                isActive
                  ? 'bg-surface text-primary shadow-sm font-semibold'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Appearance Tab */}
      {tab === 'appearance' && (
        <div className="rounded-card bg-surface border border-border p-5 space-y-6 shadow-calm">
          <div>
            <h3 className="text-sm font-semibold text-text">Theme Preference</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Choose your interface color scheme. "System" follows your OS dark mode.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[
                {
                  id: 'light',
                  label: 'Morning Mist (Light)',
                  icon: Sun,
                  desc: 'Calm soft blue-grey surfaces',
                },
                {
                  id: 'dark',
                  label: 'Deep Tide (Dark)',
                  icon: Moon,
                  desc: 'Low-contrast peaceful dark palette',
                },
                {
                  id: 'system',
                  label: 'System Preference',
                  icon: Laptop,
                  desc: 'Automatic sync with OS settings',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id as ThemeMode)}
                    className={`flex flex-col items-start p-3.5 rounded-card border text-left transition-all ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-surface-2 hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div
                        className={`p-1.5 rounded-input ${
                          isSelected
                            ? 'bg-primary text-primary-contrast'
                            : 'text-text-muted bg-surface'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-xs font-semibold text-text">{item.label}</span>
                    <span className="text-[11px] text-text-muted mt-0.5 leading-tight">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab (FR-NOT-1, FR-NOT-6, FR-NOT-7) */}
      {tab === 'notifications' && (
        <div className="rounded-card bg-surface border border-border p-5 space-y-6 shadow-calm text-xs">
          {/* Default Lead Time */}
          <div className="space-y-2 pb-5 border-b border-border">
            <h3 className="text-sm font-semibold text-text">Default Reminder Lead Time</h3>
            <p className="text-xs text-text-muted">
              Standard notification advance time for new tasks when "Use default" is selected.
            </p>
            <div className="max-w-xs pt-1">
              <Select
                value={settings?.defaultReminderMin ?? 30}
                onChange={(e) => updateUserSettings({ defaultReminderMin: Number(e.target.value) })}
              >
                <option value={0}>At due time</option>
                <option value={5}>5 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={120}>2 hours before</option>
                <option value={1440}>1 day before</option>
              </Select>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3 pb-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text">Quiet Hours</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  During quiet hours, reminders arrive silently in the bell icon without toasts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateUserSettings({ quietEnabled: !settings?.quietEnabled })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings?.quietEnabled ? 'bg-primary' : 'bg-surface-2 border-border'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings?.quietEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings?.quietEnabled && (
              <div className="grid grid-cols-2 gap-3 max-w-xs pt-2 animate-in fade-in-0">
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings?.quietStart || '22:00'}
                    onChange={(e) => updateUserSettings({ quietStart: e.target.value })}
                    className="w-full h-8 rounded-input bg-surface-2 border border-border px-2 text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings?.quietEnd || '07:00'}
                    onChange={(e) => updateUserSettings({ quietEnd: e.target.value })}
                    className="w-full h-8 rounded-input bg-surface-2 border border-border px-2 text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Browser Notifications (FR-NOT-7) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text">Browser Notifications</h3>
            <p className="text-xs text-text-muted">
              Display system alerts when the tab is running in the background. Permission is
              strictly opt-in.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant={browserPermission === 'granted' ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleRequestPermission}
                disabled={browserPermission === 'unsupported'}
              >
                {browserPermission === 'granted'
                  ? 'Notifications Allowed'
                  : 'Enable Browser Alerts'}
              </Button>
              <span className="text-[11px] font-mono text-text-muted capitalize">
                Status: {browserPermission}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab (FR-AUTH-4) */}
      {tab === 'profile' && (
        <div className="rounded-card bg-surface border border-border p-5 space-y-6 shadow-calm text-xs">
          {!isAuthenticated ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <UserIcon size={20} />
              </div>
              <h3 className="text-sm font-semibold text-text">Account & Profile</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Sign in or register to customize your avatar, manage credentials, and enable cloud
                backup across devices.
              </p>
              <Button variant="primary" size="sm" onClick={() => setAuthModalOpen(true)}>
                Sign In / Register
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 pb-5 border-b border-border">
                <div className="relative group">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={user?.username || 'User avatar'}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[11px] font-medium"
                  >
                    Change
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleAvatarFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text">Profile Picture</h4>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Resized client-side to 256 px WebP (max 100 KB).
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      icon={<Upload size={12} />}
                    >
                      Upload Picture
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAvatarPreview(null)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Username & Email */}
              <div className="space-y-3 pb-5 border-b border-border">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full max-w-sm h-8 rounded-input bg-surface-2 border border-border px-2.5 text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full max-w-sm h-8 rounded-input bg-surface-2/60 border border-border/80 px-2.5 text-xs text-text-muted cursor-not-allowed"
                  />
                  <span className="text-[10px] text-text-muted mt-0.5 block">
                    Account email is primary identifier.
                  </span>
                </div>
              </div>

              {/* Password Change */}
              <div className="space-y-3 pb-5 border-b border-border">
                <h4 className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <KeyRound size={14} className="text-primary" />
                  <span>Update Password</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-8 rounded-input bg-surface-2 border border-border px-2.5 text-xs text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-muted mb-1">
                      New Password (min 8 chars)
                    </label>
                    <input
                      type="password"
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-8 rounded-input bg-surface-2 border border-border px-2.5 text-xs text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button type="submit" variant="primary" size="sm" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => logout()}>
                  Sign Out
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Data Management Tab (FR-GAP-6) */}
      {tab === 'data' && (
        <div className="rounded-card bg-surface border border-border p-5 space-y-6 shadow-calm text-xs">
          {/* Export JSON */}
          <div className="space-y-2 pb-5 border-b border-border">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Download size={15} className="text-primary" />
              <span>Data Export & Backup</span>
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Download a complete JSON export of all your tasks, subtasks, lists, and settings. You
              own your data completely.
            </p>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportData}
                icon={<Download size={13} />}
              >
                Download Data Backup (.json)
              </Button>
            </div>
          </div>

          {/* Account Deletion Danger Zone */}
          <div className="space-y-3 rounded-card border border-danger/30 bg-danger/5 p-4">
            <h4 className="text-xs font-semibold text-danger flex items-center gap-1.5">
              <AlertTriangle size={15} />
              <span>Danger Zone: Delete Account</span>
            </h4>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Permanently delete your SyncTask account, all cloud data, and local databases. This
              action is irreversible.
            </p>

            {isAuthenticated ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    To confirm, please type your email ({user?.email}):
                  </label>
                  <input
                    type="email"
                    value={deleteEmailConfirm}
                    onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                    placeholder={user?.email}
                    className="w-full max-w-sm h-8 rounded-input bg-surface border border-danger/30 px-2.5 text-xs text-text focus:outline-none focus:border-danger"
                  />
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={
                    isDeletingAccount ||
                    deleteEmailConfirm.trim().toLowerCase() !== user?.email?.toLowerCase()
                  }
                  icon={<Trash2 size={13} />}
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete My Account Permanently'}
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-text-muted italic">
                You are currently in local guest mode. Clearing your browser data will delete local
                storage.
              </p>
            )}
          </div>
        </div>
      )}

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};
