import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AIService } from '../services/openai.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';
import { formatQuiz } from './quiz.controller.js';
import pdfParse from 'pdf-parse';

const formatMaterial = (m: any) => {
  if (!m) return null;
  return {
    _id: m.id,
    id: m.id,
    userId: m.userId,
    title: m.title,
    fileType: m.fileType,
    fileSize: m.fileSize,
    extractedText: m.extractedText,
    summary: m.summary,
    keyTopics: m.keyTopics || [],
    uploadedAt: m.uploadedAt,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
};

export const uploadMaterial = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { title } = req.body;
  const file = req.file;

  let extractedText = '';
  let fileType: 'pdf' | 'text' = 'text';

  if (file) {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      fileType = 'pdf';
      try {
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text;
      } catch (err) {
        extractedText = file.buffer.toString('utf-8');
      }
    } else {
      extractedText = file.buffer.toString('utf-8');
    }
  } else if (req.body.text) {
    extractedText = req.body.text;
  } else {
    throw new AppError('File or text content is required', 400);
  }

  if (!extractedText.trim()) {
    throw new AppError('Could not extract readable text from file', 400);
  }

  // Analyze Material using AI Service
  const analysis = await AIService.analyzeMaterial(extractedText);

  const material = await prisma.studyMaterial.create({
    data: {
      userId,
      title: title || file?.originalname || 'Study Notes Document',
      fileType,
      fileSize: file?.size || extractedText.length,
      extractedText,
      summary: analysis.summary,
      keyTopics: analysis.keyTopics,
      uploadedAt: new Date(),
    },
  });

  res.status(201).json({
    success: true,
    message: 'Study material uploaded and processed successfully',
    data: { material: formatMaterial(material) },
  });
});

export const getMaterials = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const materials = await prisma.studyMaterial.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: { materials: materials.map(formatMaterial) },
  });
});

export const getMaterialById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const material = await prisma.studyMaterial.findFirst({
    where: { id, userId },
  });

  if (!material) {
    throw new AppError('Study material not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { material: formatMaterial(material) },
  });
});

export const askMaterialAI = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { question } = req.body;

  if (!question) {
    throw new AppError('Question is required', 400);
  }

  const material = await prisma.studyMaterial.findFirst({
    where: { id, userId },
  });

  if (!material) {
    throw new AppError('Study material not found', 404);
  }

  const promptMessage = `Grounded Question on Uploaded Document (${material.title}):
Document Summary: ${material.summary}
Document Context Snippet: ${material.extractedText.slice(0, 4000)}

User Question: ${question}`;

  const aiReply = await AIService.generateTutorResponse({
    message: promptMessage,
    conversationHistory: [],
    subjectName: material.title,
    level: 'intermediate',
  });

  await prisma.aIUsage.create({
    data: {
      userId,
      actionType: 'summarize_material',
      tokensUsed: 350,
    },
  });

  res.status(200).json({
    success: true,
    data: { answer: aiReply },
  });
});

export const generateQuizFromMaterial = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { questionCount = 5, difficulty = 'intermediate' } = req.body;

  const material = await prisma.studyMaterial.findFirst({
    where: { id, userId },
  });

  if (!material) {
    throw new AppError('Study material not found', 404);
  }

  const topicName = material.keyTopics[0] || material.title;

  const generatedAIQuiz = await AIService.generateQuiz({
    subjectName: material.title,
    topicName,
    difficulty,
    questionCount: Number(questionCount),
    questionType: 'mixed',
  });

  const quiz = await prisma.quiz.create({
    data: {
      title: `Quiz: ${material.title}`,
      subjectName: material.title,
      topicName,
      difficulty,
      questionType: 'mixed',
      questionCount: generatedAIQuiz.questionCount,
      createdBy: userId,
      isAiGenerated: true,
      questions: {
        create: generatedAIQuiz.questions.map((q: any) => ({
          questionText: q.questionText,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic || 'General',
        })),
      },
    },
    include: {
      questions: true,
    },
  });

  await prisma.aIUsage.create({
    data: {
      userId,
      actionType: 'quiz_from_notes',
      tokensUsed: 500,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Quiz generated from study material',
    data: { quiz: formatQuiz(quiz) },
  });
});
