import React, { useState, useEffect, useMemo, useRef } from 'react';
import { addMonths, subMonths, format, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Task } from '@synctask/shared';
import { getCalendarGridDays, CalendarDayInfo } from './calendarUtils';
import { DayCell } from './DayCell';
import { DayPreview } from './DayPreview';
import { Button } from '../../components/ui/Button';

interface CalendarGridProps {
  tasks: Task[];
  initialDate?: Date;
  weekStart?: 'mon' | 'sun';
  onToggleComplete: (id: string, completed: boolean) => void;
  onOpenTask: (task: Task) => void;
  onAddTaskOnDay: (dateStr: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  tasks,
  initialDate = new Date(),
  weekStart = 'mon',
  onToggleComplete,
  onOpenTask,
  onAddTaskOnDay,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [selectedDay, setSelectedDay] = useState<CalendarDayInfo | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const weekStartsOn = weekStart === 'sun' ? 0 : 1;

  // Grid days matrix
  const days = useMemo(() => {
    return getCalendarGridDays(currentMonth, tasks, weekStartsOn);
  }, [currentMonth, tasks, weekStartsOn]);

  // Keep selected day's tasks live
  const activeSelectedDay = useMemo(() => {
    if (!selectedDay) return null;
    return days.find((d) => d.dateStr === selectedDay.dateStr) || selectedDay;
  }, [days, selectedDay]);

  // Keyboard navigation across days (arrow keys, Enter, Esc) (FR-CAL-6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDay) {
        e.preventDefault();
        setSelectedDay(null);
        return;
      }

      if (!selectedDay) return;

      const currentIndex = days.findIndex((d) => d.dateStr === selectedDay.dateStr);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowRight' && currentIndex < days.length - 1) {
        e.preventDefault();
        setSelectedDay(days[currentIndex + 1]);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        setSelectedDay(days[currentIndex - 1]);
      } else if (e.key === 'ArrowDown' && currentIndex + 7 < days.length) {
        e.preventDefault();
        setSelectedDay(days[currentIndex + 7]);
      } else if (e.key === 'ArrowUp' && currentIndex - 7 >= 0) {
        e.preventDefault();
        setSelectedDay(days[currentIndex - 7]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay, days]);

  const handleDayClick = (day: CalendarDayInfo) => {
    if (selectedDay?.dateStr === day.dateStr) {
      // Toggle close if clicking the same day (FR-CAL-6)
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth((m) => subMonths(m, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((m) => addMonths(m, 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentMonth(today);
    const todayDay = days.find((d) => d.isToday);
    if (todayDay) {
      setSelectedDay(todayDay);
    }
  };

  const dayHeaders =
    weekStartsOn === 1
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div ref={gridContainerRef} className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-text tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-input text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-input text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Priority Circles Legend (FR-CAL-3) */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-prio-high" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-prio-med" />
              <span>Med</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-prio-low" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-text-muted" />
              <span>Completed</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTodayClick}
            icon={<CalendarIcon size={13} />}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {dayHeaders.map((header) => (
          <div
            key={header}
            className="text-[11px] font-mono uppercase tracking-wider text-text-muted py-1"
          >
            {header}
          </div>
        ))}
      </div>

      {/* Month Days Grid (FR-CAL-1, FR-CAL-4) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => (
          <DayCell
            key={day.dateStr}
            day={day}
            isSelected={selectedDay?.dateStr === day.dateStr}
            isCompact={Boolean(selectedDay)}
            onClick={() => handleDayClick(day)}
          />
        ))}
      </div>

      {/* Day Dropdown Preview Panel (FR-CAL-4 to FR-CAL-7) */}
      {activeSelectedDay && (
        <DayPreview
          date={activeSelectedDay.date}
          tasks={activeSelectedDay.tasks}
          onClose={() => setSelectedDay(null)}
          onToggleComplete={onToggleComplete}
          onOpenTask={onOpenTask}
          onAddTaskOnDay={onAddTaskOnDay}
        />
      )}
    </div>
  );
};
