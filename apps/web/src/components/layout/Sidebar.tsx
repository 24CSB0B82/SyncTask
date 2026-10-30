import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Settings,
  X,
} from 'lucide-react';
import { CountBadge } from '../ui/Badge';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  taskCounts?: {
    focusStream: number;
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
  };
  lists?: Array<{
    id: string;
    name: string;
    color: string;
    count: number;
  }>;
  onAddList?: () => void;
  onEditList?: (list: { id: string; name: string; color: string }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile,
  taskCounts = {
    focusStream: 0,
    today: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
  },
  lists = [],
  onAddList,
  onEditList,
}) => {
  const handleItemClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-input text-xs font-medium transition-colors ${
      isActive
        ? 'bg-surface-2 text-primary font-semibold shadow-xs'
        : 'text-text-muted hover:text-text hover:bg-surface-2/80'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full w-full bg-surface border-r border-border select-none">
      {/* Top Header on mobile drawer */}
      <div className="md:hidden flex items-center justify-between p-3.5 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-contrast shadow-xs">
            <svg
              className="w-3.5 h-3.5"
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
          <span className="font-semibold text-sm text-text">Navigation</span>
        </div>
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-input text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Focus Stream (Home) */}
        <div>
          <NavLink to="/" end className={navItemClass} onClick={handleItemClick}>
            <div className="flex items-center gap-2.5">
              <Sparkles size={15} className="text-primary" />
              <span>Focus Stream</span>
            </div>
            <CountBadge count={taskCounts.focusStream} variant="accent" />
          </NavLink>
        </div>

        {/* Triage Flow */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-mono uppercase tracking-wider text-text-muted/90">
            Triage Flow
          </div>
          <NavLink to="/today" className={navItemClass} onClick={handleItemClick}>
            <div className="flex items-center gap-2.5">
              <CalendarDays size={14} />
              <span>Today</span>
            </div>
            <CountBadge count={taskCounts.today} />
          </NavLink>
          <NavLink to="/upcoming" className={navItemClass} onClick={handleItemClick}>
            <div className="flex items-center gap-2.5">
              <Clock size={14} />
              <span>Upcoming</span>
            </div>
            <CountBadge count={taskCounts.upcoming} />
          </NavLink>
          <NavLink to="/overdue" className={navItemClass} onClick={handleItemClick}>
            <div className="flex items-center gap-2.5">
              <AlertCircle size={14} className="text-prio-high" />
              <span>Overdue</span>
            </div>
            <CountBadge count={taskCounts.overdue} variant="danger" />
          </NavLink>
          <NavLink to="/completed" className={navItemClass} onClick={handleItemClick}>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={14} />
              <span>Completed</span>
            </div>
            <CountBadge count={taskCounts.completed} />
          </NavLink>
        </div>

        {/* Collections / Lists */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 pb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted/90">
              Lists
            </span>
            <button
              onClick={() => {
                onAddList?.();
                handleItemClick();
              }}
              className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
              aria-label="Create list"
            >
              <Plus size={13} />
            </button>
          </div>
          {lists.map((list) => (
            <div key={list.id} className="group relative flex items-center w-full">
              <NavLink to={`/list/${list.id}`} className={navItemClass} onClick={handleItemClick}>
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `var(--subtask-${list.color}, var(--primary))`,
                    }}
                  />
                  <span className="truncate">{list.name}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <CountBadge count={list.count} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEditList?.(list);
                    }}
                    className="hidden group-hover:inline-flex p-1 rounded text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                    aria-label={`Edit ${list.name}`}
                  >
                    <Settings size={12} />
                  </button>
                </div>
              </NavLink>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Items */}
      <div className="p-3 border-t border-border bg-surface space-y-1">
        <NavLink to="/sync" className={navItemClass} onClick={handleItemClick}>
          <div className="flex items-center gap-2.5">
            <RefreshCw size={14} />
            <span>Sync Center</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        </NavLink>
        <NavLink to="/settings/appearance" className={navItemClass} onClick={handleItemClick}>
          <div className="flex items-center gap-2.5">
            <Settings size={14} />
            <span>Settings</span>
          </div>
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:block shrink-0 w-60 xl:w-64 h-[calc(100vh-3.5rem)] sticky top-14">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          {/* Opaque solid backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Fully solid drawer with shadow and slide animation */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl bg-surface border-r border-border animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
