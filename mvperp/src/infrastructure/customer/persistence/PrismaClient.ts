// src/infrastructure/customer/persistence/PrismaClient.ts
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client específico para el módulo Customer
 * Separado del Prisma Client global para mantener independencia
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
});

// Manejar cierre de conexión
process.on('beforeExit', () => {
  prisma.$disconnect();
});