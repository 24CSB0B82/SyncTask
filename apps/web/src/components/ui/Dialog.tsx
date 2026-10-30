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
          className={`fixed z-50 w-full bg-surface shadow-popover border border-border duration-200 focus:outline-none ${maxWidth} 
            /* Mobile: Native Bottom Sheet */
            max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 
            max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[88vh] max-sm:overflow-y-auto max-sm:p-5 safe-area-pb 
            max-sm:animate-in max-sm:slide-in-from-bottom
            /* Desktop: Centered Modal Dialog */
            sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-card sm:p-6 
            sm:animate-in sm:zoom-in-95`}
        >
          {/* Mobile Drag Handle */}
          <div className="w-10 h-1.5 rounded-full bg-border/80 mx-auto mb-3 sm:hidden" />

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
