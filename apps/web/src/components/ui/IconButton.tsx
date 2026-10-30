import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'secondary' | 'outline' | 'primary';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', variant = 'ghost', className = '', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-7 h-7 text-xs',
      md: 'w-8 h-8 text-sm',
      lg: 'w-10 h-10 text-base',
    }[size];

    const variantClasses = {
      ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-surface-2',
      secondary: 'bg-surface-2 text-text border border-border hover:bg-border/30',
      outline: 'bg-transparent text-text border border-border hover:bg-surface-2',
      primary: 'bg-primary text-primary-contrast hover:opacity-90',
    }[variant];

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-input transition-colors duration-150 select-none focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
