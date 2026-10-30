import { Schema, model } from 'mongoose';
import type { List } from '@synctask/shared';

export interface IListDoc extends Omit<List, 'id'> {
  _id: string;
}

const ListSchema = new Schema<IListDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: 'sky' },
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

ListSchema.index({ userId: 1, rev: 1 });

export const ListModel = model<IListDoc>('List', ListSchema);
