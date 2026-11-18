import { Injectable, Injector, inject, signal } from '@angular/core';
import type { RespostaFatoBot } from './modelos';

export interface MensagemBot {
  autor: 'voce' | 'bot';
  texto: string;
  resposta?: RespostaFatoBot;
}

/** Conversa com o FatoBot que acompanha a pessoa em todas as páginas (bolinha e página cheia usam a mesma). */
@Injectable({ providedIn: 'root' })
export class FatoBotConversa {
  private injector = inject(Injector);
  readonly aberto = signal(false);
  readonly mensagens = signal<MensagemBot[]>(this.ler());
  readonly pensando = signal(false);

  private ler(): MensagemBot[] {
    try {
      return JSON.parse(sessionStorage.getItem('fatoreal-fatobot') ?? '[]');
    } catch {
      return [];
    }
  }
  private salvar() {
    try {
      sessionStorage.setItem('fatoreal-fatobot', JSON.stringify(this.mensagens().slice(-30)));
    } catch {
      /* sem armazenamento */
    }
  }

  abrir(pergunta?: string) {
    this.aberto.set(true);
    if (pergunta?.trim()) this.enviar(pergunta);
  }

  limpar() {
    this.mensagens.set([]);
    this.salvar();
  }

  async enviar(texto: string) {
    const pergunta = texto.trim();
    if (!pergunta || this.pensando()) return;
    this.mensagens.update((m) => [...m, { autor: 'voce', texto: pergunta }]);
    this.salvar();
    this.pensando.set(true);
    try {
      // O serviço do bot só é carregado quando a pessoa pergunta algo (deixa o site abrir mais rápido)
      const { FatoBotService } = await import('./fatobot.service');
      const resposta = await this.injector.get(FatoBotService).perguntar(pergunta);
      this.mensagens.update((m) => [...m, { autor: 'bot', texto: resposta.resposta, resposta }]);
    } catch (e) {
      this.mensagens.update((m) => [...m, { autor: 'bot', texto: e instanceof Error ? e.message : 'O FatoBot não respondeu.' }]);
    } finally {
      this.pensando.set(false);
      this.salvar();
    }
  }
}
