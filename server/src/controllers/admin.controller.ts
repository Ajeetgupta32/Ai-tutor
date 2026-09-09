import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

export const getAdminMetrics = asyncHandler(async (req: Request, res: Response) => {
  const totalStudents = await prisma.user.count({ where: { role: 'student' } });
  const totalQuizzes = await prisma.quiz.count();
  const totalAttempts = await prisma.quizAttempt.count();
  const totalCourses = await prisma.course.count();
  const openTickets = await prisma.supportTicket.count({ where: { status: 'open' } });

  // AI Tokens
  const tokenUsage = await prisma.aIUsage.aggregate({
    _sum: { tokensUsed: true },
  });
  const totalTokens = tokenUsage._sum.tokensUsed || 0;

  // Active Users in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeUsersCount = await prisma.user.count({
    where: { lastActiveDate: { gte: sevenDaysAgo } },
  });

  // Average Platform Score
  const avgAttemptScore = await prisma.quizAttempt.aggregate({
    _avg: { percentage: true },
  });
  const averagePerformance = Math.round(avgAttemptScore._avg.percentage || 0);

  // At-Risk count
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const atRiskCount = await prisma.user.count({
    where: {
      role: 'student',
      OR: [
        { averageScore: { lt: 60, gt: 0 } },
        { accuracyRate: { lt: 50, gt: 0 } },
        { lastActiveDate: { lt: fourteenDaysAgo } },
      ],
    },
  });

  // Popular Subjects
  const popularSubjectsData = await prisma.quiz.groupBy({
    by: ['subjectName'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const popularSubjects = popularSubjectsData.map((s) => ({
    _id: s.subjectName,
    count: s._count.id,
  }));

  // Daily attempts trend (last 7 days)
  const recentAttempts = await prisma.quizAttempt.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, percentage: true },
  });

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalStudents,
        totalQuizzes,
        totalAttempts,
        totalCourses,
        openTickets,
        atRiskStudents: atRiskCount,
        activeUsers: activeUsersCount,
        totalTokensUsed: totalTokens,
        averagePerformance,
      },
      popularSubjects,
      recentAttemptsCount: recentAttempts.length,
    },
  });
});

// At-Risk Students Intelligence
export const getAtRiskStudents = asyncHandler(async (req: Request, res: Response) => {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  const students = await prisma.user.findMany({
    where: {
      role: 'student',
      OR: [
        { averageScore: { lt: 60, gt: 0 } },
        { accuracyRate: { lt: 50, gt: 0 } },
        { lastActiveDate: { lt: fourteenDaysAgo } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      averageScore: true,
      accuracyRate: true,
      studyStreak: true,
      totalQuizCount: true,
      lastActiveDate: true,
      riskLevel: true,
      riskReason: true,
      learningSpeed: true,
      createdAt: true,
    },
    orderBy: { averageScore: 'asc' },
  });

  const enriched = students.map((s) => {
    let riskLevel = s.riskLevel || 'medium';
    let riskReason = s.riskReason || '';

    const isInactive = !s.lastActiveDate || new Date(s.lastActiveDate) < fourteenDaysAgo;
    const isLowScore = s.averageScore > 0 && s.averageScore < 50;

    if (isLowScore && isInactive) {
      riskLevel = 'critical';
      riskReason = 'Low quiz accuracy (<50%) and inactive for over 14 days.';
    } else if (isLowScore) {
      riskLevel = 'high';
      riskReason = `Consistently struggling with assessments (Avg: ${s.averageScore}%).`;
    } else if (isInactive) {
      riskLevel = 'high';
      riskReason = 'Sudden learning drop-off / zero activity in 2+ weeks.';
    } else {
      riskLevel = 'medium';
      riskReason = 'Moderate performance dip detected in recent practice sessions.';
    }

    return {
      ...s,
      _id: s.id,
      riskLevel,
      riskReason,
      recommendedIntervention:
        riskLevel === 'critical'
          ? 'Dispatch automated recovery study plan and 1-on-1 AI tutor review session.'
          : riskLevel === 'high'
          ? 'Trigger encouraging nudge notification and foundational practice quiz.'
          : 'Send reminder for weekly learning goals and study streaks.',
    };
  });

  res.status(200).json({
    success: true,
    data: enriched,
  });
});

// Trigger Intervention for a student
export const triggerStudentIntervention = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { action, customMessage } = req.body;

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  const adminUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });

  const message =
    customMessage ||
    (action === 'nudge'
      ? "We noticed you haven't practiced lately! Jump back into your learning journey and earn +50 bonus XP today."
      : action === 'study_plan'
      ? 'A personalized recovery study roadmap has been assigned to help you master challenging topics.'
      : 'Your mentor has recommended an AI Tutor review session to boost your confidence.');

  await prisma.notification.create({
    data: {
      userId: studentId,
      title: 'Personal Learning Support',
      message,
      type: 'recommendation',
      link: '/study-planner',
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      actorId: req.user!.userId,
      actorName: adminUser?.name || 'Admin',
      actorEmail: adminUser?.email || '',
      action: 'DISPATCH_INTERVENTION',
      targetType: 'User',
      targetId: studentId,
      details: JSON.stringify({ action, message }),
    },
  });

  res.status(200).json({
    success: true,
    message: `Intervention sent to ${student.name}`,
  });
});

