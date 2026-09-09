import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AIService } from '../services/openai.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

export const formatQuiz = (quiz: any) => {
  if (!quiz) return null;
  return {
    _id: quiz.id,
    id: quiz.id,
    title: quiz.title,
    subjectId: quiz.subjectId,
    subjectName: quiz.subjectName,
    topicId: quiz.topicId,
    topicName: quiz.topicName,
    difficulty: quiz.difficulty,
    questionType: quiz.questionType,
    questionCount: quiz.questionCount,
    createdBy: quiz.createdBy,
    isAiGenerated: quiz.isAiGenerated,
    language: quiz.language,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
    questions: (quiz.questions || []).map((q: any) => ({
      id: q.id,
      questionText: q.questionText,
      type: q.type,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      topic: q.topic || 'General',
    })),
  };
};

export const generateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { subjectName, topicName, difficulty, questionCount, questionType, language = 'en' } = req.body;

  if (!subjectName || !topicName || !difficulty || !questionCount || !questionType) {
    throw new AppError('Subject, topic, difficulty, question count, and question type are required', 400);
  }

  const generatedAIQuiz = await AIService.generateQuiz({
    subjectName,
    topicName,
    difficulty,
    questionCount: Number(questionCount),
    questionType,
    language,
  });

  const quiz = await prisma.quiz.create({
    data: {
      title: generatedAIQuiz.title,
      subjectName: generatedAIQuiz.subjectName,
      topicName: generatedAIQuiz.topicName,
      difficulty: generatedAIQuiz.difficulty,
      questionType: generatedAIQuiz.questionType,
      questionCount: generatedAIQuiz.questionCount,
      createdBy: userId,
      isAiGenerated: true,
      language,
      questions: {
        create: generatedAIQuiz.questions.map((q: any) => ({
          questionText: q.questionText,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic || 'General',
        })),
      },
    },
    include: {
      questions: true,
    },
  });

  await prisma.aIUsage.create({
    data: {
      userId,
      actionType: 'quiz_gen',
      tokensUsed: 400 * generatedAIQuiz.questionCount,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Quiz generated successfully',
    data: { quiz: formatQuiz(quiz) },
  });
});

export const getQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const quizzes = await prisma.quiz.findMany({
    where: {
      OR: [{ createdBy: userId }, { createdBy: null }],
    },
    include: {
      questions: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: { quizzes: quizzes.map(formatQuiz) },
  });
});

export const getQuizById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: true,
    },
  });

  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { quiz: formatQuiz(quiz) },
  });
});
