import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Politico } from '../../core/modelos';
import { despesasDoAno, todosDoCargo } from '../../core/politicos.service';
import { UFS } from '../../core/util';
import { Avatar, Icone } from '../../shared/componentes';
import { nomeEstado } from '../../shared/mapa-brasil';
import { MapaEstados, REGIOES } from '../../shared/mapa-estados';
import { AuthService } from '../../core/auth.service';

interface Linha {
  politico: Politico;
  total: number;
  ano: number | null;
  parcial: boolean;
}

const VALIDADE = 12 * 3600_000;

/**
 * Ranking da cota parlamentar por estado. A Câmara não tem um total pronto por deputado,
 * então somamos as despesas de cada um (4 por vez) e guardamos o resultado por 12 horas.
 */
@Component({
  selector: 'app-gastos',
  imports: [FormsModule, RouterLink, CurrencyPipe, Avatar, Icone, MapaEstados],
  template: `
    <a routerLink="/politicos" class="link-voltar"><app-icone nome="arrow_back" /> Voltar para Políticos</a>

    <section class="gst-hero">
      <img src="img/capa-contas-publicas.svg" alt="" />
      <p class="gst-hero-k">Transparência</p>
      <h1>Ranking da cota parlamentar</h1>
      <p>Veja quanto cada deputado federal do seu estado gastou da verba do mandato. Tudo com dados oficiais da Câmara.</p>
      <span class="gst-pill"><app-icone nome="verified" /> Fonte: Câmara dos Deputados</span>
    </section>

    <div class="gst-grade">
      <section class="card gst-mapa" aria-label="Escolha o estado">
        <app-mapa-estados [selecionado]="uf()" [destaque]="meuEstado()" [textos]="textos()" (escolher)="escolherUf($event)" />
        <div class="gst-mapa-texto">
          <h2 class="ps-titulo"><span class="ps-icone"><app-icone nome="touch_app" /></span> Toque no seu estado</h2>
          <p class="texto-suave">Cada cor é uma região do Brasil. Passe o mouse e clique no estado.</p>
          <ul class="gst-legenda">
            @for (r of regioes; track r.nome) { <li><i [style.background]="r.cor"></i> {{ r.nome }}</li> }
          </ul>
          @if (meuEstado() && meuEstado() !== uf()) {
            <button type="button" class="botao" (click)="escolherUf(meuEstado())"><app-icone nome="my_location" /> Ver meu estado ({{ meuEstado() }})</button>
          }
          <label for="g-uf" class="sr-only">Escolher o estado da lista</label>
          <select id="g-uf" [ngModel]="uf()" (ngModelChange)="escolherUf($event)">
            <option value="">Escolher da lista...</option>
            @for (u of ufs; track u) { <option [value]="u">{{ u }} · {{ nomeEstado(u) }}</option> }
          </select>
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

    @if (uf()) {
      <section id="gst-resultado" class="gst-resultado" aria-live="polite">
        <header class="gst-res-topo">
          <h2>Ranking de {{ nomeEstado(uf()) }}</h2>
          <div class="visoes" role="tablist" aria-label="Ordem">
            <button type="button" role="tab" [attr.aria-selected]="ordem() === 'maiores'" (click)="ordem.set('maiores')"><app-icone nome="trending_up" /> Mais gastaram</button>
            <button type="button" role="tab" [attr.aria-selected]="ordem() === 'menores'" (click)="ordem.set('menores')"><app-icone nome="trending_down" /> Menos gastaram</button>
          </div>
        </header>

        @if (calculando()) {
          <div class="card gastos-progresso">
            <p>Somando as despesas de {{ feitos() }} de {{ total() }} deputados de {{ uf() }}...</p>
            <div class="barras-gasto-trilha"><span [style.width.%]="total() ? (feitos() / total()) * 100 : 0"></span></div>
            <small class="texto-suave">Na primeira vez pode levar um minuto. Depois fica guardado por 12 horas.</small>
          </div>
        }
        @if (erro()) { <div class="card alerta-erro" role="alert"><app-icone nome="error" /> {{ erro() }}</div> }

        @if (podio().length === 3 && !calculando()) {
          <div class="gst-podio" aria-label="Os três primeiros">
            @for (l of podioOrdem(); track l.politico.id) {
              <a class="gst-degrau" [attr.data-pos]="posicao(l)" [routerLink]="['/politicos', l.politico.id]">
                <app-avatar class="avatar-oficial" [nome]="l.politico.nome" [url]="l.politico.foto_url" [tamanho]="posicao(l) === 1 ? 72 : 58" />
                <strong>{{ l.politico.nome }}</strong>
                <small>{{ l.politico.partido }} · {{ l.total | currency: 'BRL' : 'symbol' : '1.0-0' : 'pt-BR' }}</small>
                <span class="gst-coluna">{{ posicao(l) }}º</span>
              </a>
            }
          </div>
        }

        @if (ordenadas().length) {
          <ol class="ranking-gastos card">
            @for (l of ordenadas(); track l.politico.id; let i = $index) {
              <li>
                <span class="ranking-pos">{{ i + 1 }}</span>
                <a [routerLink]="['/politicos', l.politico.id]" class="ranking-pessoa">
                  <app-avatar class="avatar-oficial" [nome]="l.politico.nome" [url]="l.politico.foto_url" [tamanho]="40" />
                  <span><strong>{{ l.politico.nome }}</strong><small>{{ l.politico.partido }}</small></span>
                </a>
                <span class="ranking-barra"><span [style.width.%]="maior() ? (l.total / maior()) * 100 : 0"></span></span>
                <strong class="ranking-valor">{{ l.total | currency: 'BRL' : 'symbol' : '1.0-0' : 'pt-BR' }}@if (l.parcial) {<small> parcial</small>}</strong>
              </li>
            }
          </ol>
          <p class="nota-fontes"><app-icone nome="verified" /> Fonte: API de Dados Abertos da Câmara, despesas de {{ ano() }}. Gastar mais não significa irregularidade: a cota é um direito do mandato e cada gasto precisa ser comprovado.</p>
        }
      </section>
    }
  `,
})
export class GastosPage implements OnDestroy {
  private rota = inject(ActivatedRoute);
  protected readonly ufs = UFS;
  protected readonly nomeEstado = nomeEstado;
  protected readonly uf = signal(this.rota.snapshot.queryParamMap.get('uf') ?? '');
  protected readonly ordem = signal<'maiores' | 'menores'>('maiores');
  protected readonly linhas = signal<Linha[]>([]);
  protected readonly calculando = signal(false);
  protected readonly feitos = signal(0);
  protected readonly total = signal(0);
  protected readonly erro = signal('');
  protected readonly ano = computed(() => this.linhas().find((l) => l.ano)?.ano ?? new Date().getFullYear());
  protected readonly maior = computed(() => Math.max(0, ...this.linhas().map((l) => l.total)));
  protected readonly ordenadas = computed(() => {
    const l = [...this.linhas()].sort((a, b) => b.total - a.total);
    return this.ordem() === 'maiores' ? l : l.reverse();
  });
  private geracao = 0;
  private auth = inject(AuthService);
  protected readonly regioes = REGIOES;
  protected readonly explicacoes = [
    { titulo: 'O que é a cota?', texto: 'Dinheiro do mandato para viagens, combustível, escritório e divulgação. Cada gasto precisa de nota fiscal.', icone: 'account_balance_wallet', cor: '#d97706' },
    { titulo: 'Por que uns gastam mais?', texto: 'Quem mora longe de Brasília paga passagens mais caras. Gastar mais não quer dizer erro.', icone: 'flight', cor: '#2563eb' },
    { titulo: 'Como aparece', texto: 'Pódio com os 3 primeiros e, logo abaixo, a lista completa do estado.', icone: 'emoji_events', cor: '#7c3aed' },
  ];
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
  /** Texto do balão do mapa: quantos deputados cada estado tem (dado oficial da Câmara). */
  protected readonly textos = signal<Record<string, string>>({});
  protected readonly podio = computed(() => this.ordenadas().slice(0, 3));
  /** Ordem de exibição do pódio: 2º, 1º, 3º. */
  protected readonly podioOrdem = computed(() => { const p = this.podio(); return p.length === 3 ? [p[1], p[0], p[2]] : p; });
  protected posicao(l: Linha) {
    return this.podio().indexOf(l) + 1;
  }

