import { apiUrl } from './supabase';

export interface EnderecoCep { cep: string; logradouro: string; complemento: string; bairro: string; cidade: string; uf: string; estado: string; fonte: string }
export interface DeputadoCep { id: number; nome: string; partido: string; uf: string; foto: string }
export interface DeputadosCep { uf: string; total: number; dados: DeputadoCep[]; fonte: string }

/** Só os números do CEP (8 dígitos) ou null. */
export function soNumerosCep(texto: string): string | null {
  const n = texto.replace(/\D/g, '');
  return n.length === 8 ? n : null;
}

async function pedir<T>(cep: string, comPoliticos: boolean): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${apiUrl}/cep/${cep}${comPoliticos ? '' : '?politicos=0'}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error('O serviço de CEP não respondeu. Preencha cidade e estado à mão.');
  }
  const dados = (await resp.json().catch(() => ({}))) as T & { erro?: string };
  if (!resp.ok) {
    if (resp.status === 404) throw new Error(dados.erro || 'CEP não encontrado.');
    if (resp.status === 400) throw new Error(dados.erro || 'CEP inválido: informe 8 números.');
    throw new Error(dados.erro || 'O serviço de CEP não respondeu. Preencha cidade e estado à mão.');
  }
  return dados;
}

/** GET {API_URL}/cep/<cep>?politicos=0 → { endereco } (rápido: só o endereço). */
export async function buscarCep(cep: string): Promise<EnderecoCep> {
  return (await pedir<{ endereco: EnderecoCep }>(cep, false)).endereco;
}

/** GET {API_URL}/cep/<cep> → { endereco, deputados } (deputados pode vir null se a Câmara falhar). */
export async function deputadosDoCep(cep: string): Promise<DeputadosCep | null> {
  try {
    return (await pedir<{ deputados: DeputadosCep | null }>(cep, true)).deputados ?? null;
  } catch {
    return null;
  }
}
