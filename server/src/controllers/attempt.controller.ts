import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { formatQuiz } from './quiz.controller.js';

export const formatAttempt = (attempt: any) => {
  if (!attempt) return null;
  return {
    _id: attempt.id,
    id: attempt.id,
    userId: attempt.userId,
    quizId: attempt.quiz ? formatQuiz(attempt.quiz) : attempt.quizId,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percentage: attempt.percentage,
    accuracy: attempt.accuracy,
    timeTakenSeconds: attempt.timeTakenSeconds,
    weakTopics: attempt.weakTopics || [],
    strongTopics: attempt.strongTopics || [],
    completedAt: attempt.completedAt,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
    answers: (attempt.answers || []).map((a: any) => ({
      questionId: a.questionId,
      userResponse: a.userResponse,
      isCorrect: a.isCorrect,
      correctAnswer: a.correctAnswer,
      explanation: a.explanation,
      topic: a.topic || 'General',
    })),
  };
};

export const submitQuizAttempt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { quizId, userAnswers, timeTakenSeconds } = req.body;

  if (!quizId || !Array.isArray(userAnswers)) {
    throw new AppError('Quiz ID and user answers array are required', 400);
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  let correctCount = 0;
  const processedAnswers: Array<{
    questionId: string;
    userResponse: string;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
    topic: string;
  }> = [];
  const weakTopicSet = new Set<string>();
  const strongTopicSet = new Set<string>();

  quiz.questions.forEach((q) => {
    const submitted = userAnswers.find((a: any) => a.questionId === q.id);
    const userRes = submitted?.userResponse ? String(submitted.userResponse).trim() : '';

    let isCorrect = false;
    if (q.type === 'mcq' || q.type === 'true_false') {
      isCorrect = userRes.toLowerCase() === q.correctAnswer.toLowerCase();
    } else {
      isCorrect =
        userRes.toLowerCase().includes(q.correctAnswer.toLowerCase()) ||
        q.correctAnswer.toLowerCase().includes(userRes.toLowerCase());
    }

    if (isCorrect) {
      correctCount++;
      strongTopicSet.add(q.topic || quiz.topicName);
    } else {
      weakTopicSet.add(q.topic || quiz.topicName);
    }

    processedAnswers.push({
      questionId: q.id,
      userResponse: userRes,
      isCorrect,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      topic: q.topic || quiz.topicName,
    });
  });

  const totalQuestions = quiz.questions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const weakTopics = Array.from(weakTopicSet);
  const strongTopics = Array.from(strongTopicSet);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score: correctCount,
      totalQuestions,
      percentage,
      accuracy: percentage,
      timeTakenSeconds: Number(timeTakenSeconds) || 60,
      weakTopics,
      strongTopics,
      completedAt: new Date(),
      answers: {
        create: processedAnswers,
      },
    },
    include: {
      answers: true,
      quiz: {
        include: { questions: true },
      },
    },
  });

  // Record Study Session
  const sessionMinutes = Math.max(1, Math.round((timeTakenSeconds || 60) / 60));
  await prisma.studySession.create({
    data: {
      userId,
      durationMinutes: sessionMinutes,
      activityType: 'quiz',
      date: new Date(),
    },
  });

  // Update User Aggregated Stats
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    const allAttempts = await prisma.quizAttempt.findMany({ where: { userId } });
    const totalScorePct = allAttempts.reduce((acc, curr) => acc + curr.percentage, 0);
    const averageScore = Math.round(totalScorePct / allAttempts.length);

    const earnedXp = percentage >= 80 ? 100 : percentage >= 50 ? 60 : 30;

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalQuizCount: user.totalQuizCount + 1,
        totalStudyTimeMinutes: user.totalStudyTimeMinutes + sessionMinutes,
        averageScore,
        accuracyRate: averageScore,
        xp: (user.xp || 0) + earnedXp,
      },
    });

    // Grant Badges / Achievements
    if (user.totalQuizCount + 1 === 1) {
      await prisma.achievement.upsert({
        where: {
          userId_badgeName: {
            userId,
            badgeName: 'First Quiz Master',
          },
        },
        create: {
          userId,
          badgeName: 'First Quiz Master',
          badgeIcon: 'Trophy',
          description: 'Completed your first AI-generated quiz!',
        },
        update: {},
      });
    }

    if (percentage === 100) {
      await prisma.achievement.upsert({
        where: {
          userId_badgeName: {
            userId,
            badgeName: 'Perfect Score',
          },
        },
        create: {
          userId,
          badgeName: 'Perfect Score',
          badgeIcon: 'Zap',
          description: 'Achieved 100% accuracy on a quiz!',
        },
        update: {},
      });
    }

    // Auto-generate Certificate if scored >= 80% on a substantial quiz
    if (percentage >= 80 && totalQuestions >= 5) {
      const existingCert = await prisma.certificate.findFirst({
        where: { userId, subjectName: quiz.subjectName },
      });
      if (!existingCert) {
        const certCode = `EM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await prisma.certificate.create({
          data: {
            certificateId: certCode,
            verificationCode: certCode,
            userId,
            title: `Certificate of Subject Proficiency in ${quiz.subjectName}`,
            subjectName: quiz.subjectName,
            score: percentage,
          },
        });
      }
    }
  }

  res.status(201).json({
    success: true,
    message: 'Quiz attempt submitted successfully',
    data: {
      attempt: formatAttempt(attempt),
      quizTitle: quiz.title,
      subjectName: quiz.subjectName,
    },
  });
});

export const getMyAttempts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      answers: true,
      quiz: true,
    },
    orderBy: { completedAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: { attempts: attempts.map(formatAttempt) },
  });
});

export const getAttemptById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const attempt = await prisma.quizAttempt.findFirst({
    where: { id, userId },
    include: {
      answers: true,
      quiz: {
        include: { questions: true },
      },
    },
  });

  if (!attempt) {
    throw new AppError('Quiz attempt not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { attempt: formatAttempt(attempt) },
  });
});

/**
 * "Explain My Mistake" Diagnostic AI Handler
 */
export const explainAttemptMistake = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id, questionId } = req.params;
  const { language = 'en' } = req.body;

  const attempt = await prisma.quizAttempt.findFirst({
    where: { id, userId },
    include: {
      answers: true,
      quiz: {
        include: { questions: true },
      },
    },
  });

  if (!attempt) {
    throw new AppError('Quiz attempt not found', 404);
  }

  const answer = attempt.answers.find((a) => a.questionId === questionId);
  const question = attempt.quiz.questions.find((q) => q.id === questionId);

  if (!answer || !question) {
    throw new AppError('Question or user answer not found in attempt', 404);
  }

  const { AIService } = await import('../services/openai.service.js');
  const mistakeAnalysis = await AIService.explainMistake({
    questionText: question.questionText,
    userResponse: answer.userResponse,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    topicName: question.topic || attempt.quiz.topicName,
    language: language as 'en' | 'hi',
  });

  res.status(200).json({
    success: true,
    data: {
      questionText: question.questionText,
      userResponse: answer.userResponse,
      correctAnswer: question.correctAnswer,
      analysis: mistakeAnalysis,
    },
  });
});
