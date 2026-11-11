/**
 * server.ts
 * Ponto de entrada da aplicação — Express + configurações globais
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './infrastructure/http/router';

const app = express();
const PORT = process.env.PORT || 3333;

// ─── Middlewares globais ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api', router);

// ─── Inicialização ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 NexoEscolar API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
