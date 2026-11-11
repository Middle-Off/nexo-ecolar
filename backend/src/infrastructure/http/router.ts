/**
 * router.ts
 * Configuração das rotas da API — Camada de Infraestrutura HTTP
 *
 * Monta as rotas do Express e injeta as dependências (Dependency Injection manual).
 */

import { Router } from 'express';
import { prisma } from '../database/prisma.client';
import { PrismaAttendanceRepository } from '../database/prisma-attendance-repository';
import { RegisterAttendanceUseCase } from '../../application/use-cases/register-attendance.use-case';
import { AttendanceController } from '../../interfaces/controllers/attendance.controller';
import {
  authMiddleware,
  requirePerfil,
} from '../../interfaces/middlewares/auth.middleware';

const router = Router();

// ─── Instanciação das dependências (Composição Raiz) ─────────────────────────

const attendanceRepository = new PrismaAttendanceRepository(prisma);
const registerAttendanceUseCase = new RegisterAttendanceUseCase(attendanceRepository);
const attendanceController = new AttendanceController(registerAttendanceUseCase);

// ─── Rotas de Frequência ──────────────────────────────────────────────────────

/**
 * POST /api/attendance
 * Registra a chamada completa de uma aula.
 * Acesso: PROFESSOR, ADMIN
 */
router.post(
  '/attendance',
  authMiddleware,
  requirePerfil('PROFESSOR', 'ADMIN'),
  (req, res) => attendanceController.registerAttendance(req, res),
);

// ─── Health Check ─────────────────────────────────────────────────────────────

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
