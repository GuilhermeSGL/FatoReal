import { Injectable } from '@angular/core';
import { Noticia, NOTICIAS } from './noticias';
import { apiUrl } from './supabase';

/**
 * Lista de notícias da aba Notícias.
 *
 * Contrato esperado do back-end (combinar com a equipe):
 *   GET {API_URL}/noticias  →  200 [{ titulo, resumo?, categoria, data, fonte, url, imagem?, pergunta?, destaque? }]
 * O back-end junta os feeds RSS oficiais (Agência Câmara, Agência Senado, Agência Brasil, TSE...),
 * porque o navegador não consegue ler esses feeds direto. Enquanto não existir, usa a seleção da equipe.
 */
@Injectable({ providedIn: 'root' })
export class NoticiasService {
  async carregar(): Promise<{ lista: Noticia[]; aoVivo: boolean }> {
    try {
      const resp = await fetch(`${apiUrl}/noticias`, { signal: AbortSignal.timeout(4000) });
      if (resp.ok && resp.headers.get('content-type')?.includes('json')) {
        const dados = (await resp.json()) as Noticia[];
        if (Array.isArray(dados) && dados.length && dados.every((n) => n.titulo && n.url && n.fonte)) return { lista: dados, aoVivo: true };
      }
    } catch {
      /* sem back-end: segue com a seleção da equipe */
    }
    return { lista: NOTICIAS, aoVivo: false };
  }
}
