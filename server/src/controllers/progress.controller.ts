import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { formatAttempt } from './attempt.controller.js';

export const getStudentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get recent 5 quiz attempts
  const recentAttempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: true,
      answers: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 5,
  });

  // Analyze Weak & Strong Topics across all attempts
  const allAttempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: { quiz: true },
  });

  const weakTopicCount: Record<string, number> = {};
  const strongTopicCount: Record<string, number> = {};

  allAttempts.forEach((att) => {
    (att.weakTopics || []).forEach((wt) => {
      if (wt) weakTopicCount[wt] = (weakTopicCount[wt] || 0) + 1;
    });
    (att.strongTopics || []).forEach((st) => {
      if (st) strongTopicCount[st] = (strongTopicCount[st] || 0) + 1;
    });
  });

  const sortedWeak = Object.entries(weakTopicCount)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  const sortedStrong = Object.entries(strongTopicCount)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  const recommendedTopics =
    sortedWeak.length > 0
      ? sortedWeak.slice(0, 3)
      : ['Data Structures', 'Operating Systems', 'Algorithms'];

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalQuizzes: user.totalQuizCount,
        averageScore: user.averageScore,
        accuracy: user.accuracyRate,
        studyTimeMinutes: user.totalStudyTimeMinutes,
        currentStreak: user.studyStreak,
      },
      recentQuizzes: recentAttempts.map(formatAttempt),
      strongTopics: sortedStrong.slice(0, 5),
      weakTopics: sortedWeak.slice(0, 5),
      recommendedTopics,
    },
  });
});

export const getProgressAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: { quiz: true },
    orderBy: { completedAt: 'asc' },
  });

  const sessions = await prisma.studySession.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });

  const achievements = await prisma.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
  });

  // 1. Score Over Time
  const scoreOverTime = attempts.map((att, idx) => ({
    attempt: `Quiz ${idx + 1}`,
    date: new Date(att.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: att.percentage,
    accuracy: att.accuracy,
    title: att.quiz?.title || 'Quiz',
  }));

  // 2. Subject Performance
  const subjectStats: Record<string, { totalPct: number; count: number }> = {};
  attempts.forEach((att) => {
    const subj = att.quiz?.subjectName || 'General';
    if (!subjectStats[subj]) {
      subjectStats[subj] = { totalPct: 0, count: 0 };
    }
    subjectStats[subj].totalPct += att.percentage;
    subjectStats[subj].count += 1;
  });

  const subjectPerformance = Object.entries(subjectStats).map(([subject, stat]) => ({
    subject,
    averageScore: Math.round(stat.totalPct / stat.count),
    quizzesTaken: stat.count,
  }));

  // 3. Difficulty Performance
  const difficultyStats: Record<string, { totalPct: number; count: number }> = {
    beginner: { totalPct: 0, count: 0 },
    intermediate: { totalPct: 0, count: 0 },
    advanced: { totalPct: 0, count: 0 },
  };

  attempts.forEach((att) => {
    const diff = att.quiz?.difficulty || 'intermediate';
    if (difficultyStats[diff]) {
      difficultyStats[diff].totalPct += att.percentage;
      difficultyStats[diff].count += 1;
    }
  });

  const difficultyPerformance = Object.entries(difficultyStats).map(([difficulty, stat]) => ({
    difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
    averageScore: stat.count > 0 ? Math.round(stat.totalPct / stat.count) : 0,
    count: stat.count,
  }));

  // 4. Study Time Distribution
  const studyTimeByDate: Record<string, number> = {};
  sessions.forEach((s) => {
    const dStr = new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    studyTimeByDate[dStr] = (studyTimeByDate[dStr] || 0) + s.durationMinutes;
  });

  const studyTimeChart = Object.entries(studyTimeByDate).map(([date, minutes]) => ({
    date,
    minutes,
  }));

  const formattedAchievements = achievements.map((a) => ({
    _id: a.id,
    id: a.id,
    badgeName: a.badgeName,
    badgeIcon: a.badgeIcon,
    description: a.description,
    unlockedAt: a.unlockedAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      scoreOverTime,
      subjectPerformance,
      difficultyPerformance,
      studyTimeChart,
      achievements: formattedAchievements,
    },
  });
});

