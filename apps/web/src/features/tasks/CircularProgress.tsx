import React from 'react';

interface CircularProgressProps {
  total: number;
  completed: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  total,
  completed,
  size = 28,
  strokeWidth = 3,
  showText = true,
  className = '',
}) => {
  if (total === 0) return null;

  const percentage = Math.round((completed / total) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Adaptive ring color based on completion
  const strokeColor =
    completed === total
      ? 'var(--subtask-emerald, #10b981)'
      : completed > 0
      ? 'var(--primary, #0ea5e9)'
      : 'var(--border, #cbd5e1)';

  return (
    <div
      className={`inline-flex items-center gap-1.5 select-none ${className}`}
      title={`${completed} of ${total} subtasks completed (${percentage}%)`}
    >
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg] transition-all duration-300"
          aria-hidden="true"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border/40"
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>

        {/* Center icon or mini check when complete */}
        {completed === total ? (
          <span className="absolute text-[10px] font-bold text-emerald-500">✓</span>
        ) : (
          <span className="absolute text-[9px] font-mono font-medium text-text-muted">
            {completed}
          </span>
        )}
      </div>

      {showText && (
        <span className="text-[11px] font-mono text-text-muted">
          {completed}/{total}
        </span>
      )}
    </div>
  );
};
