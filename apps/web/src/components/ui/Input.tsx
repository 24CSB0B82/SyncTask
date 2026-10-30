import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-text-muted pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full h-9 rounded-input bg-surface border border-border px-3 text-sm text-text placeholder:text-text-muted/60 transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-surface-2 ${
            icon ? 'pl-9' : ''
          } ${rightElement ? 'pr-9' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2.5 text-text-muted flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
