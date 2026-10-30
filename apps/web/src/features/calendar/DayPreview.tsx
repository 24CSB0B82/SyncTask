import React from 'react';
import { format } from 'date-fns';
import { X, Plus, Clock } from 'lucide-react';
import { Task, PRIORITIES, PriorityValue } from '@synctask/shared';
import { Checkbox } from '../../components/ui/Checkbox';
import { Button } from '../../components/ui/Button';

interface DayPreviewProps {
  date: Date;
  tasks: Task[];
  onClose: () => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onOpenTask: (task: Task) => void;
  onAddTaskOnDay: (dateStr: string) => void;
}

export const DayPreview: React.FC<DayPreviewProps> = ({
  date,
  tasks,
  onClose,
  onToggleComplete,
  onOpenTask,
  onAddTaskOnDay,
}) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const headingText = `${format(date, 'EEEE, MMM d')} · ${tasks.length} ${
    tasks.length === 1 ? 'task' : 'tasks'
  }`;

  const getPriorityDot = (p: PriorityValue) => {
    if (p === PRIORITIES.HIGH) return 'bg-prio-high';
    if (p === PRIORITIES.MEDIUM) return 'bg-prio-med';
    return 'bg-prio-low';
  };

  return (
    <div
      role="region"
      aria-label="Day task preview"
      className="mt-4 rounded-card bg-surface border border-border shadow-popover p-4 sm:p-5 transition-all duration-200 animate-in fade-in-0 slide-in-from-top-2 max-h-[40vh] sm:max-h-[350px] overflow-y-auto"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <div>
          <h3 className="text-sm font-semibold text-text">{headingText}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Click any task to edit details or check the box to complete.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => onAddTaskOnDay(dateStr)}
          >
            Add task on this day
          </Button>

          <button
            onClick={onClose}
            className="p-1 rounded-input text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Compact List (FR-CAL-5) */}
      {tasks.length > 0 ? (
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onOpenTask(task)}
              className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-input bg-surface-2/60 border border-border/70 hover:border-primary/40 hover:bg-surface-2 transition-colors cursor-pointer select-none text-xs ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              {/* Left: Checkbox & Time */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Checkbox
                  checked={task.completed}
                  onChange={(checked) => onToggleComplete(task.id, checked)}
                  aria-label={`Toggle ${task.title}`}
                />

                <span className="font-mono text-[11px] text-text-muted shrink-0 w-14">
                  {task.dueTime ? task.dueTime : 'All day'}
                </span>

                <span
                  className={`font-medium text-text truncate ${
                    task.completed ? 'line-through text-text-muted' : ''
                  }`}
                >
                  {task.title}
                </span>
              </div>

              {/* Right: Priority dot */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${getPriorityDot(task.priority)}`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-text-muted">
          No tasks scheduled for this day.{' '}
          <button
            type="button"
            onClick={() => onAddTaskOnDay(dateStr)}
            className="text-primary hover:underline font-medium ml-1"
          >
            + Add a task
          </button>
        </div>
      )}
    </div>
  );
};
