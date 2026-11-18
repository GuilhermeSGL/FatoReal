import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DESTAQUES_LATERAIS } from '../core/destaques-laterais';
import { Icone } from './componentes';

/** Espaço dinâmico do menu lateral: alterna campanhas, comunicados e dicas. Pausa ao passar o mouse ou focar. */
@Component({
  selector: 'app-destaque-lateral',
  imports: [RouterLink, Icone],
  template: `
    <section class="destaque-lateral" aria-roledescription="carrossel" aria-label="Destaques do Fato Real"
      (mouseenter)="pausado.set(true)" (mouseleave)="pausado.set(false)" (focusin)="pausado.set(true)" (focusout)="pausado.set(false)">
      @for (d of itens; track d.titulo; let i = $index) {
        @if (i === atual()) {
          <a [routerLink]="d.rota" class="destaque-item" [style.--cor]="d.cor" aria-live="polite">
            <span class="destaque-tipo">{{ d.tipo }}</span>
            <strong>{{ d.titulo }}</strong>
            @if (d.texto) { <small>{{ d.texto }}</small> }
            @if (d.imagem) { <img [src]="d.imagem" alt="" /> }
            @else if (d.icone) { <span class="destaque-icone"><app-icone [nome]="d.icone" /></span> }
            <span class="destaque-acao">{{ d.acao }} <app-icone nome="arrow_forward" /></span>
          </a>
        }
      }
      <div class="destaque-pontos" role="tablist" aria-label="Escolher destaque">
        @for (d of itens; track d.titulo; let i = $index) {
          <button type="button" role="tab" [attr.aria-selected]="i === atual()" [attr.aria-label]="'Destaque ' + (i + 1)" (click)="atual.set(i)"></button>
        }
      </div>
    </section>
  `,
})
export class DestaqueLateral implements OnDestroy {
  protected readonly itens = DESTAQUES_LATERAIS;
  protected readonly atual = signal(0);
  protected readonly pausado = signal(false);
  private relogio = setInterval(() => {
    if (!this.pausado() && !matchMedia('(prefers-reduced-motion: reduce)').matches) this.atual.update((i) => (i + 1) % this.itens.length);
  }, 7000);
  ngOnDestroy() {
    clearInterval(this.relogio);
  }
}
