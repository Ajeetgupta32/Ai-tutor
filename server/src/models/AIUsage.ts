import mongoose, { Schema, Document } from 'mongoose';

export interface IAIUsage extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  actionType: 'tutor_chat' | 'quiz_gen' | 'summarize_material' | 'quiz_from_notes';
  tokensUsed: number;
  timestamp: Date;
  createdAt: Date;
}

const AIUsageSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actionType: {
      type: String,
      enum: ['tutor_chat', 'quiz_gen', 'summarize_material', 'quiz_from_notes'],
      required: true,
    },
    tokensUsed: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AIUsageSchema.index({ userId: 1, timestamp: -1 });

export const AIUsage = mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);
