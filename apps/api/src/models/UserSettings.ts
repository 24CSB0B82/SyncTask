import { Schema, model } from 'mongoose';
import type { UserSettings } from '@synctask/shared';

export interface IUserSettingsDoc extends UserSettings {
  _id: string; // userId
}

const UserSettingsSchema = new Schema<IUserSettingsDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, unique: true, index: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    weekStart: { type: String, enum: ['mon', 'sun'], default: 'mon' },
    timeFormat: { type: String, enum: ['24h', '12h'], default: '24h' },
    defaultReminderMin: { type: Number, default: 30 },
    quietEnabled: { type: Boolean, default: false },
    quietStart: { type: String, default: '22:00' },
    quietEnd: { type: String, default: '07:00' },
    browserNotifications: { type: Boolean, default: false },
    rev: { type: Number, default: 0 },
    updatedAt: { type: String, required: true },
  },
  {
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

UserSettingsSchema.index({ userId: 1, rev: 1 });

export const UserSettingsModel = model<IUserSettingsDoc>('UserSettings', UserSettingsSchema);
