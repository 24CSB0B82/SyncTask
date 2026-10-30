import React from 'react';
import { SUBTASK_PALETTE, SubtaskColorKey } from '@synctask/shared';

export interface ProgressSegmentItem {
  id: string;
  done: boolean;
  color: SubtaskColorKey;
}

interface ProgressSegmentsProps {
  subtasks: ProgressSegmentItem[];
  className?: string;
}

export const ProgressSegments: React.FC<ProgressSegmentsProps> = ({ subtasks, className = '' }) => {
  if (subtasks.length === 0) return null;

  const total = subtasks.length;
  const completedCount = subtasks.filter((s) => s.done).length;

  // If more than 8 subtasks, show a continuous progress bar as per FR-SUB-4
  if (total > 8) {
    const percentage = Math.round((completedCount / total) * 100);
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-24 h-1.5 rounded-full bg-surface-2 border border-border overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-text-muted">
          {completedCount}/{total} subtasks
        </span>
      </div>
    );
  }

  // 1 to 8 segments
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {subtasks.map((subtask) => {
          const colorDef = SUBTASK_PALETTE[subtask.color] || SUBTASK_PALETTE.emerald;
          return (
            <div
              key={subtask.id}
              className={`w-4 h-1.5 rounded-sm transition-all duration-200 ${
                subtask.done ? '' : 'bg-surface-2 border border-border'
              }`}
              style={{
                backgroundColor: subtask.done
                  ? `var(--subtask-${subtask.color}, ${colorDef.light})`
                  : undefined,
              }}
            />
          );
        })}
      </div>
      <span className="text-[11px] font-mono text-text-muted">
        {completedCount}/{total} subtasks
      </span>
    </div>
  );
};
