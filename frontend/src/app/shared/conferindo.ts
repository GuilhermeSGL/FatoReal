import { Component, OnDestroy, OnInit, input, output, signal } from '@angular/core';
import { fonteOficial } from '../core/util';
import { Icone } from './componentes';

interface Pensamento { icone: string; texto: string; cor: string; x: number; id: number }

/**
 * Faixa pequena que aparece ao publicar: o FatoBot "confere" a publicação (lupinha, bloquinhos do raciocínio
 * subindo e barra de envio). No fim mostra "Publicado!" e, se o link for de órgão oficial, o selo "Com fonte".
 * Não muda a publicação: é um aviso visual. Quem prefere menos movimento vê só a barra.
 */
@Component({
  selector: 'app-conferindo',
  imports: [Icone],
  template: `
    <div class="conf" [class.fim]="terminou()" role="status" aria-live="polite">
      <span class="conf-bot"><img src="img/fatobot-rosto.svg" alt="" /><span class="conf-lupa"><app-icone nome="search" /></span></span>
      @if (!terminou()) {
        <span class="conf-txt"><b>FatoBot está conferindo<span class="conf-pontos"></span></b><span class="conf-trilho"><i [style.animation-duration.ms]="duracao"></i></span></span>
        <span class="conf-nuvem" aria-hidden="true">
          @for (p of pensamentos(); track p.id) {
            <span class="conf-chip" [style.--c]="p.cor" [style.left.px]="p.x"><app-icone [nome]="p.icone" /> {{ p.texto }}</span>
          }
        </span>
        <span class="sr-only">Conferindo sua publicação</span>
      } @else {
        <span class="conf-pronto"><app-icone nome="check_circle" /> Publicado!
          @if (oficial) { <span class="conf-selo"><app-icone nome="verified" /> Com fonte: {{ oficial }}</span> }
          @else if (link()) { <span class="conf-dica">Link anexado. Confira se a fonte é confiável.</span> }
          @else { <span class="conf-dica">Dica: publicações com link da fonte ganham mais confiança.</span> }
        </span>
      }
    </div>
  `,
})
export class Conferindo implements OnInit, OnDestroy {
  readonly texto = input('');
  readonly link = input<string | null>(null);
  readonly temImagem = input(false);
  /** Avisa quando a animação acabou (a publicação já pode aparecer no feed). */
  readonly fim = output<void>();

  protected readonly pensamentos = signal<Pensamento[]>([]);
  protected readonly terminou = signal(false);
  protected oficial: string | null = null;
  protected duracao = 4800;
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit() {
    this.oficial = fonteOficial(this.link());
    const passos: [string, string, string][] = [['edit_note', 'Lendo o texto', '#0369a1']];
    if (this.temImagem()) passos.push(['image', 'Olhando a imagem', '#7c3aed']);
    const tags = (this.texto().match(/#[\p{L}\d_]+/gu) ?? []).slice(0, 1);
    if (tags.length) passos.push(['tag', 'Assunto: ' + tags[0], '#be185d']);
    const link = this.link();
    if (link) {
      let host = link;
      try { host = new URL(link).hostname.replace(/^www\./, ''); } catch { /* link inválido */ }
      passos.push(['link', 'Abrindo ' + host, '#6d28d9']);
      if (this.oficial) passos.push(['account_balance', this.oficial, '#15803d'], ['event', 'Conferindo a data', '#be185d'], ['verified', 'Fonte oficial ✔', '#15803d']);
      else passos.push(['travel_explore', 'Procurando a fonte', '#b45309']);
    } else {
      passos.push(['travel_explore', 'Procurando o assunto', '#b45309'], ['lightbulb', 'Sem link de fonte', '#64748b']);
    }
    const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.duracao = menosMovimento ? 1500 : Math.max(3600, passos.length * 800 + 1000);
    if (!menosMovimento) {
      const xs = [0, 120, 20, 160, 60, 130, 10];
      passos.forEach(([icone, texto, cor], k) =>
        this.timers.push(setTimeout(() => this.pensamentos.update((l) => [...l.slice(-3), { icone, texto, cor, x: xs[k % xs.length], id: k }]), k * 800)),
      );
    }
    this.timers.push(setTimeout(() => { this.terminou.set(true); this.fim.emit(); }, this.duracao));
  }

  ngOnDestroy() {
    this.timers.forEach(clearTimeout);
  }
}
