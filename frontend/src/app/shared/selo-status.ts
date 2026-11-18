import { Component, computed, input } from '@angular/core';
import { Icone } from './componentes';

/** Selos de status, iguais em todo o site (referência: slides 2, 11 e 20 da apresentação). */
export type TipoSelo = 'verificado' | 'confiavel' | 'analise' | 'novo' | 'falso' | 'sem-contexto' | 'insuficiente' | 'usuario';

export const SELOS: Record<TipoSelo, { texto: string; icone: string; explicacao: string }> = {
  verificado: { texto: 'Verificado', icone: 'verified', explicacao: 'Conferido em fontes oficiais ou confiáveis.' },
  confiavel: { texto: 'Confiável', icone: 'shield', explicacao: 'Vem direto de fonte oficial (órgão público, Câmara, Senado, TSE).' },
  analise: { texto: 'Em análise', icone: 'schedule', explicacao: 'Recebido e aguardando busca de fontes ou revisão humana.' },
  novo: { texto: 'Novo', icone: 'auto_awesome', explicacao: 'Publicado nas últimas 24 horas.' },
  falso: { texto: 'Falso', icone: 'cancel', explicacao: 'Fontes oficiais ou confiáveis mostram que não é verdade.' },
  'sem-contexto': { texto: 'Sem contexto', icone: 'help', explicacao: 'Tem base nos fatos, mas data, lugar ou sentido foram alterados.' },
  insuficiente: { texto: 'Evidência insuficiente', icone: 'do_not_disturb_on', explicacao: 'Não há fontes suficientes para confirmar nem negar.' },
  usuario: { texto: 'Publicação de usuário', icone: 'person', explicacao: 'Escrito por um membro da comunidade, ainda sem checagem.' },
};

/** Converte o resultado da verificação no selo. */
export function seloDoEstado(estado: string): TipoSelo {
  return ({
    'Evidências sustentam': 'verificado',
    'Evidências contradizem': 'falso',
    'Fora de contexto': 'sem-contexto',
    'Evidência insuficiente': 'insuficiente',
    'Fonte confiável': 'confiavel',
    'Em análise': 'analise',
  } as Record<string, TipoSelo>)[estado] ?? 'analise';
}

@Component({
  selector: 'app-selo',
  imports: [Icone],
  template: `<app-icone [nome]="info().icone" /><span>{{ texto() || info().texto }}</span>`,
  host: { class: 'selo-status', '[attr.data-selo]': 'tipo()', '[attr.title]': 'info().explicacao', '[class.selo-grande]': 'grande()' },
})
export class SeloStatus {
  readonly tipo = input.required<TipoSelo>();
  readonly texto = input('');
  readonly grande = input(false);
  protected readonly info = computed(() => SELOS[this.tipo()]);
}
