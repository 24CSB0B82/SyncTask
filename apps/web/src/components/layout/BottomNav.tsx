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
    `flex flex-col items-center justify-center py-1.5 px-1 text-[10px] font-medium transition-colors min-h-[48px] flex-1 active:scale-95 ${
      isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface/98 backdrop-blur-md border-t border-border flex items-center justify-around h-16 px-1 safe-area-pb select-none shadow-calm">
      {/* Tab 1: Tasks */}
      <NavLink to="/" end className={navItemClass}>
        <div className="h-5 flex items-center justify-center">
          <CheckSquare size={19} />
        </div>
        <span className="h-3.5 flex items-center justify-center leading-none text-[10px] tracking-tight">
          Tasks
        </span>
      </NavLink>

      {/* Tab 2: Calendar */}
      <NavLink to="/calendar" className={navItemClass}>
        <div className="h-5 flex items-center justify-center">
          <Calendar size={19} />
        </div>
        <span className="h-3.5 flex items-center justify-center leading-none text-[10px] tracking-tight">
          Calendar
        </span>
      </NavLink>

      {/* Center Tab: Primary Action Button */}
      <div className="flex items-center justify-center px-1">
        <button
          onClick={onNewTask}
          aria-label="Create new task"
          className="w-12 h-12 -mt-5 rounded-full bg-primary text-primary-contrast flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Tab 4: Sync & Alerts (Mathematically locked height and baseline) */}
      <NavLink to="/sync" className={navItemClass}>
        <div className="relative h-5 flex items-center justify-center">
          <Bell size={19} />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-prio-high text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
              {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
            </span>
          )}
        </div>
        <span className="h-3.5 flex items-center justify-center leading-none whitespace-nowrap text-[9px] sm:text-[10px] tracking-tight">
          Sync & Alerts
        </span>
      </NavLink>

      {/* Tab 5: Menu */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation menu"
        className="flex flex-col items-center justify-center py-1.5 px-1 text-[10px] font-medium text-text-muted hover:text-text min-h-[48px] flex-1 active:scale-95"
      >
        <div className="h-5 flex items-center justify-center">
          <Menu size={19} />
        </div>
        <span className="h-3.5 flex items-center justify-center leading-none text-[10px] tracking-tight">
          Menu
        </span>
      </button>
    </nav>
  );
};
