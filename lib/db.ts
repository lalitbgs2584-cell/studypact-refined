import 'dotenv/config';  // Preloads .env.local automatically—no config() call needed [web:19][web:7]

import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL missing');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaNeon({ 
  connectionString: process.env.DATABASE_URL! 
});

export const db = globalForPrisma.prisma ?? 
  (globalForPrisma.prisma = new PrismaClient({ adapter }));