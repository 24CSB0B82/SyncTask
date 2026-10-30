import React, { useState } from 'react';
import { SUBTASK_PALETTE, SubtaskColorKey, SUBTASK_PALETTE_ORDER } from '@synctask/shared';
import { Checkbox } from '../../components/ui/Checkbox';
import { Popover } from '../../components/ui/Popover';
import { X, Edit2, Check, Plus } from 'lucide-react';

export interface SubtaskItem {
  id: string;
  title: string;
  done: boolean;
  color: SubtaskColorKey;
}

interface SubtaskTreeProps {
  subtasks: SubtaskItem[];
  onToggleSubtask?: (id: string, done: boolean) => void;
  onChangeColor?: (id: string, color: SubtaskColorKey) => void;
  onRenameSubtask?: (id: string, newTitle: string) => void;
  onDeleteSubtask?: (id: string) => void;
  onAddSubtaskInline?: (title: string) => void;
}

export const SubtaskTree: React.FC<SubtaskTreeProps> = ({
  subtasks,
  onToggleSubtask,
  onChangeColor,
  onRenameSubtask,
  onDeleteSubtask,
  onAddSubtaskInline,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const startRename = (subtask: SubtaskItem) => {
    setEditingId(subtask.id);
    setEditTitle(subtask.title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSubtask?.(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleInlineAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      onAddSubtaskInline?.(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAddingInline(false);
    }
  };

  return (
    <div className="pt-3 pb-1 border-t border-border/60 mt-3 space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted/70">
          Subtask Tree Structure
        </span>
        {!isAddingInline && onAddSubtaskInline && (
          <button
            type="button"
            onClick={() => setIsAddingInline(true)}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
          >
            <Plus size={11} />
            <span>Add row</span>
          </button>
        )}
      </div>

      <div className="relative pl-1">
        {subtasks.map((subtask, index) => {
          const isLast = index === subtasks.length - 1 && !isAddingInline;
          const colorDef = SUBTASK_PALETTE[subtask.color] || SUBTASK_PALETTE.emerald;
          const colorVar = `var(--subtask-${subtask.color}, ${colorDef.light})`;
          const isEditing = editingId === subtask.id;

          return (
            <div key={subtask.id} className="relative flex items-center group py-1">
              {/* CSS Tree Line Connector (|__) */}
              <div
                className="absolute left-2.5 pointer-events-none border-l border-border"
                style={{
                  top: 0,
                  bottom: isLast ? '50%' : 0,
                  width: '1px',
                }}
              />
              <div
                className="absolute left-2.5 top-1/2 pointer-events-none border-b border-border"
                style={{
                  width: '14px',
                }}
              />

              {/* Subtask Row Content */}
              <div className="flex items-center gap-2.5 pl-8 w-full">
                <Checkbox
                  checked={subtask.done}
                  onChange={(checked) => onToggleSubtask?.(subtask.id, checked)}
                  color={colorVar}
                  aria-label={`Toggle ${subtask.title}`}
                />

                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(subtask.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 text-xs px-2 py-0.5 rounded-input bg-surface border border-primary text-text focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => saveRename(subtask.id)}
                      className="p-1 text-primary hover:bg-surface-2 rounded"
                      aria-label="Save title"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-text-muted hover:bg-surface-2 rounded"
                      aria-label="Cancel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <span
                    onDoubleClick={() => startRename(subtask)}
                    className={`text-xs transition-colors select-none flex-1 truncate ${
                      subtask.done ? 'line-through text-text-muted' : 'text-text'
                    }`}
                  >
                    {subtask.title}
                  </span>
                )}

                {/* Subtask Action Buttons on Hover */}
                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startRename(subtask)}
                      className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-2"
                      aria-label="Rename subtask"
                    >
                      <Edit2 size={11} />
                    </button>

                    {onDeleteSubtask && (
                      <button
                        type="button"
                        onClick={() => onDeleteSubtask(subtask.id)}
                        className="p-1 rounded text-text-muted hover:text-prio-high hover:bg-surface-2"
                        aria-label="Delete subtask"
                      >
                        <X size={11} />
                      </button>
                    )}

                    {/* Subtask Color Swatch Popover */}
                    <Popover
                      align="end"
                      trigger={
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-surface-2"
                          aria-label="Change subtask color"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full block border border-border"
                            style={{ backgroundColor: colorVar }}
                          />
                        </button>
                      }
                    >
                      <div className="p-1 space-y-1">
                        <div className="text-[10px] font-mono text-text-muted uppercase">
                          Subtask Colour
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {SUBTASK_PALETTE_ORDER.map((paletteKey) => {
                            const pal = SUBTASK_PALETTE[paletteKey];
                            return (
                              <button
                                key={paletteKey}
                                type="button"
                                onClick={() => onChangeColor?.(subtask.id, paletteKey)}
                                title={pal.name}
                                className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${
                                  subtask.color === paletteKey
                                    ? 'border-text ring-1 ring-text'
                                    : 'border-border'
                                }`}
                                style={{
                                  backgroundColor: `var(--subtask-${paletteKey}, ${pal.light})`,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Inline Add Row */}
        {isAddingInline && (
          <form onSubmit={handleInlineAdd} className="relative flex items-center py-1">
            <div
              className="absolute left-2.5 pointer-events-none border-l border-border"
              style={{
                top: 0,
                bottom: '50%',
                width: '1px',
              }}
            />
            <div
              className="absolute left-2.5 top-1/2 pointer-events-none border-b border-border"
              style={{
                width: '14px',
              }}
            />
            <div className="flex items-center gap-2 pl-8 w-full">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="New subtask title (press Enter)..."
                autoFocus
                className="flex-1 text-xs px-2.5 py-1 rounded-input bg-surface border border-primary text-text placeholder:text-text-muted focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 text-xs bg-primary text-primary-contrast rounded-input font-medium"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingInline(false)}
                className="p-1 text-text-muted hover:text-text rounded"
              >
                <X size={13} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
