/**
 * attendance.controller.ts
 * Controller HTTP de Frequência — Camada de Interfaces
 *
 * Adapta as requisições HTTP para os casos de uso da camada de Aplicação.
 */

import { Request, Response } from 'express';
import { RegisterAttendanceUseCase } from '../../application/use-cases/register-attendance.use-case';
import { RegisterAttendanceInputDTO } from '../../application/dtos/register-attendance.dto';

export class AttendanceController {
  constructor(
    private readonly registerAttendanceUseCase: RegisterAttendanceUseCase,
  ) {}

  /**
   * POST /api/attendance
   *
   * Registra a chamada completa de uma aula.
   * Requer: authMiddleware + requirePerfil('PROFESSOR', 'ADMIN')
   */
  async registerAttendance(req: Request, res: Response): Promise<void> {
    try {
      const input: RegisterAttendanceInputDTO = req.body;

      // Validação básica de campos obrigatórios
      if (
        !input.aulaId ||
        !input.turmaId ||
        !input.disciplinaId ||
        !input.professorId ||
        !input.data ||
        !Array.isArray(input.attendances) ||
        input.attendances.length === 0
      ) {
        res.status(400).json({
          error: 'Dados inválidos.',
          message:
            'Os campos aulaId, turmaId, disciplinaId, professorId, data e attendances (não vazio) são obrigatórios.',
        });
        return;
      }

      const output = await this.registerAttendanceUseCase.execute(input);

      res.status(201).json({
        message: 'Chamada registrada com sucesso.',
        data: output,
      });
    } catch (err) {
      const error = err as Error;

      // Erros de regra de negócio (domínio) → 422 Unprocessable Entity
      if (
        error.message.includes('Duplo apontamento') ||
        error.message.includes('matrícula inválida')
      ) {
        res.status(422).json({ error: 'Violação de regra de negócio.', message: error.message });
        return;
      }

      console.error('[AttendanceController] Erro inesperado:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
}
