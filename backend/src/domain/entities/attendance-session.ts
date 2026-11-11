/**
 * attendance-session.ts
 * Entidade de Domínio: Sessão de Chamada Escolar
 *
 * Prova de Conceito #1 — Lógica de negócio pura em TypeScript,
 * sem dependência de frameworks ou banco de dados.
 */

export type AttendanceStatus = 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADA';

export interface AttendanceEntry {
  enrollmentId: string; // ID da matrícula do aluno
  studentName: string;
  status: AttendanceStatus;
  registeredAt: Date;
}

export interface AttendanceSessionProps {
  aulaId: string;      // ID da Aula (FK para a tabela Aula)
  turmaId: string;     // ID da Turma
  disciplinaId: string;
  professorId: string;
  date: Date;
}

/**
 * AttendanceSession — entidade central do domínio de Frequência.
 *
 * Invariantes de negócio garantidas por esta classe:
 *  1. Um aluno só pode ser registrado se possuir uma matrícula ativa (enrollmentId válido).
 *  2. Não é permitido duplo apontamento: a mesma matrícula não pode ser registrada
 *     duas vezes na mesma sessão de aula.
 */
export class AttendanceSession {
  private readonly _props: AttendanceSessionProps;
  private readonly _entries: Map<string, AttendanceEntry>;

  constructor(props: AttendanceSessionProps) {
    if (!props.aulaId) throw new Error('aulaId é obrigatório para a sessão de chamada.');
    if (!props.turmaId) throw new Error('turmaId é obrigatório para a sessão de chamada.');
    if (!props.disciplinaId) throw new Error('disciplinaId é obrigatório para a sessão de chamada.');
    if (!props.professorId) throw new Error('professorId é obrigatório para a sessão de chamada.');
    if (!props.date || isNaN(props.date.getTime())) {
      throw new Error('Uma data válida é obrigatória para a sessão de chamada.');
    }

    this._props = props;
    this._entries = new Map<string, AttendanceEntry>();
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get aulaId(): string { return this._props.aulaId; }
  get turmaId(): string { return this._props.turmaId; }
  get disciplinaId(): string { return this._props.disciplinaId; }
  get professorId(): string { return this._props.professorId; }
  get date(): Date { return this._props.date; }

  // ─── Regras de Negócio ────────────────────────────────────────────────────

  /**
   * Registra o status de frequência de um aluno na sessão atual.
   *
   * @throws {Error} Se o enrollmentId for vazio ou nulo (matrícula inválida).
   * @throws {Error} Se o aluno já tiver sido registrado nesta sessão (duplo apontamento).
   */
  registerStudent(
    enrollmentId: string,
    studentName: string,
    status: AttendanceStatus,
  ): void {
    // Regra 1: matrícula válida
    if (!enrollmentId || enrollmentId.trim() === '') {
      throw new Error(
        `Não é possível registrar frequência: matrícula inválida para o aluno "${studentName}".`,
      );
    }

    // Regra 2: impede duplo apontamento na mesma aula
    if (this._entries.has(enrollmentId)) {
      throw new Error(
        `Duplo apontamento detectado: o aluno com matrícula "${enrollmentId}" já foi registrado nesta sessão de chamada.`,
      );
    }

    this._entries.set(enrollmentId, {
      enrollmentId,
      studentName,
      status,
      registeredAt: new Date(),
    });
  }

  /**
   * Retorna a matriz completa de alunos e seus respectivos status de frequência,
   * pronta para ser persistida em lote.
   */
  getBatchEntries(): AttendanceEntry[] {
    return Array.from(this._entries.values());
  }

  /**
   * Retorna o total de alunos registrados na sessão.
   */
  get totalRegistered(): number {
    return this._entries.size;
  }

  /**
   * Consulta o status de um aluno específico pelo ID de matrícula.
   * Retorna undefined se o aluno ainda não foi registrado.
   */
  getEntryByEnrollmentId(enrollmentId: string): AttendanceEntry | undefined {
    return this._entries.get(enrollmentId);
  }
}
