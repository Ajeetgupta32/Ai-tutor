import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAnswer {
  questionId: string;
  userResponse: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  topic?: string;
}

export interface IQuizAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  answers: IUserAnswer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
  weakTopics: string[];
  strongTopics: string[];
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserAnswerSchema = new Schema({
  questionId: { type: String, required: true },
  userResponse: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true },
  topic: { type: String, default: 'General' },
});

const QuizAttemptSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    answers: [UserAnswerSchema],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    timeTakenSeconds: { type: Number, required: true },
    weakTopics: [{ type: String }],
    strongTopics: [{ type: String }],
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ userId: 1, completedAt: -1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
