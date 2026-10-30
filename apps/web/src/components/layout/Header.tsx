import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Plus,
  Moon,
  Sun,
  LayoutGrid,
  Columns3,
  Calendar as CalendarIcon,
  Menu,
  PanelRight,
  RefreshCw,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useThemeStore } from '../../lib/theme';
import { IconButton } from '../ui/IconButton';
import type { Notification, Task } from '@synctask/shared';
import { BellDropdown } from '../../features/notifications/BellDropdown';
import { useSyncEngine } from '../../features/sync/engine';
import { useSession } from '../../features/auth/useSession';
import { AuthModal } from '../../features/auth/AuthModal';

interface HeaderProps {
  onOpenSidebar?: () => void;
  onOpenRightPanel?: () => void;
  onNewTask?: () => void;
  activeStatusTab?: 'all' | 'active' | 'completed';
  onStatusTabChange?: (tab: 'all' | 'active' | 'completed') => void;
  currentView?: 'cards' | 'board' | 'calendar';
  onViewChange?: (view: 'cards' | 'board' | 'calendar') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  notifications?: Notification[];
  tasks?: Task[];
  onOpenTask?: (taskId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenRightPanel,
  onNewTask,
  activeStatusTab = 'active',
  onStatusTabChange,
  currentView = 'cards',
  onViewChange,
  searchQuery = '',
  onSearchChange,
  notifications = [],
  tasks = [],
  onOpenTask,
}) => {
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const { status, pendingCount } = useSyncEngine();
  const { user, isAuthenticated, logout } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Focus search box on Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCalendarRoute = location.pathname.startsWith('/calendar');

  const getSyncBadge = () => {
    if (status === 'syncing') {
      return (
        <span className="flex items-center gap-1.5 text-[11px] text-warn">
          <RefreshCw size={11} className="animate-spin text-warn" />
          <span>Syncing...</span>
        </span>
      );
    }
    if (status === 'offline') {
      return (
        <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Offline</span>
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span className="flex items-center gap-1.5 text-[11px] text-danger">
          <span className="w-1.5 h-1.5 rounded-full bg-danger" />
          <span>Sync error</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        <span>Synced</span>
        {pendingCount > 0 && <span className="text-warn">({pendingCount})</span>}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-surface/90 backdrop-blur-md border-b border-border px-3 sm:px-5 flex items-center justify-between gap-3">
      {/* Left: Mobile Menu, Logo & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Open sidebar menu"
          onClick={onOpenSidebar}
          className="md:hidden"
        >
          <Menu size={18} />
        </IconButton>

        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-text tracking-tight hover:opacity-90"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-contrast shadow-sm">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-base font-semibold">SyncTask</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-surface-2 text-text-muted border border-border/50">
            HQ
          </span>
        </Link>

        {/* Global Search Box (⌘K) */}
        <div className="hidden lg:flex items-center relative w-56 xl:w-64">
          <Search size={14} className="absolute left-3 text-text-muted pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="w-full h-8 pl-8 pr-12 text-xs rounded-input bg-surface-2 border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <kbd className="absolute right-2 px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface rounded border border-border pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Center: Status Tabs (All / Active / Completed) */}
      <div className="hidden md:flex items-center bg-surface-2 p-0.5 rounded-input border border-border text-xs">
        {(['all', 'active', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onStatusTabChange?.(tab)}
            className={`px-3 py-1 rounded-[8px] font-medium transition-colors capitalize ${
              activeStatusTab === tab
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {tab === 'all' ? 'All Issues' : tab}
          </button>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Sync Status Pill */}
        <Link
          to="/sync"
          aria-label="View sync center"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 text-text border border-border hover:border-accent/40 text-xs font-mono transition-colors"
        >
          {getSyncBadge()}
        </Link>

        {/* View Switcher: Cards / Board / Calendar */}
        {!isCalendarRoute && (
          <div className="hidden sm:flex items-center bg-surface-2 p-0.5 rounded-input border border-border text-xs">
            <button
              onClick={() => onViewChange?.('cards')}
              aria-label="Cards view"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[8px] font-medium transition-colors ${
                currentView === 'cards'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <LayoutGrid size={13} />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              onClick={() => onViewChange?.('board')}
              aria-label="Kanban board view"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[8px] font-medium transition-colors ${
                currentView === 'board'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Columns3 size={13} />
              <span className="hidden md:inline">Board</span>
            </button>
            <Link
              to="/calendar"
              aria-label="Calendar view"
              className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] font-medium text-text-muted hover:text-text transition-colors"
            >
              <CalendarIcon size={13} />
              <span className="hidden md:inline">Calendar</span>
            </Link>
          </div>
        )}

        {/* New Task Button (with 'C' shortcut) */}
        <button
          onClick={onNewTask}
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-input bg-primary text-primary-contrast font-medium text-xs hover:opacity-90 shadow-sm transition-all active:translate-y-[0.5px]"
        >
          <Plus size={14} />
          <span>New Task</span>
          <kbd className="px-1 py-0.2 text-[10px] font-mono bg-black/15 rounded text-white/90">
            C
          </kbd>
        </button>

        {/* Theme Toggle (Moon <-> Sun) */}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggleTheme}
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={16} className="text-warn" />
          ) : (
            <Moon size={16} className="text-text-muted" />
          )}
        </IconButton>

        {/* Notification Bell */}
        <BellDropdown notifications={notifications} tasks={tasks} onOpenTask={onOpenTask} />

        {/* Agenda slide-over toggle for 1024px - 1279px */}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Toggle agenda panel"
          onClick={onOpenRightPanel}
          className="hidden lg:inline-flex xl:hidden"
        >
          <PanelRight size={16} />
        </IconButton>

        {/* Avatar / Sign In */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-1.5">
            <Link
              to="/settings/profile"
              aria-label={`Profile: ${user.username}`}
              title={`${user.username} (${user.email}) - View Profile`}
              className="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center text-xs font-semibold hover:border-primary transition-colors shrink-0 overflow-hidden"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </Link>
            <button
              onClick={() => logout()}
              aria-label="Log out"
              title="Log out and return to Demo Mode"
              className="hidden sm:inline-flex items-center gap-1 h-7 px-2 rounded-full bg-surface-2 hover:bg-surface-3 text-[11px] font-medium text-text-muted hover:text-text border border-border transition-colors"
            >
              <LogOut size={11} />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            aria-label="Sign in"
            className="hidden sm:inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-surface-2 border border-border text-xs font-medium text-text hover:border-primary/50 transition-colors shrink-0"
          >
            <LogIn size={12} className="text-text-muted" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </header>
  );
};
