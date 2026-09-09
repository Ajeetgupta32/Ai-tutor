import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
  id: string;
  questionText: string;
  type: 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic?: string;
}

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  subjectId?: mongoose.Types.ObjectId;
  subjectName: string;
  topicId?: mongoose.Types.ObjectId;
  topicName: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionType: 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer' | 'mixed';
  questionCount: number;
  questions: IQuizQuestion[];
  createdBy?: mongoose.Types.ObjectId;
  isAiGenerated: boolean;
  language: 'en' | 'hi';
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema({
  id: { type: String, required: true },
  questionText: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'true_false', 'fill_in_blank', 'short_answer'], required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true },
  topic: { type: String, default: 'General' },
});

const QuizSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String, required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    topicName: { type: String, required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    questionType: { type: String, enum: ['mcq', 'true_false', 'fill_in_blank', 'short_answer', 'mixed'], required: true },
    questionCount: { type: Number, required: true },
    questions: [QuizQuestionSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isAiGenerated: { type: Boolean, default: true },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
  },
  { timestamps: true }
);

QuizSchema.index({ createdBy: 1, createdAt: -1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
