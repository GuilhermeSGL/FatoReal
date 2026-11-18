import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { supabase } from './supabase';

export type Opiniao = 'favor' | 'contra';
export interface Placar { favor: number; contra: number; minha: Opiniao | null }

const CHAVE = 'fatoreal-opinioes-v1';

/**
 * Opinião das pessoas sobre projetos reais (a favor / contra).
 * Supabase: tabela "opinioes_projetos" (proposicao_id, usuario_id, opiniao). Sem ela, fica salvo neste navegador.
 */
@Injectable({ providedIn: 'root' })
export class OpinioesService {
  private auth = inject(AuthService);
  private readonly locais = signal<Record<string, Opiniao>>(this.ler());
  private semTabela = false;

  private ler(): Record<string, Opiniao> {
    try {
      return JSON.parse(localStorage.getItem(CHAVE) ?? '{}');
    } catch {
      return {};
    }
  }

  private gravar(v: Record<string, Opiniao>) {
    this.locais.set(v);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(v));
    } catch {
      /* sem localStorage */
    }
  }

  private placarLocal(id: number): Placar {
    const minha = this.locais()[id] ?? null;
    return { favor: minha === 'favor' ? 1 : 0, contra: minha === 'contra' ? 1 : 0, minha };
  }

  async placar(id: number): Promise<Placar> {
    if (!supabase || this.semTabela) return this.placarLocal(id);
    const { data, error } = await supabase.from('opinioes_projetos').select('opiniao, usuario_id').eq('proposicao_id', id);
    if (error) {
      this.semTabela = true;
      return this.placarLocal(id);
    }
    const eu = this.auth.usuario()?.id;
    const linhas = (data ?? []) as { opiniao: Opiniao; usuario_id: string }[];
    return {
      favor: linhas.filter((l) => l.opiniao === 'favor').length,
      contra: linhas.filter((l) => l.opiniao === 'contra').length,
      minha: linhas.find((l) => l.usuario_id === eu)?.opiniao ?? null,
    };
  }

  /** Marca (ou desmarca, se repetir) a opinião. Devolve o placar atualizado. */
  async opinar(id: number, o: Opiniao): Promise<Placar> {
    const eu = this.auth.usuario()?.id;
    if (supabase && !this.semTabela && eu) {
      const atual = await this.placar(id);
      const q = supabase.from('opinioes_projetos');
      const r = atual.minha === o
        ? await q.delete().eq('proposicao_id', id).eq('usuario_id', eu)
        : await q.upsert({ proposicao_id: id, usuario_id: eu, opiniao: o }, { onConflict: 'proposicao_id,usuario_id' });
      if (!r.error) return this.placar(id);
      this.semTabela = true;
    }
    const v = { ...this.locais() };
    if (v[id] === o) delete v[id];
    else v[id] = o;
    this.gravar(v);
    return this.placarLocal(id);
  }
}
