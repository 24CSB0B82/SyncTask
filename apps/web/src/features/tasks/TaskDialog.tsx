import React, { useState, useEffect } from 'react';
import {
  PRIORITIES,
  PriorityValue,
  REMINDER_LEAD_OPTIONS,
  RECURRENCE_OPTIONS,
  RecurrenceType,
  DEFAULT_LISTS,
} from '@synctask/shared';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPriority?: PriorityValue;
  taskToEdit?: {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
    dueTime: string | null;
    priority: PriorityValue;
    tags: string[];
    listId?: string | null;
    remindBeforeMin?: number | null;
    recurrence?: RecurrenceType | null;
  } | null;
  lists?: Array<{ id: string; name: string }>;
  onSaveTask?: (data: {
    id?: string;
    title: string;
    description: string;
    dueDate: string | null;
    dueTime: string | null;
    priority: PriorityValue;
    tags: string[];
    listId?: string | null;
    remindBeforeMin?: number | null;
    recurrence?: RecurrenceType | null;
  }) => void;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onOpenChange,
  initialPriority = PRIORITIES.MEDIUM,
  taskToEdit,
  lists = [],
  onSaveTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<PriorityValue>(initialPriority);
  const [listId, setListId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [reminder, setReminder] = useState<string>('use_default');
  const [recurrence, setRecurrence] = useState<string>('none');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setDueDate(taskToEdit.dueDate || '');
      setDueTime(taskToEdit.dueTime || '');
      setPriority(taskToEdit.priority);
      setListId(taskToEdit.listId || '');
      setTags(taskToEdit.tags || []);
      setRecurrence(taskToEdit.recurrence || 'none');
      setReminder(
        taskToEdit.remindBeforeMin === null || taskToEdit.remindBeforeMin === undefined
          ? 'use_default'
          : String(taskToEdit.remindBeforeMin)
      );
    } else if (open) {
      setTitle('');
      setDescription('');
      setDueDate('');
      setDueTime('');
      setPriority(initialPriority);
      setListId('');
      setTags([]);
      setTagInput('');
      setReminder('use_default');
      setRecurrence('none');
    }
  }, [open, taskToEdit, initialPriority]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
        setTags([...tags, trimmed]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedReminder = reminder === 'use_default' ? null : Number(reminder);

    onSaveTask?.({
      id: taskToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      priority,
      tags,
      listId: listId || null,
      remindBeforeMin: parsedReminder,
      recurrence: recurrence === 'none' ? null : (recurrence as RecurrenceType),
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={taskToEdit ? 'Edit Task' : 'Create New Task'}
      description={
        taskToEdit
          ? 'Update task details, deadline, or priority.'
          : 'Add a task with deadline, priority, and reminders.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-text mb-1">
            Title <span className="text-prio-high">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            required
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-text mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add additional context or notes..."
            rows={3}
            maxLength={2000}
            className="w-full rounded-input bg-surface border border-border p-2.5 text-xs text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Dates & Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-9 rounded-input bg-surface border border-border px-3 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Due Time</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full h-9 rounded-input bg-surface border border-border px-3 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Priority Segmented Selector */}
        <div>
          <label className="block text-xs font-medium text-text mb-1.5">Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: PRIORITIES.HIGH, label: 'High', color: 'bg-prio-high' },
              { val: PRIORITIES.MEDIUM, label: 'Medium', color: 'bg-prio-med' },
              { val: PRIORITIES.LOW, label: 'Low', color: 'bg-prio-low' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => setPriority(p.val as PriorityValue)}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-input text-xs font-medium border transition-colors ${
                  priority === p.val
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-surface-2 text-text hover:bg-border/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${p.color}`} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List, Repeat & Reminder Lead Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-text mb-1">List</label>
            <Select value={listId} onChange={(e) => setListId(e.target.value)}>
              <option value="">No list</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Repeat</label>
            <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Remind Me</label>
            <Select
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              disabled={!dueDate}
            >
              {REMINDER_LEAD_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value ?? 'use_default'}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {!dueDate && (
              <span className="text-[10px] text-text-muted mt-1 block">Set a due date first</span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-text mb-1">
            Tags (press Enter or comma to add)
          </label>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tags..."
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <Chip key={tag} variant="tag" onRemove={() => handleRemoveTag(tag)}>
                  #{tag}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Save task
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
