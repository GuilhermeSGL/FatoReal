import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ComunidadesService } from '../core/comunidades.service';
import { Comunidade } from '../core/modelos';
import { UFS } from '../core/util';
import { COR_TEMA, ICONE_TEMA } from '../core/visual';
import { nomeEstado } from './mapa-brasil';
import { Icone } from './componentes';

const CHAVE_VISTO = 'fatoreal-boas-vindas-v1';
export const CHAVE_INTERESSES = 'fatoreal-interesses';

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}
function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem localStorage */
  }
}

/** Tela de boas-vindas do primeiro acesso: apresenta o site, pergunta o estado e os interesses. */
@Component({
  selector: 'app-boas-vindas',
  imports: [RouterLink, Icone],
  template: `
    @if (aberta()) {
      <div class="bv-fundo" (click)="fechar()"></div>
      <section class="bv-caixa" role="dialog" aria-modal="true" aria-labelledby="bv-titulo">
        <button type="button" class="botao-icone bv-pular" (click)="fechar()" aria-label="Pular apresentação"><app-icone nome="close" /></button>
        <div class="bv-passos" aria-hidden="true">
          @for (n of [0, 1, 2]; track n) { <span [class.ativo]="passo() >= n"></span> }
        </div>

        @switch (passo()) {
          @case (0) {
            <div class="bv-ilustracao"><app-icone nome="verified" /></div>
            <h2 id="bv-titulo">Boas-vindas ao Fato Real</h2>
            <p>A rede social para entender a política com <strong>dados oficiais</strong> e combater fake news.</p>
            <ul class="bv-lista">
              <li><app-icone nome="person_search" /> Veja gastos, votações e polêmicas de deputados e senadores</li>
              <li><app-icone nome="fact_check" /> Verifique se uma notícia é verdadeira antes de compartilhar</li>
              <li><app-icone nome="groups" /> Converse em comunidades sobre os temas que importam</li>
            </ul>
          }
          @case (1) {
            <div class="bv-ilustracao"><app-icone nome="location_on" /></div>
            <h2 id="bv-titulo">Onde você vota?</h2>
            <p>Assim a gente mostra os seus deputados e senadores logo na página inicial.</p>
            <div class="bv-ufs" role="radiogroup" aria-label="Estado">
              @for (u of ufs; track u) {
                <button type="button" role="radio" [attr.aria-checked]="uf() === u" [class.ativo]="uf() === u" [title]="nome(u)" (click)="uf.set(u)">{{ u }}</button>
              }
            </div>
            @if (uf()) { <small class="texto-suave">{{ nome(uf()) }}</small> }
          }
          @case (2) {
            <div class="bv-ilustracao"><app-icone nome="interests" /></div>
            <h2 id="bv-titulo">O que te interessa?</h2>
            <p>Escolha temas e já indicamos comunidades para você participar.</p>
            <div class="bv-temas">
              @for (t of temas; track t) {
                <button type="button" [attr.aria-pressed]="interesses().includes(t)" [class.ativo]="interesses().includes(t)" [style.--cor]="cor[t]" (click)="alternar(t)">
                  <app-icone [nome]="icone[t]" /> {{ t }}
                </button>
              }
            </div>
            @if (sugeridas().length) {
              <div class="bv-sugeridas">
                <strong>Comunidades para você</strong>
                @for (c of sugeridas(); track c.id) {
                  <a [routerLink]="['/comunidades', c.slug]" (click)="concluir()"><app-icone [nome]="icone[c.tema] || 'groups'" /> {{ c.nome }}</a>
                }
              </div>
            }
          }
        }

        <footer class="bv-rodape">
          @if (passo() > 0) { <button type="button" class="botao botao-fantasma" (click)="passo.set(passo() - 1)">Voltar</button> }
          @else { <button type="button" class="link-discreto" (click)="fechar()">Pular</button> }
          @if (passo() < 2) {
            <button type="button" class="botao botao-verde" (click)="avancar()">{{ passo() === 1 && !uf() ? 'Pular esta etapa' : 'Continuar' }} <app-icone nome="arrow_forward" /></button>
          } @else {
            <button type="button" class="botao botao-verde" (click)="concluir()">Começar <app-icone nome="check" /></button>
          }
        </footer>
      </section>
    }
  `,
})
export class BoasVindas {
  private comunidades = inject(ComunidadesService);
  protected readonly aberta = signal(!ler(CHAVE_VISTO));
  protected readonly passo = signal(0);
  protected readonly uf = signal(ler('fatoreal-uf') ?? '');
  protected readonly interesses = signal<string[]>(JSON.parse(ler(CHAVE_INTERESSES) ?? '[]'));
  protected readonly sugeridas = signal<Comunidade[]>([]);
  protected readonly ufs = UFS;
  protected readonly temas = Object.keys(ICONE_TEMA);
  protected readonly icone = ICONE_TEMA;
  protected readonly cor = COR_TEMA;
  protected nome = nomeEstado;
  private todas: Comunidade[] = [];

  protected avancar() {
    this.passo.update((p) => p + 1);
    if (this.passo() === 2 && !this.todas.length) {
      this.comunidades.listar().then((l) => { this.todas = l; this.atualizarSugeridas(); }).catch(() => {});
    }
  }

  protected alternar(t: string) {
    this.interesses.update((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]));
    this.atualizarSugeridas();
  }

  private atualizarSugeridas() {
    const i = this.interesses();
    this.sugeridas.set(this.todas.filter((c) => i.includes(c.tema)).sort((a, b) => b.total_membros - a.total_membros).slice(0, 3));
  }

  protected concluir() {
    if (this.uf()) {
      gravar('fatoreal-uf', this.uf());
      window.dispatchEvent(new CustomEvent('fatoreal-uf', { detail: this.uf() }));
    }
    gravar(CHAVE_INTERESSES, JSON.stringify(this.interesses()));
    this.fechar();
  }

  protected fechar() {
    gravar(CHAVE_VISTO, '1');
    this.aberta.set(false);
  }
}
