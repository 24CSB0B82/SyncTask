import { Schema, model } from 'mongoose';

export interface IProcessedMutationDoc {
  _id: string; // mutationId (UUID)
  userId: string;
  appliedAt: Date;
}

const ProcessedMutationSchema = new Schema<IProcessedMutationDoc>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    appliedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // 30 days TTL
  },
  {
    versionKey: false,
  }
);

export const ProcessedMutationModel = model<IProcessedMutationDoc>(
  'ProcessedMutation',
  ProcessedMutationSchema
);
