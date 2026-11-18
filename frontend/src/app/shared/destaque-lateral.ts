import { Component, HostListener, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DESTAQUES_LATERAIS } from '../core/destaques-laterais';
import { AFIRMACOES } from '../core/fato-ou-fake';
import { Icone } from './componentes';

/** 1º turno das eleições municipais de 2028: primeiro domingo de outubro (Constituição, art. 29, II). */
const ELEICAO_2028 = new Date(2028, 9, 1);

/**
 * "Enquanto você rola": cartões variados logo abaixo do menu lateral, que vão trocando conforme a pessoa
 * rola a página (e também com o tempo): contagem para a eleição, quiz Fato ou Fake e campanhas do projeto.
 */
@Component({
  selector: 'app-destaque-lateral',
  imports: [RouterLink, Icone],
  template: `
    <section class="lat-cartoes" aria-label="Enquanto você rola" (mouseenter)="pausado.set(true)" (mouseleave)="pausado.set(false)" (focusin)="pausado.set(true)" (focusout)="pausado.set(false)">
      <p class="lat-k">Enquanto você rola</p>

      @if (dias() > 0) {
        <a class="lat-cartao lat-eleicao" href="https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral" target="_blank" rel="noopener noreferrer">
          <small><app-icone nome="event" /> Você sabia?</small>
          <strong>Faltam {{ dias() }} dias para a eleição municipal de 2028</strong>
          <span>Tire ou regularize seu título no TSE <app-icone nome="arrow_forward" /></span>
        </a>
      }

      <div class="lat-cartao lat-quiz" [class.certo]="resposta() !== null && resposta() === quiz().fato" [class.errado]="resposta() !== null && resposta() !== quiz().fato">
        <small><app-icone nome="psychology" /> Quiz rápido · fato ou fake?</small>
        <strong>{{ quiz().texto }}</strong>
        @if (resposta() === null) {
          <div class="lat-quiz-botoes">
            <button type="button" (click)="responder(true)">Fato</button>
            <button type="button" (click)="responder(false)">Fake</button>
          </div>
        } @else {
          <span class="lat-quiz-res">{{ resposta() === quiz().fato ? 'Acertou! ' : 'Quase! ' }}É {{ quiz().fato ? 'FATO' : 'FAKE' }}.
            <a [href]="quiz().fonte.url" target="_blank" rel="noopener noreferrer">Fonte</a> · <button type="button" class="link-sutil" (click)="proximoQuiz()">Outra</button></span>
        }
      </div>

      @for (d of itens; track d.titulo; let i = $index) {
        @if (i === atual()) {
          <a [routerLink]="d.rota" class="destaque-item lat-giro" [style.--cor]="d.cor">
            <span class="destaque-tipo">{{ d.tipo }}</span>
            <strong>{{ d.titulo }}</strong>
            @if (d.texto) { <small>{{ d.texto }}</small> }
            @if (d.icone) { <span class="destaque-icone"><app-icone [nome]="d.icone" /></span> }
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
  /** Sem a imagem grande (a lateral fica mais enxuta); imagem só no primeiro item, que é o projeto. */
  protected readonly itens = DESTAQUES_LATERAIS.filter((d) => !d.imagem);
  protected readonly atual = signal(0);
  protected readonly pausado = signal(false);
  protected readonly dias = signal(Math.ceil((ELEICAO_2028.getTime() - Date.now()) / 86_400_000));
  private readonly indiceQuiz = signal(Math.floor(Math.random() * AFIRMACOES.length));
  protected readonly quiz = computed(() => AFIRMACOES[this.indiceQuiz() % AFIRMACOES.length]);
  protected readonly resposta = signal<boolean | null>(null);
  private ultimoY = 0;
  private relogio = setInterval(() => this.avancar(), 9000);

  /** Rolou a página uns 600px: troca o cartão de campanha (e o quiz, se já foi respondido). */
  @HostListener('window:scroll')
  protected aoRolar() {
    if (Math.abs(window.scrollY - this.ultimoY) < 600) return;
    this.ultimoY = window.scrollY;
    this.avancar();
    if (this.resposta() !== null) this.proximoQuiz();
  }

  private avancar() {
    if (this.pausado() || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.atual.update((i) => (i + 1) % this.itens.length);
  }

  protected responder(fato: boolean) {
    this.resposta.set(fato);
  }

  protected proximoQuiz() {
    this.resposta.set(null);
    this.indiceQuiz.update((i) => i + 1 + Math.floor(Math.random() * 3));
  }

  ngOnDestroy() {
    clearInterval(this.relogio);
  }
}
