import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description: string;
  icon: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'BookOpen' },
    isDefault: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);
