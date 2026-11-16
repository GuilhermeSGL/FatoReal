import { Component, computed, input, output } from '@angular/core';

/** Posição (coluna, linha) de cada estado no mapa em blocos — aproximação da geografia do Brasil. */
const POSICOES: Record<string, [number, number]> = {
  RR: [1, 0], AP: [3, 0],
  AC: [0, 1], AM: [1, 1], PA: [2, 1], MA: [3, 1], CE: [4, 1], RN: [5, 1],
  RO: [1, 2], MT: [2, 2], TO: [3, 2], PI: [4, 2], PB: [5, 2],
  GO: [2, 3], BA: [3, 3], PE: [4, 3], AL: [5, 3],
  MS: [1, 4], DF: [2, 4], MG: [3, 4], SE: [4, 4],
  PR: [1, 5], SP: [2, 5], RJ: [3, 5], ES: [4, 5],
  SC: [1, 6],
  RS: [1, 7],
};

const NOMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba',
  PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
};

export function nomeEstado(uf: string): string {
  return NOMES[uf] ?? uf;
}

/** Mapa do Brasil em blocos: cada estado é um botão; a cor fica mais forte onde o número é maior. */
@Component({
  selector: 'app-mapa-brasil',
  template: `
    <div class="mapa-blocos" role="group" aria-label="Mapa do Brasil por estado">
      @for (e of estados(); track e.uf) {
        <button type="button" class="mapa-uf" [class.selecionado]="e.uf === selecionado()"
          [style.grid-column]="e.col + 1" [style.grid-row]="e.lin + 1" [style.--forca]="e.forca"
          [attr.aria-pressed]="e.uf === selecionado()" [attr.aria-label]="e.nome + ': ' + e.valor + ' ' + rotulo()" [title]="e.nome + ': ' + e.valor + ' ' + rotulo()"
          (click)="escolher.emit(e.uf === selecionado() ? '' : e.uf)">
          <strong>{{ e.uf }}</strong><small>{{ e.valor }}</small>
        </button>
      }
    </div>
  `,
})
export class MapaBrasil {
  /** Número por estado (ex.: quantidade de deputados). */
  readonly valores = input<Record<string, number>>({});
  readonly selecionado = input('');
  readonly rotulo = input('');
  readonly escolher = output<string>();

  protected readonly estados = computed(() => {
    const v = this.valores();
    const max = Math.max(1, ...Object.values(v));
    return Object.entries(POSICOES).map(([uf, [col, lin]]) => ({
      uf, col, lin, nome: NOMES[uf], valor: v[uf] ?? 0, forca: 0.18 + 0.82 * ((v[uf] ?? 0) / max),
    }));
  });
}
