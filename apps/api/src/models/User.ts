import { Schema, model } from 'mongoose';

export interface IUser {
  _id: string; // UUID
  email: string;
  passwordHash: string;
  username: string;
  avatarUrl?: string | null;
  authProvider?: string;
  cursor: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    username: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    authProvider: { type: String, default: 'local' },
    cursor: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const UserModel = model<IUser>('User', UserSchema);
