import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BuscaGeralService, ResultadoBusca, TipoResultado } from '../core/busca-geral';
import { Avatar, Icone } from '../shared/componentes';
import { SeloStatus } from '../shared/selo-status';

const GRUPOS: { tipo: TipoResultado; titulo: string }[] = [
  { tipo: 'politico', titulo: 'Políticos' },
  { tipo: 'comunidade', titulo: 'Comunidades' },
  { tipo: 'termo', titulo: 'Glossário' },
  { tipo: 'noticia', titulo: 'Notícias' },
  { tipo: 'pagina', titulo: 'No site' },
];

/** Página de resultados da busca do topo (/busca?q=...). */
@Component({
  selector: 'app-busca-geral',
  imports: [RouterLink, Avatar, Icone, SeloStatus],
  template: `
    <header class="cabecalho-pagina">
      <p class="sobretitulo">Busca</p>
      <h1>Resultados para “{{ q() }}”</h1>
    </header>
    @if (carregando()) {
      <div class="card"><div class="esqueleto-linhas"><span class="esqueleto"></span><span class="esqueleto" style="width: 70%"></span></div></div>
    } @else if (!resultados().length) {
      <div class="card vazio"><app-icone nome="search_off" /><strong>Nada encontrado</strong><span>Tente outro nome, a sigla de um partido ou de um estado.</span></div>
    } @else {
      @for (g of grupos; track g.tipo) {
        @if (doGrupo(g.tipo).length) {
          <section class="card busca-grupo">
            <h2 class="titulo-secao">{{ g.titulo }}</h2>
            <ul>
              @for (r of doGrupo(g.tipo); track r.titulo) {
                <li>
                  @if (r.externo) {
                    <a [href]="r.externo" target="_blank" rel="noopener noreferrer" class="busca-item"><span class="icone-tile" [attr.data-tipo]="r.tipo"><app-icone [nome]="r.icone" /></span><span class="busca-textos"><strong>{{ r.titulo }}</strong><small>{{ r.detalhe }}</small></span>@if (r.selo) { <app-selo [tipo]="r.selo" /> }<app-icone nome="chevron_right" class="busca-seta" /></a>
                  } @else {
                    <a [routerLink]="r.rota" [queryParams]="r.query" class="busca-item">
                      @if (r.tipo === 'politico') { <app-avatar class="avatar-oficial" [nome]="r.titulo" [url]="r.foto" [tamanho]="36" /> }
                      @else { <span class="icone-tile" [attr.data-tipo]="r.tipo"><app-icone [nome]="r.icone" /></span> }
                      <span class="busca-textos"><strong>{{ r.titulo }}</strong><small>{{ r.detalhe }}</small></span>
                      @if (r.selo) { <app-selo [tipo]="r.selo" /> }
                      <app-icone nome="chevron_right" class="busca-seta" />
                    </a>
                  }
                </li>
              }
            </ul>
          </section>
        }
      }
    }
  `,
})
export class BuscaGeralPage {
  private busca = inject(BuscaGeralService);
  readonly q = input('');
  protected readonly grupos = GRUPOS;
  protected readonly resultados = signal<ResultadoBusca[]>([]);
  protected readonly carregando = signal(true);

  constructor() {
    effect(() => {
      const q = this.q();
      untracked(async () => {
        this.carregando.set(true);
        this.resultados.set(await this.busca.buscar(q ?? '', 12));
        this.carregando.set(false);
      });
    });
  }

  protected doGrupo(t: TipoResultado) {
    return this.resultados().filter((r) => r.tipo === t);
  }
}
