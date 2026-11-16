// J6 — "sem evidência" de verdade
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
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

test('J6: SEM_EVIDENCIA → sem_evidencia: true, frase combinada e fatos só como contexto', async () => {
  mockGemini('SEM_EVIDENCIA');
  const { status, body } = await perguntar(srv.base, 'Quantos projetos Tabata Amaral aprovou?');
  assert.equal(status, 200);
  assert.equal(body.sem_evidencia, true);
  assert.equal(body.tipo, 'sem_evidencia');
  assert.equal(body.resposta, 'Não encontrei evidência para isso.');
  assert.ok(!body.resposta.includes('Encontrei estas informações'));
  assert.deepEqual(body.fontes, [], 'fontes do perfil não aparecem como se respondessem');
  assert.ok(body.contexto.fatos.some((f) => f.includes('PSB-SP')));
  assert.equal(body.contexto.fontes.length, 1);
  assert.match(body.contexto.aviso, /só como contexto/);
});
