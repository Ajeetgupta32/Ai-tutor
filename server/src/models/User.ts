import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'admin';
  avatar?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  studyStreak: number;
  lastActiveDate?: Date;
  totalQuizCount: number;
  averageScore: number;
  accuracyRate: number;
  totalStudyTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    avatar: { type: String, default: '' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    studyStreak: { type: Number, default: 1 },
    lastActiveDate: { type: Date, default: Date.now },
    totalQuizCount: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    accuracyRate: { type: Number, default: 0 },
    totalStudyTimeMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
