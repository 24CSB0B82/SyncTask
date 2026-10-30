import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', icon, className = '', children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none select-none rounded-input focus-visible:outline-2 focus-visible:outline-primary';

    const sizeClasses = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-3.5 py-2 gap-2 h-9',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
    }[size];

    const variantClasses = {
      primary:
        'bg-primary text-primary-contrast hover:opacity-90 shadow-sm active:translate-y-[0.5px]',
      secondary:
        'bg-surface-2 text-text border border-border hover:bg-border/40 active:translate-y-[0.5px]',
      outline:
        'bg-transparent text-text border border-border hover:bg-surface-2 active:translate-y-[0.5px]',
      ghost:
        'bg-transparent text-text-muted hover:text-text hover:bg-surface-2 active:translate-y-[0.5px]',
      danger: 'bg-prio-high text-white hover:opacity-90 shadow-sm active:translate-y-[0.5px]',
    }[variant];

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
