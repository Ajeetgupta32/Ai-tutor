import mongoose, { Schema, Document } from 'mongoose';

export interface IStudySession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  durationMinutes: number;
  activityType: 'quiz' | 'tutor' | 'notes';
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    durationMinutes: { type: Number, required: true },
    activityType: { type: String, enum: ['quiz', 'tutor', 'notes'], required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StudySessionSchema.index({ userId: 1, date: -1 });

export const StudySession = mongoose.model<IStudySession>('StudySession', StudySessionSchema);
