import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-150" />
        <DialogPrimitive.Content
          className={`fixed left-[50%] top-[50%] z-50 w-full ${maxWidth} translate-x-[-50%] translate-y-[-50%] rounded-card bg-surface p-6 shadow-popover border border-border duration-150 focus:outline-none`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold text-text">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-xs text-text-muted mt-0.5">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <button
                className="text-text-muted hover:text-text p-1 rounded-input hover:bg-surface-2 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </DialogPrimitive.Close>
          </div>
          <div>{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
