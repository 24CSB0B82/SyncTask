import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PRIORITIES, PriorityValue } from '@synctask/shared';
import { AppLayout } from './components/layout/AppLayout';
import { TasksPage } from './pages/TasksPage';
import { TaskDialog } from './features/tasks/TaskDialog';
import { TaskCardData } from './features/tasks/TaskCard';
import { useToast } from './components/ui/Toast';
import { createTask, updateTask } from './db/repositories';
import { useLiveLists } from './db/useDatabase';

const CalendarPage = React.lazy(() =>
  import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage }))
);
const SyncCenterPage = React.lazy(() =>
  import('./pages/SyncCenterPage').then((m) => ({ default: m.SyncCenterPage }))
);
const SettingsPage = React.lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const ResetPasswordPage = React.lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

export const AppRoutes: React.FC = () => {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskCardData | null>(null);
  const [initialPriority, setInitialPriority] = useState<PriorityValue>(PRIORITIES.MEDIUM);

  // Status Tab: All | Active | Completed
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'active' | 'completed'>('active');

  // View Preference (Cards vs List) remembered per device (FR-ORG-6)
  const [currentView, setCurrentView] = useState<'cards' | 'list' | 'calendar'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('st-view');
      if (saved === 'list' || saved === 'cards') return saved;
    }
    return 'cards';
  });

  const handleViewChange = (view: 'cards' | 'list' | 'calendar') => {
    setCurrentView(view);
    if (typeof localStorage !== 'undefined' && view !== 'calendar') {
      localStorage.setItem('st-view', view);
    }
  };

  // Search query with 150ms debounce (FR-ORG-5)
  const [rawSearchInput, setRawSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(rawSearchInput);
    }, 150);
    return () => clearTimeout(timer);
  }, [rawSearchInput]);

  const lists = useLiveLists();
  const { show: showToast } = useToast();

  // Global Keyboard Shortcut: 'C' opens new task dialog (FR-TASK-1, FR-TASK-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (!isInput && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setTaskToEdit(null);
        setInitialPriority(PRIORITIES.MEDIUM);
        setTaskDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickAdd = (priority: PriorityValue) => {
    setTaskToEdit(null);
    setInitialPriority(priority);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: TaskCardData) => {
    setTaskToEdit(task);
    setTaskDialogOpen(true);
  };

  const handleSaveTask = async (taskData: {
    id?: string;
    title: string;
    description: string;
    dueDate: string | null;
    dueTime: string | null;
    priority: PriorityValue;
    tags: string[];
    listId?: string | null;
    remindBeforeMin?: number | null;
  }) => {
    if (taskData.id) {
      // Edit task
      await updateTask(taskData.id, {
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        priority: taskData.priority,
        tags: taskData.tags,
        listId: taskData.listId ?? null,
        remindBeforeMin: taskData.remindBeforeMin ?? null,
      });
      showToast({
        title: 'Task updated',
        type: 'success',
      });
    } else {
      // Create new task
      await createTask({
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        priority: taskData.priority,
        tags: taskData.tags,
        listId: taskData.listId ?? null,
        remindBeforeMin: taskData.remindBeforeMin ?? null,
      });
      showToast({
        title: 'Task created',
        type: 'success',
      });
    }
  };

  const tasksPageElement = (
    <TasksPage
      onQuickAdd={handleQuickAdd}
      onEditTask={handleEditTask}
      activeStatusTab={activeStatusTab}
      currentView={currentView}
      searchQuery={debouncedSearch}
    />
  );

  return (
    <>
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-bg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        }
      >
        <Routes>
          <Route
            element={
              <AppLayout
                onNewTask={() => {
                  setTaskToEdit(null);
                  setInitialPriority(PRIORITIES.MEDIUM);
                  setTaskDialogOpen(true);
                }}
                activeStatusTab={activeStatusTab}
                onStatusTabChange={setActiveStatusTab}
                currentView={currentView}
                onViewChange={handleViewChange}
                searchQuery={rawSearchInput}
                onSearchChange={setRawSearchInput}
              />
            }
          >
            <Route path="/" element={tasksPageElement} />
            <Route path="/today" element={tasksPageElement} />
            <Route path="/upcoming" element={tasksPageElement} />
            <Route path="/overdue" element={tasksPageElement} />
            <Route path="/completed" element={tasksPageElement} />
            <Route path="/list/:listId" element={tasksPageElement} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/sync" element={<SyncCenterPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:tab" element={<SettingsPage />} />
          </Route>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </React.Suspense>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        initialPriority={initialPriority}
        taskToEdit={taskToEdit}
        lists={lists.map((l) => ({ id: l.id, name: l.name }))}
        onSaveTask={handleSaveTask}
      />
    </>
  );
};
