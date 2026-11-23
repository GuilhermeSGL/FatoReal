// ÁREA DO GUSTAVO — autenticação, conta do usuário e painel do administrador.
//
// Este arquivo já está registrado no src/app.js (em /api). Para criar rotas novas,
// importe e registre aqui, sem mexer no app.js:
//
//   import contaRouter from './rotas/conta.js';
//   router.use('/conta', contaRouter);     // → /api/conta/...
//
// Prefixos reservados para esta área: /api/auth, /api/conta e /api/admin.
// Divisão de tarefas e regras para não dar conflito: backend/DIVISAO.md
import { Router } from 'express';

const router = Router();

export default router;
