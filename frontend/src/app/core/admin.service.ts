import { apiUrl, supabase } from './supabase';

/** Totais do site para o painel da moderação (rota do back: GET /api/admin/metricas, só moderador). */
export interface Metricas {
  usuarios: number;
  comunidades: number;
  publicacoes: number;
  publicacoesRemovidas: number;
  denunciasAbertas: number;
}

/**
 * Busca as métricas na API mandando o token de quem está logado.
 * Sem banco ligado (modo demonstração) devolve null: a tela mostra "sem dados".
 * Erros da API (401 sem login, 403 se não for moderador) viram mensagem para a pessoa.
 */
export async function metricasAdmin(): Promise<{ metricas: Metricas; geradoEm: string } | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Entre com uma conta de moderação para ver o painel.');
  const resp = await fetch(`${apiUrl}/admin/metricas`, { headers: { Authorization: `Bearer ${token}` } });
  if (resp.status === 401) throw new Error('Sua sessão expirou. Entre de novo.');
  if (resp.status === 403) throw new Error('Só a moderação pode ver o painel.');
  if (!resp.ok) throw new Error('O painel não respondeu agora. Tente de novo em instantes.');
  return (await resp.json()) as { metricas: Metricas; geradoEm: string };
}
