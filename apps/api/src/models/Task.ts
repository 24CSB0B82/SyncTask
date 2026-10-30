import { Schema, model } from 'mongoose';
import type { Task } from '@synctask/shared';

export interface ITaskDoc extends Omit<Task, 'id'> {
  _id: string;
}

const TaskSchema = new Schema<ITaskDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    listId: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: String, default: null },
    dueTime: { type: String, default: null },
    priority: { type: Number, enum: [0, 1, 2], default: 1 },
    tags: { type: [String], default: [] },
    completed: { type: Boolean, default: false },
    completedAt: { type: String, default: null },
    recurrence: { type: String, enum: ['none', 'daily', 'weekdays', 'weekly', 'monthly', null], default: null },
    remindBeforeMin: { type: Number, default: null },
    rev: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    deletedAt: { type: String, default: null },
  },
  {
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

TaskSchema.index({ userId: 1, rev: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });

export const TaskModel = model<ITaskDoc>('Task', TaskSchema);