/**
 * AI Learning DNA Profile
 */
export const getLearningDNA = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const [user, attempts, materialsCount, convoCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.quizAttempt.findMany({ where: { userId }, include: { quiz: true } }),
    prisma.studyMaterial.count({ where: { userId } }),
    prisma.conversation.count({ where: { userId } }),
  ]);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (attempts.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        hasEnoughData: false,
        message: 'Complete at least one practice quiz to generate your unique AI Learning DNA profile.',
        subjectAffinities: [],
        modalities: { visual: 0, practice: 0, theory: 0 },
        learningSpeed: 'Not enough data yet',
        consistency: 'Not enough data yet',
        totalAssessments: 0,
      },
    });
  }

  // Calculate subject affinities
  const subjectMap: Record<string, { totalScore: number; count: number }> = {};
  let totalTime = 0;
  let totalQuestions = 0;

  attempts.forEach((att) => {
    const subj = att.quiz?.subjectName || 'General';
    if (!subjectMap[subj]) subjectMap[subj] = { totalScore: 0, count: 0 };
    subjectMap[subj].totalScore += att.percentage;
    subjectMap[subj].count += 1;
    totalTime += att.timeTakenSeconds;
    totalQuestions += att.totalQuestions;
  });

  const subjectAffinities = Object.entries(subjectMap).map(([subject, stat]) => ({
    subject,
    score: Math.round(stat.totalScore / stat.count),
    quizCount: stat.count,
  }));

  // Modalities
  const totalInteractions = attempts.length + materialsCount + convoCount || 1;
  const practiceScore = Math.min(100, Math.round((attempts.length / totalInteractions) * 100) + 20);
  const visualScore = Math.min(100, Math.round((materialsCount / totalInteractions) * 100) + (user.accuracyRate > 70 ? 25 : 15));
  const theoryScore = Math.min(100, Math.round((convoCount / totalInteractions) * 100) + 20);

  // Learning Speed
  const avgSecondsPerQ = totalQuestions > 0 ? totalTime / totalQuestions : 45;
  const learningSpeed = avgSecondsPerQ < 25 ? 'Fast (Intuitive & Quick)' : avgSecondsPerQ < 50 ? 'Steady (Balanced & Methodical)' : 'Thorough (Deep Deliberation)';

  // Consistency
  const consistency = user.studyStreak >= 7 ? 'Excellent (7+ Day Streak)' : user.studyStreak >= 3 ? 'Good (Consistent Habits)' : 'Developing (Building Daily Routine)';

  res.status(200).json({
    success: true,
    data: {
      hasEnoughData: true,
      subjectAffinities,
      modalities: {
        visual: Math.min(100, Math.max(30, visualScore)),
        practice: Math.min(100, Math.max(40, practiceScore)),
        theory: Math.min(100, Math.max(30, theoryScore)),
      },
      learningSpeed,
      consistency,
      accuracyRate: user.accuracyRate,
      averageScore: user.averageScore,
      totalAssessments: attempts.length,
    },
  });
});

/**
 * AI Skill / Knowledge Gap Analyzer
 */
