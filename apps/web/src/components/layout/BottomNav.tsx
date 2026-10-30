import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckSquare, Calendar, Plus, Bell, Menu } from 'lucide-react';

interface BottomNavProps {
  onOpenMenu: () => void;
  onNewTask: () => void;
  unreadAlertsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenMenu,
  onNewTask,
  unreadAlertsCount = 0,
}) => {
  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 py-1 px-3 text-[10px] font-medium transition-colors min-h-[48px] flex-1 active:scale-95 ${
      isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around h-16 px-1 safe-area-pb select-none">
      <NavLink to="/" end className={navItemClass}>
        <CheckSquare size={19} />
        <span>Tasks</span>
      </NavLink>

      <NavLink to="/calendar" className={navItemClass}>
        <Calendar size={19} />
        <span>Calendar</span>
      </NavLink>

      {/* Prominent Center "New Task" Button (48x48px touch target) */}
      <div className="flex items-center justify-center px-1">
        <button
          onClick={onNewTask}
          aria-label="Create new task"
          className="w-12 h-12 -mt-4 rounded-full bg-primary text-primary-contrast flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      <NavLink to="/sync" className={navItemClass}>
        <div className="relative">
          <Bell size={19} />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-prio-high" />
          )}
        </div>
        <span>Sync & Alerts</span>
      </NavLink>

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation menu"
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-[10px] font-medium text-text-muted hover:text-text min-h-[48px] flex-1 active:scale-95"
      >
        <Menu size={19} />
        <span>Menu</span>
      </button>
    </nav>
  );
};
