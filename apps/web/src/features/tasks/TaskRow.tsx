import React from 'react';
import { PriorityValue, SubtaskColorKey } from '@synctask/shared';
import { Checkbox } from '../../components/ui/Checkbox';
import { Chip } from '../../components/ui/Chip';
import { PriorityBadge } from '../../components/ui/Badge';
import { CircularProgress } from './CircularProgress';
import { Edit2, Trash2 } from 'lucide-react';
import { TaskCardData } from './TaskCard';

interface TaskRowProps {
  task: TaskCardData;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (task: TaskCardData) => void;
  onDelete: (id: string) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, onToggleComplete, onEdit, onDelete }) => {
  return (
    <div
      onClick={() => onEdit(task)}
      className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-input bg-surface border border-border hover:border-primary/40 transition-colors cursor-pointer select-none ${
        task.isOverdue && !task.completed ? 'border-l-4 border-l-prio-high' : ''
      } ${task.completed ? 'opacity-60' : ''}`}
    >
      {/* Left: Checkbox, Priority dot, Title, Subtasks count */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Checkbox
          checked={task.completed}
          onChange={(checked) => onToggleComplete(task.id, checked)}
          aria-label={`Toggle ${task.title}`}
        />
        <PriorityBadge priority={task.priority} />
        <span
          className={`text-xs font-medium text-text truncate ${
            task.completed ? 'line-through text-text-muted' : ''
          }`}
        >
          {task.title}
        </span>
        {task.subtasks.length > 0 && (
          <CircularProgress
            total={task.subtasks.length}
            completed={task.subtasks.filter((s) => s.done).length}
            size={18}
            strokeWidth={2}
            showText={true}
            className="shrink-0 ml-1"
          />
        )}
      </div>

      {/* Right: Tags, Due Chip, Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1">
          {task.tags.map((tag) => (
            <Chip key={tag} variant="tag">
              #{tag}
            </Chip>
          ))}
        </div>

        {task.dueLabel && (
          <Chip variant={task.isOverdue && !task.completed ? 'overdue' : 'due'}>
            {task.dueLabel}
          </Chip>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-2"
            aria-label="Edit task"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 rounded text-prio-high hover:bg-prio-high/10"
            aria-label="Delete task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
