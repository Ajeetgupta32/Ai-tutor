import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  badgeName: string;
  badgeIcon: string;
  description: string;
  unlockedAt: Date;
  createdAt: Date;
}

const AchievementSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    badgeName: { type: String, required: true },
    badgeIcon: { type: String, required: true },
    description: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AchievementSchema.index({ userId: 1, badgeName: 1 }, { unique: true });

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
