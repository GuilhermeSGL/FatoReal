import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LinhaRanking, rankingVotacoes } from '../../core/congresso';
import { UFS } from '../../core/util';
import { AuthService } from '../../core/auth.service';
import { Avatar, Icone } from '../../shared/componentes';
import { nomeEstado } from '../../shared/mapa-brasil';
import { MapaEstados, REGIOES } from '../../shared/mapa-estados';

type Ordem = 'mais-presentes' | 'menos-presentes' | 'mais-fieis' | 'mais-independentes';

@Component({
  selector: 'app-ranking-votacoes',
  imports: [FormsModule, RouterLink, Avatar, Icone, MapaEstados],
  template: `
    <a routerLink="/politicos" class="link-voltar"><app-icone nome="arrow_back" /> Voltar para Políticos</a>

    <section class="gst-hero gst-hero-presenca">
      <img src="img/capa-camara-e-senado-em-pauta.svg" alt="" />
      <p class="gst-hero-k">Ranking</p>
      <h1>Presença e fidelidade ao partido</h1>
      <p>Quem mais aparece para votar e quem vota igual (ou diferente) do próprio partido, nas votações nominais do plenário da Câmara.</p>
      <span class="gst-pill"><app-icone nome="verified" /> Fonte: Câmara dos Deputados</span>
    </section>

    <div class="gst-grade">
      <section class="card gst-mapa" aria-label="Escolha o estado">
        <app-mapa-estados [selecionado]="uf()" [destaque]="meuEstado()" [textos]="textosMapa()" (escolher)="escolherUf($event)" />
        <div class="gst-mapa-texto">
          <h2 class="ps-titulo"><span class="ps-icone"><app-icone nome="touch_app" /></span> Toque no seu estado</h2>
          <p class="texto-suave">Passe o mouse para ver a presença média de cada estado. Sem estado escolhido, o ranking é do Brasil todo.</p>
          <ul class="gst-legenda">
            @for (r of regioes; track r.nome) { <li><i [style.background]="r.cor"></i> {{ r.nome }}</li> }
          </ul>
          <div class="pres-botoes">
            @if (uf()) { <button type="button" class="botao botao-fantasma" (click)="escolherUf('')"><app-icone nome="public" /> Brasil todo</button> }
            @if (meuEstado() && meuEstado() !== uf()) { <button type="button" class="botao" (click)="escolherUf(meuEstado())"><app-icone nome="my_location" /> Meu estado ({{ meuEstado() }})</button> }
          </div>
          <div class="linha-campos">
            <div class="campo-form"><label for="rk-uf">Estado</label>
              <select id="rk-uf" [ngModel]="uf()" (ngModelChange)="escolherUf($event)"><option value="">Brasil todo</option>@for (u of ufs; track u) { <option [value]="u">{{ u }} · {{ nomeEstado(u) }}</option> }</select></div>
            <div class="campo-form"><label for="rk-partido">Partido</label>
              <select id="rk-partido" [ngModel]="partido()" (ngModelChange)="partido.set($event)"><option value="">Todos</option>@for (p of partidos(); track p) { <option [value]="p">{{ p }}</option> }</select></div>
          </div>
          <small class="gst-credito">Mapa: SVG Maps (CC BY 4.0)</small>
        </div>
      </section>

      <aside class="gst-lado">
        @for (x of explicacoes; track x.titulo) {
          <div class="gst-exp" [style.--c]="x.cor">
            <span class="gst-exp-icone"><app-icone [nome]="x.icone" /></span>
            <span><strong>{{ x.titulo }}</strong><small>{{ x.texto }}</small></span>
          </div>
        }
      </aside>
    </div>

    <section id="pres-resultado" class="gst-resultado" aria-live="polite">
      <header class="gst-res-topo">
        <h2>{{ uf() ? nomeEstado(uf()) : 'Brasil todo' }}{{ partido() ? ' · ' + partido() : '' }}</h2>
        <div class="visoes" role="tablist" aria-label="Ordem">
          @for (o of ordens; track o.id) { <button type="button" role="tab" [attr.aria-selected]="ordem() === o.id" (click)="ordem.set(o.id)"><app-icone [nome]="o.icone" /> {{ o.nome }}</button> }
        </div>
      </header>

      @if (carregando()) {
        <div class="card gastos-progresso"><p><app-icone nome="hourglass_top" /> Conferindo os votos dos 513 deputados. Pode levar alguns segundos...</p>
          <div class="esqueleto-linhas"><span class="esqueleto"></span><span class="esqueleto"></span><span class="esqueleto"></span></div></div>
      } @else if (erro()) {
        <div class="card alerta-erro" role="alert"><app-icone nome="error" /> Não foi possível carregar. <button type="button" class="link-discreto" (click)="carregar()">Tentar de novo</button></div>
      } @else {
        @if (podioOrdem().length === 3) {
          <div class="gst-podio" aria-label="Os três primeiros">
            @for (l of podioOrdem(); track l.id) {
              <a class="gst-degrau" [attr.data-pos]="posicao(l)" [routerLink]="['/politicos', l.id]">
                <app-avatar class="avatar-oficial" [nome]="l.nome" [url]="l.foto" [tamanho]="posicao(l) === 1 ? 72 : 58" />
                <strong>{{ l.nome }}</strong>
                <small>{{ l.partido }} · {{ l.uf }} · {{ valorTexto(l) }}</small>
                <span class="gst-coluna">{{ posicao(l) }}º</span>
              </a>
            }
          </div>
        }
        <p class="texto-p">Baseado em {{ votacoes() }} votações nominais dos últimos 90 dias. {{ ehPresenca() ? 'Presença = votou em quantas delas.' : 'Fidelidade = votou igual à maioria do próprio partido (Sim ou Não).' }}</p>
        <ol class="ranking-gastos card">
          @for (l of visiveis(); track l.id; let i = $index) {
            <li>
              <span class="ranking-pos">{{ i + 1 }}</span>
              <a [routerLink]="['/politicos', l.id]" class="ranking-pessoa">
                <app-avatar class="avatar-oficial" [nome]="l.nome" [url]="l.foto" [tamanho]="40" />
                <span><strong>{{ l.nome }}</strong><small>{{ l.partido }} · {{ l.uf }}</small></span>
              </a>
              @let valor = ehPresenca() ? l.presenca : (l.fidelidade ?? 0);
              <span class="ranking-barra" [class.baixa]="valor < 50"><span [style.width.%]="valor"></span></span>
              <strong class="ranking-valor">{{ valorTexto(l) }}</strong>
            </li>
          } @empty {
            <li class="texto-suave">Nenhum deputado com esse filtro.</li>
          }
        </ol>
        @if (filtradas().length > limite()) {
          <button type="button" class="botao botao-fantasma mostrar-mais" (click)="limite.set(limite() + 50)">Mostrar mais ({{ filtradas().length - limite() }})</button>
        }
        <p class="nota-fontes"><app-icone nome="info" /> Falta numa votação pode ter motivo justo (licença médica, missão oficial). Votar diferente do partido não é bom nem ruim: mostra independência.</p>
      }
    </section>
  `,
})
export class RankingVotacoesPage implements OnInit {
  protected readonly ufs = UFS;
  protected readonly nomeEstado = nomeEstado;
  protected readonly regioes = REGIOES;
  private auth = inject(AuthService);
  protected readonly ordens: { id: Ordem; nome: string; icone: string }[] = [
    { id: 'mais-presentes', nome: 'Mais presentes', icone: 'how_to_reg' },
    { id: 'menos-presentes', nome: 'Mais faltaram', icone: 'event_busy' },
    { id: 'mais-fieis', nome: 'Mais fiéis ao partido', icone: 'handshake' },
    { id: 'mais-independentes', nome: 'Mais independentes', icone: 'call_split' },
  ];
  protected readonly explicacoes = [
    { titulo: 'O que é presença?', texto: 'Em quantas votações nominais do plenário o deputado registrou voto (Sim, Não, Abstenção ou Obstrução).', icone: 'how_to_reg', cor: '#15803d' },
    { titulo: 'E fidelidade?', texto: 'Quantas vezes votou igual à maioria do próprio partido. Não é bom nem ruim: mostra o quanto segue o partido.', icone: 'handshake', cor: '#7c3aed' },
    { titulo: 'Faltou não é crime', texto: 'Licença médica, missão oficial ou trabalho em comissão podem explicar uma ausência.', icone: 'info', cor: '#2563eb' },
  ];
  protected readonly ehPresenca = computed(() => this.ordem().includes('presentes'));
  /** Estado da pessoa: do perfil ou o último escolhido em Políticos. */
  protected readonly meuEstado = computed(() => {
    const doPerfil = this.auth.usuario()?.uf;
    if (doPerfil) return doPerfil;
    try {
      return localStorage.getItem('fatoreal-uf') ?? '';
    } catch {
      return '';
    }
  });
  /** Balão do mapa: presença média de cada estado, calculada dos votos oficiais. */
  protected readonly textosMapa = computed(() => {
    const soma: Record<string, [number, number]> = {};
    for (const l of this.linhas()) if (l.uf) { const s = (soma[l.uf] ??= [0, 0]); s[0] += l.presenca; s[1]++; }
    return Object.fromEntries(Object.entries(soma).map(([u, [t, n]]) => [u, `Presença média: ${Math.round(t / n)}% · ${n} deputados`]));
  });
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
  /** Pódio na ordem de exibição: 2º, 1º, 3º. */
  protected readonly podioOrdem = computed(() => { const p = this.filtradas().slice(0, 3); return p.length === 3 ? [p[1], p[0], p[2]] : []; });
  protected posicao(l: LinhaRanking) {
    return this.filtradas().indexOf(l) + 1;
  }
  protected valorTexto(l: LinhaRanking) {
    return this.ehPresenca() ? l.presenca + '%' : l.fidelidade === null ? '—' : l.fidelidade + '%';
  }
  protected escolherUf(uf: string) {
    this.uf.set(uf);
    this.limite.set(50);
    if (uf) setTimeout(() => document.getElementById('pres-resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

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
