import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string; // hex color or custom var
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  color,
  disabled = false,
  'aria-label': ariaLabel,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  const defaultBorderColor = 'var(--border)';
  const activeColor = color || 'var(--primary)';

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center justify-center w-4 h-4 rounded transition-all duration-150 cursor-pointer select-none shrink-0 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'
      } ${className}`}
      style={{
        backgroundColor: checked ? activeColor : 'transparent',
        borderColor: checked ? activeColor : defaultBorderColor,
        borderWidth: '1.5px',
        borderStyle: 'solid',
      }}
    >
      {checked && (
        <Check
          size={12}
          strokeWidth={3}
          className="text-white drop-shadow-sm transition-transform"
        />
      )}
    </div>
  );
};
