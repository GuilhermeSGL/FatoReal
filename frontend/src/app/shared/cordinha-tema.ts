import { Component, inject, signal } from '@angular/core';
import { TemaService } from '../core/tema.service';

/**
 * Lâmpada pendurada com cordinha (canto direito da barra de cima).
 * Puxe a cordinha para baixo e solte: a luz acende (modo claro) ou apaga (modo escuro).
 * Também funciona com um clique ou com Enter/Espaço no teclado.
 */
@Component({
  selector: 'app-cordinha-tema',
  template: `
    <div class="lamp" [class.acesa]="tema.tema() === 'claro'">
      <span class="lamp-fio"></span>
      <span class="lamp-cupula"></span>
      <span class="lamp-bulbo"></span>
      <span class="lamp-luz"></span>
      <button type="button" class="lamp-corda" [style.--puxado.px]="puxado()" [class.solta]="!arrastando()"
        (pointerdown)="comecar($event)" (pointermove)="mover($event)" (pointerup)="soltar($event)" (pointercancel)="cancelar()"
        (keydown.enter)="$event.preventDefault(); puxarSozinho()" (keydown.space)="$event.preventDefault(); puxarSozinho()"
        [attr.aria-label]="tema.tema() === 'claro' ? 'Apagar a luz: ativar modo escuro' : 'Acender a luz: ativar modo claro'"
        [title]="tema.tema() === 'claro' ? 'Puxe para apagar (modo escuro)' : 'Puxe para acender (modo claro)'">
        <span class="lamp-linha"></span>
        <span class="lamp-pingente"></span>
      </button>
    </div>
  `,
})
export class CordinhaTema {
  protected tema = inject(TemaService);
  protected readonly puxado = signal(0);
  protected readonly arrastando = signal(false);
  private inicioY = 0;
  private moveu = false;

  protected comecar(e: PointerEvent) {
    (e.target as HTMLElement).closest('button')?.setPointerCapture(e.pointerId);
    this.inicioY = e.clientY;
    this.moveu = false;
    this.arrastando.set(true);
  }

  protected mover(e: PointerEvent) {
    if (!this.arrastando()) return;
    const d = Math.max(0, Math.min(46, e.clientY - this.inicioY));
    if (d > 3) this.moveu = true;
    this.puxado.set(d);
  }

  protected soltar(e: PointerEvent) {
    if (!this.arrastando()) return;
    const d = this.puxado();
    this.arrastando.set(false);
    this.puxado.set(0);
    // Puxou o bastante ou só clicou: troca a luz
    if (d > 16 || !this.moveu) {
      if (!this.moveu) this.puxarSozinho();
      else this.tema.alternar();
    }
    e.preventDefault();
  }

  protected cancelar() {
    this.arrastando.set(false);
    this.puxado.set(0);
  }

  /** Clique ou teclado: a cordinha desce e volta sozinha. */
  protected puxarSozinho() {
    this.arrastando.set(false);
    this.puxado.set(26);
    setTimeout(() => {
      this.tema.alternar();
      this.puxado.set(0);
    }, 160);
  }
}
