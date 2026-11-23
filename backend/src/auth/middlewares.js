// G1 — Middlewares de login.
//
// exigirLogin: lê "Authorization: Bearer <token>" (o token de sessão que o front já tem),
//   confere com o Supabase e coloca em req.usuario { id, email } e em req.supabase o
//   cliente "como o usuário" (G2). Sem token ou token inválido → 401.
// exigirModerador: usar DEPOIS do exigirLogin. Confere perfis.is_moderador → se não for, 403.
//
// Segurança: nunca registrar token nem e-mail em console.log (LGPD).
import { comPrazo } from '../utils/prazo.js';
import { authConfigurado, clienteDoUsuario } from './supabase-usuario.js';

// Tempo máximo esperando o Supabase responder (ms).
export const PRAZO_SUPABASE_MS = 8000;

// Pega o token do cabeçalho Authorization. Devolve null se não tiver ou estiver mal escrito.
export function tokenDe(req) {
  const cabecalho = String(req.headers?.authorization ?? '');
  const achou = cabecalho.match(/^Bearer\s+([A-Za-z0-9._~+/=-]+)$/i);
  return achou ? achou[1] : null;
}

export async function exigirLogin(req, res, next) {
  if (!authConfigurado()) {
    return res.status(503).json({ erro: 'O login está indisponível no momento.' });
  }
  const token = tokenDe(req);
  if (!token) {
    return res.status(401).json({ erro: 'Entre na sua conta para continuar.' });
  }

  try {
    const supabase = clienteDoUsuario(token);
    const { data, error } = await comPrazo(supabase.auth.getUser(token), PRAZO_SUPABASE_MS, 'Supabase demorou');
    if (error || !data?.user) {
      return res.status(401).json({ erro: 'Sua sessão expirou. Entre de novo.' });
    }
    req.usuario = { id: data.user.id, email: data.user.email ?? null };
    req.supabase = supabase;
    return next();
  } catch {
    return res.status(502).json({ erro: 'Não foi possível conferir o login agora. Tente de novo em instantes.' });
  }
}

export async function exigirModerador(req, res, next) {
  if (!req.usuario || !req.supabase) {
    return res.status(401).json({ erro: 'Entre na sua conta para continuar.' });
  }
  try {
    const { data, error } = await comPrazo(
      req.supabase.from('perfis').select('is_moderador').eq('id', req.usuario.id).maybeSingle(),
      PRAZO_SUPABASE_MS,
      'Supabase demorou'
    );
    if (error) throw error;
    if (!data?.is_moderador) {
      return res.status(403).json({ erro: 'Esta área é só para moderadores.' });
    }
    return next();
  } catch {
    return res.status(502).json({ erro: 'Não foi possível conferir a permissão agora. Tente de novo em instantes.' });
  }
}
