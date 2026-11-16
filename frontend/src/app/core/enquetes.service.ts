import { Injectable, signal } from '@angular/core';
import { supabase } from './supabase';

export interface Enquete {
  opcoes: string[];
  votos: number[];
  /** Índice da opção que esta pessoa votou. */
  meuVoto?: number;
}

const CHAVE = 'fatoreal-enquetes-v1';

/** Enquetes nas publicações das comunidades. Ficam guardadas neste navegador. */
@Injectable({ providedIn: 'root' })
export class EnquetesService {
  private readonly todas = signal<Record<string, Enquete>>(this.ler());

  private ler(): Record<string, Enquete> {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch {
      return {};
    }
    // Modo demonstração: enquete de exemplo na publicação "onde vocês conferem notícias?"
    return supabase ? {} : { 3: { opcoes: ['Sites oficiais (Câmara, TSE, gov.br)', 'Agências de checagem', 'Jornais e TV', 'Redes sociais'], votos: [9, 6, 4, 2] } };
  }

  private salvar(v: Record<string, Enquete>) {
    this.todas.set(v);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(v));
    } catch {
      /* sem localStorage */
    }
  }

  de(publicacaoId: number): Enquete | undefined {
    return this.todas()[publicacaoId];
  }

  criar(publicacaoId: number, opcoes: string[]) {
    const limpas = opcoes.map((o) => o.trim()).filter(Boolean).slice(0, 4);
    if (limpas.length < 2) return;
    this.salvar({ ...this.todas(), [publicacaoId]: { opcoes: limpas, votos: limpas.map(() => 0) } });
  }

  votar(publicacaoId: number, opcao: number) {
    const e = this.de(publicacaoId);
    if (!e || opcao < 0 || opcao >= e.opcoes.length) return;
    const votos = [...e.votos];
    if (e.meuVoto !== undefined) votos[e.meuVoto] = Math.max(0, votos[e.meuVoto] - 1);
    const desfazer = e.meuVoto === opcao;
    if (!desfazer) votos[opcao]++;
    this.salvar({ ...this.todas(), [publicacaoId]: { ...e, votos, meuVoto: desfazer ? undefined : opcao } });
  }
}
