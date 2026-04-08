import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Prisma Database Manager
 *
 * Singleton pattern for managing PostgreSQL connection using Prisma ORM
 */

let prismaInstance: PrismaClient | null = null;
let poolInstance: Pool | null = null;

/**
 * Get or create Prisma Client instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    // Create PostgreSQL connection pool
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Create Prisma adapter
    const adapter = new PrismaPg(poolInstance);

    // Create Prisma Client with adapter
    prismaInstance = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    console.log('✅ Prisma Client initialized');
  }

  return prismaInstance;
}

/**
 * Export singleton instance
 */
export const prisma = getPrismaClient();

/**
 * Gracefully shutdown database connection
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    console.log('✅ Prisma Client disconnected');
  }

  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    console.log('✅ PostgreSQL pool closed');
  }
}

/**
 * Handle process shutdown
 */
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
