import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { AIService } from '../services/openai.service.js';

export const getStudyPlans = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const studyPlans = await prisma.studyPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: { studyPlans },
    studyPlans,
  });
});

export const createStudyPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { title, targetExam, examDate, targetScore, dailyHours, weakTopics } = req.body;

  if (!title || !targetExam) {
    throw new AppError('Title and target exam are required', 400);
  }

  // Generate AI schedule
  const resolvedExamDate = examDate ? new Date(examDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const hours = dailyHours ? Number(dailyHours) : 2.0;

  const aiPlan = await AIService.generateStudyPlan({
    targetExam,
    examDate: resolvedExamDate.toISOString().split('T')[0],
    targetScore: targetScore ? Number(targetScore) : 90,
    dailyHours: hours,
    subjects: weakTopics && weakTopics.length > 0 ? weakTopics : [targetExam],
  });

  const studyPlan = await prisma.studyPlan.create({
    data: {
      userId,
      title,
      targetExam,
      examDate: resolvedExamDate,
      targetScore: targetScore ? Number(targetScore) : 90,
      dailyHours: hours,
      scheduleJson: aiPlan.dailySchedule,
    },
  });

  res.status(201).json({
    success: true,
    data: studyPlan,
    message: 'AI Study Plan generated successfully!',
  });
});

export const updateStudyPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { title, targetScore, dailyHours, scheduleJson } = req.body;

  const plan = await prisma.studyPlan.findFirst({
    where: { id, userId },
  });

  if (!plan) {
    throw new AppError('Study plan not found', 404);
  }

  const updated = await prisma.studyPlan.update({
    where: { id },
    data: {
      title: title || plan.title,
      targetScore: targetScore !== undefined ? Number(targetScore) : plan.targetScore,
      dailyHours: dailyHours !== undefined ? Number(dailyHours) : plan.dailyHours,
      scheduleJson: scheduleJson !== undefined ? scheduleJson : plan.scheduleJson,
    },
  });

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Study plan updated',
  });
});

export const deleteStudyPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const plan = await prisma.studyPlan.findFirst({
    where: { id, userId },
  });

  if (!plan) {
    throw new AppError('Study plan not found', 404);
  }

  await prisma.studyPlan.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'Study plan deleted successfully',
  });
});
