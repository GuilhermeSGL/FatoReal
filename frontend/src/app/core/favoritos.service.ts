import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { lerDemo, salvarDemo } from './demo-store';
import { supabase } from './supabase';

export type TipoFavorito = 'politico' | 'projeto' | 'noticia' | 'publicacao' | 'comunidade';
export interface Favorito { tipo: TipoFavorito; ref_id: string; titulo: string; url: string | null; criado_em: string }

const CHAVE = 'favoritos-v1';

/**
 * Favoritos da pessoa ("Salvos" no Meu Perfil).
 * Supabase: tabela "favoritos" (cada pessoa só vê os próprios). Sem Supabase: salvo neste navegador.
 */
@Injectable({ providedIn: 'root' })
export class FavoritosService {
  private auth = inject(AuthService);
  readonly lista = signal<Favorito[]>([]);
  private readonly chaves = computed(() => new Set(this.lista().map((f) => `${f.tipo}:${f.ref_id}`)));

  constructor() {
    // Recarrega quando a pessoa entra ou sai
    effect(() => {
      this.auth.usuario();
      this.carregar();
    });
  }

  salvo(tipo: TipoFavorito, ref: string | number): boolean {
    return this.chaves().has(`${tipo}:${ref}`);
  }

  async carregar() {
    const eu = this.auth.usuario()?.id;
    if (!eu) return this.lista.set([]);
    if (!supabase) return this.lista.set(lerDemo<Favorito[]>(`${CHAVE}:${eu}`, []));
    const { data, error } = await supabase.from('favoritos').select('tipo, ref_id, titulo, url, criado_em').order('criado_em', { ascending: false });
    this.lista.set(error ? [] : ((data ?? []) as Favorito[]));
  }

  /** Salva ou tira dos salvos. Devolve true se ficou salvo. Sem login, pede para entrar. */
  async alternar(f: Omit<Favorito, 'criado_em'>): Promise<boolean> {
    const eu = this.auth.usuario()?.id;
    if (!eu) throw new Error('Entre na sua conta para salvar.');
    const ref = String(f.ref_id);
    const ja = this.salvo(f.tipo, ref);
    const url = f.url && /^https?:\/\//.test(f.url) ? f.url : null;
    const titulo = (f.titulo || '').slice(0, 200);
    if (supabase) {
      const r = ja
        ? await supabase.from('favoritos').delete().eq('tipo', f.tipo).eq('ref_id', ref).eq('usuario_id', eu)
        : await supabase.from('favoritos').insert({ tipo: f.tipo, ref_id: ref, titulo, url });
      if (r.error) throw new Error('Não deu para salvar agora. Tente de novo.');
      await this.carregar();
    } else {
      const atual = this.lista().filter((x) => !(x.tipo === f.tipo && x.ref_id === ref));
      const nova = ja ? atual : [{ tipo: f.tipo, ref_id: ref, titulo, url, criado_em: new Date().toISOString() }, ...atual];
      salvarDemo(`${CHAVE}:${eu}`, nova);
      this.lista.set(nova);
    }
    return !ja;
  }
}
