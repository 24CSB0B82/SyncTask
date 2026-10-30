import { PRIORITIES } from '@synctask/shared';
import { TaskCardData } from './TaskCard';

export const INITIAL_MOCK_TASKS: TaskCardData[] = [
  {
    id: 'mock-1',
    title: 'Implement offline IndexedDB sync conflict resolution',
    description:
      'Field-level merge logic with outbox mutation queue and deterministic UUIDs for all offline operations.',
    priority: PRIORITIES.HIGH,
    dueDate: '2026-10-13',
    dueTime: '18:00',
    dueLabel: 'Today 18:00',
    isOverdue: false,
    completed: false,
    tags: ['frontend', 'api'],
    reminderSet: true,
    subtasks: [
      {
        id: 'sub-1',
        title: 'Configure client-side Dexie.js schemas',
        done: true,
        color: 'emerald',
      },
      {
        id: 'sub-2',
        title: 'Generate deterministic UUIDs for offline tasks',
        done: true,
        color: 'lavender',
      },
      {
        id: 'sub-3',
        title: 'Local mutation outbox queue in Dexie',
        done: true,
        color: 'sky',
      },
      {
        id: 'sub-4',
        title: 'Handle merge conflict patch resolution',
        done: false,
        color: 'coral',
      },
      {
        id: 'sub-5',
        title: 'Simulated latency reconnection test scenario',
        done: false,
        color: 'slate',
      },
    ],
  },
  {
    id: 'mock-2',
    title: 'Encrypt sensitive tokens using Argon2 and enforce HTTPS strict transport',
    description:
      'Audit token signing, cookie storage parameters, and Helmet security middleware headers.',
    priority: PRIORITIES.HIGH,
    dueDate: '2026-10-14',
    dueTime: '11:00',
    dueLabel: 'Tomorrow',
    isOverdue: false,
    completed: false,
    tags: ['security', 'ops'],
    reminderSet: true,
    subtasks: [
      {
        id: 'sub-2-1',
        title: 'Configure Argon2id hash parameters',
        done: true,
        color: 'emerald',
      },
      {
        id: 'sub-2-2',
        title: 'Add helmet security headers and cookie flags',
        done: false,
        color: 'sky',
      },
    ],
  },
  {
    id: 'mock-3',
    title: 'Add OAuth social auth options (GitHub, Google) to login modal',
    description:
      'Implement client redirect flow and server token exchange endpoints with email verification.',
    priority: PRIORITIES.MEDIUM,
    dueDate: '2026-10-24',
    dueTime: null,
    dueLabel: 'Oct 24',
    isOverdue: false,
    completed: false,
    tags: ['frontend', 'auth'],
    reminderSet: false,
    subtasks: [
      {
        id: 'sub-3-1',
        title: 'Google OAuth provider client setup',
        done: false,
        color: 'lavender',
      },
      {
        id: 'sub-3-2',
        title: 'GitHub OAuth client callback handler',
        done: false,
        color: 'sky',
      },
      {
        id: 'sub-3-3',
        title: 'Link existing account by verified email',
        done: false,
        color: 'amber',
      },
    ],
  },
  {
    id: 'mock-4',
    title: 'Calm theme palette contrast verification and WCAG AA pass',
    description:
      'Verify all background and text token pairs meet WCAG AA 4.5:1 ratio across both themes.',
    priority: PRIORITIES.LOW,
    dueDate: '2026-10-28',
    dueTime: null,
    dueLabel: 'Oct 28',
    isOverdue: false,
    completed: false,
    tags: ['design', 'a11y'],
    reminderSet: false,
    subtasks: [
      {
        id: 'sub-4-1',
        title: 'Verify light mode Morning Mist contrast',
        done: true,
        color: 'emerald',
      },
      {
        id: 'sub-4-2',
        title: 'Verify dark mode Deep Tide contrast',
        done: true,
        color: 'lavender',
      },
    ],
  },
];
