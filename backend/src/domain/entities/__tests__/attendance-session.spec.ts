/**
 * attendance-session.spec.ts
 * Testes unitários da entidade AttendanceSession
 *
 * Executar: npm test (na raiz do backend)
 * Não requer banco de dados — testa a lógica pura em memória.
 */

import {
  AttendanceSession,
  AttendanceSessionProps,
} from '../attendance-session';

// ─── Fábrica de props válidas ──────────────────────────────────────────────────

const makeProps = (overrides?: Partial<AttendanceSessionProps>): AttendanceSessionProps => ({
  aulaId: 'aula-001',
  turmaId: 'turma-001',
  disciplinaId: 'disc-001',
  professorId: 'prof-001',
  date: new Date('2026-11-11T09:00:00'),
  ...overrides,
});

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('AttendanceSession — Entidade de Domínio', () => {

  // --- Construção ---

  describe('construtor', () => {
    it('deve criar uma sessão válida com props corretas', () => {
      const session = new AttendanceSession(makeProps());
      expect(session.aulaId).toBe('aula-001');
      expect(session.totalRegistered).toBe(0);
    });

    it('deve lançar erro quando aulaId estiver ausente', () => {
      expect(() => new AttendanceSession(makeProps({ aulaId: '' }))).toThrow(
        'aulaId é obrigatório',
      );
    });

    it('deve lançar erro quando a data for inválida', () => {
      expect(() =>
        new AttendanceSession(makeProps({ date: new Date('data-invalida') })),
      ).toThrow('data válida');
    });
  });

  // --- registerStudent ---

  describe('registerStudent', () => {
    it('deve registrar um aluno com sucesso', () => {
      const session = new AttendanceSession(makeProps());
      session.registerStudent('mat-001', 'Ana Luiza', 'PRESENTE');

      expect(session.totalRegistered).toBe(1);
      expect(session.getEntryByEnrollmentId('mat-001')?.status).toBe('PRESENTE');
    });

    it('deve registrar múltiplos alunos com diferentes status', () => {
      const session = new AttendanceSession(makeProps());
      session.registerStudent('mat-001', 'Ana Luiza', 'PRESENTE');
      session.registerStudent('mat-002', 'Bruno Costa', 'AUSENTE');
      session.registerStudent('mat-003', 'Carla Mendes', 'JUSTIFICADA');

      expect(session.totalRegistered).toBe(3);
    });

    it('deve lançar erro ao tentar registrar matrícula vazia (Regra 1)', () => {
      const session = new AttendanceSession(makeProps());
      expect(() => session.registerStudent('', 'Aluno Sem ID', 'PRESENTE')).toThrow(
        'matrícula inválida',
      );
    });

    it('deve lançar erro ao tentar registrar matrícula apenas com espaços (Regra 1)', () => {
      const session = new AttendanceSession(makeProps());
      expect(() => session.registerStudent('   ', 'Aluno Sem ID', 'PRESENTE')).toThrow(
        'matrícula inválida',
      );
    });

    it('deve lançar erro ao tentar registrar o mesmo aluno duas vezes (Regra 2 — duplo apontamento)', () => {
      const session = new AttendanceSession(makeProps());
      session.registerStudent('mat-001', 'Ana Luiza', 'PRESENTE');

      expect(() =>
        session.registerStudent('mat-001', 'Ana Luiza', 'AUSENTE'),
      ).toThrow('Duplo apontamento');
    });
  });

  // --- getBatchEntries ---

  describe('getBatchEntries', () => {
    it('deve retornar array vazio quando nenhum aluno foi registrado', () => {
      const session = new AttendanceSession(makeProps());
      expect(session.getBatchEntries()).toHaveLength(0);
    });

    it('deve retornar todos os alunos registrados na ordem de inserção', () => {
      const session = new AttendanceSession(makeProps());
      session.registerStudent('mat-001', 'Ana Luiza', 'PRESENTE');
      session.registerStudent('mat-002', 'Bruno Costa', 'AUSENTE');

      const entries = session.getBatchEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].enrollmentId).toBe('mat-001');
      expect(entries[1].status).toBe('AUSENTE');
    });

    it('cada entrada deve conter um timestamp de registro', () => {
      const session = new AttendanceSession(makeProps());
      session.registerStudent('mat-001', 'Ana Luiza', 'PRESENTE');

      const [entry] = session.getBatchEntries();
      expect(entry.registeredAt).toBeInstanceOf(Date);
    });
  });
});
