import React from 'react';
import { ArrowDownUp, Filter, Tag } from 'lucide-react';
import { Chip } from '../../components/ui/Chip';

interface FilterRowProps {
  selectedPriority?: string | null;
  onSelectPriority?: (prio: string | null) => void;
  selectedTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
  sortBy?: 'urgency' | 'dueDate' | 'createdAt' | 'priority';
  onSortChange?: (sort: 'urgency' | 'dueDate' | 'createdAt' | 'priority') => void;
  sortAsc?: boolean;
  onToggleSortDirection?: () => void;
}

export const FilterRow: React.FC<FilterRowProps> = ({
  selectedPriority = null,
  onSelectPriority,
  selectedTag = null,
  onSelectTag,
  sortBy = 'urgency',
  onSortChange,
  sortAsc = false,
  onToggleSortDirection,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 mb-4 border-b border-border text-xs select-none">
      {/* Left: Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-text-muted mr-1 font-medium">
          <Filter size={13} />
          <span>Filters:</span>
        </div>

        {/* Priority quick filters */}
        <Chip
          variant="filter"
          active={selectedPriority === null}
          onClick={() => onSelectPriority?.(null)}
        >
          All
        </Chip>
        <Chip
          variant="filter"
          active={selectedPriority === 'high'}
          onClick={() => onSelectPriority?.(selectedPriority === 'high' ? null : 'high')}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-prio-high" />
          High
        </Chip>
        <Chip
          variant="filter"
          active={selectedPriority === 'med'}
          onClick={() => onSelectPriority?.(selectedPriority === 'med' ? null : 'med')}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-prio-med" />
          Medium
        </Chip>
        <Chip
          variant="filter"
          active={selectedPriority === 'low'}
          onClick={() => onSelectPriority?.(selectedPriority === 'low' ? null : 'low')}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-prio-low" />
          Low
        </Chip>
      </div>

      {/* Right: Sort controls */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-text-muted">Sort:</span>
        <button
          onClick={() => onToggleSortDirection?.()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-input bg-surface-2 border border-border text-text font-medium hover:bg-border/30 transition-colors"
        >
          <span className="capitalize">{sortBy}</span>
          <ArrowDownUp size={12} className={sortAsc ? 'rotate-180 transition-transform' : ''} />
        </button>
      </div>
    </div>
  );
};
