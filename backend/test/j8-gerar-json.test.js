// J8 — gerarJson({ instrucoes, mensagem, schema }) reutilizável (ex.: /api/verificar do Matheus)
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '@google/genai';
import { gerarJson, _setClient } from '../src/services/gemini.js';

let chamadas;
function geminiResponde(resposta) {
  chamadas = [];
  _setClient({
    models: {
      generateContent: async (params) => {
        chamadas.push(params);
        if (resposta instanceof Error) throw resposta;
        return resposta;
      },
    },
  });
}

afterEach(() => _setClient(undefined));

const SCHEMA = { type: 'object', properties: { sentimento: { type: 'string' } }, required: ['sentimento'] };
const pedido = { instrucoes: 'Classifique o sentimento.', mensagem: '<texto>Gostei</texto>', schema: SCHEMA };

test('J8: devolve o objeto e repassa instruções, mensagem e schema', async () => {
  geminiResponde({ text: '{"sentimento":"positivo"}' });
  assert.deepEqual(await gerarJson(pedido), { sentimento: 'positivo' });
  const { contents, config } = chamadas[0];
  assert.equal(contents, '<texto>Gostei</texto>');
  assert.equal(config.systemInstruction, 'Classifique o sentimento.');
  assert.equal(config.responseMimeType, 'application/json');
  assert.deepEqual(config.responseJsonSchema, SCHEMA);
});

test('J8: null quando não há chave configurada', async () => {
  const chave = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  _setClient(undefined);
  try {
    assert.equal(await gerarJson(pedido), null);
  } finally {
    if (chave) process.env.GEMINI_API_KEY = chave;
  }
});

test('J8: null para JSON inválido, bloqueio ou erro da API', async () => {
  geminiResponde({ text: 'isto não é json' });
  assert.equal(await gerarJson(pedido), null);

  geminiResponde({ text: undefined, promptFeedback: { blockReason: 'SAFETY' } });
  assert.equal(await gerarJson(pedido), null);

  geminiResponde(new ApiError({ message: 'quota', status: 429 }));
  assert.equal(await gerarJson(pedido), null);

  geminiResponde({ text: '"só uma string"' });
  assert.equal(await gerarJson(pedido), null);
});
