import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icone } from './componentes';

/** Abas da seção Políticos (lista + Congresso). Ranking, Presença e Comparar abrem pelos cartões "Explore" da página de Políticos. */
@Component({
  selector: 'app-nav-politicos',
  imports: [RouterLink, RouterLinkActive, Icone],
  template: `
    <nav class="nav-politicos" aria-label="Seção Políticos">
      <a routerLink="/politicos" routerLinkActive="ativo" [routerLinkActiveOptions]="{ paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' }"><app-icone nome="person_search" /> Todos os políticos</a>
      <a routerLink="/congresso" routerLinkActive="ativo"><app-icone nome="account_balance" /> Congresso em ação</a>
    </nav>
  `,
})
export class NavPoliticos {}
