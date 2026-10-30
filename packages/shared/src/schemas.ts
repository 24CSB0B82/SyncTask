import { z } from 'zod';
import { PRIORITIES, SUBTASK_PALETTE_ORDER } from './constants';

export const SubtaskColorSchema = z.enum(SUBTASK_PALETTE_ORDER);

export const PrioritySchema = z.union([
  z.literal(PRIORITIES.LOW),
  z.literal(PRIORITIES.MEDIUM),
  z.literal(PRIORITIES.HIGH),
]);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  listId: z.string().uuid().nullable().default(null),
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').default(''),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD')
    .nullable()
    .default(null),
  dueTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Due time must be HH:mm')
    .nullable()
    .default(null),
  priority: PrioritySchema.default(PRIORITIES.MEDIUM),
  tags: z.array(z.string().min(1).max(30).toLowerCase()).max(10).default([]),
  completed: z.boolean().default(false),
  completedAt: z.string().datetime().nullable().default(null),
  recurrence: z.enum(['none', 'daily', 'weekdays', 'weekly', 'monthly']).nullable().default(null),
  remindBeforeMin: z.number().int().nullable().default(null), // null = default, -1 = no reminder, >=0 = lead min
  rev: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export const CreateTaskInputSchema = TaskSchema.pick({
  title: true,
  description: true,
  dueDate: true,
  dueTime: true,
  priority: true,
  listId: true,
  tags: true,
  recurrence: true,
  remindBeforeMin: true,
}).partial({
  description: true,
  dueDate: true,
  dueTime: true,
  priority: true,
  listId: true,
  tags: true,
  recurrence: true,
  remindBeforeMin: true,
});

export const UpdateTaskInputSchema = CreateTaskInputSchema.partial().extend({
  completed: z.boolean().optional(),
});

export const SubtaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  taskId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  done: z.boolean().default(false),
  color: SubtaskColorSchema,
  position: z.number().int().default(0),
  rev: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export const CreateSubtaskInputSchema = SubtaskSchema.pick({
  taskId: true,
  title: true,
  color: true,
  position: true,
}).partial({
  color: true,
  position: true,
});

export const ListSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().default('sky'),
  position: z.number().int().default(0),
  rev: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export const CreateListInputSchema = ListSchema.pick({
  name: true,
  color: true,
  position: true,
}).partial({
  color: true,
  position: true,
});

export const NotificationTypeSchema = z.enum(['reminder', 'overdue']);

export const NotificationSchema = z.object({
  id: z.string(), // deterministic: taskId:type:dueDateTdueTime
  userId: z.string(),
  taskId: z.string().uuid(),
  type: NotificationTypeSchema,
  fireAt: z.string().datetime(),
  readAt: z.string().datetime().nullable().default(null),
  snoozedUntil: z.string().datetime().nullable().default(null),
  dismissedAt: z.string().datetime().nullable().default(null),
  rev: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export const UserSettingsSchema = z.object({
  userId: z.string(),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  weekStart: z.enum(['mon', 'sun']).default('mon'),
  timeFormat: z.enum(['24h', '12h']).default('24h'),
  defaultReminderMin: z.number().int().min(0).max(43200).default(30),
  quietEnabled: z.boolean().default(false),
  quietStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default('22:00'),
  quietEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default('07:00'),
  browserNotifications: z.boolean().default(false),
  rev: z.number().int().default(0),
  updatedAt: z.string().datetime(),
});

export const OutboxMutationSchema = z.object({
  mutationId: z.string().uuid(),
  entity: z.enum(['task', 'subtask', 'list', 'notification', 'settings']),
  entityId: z.string(),
  op: z.enum(['create', 'update', 'delete']),
  patch: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});

// Auth Schemas
export const RegisterInputSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(2, 'Username must be at least 2 characters').max(50).trim(),
});

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const SyncPushInputSchema = z.object({
  mutations: z.array(OutboxMutationSchema),
});

// Phase 8: Profile, OAuth, Password Reset, and Account Schemas
export const UpdateProfileInputSchema = z
  .object({
    username: z.string().min(2, 'Username must be at least 2 characters').max(50).trim().optional(),
    avatarUrl: z.string().nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Current password is required to set a new password',
      path: ['currentPassword'],
    }
  );

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const DeleteAccountInputSchema = z.object({
  confirmEmail: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().optional(),
});

export const OAuthLoginInputSchema = z.object({
  provider: z.enum(['google', 'github']),
  email: z.string().email().toLowerCase().trim(),
  name: z.string().min(1).max(50).trim(),
  avatarUrl: z.string().optional(),
});
