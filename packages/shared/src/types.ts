import { z } from 'zod';
import {
  TaskSchema,
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  SubtaskSchema,
  CreateSubtaskInputSchema,
  ListSchema,
  CreateListInputSchema,
  NotificationSchema,
  UserSettingsSchema,
  OutboxMutationSchema,
  RegisterInputSchema,
  LoginInputSchema,
  SyncPushInputSchema,
  UpdateProfileInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  DeleteAccountInputSchema,
  OAuthLoginInputSchema,
} from './schemas';
import { PriorityValue, SubtaskColorKey } from './constants';

export type Task = z.infer<typeof TaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;

export type Subtask = z.infer<typeof SubtaskSchema>;
export type CreateSubtaskInput = z.infer<typeof CreateSubtaskInputSchema>;

export type List = z.infer<typeof ListSchema>;
export type CreateListInput = z.infer<typeof CreateListInputSchema>;

export type Notification = z.infer<typeof NotificationSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export type OutboxMutation = z.infer<typeof OutboxMutationSchema>;

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type SyncPushInput = z.infer<typeof SyncPushInputSchema>;

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountInputSchema>;
export type OAuthLoginInput = z.infer<typeof OAuthLoginInputSchema>;

export interface SyncPullResponse {
  cursor: number;
  changes: {
    lists: List[];
    tasks: Task[];
    subtasks: Subtask[];
    notifications: Notification[];
    settings: UserSettings | null;
  };
}

export interface SyncPushResponse {
  applied: string[]; // mutationIds
  cursor: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  cursor: number;
}

export type { PriorityValue, SubtaskColorKey };
