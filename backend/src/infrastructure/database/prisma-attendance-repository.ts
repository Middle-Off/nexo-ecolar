/**
 * prisma-attendance-repository.ts
 * Repositório concreto de Frequência — Camada de Infraestrutura
 *
 * Prova de Conceito #2 — Implementação da interface IAttendanceRepository
 * usando Prisma Client com transação atômica em lote (upsert).
 */

import { PrismaClient, StatusFrequencia } from '@prisma/client';
import { AttendanceEntry } from '../../domain/entities/attendance-session';
import {
  IAttendanceRepository,
  SaveBatchParams,
} from '../../domain/repositories/attendance-repository';

/**
 * Mapeia o status do domínio para o enum do Prisma/banco.
 */
const toPrismaStatus = (status: AttendanceEntry['status']): StatusFrequencia => {
  const map: Record<AttendanceEntry['status'], StatusFrequencia> = {
    PRESENTE: StatusFrequencia.PRESENTE,
    AUSENTE: StatusFrequencia.AUSENTE,
    JUSTIFICADA: StatusFrequencia.JUSTIFICADA,
  };
  return map[status];
};

/**
 * PrismaAttendanceRepository — adaptador de saída (Driven Adapter).
 *
 * Implementa IAttendanceRepository usando o Prisma Client para
 * persistir frequências no PostgreSQL com garantia de atomicidade.
 */
export class PrismaAttendanceRepository implements IAttendanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Persiste todos os registros de frequência de uma aula em uma única
   * transação atômica. Usa upsert para lidar com reenvios (idempotência):
   * se o registro já existir para (aulaId + matriculaId), ele é atualizado;
   * caso contrário, é criado.
   *
   * Se qualquer operação individual falhar, toda a transação é revertida
   * (rollback automático do Prisma $transaction).
   */
  async saveBatch({ aulaId, entries }: SaveBatchParams): Promise<void> {
    if (entries.length === 0) return;

    const upsertOperations = entries.map((entry) =>
      this.prisma.frequencia.upsert({
        where: {
          // Chave única composta: uma frequência por aluno por aula
          aulaId_matriculaId: {
            aulaId,
            matriculaId: entry.enrollmentId,
          },
        },
        update: {
          status: toPrismaStatus(entry.status),
          atualizadoEm: new Date(),
        },
        create: {
          aulaId,
          matriculaId: entry.enrollmentId,
          status: toPrismaStatus(entry.status),
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        },
      }),
    );

    // Executa todas as operações de upsert dentro de uma transação única
    await this.prisma.$transaction(upsertOperations);
  }

  /**
   * Recupera todos os registros de frequência de uma aula,
   * incluindo os dados do aluno (via matrícula).
   */
  async findByAulaId(aulaId: string): Promise<AttendanceEntry[]> {
    const registros = await this.prisma.frequencia.findMany({
      where: { aulaId },
      include: {
        matricula: {
          include: {
            usuario: true, // Busca o nome do aluno
          },
        },
      },
    });

    return registros.map((r) => ({
      enrollmentId: r.matriculaId,
      studentName: r.matricula.usuario.nome,
      status: r.status as AttendanceEntry['status'],
      registeredAt: r.criadoEm,
    }));
  }
}
