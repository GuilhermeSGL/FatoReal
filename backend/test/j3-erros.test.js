// J3 — erros claros
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { _setCopia } from '../src/services/camara.js';
import { iniciar, mockCamara, perguntar } from './ajuda.js';

let srv;
beforeEach(async () => (srv = await iniciar()));
afterEach(async () => srv.encerrar());

test('J3: Câmara fora e sem cópia → 503 com a mensagem combinada', async () => {
  const camara = mockCamara('fora');
  _setCopia(null);
  try {
    for (const pergunta of ['Qual o partido de Tabata Amaral?', 'oi tudo bem']) {
      const { status, body } = await perguntar(srv.base, pergunta);
      assert.equal(status, 503);
      assert.deepEqual(body, { erro: 'A fonte oficial (Câmara) está fora do ar agora.' });
    }
    const busca = await fetch(`${srv.base}/api/deputados?busca=tabata`);
    assert.equal(busca.status, 503);
  } finally {
    camara.restaurar();
  }
});

test('J3: pergunta curta ou longa demais continua 400 com a mensagem atual', async () => {
  const msg = { erro: 'A pergunta deve ter entre 3 e 500 caracteres.' };
  for (const pergunta of ['oi', 'a'.repeat(501)]) {
    const { status, body } = await perguntar(srv.base, pergunta);
    assert.equal(status, 400);
    assert.deepEqual(body, msg);
  }
});
