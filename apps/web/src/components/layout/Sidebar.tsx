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
  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3 py-1.5 rounded-input text-xs font-medium transition-colors ${
      isActive
        ? 'bg-surface text-primary shadow-sm font-semibold'
        : 'text-text-muted hover:text-text hover:bg-surface/50'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-2/60 border-r border-border w-60 xl:w-64 select-none">
      {/* Top Header on mobile drawer */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-border">
        <span className="font-semibold text-sm">Navigation</span>
        <button
          onClick={onCloseMobile}
          className="p-1 rounded text-text-muted hover:text-text"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Focus Stream (Home) */}
        <div>
          <NavLink to="/" end className={navItemClass}>
            <div className="flex items-center gap-2.5">
              <Sparkles size={15} className="text-primary" />
              <span>Focus Stream</span>
            </div>
            <CountBadge count={taskCounts.focusStream} variant="accent" />
          </NavLink>
        </div>

        {/* Triage Flow */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-mono uppercase tracking-wider text-text-muted/80">
            Triage Flow
          </div>
          <NavLink to="/today" className={navItemClass}>
            <div className="flex items-center gap-2.5">
              <CalendarDays size={14} />
              <span>Today</span>
            </div>
            <CountBadge count={taskCounts.today} />
          </NavLink>
          <NavLink to="/upcoming" className={navItemClass}>
            <div className="flex items-center gap-2.5">
              <Clock size={14} />
              <span>Upcoming</span>
            </div>
            <CountBadge count={taskCounts.upcoming} />
          </NavLink>
          <NavLink to="/overdue" className={navItemClass}>
            <div className="flex items-center gap-2.5">
              <AlertCircle size={14} className="text-prio-high" />
              <span>Overdue</span>
            </div>
            <CountBadge count={taskCounts.overdue} variant="danger" />
          </NavLink>
          <NavLink to="/completed" className={navItemClass}>
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
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted/80">
              Lists
            </span>
            <button
              onClick={onAddList}
              className="p-0.5 rounded text-text-muted hover:text-text hover:bg-surface transition-colors"
              aria-label="Create list"
            >
              <Plus size={13} />
            </button>
          </div>
          {lists.map((list) => (
            <div key={list.id} className="group relative flex items-center">
              <NavLink to={`/list/${list.id}`} className={navItemClass}>
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: `var(--subtask-${list.color}, var(--primary))`,
                    }}
                  />
                  <span className="truncate">{list.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-text-muted group-hover:hidden">
                    {list.count}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEditList?.(list);
                    }}
                    className="hidden group-hover:inline-block p-0.5 rounded text-text-muted hover:text-text hover:bg-surface-2"
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
      <div className="p-3 border-t border-border space-y-1">
        <NavLink to="/sync" className={navItemClass}>
          <div className="flex items-center gap-2.5">
            <RefreshCw size={14} />
            <span>Sync Center</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        </NavLink>
        <NavLink to="/settings/appearance" className={navItemClass}>
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
      <aside className="hidden md:block shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10 w-72 max-w-[80vw] h-full shadow-popover">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
