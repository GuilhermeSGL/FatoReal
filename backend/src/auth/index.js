// ÁREA DO GUSTAVO — autenticação, conta do usuário e painel do administrador.
//
// Este arquivo já está registrado no src/app.js (em /api). Para criar rotas novas,
// importe e registre aqui, sem mexer no app.js.
//
// Prefixos reservados para esta área: /api/auth, /api/conta e /api/admin.
// Documentação das rotas: src/auth/README.md · Divisão de tarefas: backend/DIVISAO.md
import { Router } from 'express';
import { limitarPorIp } from '../utils/limite.js';
import contaRouter from './rotas/conta.js';
import adminRouter from './rotas/admin.js';

const router = Router();

// Mesmo limite contra abuso do resto da API (60 pedidos/min por IP).
router.use('/conta', limitarPorIp, contaRouter); // → /api/conta/...
router.use('/admin', limitarPorIp, adminRouter); // → /api/admin/...

export default router;
