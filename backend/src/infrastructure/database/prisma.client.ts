/**
 * prisma.client.ts
 * Singleton do PrismaClient — Camada de Infraestrutura
 *
 * Garante que apenas uma instância do PrismaClient seja criada
 * durante o ciclo de vida da aplicação (padrão recomendado pelo Prisma).
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
