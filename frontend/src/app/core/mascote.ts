import { Injectable, computed, signal } from '@angular/core';

export type IdMascote = 'robo' | 'ara' | 'mico' | 'jabu' | 'tuca' | 'cervo';

export interface Mascote {
  id: IdMascote;
  nome: string;
  bicho: string;
  jeito: string;
  /** Artigo para frases como "Sou o Jabu" / "Sou a Ará". */
  artigo: 'o' | 'a';
  /** Corpo inteiro (fundo transparente). */
  img: string;
  /** Rostinho quadrado para a bolinha e os balões. */
  rosto: string;
}

/**
 * Mascotes do assistente do Fato Real: é só o visual, o assistente por trás é o mesmo.
 * O padrão é o robozinho FatoBot; os bichinhos brasileiros são opção (Configurações > Seu assistente).
 */
export const MASCOTES: Mascote[] = [
  { id: 'robo', nome: 'FatoBot', bicho: 'Robozinho (padrão)', artigo: 'o', jeito: 'O assistente de sempre do Fato Real.', img: 'img/fatobot.svg', rosto: 'img/fatobot-rosto.svg' },
  { id: 'ara', nome: 'Ará', bicho: 'Arara-canindé', artigo: 'a', jeito: 'Fala muito, mas só o que tem fonte.', img: 'img/mascotes/ara.webp', rosto: 'img/mascotes/ara-rosto.webp' },
  { id: 'jabu', nome: 'Jabu', bicho: 'Jabuti', artigo: 'o', jeito: 'Devagar e sempre: confere tudo com calma.', img: 'img/mascotes/jabu.webp', rosto: 'img/mascotes/jabu-rosto.webp' },
  { id: 'tuca', nome: 'Tuca', bicho: 'Tucano', artigo: 'o', jeito: 'Do alto, vê o quadro todo.', img: 'img/mascotes/tuca.webp', rosto: 'img/mascotes/tuca-rosto.webp' },
  { id: 'mico', nome: 'Mico', bicho: 'Mico-leão-dourado', artigo: 'o', jeito: 'Curioso, fuça até achar a fonte.', img: 'img/mascotes/mico.webp', rosto: 'img/mascotes/mico-rosto.webp' },
  { id: 'cervo', nome: 'Cervo', bicho: 'Cervo-do-pantanal', artigo: 'o', jeito: 'Natureza e tecnologia: conecta as pessoas.', img: 'img/mascotes/cervo.webp', rosto: 'img/mascotes/cervo-rosto.webp' },
];

const CHAVE = 'fatoreal-mascote';

@Injectable({ providedIn: 'root' })
export class MascoteService {
  readonly id = signal<IdMascote>(this.ler());
  readonly atual = computed(() => MASCOTES.find((m) => m.id === this.id()) ?? MASCOTES[0]);
  readonly nome = computed(() => this.atual().nome);
  readonly rosto = computed(() => this.atual().rosto);
  readonly img = computed(() => this.atual().img);

  escolher(id: IdMascote) {
    this.id.set(id);
    try {
      localStorage.setItem(CHAVE, id);
    } catch {
      /* sem localStorage */
    }
  }

  private ler(): IdMascote {
    try {
      const v = localStorage.getItem(CHAVE);
      if (MASCOTES.some((m) => m.id === v)) return v as IdMascote;
    } catch {
      /* sem localStorage */
    }
    return 'robo';
  }
}
