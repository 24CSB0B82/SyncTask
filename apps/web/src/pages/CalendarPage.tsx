import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, PRIORITIES, PriorityValue } from '@synctask/shared';
import { useLiveTasks, useLiveSettings } from '../db/useDatabase';
import { toggleTaskComplete, createTask, updateTask } from '../db/repositories';
import { CalendarGrid } from '../features/calendar/CalendarGrid';
import { TaskDialog } from '../features/tasks/TaskDialog';
import { TaskCardData } from '../features/tasks/TaskCard';
import { useToast } from '../components/ui/Toast';
import { useLiveLists } from '../db/useDatabase';

export const CalendarPage: React.FC = () => {
  const tasks = useLiveTasks();
  const settings = useLiveSettings();
  const lists = useLiveLists();
  const { show: showToast } = useToast();
  const [searchParams] = useSearchParams();

  const initialDateStr = searchParams.get('date');
  const initialDate = initialDateStr ? new Date(initialDateStr) : new Date();

  // Dialog state for adding/editing tasks from calendar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskCardData | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);

  const handleToggleComplete = async (id: string, completed: boolean) => {
    await toggleTaskComplete(id, completed);
    showToast({
      title: completed ? 'Task completed' : 'Task marked active',
      type: 'info',
    });
  };

  const handleOpenTask = (task: Task) => {
    setTaskToEdit({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      dueLabel: '',
      completed: task.completed,
      tags: task.tags,
      subtasks: [],
    });
    setPrefilledDate(task.dueDate);
    setDialogOpen(true);
  };

  const handleAddTaskOnDay = (dateStr: string) => {
    setTaskToEdit(null);
    setPrefilledDate(dateStr);
    setDialogOpen(true);
  };

  const handleSaveTask = async (data: {
    id?: string;
    title: string;
    description: string;
    dueDate: string | null;
    dueTime: string | null;
    priority: PriorityValue;
    tags: string[];
    listId?: string | null;
  }) => {
    if (data.id) {
      await updateTask(data.id, {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        priority: data.priority,
        tags: data.tags,
        listId: data.listId ?? null,
      });
      showToast({ title: 'Task updated', type: 'success' });
    } else {
      await createTask({
        title: data.title,
        description: data.description,
        dueDate: data.dueDate || prefilledDate,
        dueTime: data.dueTime,
        priority: data.priority,
        tags: data.tags,
        listId: data.listId ?? null,
      });
      showToast({ title: 'Task scheduled', type: 'success' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text tracking-tight">Calendar</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Month grid overview with deadline indicators and interactive day preview.
        </p>
      </div>

      <div className="rounded-card bg-surface border border-border p-4 sm:p-5 shadow-calm">
        <CalendarGrid
          tasks={tasks}
          initialDate={initialDate}
          weekStart={settings?.weekStart || 'mon'}
          onToggleComplete={handleToggleComplete}
          onOpenTask={handleOpenTask}
          onAddTaskOnDay={handleAddTaskOnDay}
        />
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialPriority={PRIORITIES.MEDIUM}
        taskToEdit={taskToEdit}
        lists={lists.map((l) => ({ id: l.id, name: l.name }))}
        onSaveTask={handleSaveTask}
      />
    </div>
  );
};
