import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Politico } from '../../core/modelos';
import { despesasDoAno, todosDoCargo } from '../../core/politicos.service';
import { UFS } from '../../core/util';
import { Avatar, Icone } from '../../shared/componentes';
import { nomeEstado } from '../../shared/mapa-brasil';

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
  imports: [FormsModule, RouterLink, CurrencyPipe, Avatar, Icone],
  template: `
    <a routerLink="/politicos" class="link-voltar"><app-icone nome="arrow_back" /> Candidatos</a>
    <header class="cabecalho-pagina">
      <p class="sobretitulo">Transparência</p>
      <h1>Ranking da cota parlamentar</h1>
      <p>Quanto cada deputado federal do estado gastou da cota parlamentar (verba para passagens, combustível, divulgação etc.) no ano. Dados oficiais da Câmara.</p>
    </header>

    <div class="card gastos-filtros">
      <div class="campo-form">
        <label for="g-uf">Estado</label>
        <select id="g-uf" [ngModel]="uf()" (ngModelChange)="escolherUf($event)">
          <option value="">Escolha o estado...</option>
          @for (u of ufs; track u) { <option [value]="u">{{ u }} · {{ nomeEstado(u) }}</option> }
        </select>
      </div>
      <div class="visoes" role="tablist" aria-label="Ordem">
        <button type="button" role="tab" [attr.aria-selected]="ordem() === 'maiores'" (click)="ordem.set('maiores')"><app-icone nome="trending_up" /> Mais gastaram</button>
        <button type="button" role="tab" [attr.aria-selected]="ordem() === 'menores'" (click)="ordem.set('menores')"><app-icone nome="trending_down" /> Menos gastaram</button>
      </div>
    </div>

    @if (calculando()) {
      <div class="card gastos-progresso" aria-live="polite">
        <p>Somando as despesas de {{ feitos() }} de {{ total() }} deputados de {{ uf() }}...</p>
        <div class="barras-gasto-trilha"><span [style.width.%]="total() ? (feitos() / total()) * 100 : 0"></span></div>
        <small class="texto-suave">Na primeira vez pode levar um minuto. Depois fica guardado por 12 horas.</small>
      </div>
    }
    @if (erro()) { <div class="card alerta-erro" role="alert"><app-icone nome="error" /> {{ erro() }}</div> }

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
    } @else if (!uf() && !calculando()) {
      <div class="card vazio"><app-icone nome="payments" /><strong>Escolha um estado</strong><span>O ranking compara os deputados de um mesmo estado.</span></div>
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

  constructor() {
    if (this.uf()) this.calcular();
  }

  ngOnDestroy() {
    this.geracao++;
  }

  protected escolherUf(uf: string) {
    this.uf.set(uf);
    this.linhas.set([]);
    if (uf) this.calcular();
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
    const bruto = JSON.parse(localStorage.getItem('fatoreal-cache:gastos-' + uf) ?? 'null');
    return bruto && Date.now() - bruto.em < VALIDADE ? bruto.linhas : null;
  } catch {
    return null;
  }
}
function salvarCache(uf: string, linhas: Linha[]) {
  try {
    localStorage.setItem('fatoreal-cache:gastos-' + uf, JSON.stringify({ em: Date.now(), linhas }));
  } catch {
    /* sem espaço */
  }
}
