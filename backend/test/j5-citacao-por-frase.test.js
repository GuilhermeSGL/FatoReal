// J5 — citação em CADA frase com fato
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { citacoesValidas, dividirFrases, frasesSemCitacao } from '../src/services/gemini.js';
import { iniciar, mockCamara, mockGemini, perguntar } from './ajuda.js';

test('J5: toda frase precisa de citação válida', () => {
  assert.equal(citacoesValidas('Ela é do PSB [1]. Está em exercício [2].', 2), true);
  assert.equal(citacoesValidas('Ela é do PSB [1]. Ela é ótima.', 2), false);
  assert.equal(citacoesValidas('Ela é do PSB [1]! Vote nela!', 2), false);
  assert.equal(citacoesValidas('Ela é do PSB [1].\nVote nela.', 2), false);
  assert.equal(citacoesValidas('Ela é do PSB [3].', 2), false, 'citação inexistente');
  assert.equal(citacoesValidas('Ela é do PSB. [1]', 2), true, 'referência solta depois do ponto conta');
  assert.equal(citacoesValidas('', 2), false);
  assert.deepEqual(frasesSemCitacao('A [1]. B. C [1].'), ['B.']);
  assert.equal(dividirFrases('A [1]. B [1]? C [1]!').length, 3);
});

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

test('J5: FatoBot descarta resposta com uma frase sem citação (ex.: opinião sobre voto)', async () => {
  mockGemini('Tabata Amaral é deputada federal pelo PSB-SP [1]. Vale a pena votar nela.');
  const { body } = await perguntar(srv.base, 'Qual o partido de Tabata Amaral? Devo votar nela?');
  assert.equal(body.modo, 'somente_fontes');
  assert.equal(body.motivo_sem_ia, 'citacao_invalida');
  assert.ok(!body.resposta.includes('votar'));
});

test('J5: Verificar vira "Evidência insuficiente" se uma frase não cita', async () => {
  mockGemini('{"estado":"sustentam","explicacao":"Ela é do PSB [1]. E faz um ótimo trabalho."}');
  const res = await fetch(`${srv.base}/api/verificar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ afirmacao: 'Tabata Amaral é do PSB' }),
  });
  assert.equal((await res.json()).estado, 'Evidência insuficiente');
});
