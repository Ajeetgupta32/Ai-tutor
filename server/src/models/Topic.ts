import mongoose, { Schema, Document } from 'mongoose';

export interface ITopic extends Document {
  _id: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema: Schema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  },
  { timestamps: true }
);

TopicSchema.index({ subjectId: 1, name: 1 });

export const Topic = mongoose.model<ITopic>('Topic', TopicSchema);
