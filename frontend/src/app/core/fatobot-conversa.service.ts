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
  /** Dicas que o FatoBot mostra sozinho em cada página (dá para desligar em Configurações). */
  readonly dicasLigadas = signal(this.preferencia('fatoreal-bot-dicas', true));
  /** Quando a pessoa pergunta por voz, o FatoBot lê a resposta em voz alta. */
  readonly falarRespostas = signal(this.preferencia('fatoreal-bot-voz', true));
  /** A última pergunta veio do microfone (para responder em voz alta). */
  private perguntaPorVoz = false;

  private preferencia(chave: string, padrao: boolean): boolean {
    try {
      const v = localStorage.getItem(chave);
      return v === null ? padrao : v === '1';
    } catch {
      return padrao;
    }
  }

  definir(chave: 'dicas' | 'voz', ligado: boolean) {
    (chave === 'dicas' ? this.dicasLigadas : this.falarRespostas).set(ligado);
    try {
      localStorage.setItem(chave === 'dicas' ? 'fatoreal-bot-dicas' : 'fatoreal-bot-voz', ligado ? '1' : '0');
    } catch {
      /* sem armazenamento */
    }
  }

  /** Pergunta feita pelo microfone. */
  enviarPorVoz(texto: string) {
    this.perguntaPorVoz = true;
    return this.enviar(texto);
  }

  private falar(texto: string) {
    if (!this.falarRespostas() || !('speechSynthesis' in window)) return;
    const fala = new SpeechSynthesisUtterance(texto.replace(/\(Modo demonstração[^)]*\)/g, ''));
    fala.lang = 'pt-BR';
    speechSynthesis.cancel();
    speechSynthesis.speak(fala);
  }

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
      if (this.perguntaPorVoz) this.falar(resposta.resposta);
    } catch (e) {
      this.mensagens.update((m) => [...m, { autor: 'bot', texto: e instanceof Error ? e.message : 'O FatoBot não respondeu.' }]);
    } finally {
      this.perguntaPorVoz = false;
      this.pensando.set(false);
      this.salvar();
    }
  }
}
