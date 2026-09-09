import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

export const getMyCertificates = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const certificates = await prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: certificates,
  });
});

export const getCertificateById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!cert) {
    throw new AppError('Certificate not found', 404);
  }

  res.status(200).json({
    success: true,
    data: cert,
  });
});

export const verifyCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;

  const cert = await prisma.certificate.findFirst({
    where: {
      OR: [
        { verificationCode: code.toUpperCase() },
        { certificateId: code.toUpperCase() },
      ],
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!cert) {
    return res.status(404).json({
      success: false,
      message: 'Invalid certificate code. No verified certificate found.',
    });
  }

  res.status(200).json({
    success: true,
    verified: true,
    data: {
      certificateId: cert.certificateId,
      verificationCode: cert.verificationCode,
      recipientName: cert.user.name,
      title: cert.title,
      subjectName: cert.subjectName,
      score: cert.score,
      issuedAt: cert.issuedAt,
    },
  });
});
