import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths, isSameDay, addDays } from 'date-fns';
import { Clock, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { PRIORITIES, PriorityValue } from '@synctask/shared';
import { useLiveTasks } from '../../db/useDatabase';
import { toggleTaskComplete } from '../../db/repositories';
import { getCalendarGridDays } from '../../features/calendar/calendarUtils';
import { Checkbox } from '../ui/Checkbox';

interface RightPanelProps {
  isOpenSlideOver?: boolean;
  onCloseSlideOver?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  isOpenSlideOver = false,
  onCloseSlideOver,
}) => {
  const navigate = useNavigate();
  const tasks = useLiveTasks();
  const [miniMonth, setMiniMonth] = useState<Date>(new Date());

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  // Mini calendar grid days
  const miniDays = useMemo(() => {
    return getCalendarGridDays(miniMonth, tasks, 1);
  }, [miniMonth, tasks]);

  // Today's tasks (active and completed)
  const todayTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate === todayStr && !t.deletedAt)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (!a.dueTime && !b.dueTime) return 0;
        if (!a.dueTime) return -1;
        if (!b.dueTime) return 1;
        return a.dueTime.localeCompare(b.dueTime);
      });
  }, [tasks, todayStr]);

  // Tomorrow's tasks
  const tomorrowTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate === tomorrowStr && !t.deletedAt && !t.completed)
      .sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || ''));
  }, [tasks, tomorrowStr]);

  // Next active deadline
  const nextDeadlineTask = useMemo(() => {
    const activeDated = tasks
      .filter((t) => !t.completed && !t.deletedAt && t.dueDate)
      .map((t) => {
        const timePart = t.dueTime || '23:59';
        return {
          task: t,
          deadlineStr: `${t.dueDate}T${timePart}`,
        };
      })
      .sort((a, b) => a.deadlineStr.localeCompare(b.deadlineStr));

    return activeDated[0]?.task || null;
  }, [tasks]);

  const handleMiniDayClick = (dateStr: string) => {
    navigate(`/calendar?date=${dateStr}`);
    onCloseSlideOver?.();
  };

  const getPriorityColor = (p: PriorityValue) => {
    if (p === PRIORITIES.HIGH) return 'bg-prio-high';
    if (p === PRIORITIES.MEDIUM) return 'bg-prio-med';
    return 'bg-prio-low';
  };

  const panelContent = (
    <div className="flex flex-col h-full bg-surface-2/40 border-l border-border w-80 xl:w-[340px] select-none text-xs">
      {/* Header if in slide-over mode */}
      <div className="xl:hidden flex items-center justify-between p-3 border-b border-border">
        <span className="font-semibold text-sm">Agenda & Calendar</span>
        <button
          onClick={onCloseSlideOver}
          className="p-1 rounded text-text-muted hover:text-text"
          aria-label="Close agenda"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Compact Mini Calendar (FR-CAL-8) */}
        <div className="rounded-card bg-surface p-3 border border-border shadow-calm">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="font-semibold text-text font-mono">
              {format(miniMonth, 'MMMM yyyy')}
            </span>
            <div className="flex items-center gap-1 text-text-muted">
              <button
                onClick={() => setMiniMonth((m) => subMonths(m, 1))}
                className="p-1 hover:text-text rounded hover:bg-surface-2"
                aria-label="Previous month"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setMiniMonth((m) => addMonths(m, 1))}
                className="p-1 hover:text-text rounded hover:bg-surface-2"
                aria-label="Next month"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px]">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className="text-text-muted py-0.5">
                {d}
              </span>
            ))}
            {miniDays.map((day) => (
              <div
                key={day.dateStr}
                onClick={() => handleMiniDayClick(day.dateStr)}
                className={`py-1 rounded flex flex-col items-center justify-center relative cursor-pointer hover:bg-surface-2 transition-colors ${
                  !day.isCurrentMonth ? 'opacity-30 text-text-muted' : 'text-text'
                } ${
                  day.isToday
                    ? 'bg-primary text-primary-contrast font-semibold hover:bg-primary/90'
                    : ''
                }`}
              >
                <span>{day.dayNumber}</span>
                {day.circles.length > 0 && !day.isToday && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-0.5 ${getPriorityColor(
                      day.circles[0].priority
                    )}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Next Deadline Banner */}
        {nextDeadlineTask ? (
          <div className="rounded-card bg-surface p-3 border border-border/80 shadow-calm space-y-2">
            <div className="flex items-center justify-between text-prio-med font-medium">
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                <span>Next Deadline</span>
              </div>
              <span className="font-mono text-[11px]">
                {nextDeadlineTask.dueTime || nextDeadlineTask.dueDate}
              </span>
            </div>
            <p className="text-xs text-text font-medium leading-snug line-clamp-2">
              {nextDeadlineTask.title}
            </p>
            <div className="text-[11px] text-text-muted flex items-center justify-between">
              <span>
                {nextDeadlineTask.dueDate === todayStr
                  ? 'Due today'
                  : `Due ${nextDeadlineTask.dueDate}`}
              </span>
              <span className="font-mono text-accent">● Active</span>
            </div>
          </div>
        ) : (
          <div className="rounded-card bg-surface p-3 border border-border text-center text-xs text-text-muted">
            No upcoming deadlines
          </div>
        )}

        {/* Today's Agenda */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text uppercase text-[11px] font-mono tracking-wider">
              Today's Agenda
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {todayTasks.length > 0 ? (
            <div className="space-y-1.5">
              {todayTasks.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-input bg-surface p-2.5 border border-border flex items-center justify-between gap-2 transition-opacity ${
                    t.completed ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Checkbox
                      checked={t.completed}
                      onChange={(checked) => toggleTaskComplete(t.id, checked)}
                      aria-label={`Toggle ${t.title}`}
                    />
                    <span
                      className={`font-medium truncate text-text ${
                        t.completed ? 'line-through text-text-muted' : ''
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-text-muted shrink-0">
                    {t.completed ? 'Done' : t.dueTime || 'All day'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-input bg-surface border border-dashed border-border text-center text-[11px] text-text-muted">
              No tasks scheduled today
            </div>
          )}
        </div>

        {/* Scheduled Tomorrow */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
            Scheduled Tomorrow
          </div>
          {tomorrowTasks.length > 0 ? (
            <div className="space-y-1.5">
              {tomorrowTasks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-input bg-surface p-2.5 border border-border flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(t.priority)}`}
                    />
                    <span className="font-medium truncate text-text">{t.title}</span>
                  </div>
                  <span className="font-mono text-[11px] text-text-muted shrink-0">
                    {t.dueTime || 'All day'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-input bg-surface border border-dashed border-border text-center text-[11px] text-text-muted">
              Nothing scheduled tomorrow
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static panel */}
      <aside className="hidden xl:block shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
        {panelContent}
      </aside>

      {/* Slide-over for tablet (1024px - 1279px) */}
      {isOpenSlideOver && (
        <div className="fixed inset-0 z-50 xl:hidden flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseSlideOver} />
          <div className="relative z-10 w-80 max-w-[85vw] h-full shadow-popover">
            {panelContent}
          </div>
        </div>
      )}
    </>
  );
};