// User Management
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, search, status } = req.query;

  const where: any = {};
  if (role) where.role = String(role);
  if (status) where.status = String(status);
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      xp: true,
      level: true,
      studyStreak: true,
      lastActiveDate: true,
      totalQuizCount: true,
      averageScore: true,
      accuracyRate: true,
      totalStudyTimeMinutes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedUsers = users.map((u) => ({
    _id: u.id,
    ...u,
  }));

  res.status(200).json({
    success: true,
    data: { users: formattedUsers },
  });
});

// Detailed User Profile for Admin Inspection
export const getDetailedUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      quizAttempts: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          quiz: {
            select: { title: true, subjectName: true },
          },
        },
      },
      goals: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      certificates: true,
      studyPlans: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { passwordHash, ...safeUser } = user as any;

  res.status(200).json({
    success: true,
    data: safeUser,
  });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, status } = req.body;

  const allowedRoles = ['student', 'admin', 'teacher', 'content_manager', 'support', 'super_admin'];
  if (role && !allowedRoles.includes(role)) {
    throw new AppError('Invalid role specified', 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const adminUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user!.userId,
      actorName: adminUser?.name || 'Admin',
      actorEmail: adminUser?.email || '',
      action: 'UPDATE_USER_ROLE_STATUS',
      targetType: 'User',
      targetId: id,
      details: JSON.stringify({ role, status }),
    },
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { userId: updated.id, role: updated.role, status: updated.status },
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === req.user!.userId) {
    throw new AppError('You cannot delete your own admin account', 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const adminUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });

  await prisma.user.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorId: req.user!.userId,
      actorName: adminUser?.name || 'Admin',
      actorEmail: adminUser?.email || '',
      action: 'DELETE_USER',
      targetType: 'User',
      targetId: id,
      details: JSON.stringify({ deletedEmail: user.email }),
    },
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Question Bank & Quality Control
export const getQuestionBank = asyncHandler(async (req: Request, res: Response) => {
  const { subjectName, status, difficulty } = req.query;

  const where: any = {};
  if (subjectName) where.subjectName = String(subjectName);
  if (status) where.status = String(status);
  if (difficulty) where.difficulty = String(difficulty);

  const questions = await prisma.questionBankItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: questions,
  });
});

export const createQuestionBankItem = asyncHandler(async (req: Request, res: Response) => {
  const { questionText, options, correctAnswer, explanation, subjectName, topicName, difficulty, marks } = req.body;

  if (!questionText || !options || !correctAnswer || !subjectName) {
    throw new AppError('Question text, options, correctAnswer, and subjectName are required', 400);
  }

  const item = await prisma.questionBankItem.create({
    data: {
      questionText,
      options,
      correctAnswer,
      explanation: explanation || '',
      subjectName,
      topicName: topicName || 'General',
      difficulty: difficulty || 'intermediate',
      marks: marks ? Number(marks) : 1,
      status: 'approved',
      isAiGenerated: false,
      createdBy: req.user?.userId || null,
    },
  });

  res.status(201).json({
    success: true,
    data: item,
    message: 'Question added to bank',
  });
});

export const updateQuestionStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const item = await prisma.questionBankItem.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
    },
  });

  res.status(200).json({
    success: true,
    data: item,
    message: 'Question status updated',
  });
});

// Course Management
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: {
          lessons: true,
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: courses,
  });
});

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, subjectName, difficulty, isPublished } = req.body;

  if (!title || !subjectName) {
    throw new AppError('Title and subjectName are required', 400);
  }

  const course = await prisma.course.create({
    data: {
      title,
      description: description || '',
      subjectName,
      difficulty: difficulty || 'intermediate',
      isPublished: isPublished ?? true,
      createdBy: req.user?.userId || null,
    },
  });

  res.status(201).json({
    success: true,
    data: course,
    message: 'Course created successfully',
  });
});

export const createCourseModule = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { title, description, order } = req.body;

  const moduleItem = await prisma.courseModule.create({
    data: {
      courseId,
      title,
      description: description || '',
      order: order ? Number(order) : 1,
    },
  });

  res.status(201).json({
    success: true,
    data: moduleItem,
    message: 'Module added',
  });
});

export const createCourseLesson = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const { title, content, order, durationMinutes } = req.body;

  const lesson = await prisma.courseLesson.create({
    data: {
      moduleId,
      title,
      content: content || '',
      order: order ? Number(order) : 1,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 15,
    },
  });

  res.status(201).json({
    success: true,
    data: lesson,
    message: 'Lesson added',
  });
});

// AI Analytics & Settings
export const getAiAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const totalTokens = await prisma.aIUsage.aggregate({
    _sum: { tokensUsed: true },
  });

  const featureBreakdown = await prisma.aIUsage.groupBy({
    by: ['actionType'],
    _sum: { tokensUsed: true },
    _count: { id: true },
  });

  const recentAiLogs = await prisma.aIUsage.findMany({
    take: 25,
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: {
      totalTokensUsed: totalTokens._sum.tokensUsed || 0,
      featureBreakdown,
      recentAiLogs,
      modelConfig: {
        activeModel: 'gemini-2.5-flash',
        temperature: 0.7,
        eli10ModeEnabled: true,
        voiceTtsEnabled: true,
        safetyLevel: 'Standard Educational Filtering',
      },
    },
  });
});

// Audit Logs
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: { name: true, email: true, role: true },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: logs,
  });
});
