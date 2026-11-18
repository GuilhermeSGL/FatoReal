import { Component, computed, input } from '@angular/core';
import { Redes } from '../core/modelos';

type Chave = keyof Redes;

interface Rede {
  chave: Chave;
  nome: string;
  fundo: string;
  dica: string;
  dominios: string[];
  url: (v: string) => string;
}

const usuario = (v: string) => v.trim().replace(/^@/, '').replace(/[^a-z0-9._-]/gi, '');

/** Redes aceitas, na ordem em que aparecem no perfil. */
export const REDES: Rede[] = [
  { chave: 'instagram', nome: 'Instagram', fundo: 'linear-gradient(45deg, #f58529, #dd2a7b 50%, #8134af)', dica: '@seu.usuario', dominios: ['instagram.com'], url: (v) => `https://instagram.com/${usuario(v)}` },
  { chave: 'tiktok', nome: 'TikTok', fundo: '#111111', dica: '@seu.usuario', dominios: ['tiktok.com'], url: (v) => `https://www.tiktok.com/@${usuario(v)}` },
  { chave: 'facebook', nome: 'Facebook', fundo: '#1877f2', dica: 'seu.usuario', dominios: ['facebook.com', 'fb.com'], url: (v) => `https://facebook.com/${usuario(v)}` },
  { chave: 'whatsapp', nome: 'WhatsApp', fundo: '#25d366', dica: '(81) 99999-9999', dominios: ['wa.me', 'whatsapp.com'], url: (v) => `https://wa.me/${numero(v)}` },
  { chave: 'x', nome: 'X (Twitter)', fundo: '#000000', dica: '@seu_usuario', dominios: ['x.com', 'twitter.com'], url: (v) => `https://x.com/${usuario(v)}` },
  { chave: 'linkedin', nome: 'LinkedIn', fundo: '#0a66c2', dica: 'seu-usuario', dominios: ['linkedin.com'], url: (v) => `https://www.linkedin.com/in/${usuario(v)}` },
  { chave: 'youtube', nome: 'YouTube', fundo: '#ff0000', dica: '@seucanal', dominios: ['youtube.com', 'youtu.be'], url: (v) => `https://www.youtube.com/@${usuario(v)}` },
];

function numero(v: string): string {
  let d = v.replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) d = '55' + d; // DDD + número
  return d;
}

/** Link final da rede, ou null se o valor não for válido (só aceita links dos sites oficiais). */
export function linkDaRede(chave: Chave, valor?: string | null): string | null {
  const r = REDES.find((x) => x.chave === chave);
  const v = (valor ?? '').trim();
  if (!r || !v) return null;
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      const host = u.hostname.replace(/^www\.|^m\./, '');
      return u.protocol === 'https:' && r.dominios.some((d) => host === d || host.endsWith('.' + d)) ? u.href : null;
    } catch {
      return null;
    }
  }
  if (chave === 'whatsapp') return numero(v).length >= 12 ? r.url(v) : null;
  return usuario(v).length >= 2 ? r.url(v) : null;
}

/** Ícones das redes sociais (desenhos próprios, com as cores de cada rede). */
@Component({
  selector: 'app-redes',
  template: `
    @if (lista().length) {
      <ul class="redes-icones" [class.redes-grandes]="grande()">
        @for (r of lista(); track r.chave) {
          <li>
            <a [href]="r.link" target="_blank" rel="noopener noreferrer me" [attr.aria-label]="r.nome + (dono() ? ' de ' + dono() : '')" [title]="r.nome" [style.background]="r.fundo">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                @switch (r.chave) {
                  @case ('instagram') { <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="#fff" stroke-width="2" /><circle cx="12" cy="12" r="3.6" fill="none" stroke="#fff" stroke-width="2" /><circle cx="16.9" cy="7.1" r="1.2" fill="#fff" /> }
                  @case ('tiktok') { <path d="M13.5 4v10a3.4 3.4 0 1 1-3-3.38" fill="none" stroke="#25f4ee" stroke-width="2.2" transform="translate(-.6 .4)" /><path d="M13.5 4v10a3.4 3.4 0 1 1-3-3.38M13.5 4c.4 2.4 2.1 3.9 4.6 4.1" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" /> }
                  @case ('facebook') { <path d="M13.4 20v-6.4h2.2l.35-2.6H13.4V9.4c0-.8.25-1.3 1.35-1.3h1.35V5.8c-.25 0-1.05-.1-2-.1-2 0-3.35 1.2-3.35 3.4V11H8.5v2.6h2.25V20z" fill="#fff" /> }
                  @case ('whatsapp') { <path d="M12 4.2a7.8 7.8 0 0 0-6.75 11.7L4.2 19.8l4-1.04A7.8 7.8 0 1 0 12 4.2z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" /><path d="M9.3 8.5c.2-.4.45-.4.65-.4h.45c.17 0 .37 0 .5.37l.6 1.43c.08.2.03.4-.08.56l-.42.52c.43.82 1.1 1.5 1.92 1.93l.52-.42c.17-.12.37-.17.57-.08l1.43.6c.36.14.36.33.36.5v.45c0 .2 0 .45-.4.66-.5.28-1.2.38-2 .1a7 7 0 0 1-4.1-4.13c-.28-.8-.18-1.5.1-2z" fill="#fff" /> }
                  @case ('x') { <path d="M5.5 5h3.6l9.4 14h-3.6zM18.2 5l-5.3 6M5.8 19l5.4-6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" /> }
                  @case ('linkedin') { <rect x="6" y="10" width="2.6" height="8" fill="#fff" /><circle cx="7.3" cy="6.9" r="1.55" fill="#fff" /><path d="M11 10h2.5v1.15c.5-.85 1.45-1.35 2.65-1.35 2 0 2.85 1.3 2.85 3.45V18h-2.6v-4.3c0-1-.3-1.75-1.3-1.75s-1.5.8-1.5 1.8V18H11z" fill="#fff" /> }
                  @case ('youtube') { <rect x="3.5" y="6.5" width="17" height="11" rx="3.2" fill="#fff" /><path d="M10.4 9.4v5.2l4.5-2.6z" fill="#ff0000" /> }
                }
              </svg>
              @if (grande()) { <span>{{ r.nome }}</span> }
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class RedesSociais {
  readonly redes = input<Redes | null | undefined>(null);
  readonly dono = input('');
  readonly grande = input(false);
  protected readonly lista = computed(() =>
    REDES.map((r) => ({ ...r, link: linkDaRede(r.chave, this.redes()?.[r.chave]) })).filter((r): r is typeof r & { link: string } => !!r.link),
  );
}
