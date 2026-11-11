/**
 * attendance.service.ts
 * Serviço de Frequência — integração HTTP com o backend
 */

import { api } from './api';

export type AttendanceStatus = 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADA';

export interface AttendanceItem {
  enrollmentId: string;
  studentName: string;
  status: AttendanceStatus;
}

export interface RegisterAttendancePayload {
  aulaId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: string; // ISO 8601
  attendances: AttendanceItem[];
}

export interface RegisterAttendanceResponse {
  message: string;
  data: {
    aulaId: string;
    totalRegistered: number;
    savedAt: string;
  };
}

export interface AttendanceRecord {
  enrollmentId: string;
  studentName: string;
  status: AttendanceStatus;
  registeredAt: string;
}

export const attendanceService = {
  /**
   * Envia a chamada completa de uma aula para o backend.
   */
  async registerAttendance(
    payload: RegisterAttendancePayload,
  ): Promise<RegisterAttendanceResponse> {
    const { data } = await api.post<RegisterAttendanceResponse>(
      '/attendance',
      payload,
    );
    return data;
  },

  /**
   * Busca os registros de frequência de uma aula pelo ID.
   */
  async getAttendanceByAulaId(aulaId: string): Promise<AttendanceRecord[]> {
    const { data } = await api.get<AttendanceRecord[]>(
      `/attendance/${aulaId}`,
    );
    return data;
  },
};
