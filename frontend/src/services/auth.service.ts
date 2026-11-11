/**
 * auth.service.ts
 * Serviço de Autenticação — integração HTTP com o backend
 */

import { api } from './api';
import { AuthUser } from '../contexts/AuthContext';

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  /**
   * Envia as credenciais para o backend e recebe o token JWT + dados do usuário.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },
};
