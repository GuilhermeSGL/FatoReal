import { Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { FORMAS, VIEWBOX } from './mapa-estados-formas';
import { nomeEstado } from './mapa-brasil';

/** Cor de cada região do Brasil (mesma legenda em todo o site). */
export const REGIOES: { nome: string; cor: string; ufs: string[] }[] = [
  { nome: 'Norte', cor: '#16a34a', ufs: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'] },
  { nome: 'Nordeste', cor: '#f59e0b', ufs: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'] },
  { nome: 'Centro-Oeste', cor: '#ea580c', ufs: ['DF', 'GO', 'MS', 'MT'] },
  { nome: 'Sudeste', cor: '#2563eb', ufs: ['ES', 'MG', 'RJ', 'SP'] },
  { nome: 'Sul', cor: '#7c3aed', ufs: ['PR', 'RS', 'SC'] },
];
const COR: Record<string, string> = Object.fromEntries(REGIOES.flatMap((r) => r.ufs.map((u) => [u, r.cor])));

/**
 * Mapa do Brasil com o formato real dos estados, colorido por região.
 * Cada estado é clicável (mouse, toque ou teclado) e mostra um balão com o nome e um número opcional.
 */
@Component({
  selector: 'app-mapa-estados',
  template: `
    <div class="mapa-estados" #caixa>
      <svg [attr.viewBox]="viewBox" role="group" aria-label="Mapa do Brasil: escolha um estado">
        @for (e of estados(); track e.uf) {
          <path class="mapa-estado" [attr.d]="e.d" [style.--c]="e.cor" [class.selecionado]="e.uf === selecionado()" [class.destaque]="e.uf === destaque()"
            tabindex="0" role="button" [attr.aria-label]="e.nome + (e.texto ? ': ' + e.texto : '')" [attr.aria-pressed]="e.uf === selecionado()"
            (mouseenter)="mostrar(e.uf, $event)" (mouseleave)="balao.set(null)" (focus)="mostrar(e.uf, $event)" (blur)="balao.set(null)"
            (click)="escolher.emit(e.uf)" (keydown.enter)="escolher.emit(e.uf)" (keydown.space)="$event.preventDefault(); escolher.emit(e.uf)" />
        }
        @for (e of estados(); track e.uf) {
          @if (!e.pequeno) { <text class="mapa-sigla" [attr.x]="e.x" [attr.y]="e.y">{{ e.uf }}</text> }
        }
      </svg>
      @if (balao(); as b) {
        <div class="mapa-balao" [style.left.px]="b.x" [style.top.px]="b.y" aria-hidden="true">
          <strong>{{ b.nome }}</strong>@if (b.texto) { <small>{{ b.texto }}</small> }
        </div>
      }
    </div>
  `,
})
export class MapaEstados {
  /** Estado escolhido agora. */
  readonly selecionado = input('');
  /** Estado da pessoa (perfil), com contorno. */
  readonly destaque = input('');
  /** Texto extra do balão por estado (ex.: "25 deputados"). */
  readonly textos = input<Record<string, string>>({});
  readonly escolher = output<string>();

  protected readonly viewBox = VIEWBOX;
  private readonly caixa = viewChild.required<ElementRef<HTMLElement>>('caixa');
  protected readonly balao = signal<{ nome: string; texto: string; x: number; y: number } | null>(null);
  protected readonly estados = computed(() =>
    FORMAS.map((f) => ({ ...f, cor: COR[f.uf], nome: nomeEstado(f.uf), texto: this.textos()[f.uf] ?? '' })),
  );

  protected mostrar(uf: string, ev: Event) {
    const alvo = (ev.target as SVGPathElement).getBoundingClientRect();
    const caixa = this.caixa().nativeElement.getBoundingClientRect();
    this.balao.set({ nome: nomeEstado(uf), texto: this.textos()[uf] ?? '', x: alvo.left - caixa.left + alvo.width / 2, y: alvo.top - caixa.top });
  }
}
