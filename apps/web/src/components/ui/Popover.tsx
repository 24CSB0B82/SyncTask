import React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  open,
  onOpenChange,
  align = 'center',
  sideOffset = 6,
}) => {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          className="z-50 rounded-card bg-surface p-3 text-text shadow-popover border border-border outline-none animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
