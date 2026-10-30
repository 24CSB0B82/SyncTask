import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckSquare, Calendar, Plus, Bell, Menu } from 'lucide-react';

interface BottomNavProps {
  onOpenMenu: () => void;
  onNewTask: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMenu, onNewTask }) => {
  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 py-1 px-3 text-[10px] font-medium transition-colors ${
      isActive ? 'text-primary' : 'text-text-muted hover:text-text'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around h-14 px-2 safe-area-pb">
      <NavLink to="/" end className={navItemClass}>
        <CheckSquare size={18} />
        <span>Tasks</span>
      </NavLink>

      <NavLink to="/calendar" className={navItemClass}>
        <Calendar size={18} />
        <span>Calendar</span>
      </NavLink>

      {/* Prominent Center "New" Button */}
      <button
        onClick={onNewTask}
        aria-label="Create new task"
        className="w-10 h-10 -mt-3 rounded-full bg-primary text-primary-contrast flex items-center justify-center shadow-md active:scale-95 transition-transform"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        onClick={() => {}}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-[10px] font-medium text-text-muted hover:text-text"
      >
        <div className="relative">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-prio-high" />
        </div>
        <span>Alerts</span>
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-[10px] font-medium text-text-muted hover:text-text"
      >
        <Menu size={18} />
        <span>Menu</span>
      </button>
    </nav>
  );
};
