import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import crypto from 'crypto';

export const getPublishedCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let userEnrollments: Record<string, any> = {};
  if (userId) {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
    });
    enrollments.forEach((e) => {
      userEnrollments[e.courseId] = e;
    });
  }

  const formattedCourses = courses.map((course) => {
    let totalLessons = 0;
    let totalDurationMinutes = 0;
    course.modules.forEach((m) => {
      totalLessons += m.lessons.length;
      m.lessons.forEach((l) => {
        totalDurationMinutes += l.durationMinutes || 15;
      });
    });

    const enrollment = userEnrollments[course.id] || null;

    return {
      id: course.id,
      _id: course.id,
      title: course.title,
      description: course.description,
      subjectName: course.subjectName,
      difficulty: course.difficulty,
      isPublished: course.isPublished,
      xpReward: course.xpReward ?? 250,
      hasCertificate: course.hasCertificate ?? true,
      certificateTitle: course.certificateTitle || `Certificate of Mastery: ${course.title}`,
      moduleCount: course.modules.length,
      lessonCount: totalLessons,
      totalDurationMinutes,
      createdAt: course.createdAt,
      modules: course.modules,
      enrollment: enrollment
        ? {
            isEnrolled: true,
            progressPercent: enrollment.progressPercent,
            completedLessons: enrollment.completedLessons,
            isCompleted: enrollment.isCompleted,
            completedAt: enrollment.completedAt,
            certificateId: enrollment.certificateId,
            xpAwarded: enrollment.xpAwarded,
          }
        : {
            isEnrolled: false,
            progressPercent: 0,
            completedLessons: [],
            isCompleted: false,
          },
    };
  });

  res.status(200).json({
    success: true,
    data: formattedCourses,
  });
});

export const getCourseById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  let enrollment = null;
  if (userId) {
    enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: id,
        },
      },
    });
  }

  let totalLessons = 0;
  let totalDurationMinutes = 0;
  course.modules.forEach((m) => {
    totalLessons += m.lessons.length;
    m.lessons.forEach((l) => {
      totalDurationMinutes += l.durationMinutes || 15;
    });
  });

  res.status(200).json({
    success: true,
    data: {
      ...course,
      _id: course.id,
      xpReward: course.xpReward ?? 250,
      hasCertificate: course.hasCertificate ?? true,
      certificateTitle: course.certificateTitle || `Certificate of Mastery: ${course.title}`,
      lessonCount: totalLessons,
      totalDurationMinutes,
      enrollment: enrollment || {
        isEnrolled: false,
        progressPercent: 0,
        completedLessons: [],
        isCompleted: false,
      },
    },
  });
});

export const enrollCourse = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const enrollment = await prisma.courseEnrollment.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId: id,
      },
    },
    create: {
      userId,
      courseId: id,
      progressPercent: 0,
      completedLessons: [],
      isCompleted: false,
    },
    update: {},
  });

  res.status(200).json({
    success: true,
    data: enrollment,
    message: 'Enrolled in course successfully',
  });
});

export const completeLesson = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id: courseId, lessonId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Find or create enrollment
  let enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (!enrollment) {
    enrollment = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        progressPercent: 0,
        completedLessons: [],
        isCompleted: false,
      },
    });
  }

  // Calculate completed lessons
  const currentCompleted = new Set(enrollment.completedLessons || []);
  currentCompleted.add(lessonId);
  const updatedCompletedList = Array.from(currentCompleted);

  // Total lessons in course
  let allLessonIds: string[] = [];
  course.modules.forEach((m) => {
    m.lessons.forEach((l) => allLessonIds.push(l.id));
  });

  const totalLessons = allLessonIds.length || 1;
  const progressPercent = Math.min(
    100,
    Math.round((updatedCompletedList.length / totalLessons) * 100)
  );

  const willComplete = progressPercent >= 100 && !enrollment.isCompleted;
  let issuedCertificate = null;
  const xpReward = course.xpReward ?? 250;

  if (willComplete) {
    // 1. Award XP to User
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpReward },
      },
    });

    // 2. Generate and Issue Verified Certificate if enabled
    if (course.hasCertificate) {
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const certificateId = `CERT-EDU-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
      const verificationCode = `VERIFY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      issuedCertificate = await prisma.certificate.create({
        data: {
          userId,
          courseId: course.id,
          certificateId,
          verificationCode,
          title: course.certificateTitle || `Certificate of Mastery: ${course.title}`,
          subjectName: course.subjectName,
          score: 100,
          issuedAt: new Date(),
        },
      });
    }

    // 3. Create Congratulations Notification
    await prisma.notification.create({
      data: {
        userId,
        title: '🎉 Course Completed!',
        message: `Congratulations! You mastered "${course.title}", earned +${xpReward} XP${
          issuedCertificate ? ' and unlocked your official Verified Certificate' : ''
        }!`,
        type: 'achievement',
        link: '/certificates',
      },
    });

    // 4. Unlock Achievement Badge if not already unlocked
    try {
      await prisma.achievement.upsert({
        where: {
          userId_badgeName: {
            userId,
            badgeName: 'Course Graduate',
          },
        },
        create: {
          userId,
          badgeName: 'Course Graduate',
          badgeIcon: 'Award',
          description: `Mastered and graduated from ${course.title}`,
        },
        update: {},
      });
    } catch (e) {
      // ignore
    }
  }

  // Update enrollment state
  const updatedEnrollment = await prisma.courseEnrollment.update({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    data: {
      completedLessons: updatedCompletedList,
      progressPercent,
      isCompleted: enrollment.isCompleted || willComplete,
      completedAt: willComplete ? new Date() : enrollment.completedAt,
      certificateId: issuedCertificate ? issuedCertificate.id : enrollment.certificateId,
      xpAwarded: willComplete ? xpReward : enrollment.xpAwarded,
    },
  });

  res.status(200).json({
    success: true,
    data: {
      enrollment: updatedEnrollment,
      isNewlyCompleted: willComplete,
      xpAwarded: willComplete ? xpReward : 0,
      certificate: issuedCertificate,
    },
    message: willComplete
      ? `Course 100% completed! +${xpReward} XP awarded & certificate generated.`
      : 'Lesson marked as complete.',
  });
});
