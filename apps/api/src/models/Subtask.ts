import { Schema, model } from 'mongoose';
import { SUBTASK_PALETTE_ORDER, Subtask } from '@synctask/shared';

export interface ISubtaskDoc extends Omit<Subtask, 'id'> {
  _id: string;
}

const SubtaskSchema = new Schema<ISubtaskDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    taskId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    color: { type: String, enum: SUBTASK_PALETTE_ORDER, default: 'emerald' },
    position: { type: Number, default: 0 },
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

SubtaskSchema.index({ userId: 1, rev: 1 });
SubtaskSchema.index({ taskId: 1, position: 1 });

export const SubtaskModel = model<ISubtaskDoc>('Subtask', SubtaskSchema);
