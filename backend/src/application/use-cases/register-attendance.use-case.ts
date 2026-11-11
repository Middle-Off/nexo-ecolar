/**
 * register-attendance.use-case.ts
 * Caso de Uso: Registrar Chamada de uma Aula
 *
 * Camada de Aplicação — orquestra o domínio e os repositórios
 * sem conhecer detalhes de HTTP ou banco de dados.
 */

import {
  AttendanceSession,
  AttendanceStatus,
} from '../../domain/entities/attendance-session';
import { IAttendanceRepository } from '../../domain/repositories/attendance-repository';
import {
  RegisterAttendanceInputDTO,
  RegisterAttendanceOutputDTO,
} from '../dtos/register-attendance.dto';

/**
 * RegisterAttendanceUseCase
 *
 * Fluxo de execução:
 *  1. Recebe o DTO de entrada (lista de alunos + status).
 *  2. Instancia uma AttendanceSession (entidade de domínio) para validar regras de negócio.
 *  3. Registra cada aluno via session.registerStudent() — lança erro em caso de violação.
 *  4. Delega a persistência em lote ao IAttendanceRepository.
 *  5. Retorna o DTO de saída com o resumo da operação.
 */
export class RegisterAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: IAttendanceRepository,
  ) {}

  async execute(
    input: RegisterAttendanceInputDTO,
  ): Promise<RegisterAttendanceOutputDTO> {
    // 1. Cria a sessão de chamada (valida os dados básicos)
    const session = new AttendanceSession({
      aulaId: input.aulaId,
      turmaId: input.turmaId,
      disciplinaId: input.disciplinaId,
      professorId: input.professorId,
      date: new Date(input.data),
    });

    // 2. Registra cada aluno — a entidade garante as invariantes de negócio
    for (const item of input.attendances) {
      session.registerStudent(
        item.enrollmentId,
        item.studentName,
        item.status as AttendanceStatus,
      );
    }

    // 3. Persiste em lote via repositório (transação atômica)
    await this.attendanceRepository.saveBatch({
      aulaId: session.aulaId,
      entries: session.getBatchEntries(),
    });

    // 4. Retorna o resumo da operação
    return {
      aulaId: session.aulaId,
      totalRegistered: session.totalRegistered,
      savedAt: new Date().toISOString(),
    };
  }
}
