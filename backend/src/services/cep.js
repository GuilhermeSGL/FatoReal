// Consulta de CEP no ViaCEP (gratuito, sem chave): https://viacep.com.br
import { cached } from '../utils/cache.js';

const VIACEP = 'https://viacep.com.br/ws';
const TIMEOUT_MS = 8_000;
const CACHE_MS = 24 * 60 * 60 * 1000; // CEP quase nunca muda: 24 horas

export class CepError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

// Aceita "01310-100", "01310100" ou "01.310-100". Retorna 8 dígitos ou null.
export function normalizarCep(cep) {
  const digitos = String(cep ?? '').replace(/\D/g, '');
  return digitos.length === 8 ? digitos : null;
}

async function buscarViaCep(cep) {
  const url = `${VIACEP}/${cep}/json/`;
  let ultimoErro;
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`ViaCEP respondeu ${res.status}`);
      return { url, json: await res.json() };
    } catch (err) {
      ultimoErro = err;
    }
  }
  throw new CepError(`Falha ao consultar o ViaCEP: ${ultimoErro?.message}`);
}

// Retorna o endereço ou lança CepError(404) se o CEP não existir.
export function consultarCep(cep) {
  return cached(`cep:${cep}`, CACHE_MS, async () => {
    const { url, json } = await buscarViaCep(cep);
    if (json.erro) throw new CepError('CEP não encontrado', 404);
    return {
      cep: json.cep,
      logradouro: json.logradouro || null,
      complemento: json.complemento || null,
      bairro: json.bairro || null,
      cidade: json.localidade,
      uf: json.uf,
      estado: json.estado || null,
      fonte: { nome: 'ViaCEP', url, consultadoEm: new Date().toISOString() },
    };
  });
}
