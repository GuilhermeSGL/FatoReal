import { Injectable, signal } from '@angular/core';

export type TamanhoFonte = 'normal' | 'grande' | 'maior';

/** Tamanho da letra e alto contraste. Fica salvo neste navegador. */
@Injectable({ providedIn: 'root' })
export class AcessibilidadeService {
  readonly fonte = signal<TamanhoFonte>(ler('fatoreal-fonte', 'normal') as TamanhoFonte);
  readonly contraste = signal(ler('fatoreal-contraste', 'normal') === 'alto');

  constructor() {
    this.aplicar();
  }

  definirFonte(f: TamanhoFonte) {
    this.fonte.set(f);
    salvar('fatoreal-fonte', f);
    this.aplicar();
  }

  alternarContraste() {
    this.contraste.update((c) => !c);
    salvar('fatoreal-contraste', this.contraste() ? 'alto' : 'normal');
    this.aplicar();
  }

  private aplicar() {
    const raiz = document.documentElement;
    raiz.dataset['fonte'] = this.fonte();
    raiz.dataset['contraste'] = this.contraste() ? 'alto' : 'normal';
  }
}

function ler(chave: string, padrao: string): string {
  try {
    return localStorage.getItem(chave) ?? padrao;
  } catch {
    return padrao;
  }
}
function salvar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem localStorage */
  }
}
