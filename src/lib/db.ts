import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let dbUrl = process.env.DATABASE_URL || "file:./dev.db";

// Fallback for Vercel Serverless environment (which is read-only except for /tmp)
if (process.env.VERCEL && !process.env.DATABASE_URL) {
  const tmpDbPath = '/tmp/dev.db';
  const localDbPath = path.join(process.cwd(), 'dev.db');
  
  if (!fs.existsSync(tmpDbPath)) {
    if (fs.existsSync(localDbPath)) {
      fs.copyFileSync(localDbPath, tmpDbPath);
    }
  }
  dbUrl = `file:${tmpDbPath}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
