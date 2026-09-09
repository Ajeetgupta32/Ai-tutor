import { z } from 'zod';

export const QuizQuestionZodSchema = z.object({
  id: z.string(),
  questionText: z.string().min(3),
  type: z.enum(['mcq', 'true_false', 'fill_in_blank', 'short_answer']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(5),
  topic: z.string().optional().default('General'),
});

export const QuizGenerationZodSchema = z.object({
  title: z.string().min(3),
  subjectName: z.string(),
  topicName: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  questionType: z.enum(['mcq', 'true_false', 'fill_in_blank', 'short_answer', 'mixed']),
  questionCount: z.number().min(1),
  questions: z.array(QuizQuestionZodSchema).min(1),
});

export const MaterialAnalysisZodSchema = z.object({
  summary: z.string().min(10),
  keyTopics: z.array(z.string()),
  importantConcepts: z.array(z.string()),
});

export type QuizQuestionAI = z.infer<typeof QuizQuestionZodSchema>;
export type QuizGenerationAI = z.infer<typeof QuizGenerationZodSchema>;
export type MaterialAnalysisAI = z.infer<typeof MaterialAnalysisZodSchema>;
