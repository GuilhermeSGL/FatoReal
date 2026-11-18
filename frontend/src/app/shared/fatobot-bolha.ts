import { Component, Directive, ElementRef, HostListener, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { FatoBotConversa } from '../core/fatobot-conversa.service';
import { FonteDado, Icone } from './componentes';
import { SeloStatus } from './selo-status';

/** Coloque [perguntarFatobot]="'pergunta'" em qualquer botão para abrir a bolinha já com a pergunta. */
@Directive({ selector: '[perguntarFatobot]', host: { '(click)': 'abrir($event)' } })
export class PerguntarFatobot {
  private conversa = inject(FatoBotConversa);
  readonly perguntarFatobot = input<string | null | undefined>('');
  protected abrir(e: Event) {
    e.preventDefault();
    this.conversa.abrir(this.perguntarFatobot() ?? '');
  }
}

/** FatoBot em bolinha flutuante: acompanha a pessoa por toda a rede social. */
@Component({
  selector: 'app-fatobot-bolha',
  imports: [FormsModule, RouterLink, Icone, FonteDado, SeloStatus],
  template: `
    @if (!naPaginaDoBot()) {
      @if (conversa.aberto()) {
        <section class="bolha-painel" role="dialog" aria-label="Conversa com o FatoBot">
          <header class="bolha-topo">
            <img src="img/fatobot-rosto.svg" alt="" width="40" height="40" />
            <div><strong>FatoBot</strong><small><span class="bolha-online"></span> Online · responde com fontes oficiais</small></div>
            @if (conversa.mensagens().length) { <button type="button" class="botao-icone" (click)="conversa.limpar()" aria-label="Nova conversa" title="Nova conversa"><app-icone nome="refresh" /></button> }
            <a routerLink="/fatobot" class="botao-icone" aria-label="Abrir em tela cheia" title="Tela cheia" (click)="conversa.aberto.set(false)"><app-icone nome="open_in_full" /></a>
            <button type="button" class="botao-icone" (click)="conversa.aberto.set(false)" aria-label="Minimizar"><app-icone nome="close" /></button>
          </header>
          <div class="bolha-mensagens" #lista>
            @if (!conversa.mensagens().length) {
              <div class="bolha-boasvindas">
                <p>Olá! Sou o <strong>FatoBot</strong>. Pergunte sobre leis, votações, políticos ou notícias. Eu respondo com fontes e, se não houver evidência, eu digo.</p>
                <span class="texto-suave">Sugestões para esta página:</span>
                @for (s of sugestoes(); track s) { <button type="button" class="bolha-sugestao" (click)="conversa.enviar(s)">{{ s }}</button> }
              </div>
            }
            @for (m of conversa.mensagens(); track $index) {
              <div class="bolha-msg" [class.bolha-voce]="m.autor === 'voce'">
                @if (m.autor === 'bot') { <img src="img/fatobot-rosto.svg" alt="" width="28" height="28" /> }
                <div class="bolha-balao">
                  <p>{{ m.texto }}</p>
                  @if (m.resposta; as r) {
                    @if (r.sem_evidencia) { <app-selo tipo="insuficiente" /> }
                    @else if (r.fontes.length) { <app-selo tipo="verificado" texto="Com fonte oficial" /> }
                    @for (f of r.fontes; track f.url) { <app-fonte [fonte]="f" rotulo="data" /> }
                  }
                </div>
              </div>
            }
            @if (conversa.pensando()) { <div class="bolha-msg"><img src="img/fatobot-rosto.svg" alt="" width="28" height="28" /><div class="bolha-balao bolha-digitando"><span></span><span></span><span></span></div></div> }
          </div>
          <form class="bolha-form" (submit)="$event.preventDefault(); enviar()">
            <label for="bolha-texto" class="sr-only">Pergunte ao FatoBot</label>
            <input id="bolha-texto" name="pergunta" [(ngModel)]="pergunta" placeholder="Pergunte ao FatoBot..." autocomplete="off" maxlength="500" />
            <button type="submit" class="bolha-enviar" [disabled]="!pergunta.trim() || conversa.pensando()" aria-label="Enviar"><app-icone nome="send" /></button>
          </form>
          <small class="bolha-aviso">O FatoBot pode errar. Confira sempre as fontes.</small>
        </section>
      }
      @if (dica() && !conversa.aberto()) {
        <div class="bolha-dica" role="status">
          <button type="button" class="bolha-dica-fechar" (click)="fecharDica()" aria-label="Fechar dica"><app-icone nome="close" /></button>
          <span>Dúvida sobre algo nesta página? <strong>Pergunte ao FatoBot!</strong></span>
        </div>
      }
      <button type="button" class="bolha-botao" [class.aberta]="conversa.aberto()" (click)="alternar()" [attr.aria-expanded]="conversa.aberto()" [attr.aria-label]="conversa.aberto() ? 'Fechar o FatoBot' : 'Abrir o FatoBot'">
        @if (conversa.aberto()) { <app-icone nome="keyboard_arrow_down" /> } @else { <img src="img/fatobot-rosto.svg" alt="" width="58" height="58" /> }
        @if (naoLidas() && !conversa.aberto()) { <span class="bolha-contador">{{ naoLidas() }}</span> }
      </button>
    }
  `,
})
export class FatoBotBolha {
  protected conversa = inject(FatoBotConversa);
  private router = inject(Router);
  private lista = viewChild<ElementRef<HTMLElement>>('lista');
  protected pergunta = '';
  private readonly url = signal(this.router.url);
  protected readonly naPaginaDoBot = computed(() => this.url().startsWith('/fatobot'));
  protected readonly dica = signal(false);
  private vistas = signal(this.conversa.mensagens().length);
  protected readonly naoLidas = computed(() => Math.max(0, this.conversa.mensagens().filter((m) => m.autor === 'bot').length - this.vistas()));

  protected readonly sugestoes = computed(() => {
    const u = this.url();
    const titulo = this.tituloDaPagina();
    if (/^\/politicos\/(senado\/)?\d+/.test(u) && titulo) return [`O que se sabe sobre a atuação de ${titulo}?`, `Quais projetos ${titulo} apresentou?`, 'Como funciona a cota parlamentar?'];
    if (u.startsWith('/politicos')) return ['Qual é a função de um deputado federal?', 'Qual a diferença entre deputado e senador?', 'Como funciona a cota parlamentar?'];
    if (u.startsWith('/congresso')) return ['Como funciona uma votação nominal?', 'O que é uma medida provisória?', 'Como um projeto vira lei?'];
    if (u.startsWith('/verificar') || u.startsWith('/fato-ou-fake')) return ['Como identificar uma notícia falsa?', 'Voto em branco ajuda quem está ganhando?', 'A urna eletrônica é conectada à internet?'];
    if (u.startsWith('/comunidades')) return ['Como debater política com respeito?', 'Como citar uma fonte confiável?', 'O que é desinformação?'];
    if (u.startsWith('/base-da-politica')) return ['O que faz o Senado?', 'O que é uma PEC?', 'Como funciona o processo legislativo?'];
    return ['Como funciona uma votação no Congresso?', 'Qual é a função de um deputado federal?', 'Quantos deputados tem a Câmara?'];
  });
  private titulo = signal('');
  private tituloDaPagina() {
    return this.titulo();
  }

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.url.set(this.router.url);
      setTimeout(() => this.titulo.set(document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''), 1500);
    });
    // Dica aparece uma vez por visita
    try {
      if (!sessionStorage.getItem('fatoreal-dica-bot')) setTimeout(() => this.dica.set(true), 5000);
    } catch {
      /* sem armazenamento */
    }
    effect(() => {
      this.conversa.mensagens();
      this.conversa.pensando();
      if (this.conversa.aberto()) {
        this.vistas.set(this.conversa.mensagens().filter((m) => m.autor === 'bot').length);
        setTimeout(() => this.lista()?.nativeElement.scrollTo({ top: 1e6, behavior: 'smooth' }));
      }
    });
  }

  protected alternar() {
    this.conversa.aberto.update((a) => !a);
    this.fecharDica();
    if (this.conversa.aberto()) setTimeout(() => document.getElementById('bolha-texto')?.focus(), 50);
  }

  protected fecharDica() {
    this.dica.set(false);
    try {
      sessionStorage.setItem('fatoreal-dica-bot', '1');
    } catch {
      /* sem armazenamento */
    }
  }

  protected enviar() {
    const p = this.pergunta;
    this.pergunta = '';
    this.conversa.enviar(p);
  }

  @HostListener('document:keydown.escape')
  protected esc() {
    if (this.conversa.aberto()) this.conversa.aberto.set(false);
  }
}
