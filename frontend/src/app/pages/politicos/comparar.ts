import { NavPoliticos } from '../../shared/nav-politicos';
import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Politico } from '../../core/modelos';
import { DetalhesPolitico, alertasDe, detalhesCamara, todosDoCargo } from '../../core/politicos.service';
import { Avatar, Icone } from '../../shared/componentes';

interface Lado {
  politico: Politico | null;
  detalhes: DetalhesPolitico | null;
  registros: number | null;
  carregando: boolean;
}

const VAZIO: Lado = { politico: null, detalhes: null, registros: null, carregando: false };

/** Compara dois deputados federais lado a lado, só com dados oficiais (sem dizer quem é "melhor"). */
@Component({
  selector: 'app-comparar',
  imports: [FormsModule, RouterLink, Avatar, Icone, NavPoliticos],
  template: `
    <app-nav-politicos />
        <header class="cabecalho-pagina">
      <p class="sobretitulo">Comparar</p>
      <h1>Dois deputados, lado a lado</h1>
      <p>Escolha dois deputados federais para comparar dados oficiais da atuação na legislatura atual.</p>
    </header>

    <datalist id="lista-deputados">
      @for (d of todos(); track d.id) { <option [value]="d.nome + ' (' + d.partido + '-' + d.uf + ')'"></option> }
    </datalist>

    <div class="comparar-escolha card">
      @for (i of [0, 1]; track i) {
        <div class="campo-form">
          <label [for]="'cmp-' + i">{{ i === 0 ? 'Primeiro deputado' : 'Segundo deputado' }}</label>
          <div class="campo-com-icone">
            <app-icone nome="search" />
            <input [id]="'cmp-' + i" list="lista-deputados" [placeholder]="carregandoLista() ? 'Carregando lista...' : 'Digite um nome'"
              [value]="lados()[i].politico?.nome ?? ''" (change)="escolher(i, $any($event.target).value)" autocomplete="off" />
          </div>
        </div>
      }
    </div>

    <div class="comparar-tabela card" role="table" aria-label="Comparação">
      <div class="cmp-linha cmp-cabeca" role="row">
        <span role="columnheader"></span>
        @for (l of lados(); track $index) {
          <span role="columnheader" class="cmp-pessoa">
            @if (l.politico; as p) {
              <a [routerLink]="['/politicos', p.id]"><app-avatar class="avatar-oficial" [nome]="p.nome" [url]="p.foto_url" [tamanho]="72" /></a>
              <strong>{{ p.nome }}</strong><small>{{ p.partido }} · {{ p.uf }}</small>
            } @else { <span class="texto-suave">Escolha acima</span> }
          </span>
        }
      </div>
      @for (m of metricas; track m.rotulo) {
        <div class="cmp-linha" role="row">
          <span role="rowheader" class="cmp-rotulo"><app-icone [nome]="m.icone" /> {{ m.rotulo }}</span>
          @for (l of lados(); track $index) {
            <span role="cell" class="cmp-valor">
              @if (l.carregando) { <span class="esqueleto" style="width: 60%"></span> }
              @else if (l.politico) { {{ valor(m.chave, l) }} }
              @else { — }
            </span>
          }
        </div>
      }
    </div>
    <p class="nota-fontes"><app-icone nome="verified" /> Dados: API de Dados Abertos da Câmara (proposições desde fevereiro de 2023, comissões atuais e cota parlamentar no ano). Números não medem sozinhos a qualidade de um mandato.</p>
  `,
})
export class CompararPage implements OnInit {
  private rota = inject(ActivatedRoute);
  private router = inject(Router);
  protected readonly todos = signal<Politico[]>([]);
  protected readonly carregandoLista = signal(true);
  protected readonly lados = signal<Lado[]>([{ ...VAZIO }, { ...VAZIO }]);
  private readonly moeda = new CurrencyPipe('pt-BR');

  protected readonly metricas = [
    { chave: 'partido', rotulo: 'Partido e estado', icone: 'flag' },
    { chave: 'proposicoes', rotulo: 'Proposições apresentadas', icone: 'description' },
    { chave: 'comissoes', rotulo: 'Comissões atuais', icone: 'account_balance' },
    { chave: 'cota', rotulo: 'Cota parlamentar no ano', icone: 'payments' },
    { chave: 'registros', rotulo: 'Polêmicas e Justiça', icone: 'report' },
  ];

  async ngOnInit() {
    const q = this.rota.snapshot.queryParamMap;
    try {
      this.todos.set(await todosDoCargo('Deputado(a) Federal'));
    } finally {
      this.carregandoLista.set(false);
    }
    const ids = [Number(q.get('a')), Number(q.get('b'))];
    ids.forEach((id, i) => {
      const p = this.todos().find((x) => x.id === id);
      if (p) this.carregarLado(i, p);
    });
  }

  protected escolher(i: number, texto: string) {
    const nome = texto.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
    const p = this.todos().find((x) => x.nome.toLowerCase() === nome);
    if (p) this.carregarLado(i, p);
  }

  private async carregarLado(i: number, p: Politico) {
    this.atualizar(i, { politico: p, detalhes: null, registros: null, carregando: true });
    this.router.navigate([], { queryParams: { [i === 0 ? 'a' : 'b']: p.id }, queryParamsHandling: 'merge', replaceUrl: true });
    const [det, reg] = await Promise.allSettled([detalhesCamara(p.id), alertasDe(p)]);
    this.atualizar(i, {
      politico: p, carregando: false,
      detalhes: det.status === 'fulfilled' ? det.value : null,
      registros: reg.status === 'fulfilled' ? reg.value.length : null,
    });
  }

  private atualizar(i: number, l: Lado) {
    this.lados.update((ls) => ls.map((x, j) => (j === i ? l : x)));
  }

  protected valor(chave: string, l: Lado): string {
    const d = l.detalhes;
    switch (chave) {
      case 'partido': return `${l.politico?.partido ?? 'n/d'} · ${l.politico?.uf ?? 'n/d'}`;
      case 'proposicoes': return d?.totalProposicoes != null ? String(d.totalProposicoes) : 'sem dados';
      case 'comissoes': return d ? String(d.comissoes.length) : 'sem dados';
      case 'cota': return d?.despesas ? `${this.moeda.transform(d.despesas.total, 'BRL', 'symbol', '1.0-0')} (${d.despesas.ano}${d.despesas.parcial ? ', parcial' : ''})` : 'sem dados';
      case 'registros': return l.registros == null ? 'sem dados' : l.registros === 0 ? 'nenhum registro' : `${l.registros} ${l.registros === 1 ? 'registro' : 'registros'}`;
    }
    return '';
  }
}
