import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AIService } from '../services/openai.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

const formatConversation = (c: any) => {
  if (!c) return null;
  return {
    _id: c.id,
    id: c.id,
    userId: c.userId,
    subjectId: c.subjectId,
    subjectName: c.subjectName,
    title: c.title,
    level: c.level,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

const formatMessage = (m: any) => {
  if (!m) return null;
  return {
    _id: m.id,
    id: m.id,
    conversationId: m.conversationId,
    sender: m.sender,
    content: m.content,
    language: m.language,
    mode: m.mode,
    metadata: m.metadata,
    createdAt: m.createdAt,
  };
};

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const conversations = await prisma.conversation.findMany({
    where: { userId, status: 'active' },
    orderBy: { updatedAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: { conversations: conversations.map(formatConversation) },
  });
});

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { title, subjectName, level } = req.body;

  const conversation = await prisma.conversation.create({
    data: {
      userId,
      title: title || 'New AI Tutor Session',
      subjectName: subjectName || 'General Science & Tech',
      level: level || 'intermediate',
      status: 'active',
    },
  });

  res.status(201).json({
    success: true,
    data: { conversation: formatConversation(conversation) },
  });
});

export const updateConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { title, level } = req.body;

  const existing = await prisma.conversation.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new AppError('Conversation not found', 404);
  }

  const dataToUpdate: any = {};
  if (title) dataToUpdate.title = title;
  if (level) dataToUpdate.level = level;

  const conversation = await prisma.conversation.update({
    where: { id },
    data: dataToUpdate,
  });

  res.status(200).json({
    success: true,
    data: { conversation: formatConversation(conversation) },
  });
});

export const deleteConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existing = await prisma.conversation.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new AppError('Conversation not found', 404);
  }

  await prisma.conversation.update({
    where: { id },
    data: { status: 'archived' },
  });

  res.status(200).json({
    success: true,
    message: 'Conversation deleted successfully',
  });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
  });

  res.status(200).json({
    success: true,
    data: { messages: messages.map(formatMessage) },
  });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { content, mode = 'default', language = 'en' } = req.body;

  if (!content || !content.trim()) {
    throw new AppError('Message content is required', 400);
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  // Save User Message
  const userMsg = await prisma.message.create({
    data: {
      conversationId: id,
      sender: 'user',
      content,
      language,
      mode,
    },
  });

  // Get previous history
  const previousMessages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
  });

  const history = previousMessages.map((m) => ({
    sender: m.sender as 'user' | 'assistant',
    content: m.content,
  }));

  // Generate AI Response
  const aiReply = await AIService.generateTutorResponse({
    message: content,
    conversationHistory: history,
    subjectName: conversation.subjectName,
    level: conversation.level as any,
    mode,
    language,
  });

  // Save Assistant Message
  const assistantMsg = await prisma.message.create({
    data: {
      conversationId: id,
      sender: 'assistant',
      content: aiReply,
      language,
      mode,
    },
  });

  // Track AI Usage
  await prisma.aIUsage.create({
    data: {
      userId,
      actionType: 'tutor_chat',
      tokensUsed: Math.ceil((content.length + aiReply.length) / 4),
    },
  });

  // Update conversation title if default
  let newTitle = conversation.title;
  if (conversation.title === 'New AI Tutor Session' && history.length <= 2) {
    newTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
  }

  await prisma.conversation.update({
    where: { id },
    data: {
      title: newTitle,
      updatedAt: new Date(),
    },
  });

  res.status(200).json({
    success: true,
    data: {
      userMessage: formatMessage(userMsg),
      assistantMessage: formatMessage(assistantMsg),
    },
  });
});
