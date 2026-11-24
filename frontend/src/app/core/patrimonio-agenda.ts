import { jsonCamara } from './politicos.service';

// =====================================================================
// Patrimônio declarado ao TSE e agenda semanal na Câmara
// =====================================================================

/** Um bem declarado pelo candidato ao TSE. */
export interface BemDeclarado {
  tipo: string;
  descricao: string;
  valor: number;
}

/** Bens declarados na última eleição disputada (arquivo em public/dados/patrimonio). */
export interface Patrimonio {
  casa: 'camara' | 'senado';
  id: number | string;
  nome: string;
  ano: number;
  eleicao: string;
  cargo_disputado: string;
  situacao: string | null;
  total: number;
  quantidade: number;
  bens: BemDeclarado[];
  fonte: { titulo: string; url: string };
}

/**
 * Patrimônio declarado pelo político ao TSE na última eleição.
 * Os arquivos são gerados a partir dos dados abertos do TSE (bens e candidatos), cruzando pelo CPF
 * informado pela Câmara (deputados) ou pelo nome completo + UF (senadores). Sem arquivo: null ("sem dados").
 */
export async function patrimonioDe(casa: 'camara' | 'senado', id: number | string): Promise<Patrimonio | null> {
  try {
    const resp = await fetch(`dados/patrimonio/${casa}-${id}.json`);
    if (!resp.ok) return null;
    return (await resp.json()) as Patrimonio;
  } catch {
    return null;
  }
}

/** Soma dos bens por tipo (casa, carro, aplicações...), do maior para o menor. */
export function bensPorTipo(p: Patrimonio): { tipo: string; total: number; quantidade: number }[] {
  const mapa = new Map<string, { tipo: string; total: number; quantidade: number }>();
  for (const b of p.bens) {
    const tipo = tipoCurto(b.tipo);
    const atual = mapa.get(tipo) ?? { tipo, total: 0, quantidade: 0 };
    atual.total += b.valor;
    atual.quantidade++;
    mapa.set(tipo, atual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}

/** Nomes do TSE são longos ("Veículo automotor terrestre: caminhão, automóvel, moto, etc."): encurta para a tela. */
export function tipoCurto(tipo: string): string {
  const t = tipo.trim();
  const regras: [RegExp, string][] = [
    [/^(ve[ií]culo automotor|embarca[cç][aã]o|aeronave)/i, 'Veículos, barcos e aviões'],
    [/^(casa|apartamento|terreno|terra nua|pr[eé]dio|sala|loja|galp[aã]o|constru[cç][aã]o|benfeitoria|outros bens im[oó]veis)/i, 'Imóveis'],
    [/^(dep[oó]sito banc|caderneta de poupan|dinheiro em esp[eé]cie|outros dep[oó]sitos|poupan[cç]a para)/i, 'Dinheiro e contas'],
    [/^(fundo|aplica[cç]|outras aplica|vgbl|pgbl|ouro|t[ií]tulo p[uú]blico)/i, 'Aplicações e investimentos'],
    [/^(quotas|a[cç][oõ]es|outras participa)/i, 'Empresas e ações'],
    [/^(cr[eé]dito|outros cr[eé]ditos)/i, 'Créditos e empréstimos'],
    [/^cons[oó]rcio/i, 'Consórcios'],
    [/^j[oó]ia/i, 'Joias e arte'],
  ];
  for (const [re, nome] of regras) if (re.test(t)) return nome;
  return 'Outros bens e direitos';
}

// ---------------------------------------------------------------------

/** Um compromisso do deputado na Câmara (reunião de comissão, audiência, sessão...). */
export interface EventoAgenda {
  id: number;
  inicio: string;
  fim: string | null;
  situacao: string;
  tipo: string;
  descricao: string;
  local: string | null;
  orgaos: { sigla: string; nome: string }[];
  url: string;
}

/** Segunda-feira da semana de uma data (agenda vai de segunda a domingo). */
export function inicioDaSemana(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dia = (x.getDay() + 6) % 7; // 0 = segunda
  x.setDate(x.getDate() - dia);
  return x;
}

const dataIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Eventos em que o deputado está inscrito na semana (API de Dados Abertos da Câmara:
 * GET /deputados/{id}/eventos). Inclui reuniões de comissões, audiências públicas e sessões do plenário.
 */
export async function agendaDaSemana(idDeputado: number, segunda: Date): Promise<EventoAgenda[]> {
  const domingo = new Date(segunda);
  domingo.setDate(domingo.getDate() + 6);
  const r = await jsonCamara<{
    dados: {
      id: number; dataHoraInicio: string; dataHoraFim: string | null; situacao: string; descricaoTipo: string; descricao: string;
      localCamara?: { nome?: string | null } | null; localExterno?: string | null; orgaos?: { sigla: string; nome: string }[];
    }[];
  }>(`/deputados/${idDeputado}/eventos?dataInicio=${dataIso(segunda)}&dataFim=${dataIso(domingo)}&ordem=ASC&ordenarPor=dataHoraInicio&itens=100`);
  return r.dados.map((e) => ({
    id: e.id,
    inicio: e.dataHoraInicio,
    fim: e.dataHoraFim,
    situacao: e.situacao,
    tipo: e.descricaoTipo,
    descricao: (e.descricao || '').replace(/\s+/g, ' ').trim(),
    local: e.localCamara?.nome || e.localExterno || null,
    orgaos: (e.orgaos ?? []).map((o) => ({ sigla: o.sigla, nome: o.nome })),
    url: `https://www.camara.leg.br/evento-legislativo/${e.id}`,
  }));
}
