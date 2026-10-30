import { Schema, model } from 'mongoose';

export interface IPasswordResetDoc {
  _id: string; // tokenHash
  userId: string;
  expiresAt: Date;
  used: boolean;
}

const PasswordResetSchema = new Schema<IPasswordResetDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    used: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const PasswordResetModel = model<IPasswordResetDoc>('PasswordReset', PasswordResetSchema);
