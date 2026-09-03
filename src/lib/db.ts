import { PrismaClient } from '@prisma/client';
import { PrismaNeonHTTP } from '@prisma/adapter-neon';

const prismaClientSingleton = () => {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  // 清除任何可能的隱藏字元
  connectionString = connectionString.trim().replace(/^["']|["']$/g, '');

  // 使用 Neon HTTP driver adapter 繞過 Prisma native engine (TCP/SNI) 以及 ws Pool 的問題
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeonHTTP(connectionString, {} as any);

  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}