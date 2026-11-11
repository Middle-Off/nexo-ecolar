/**
 * api.ts
 * Instância configurada do Axios — cliente HTTP base
 *
 * Inclui interceptor para injetar o token JWT automaticamente
 * em todas as requisições autenticadas.
 */

import axios from 'axios';

const TOKEN_STORAGE_KEY = '@nexo-escolar:token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de requisição: injeta o token JWT no header Authorization
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de resposta: redireciona para login em caso de 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('@nexo-escolar:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
