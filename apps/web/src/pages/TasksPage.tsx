import React, { useState, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Plus, CheckCircle2, Inbox, Calendar, AlertCircle } from 'lucide-react';
import { PRIORITIES, PriorityValue, SubtaskColorKey, Task } from '@synctask/shared';
import { useLiveTasks, useLiveSubtasks, useLiveLists } from '../db/useDatabase';
import {
  createTask,
  updateTask,
  toggleTaskComplete,
  deleteTask,
  restoreTask,
  updateSubtask,
  createSubtask,
  deleteSubtask,
} from '../db/repositories';
import { filterTasks, SmartViewType } from '../features/tasks/filters';
import { sortTasks, SortField } from '../features/tasks/urgency';
import { formatDueChip } from '../lib/dates';
import { FilterRow } from '../features/tasks/FilterRow';
import { TaskCard, TaskCardData } from '../features/tasks/TaskCard';
import { KanbanBoard } from '../features/kanban/KanbanBoard';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Celebration } from '../components/ui/Celebration';

interface TasksPageProps {
  onQuickAdd?: (priority: PriorityValue) => void;
  onEditTask?: (task: TaskCardData) => void;
  activeStatusTab?: 'all' | 'active' | 'completed';
  currentView?: 'cards' | 'board' | 'calendar';
  searchQuery?: string;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  onQuickAdd,
  onEditTask,
  activeStatusTab = 'active',
  currentView = 'cards',
  searchQuery = '',
}) => {
  const { listId } = useParams<{ listId: string }>();
  const location = useLocation();
  const { show: showToast } = useToast();
  const [celebrate, setCelebrate] = useState(false);

  // Live Dexie subscriptions
  const rawTasks = useLiveTasks();
  const rawSubtasks = useLiveSubtasks();
  const lists = useLiveLists();

  // Local filter & sort state
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('urgency');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination for Completed view (batches of 50 per NFR-8)
  const [completedLimit, setCompletedLimit] = useState<number>(50);

  // Quick inline add input per group
  const [quickAddPrio, setQuickAddPrio] = useState<PriorityValue | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // Determine current Smart View based on pathname
  const smartView: SmartViewType = useMemo(() => {
    const path = location.pathname;
    if (path === '/today') return 'today';
    if (path === '/upcoming') return 'upcoming';
    if (path === '/overdue') return 'overdue';
    if (path === '/completed') return 'completed';
    if (path.startsWith('/list/')) return 'list';
    return 'focus';
  }, [location.pathname]);

  const currentList = useMemo(() => {
    if (smartView === 'list' && listId) {
      return lists.find((l) => l.id === listId);
    }
    return null;
  }, [smartView, listId, lists]);

  // Priority filter mapping
  const priorityFilterValue: PriorityValue | null = useMemo(() => {
    if (selectedPriority === 'high') return PRIORITIES.HIGH;
    if (selectedPriority === 'med') return PRIORITIES.MEDIUM;
    if (selectedPriority === 'low') return PRIORITIES.LOW;
    return null;
  }, [selectedPriority]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return filterTasks(
      rawTasks,
      rawSubtasks,
      {
        statusTab: smartView === 'completed' ? 'completed' : activeStatusTab,
        smartView,
        listId,
        priority: priorityFilterValue,
        tag: selectedTag,
        searchQuery,
      },
      new Date()
    );
  }, [
    rawTasks,
    rawSubtasks,
    smartView,
    activeStatusTab,
    listId,
    priorityFilterValue,
    selectedTag,
    searchQuery,
  ]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return sortTasks(filteredTasks, sortBy, sortAsc, new Date());
  }, [filteredTasks, sortBy, sortAsc]);

  // Map Task entities to TaskCardData for rendering
  const mappedTasks: TaskCardData[] = useMemo(() => {
    return sortedTasks.map((task) => {
      const chip = formatDueChip(task.dueDate, task.dueTime, task.completed, new Date());
      const taskSubtasks = rawSubtasks
        .filter((s) => s.taskId === task.id && !s.deletedAt)
        .sort((a, b) => a.position - b.position)
        .map((s) => ({
          id: s.id,
          title: s.title,
          done: s.done,
          color: s.color,
        }));

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        dueLabel: chip?.text || '',
        isOverdue: chip?.isOverdue ?? false,
        completed: task.completed,
        tags: task.tags,
        reminderSet: task.remindBeforeMin !== null && task.remindBeforeMin !== -1,
        remindBeforeMin: task.remindBeforeMin,
        listId: task.listId,
        recurrence: task.recurrence,
        subtasks: taskSubtasks,
      };
    });
  }, [sortedTasks, rawSubtasks]);

  // Handlers for task interactions
  const handleToggleComplete = async (id: string, completed: boolean) => {
    const task = rawTasks.find((t) => t.id === id);
    const remainingActive = mappedTasks.filter((t) => !t.completed && t.id !== id);

    await toggleTaskComplete(id, completed);

    if (completed && task) {
      if (remainingActive.length === 0 && mappedTasks.length > 0) {
        setCelebrate(true);
      }

      showToast({
        title: 'Task marked completed',
        description: `"${task.title}" moved to completed.`,
        durationMs: 6000,
        action: {
          label: 'Undo',
          onClick: async () => {
            await toggleTaskComplete(id, false);
          },
        },
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const task = rawTasks.find((t) => t.id === id);
    await deleteTask(id);

    if (task) {
      showToast({
        title: 'Task deleted',
        durationMs: 6000,
        action: {
          label: 'Undo',
          onClick: async () => {
            await restoreTask(id);
          },
        },
      });
    }
  };

  const handleUpdatePriority = async (id: string, priority: 0 | 1 | 2) => {
    await updateTask(id, { priority });
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, done: boolean) => {
    await updateSubtask(subtaskId, { done });

    // Check if all subtasks are now done
    const currentTaskSubtasks = rawSubtasks.filter((s) => s.taskId === taskId && !s.deletedAt);
    const willAllBeDone = currentTaskSubtasks.every((s) => (s.id === subtaskId ? done : s.done));

    const task = rawTasks.find((t) => t.id === taskId);
    if (willAllBeDone && task && !task.completed) {
      showToast({
        title: 'All subtasks done',
        description: `Mark "${task.title}" complete?`,
        durationMs: 6000,
        action: {
          label: 'Complete task',
          variant: 'primary',
          onClick: async () => {
            await toggleTaskComplete(taskId, true);
          },
        },
      });
    }
  };

  const handleSubtaskColorChange = async (
    _taskId: string,
    subtaskId: string,
    color: SubtaskColorKey
  ) => {
    await updateSubtask(subtaskId, { color });
  };

  const handleRenameSubtask = async (_taskId: string, subtaskId: string, title: string) => {
    await updateSubtask(subtaskId, { title });
  };

  const handleDeleteSubtask = async (_taskId: string, subtaskId: string) => {
    await deleteSubtask(subtaskId);
  };

  const handleAddSubtaskInline = async (taskId: string, title: string) => {
    await createSubtask({ taskId, title });
  };

  const handleAddSubtask = async (taskId: string) => {
    const title = window.prompt('Enter subtask title:');
    if (title && title.trim()) {
      await createSubtask({ taskId, title: title.trim() });
    }
  };

  const handleQuickAddSubmit = async (priority: PriorityValue) => {
    if (!quickAddTitle.trim()) return;
    await createTask({
      title: quickAddTitle.trim(),
      priority,
      listId: smartView === 'list' ? listId : null,
      dueDate: smartView === 'today' ? new Date().toISOString().slice(0, 10) : null,
    });
    setQuickAddTitle('');
    setQuickAddPrio(null);
  };

  // View headings and descriptions
  const headerMeta = useMemo(() => {
    if (smartView === 'today') {
      return {
        title: 'Today',
        subtitle: "Tasks scheduled for today's deadline schedule.",
        icon: Calendar,
      };
    }
    if (smartView === 'upcoming') {
      return {
        title: 'Upcoming',
        subtitle: 'Tasks scheduled over the next 7 days.',
        icon: Calendar,
      };
    }
    if (smartView === 'overdue') {
      return {
        title: 'Overdue',
        subtitle: 'Tasks whose scheduled deadlines have passed.',
        icon: AlertCircle,
      };
    }
    if (smartView === 'completed') {
      return {
        title: 'Completed',
        subtitle: 'All completed tasks and achievements.',
        icon: CheckCircle2,
      };
    }
    if (smartView === 'list' && currentList) {
      return {
        title: currentList.name,
        subtitle: `Tasks organized in collection "${currentList.name}".`,
        icon: Inbox,
      };
    }
    return {
      title: 'Focus Stream',
      subtitle: 'All active priority tasks sorted by urgency and upcoming deadlines.',
      icon: Inbox,
    };
  }, [smartView, currentList]);

  // Priority groupings for Cards view
  const highTasks = mappedTasks.filter((t) => t.priority === PRIORITIES.HIGH);
  const medTasks = mappedTasks.filter((t) => t.priority === PRIORITIES.MEDIUM);
  const lowTasks = mappedTasks.filter((t) => t.priority === PRIORITIES.LOW);

  const renderPriorityGroup = (
    title: string,
    colorClass: string,
    groupTasks: TaskCardData[],
    priorityVal: PriorityValue
  ) => {
    const isAdding = quickAddPrio === priorityVal;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${colorClass}`} />
            <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-text">
              {title}
            </h2>
            <span className="text-[11px] font-mono text-text-muted px-1.5 py-0.2 rounded-full bg-surface-2 border border-border/50">
              {groupTasks.length} {groupTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setQuickAddPrio(isAdding ? null : priorityVal);
              setQuickAddTitle('');
            }}
            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text font-medium px-2 py-1 rounded hover:bg-surface-2 transition-colors"
          >
            <Plus size={13} />
            <span>Add card</span>
          </button>
        </div>

        {/* Quick Add Inline Form (FR-TASK-4) */}
        {isAdding && (
          <div className="p-3 rounded-card bg-surface border border-primary/50 shadow-sm animate-in fade-in-0 duration-150">
            <input
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickAddSubmit(priorityVal);
                } else if (e.key === 'Escape') {
                  setQuickAddPrio(null);
                }
              }}
              placeholder={`Quick add ${title.toLowerCase()} (press Enter)...`}
              autoFocus
              maxLength={200}
              className="w-full text-xs bg-transparent text-text placeholder:text-text-muted focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setQuickAddPrio(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleQuickAddSubmit(priorityVal)}>
                Add
              </Button>
            </div>
          </div>
        )}

        {groupTasks.length > 0 ? (
          <div className="space-y-3">
            {groupTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={() => onEditTask?.(task)}
                onDelete={handleDeleteTask}
                onToggleSubtask={handleToggleSubtask}
                onSubtaskColorChange={handleSubtaskColorChange}
                onRenameSubtask={handleRenameSubtask}
                onDeleteSubtask={handleDeleteSubtask}
                onAddSubtaskInline={handleAddSubtaskInline}
                onAddSubtask={handleAddSubtask}
              />
            ))}
          </div>
        ) : (
          !isAdding && (
            <div className="p-4 rounded-card border border-dashed border-border/70 text-center text-xs text-text-muted">
              No active {title.toLowerCase()}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-xl font-bold text-text tracking-tight">{headerMeta.title}</h1>
        <p className="text-xs text-text-muted mt-0.5">{headerMeta.subtitle}</p>
      </div>

      {/* Filter & Sort Controls */}
      <FilterRow
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortAsc={sortAsc}
        onToggleSortDirection={() => setSortAsc((prev) => !prev)}
      />

      {/* Main Content: Cards view vs List view */}
      {mappedTasks.length === 0 ? (
        <div className="rounded-card bg-surface border border-border p-8 text-center space-y-3 shadow-calm">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <headerMeta.icon size={20} />
          </div>
          <h3 className="text-sm font-semibold text-text">No tasks found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No tasks matched your search "${searchQuery}". Try a different keyword.`
              : 'Your task list is clear! Press "C" or click New Task to create one.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onQuickAdd?.(PRIORITIES.MEDIUM)}
            className="mt-2"
          >
            Create a task
          </Button>
        </div>
      ) : currentView === 'board' ? (
        <KanbanBoard
          tasks={mappedTasks}
          onToggleComplete={handleToggleComplete}
          onUpdatePriority={handleUpdatePriority}
          onEditTask={(task) => onEditTask?.(task)}
          onDeleteTask={handleDeleteTask}
          onQuickAdd={(lane) =>
            onQuickAdd?.(lane === 'inprogress' ? PRIORITIES.HIGH : PRIORITIES.MEDIUM)
          }
        />
      ) : (
        /* Cards View (Grouped by Priority) */
        <div className="space-y-8">
          {renderPriorityGroup('High Priority', 'bg-prio-high', highTasks, PRIORITIES.HIGH)}
          {renderPriorityGroup('Medium Priority', 'bg-prio-med', medTasks, PRIORITIES.MEDIUM)}
          {renderPriorityGroup('Low Priority', 'bg-prio-low', lowTasks, PRIORITIES.LOW)}
        </div>
      )}

      <Celebration active={celebrate} onComplete={() => setCelebrate(false)} />
    </div>
  );
};

export const FocusStreamPage = TasksPage;
