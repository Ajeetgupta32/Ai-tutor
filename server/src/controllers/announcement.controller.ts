import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

export const getActiveAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user?.role || 'all';

  const announcements = await prisma.announcement.findMany({
    where: {
      targetRole: { in: ['all', userRole] },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: announcements,
    announcements,
  });
});

export const getAllAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: announcements,
    announcements,
  });
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, priority, targetRole, endDate } = req.body;

  if (!title || !content) {
    throw new AppError('Title and content are required', 400);
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      priority: priority || 'normal',
      targetRole: targetRole || 'all',
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user?.userId || null,
    },
  });

  // Notify relevant users
  const targetUsers = await prisma.user.findMany({
    where: targetRole && targetRole !== 'all' ? { role: targetRole } : {},
    select: { id: true },
  });

  if (targetUsers.length > 0) {
    await prisma.notification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        title: `Announcement: ${title}`,
        message: content.slice(0, 120),
        type: 'system',
        link: '/announcements',
      })),
    });
  }

  res.status(201).json({
    success: true,
    data: announcement,
    message: 'Announcement published successfully',
  });
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.announcement.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Announcement deleted',
  });
});
