import { apiUrl } from './supabase';

/** Motivos de reserva, iguais aos do back-end (backend/src/routes/whatsapp.js), se a lista não carregar. */
export const MOTIVOS_RESERVA = ['Denunciar conteúdo suspeito', 'Dúvida', 'Sugestão', 'Problema no site', 'Outro'];
export const MSG_INDISPONIVEL = 'O atendimento por WhatsApp não está disponível agora.';

export interface PedidoWhatsapp { nome: string; motivo: string; link?: string; mensagem?: string }

/** GET {API_URL}/whatsapp/motivos → { motivos: string[] } */
export async function motivosWhatsapp(): Promise<string[]> {
  try {
    const resp = await fetch(`${apiUrl}/whatsapp/motivos`, { headers: { Accept: 'application/json' } });
    if (resp.ok) {
      const dados = (await resp.json()) as { motivos?: string[] };
      if (Array.isArray(dados.motivos) && dados.motivos.length) return dados.motivos;
    }
  } catch {
    /* sem API: usa a lista de reserva */
  }
  return MOTIVOS_RESERVA;
}

/**
 * POST {API_URL}/whatsapp { nome, motivo, link?, mensagem? } → 200 { url, texto }.
 * Nada é guardado (LGPD): o back só monta o link do WhatsApp com o texto.
 * 400 { erro } → mostra a mensagem; 503 (número não configurado) ou API fora → "não está disponível agora".
 */
export async function montarWhatsapp(p: PedidoWhatsapp): Promise<{ url: string; texto: string }> {
  let resp: Response;
  try {
    resp = await fetch(`${apiUrl}/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ nome: p.nome, motivo: p.motivo, link: p.link || undefined, mensagem: p.mensagem || undefined }),
    });
  } catch {
    throw new Error(MSG_INDISPONIVEL);
  }
  const dados = (await resp.json().catch(() => ({}))) as { url?: string; texto?: string; erro?: string };
  if (resp.status === 400) throw new Error(dados.erro || 'Confira os campos do formulário.');
  if (!resp.ok || !dados.url || !/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(dados.url)) throw new Error(MSG_INDISPONIVEL);
  return { url: dados.url, texto: dados.texto ?? '' };
}
