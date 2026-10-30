import React from 'react';
import { PRIORITIES, PriorityValue } from '@synctask/shared';
import { CalendarDayInfo } from './calendarUtils';

interface DayCellProps {
  day: CalendarDayInfo;
  isSelected: boolean;
  isCompact: boolean; // true when a day is opened and grid shrinks (row height 96px -> 60px)
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const DayCell: React.FC<DayCellProps> = ({
  day,
  isSelected,
  isCompact,
  onClick,
  onKeyDown,
}) => {
  const getCircleColor = (priority: PriorityValue) => {
    if (priority === PRIORITIES.HIGH) return 'bg-prio-high border-prio-high';
    if (priority === PRIORITIES.MEDIUM) return 'bg-prio-med border-prio-med';
    return 'bg-prio-low border-prio-low';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={`${day.dateStr}, ${day.tasks.length} tasks`}
      className={`relative p-2 rounded-card border transition-all duration-200 select-none cursor-pointer flex flex-col justify-between ${
        isCompact ? 'h-[62px]' : 'h-[96px] sm:h-[104px]'
      } ${
        !day.isCurrentMonth
          ? 'opacity-35 bg-surface/40 border-border/40'
          : 'bg-surface border-border hover:border-primary/50'
      } ${
        isSelected
          ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-sm'
          : 'hover:bg-surface-2/60'
      }`}
    >
      {/* Top: Day Number & Today indicator */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-mono font-medium flex items-center justify-center transition-colors ${
            day.isToday
              ? 'w-5 h-5 rounded-full bg-primary text-primary-contrast font-semibold shadow-xs'
              : day.isCurrentMonth
                ? 'text-text'
                : 'text-text-muted'
          }`}
        >
          {day.dayNumber}
        </span>

        {/* Task count on compact view */}
        {day.tasks.length > 0 && isCompact && (
          <span className="text-[10px] font-mono text-text-muted">{day.tasks.length}</span>
        )}
      </div>

      {/* Bottom: Consecutive Priority Circles (10px circles, 4px gap) (FR-CAL-2) */}
      <div className="flex items-center gap-1 flex-wrap mt-auto">
        {day.circles.map((circle) => {
          const colorClass = getCircleColor(circle.priority);
          return (
            <span
              key={circle.id}
              className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${
                circle.completed
                  ? `border-[1.5px] bg-transparent ${colorClass.split(' ')[1]}`
                  : `${colorClass.split(' ')[0]}`
              }`}
            />
          );
        })}
        {day.overflowCount > 0 && (
          <span className="text-[9px] font-mono font-semibold text-text-muted leading-none">
            +{day.overflowCount}
          </span>
        )}
      </div>
    </div>
  );
};
