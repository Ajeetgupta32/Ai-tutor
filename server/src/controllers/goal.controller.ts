import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

export const getGoals = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: goals,
    goals,
  });
});

export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { title, type, targetValue, targetDate, xpReward } = req.body;

  if (!title) {
    throw new AppError('Goal title is required', 400);
  }

  const goal = await prisma.goal.create({
    data: {
      userId,
      title,
      type: type || 'daily',
      targetValue: targetValue ? Number(targetValue) : 1,
      currentValue: 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      xpReward: xpReward ? Number(xpReward) : 50,
      isCompleted: false,
    },
  });

  res.status(201).json({
    success: true,
    data: goal,
    message: 'Goal created successfully',
  });
});

export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { currentValue, isCompleted, title } = req.body;

  const goal = await prisma.goal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  let willComplete = isCompleted ?? goal.isCompleted;
  let newCurrentValue = currentValue !== undefined ? Number(currentValue) : goal.currentValue;

  let xpAwarded = 0;
  if ((newCurrentValue >= goal.targetValue || willComplete) && !goal.isCompleted) {
    willComplete = true;
    xpAwarded = goal.xpReward;
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: goal.xpReward } },
    });
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      title: title || goal.title,
      currentValue: newCurrentValue,
      isCompleted: willComplete,
    },
  });

  res.status(200).json({
    success: true,
    data: updated,
    xpAwarded,
    message: xpAwarded > 0 ? `Goal completed! Earned +${xpAwarded} XP 🎉` : 'Goal updated successfully',
  });
});

export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const goal = await prisma.goal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  await prisma.goal.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'Goal deleted successfully',
  });
});
