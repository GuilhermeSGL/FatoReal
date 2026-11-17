import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LinhaRanking, rankingVotacoes } from '../../core/congresso';
import { UFS } from '../../core/util';
import { Avatar, Icone } from '../../shared/componentes';

type Ordem = 'mais-presentes' | 'menos-presentes' | 'mais-fieis' | 'mais-independentes';

@Component({
  selector: 'app-ranking-votacoes',
  imports: [FormsModule, RouterLink, Avatar, Icone],
  template: `
    <a routerLink="/politicos" class="link-voltar"><app-icone nome="arrow_back" /> Candidatos</a>
    <header class="cabecalho-pagina">
      <p class="sobretitulo">Ranking</p>
      <h1>Presença e fidelidade ao partido</h1>
      <p>Quem mais aparece para votar e quem vota igual (ou diferente) do próprio partido, nas últimas votações nominais do plenário da Câmara.</p>
    </header>

    <section class="card ranking-filtros">
      <div class="seletor-ano" role="group" aria-label="Ordenar">
        @for (o of ordens; track o.id) { <button type="button" [attr.aria-pressed]="ordem() === o.id" (click)="ordem.set(o.id)">{{ o.nome }}</button> }
      </div>
      <div class="linha-campos">
        <div class="campo-form"><label for="rk-uf">Estado</label>
          <select id="rk-uf" [ngModel]="uf()" (ngModelChange)="uf.set($event)"><option value="">Todos</option>@for (u of ufs; track u) { <option [value]="u">{{ u }}</option> }</select></div>
        <div class="campo-form"><label for="rk-partido">Partido</label>
          <select id="rk-partido" [ngModel]="partido()" (ngModelChange)="partido.set($event)"><option value="">Todos</option>@for (p of partidos(); track p) { <option [value]="p">{{ p }}</option> }</select></div>
      </div>
    </section>

    @if (carregando()) {
      <section class="card"><p class="texto-suave"><app-icone nome="hourglass_top" /> Conferindo os votos dos 513 deputados. Pode levar alguns segundos...</p>
        <div class="esqueleto-linhas"><span class="esqueleto"></span><span class="esqueleto"></span><span class="esqueleto"></span></div></section>
    } @else if (erro()) {
      <section class="card"><p class="texto-suave">Não foi possível carregar. <button type="button" class="link-discreto" (click)="carregar()">Tentar de novo</button></p></section>
    } @else {
      <section class="card">
        <p class="texto-p">Baseado em {{ votacoes() }} votações nominais dos últimos 90 dias. {{ ordem().includes('presentes') ? 'Presença = votou em quantas delas.' : 'Fidelidade = votou igual à maioria do próprio partido (Sim ou Não).' }}</p>
        <ol class="lista-ranking">
          @for (l of visiveis(); track l.id; let i = $index) {
            <li>
              <span class="rk-pos">{{ i + 1 }}º</span>
              <a [routerLink]="['/politicos', l.id]" class="rk-pessoa">
                <app-avatar class="avatar-oficial" [nome]="l.nome" [url]="l.foto" [tamanho]="40" />
                <span><strong>{{ l.nome }}</strong><small>{{ l.partido }} · {{ l.uf }}</small></span>
              </a>
              @let valor = ordem().includes('presentes') ? l.presenca : (l.fidelidade ?? 0);
              <span class="rk-barra"><span [style.width.%]="valor" [class.baixa]="valor < 50"></span></span>
              <strong class="rk-valor">{{ ordem().includes('presentes') ? l.presenca + '%' : (l.fidelidade === null ? '—' : l.fidelidade + '%') }}</strong>
            </li>
          }
        </ol>
        @if (filtradas().length > limite()) {
          <button type="button" class="botao botao-fantasma mostrar-mais" (click)="limite.set(limite() + 50)">Mostrar mais ({{ filtradas().length - limite() }})</button>
        }
        <p class="texto-p"><app-icone nome="info" /> Falta numa votação pode ter motivo justo (licença médica, missão oficial). Votar diferente do partido não é bom nem ruim: mostra independência.</p>
      </section>
    }
  `,
})
export class RankingVotacoesPage implements OnInit {
  protected readonly ufs = UFS;
  protected readonly ordens: { id: Ordem; nome: string }[] = [
    { id: 'mais-presentes', nome: 'Mais presentes' },
    { id: 'menos-presentes', nome: 'Mais faltaram' },
    { id: 'mais-fieis', nome: 'Mais fiéis ao partido' },
    { id: 'mais-independentes', nome: 'Mais independentes' },
  ];
  protected readonly ordem = signal<Ordem>('mais-presentes');
  protected readonly uf = signal('');
  protected readonly partido = signal('');
  protected readonly linhas = signal<LinhaRanking[]>([]);
  protected readonly votacoes = signal(0);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly limite = signal(50);

  protected readonly partidos = computed(() => [...new Set(this.linhas().map((l) => l.partido).filter(Boolean))].sort());
  protected readonly filtradas = computed(() => {
    const o = this.ordem();
    let l = this.linhas().filter((x) => (!this.uf() || x.uf === this.uf()) && (!this.partido() || x.partido === this.partido()));
    if (o.includes('fieis') || o.includes('independentes')) l = l.filter((x) => x.fidelidade !== null);
    const nome = (a: LinhaRanking, b: LinhaRanking) => a.nome.localeCompare(b.nome, 'pt-BR');
    const por: Record<Ordem, (a: LinhaRanking, b: LinhaRanking) => number> = {
      'mais-presentes': (a, b) => b.presenca - a.presenca || nome(a, b),
      'menos-presentes': (a, b) => a.presenca - b.presenca || nome(a, b),
      'mais-fieis': (a, b) => (b.fidelidade ?? 0) - (a.fidelidade ?? 0) || nome(a, b),
      'mais-independentes': (a, b) => (a.fidelidade ?? 0) - (b.fidelidade ?? 0) || nome(a, b),
    };
    return [...l].sort(por[o]);
  });
  protected readonly visiveis = computed(() => this.filtradas().slice(0, this.limite()));

  ngOnInit() {
    this.carregar();
  }

  protected async carregar() {
    this.carregando.set(true);
    this.erro.set(false);
    try {
      const r = await rankingVotacoes();
      this.linhas.set(r.linhas);
      this.votacoes.set(r.votacoes);
    } catch {
      this.erro.set(true);
    } finally {
      this.carregando.set(false);
    }
  }
}
