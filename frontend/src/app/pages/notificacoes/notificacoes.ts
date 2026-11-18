import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificacoesService } from '../../core/notificacoes.service';
import { VistosService } from '../../core/vistos.service';
import { tempoAtras } from '../../core/util';
import { Icone } from '../../shared/componentes';

@Component({
  selector: 'app-notificacoes',
  imports: [RouterLink, Icone],
  template: `
    <header class="cabecalho-pagina">
      <h1><app-icone nome="notifications" /> Notificações</h1>
      <p>Curtidas, comentários, mensagens e o que os políticos que você segue fizeram (projetos, discursos e votos).</p>
    </header>
    @for (g of grupos(); track g.nome) {
      <h2 class="notif-dia">{{ g.nome }}</h2>
      <ul class="card lista-notificacoes">
        @for (n of g.itens; track n.id) {
          <li [class.nova]="n.data > vistoAntes">
            <a [routerLink]="n.rota">
              <span class="notif-icone" [attr.data-tipo]="n.tipo"><app-icone [nome]="icones[n.tipo]" /></span>
              <span><strong>{{ n.texto }}</strong><small>{{ rotulos[n.tipo] }} · {{ tempo(n.data) }}</small></span>
              @if (n.data > vistoAntes) { <span class="notif-nova">Nova</span> }
            </a>
          </li>
        }
      </ul>
    } @empty {
      <section class="card mod-vazio">
        <span class="mod-vazio-icone"><app-icone nome="notifications" /></span>
        <h2>Nada por aqui ainda</h2>
        <p class="texto-suave">Participe das comunidades e siga políticos para receber notificações.</p>
      </section>
    }
  `,
})
export class NotificacoesPage implements OnInit {
  protected service = inject(NotificacoesService);
  private vistos = inject(VistosService);
  protected readonly tempo = tempoAtras;
  protected readonly icones = { curtida: 'favorite', comentario: 'chat_bubble', mensagem: 'mail', politico: 'account_balance' };
  protected readonly rotulos = { curtida: 'Curtida', comentario: 'Comentário', mensagem: 'Mensagem', politico: 'Político que você segue' };
  /** Separadas por dia: Hoje, Ontem, Esta semana e Mais antigas. */
  protected readonly grupos = computed(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const dia = 86_400_000;
    const nomeDe = (iso: string) => {
      const t = new Date(iso).getTime();
      if (t >= hoje.getTime()) return 'Hoje';
      if (t >= hoje.getTime() - dia) return 'Ontem';
      if (t >= hoje.getTime() - 6 * dia) return 'Esta semana';
      return 'Mais antigas';
    };
    const grupos: { nome: string; itens: typeof lista }[] = [];
    const lista = this.service.lista();
    for (const n of lista) {
      const nome = nomeDe(n.data);
      if (grupos.at(-1)?.nome !== nome) grupos.push({ nome, itens: [] });
      grupos.at(-1)!.itens.push(n);
    }
    return grupos;
  });
  /** Data da visita anterior: o que for mais novo aparece destacado. */
  protected vistoAntes = this.vistos.datas().notificacoes;

  async ngOnInit() {
    await this.service.atualizar();
    this.service.marcarComoVistas();
  }
}
