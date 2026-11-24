import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { supabase } from './supabase';

export type Opiniao = 'favor' | 'contra';
export interface Placar { favor: number; contra: number; minha: Opiniao | null }

const CHAVE = 'fatoreal-opinioes-v1';

/**
 * Opinião das pessoas sobre projetos reais (a favor / contra).
 * Supabase: tabela "opinioes_projetos" (proposicao_id, usuario_id, opiniao) + função "contagem_opinioes".
 * Sem elas, fica salvo neste navegador.
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

  /**
   * Totais de um projeto + a opinião da própria pessoa.
   * LGPD: opinião política é dado sensível (RN06). O site nunca lê as opiniões dos outros:
   * os totais vêm da função "contagem_opinioes" (só números) e a regra do banco
   * só deixa cada pessoa ler a própria linha.
   */
  async placar(id: number): Promise<Placar> {
    if (!supabase || this.semTabela) return this.placarLocal(id);
    const { data: totais, error } = await supabase.rpc('contagem_opinioes', { p_proposicao: id });
    if (error) {
      this.semTabela = true;
      return this.placarLocal(id);
    }
    const t = (Array.isArray(totais) ? totais[0] : totais) as { favor: number | string; contra: number | string } | null;
    let minha: Opiniao | null = null;
    const eu = this.auth.usuario()?.id;
    if (eu) {
      const { data } = await supabase.from('opinioes_projetos').select('opiniao').eq('proposicao_id', id).eq('usuario_id', eu).maybeSingle();
      minha = (data as { opiniao: Opiniao } | null)?.opiniao ?? null;
    }
    return { favor: Number(t?.favor ?? 0), contra: Number(t?.contra ?? 0), minha };
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
