import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyMaterial extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  fileType: 'pdf' | 'text';
  fileSize: number;
  extractedText: string;
  summary: string;
  keyTopics: string[];
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudyMaterialSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    fileType: { type: String, enum: ['pdf', 'text'], required: true },
    fileSize: { type: Number, default: 0 },
    extractedText: { type: String, required: true },
    summary: { type: String, default: '' },
    keyTopics: [{ type: String }],
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StudyMaterialSchema.index({ userId: 1, uploadedAt: -1 });

export const StudyMaterial = mongoose.model<IStudyMaterial>('StudyMaterial', StudyMaterialSchema);
