import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const notif = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notif) {
    throw new AppError('Notification not found', 404);
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.status(200).json({
    success: true,
    data: updated,
  });
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});
