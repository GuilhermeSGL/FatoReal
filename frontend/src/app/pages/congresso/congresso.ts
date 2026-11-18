import { NavPoliticos } from '../../shared/nav-politicos';
import { DatePipe } from '@angular/common';
import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import {
  Evento, ItemPauta, LeiAprovada, VotacaoResumo, agendaDaSemana, inicioDaSemana, leisAprovadas, pautaDoEvento, votacoesImportantes,
} from '../../core/congresso';
import { Icone } from '../../shared/componentes';
import { ProjetoAcoes } from '../../shared/projeto-acoes';

type Aba = 'agenda' | 'votacoes' | 'leis';

@Component({
  selector: 'app-congresso',
  imports: [DatePipe, Icone, ProjetoAcoes, NavPoliticos],
  templateUrl: './congresso.html',
})
export class CongressoPage {
  private router = inject(Router);
  /** ?aba= na URL */
  readonly aba = input<string>('agenda');
  protected readonly abaAtual = computed<Aba>(() => (['agenda', 'votacoes', 'leis'].includes(this.aba()) ? (this.aba() as Aba) : 'agenda'));

  constructor() {
    effect(() => {
      const a = this.abaAtual();
      untracked(() => this.carregar(a));
    });
  }

  protected irPara(a: Aba) {
    this.router.navigate([], { queryParams: { aba: a }, replaceUrl: true });
  }

  private carregar(a: Aba) {
    if (a === 'agenda' && !this.eventos() && !this.carregandoAgenda()) this.carregarAgenda();
    if (a === 'votacoes' && !this.votacoes() && !this.carregandoVotacoes()) this.carregarVotacoes();
    if (a === 'leis' && !this.leis() && !this.carregandoLeis()) this.carregarLeis();
  }

  // ---------- Agenda ----------
  protected readonly semana = signal(0);
  protected readonly eventos = signal<Evento[] | null>(null);
  protected readonly carregandoAgenda = signal(false);
  protected readonly erroAgenda = signal(false);
  protected readonly soPlenario = signal(false);
  protected readonly segunda = computed(() => inicioDaSemana(this.semana()));
  protected readonly dias = computed(() => {
    const lista = (this.eventos() ?? []).filter((e) => !this.soPlenario() || e.plenario);
    const grupos = new Map<string, Evento[]>();
    for (const e of lista) {
      const d = e.inicio.slice(0, 10);
      grupos.set(d, [...(grupos.get(d) ?? []), e]);
    }
    return [...grupos].map(([dia, eventos]) => ({ dia, eventos }));
  });
  protected readonly pautas = signal<Record<number, ItemPauta[] | 'carregando' | 'erro'>>({});

  protected async carregarAgenda() {
    this.carregandoAgenda.set(true);
    this.erroAgenda.set(false);
    try {
      this.eventos.set(await agendaDaSemana(this.segunda()));
    } catch {
      this.erroAgenda.set(true);
    } finally {
      this.carregandoAgenda.set(false);
    }
  }

  protected mudarSemana(n: number) {
    this.semana.update((s) => s + n);
    this.eventos.set(null);
    this.carregarAgenda();
  }

  protected async verPauta(e: Evento) {
    const atual = this.pautas()[e.id];
    if (atual && atual !== 'erro') {
      const { [e.id]: _, ...resto } = this.pautas();
      this.pautas.set(resto);
      return;
    }
    this.pautas.update((p) => ({ ...p, [e.id]: 'carregando' }));
    try {
      const itens = await pautaDoEvento(e.id);
      this.pautas.update((p) => ({ ...p, [e.id]: itens }));
    } catch {
      this.pautas.update((p) => ({ ...p, [e.id]: 'erro' }));
    }
  }

  protected pautaDe(id: number): ItemPauta[] | null {
    const p = this.pautas()[id];
    return Array.isArray(p) ? p : null;
  }

  protected estadoPauta(id: number) {
    const p = this.pautas()[id];
    return Array.isArray(p) ? 'ok' : p ?? null;
  }

  protected aoVivo(e: Evento) {
    return /andamento/i.test(e.situacao);
  }

  // ---------- Votações ----------
  protected readonly votacoes = signal<VotacaoResumo[] | null>(null);
  protected readonly carregandoVotacoes = signal(false);
  protected readonly erroVotacoes = signal(false);
  protected readonly aberta = signal<string | null>(null);

  protected async carregarVotacoes() {
    this.carregandoVotacoes.set(true);
    this.erroVotacoes.set(false);
    try {
      this.votacoes.set(await votacoesImportantes());
    } catch {
      this.erroVotacoes.set(true);
    } finally {
      this.carregandoVotacoes.set(false);
    }
  }

  protected pct(n: number, v: VotacaoResumo['placar']) {
    const t = v.sim + v.nao + v.outros;
    return t ? (n / t) * 100 : 0;
  }

  // ---------- Leis ----------
  protected readonly leis = signal<LeiAprovada[] | null>(null);
  protected readonly carregandoLeis = signal(false);
  protected readonly erroLeis = signal(false);

  protected async carregarLeis() {
    this.carregandoLeis.set(true);
    this.erroLeis.set(false);
    try {
      this.leis.set(await leisAprovadas());
    } catch {
      this.erroLeis.set(true);
    } finally {
      this.carregandoLeis.set(false);
    }
  }
}
