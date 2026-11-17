import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Afirmacao, rodadaDaSemana, semanaDoAno } from '../../core/fato-ou-fake';
import { Icone } from '../../shared/componentes';

const CHAVE = 'fatoreal-fato-ou-fake';
interface Salvo { semana: number; respostas: Record<number, boolean>; recorde: number; sequencia: number; ultimaSemana: number }

function ler(): Salvo {
  try {
    return { semana: 0, respostas: {}, recorde: 0, sequencia: 0, ultimaSemana: 0, ...JSON.parse(localStorage.getItem(CHAVE) ?? '{}') };
  } catch {
    return { semana: 0, respostas: {}, recorde: 0, sequencia: 0, ultimaSemana: 0 };
  }
}

/** Jogo semanal: 5 afirmações, a pessoa chuta Fato ou Fake e vê a explicação com fonte. */
@Component({
  selector: 'app-fato-ou-fake',
  imports: [RouterLink, Icone],
  template: `
    <header class="cabecalho-pagina">
      <p class="sobretitulo">Jogo da semana</p>
      <h1>Fato ou Fake?</h1>
      <p>5 afirmações sobre política e eleições. Chute se é fato ou fake e veja a explicação com a fonte oficial. As perguntas mudam toda segunda-feira.</p>
    </header>

    <section class="card fof-placar">
      <div><strong>{{ acertos() }}/{{ respondidas() }}</strong><small>acertos nesta rodada</small></div>
      <div><strong>{{ salvo().sequencia }}</strong><small>semana(s) seguidas jogando</small></div>
      <div><strong>{{ salvo().recorde }}/5</strong><small>seu recorde</small></div>
    </section>

    <ol class="fof-lista">
      @for (a of rodada; track a.id; let i = $index) {
        @let r = salvo().respostas[a.id];
        <li class="card fof-item" [class.acertou]="r !== undefined && r === a.fato" [class.errou]="r !== undefined && r !== a.fato">
          <span class="fof-numero">{{ i + 1 }}</span>
          <p class="fof-texto">“{{ a.texto }}”</p>
          @if (r === undefined) {
            <div class="fof-botoes">
              <button type="button" class="fof-fato" (click)="responder(a, true)"><app-icone nome="check_circle" /> Fato</button>
              <button type="button" class="fof-fake" (click)="responder(a, false)"><app-icone nome="cancel" /> Fake</button>
            </div>
          } @else {
            <div class="fof-resposta" role="status">
              <strong>
                <app-icone [nome]="r === a.fato ? 'celebration' : 'sentiment_dissatisfied'" />
                {{ r === a.fato ? 'Acertou!' : 'Errou.' }} É {{ a.fato ? 'FATO' : 'FAKE' }}.
              </strong>
              <p>{{ a.explicacao }}</p>
              <a [href]="a.fonte.url" target="_blank" rel="noopener noreferrer"><app-icone nome="open_in_new" /> Fonte: {{ a.fonte.titulo }}</a>
            </div>
          }
        </li>
      }
    </ol>

    @if (respondidas() === 5) {
      <section class="card fof-final">
        <app-icone [nome]="acertos() >= 4 ? 'military_tech' : acertos() >= 2 ? 'thumb_up' : 'school'" />
        <h2>{{ acertos() === 5 ? 'Perfeito! Ninguém te engana.' : acertos() >= 3 ? 'Mandou bem!' : 'Bora aprender mais?' }}</h2>
        <p>Você acertou {{ acertos() }} de 5. Volte na segunda-feira para a próxima rodada.</p>
        <div class="fof-final-acoes">
          <button type="button" class="botao botao-verde" (click)="compartilhar()"><app-icone nome="share" /> Desafiar amigos</button>
          <a routerLink="/base-da-politica" class="botao botao-fantasma"><app-icone nome="school" /> Aprender na Base da Política</a>
        </div>
      </section>
    }
  `,
})
export class FatoOuFakePage {
  private readonly semana = semanaDoAno();
  protected readonly rodada = rodadaDaSemana(this.semana);
  protected readonly salvo = signal<Salvo>(this.carregar());
  protected readonly respondidas = computed(() => this.rodada.filter((a) => this.salvo().respostas[a.id] !== undefined).length);
  protected readonly acertos = computed(() => this.rodada.filter((a) => this.salvo().respostas[a.id] === a.fato).length);

  private carregar(): Salvo {
    const s = ler();
    // Semana nova: zera as respostas, mantém recorde e sequência
    return s.semana === this.semana ? s : { ...s, semana: this.semana, respostas: {} };
  }

  protected responder(a: Afirmacao, fato: boolean) {
    const s = { ...this.salvo(), respostas: { ...this.salvo().respostas, [a.id]: fato } };
    if (s.ultimaSemana !== this.semana) {
      s.sequencia = s.ultimaSemana === this.semana - 1 ? s.sequencia + 1 : 1;
      s.ultimaSemana = this.semana;
    }
    this.salvo.set(s);
    if (this.respondidas() === 5) this.salvo.update((x) => ({ ...x, recorde: Math.max(x.recorde, this.acertos()) }));
    try {
      localStorage.setItem(CHAVE, JSON.stringify(this.salvo()));
    } catch {
      /* sem localStorage */
    }
  }

  protected async compartilhar() {
    const texto = `Acertei ${this.acertos()} de 5 no Fato ou Fake da semana do Fato Real. Duvido você acertar mais!`;
    try {
      if (navigator.share) await navigator.share({ title: 'Fato ou Fake?', text: texto, url: location.href });
      else await navigator.clipboard.writeText(`${texto} ${location.href}`);
    } catch {
      /* cancelado */
    }
  }
}
