import { Injectable } from '@angular/core';
import { lerDemo, salvarDemo } from './demo-store';
import { EstadoVerificacao } from './fatobot.service';
import { supabase } from './supabase';

/** Uma afirmação checada na página Verificar Informação (para o "Termômetro de fake news"). */
export interface Checagem {
  afirmacao: string;
  estado: EstadoVerificacao;
  resumo: string;
  fonte?: { titulo: string; url: string } | null;
  criado_em: string;
}

/** Exemplos do modo demonstração: afirmações comuns, com a resposta correta e a fonte oficial. */
const EXEMPLOS: Checagem[] = [
  {
    afirmacao: 'Dá para votar pela internet nas eleições.', estado: 'Evidências contradizem',
    resumo: 'No Brasil, o voto é presencial, na urna eletrônica da seção eleitoral.',
    fonte: { titulo: 'TSE', url: 'https://www.tse.jus.br/' }, criado_em: horasAtras(3),
  },
  {
    afirmacao: 'Voto em branco vai para o candidato que está ganhando.', estado: 'Evidências contradizem',
    resumo: 'Votos brancos e nulos não são contados para nenhum candidato.',
    fonte: { titulo: 'TSE', url: 'https://www.tse.jus.br/' }, criado_em: horasAtras(7),
  },
  {
    afirmacao: 'Quem deixa de votar em três eleições seguidas e não justifica pode ter o título cancelado.', estado: 'Evidências sustentam',
    resumo: 'O Código Eleitoral prevê o cancelamento nesse caso; dá para regularizar na Justiça Eleitoral.',
    fonte: { titulo: 'TSE', url: 'https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral' }, criado_em: horasAtras(20),
  },
  {
    afirmacao: 'A Câmara dos Deputados tem 513 deputados.', estado: 'Evidências sustentam',
    resumo: 'São 513 deputados federais, eleitos para mandatos de quatro anos.',
    fonte: { titulo: 'Câmara dos Deputados', url: 'https://www.camara.leg.br/' }, criado_em: horasAtras(30),
  },
];

function horasAtras(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

@Injectable({ providedIn: 'root' })
export class ChecagensService {
  /** Checagens mais recentes (as suas + exemplos no modo demonstração; no Supabase, tabela "checagens" se existir). */
  async recentes(limite = 4): Promise<Checagem[]> {
    if (supabase) {
      const { data, error } = await supabase.from('checagens').select('*').order('criado_em', { ascending: false }).limit(limite);
      return error ? [] : (data as Checagem[]);
    }
    return [...lerDemo<Checagem[]>('checagens-v1', []), ...EXEMPLOS]
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
      .slice(0, limite);
  }

  /** Guarda uma checagem feita na página Verificar (modo demonstração). */
  registrar(c: Checagem) {
    if (supabase || !c.afirmacao) return;
    const lista = lerDemo<Checagem[]>('checagens-v1', []);
    salvarDemo('checagens-v1', [c, ...lista].slice(0, 30));
  }
}
