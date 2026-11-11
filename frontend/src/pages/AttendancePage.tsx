/**
 * AttendancePage.tsx
 * Tela: Diário de Classe (Chamada)
 *
 * Permite ao professor registrar a presença dos alunos de uma aula.
 * Consome o AttendanceSession via backend (RegisterAttendanceUseCase).
 */

import React, { useState } from 'react';
import { attendanceService, AttendanceStatus, AttendanceItem } from '../services/attendance.service';
import { useAuth } from '../contexts/AuthContext';

// ─── Mock de dados (substituir por fetch real em integração) ──────────────────
const MOCK_STUDENTS: { enrollmentId: string; studentName: string }[] = [
  { enrollmentId: 'mat-001', studentName: 'Ana Luiza Ferreira' },
  { enrollmentId: 'mat-002', studentName: 'Bruno Costa Silva' },
  { enrollmentId: 'mat-003', studentName: 'Carla Mendes Dias' },
  { enrollmentId: 'mat-004', studentName: 'Diego Santos Rocha' },
  { enrollmentId: 'mat-005', studentName: 'Elena Rodrigues Lima' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

const AttendancePage: React.FC = () => {
  const { user } = useAuth();

  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(
    () =>
      Object.fromEntries(
        MOCK_STUDENTS.map((s) => [s.enrollmentId, 'PRESENTE' as AttendanceStatus]),
      ),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStatusChange = (enrollmentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [enrollmentId]: status }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const attendances: AttendanceItem[] = MOCK_STUDENTS.map((s) => ({
      enrollmentId: s.enrollmentId,
      studentName: s.studentName,
      status: statusMap[s.enrollmentId],
    }));

    try {
      const response = await attendanceService.registerAttendance({
        aulaId: 'aula-poc-001', // Em produção: vem via rota/prop
        turmaId: 'turma-poc-001',
        disciplinaId: 'disc-poc-001',
        professorId: user.id,
        data: new Date().toISOString(),
        attendances,
      });

      setSuccessMessage(
        `✅ Chamada salva! ${response.data.totalRegistered} alunos registrados.`,
      );
    } catch (err) {
      setErrorMessage('❌ Erro ao salvar a chamada. Tente novamente.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
    { value: 'PRESENTE', label: 'Presente', color: '#16a34a' },
    { value: 'AUSENTE', label: 'Ausente', color: '#dc2626' },
    { value: 'JUSTIFICADA', label: 'Justificada', color: '#d97706' },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📋 Diário de Classe</h1>
      <p style={styles.subtitle}>
        Professor: <strong>{user?.nome}</strong> &nbsp;|&nbsp;
        Data: <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
      </p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Aluno</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_STUDENTS.map((student, index) => (
            <tr key={student.enrollmentId} style={styles.tr}>
              <td style={styles.td}>{index + 1}</td>
              <td style={styles.td}>{student.studentName}</td>
              <td style={styles.td}>
                <div style={styles.buttonGroup}>
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        handleStatusChange(student.enrollmentId, opt.value)
                      }
                      style={{
                        ...styles.statusBtn,
                        backgroundColor:
                          statusMap[student.enrollmentId] === opt.value
                            ? opt.color
                            : '#e5e7eb',
                        color:
                          statusMap[student.enrollmentId] === opt.value
                            ? '#fff'
                            : '#374151',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {successMessage && <p style={styles.success}>{successMessage}</p>}
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{ ...styles.saveBtn, opacity: isSaving ? 0.7 : 1 }}
      >
        {isSaving ? 'Salvando...' : 'Salvar Chamada'}
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '800px', margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' },
  title: { fontSize: '1.75rem', color: '#1a56db', marginBottom: '0.25rem' },
  subtitle: { color: '#6b7280', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' },
  th: { textAlign: 'left', padding: '0.75rem 1rem', backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb', fontWeight: 600 },
  tr: { borderBottom: '1px solid #e5e7eb' },
  td: { padding: '0.65rem 1rem', verticalAlign: 'middle' },
  buttonGroup: { display: 'flex', gap: '0.5rem' },
  statusBtn: { padding: '0.3rem 0.75rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'background-color 0.15s' },
  saveBtn: { padding: '0.8rem 2rem', backgroundColor: '#1a56db', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  success: { color: '#16a34a', marginBottom: '1rem', fontWeight: 600 },
  error: { color: '#dc2626', marginBottom: '1rem', fontWeight: 600 },
};

export default AttendancePage;
