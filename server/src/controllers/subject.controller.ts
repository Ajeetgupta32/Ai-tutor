import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSubjects = asyncHandler(async (req: Request, res: Response) => {
  let subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  });

  // Seed default subjects if empty
  if (subjects.length === 0) {
    const defaultSubjects = [
      {
        name: 'Computer Science & Software Engineering',
        code: 'CS101',
        description: 'Data structures, algorithms, databases, OS, and software engineering.',
        icon: 'Code',
        topics: [
          { name: 'Data Structures & Algorithms', description: 'Arrays, Trees, Graphs, Sorting & Searching', difficulty: 'intermediate' },
          { name: 'Database Management Systems', description: 'SQL, Relational Modeling, Indexing, Transactions', difficulty: 'intermediate' },
          { name: 'Operating Systems', description: 'Processes, Threads, Memory Management, Concurrency', difficulty: 'advanced' },
          { name: 'Web Development & APIs', description: 'REST APIs, React, Node.js, Frontend & Backend', difficulty: 'beginner' },
        ],
      },
      {
        name: 'Mathematics & Quantitative Aptitude',
        code: 'MATH101',
        description: 'Calculus, linear algebra, discrete mathematics, and statistics.',
        icon: 'Calculator',
        topics: [
          { name: 'Calculus & Integration', description: 'Derivatives, Integrals, Limits, Series', difficulty: 'intermediate' },
          { name: 'Linear Algebra', description: 'Matrices, Vectors, Eigenvalues, Vector Spaces', difficulty: 'intermediate' },
          { name: 'Probability & Statistics', description: 'Distributions, Hypothesis Testing, Regression', difficulty: 'intermediate' },
          { name: 'Discrete Mathematics', description: 'Sets, Graphs, Combinatorics, Logic', difficulty: 'beginner' },
        ],
      },
      {
        name: 'Physics & Natural Sciences',
        code: 'PHY101',
        description: 'Classical mechanics, electromagnetism, and thermodynamics.',
        icon: 'Atom',
        topics: [
          { name: 'Classical Mechanics', description: 'Newtonian Laws, Kinematics, Energy & Work', difficulty: 'beginner' },
          { name: 'Electromagnetism', description: 'Coulomb Law, Magnetic Fields, Maxwell Equations', difficulty: 'intermediate' },
          { name: 'Thermodynamics', description: 'Laws of Thermodynamics, Heat Transfer, Entropy', difficulty: 'intermediate' },
        ],
      },
      {
        name: 'Business Administration & Management',
        code: 'BUS101',
        description: 'Finance, marketing, strategic management, and economics.',
        icon: 'Briefcase',
        topics: [
          { name: 'Microeconomics & Macroeconomics', description: 'Supply & Demand, Fiscal Policy, Market Structures', difficulty: 'beginner' },
          { name: 'Corporate Finance', description: 'Financial Statements, Valuation, Capital Budgeting', difficulty: 'intermediate' },
          { name: 'Marketing Management', description: 'Consumer Behavior, Branding, Digital Marketing', difficulty: 'beginner' },
        ],
      },
    ];

    for (const item of defaultSubjects) {
      const { topics, ...subjData } = item;
      await prisma.subject.create({
        data: {
          ...subjData,
          topics: {
            create: topics,
          },
        },
      });
    }

    subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
  }

  const formatted = subjects.map((s) => ({
    _id: s.id,
    id: s.id,
    name: s.name,
    code: s.code,
    description: s.description,
    icon: s.icon,
    isDefault: s.isDefault,
  }));

  res.status(200).json({
    success: true,
    data: { subjects: formatted },
  });
});

export const getTopicsBySubject = asyncHandler(async (req: Request, res: Response) => {
  const { subjectId } = req.params;
  const topics = await prisma.topic.findMany({
    where: { subjectId },
  });

  const formatted = topics.map((t) => ({
    _id: t.id,
    id: t.id,
    subjectId: t.subjectId,
    name: t.name,
    description: t.description,
    difficulty: t.difficulty,
  }));

  res.status(200).json({
    success: true,
    data: { topics: formatted },
  });
});
