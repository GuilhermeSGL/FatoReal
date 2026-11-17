/**
 * "Tradutor de juridiquês": explica a ementa de um projeto em linguagem simples.
 * Usa a API (POST {API_URL}/traduzir → { explicacao }) quando existir; senão, regras locais.
 */
import { apiUrl, modoDemo } from './supabase';

export interface Traducao {
  simples: string;
  leis: { numero: string; nome: string }[];
  porIa: boolean;
}

/** Leis famosas, para dizer o nome popular quando a ementa só cita o número. */
const LEIS: Record<string, string> = {
  '8.069/1990': 'Estatuto da Criança e do Adolescente, o ECA',
  '9.503/1997': 'Código de Trânsito Brasileiro',
  '8.078/1990': 'Código de Defesa do Consumidor',
  '2.848/1940': 'Código Penal',
  '5.452/1943': 'CLT, as leis do trabalho',
  '9.394/1996': 'Lei de Diretrizes e Bases da Educação, a LDB',
  '11.340/2006': 'Lei Maria da Penha',
  '10.741/2003': 'Estatuto da Pessoa Idosa',
  '10.406/2002': 'Código Civil',
  '14.133/2021': 'Lei de Licitações',
  '8.080/1990': 'Lei do SUS',
  '7.210/1984': 'Lei de Execução Penal',
  '3.689/1941': 'Código de Processo Penal',
  '11.343/2006': 'Lei de Drogas',
  '10.826/2003': 'Estatuto do Desarmamento',
  '4.737/1965': 'Código Eleitoral',
  '9.504/1997': 'Lei das Eleições',
  '12.965/2014': 'Marco Civil da Internet',
  '13.709/2018': 'Lei Geral de Proteção de Dados, a LGPD',
  '13.146/2015': 'Estatuto da Pessoa com Deficiência',
};

const TROCAS: [RegExp, string][] = [
  [/,?\s*e dá outras providências\.?/gi, '.'],
  [/\bdispõe sobre\b/gi, 'trata de'],
  [/\bpara dispor sobre\b/gi, 'para tratar de'],
  [/\bdispor sobre\b/gi, 'tratar de'],
  [/\bacrescenta\b/gi, 'adiciona'],
  [/\bacrescentar\b/gi, 'adicionar'],
  [/\baltera\b/gi, 'muda'],
  [/\balterar\b/gi, 'mudar'],
  [/\brevoga\b/gi, 'cancela'],
  [/\brevogar\b/gi, 'cancelar'],
  [/\bfica instituíd[oa]\b/gi, 'passa a existir'],
  [/\binstitui\b/gi, 'cria'],
  [/\binstituir\b/gi, 'criar'],
  [/\bveda\b/gi, 'proíbe'],
  [/\bvedar\b/gi, 'proibir'],
  [/\bvedação\b/gi, 'proibição'],
  [/\bfaculta\b/gi, 'permite'],
  [/\bfacultar\b/gi, 'permitir'],
  [/\bobsta\b/gi, 'impede'],
  [/\bno âmbito d[oa]\b/gi, 'dentro de'],
  [/\ba fim de\b/gi, 'para'],
  [/\bconcernentes?\b/gi, 'sobre'],
  [/\bônus\b/gi, 'custo'],
  [/\bdenomina\b/gi, 'dá o nome de'],
  [/\bsusta(m)?\b/gi, 'suspende'],
  [/\bsustar\b/gi, 'suspender'],
  [/\binciso\b/gi, 'item'],
  [/\bcaput\b/gi, 'texto principal'],
  [/\bart\.\s*/gi, 'artigo '],
  [/\barts\.\s*/gi, 'artigos '],
  [/\bnº\s*/gi, 'nº '],
  [/\bDecreto-Lei\b/g, 'Decreto-Lei'],
  [/\s{2,}/g, ' '],
  [/\.\./g, '.'],
];

const INICIOS: [RegExp, string][] = [
  [/^(muda|adiciona)\b/i, 'Esta proposta quer mudar uma lei que já existe: '],
  [/^cancela\b/i, 'Esta proposta quer cancelar regras que existem hoje: '],
  [/^cria\b/i, 'Esta proposta quer criar algo novo: '],
  [/^proíbe\b/i, 'Esta proposta quer proibir algo: '],
  [/^trata de\b/i, 'Esta proposta é sobre o seguinte: '],
  [/^suspende\b/i, 'Esta proposta quer suspender uma decisão do governo: '],
  [/^dá o nome de\b/i, 'Esta proposta dá nome a um lugar ou obra: '],
];

function porRegras(ementa: string): Traducao {
  const leis: Traducao['leis'] = [];
  // "Lei nº 8.069, de 13 de julho de 1990" -> nome popular
  const re = /(?:Lei|Decreto-Lei)(?: Complementar)? nº\s*([\d.]+),?\s*de\s*\d{1,2}º?\s*de\s*[a-zç]+\s*de\s*(\d{4})/gi;
  let texto = ementa.replace(re, (todo, num: string, ano: string) => {
    const nome = LEIS[`${num}/${ano}`];
    if (nome && !leis.some((l) => l.nome === nome)) leis.push({ numero: `${num}/${ano}`, nome });
    return nome ? `${todo} (${nome})` : todo;
  });
  for (const [a, b] of TROCAS) texto = texto.replace(a, b);
  texto = texto.trim().replace(/\s+\./g, '.');
  let inicio = '';
  for (const [a, b] of INICIOS) {
    if (a.test(texto)) {
      inicio = b;
      break;
    }
  }
  if (texto) texto = (inicio ? texto.charAt(0).toLowerCase() : texto.charAt(0).toUpperCase()) + texto.slice(1);
  return { simples: inicio + texto, leis, porIa: false };
}

const cache = new Map<string, Promise<Traducao>>();

export function traduzirEmenta(ementa: string): Promise<Traducao> {
  if (!cache.has(ementa)) {
    cache.set(ementa, (async () => {
      try {
        const r = await fetch(`${apiUrl}/traduzir`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: ementa }),
        });
        if (r.ok && r.headers.get('content-type')?.includes('json')) {
          const j = (await r.json()) as { explicacao?: string };
          if (j.explicacao) return { simples: j.explicacao, leis: porRegras(ementa).leis, porIa: true };
        }
      } catch {
        /* sem API: usa as regras */
      }
      if (!modoDemo) {
        /* com back-end mas sem a rota /traduzir: regras também */
      }
      return porRegras(ementa);
    })());
  }
  return cache.get(ementa)!;
}
