import { Component, inject, input, signal } from '@angular/core';
import { OpinioesService, Opiniao, Placar } from '../core/opinioes.service';
import { Traducao, traduzirEmenta } from '../core/tradutor';
import { Icone } from './componentes';
import { Favoritar } from './favoritar';

/** Embaixo de cada projeto: "Explicar em linguagem simples" e "Você é a favor ou contra?". */
@Component({
  selector: 'app-projeto-acoes',
  imports: [Icone, Favoritar],
  template: `
    <div class="projeto-acoes">
      @if (ementa()) {
        <button type="button" class="botao-explicar" [attr.aria-expanded]="!!traducao()" (click)="explicar()">
          <app-icone nome="translate" /> {{ traducao() ? 'Esconder explicação' : 'Explicar em linguagem simples' }}
        </button>
      }
      @if (idProposicao(); as id) {
        <app-favoritar tipo="projeto" [refId]="id" [titulo]="titulo() || 'Proposição ' + id" [url]="'https://www.camara.leg.br/propostas-legislativas/' + id" [compacto]="true" />
        <div class="opinar" role="group" aria-label="Sua opinião sobre o projeto">
          <span class="texto-suave">Você é:</span>
          <button type="button" class="opinar-favor" [attr.aria-pressed]="placar()?.minha === 'favor'" (click)="opinar(id, 'favor')">
            <app-icone nome="thumb_up" /> A favor @if (placar(); as pl) { <strong>{{ pl.favor }}</strong> }
          </button>
          <button type="button" class="opinar-contra" [attr.aria-pressed]="placar()?.minha === 'contra'" (click)="opinar(id, 'contra')">
            <app-icone nome="thumb_down" /> Contra @if (placar(); as pl) { <strong>{{ pl.contra }}</strong> }
          </button>
        </div>
      }
    </div>
    @if (traducao(); as t) {
      <div class="traducao" role="note">
        <strong><app-icone nome="translate" /> Em palavras simples</strong>
        <p>{{ t.simples }}</p>
        @for (l of t.leis; track l.numero) { <small>A Lei {{ l.numero }} é o(a) <b>{{ l.nome }}</b>.</small> }
        <small class="texto-suave">{{ t.porIa ? 'Explicação gerada por IA' : 'Explicação automática' }}: pode não ser perfeita. Confira sempre o texto original.</small>
      </div>
    }
  `,
})
export class ProjetoAcoes {
  private opinioes = inject(OpinioesService);
  readonly ementa = input('');
  readonly idProposicao = input<number | null>(null);
  /** Título curto do projeto (ex.: "PL 10/2026"), usado nos Salvos. */
  readonly titulo = input('');
  protected readonly traducao = signal<Traducao | null>(null);
  protected readonly placar = signal<Placar | null>(null);
  private carregouPlacar = false;

  ngOnInit() {
    const id = this.idProposicao();
    if (id && !this.carregouPlacar) {
      this.carregouPlacar = true;
      this.opinioes.placar(id).then((p) => this.placar.set(p)).catch(() => {});
    }
  }

  protected async explicar() {
    if (this.traducao()) return this.traducao.set(null);
    this.traducao.set(await traduzirEmenta(this.ementa()));
  }

  protected async opinar(id: number, o: Opiniao) {
    this.placar.set(await this.opinioes.opinar(id, o));
  }
}
