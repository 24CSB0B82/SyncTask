import React from 'react';
import { Filter, ArrowUpDown, ArrowDown, ArrowUp, ChevronDown, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../../components/ui/DropdownMenu';

export interface FilterRowProps {
  selectedPriority?: string | null;
  onSelectPriority?: (prio: string | null) => void;
  selectedTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
  sortBy?: 'urgency' | 'dueDate' | 'createdAt' | 'priority';
  onSortChange?: (sort: 'urgency' | 'dueDate' | 'createdAt' | 'priority') => void;
  sortAsc?: boolean;
  onToggleSortDirection?: () => void;
}

const SORT_LABELS: Record<'urgency' | 'dueDate' | 'createdAt' | 'priority', string> = {
  urgency: 'Urgency',
  dueDate: 'Due Date',
  priority: 'Priority',
  createdAt: 'Created',
};

export const FilterRow: React.FC<FilterRowProps> = ({
  selectedPriority = null,
  onSelectPriority,
  sortBy = 'urgency',
  onSortChange,
  sortAsc = false,
  onToggleSortDirection,
}) => {
  const getFilterLabel = () => {
    switch (selectedPriority) {
      case 'high':
        return (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-prio-high shrink-0" />
            <span>High</span>
          </span>
        );
      case 'med':
        return (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-prio-med shrink-0" />
            <span>Medium</span>
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-prio-low shrink-0" />
            <span>Low</span>
          </span>
        );
      default:
        return <span>All</span>;
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-border text-xs select-none">
      {/* Left: Filter Dropdown */}
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-input border transition-colors ${
                selectedPriority
                  ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                  : 'bg-surface border-border text-text hover:bg-surface-2 font-medium'
              }`}
              aria-label="Filter tasks by priority"
            >
              <Filter size={13} className={selectedPriority ? 'text-primary' : 'text-text-muted'} />
              <span className="text-[11px] font-mono text-text-muted hidden sm:inline">
                Filter:
              </span>
              <span className="text-xs">{getFilterLabel()}</span>
              <ChevronDown size={12} className="text-text-muted ml-0.5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onSelectPriority?.(null)}
              className="flex items-center justify-between"
            >
              <span>All Priorities</span>
              {selectedPriority === null && <Check size={14} className="text-primary font-bold" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onSelectPriority?.('high')}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-prio-high" />
                <span>High Priority</span>
              </div>
              {selectedPriority === 'high' && (
                <Check size={14} className="text-primary font-bold" />
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onSelectPriority?.('med')}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-prio-med" />
                <span>Medium Priority</span>
              </div>
              {selectedPriority === 'med' && <Check size={14} className="text-primary font-bold" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onSelectPriority?.('low')}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-prio-low" />
                <span>Low Priority</span>
              </div>
              {selectedPriority === 'low' && <Check size={14} className="text-primary font-bold" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick clear button if a priority filter is active */}
        {selectedPriority && (
          <button
            type="button"
            onClick={() => onSelectPriority?.(null)}
            className="h-8 w-8 rounded-input bg-surface-2 border border-border text-text-muted hover:text-text flex items-center justify-center transition-colors"
            title="Clear priority filter"
            aria-label="Clear priority filter"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Right: Sort Dropdown & Direction Toggle */}
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-input bg-surface border border-border text-text font-medium hover:bg-surface-2 transition-colors"
              aria-label="Sort tasks options"
            >
              <ArrowUpDown size={13} className="text-text-muted" />
              <span className="text-[11px] font-mono text-text-muted hidden sm:inline">Sort:</span>
              <span className="text-xs">{SORT_LABELS[sortBy]}</span>
              <ChevronDown size={12} className="text-text-muted ml-0.5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Sort Tasks By</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {(['urgency', 'dueDate', 'priority', 'createdAt'] as const).map((field) => (
              <DropdownMenuItem
                key={field}
                onClick={() => onSortChange?.(field)}
                className="flex items-center justify-between"
              >
                <span>{SORT_LABELS[field]}</span>
                {sortBy === field && <Check size={14} className="text-primary font-bold" />}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onToggleSortDirection?.()}
              className="flex items-center justify-between text-text-muted hover:text-text"
            >
              <span>Direction: {sortAsc ? 'Ascending' : 'Descending'}</span>
              {sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick 1-click direction flip button */}
        <button
          type="button"
          onClick={() => onToggleSortDirection?.()}
          className="h-8 w-8 rounded-input bg-surface border border-border text-text hover:bg-surface-2 flex items-center justify-center transition-colors"
          title={`Order: ${sortAsc ? 'Ascending (click for descending)' : 'Descending (click for ascending)'}`}
          aria-label="Toggle sort order direction"
        >
          {sortAsc ? (
            <ArrowUp size={13} className="text-primary" />
          ) : (
            <ArrowDown size={13} className="text-text-muted" />
          )}
        </button>
      </div>
    </div>
  );
};
