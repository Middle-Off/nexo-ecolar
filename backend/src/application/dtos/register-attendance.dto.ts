/**
 * register-attendance.dto.ts
 * DTOs de entrada e saída para o caso de uso de Registro de Chamada
 */

import { AttendanceStatus } from '../../domain/entities/attendance-session';

/** DTO de entrada: um item da lista de chamada enviado pelo professor */
export interface AttendanceItemInputDTO {
  enrollmentId: string;  // ID da matrícula do aluno
  studentName: string;
  status: AttendanceStatus;
}

/** DTO de entrada principal: payload completo enviado pelo controller */
export interface RegisterAttendanceInputDTO {
  aulaId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: string; // ISO 8601 (ex: "2026-11-11T09:00:00")
  attendances: AttendanceItemInputDTO[];
}

/** DTO de saída: retorno ao cliente após salvar a chamada */
export interface RegisterAttendanceOutputDTO {
  aulaId: string;
  totalRegistered: number;
  savedAt: string; // ISO 8601
}
