/**
 * attendance-repository.ts
 * Interface abstrata de repositório — Camada de Domínio
 *
 * Define o contrato de persistência de Frequência sem vazar
 * detalhes de infraestrutura para o núcleo do domínio.
 */

import { AttendanceEntry } from '../entities/attendance-session';

export interface SaveBatchParams {
  aulaId: string;
  entries: AttendanceEntry[];
}

/**
 * IAttendanceRepository — porta de saída (Output Port) do domínio.
 *
 * Qualquer mecanismo de persistência (Prisma, in-memory, etc.)
 * deve implementar esta interface para ser aceito pelos casos de uso.
 */
export interface IAttendanceRepository {
  /**
   * Persiste em lote a lista de presenças de uma aula.
   * A operação deve ser atômica: ou todos os registros são salvos,
   * ou nenhum é (semântica de transação).
   *
   * @param params - aulaId e lista de AttendanceEntry para salvar.
   */
  saveBatch(params: SaveBatchParams): Promise<void>;

  /**
   * Busca todos os registros de frequência de uma aula específica.
   *
   * @param aulaId - ID da Aula a ser consultada.
   */
  findByAulaId(aulaId: string): Promise<AttendanceEntry[]>;
}