export const getSkillGapAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: { quiz: true, answers: true },
  });

  if (attempts.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        hasEnoughData: false,
        message: 'No quiz attempts recorded yet. Complete quizzes to identify your knowledge gaps.',
        gaps: [],
      },
    });
  }

  // Aggregate topic accuracies
  const topicStats: Record<string, { totalCorrect: number; totalAnswered: number; subject: string }> = {};

  attempts.forEach((att) => {
    const subj = att.quiz?.subjectName || 'General';
    att.answers.forEach((ans) => {
      const topic = ans.topic || att.quiz?.topicName || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { totalCorrect: 0, totalAnswered: 0, subject: subj };
      }
      topicStats[topic].totalAnswered += 1;
      if (ans.isCorrect) topicStats[topic].totalCorrect += 1;
    });
  });

  const targetMastery = 80; // 80% benchmark target
  const gaps = Object.entries(topicStats).map(([topic, stat]) => {
    const currentMastery = Math.round((stat.totalCorrect / stat.totalAnswered) * 100);
    const gapPercentage = Math.max(0, targetMastery - currentMastery);
    const priority = gapPercentage >= 30 ? 'High' : gapPercentage >= 15 ? 'Medium' : 'Low';
    const recommendation =
      gapPercentage > 0
        ? `Complete targeted ${topic} practice set & review mistake explanations`
        : `Mastery achieved! Proceed to advanced ${topic} challenges`;

    return {
      topic,
      subject: stat.subject,
      currentMastery,
      targetMastery,
      gapPercentage,
      priority,
      recommendation,
      questionsAttempted: stat.totalAnswered,
    };
  });

  // Sort by gap percentage descending (highest gap first)
  gaps.sort((a, b) => b.gapPercentage - a.gapPercentage);

  res.status(200).json({
    success: true,
    data: {
      hasEnoughData: true,
      targetMastery,
      gaps,
    },
  });
});

/**
 * Adaptive Learning Roadmap
 */
export const getAdaptiveRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const subjectQuery = (req.query.subject as string) || 'Computer Science';

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: { quiz: true, answers: true },
  });

  // Build topic performance lookup
  const topicMasteryMap: Record<string, number> = {};
  attempts.forEach((att) => {
    const topic = att.quiz?.topicName || 'General';
    if (!topicMasteryMap[topic] || att.percentage > topicMasteryMap[topic]) {
      topicMasteryMap[topic] = att.percentage;
    }
  });

  // Pre-defined structured roadmap for Computer Science & Python
  const defaultNodes = [
    { id: 'node_1', title: 'Variables & Data Types', topic: 'Variables', order: 1, prereq: null },
    { id: 'node_2', title: 'Conditional Statements & Logic', topic: 'Conditionals', order: 2, prereq: 'node_1' },
    { id: 'node_3', title: 'Loops & Iterations', topic: 'Loops', order: 3, prereq: 'node_2' },
    { id: 'node_4', title: 'Functions & Modular Design', topic: 'Functions', order: 4, prereq: 'node_3' },
    { id: 'node_5', title: 'Data Structures (Arrays, Lists, Maps)', topic: 'Data Structures', order: 5, prereq: 'node_4' },
    { id: 'node_6', title: 'Object-Oriented Programming (OOP)', topic: 'OOP', order: 6, prereq: 'node_5' },
    { id: 'node_7', title: 'Algorithms & Complexity Analysis', topic: 'Algorithms', order: 7, prereq: 'node_6' },
  ];

  let completedCount = 0;
  const evaluatedNodes = defaultNodes.map((node, idx) => {
    const mastery = topicMasteryMap[node.topic] ?? null;
    let status: 'completed' | 'needs_revision' | 'unlocked' | 'locked' = 'locked';

    if (idx === 0) {
      status = mastery !== null ? (mastery >= 70 ? 'completed' : 'needs_revision') : 'unlocked';
    } else {
      const prevNodeCompleted = idx > 0 && (topicMasteryMap[defaultNodes[idx - 1].topic] ?? 0) >= 70;
      if (mastery !== null) {
        status = mastery >= 70 ? 'completed' : 'needs_revision';
      } else if (prevNodeCompleted || idx === 1) {
        status = 'unlocked';
      } else {
        status = 'locked';
      }
    }

    if (status === 'completed') completedCount++;

    return {
      ...node,
      status,
      masteryScore: mastery,
    };
  });

  const overallProgress = Math.round((completedCount / defaultNodes.length) * 100);

  res.status(200).json({
    success: true,
    data: {
      subject: subjectQuery,
      overallProgress,
      nodes: evaluatedNodes,
    },
  });
});
