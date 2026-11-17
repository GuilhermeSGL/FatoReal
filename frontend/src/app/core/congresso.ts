/** Acompanhamento do Congresso: agenda, votações do plenário, leis aprovadas e ranking. Dados da API da Câmara. */
import { jsonCamara, todosDoCargo } from './politicos.service';
import { VotacaoPlenario, VotoDeputado, votacoesNominais } from './ficha-politico';

type Pagina<T> = { dados: T[]; links?: { rel: string; href: string }[] };

function dataIso(d: Date) {
  const l = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return l.toISOString().slice(0, 10);
}

// ---------------- Agenda ----------------
export interface Evento {
  id: number;
  inicio: string;
  fim: string | null;
  situacao: string;
  tipo: string;
  descricao: string;
  local: string;
  orgaos: { sigla: string; nome: string }[];
  plenario: boolean;
  video: string | null;
}

/** Segunda-feira da semana de `d` (+ `semanas`). */
export function inicioDaSemana(semanas = 0, d = new Date()): Date {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7) + semanas * 7);
  return x;
}

export async function agendaDaSemana(segunda: Date): Promise<Evento[]> {
  const domingo = new Date(segunda);
  domingo.setDate(domingo.getDate() + 6);
  const itens: Evento[] = [];
  let url: string | undefined = `/eventos?dataInicio=${dataIso(segunda)}&dataFim=${dataIso(domingo)}&itens=100&ordem=ASC&ordenarPor=dataHoraInicio`;
  let paginas = 0;
  while (url && paginas < 4) {
    const r: Pagina<{
      id: number; dataHoraInicio: string; dataHoraFim?: string | null; situacao?: string; descricaoTipo?: string; descricao?: string;
      localCamara?: { nome?: string | null }; localExterno?: string | null; orgaos?: { sigla: string; nome?: string; apelido?: string }[]; urlRegistro?: string | null;
    }> = await jsonCamara(url);
    for (const e of r.dados) {
      const orgaos = (e.orgaos ?? []).map((o) => ({ sigla: o.sigla, nome: o.apelido || o.nome || o.sigla }));
      itens.push({
        id: e.id,
        inicio: e.dataHoraInicio,
        fim: e.dataHoraFim ?? null,
        situacao: e.situacao ?? '',
        tipo: e.descricaoTipo ?? 'Evento',
        descricao: (e.descricao ?? '').trim(),
        local: e.localCamara?.nome || e.localExterno || '',
        orgaos,
        plenario: orgaos.some((o) => o.sigla === 'PLEN'),
        video: e.urlRegistro && /^https?:\/\//.test(e.urlRegistro) ? e.urlRegistro.replace(/^http:/, 'https:') : null,
      });
    }
    url = r.links?.find((l) => l.rel === 'next')?.href;
    paginas++;
  }
  return itens;
}

export interface ItemPauta { ordem: number; titulo: string; ementa: string; relator: string | null; situacao: string | null; idProposicao: number | null }

export async function pautaDoEvento(id: number): Promise<ItemPauta[]> {
  const r = await jsonCamara<{ dados: {
    ordem?: number; topico?: string; situacaoItem?: string | null; relator?: { nome?: string; siglaPartido?: string } | null;
    proposicao_?: { id?: number; siglaTipo?: string; numero?: number; ano?: number; ementa?: string } | null;
  }[] }>(`/eventos/${id}/pauta`);
  return r.dados.map((i, k) => {
    const p = i.proposicao_;
    return {
      ordem: i.ordem ?? k + 1,
      titulo: p?.siglaTipo ? `${p.siglaTipo} ${p.numero}/${p.ano}` : i.topico || 'Item da pauta',
      ementa: p?.ementa ?? '',
      relator: i.relator?.nome ? `${i.relator.nome}${i.relator.siglaPartido ? ' (' + i.relator.siglaPartido + ')' : ''}` : null,
      situacao: i.situacaoItem ?? null,
      idProposicao: p?.id ?? null,
    };
  });
}

// ---------------- Votações do plenário ----------------
export interface VotacaoResumo {
  id: string;
  data: string;
  descricao: string;
  proposicao: string | null;
  idProposicao: number | null;
  aprovada: boolean | null;
  placar: { sim: number; nao: number; outros: number };
  partidos: { sigla: string; sim: number; nao: number; outros: number }[];
}

export async function votacoesImportantes(): Promise<VotacaoResumo[]> {
  const lista = await votacoesNominais();
  return lista.map(({ v, votos }) => resumir(v, votos));
}

