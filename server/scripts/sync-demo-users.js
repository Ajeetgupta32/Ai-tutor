import bcrypt from 'bcryptjs';
import { prisma } from '../dist/config/prisma.js';

async function main() {
  console.log('🔄 Checking & syncing Admin and Demo User accounts...');

  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('harshita123', adminSalt);

  // 1. Ensure harshita123@gmail.com exists as Admin
  const admin = await prisma.user.upsert({
    where: { email: 'harshita123@gmail.com' },
    update: {
      passwordHash: adminHash,
      role: 'admin',
      isEmailVerified: true,
      name: 'Harshita Admin',
    },
    create: {
      name: 'Harshita Admin',
      email: 'harshita123@gmail.com',
      passwordHash: adminHash,
      role: 'admin',
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin Account Synced: ${admin.email} (Role: ${admin.role})`);

  // 2. Ensure NO OTHER user has the 'admin' role
  const demotedAdmins = await prisma.user.updateMany({
    where: {
      role: 'admin',
      email: { not: 'harshita123@gmail.com' },
    },
    data: {
      role: 'student',
    },
  });
  console.log(`🛡️ Other admins demoted to student: ${demotedAdmins.count}`);

  // 3. Ensure Demo Student accounts exist with verified status and known passwords
  const studentSalt = await bcrypt.genSalt(10);
  const studentHash = await bcrypt.hash('student123', studentSalt);

  const demoStudent1 = await prisma.user.upsert({
    where: { email: 'student@edumentor.ai' },
    update: {
      passwordHash: studentHash,
      role: 'student',
      isEmailVerified: true,
      name: 'Demo Student',
    },
    create: {
      name: 'Demo Student',
      email: 'student@edumentor.ai',
      passwordHash: studentHash,
      role: 'student',
      isEmailVerified: true,
    },
  });
  console.log(`✅ Demo Student Synced: ${demoStudent1.email} (Password: student123)`);

  const demoHash2 = await bcrypt.hash('demo123', studentSalt);
  const demoStudent2 = await prisma.user.upsert({
    where: { email: 'demo@edumentor.ai' },
    update: {
      passwordHash: demoHash2,
      role: 'student',
      isEmailVerified: true,
      name: 'Demo User',
    },
    create: {
      name: 'Demo User',
      email: 'demo@edumentor.ai',
      passwordHash: demoHash2,
      role: 'student',
      isEmailVerified: true,
    },
  });
  console.log(`✅ Demo User Synced: ${demoStudent2.email} (Password: demo123)`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Error syncing accounts:', err);
  process.exit(1);
});
