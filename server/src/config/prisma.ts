import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rawConnectionString = (process.env.DATABASE_URL || '').replace(/"/g, '').trim();
// Strip incompatible parameters for node-postgres and enforce SSL
const connectionString = rawConnectionString
  .replace(/[\?&]channel_binding=[^&]+/, '')
  .replace(/sslmode=verify-full/, 'sslmode=require');

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
});
const urlSchemaMatch = connectionString.match(/schema=([^&]+)/);
const schema = urlSchemaMatch ? urlSchemaMatch[1] : 'public';
const adapter = new PrismaPg(pool, { schema });

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
