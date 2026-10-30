import React, { useState } from 'react';
import { Bell, MoreHorizontal, Plus, Edit2, Trash2, Repeat } from 'lucide-react';
import { PriorityValue, SubtaskColorKey, RecurrenceType } from '@synctask/shared';
import { PriorityBadge } from '../../components/ui/Badge';
import { Checkbox } from '../../components/ui/Checkbox';
import { Chip } from '../../components/ui/Chip';
import { ProgressSegments } from './ProgressSegments';
import { CircularProgress } from './CircularProgress';
import { SubtaskTree, SubtaskItem } from '../subtasks/SubtaskTree';

export interface TaskCardData {
  id: string;
  title: string;
  description: string;
  priority: PriorityValue;
  dueDate: string | null;
  dueTime: string | null;
  dueLabel: string;
  isOverdue?: boolean;
  completed: boolean;
  tags: string[];
  reminderSet?: boolean;
  remindBeforeMin?: number | null;
  listId?: string | null;
  recurrence?: RecurrenceType | null;
  subtasks: SubtaskItem[];
}

interface TaskCardProps {
  task: TaskCardData;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onEdit?: (task: TaskCardData) => void;
  onDelete?: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string, done: boolean) => void;
  onSubtaskColorChange?: (taskId: string, subtaskId: string, color: SubtaskColorKey) => void;
  onRenameSubtask?: (taskId: string, subtaskId: string, title: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  onAddSubtaskInline?: (taskId: string, title: string) => void;
  onAddSubtask?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onToggleSubtask,
  onSubtaskColorChange,
  onRenameSubtask,
  onDeleteSubtask,
  onAddSubtaskInline,
  onAddSubtask,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleCardClick = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group rounded-card bg-surface border border-border p-4 shadow-calm transition-all duration-150 cursor-pointer select-none hover:border-primary/40 ${
        task.isOverdue && !task.completed ? 'border-l-4 border-l-prio-high' : ''
      } ${task.completed ? 'opacity-65' : ''}`}
    >
      {/* Row 1: Priority Badge, Due Chip, Checkbox */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={task.completed}
            onChange={(checked) => onToggleComplete?.(task.id, checked)}
            aria-label={`Mark "${task.title}" as complete`}
          />
          <PriorityBadge priority={task.priority} />
        </div>

        <div className="flex items-center gap-2">
          {task.subtasks.length > 0 && (
            <CircularProgress
              total={task.subtasks.length}
              completed={task.subtasks.filter((s) => s.done).length}
              size={22}
              strokeWidth={2.5}
              showText={false}
            />
          )}
          {task.reminderSet && (
            <span title="Reminder scheduled" className="text-text-muted">
              <Bell size={13} />
            </span>
          )}
          {task.recurrence && task.recurrence !== 'none' && (
            <span title={`Repeats: ${task.recurrence}`} className="text-text-muted">
              <Repeat size={13} />
            </span>
          )}
          {task.dueLabel && (
            <Chip variant={task.isOverdue && !task.completed ? 'overdue' : 'due'}>
              {task.dueLabel}
            </Chip>
          )}

          {/* Mobile & Hover Action Shortcuts */}
          <div
            className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onEdit?.(task)}
              aria-label="Edit task"
              className="p-1 rounded text-text-muted hover:text-text active:bg-surface-2"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(task.id)}
              aria-label="Delete task"
              className="p-1 rounded text-text-muted hover:text-prio-high active:bg-prio-high/10"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Title */}
      <h3
        className={`text-sm font-semibold text-text leading-snug transition-colors ${
          task.completed ? 'line-through text-text-muted' : ''
        }`}
      >
        {task.title}
      </h3>

      {/* Row 3: Description (Clamped when collapsed, full when expanded) */}
      {task.description && (
        <p
          className={`text-xs text-text-muted mt-1 leading-relaxed ${
            expanded ? '' : 'line-clamp-1'
          }`}
        >
          {task.description}
        </p>
      )}

      {/* Subtask Tree & Expansion Actions */}
      {expanded && (
        <div
          className="mt-2 animate-in fade-in-0 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <SubtaskTree
            subtasks={task.subtasks}
            onToggleSubtask={(subId, done) => onToggleSubtask?.(task.id, subId, done)}
            onChangeColor={(subId, color) => onSubtaskColorChange?.(task.id, subId, color)}
            onRenameSubtask={(subId, newTitle) => onRenameSubtask?.(task.id, subId, newTitle)}
            onDeleteSubtask={(subId) => onDeleteSubtask?.(task.id, subId)}
            onAddSubtaskInline={(title) => onAddSubtaskInline?.(task.id, title)}
          />

          {/* Expanded Card Actions */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/50 text-xs">
            <button
              type="button"
              onClick={() => onAddSubtask?.(task.id)}
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              <Plus size={13} />
              <span>Add subtask</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit?.(task)}
                className="inline-flex items-center gap-1 text-text-muted hover:text-text px-2 py-1 rounded hover:bg-surface-2 transition-colors"
              >
                <Edit2 size={12} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(task.id)}
                className="inline-flex items-center gap-1 text-prio-high hover:opacity-80 px-2 py-1 rounded hover:bg-prio-high/10 transition-colors"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Footer: Segmented Progress & Tags */}
      <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-border/50">
        <ProgressSegments subtasks={task.subtasks} />

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {task.tags.map((tag) => (
            <Chip key={tag} variant="tag">
              #{tag}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
};
