import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

// Student: Get my tickets
export const getMyTickets = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: tickets,
  });
});

// Student: Create a ticket
export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { subject, category, priority, description } = req.body;

  if (!subject || !description) {
    throw new AppError('Subject and description are required', 400);
  }

  const ticketId = `TCK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketId,
      userId,
      subject,
      category: category || 'general',
      priority: priority || 'medium',
      description,
      status: 'open',
    },
  });

  res.status(201).json({
    success: true,
    data: ticket,
    message: 'Support ticket submitted successfully',
  });
});

// Admin: Get all tickets
export const getAllTickets = asyncHandler(async (req: Request, res: Response) => {
  const { status, priority, category } = req.query;

  const where: any = {};
  if (status) where.status = String(status);
  if (priority) where.priority = String(priority);
  if (category) where.category = String(category);

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: tickets,
  });
});

// Admin: Reply / Update ticket
export const updateTicket = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, priority, adminReply, assignedTo } = req.body;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: status || ticket.status,
      priority: priority || ticket.priority,
      adminReply: adminReply !== undefined ? adminReply : ticket.adminReply,
      assignedTo: assignedTo !== undefined ? assignedTo : ticket.assignedTo,
    },
  });

  // Notify student if there is a response
  if (adminReply) {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        title: `Support Ticket Update: ${ticket.subject}`,
        message: `Admin replied: "${adminReply.slice(0, 100)}${adminReply.length > 100 ? '...' : ''}"`,
        type: 'system',
        link: '/support',
      },
    });
  }

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Ticket updated successfully',
  });
});
