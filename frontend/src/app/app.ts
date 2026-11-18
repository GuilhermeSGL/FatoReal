import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth.service';
import { AvisosService } from './core/avisos.service';
import { MensagensService } from './core/mensagens.service';
import { NotificacoesService } from './core/notificacoes.service';
import { TemaService } from './core/tema.service';
import { BuscaGeralService, ResultadoBusca } from './core/busca-geral';
import { AcessibilidadeService } from './core/acessibilidade.service';
import { tempoAtras } from './core/util';
import { Avatar, AvisoDemo, Icone } from './shared/componentes';
import { BoasVindas } from './shared/boas-vindas';
import { FatoBotBolha, PerguntarFatobot } from './shared/fatobot-bolha';

type Contador = 'comunidades' | 'mensagens';

/** Casca do app, como na apresentação: barra superior escura, menu lateral, painel claro e navegação inferior no celular. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icone, Avatar, AvisoDemo, BoasVindas, FatoBotBolha, PerguntarFatobot],
  templateUrl: './app.html',
})
export class App {
  protected auth = inject(AuthService);
  protected avisos = inject(AvisosService);
  protected tema = inject(TemaService);
  private acessibilidade = inject(AcessibilidadeService);
  protected notificacoes = inject(NotificacoesService);
  protected mensagens = inject(MensagensService);
  private router = inject(Router);

  protected readonly menuAberto = signal(false);
  protected readonly notifAberto = signal(false);
  protected readonly tempo = tempoAtras;
  protected readonly iconesNotif = { curtida: 'thumb_up', comentario: 'chat_bubble', mensagem: 'mail', politico: 'account_balance' };

  protected readonly menu: { rota: string; icone: string; texto: string; exato?: boolean; contador?: Contador }[] = [
    { rota: '/', icone: 'home', texto: 'Início', exato: true },
    { rota: '/noticias', icone: 'newspaper', texto: 'Notícias' },
    { rota: '/politicos', icone: 'person', texto: 'Candidatos' },
    { rota: '/congresso', icone: 'account_balance', texto: 'Congresso' },
    { rota: '/base-da-politica', icone: 'school', texto: 'Base da Política' },
    { rota: '/comunidades', icone: 'groups', texto: 'Comunidades', contador: 'comunidades' },
    { rota: '/fato-ou-fake', icone: 'fact_check', texto: 'Fato ou Fake' },
    { rota: '/mensagens', icone: 'chat', texto: 'Mensagens', contador: 'mensagens' },
    { rota: '/perfil', icone: 'account_circle', texto: 'Meu perfil' },
  ];

  protected readonly abas = [
    { rota: '/', texto: 'Início', exato: true },
    { rota: '/politicos', texto: 'Candidatos', exato: false },
    { rota: '/noticias', texto: 'Notícias', exato: false },
    { rota: '/congresso', texto: 'Congresso', exato: false },
    { rota: '/fato-ou-fake', texto: 'Fato ou Fake', exato: false },
    { rota: '/comunidades', texto: 'Comunidades', exato: false },
    { rota: '/base-da-politica', texto: 'Base da Política', exato: false },
  ];

  constructor() {
    // Atualiza os números vermelhos ao trocar de página e ao entrar/sair da conta
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.menuAberto.set(false);
      this.notifAberto.set(false);
      this.notificacoes.atualizar();
      this.mensagens.atualizarContagem();
    });
    effect(() => {
      this.auth.usuario();
      this.notificacoes.atualizar();
      this.mensagens.atualizarContagem();
    });
  }

  protected contador(c?: Contador): number {
    if (!c) return 0;
    if (c === 'mensagens') return this.mensagens.naoLidas();
    return this.notificacoes.novasNasComunidades();
  }

  /** Sino: abre o painel com as últimas notificações (ou manda entrar, se não estiver logado). */
  protected async alternarNotificacoes(): Promise<void> {
    if (!this.auth.logado()) {
      this.router.navigate(['/entrar'], { queryParams: { voltar: '/notificacoes' } });
      return;
    }
    this.menuAberto.set(false);
    if (this.notifAberto()) {
      this.notifAberto.set(false);
      return;
    }
    await this.notificacoes.atualizar();
    this.notifAberto.set(true);
  }

  protected fecharNotificacoes(): void {
    this.notifAberto.set(false);
    this.notificacoes.marcarComoVistas();
  }

  // ---------- Busca do topo com sugestões ----------
  private buscaGeral = inject(BuscaGeralService);
  protected readonly sugestoes = signal<ResultadoBusca[]>([]);
  protected readonly sugestoesAbertas = signal(false);
  protected readonly sugestaoAtiva = signal(-1);
  private esperaBusca?: ReturnType<typeof setTimeout>;
  private pedidoBusca = 0;

  protected digitarBusca(termo: string) {
    clearTimeout(this.esperaBusca);
    this.esperaBusca = setTimeout(async () => {
      const meu = ++this.pedidoBusca;
      const r = await this.buscaGeral.buscar(termo, 3);
      if (meu !== this.pedidoBusca) return;
      this.sugestoes.set(r.slice(0, 8));
      this.sugestaoAtiva.set(-1);
      this.sugestoesAbertas.set(r.length > 0);
    }, 220);
  }

  protected moverSugestao(passo: number) {
    const n = this.sugestoes().length;
    if (!n) return;
    this.sugestoesAbertas.set(true);
    this.sugestaoAtiva.update((i) => (i + passo + n) % n);
  }

  protected enterBusca(e: Event, campo: HTMLInputElement) {
    const r = this.sugestoes()[this.sugestaoAtiva()];
    if (this.sugestoesAbertas() && r) {
      e.preventDefault();
      this.abrirSugestao(r, campo);
    }
  }

  protected abrirSugestao(r: ResultadoBusca, campo: HTMLInputElement) {
    this.sugestoesAbertas.set(false);
    campo.blur();
    if (r.externo) window.open(r.externo, '_blank', 'noopener');
    else this.router.navigate(r.rota ?? ['/'], { queryParams: r.query });
  }

  protected fecharSugestoesDepois() {
    setTimeout(() => this.sugestoesAbertas.set(false), 150);
  }

  protected buscar(termo: string): void {
    this.sugestoesAbertas.set(false);
    if (termo.trim()) this.router.navigate(['/busca'], { queryParams: { q: termo.trim() } });
  }

  protected async sair(): Promise<void> {
    this.menuAberto.set(false);
    await this.auth.sair();
    this.avisos.mostrar('Você saiu da sua conta.');
    this.router.navigateByUrl('/');
  }

  @HostListener('document:keydown.escape')
  protected fecharMenu(): void {
    this.menuAberto.set(false);
    if (this.notifAberto()) this.fecharNotificacoes();
  }
}