function resumir(v: VotacaoPlenario, votos: VotoDeputado[]): VotacaoResumo {
  const porPartido = new Map<string, { sim: number; nao: number; outros: number }>();
  const placar = { sim: 0, nao: 0, outros: 0 };
  for (const x of votos) {
    const k = x.tipoVoto === 'Sim' ? 'sim' : x.tipoVoto === 'Não' ? 'nao' : 'outros';
    placar[k]++;
    const sigla = x.deputado_?.siglaPartido || 'S/Partido';
    const p = porPartido.get(sigla) ?? { sim: 0, nao: 0, outros: 0 };
    p[k]++;
    porPartido.set(sigla, p);
  }
  const idProp = v.uriProposicaoObjeto?.match(/proposicoes\/(\d+)/)?.[1];
  return {
    id: v.id,
    data: v.dataHoraRegistro ?? v.data ?? '',
    descricao: v.descricao ?? 'Votação em plenário',
    proposicao: v.proposicaoObjeto ?? null,
    idProposicao: idProp ? Number(idProp) : null,
    aprovada: v.aprovacao === 1 ? true : v.aprovacao === 0 ? false : null,
    placar,
    partidos: [...porPartido]
      .map(([sigla, x]) => ({ sigla, ...x }))
      .sort((a, b) => b.sim + b.nao + b.outros - (a.sim + a.nao + a.outros)),
  };
}

// ---------------- Ranking de presença e fidelidade ----------------
export interface LinhaRanking {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string | null;
  votou: number;
  total: number;
  presenca: number; // %
  fidelidade: number | null; // %
}

export async function rankingVotacoes(): Promise<{ linhas: LinhaRanking[]; votacoes: number }> {
  const [nominais, deputados] = await Promise.all([votacoesNominais(), todosDoCargo('Deputado(a) Federal')]);
  const total = nominais.length;
  const st = new Map<number, { votou: number; comp: number; iguais: number }>();
  for (const { votos } of nominais) {
    // maioria de cada partido nesta votação (só Sim/Não)
    const contagem = new Map<string, Map<string, number>>();
    for (const x of votos) {
      if (!['Sim', 'Não'].includes(x.tipoVoto)) continue;
      const m = contagem.get(x.deputado_.siglaPartido) ?? new Map<string, number>();
      m.set(x.tipoVoto, (m.get(x.tipoVoto) ?? 0) + 1);
      contagem.set(x.deputado_.siglaPartido, m);
    }
    const maioria = new Map([...contagem].map(([p, m]) => [p, [...m].sort((a, b) => b[1] - a[1])[0]?.[0]]));
    for (const x of votos) {
      const s = st.get(x.deputado_.id) ?? { votou: 0, comp: 0, iguais: 0 };
      s.votou++;
      const mp = maioria.get(x.deputado_.siglaPartido);
      if (mp && ['Sim', 'Não'].includes(x.tipoVoto)) {
        s.comp++;
        if (x.tipoVoto === mp) s.iguais++;
      }
      st.set(x.deputado_.id, s);
    }
  }
  const linhas = deputados.map((d) => {
    const s = st.get(d.id) ?? { votou: 0, comp: 0, iguais: 0 };
    return {
      id: d.id, nome: d.nome, partido: d.partido ?? '', uf: d.uf ?? '', foto: d.foto_url ?? null,
      votou: s.votou, total, presenca: total ? Math.round((s.votou / total) * 100) : 0,
      fidelidade: s.comp ? Math.round((s.iguais / s.comp) * 100) : null,
    };
  });
  return { linhas, votacoes: total };
}

// ---------------- Leis aprovadas ----------------
export interface LeiAprovada { id: number; titulo: string; ementa: string; data: string | null; url: string }

/** Propostas que viraram norma jurídica nos últimos meses (situação "Transformado em Norma Jurídica" na Câmara). */
export async function leisAprovadas(): Promise<LeiAprovada[]> {
  const ini = new Date();
  ini.setMonth(ini.getMonth() - 6);
  const r = await jsonCamara<Pagina<{ id: number; siglaTipo: string; numero: number; ano: number; ementa: string }>>(
    `/proposicoes?codSituacao=1140&siglaTipo=PL,PLP,PEC,MPV,PLV&dataInicio=${dataIso(ini)}&dataFim=${dataIso(new Date())}&itens=30&ordem=DESC&ordenarPor=id`,
  );
  return r.dados.map((p) => ({
    id: p.id,
    titulo: `${p.siglaTipo} ${p.numero}/${p.ano}`,
    ementa: p.ementa,
    data: null,
    url: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`,
  }));
}
