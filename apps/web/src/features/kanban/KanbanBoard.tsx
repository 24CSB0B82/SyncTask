import React, { useState } from 'react';
import { PRIORITIES } from '@synctask/shared';
import { TaskCard, TaskCardData } from '../tasks/TaskCard';
import { CountBadge } from '../../components/ui/Badge';
import { Plus, ArrowRight, ArrowLeft, CheckCircle2, Clock, ListTodo } from 'lucide-react';

export type KanbanLaneId = 'todo' | 'inprogress' | 'done';

interface KanbanBoardProps {
  tasks: TaskCardData[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onUpdatePriority: (id: string, priority: 0 | 1 | 2) => void;
  onEditTask: (task: TaskCardData) => void;
  onDeleteTask: (id: string) => void;
  onQuickAdd?: (lane: KanbanLaneId) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onToggleComplete,
  onUpdatePriority,
  onEditTask,
  onDeleteTask,
  onQuickAdd,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverLane, setDragOverLane] = useState<KanbanLaneId | null>(null);

  // Classify tasks into the 3 Kanban lanes:
  // - 'done': task.completed === true
  // - 'inprogress': !completed && (priority === 2 || task.isOverdue || dueToday)
  // - 'todo': !completed && priority < 2
  const todoTasks = tasks.filter((t) => !t.completed && t.priority < PRIORITIES.HIGH);
  const inProgressTasks = tasks.filter((t) => !t.completed && t.priority === PRIORITIES.HIGH);
  const doneTasks = tasks.filter((t) => t.completed);

  const lanes: Array<{
    id: KanbanLaneId;
    title: string;
    icon: React.ReactNode;
    color: string;
    tasks: TaskCardData[];
  }> = [
    {
      id: 'todo',
      title: 'To Do',
      icon: <ListTodo size={14} className="text-text-muted" />,
      color: 'border-t-primary/70',
      tasks: todoTasks,
    },
    {
      id: 'inprogress',
      title: 'In Progress / Urgent',
      icon: <Clock size={14} className="text-prio-high" />,
      color: 'border-t-prio-high',
      tasks: inProgressTasks,
    },
    {
      id: 'done',
      title: 'Done',
      icon: <CheckCircle2 size={14} className="text-emerald-500" />,
      color: 'border-t-emerald-500',
      tasks: doneTasks,
    },
  ];

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, laneId: KanbanLaneId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLane !== laneId) {
      setDragOverLane(laneId);
    }
  };

  const handleDragLeave = () => {
    setDragOverLane(null);
  };

  const handleDrop = (e: React.DragEvent, targetLane: KanbanLaneId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverLane(null);
    setDraggedTaskId(null);

    if (!taskId) return;

    if (targetLane === 'done') {
      onToggleComplete(taskId, true);
    } else if (targetLane === 'inprogress') {
      onToggleComplete(taskId, false);
      onUpdatePriority(taskId, PRIORITIES.HIGH);
    } else if (targetLane === 'todo') {
      onToggleComplete(taskId, false);
      onUpdatePriority(taskId, PRIORITIES.MEDIUM);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 overflow-x-auto min-h-[500px]">
      {lanes.map((lane) => (
        <div
          key={lane.id}
          onDragOver={(e) => handleDragOver(e, lane.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, lane.id)}
          className={`flex flex-col rounded-card bg-surface-2/40 border border-border border-t-2 ${
            lane.color
          } p-3 transition-colors ${
            dragOverLane === lane.id ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30' : ''
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              {lane.icon}
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text">
                {lane.title}
              </h2>
              <CountBadge count={lane.tasks.length} />
            </div>

            {onQuickAdd && lane.id !== 'done' && (
              <button
                type="button"
                onClick={() => onQuickAdd(lane.id)}
                aria-label={`Add task to ${lane.title}`}
                className="p-1 rounded text-text-muted hover:text-text hover:bg-surface transition-colors"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          {/* Cards Column */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-14rem)] pr-0.5">
            {lane.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted/60 border border-dashed border-border/60 rounded-card">
                <span className="text-xs">No tasks in this lane</span>
              </div>
            ) : (
              lane.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="cursor-grab active:cursor-grabbing transition-transform"
                >
                  <TaskCard
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />

                  {/* Quick Kanban Lane Shift Shortcuts */}
                  <div className="flex items-center justify-end gap-1 mt-1 px-1 text-[10px] text-text-muted select-none">
                    {lane.id !== 'todo' && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleComplete(task.id, false);
                          onUpdatePriority(task.id, PRIORITIES.MEDIUM);
                        }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface border border-border/50 hover:border-primary/40 text-text-muted hover:text-text transition-colors"
                        title="Move to To Do"
                      >
                        <ArrowLeft size={10} />
                        <span>To Do</span>
                      </button>
                    )}
                    {lane.id !== 'inprogress' && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleComplete(task.id, false);
                          onUpdatePriority(task.id, PRIORITIES.HIGH);
                        }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface border border-border/50 hover:border-primary/40 text-text-muted hover:text-text transition-colors"
                        title="Move to In Progress"
                      >
                        <span>Focus</span>
                        <ArrowRight size={10} />
                      </button>
                    )}
                    {lane.id !== 'done' && (
                      <button
                        type="button"
                        onClick={() => onToggleComplete(task.id, true)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface border border-border/50 hover:border-emerald-500/40 text-text-muted hover:text-emerald-500 transition-colors"
                        title="Move to Done"
                      >
                        <span>Done</span>
                        <CheckCircle2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

