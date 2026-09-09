import { prisma } from './prisma.js';

export const connectDB = async (): Promise<boolean> => {
  try {
    console.log('🔄 Connecting to PostgreSQL database (academia_portal)...');
    await prisma.$connect();
    // Test a basic query
    const result = await prisma.$queryRaw`SELECT current_database(), current_schema();`;
    console.log('✅ PostgreSQL Connected Successfully via Prisma!');
    console.log('📊 Database Details:', result);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error instanceof Error ? error.message : String(error));
    return false;
  }
};
