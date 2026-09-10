import { prisma } from './config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding PostgreSQL database for EduMentor AI...');

  // 1. Seed & Enforce Single Admin (harshita123@gmail.com)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('harshita123', salt);
  const studentPassword = await bcrypt.hash('student123', salt);

  const adminEmail = 'harshita123@gmail.com';

  // Demote any other admins to student so only one admin exists
  const demoteResult = await prisma.user.updateMany({
    where: {
      role: 'admin',
      email: { not: adminEmail },
    },
    data: {
      role: 'student',
    },
  });
  if (demoteResult.count > 0) {
    console.log(`ℹ️ Demoted ${demoteResult.count} other admin account(s) to 'student'.`);
  }

  // Upsert the single official Admin
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Harshita',
      passwordHash: adminPassword,
      role: 'admin',
      isEmailVerified: true,
      status: 'active',
    },
    create: {
      name: 'Harshita',
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'admin',
      isEmailVerified: true,
      status: 'active',
      level: 'advanced',
    },
  });
  console.log(`👑 Configured sole Admin: ${adminUser.email} (Password: harshita123)`);

  // Ensure default demo student exists
  const demoStudent = await prisma.user.upsert({
    where: { email: 'student@edumentor.ai' },
    update: {
      role: 'student',
      isEmailVerified: true,
    },
    create: {
      name: 'Alex Student',
      email: 'student@edumentor.ai',
      passwordHash: studentPassword,
      role: 'student',
      level: 'intermediate',
      isEmailVerified: true,
    },
  });
  console.log(`👤 Configured Student: ${demoStudent.email}`);

  // 2. Seed Default Subjects & Topics
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

  for (const s of defaultSubjects) {
    const existing = await prisma.subject.findUnique({
      where: { name: s.name },
    });

    if (!existing) {
      const created = await prisma.subject.create({
        data: {
          name: s.name,
          code: s.code,
          description: s.description,
          icon: s.icon,
          isDefault: true,
          topics: {
            create: s.topics.map((t) => ({
              name: t.name,
              description: t.description,
              difficulty: t.difficulty,
            })),
          },
        },
      });
      console.log(`✅ Created subject: ${created.name}`);
    } else {
      console.log(`ℹ️ Subject already exists: ${existing.name}`);
    }
  }

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
