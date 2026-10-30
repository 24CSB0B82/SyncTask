import { Schema, model } from 'mongoose';
import type { Notification } from '@synctask/shared';

export interface INotificationDoc extends Omit<Notification, 'id'> {
  _id: string;
}

const NotificationSchema = new Schema<INotificationDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    taskId: { type: String, required: true, index: true },
    type: { type: String, enum: ['reminder', 'overdue'], required: true },
    fireAt: { type: String, required: true },
    readAt: { type: String, default: null },
    snoozedUntil: { type: String, default: null },
    dismissedAt: { type: String, default: null },
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

NotificationSchema.index({ userId: 1, rev: 1 });

export const NotificationModel = model<INotificationDoc>('Notification', NotificationSchema);
