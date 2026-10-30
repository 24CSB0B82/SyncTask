import React from 'react';
import { PriorityValue, PRIORITY_LABELS, PRIORITIES } from '@synctask/shared';

export interface PriorityBadgeProps {
  priority: PriorityValue;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const colorMap = {
    [PRIORITIES.HIGH]: 'bg-prio-high',
    [PRIORITIES.MEDIUM]: 'bg-prio-med',
    [PRIORITIES.LOW]: 'bg-prio-low',
  };

  const label = PRIORITY_LABELS[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2 border border-border/50 text-text ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${colorMap[priority]}`} />
      <span>{label}</span>
    </span>
  );
};

export interface CountBadgeProps {
  count: number;
  variant?: 'neutral' | 'accent' | 'danger';
  className?: string;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-surface-2 text-text-muted border border-border/50',
    accent: 'bg-accent/15 text-accent border border-accent/30',
    danger: 'bg-prio-high/15 text-prio-high border border-prio-high/30',
  }[variant];

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-mono font-medium rounded-full ${variantStyles} ${className}`}
    >
      {count}
    </span>
  );
};
