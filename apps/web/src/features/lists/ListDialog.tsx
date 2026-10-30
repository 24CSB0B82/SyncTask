import React, { useState, useEffect } from 'react';
import { SUBTASK_PALETTE_ORDER, SUBTASK_PALETTE } from '@synctask/shared';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface ListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listToEdit?: { id: string; name: string; color: string } | null;
  onSave: (data: { name: string; color: string }) => void;
  onDelete?: (id: string) => void;
}

export const ListDialog: React.FC<ListDialogProps> = ({
  open,
  onOpenChange,
  listToEdit,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>('sky');

  useEffect(() => {
    if (listToEdit) {
      setName(listToEdit.name);
      setColor(listToEdit.color);
    } else {
      setName('');
      setColor('sky');
    }
  }, [listToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={listToEdit ? 'Edit List' : 'Create New List'}
      description="Organize your tasks into color-coded collections."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text mb-1">
            List Name <span className="text-prio-high">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint 12, Personal, Shopping"
            maxLength={50}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text mb-2">Color Accent</label>
          <div className="grid grid-cols-4 gap-2">
            {SUBTASK_PALETTE_ORDER.map((palKey) => {
              const pal = SUBTASK_PALETTE[palKey];
              const isSelected = color === palKey;
              return (
                <button
                  key={palKey}
                  type="button"
                  onClick={() => setColor(palKey)}
                  className={`flex items-center gap-2 p-2 rounded-input border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border bg-surface-2 hover:bg-surface'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: `var(--subtask-${palKey}, ${pal.light})` }}
                  />
                  <span className="text-xs text-text capitalize">{pal.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          {listToEdit && onDelete ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(listToEdit.id);
                onOpenChange(false);
              }}
            >
              Delete list
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {listToEdit ? 'Save changes' : 'Create list'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