  constructor() {
    if (this.uf()) this.calcular();
    todosDoCargo('Deputado(a) Federal').then((lista) => {
      const n: Record<string, number> = {};
      for (const p of lista) if (p.uf) n[p.uf] = (n[p.uf] ?? 0) + 1;
      this.textos.set(Object.fromEntries(Object.entries(n).map(([u, q]) => [u, `${q} deputados · toque para ver`])));
    }).catch(() => {});
  }

  ngOnDestroy() {
    this.geracao++;
  }

  protected escolherUf(uf: string) {
    if (uf === this.uf()) return;
    this.uf.set(uf);
    this.linhas.set([]);
    if (uf) {
      this.calcular();
      setTimeout(() => document.getElementById('gst-resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }

  private async calcular() {
    const uf = this.uf();
    const minha = ++this.geracao;
    this.erro.set('');
    const salvo = lerCache(uf);
    if (salvo) {
      this.linhas.set(salvo);
      return;
    }
    this.calculando.set(true);
    try {
      const deps = (await todosDoCargo('Deputado(a) Federal')).filter((p) => p.uf === uf);
      this.total.set(deps.length);
      this.feitos.set(0);
      const resultado: Linha[] = [];
      let proximo = 0;
      const trabalhador = async () => {
        while (proximo < deps.length && minha === this.geracao) {
          const p = deps[proximo++];
          try {
            const d = await despesasDoAno(p.id);
            resultado.push({ politico: p, total: d?.total ?? 0, ano: d?.ano ?? null, parcial: !!d?.parcial });
          } catch {
            resultado.push({ politico: p, total: 0, ano: null, parcial: true });
          }
          this.feitos.update((n) => n + 1);
          if (minha === this.geracao) this.linhas.set([...resultado]);
        }
      };
      await Promise.all([trabalhador(), trabalhador(), trabalhador(), trabalhador()]);
      if (minha === this.geracao) salvarCache(uf, resultado);
    } catch (e) {
      if (minha === this.geracao) this.erro.set(e instanceof Error ? e.message : 'Não foi possível calcular agora.');
    } finally {
      if (minha === this.geracao) this.calculando.set(false);
    }
  }
}

function lerCache(uf: string): Linha[] | null {
  try {
    const bruto = JSON.parse(localStorage.getItem('fatoreal-cache:gastos-v2-' + uf) ?? 'null');
    return bruto && Date.now() - bruto.em < VALIDADE ? bruto.linhas : null;
  } catch {
    return null;
  }
}
function salvarCache(uf: string, linhas: Linha[]) {
  try {
    localStorage.setItem('fatoreal-cache:gastos-v2-' + uf, JSON.stringify({ em: Date.now(), linhas }));
  } catch {
    /* sem espaço */
  }
}
