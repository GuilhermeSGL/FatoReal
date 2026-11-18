import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icone } from './componentes';

/** Abas da seção Políticos: tudo sobre representantes num lugar só (inclui o Congresso). */
@Component({
  selector: 'app-nav-politicos',
  imports: [RouterLink, RouterLinkActive, Icone],
  template: `
    <nav class="nav-politicos" aria-label="Seção Políticos">
      <a routerLink="/politicos" routerLinkActive="ativo" [routerLinkActiveOptions]="{ paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' }"><app-icone nome="person_search" /> Todos os políticos</a>
      <a routerLink="/congresso" routerLinkActive="ativo"><app-icone nome="account_balance" /> Congresso em ação</a>
      <a routerLink="/politicos/gastos" routerLinkActive="ativo"><app-icone nome="payments" /> Ranking de gastos</a>
      <a routerLink="/politicos/ranking" routerLinkActive="ativo"><app-icone nome="how_to_vote" /> Presença</a>
      <a routerLink="/politicos/comparar" routerLinkActive="ativo"><app-icone nome="compare_arrows" /> Comparar</a>
    </nav>
  `,
})
export class NavPoliticos {}
