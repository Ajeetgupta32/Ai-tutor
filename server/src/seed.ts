import { prisma } from './config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding PostgreSQL database for EduMentor AI...');

  // 1. Seed Default Users
  const salt = await bcrypt.genSalt(10);
  const studentPassword = await bcrypt.hash('student123', salt);
  const adminPassword = await bcrypt.hash('admin123', salt);

  const defaultUsers = [
    {
      name: 'Alex Student',
      email: 'student@edumentor.ai',
      passwordHash: studentPassword,
      role: 'student',
      level: 'intermediate',
    },
    {
      name: 'Dr. Sarah Admin',
      email: 'admin@edumentor.ai',
      passwordHash: adminPassword,
      role: 'admin',
      level: 'advanced',
    },
  ];

  for (const u of defaultUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const user = await prisma.user.create({ data: u });
      console.log(`👤 Created ${u.role} user: ${user.email} (Password: ${u.role}123)`);
    } else {
      console.log(`ℹ️ User already exists: ${existing.email}`);
    }
  }

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
