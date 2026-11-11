/**
 * auth.middleware.ts
 * Middleware de Autenticação JWT — Camada de Interfaces
 *
 * Verifica o token Bearer no header Authorization e injeta
 * os dados do usuário no objeto Request do Express.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;    // ID do usuário
  email: string;
  perfil: string; // Perfil: ADMIN | PROFESSOR | ALUNO | RESPONSAVEL
  iat?: number;
  exp?: number;
}

// Estende o tipo Request do Express para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * authMiddleware
 *
 * Extrai e valida o JWT do header `Authorization: Bearer <token>`.
 * Em caso de sucesso, popula `req.user` e chama next().
 * Em caso de falha, retorna 401 Unauthorized.
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Não autorizado',
      message: 'Token de autenticação ausente ou mal formatado.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('[AuthMiddleware] JWT_SECRET não configurado no ambiente.');
    res.status(500).json({ error: 'Erro interno de configuração do servidor.' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    } else {
      res.status(401).json({ error: 'Token inválido.' });
    }
  }
};

/**
 * requirePerfil
 *
 * Fábrica de middleware de autorização por perfil (RBAC simples).
 * Deve ser usado APÓS o authMiddleware.
 *
 * Exemplo: router.post('/aulas', authMiddleware, requirePerfil('PROFESSOR'), controller.create)
 */
export const requirePerfil = (...perfisPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado.' });
      return;
    }

    if (!perfisPermitidos.includes(req.user.perfil)) {
      res.status(403).json({
        error: 'Acesso negado.',
        message: `Esta rota requer um dos perfis: ${perfisPermitidos.join(', ')}.`,
      });
      return;
    }

    next();
  };
};
