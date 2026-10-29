import { prisma } from './prisma.js';

export const connectDB = async (retries: number = 3, delayMs: number = 3000): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Connecting to PostgreSQL database (attempt ${attempt}/${retries})...`);
      await prisma.$connect();
      const result = await prisma.$queryRaw`SELECT current_database(), current_schema();`;
      console.log('✅ PostgreSQL Connected Successfully via Prisma!');
      console.log('📊 Database Details:', result);
      return true;
    } catch (error) {
      console.warn(`⚠️ PostgreSQL connection attempt ${attempt} failed (${error instanceof Error ? error.message : String(error)})`);
      if (attempt < retries) {
        console.log(`⏳ Waiting ${delayMs / 1000}s for Neon database cold-start...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        console.error('❌ PostgreSQL Connection Error after retries:', error instanceof Error ? error.message : String(error));
        return false;
      }
    }
  }
  return false;
};
