import { Component, input } from '@angular/core';
import { Icone } from './componentes';

/**
 * Faixa de topo ilustrada (mesmo estilo do Ranking de gastos): degradê da seção, ilustração à direita,
 * sobretítulo, título, texto curto e um selo de fonte opcional.
 */
@Component({
  selector: 'app-faixa',
  imports: [Icone],
  template: `
    <section class="faixa" [style.--f1]="cores()[0]" [style.--f2]="cores()[1]" [style.--f3]="cores()[2]">
      @if (imagem()) { <img [src]="imagem()" alt="" /> }
      @else if (icone()) { <span class="faixa-icone-grande" aria-hidden="true"><app-icone [nome]="icone()" /></span> }
      <p class="faixa-k">@if (icone()) { <app-icone [nome]="icone()" /> } {{ sobretitulo() }}</p>
      <h1>{{ titulo() }}</h1>
      @if (texto()) { <p class="faixa-texto">{{ texto() }}</p> }
      @if (fonte()) { <span class="gst-pill"><app-icone nome="verified" /> {{ fonte() }}</span> }
      <ng-content />
    </section>
  `,
})
export class Faixa {
  readonly sobretitulo = input('');
  readonly titulo = input.required<string>();
  readonly texto = input('');
  readonly imagem = input('');
  readonly icone = input('');
  readonly fonte = input('');
  /** Três cores do degradê (escuro → claro). */
  readonly cores = input<[string, string, string]>(['#064e3b', '#047857', '#10b981']);
}
