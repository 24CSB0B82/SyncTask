import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center w-full">
        <select
          ref={ref}
          className={`w-full h-9 appearance-none rounded-input bg-surface border border-border px-3 pr-8 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-surface-2 ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 text-text-muted pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
