// J7 — modelo padrão e cota do Gemini (429)
import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '@google/genai';
import { MODELO_PADRAO } from '../src/services/gemini.js';
import { iniciar, mockCamara, mockGemini, perguntar } from './ajuda.js';

let srv;
let camara;
beforeEach(async () => {
  srv = await iniciar();
  camara = mockCamara('ok');
});
afterEach(async () => {
  camara.restaurar();
  await srv.encerrar();
});

test('J7: modelo padrão é o gemini-3.5-flash-lite', async () => {
  assert.equal(MODELO_PADRAO, 'gemini-3.5-flash-lite');
  const chamadas = mockGemini('Tabata Amaral é deputada federal pelo PSB-SP [1].');
  const modelo = process.env.GEMINI_MODEL;
  delete process.env.GEMINI_MODEL;
  try {
    await perguntar(srv.base, 'Qual o partido de Tabata Amaral?');
    assert.equal(chamadas[0].model, 'gemini-3.5-flash-lite');
  } finally {
    if (modelo) process.env.GEMINI_MODEL = modelo;
  }
});

test('J7: 429 (cota acabou) → mensagem própria na resposta e no log', async () => {
  const erros = [];
  const espiao = mock.method(console, 'error', (...a) => erros.push(a.join(' ')));
  mockGemini(new ApiError({ message: 'Resource exhausted', status: 429 }));
  try {
    const { status, body } = await perguntar(srv.base, 'Qual o partido de Tabata Amaral?');
    assert.equal(status, 200);
    assert.equal(body.modo, 'somente_fontes');
    assert.equal(body.motivo_sem_ia, 'cota_esgotada');
    assert.match(body.resposta, /^A IA atingiu o limite de uso gratuito por agora/);
    assert.match(body.resposta, /PSB-SP/);
    assert.ok(erros.some((e) => /cota do plano gratuito esgotada \(erro 429\)/.test(e)));
  } finally {
    espiao.mock.restore();
  }
});

test('J7: 429 no principal → tenta o modelo reserva', async () => {
  process.env.GEMINI_MODEL_RESERVA = 'gemini-2.5-flash-lite';
  const chamadas = mockGemini((_, n) =>
    n === 1 ? new ApiError({ message: 'quota', status: 429 }) : 'Tabata Amaral é deputada federal pelo PSB-SP [1].'
  );
  try {
    const { body } = await perguntar(srv.base, 'Qual o partido de Tabata Amaral?');
    assert.equal(body.modo, 'ia_com_fontes');
    assert.deepEqual(chamadas.map((c) => c.model), ['gemini-3.5-flash-lite', 'gemini-2.5-flash-lite']);
  } finally {
    delete process.env.GEMINI_MODEL_RESERVA;
  }
});
