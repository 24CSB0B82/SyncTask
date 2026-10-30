export const PRIORITIES = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
} as const;

export type PriorityValue = (typeof PRIORITIES)[keyof typeof PRIORITIES];

export const PRIORITY_LABELS: Record<PriorityValue, string> = {
  [PRIORITIES.LOW]: 'Low',
  [PRIORITIES.MEDIUM]: 'Medium',
  [PRIORITIES.HIGH]: 'High',
};

export const PRIORITY_KEYS: Record<PriorityValue, 'low' | 'med' | 'high'> = {
  [PRIORITIES.LOW]: 'low',
  [PRIORITIES.MEDIUM]: 'med',
  [PRIORITIES.HIGH]: 'high',
};

// Subtask 8-colour palette as specified in Section 11.4
export const SUBTASK_PALETTE_ORDER = [
  'emerald',
  'lavender',
  'sky',
  'coral',
  'amber',
  'rose',
  'teal',
  'slate',
] as const;

export type SubtaskColorKey = (typeof SUBTASK_PALETTE_ORDER)[number];

export interface PaletteColorDef {
  name: string;
  light: string;
  dark: string;
}

export const SUBTASK_PALETTE: Record<SubtaskColorKey, PaletteColorDef> = {
  emerald: { name: 'Emerald', light: '#2F9E73', dark: '#5FCFA0' },
  lavender: { name: 'Lavender', light: '#7C6FD6', dark: '#A99BF0' },
  sky: { name: 'Sky', light: '#3F8FCB', dark: '#6DB8F0' },
  coral: { name: 'Coral', light: '#D0705F', dark: '#F09A8A' },
  amber: { name: 'Amber', light: '#B8892B', dark: '#E8C46A' },
  rose: { name: 'Rose', light: '#C4628C', dark: '#E98FB5' },
  teal: { name: 'Teal', light: '#2B9AA3', dark: '#5CC8D0' },
  slate: { name: 'Slate', light: '#627B8E', dark: '#8FA3B5' },
};

// Default Lists
export const DEFAULT_LISTS = [
  { name: 'Personal', color: 'sky' },
  { name: 'Work', color: 'emerald' },
  { name: 'Shopping', color: 'amber' },
] as const;

// Default Reminder Lead Times
export const REMINDER_LEAD_OPTIONS = [
  { label: 'Use default', value: null },
  { label: 'At due time', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
  { label: 'No reminder', value: -1 },
] as const;

export const RECURRENCE_OPTIONS = [
  { label: 'Does not repeat', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekdays (Mon-Fri)', value: 'weekdays' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
] as const;

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export const DEFAULT_USER_SETTINGS = {
  theme: 'system' as const,
  weekStart: 'mon' as const,
  timeFormat: '24h' as const,
  defaultReminderMin: 30,
  quietEnabled: false,
  quietStart: '22:00',
  quietEnd: '07:00',
  browserNotifications: false,
};
