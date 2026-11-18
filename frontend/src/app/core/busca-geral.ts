import { inject, Injectable } from '@angular/core';
import { ComunidadesService } from './comunidades.service';
import { GLOSSARIO } from './glossario';
import { NOTICIAS_DESTAQUE } from './noticias';
import { todosDoCargo } from './politicos.service';

export type TipoResultado = 'politico' | 'comunidade' | 'termo' | 'noticia' | 'pagina';

export interface ResultadoBusca {
  tipo: TipoResultado;
  titulo: string;
  detalhe: string;
  icone: string;
  /** Rota interna (array do routerLink) ou link externo. */
  rota?: (string | number)[];
  query?: Record<string, string>;
  externo?: string;
  foto?: string | null;
  /** Selo de status mostrado ao lado do resultado. */
  selo?: 'verificado' | 'confiavel';
}

const PAGINAS: ResultadoBusca[] = [
  { tipo: 'pagina', titulo: 'Candidatos', detalhe: 'Deputados e senadores de A a Z', icone: 'person', rota: ['/politicos'] },
  { tipo: 'pagina', titulo: 'Ranking de gastos', detalhe: 'Cota parlamentar por estado', icone: 'leaderboard', rota: ['/politicos/gastos'] },
  { tipo: 'pagina', titulo: 'Comparar deputados', detalhe: 'Dois deputados lado a lado', icone: 'compare_arrows', rota: ['/politicos/comparar'] },
  { tipo: 'pagina', titulo: 'Verificar informação', detalhe: 'Checar texto, link, foto ou vídeo', icone: 'fact_check', rota: ['/verificar'] },
  { tipo: 'pagina', titulo: 'Base da Política', detalhe: 'Glossário e como uma lei nasce', icone: 'school', rota: ['/base-da-politica'] },
  { tipo: 'pagina', titulo: 'Notícias', detalhe: 'Notícias em destaque com fonte', icone: 'newspaper', rota: ['/noticias'] },
  { tipo: 'pagina', titulo: 'FatoBot', detalhe: 'Pergunte para a IA', icone: 'smart_toy', rota: ['/fatobot'] },
];

export function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Busca do topo: procura em políticos, comunidades, glossário, notícias e páginas do site. */
@Injectable({ providedIn: 'root' })
export class BuscaGeralService {
  private comunidades = inject(ComunidadesService);

  async buscar(termo: string, porGrupo = 4): Promise<ResultadoBusca[]> {
    const t = normalizar(termo);
    if (t.length < 2) return [];
    const tem = (...campos: (string | null | undefined)[]) => campos.some((c) => c && normalizar(c).includes(t));

    const [deps, sens, coms] = await Promise.allSettled([
      todosDoCargo('Deputado(a) Federal'),
      todosDoCargo('Senador(a)'),
      this.comunidades.listar(termo),
    ]);
    const politicos = [...(deps.status === 'fulfilled' ? deps.value : []), ...(sens.status === 'fulfilled' ? sens.value : [])]
      .filter((p) => tem(p.nome) || normalizar(p.partido ?? '') === t || normalizar(p.uf ?? '') === t)
      .slice(0, porGrupo)
      .map<ResultadoBusca>((p) => ({
        tipo: 'politico', selo: 'confiavel', titulo: p.nome, detalhe: `${p.cargo} · ${p.partido ?? ''} · ${p.uf ?? ''}`, icone: 'person', foto: p.foto_url,
        rota: p.casa === 'senado' ? ['/politicos/senado', p.id] : ['/politicos', p.id],
      }));
    // Busca por partido ou estado: atalho para a lista filtrada
    const atalhos: ResultadoBusca[] = [];
    if (/^[a-z]{2}$/.test(t)) atalhos.push({ tipo: 'pagina', titulo: `Políticos de ${t.toUpperCase()}`, detalhe: 'Ver todos do estado', icone: 'map', rota: ['/politicos'], query: { uf: t.toUpperCase() } });

    const comunidades = (coms.status === 'fulfilled' ? coms.value : []).slice(0, porGrupo).map<ResultadoBusca>((c) => ({
      tipo: 'comunidade', titulo: c.nome, detalhe: `Comunidade · ${c.tema}`, icone: 'groups', rota: ['/comunidades', c.slug],
    }));
    const termos = GLOSSARIO.filter((g) => tem(g.termo) || (t.length >= 4 && tem(g.definicao))).slice(0, porGrupo).map<ResultadoBusca>((g) => ({
      tipo: 'termo', titulo: g.termo, detalhe: g.definicao, icone: g.icone, rota: ['/base-da-politica'],
    }));
    const noticias = NOTICIAS_DESTAQUE.filter((n) => tem(n.titulo, n.resumo, n.tema)).slice(0, porGrupo).map<ResultadoBusca>((n) => ({
      tipo: 'noticia', selo: 'verificado', titulo: n.titulo, detalhe: `${n.fonte} · ${n.data}`, icone: 'newspaper', externo: n.url,
    }));
    const paginas = PAGINAS.filter((p) => tem(p.titulo, p.detalhe)).slice(0, porGrupo);
    return [...atalhos, ...politicos, ...comunidades, ...termos, ...noticias, ...paginas];
  }
}
