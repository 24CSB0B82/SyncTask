import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'filter' | 'tag' | 'due' | 'overdue';
  active?: boolean;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export const Chip: React.FC<ChipProps> = ({
  variant = 'default',
  active = false,
  onRemove,
  size = 'sm',
  className = '',
  children,
  ...props
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  let variantStyle = 'bg-surface-2 text-text-muted border border-border/70';

  if (variant === 'filter') {
    variantStyle = active
      ? 'bg-primary/10 text-primary border border-primary/30 font-medium'
      : 'bg-surface text-text-muted border border-border hover:text-text hover:bg-surface-2 cursor-pointer';
  } else if (variant === 'tag') {
    variantStyle = 'bg-surface-2/80 text-text-muted border border-border/50 font-mono text-[11px]';
  } else if (variant === 'due') {
    variantStyle = 'bg-surface-2 text-text-muted font-mono text-[11px] border border-border/50';
  } else if (variant === 'overdue') {
    variantStyle =
      'bg-prio-high/10 text-prio-high font-mono text-[11px] border border-prio-high/30 font-medium';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full select-none transition-colors duration-150 ${sizeClasses} ${variantStyle} ${className}`}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 focus:outline-none ml-0.5"
          aria-label="Remove"
        >
          &times;
        </button>
      )}
    </div>
  );
};
