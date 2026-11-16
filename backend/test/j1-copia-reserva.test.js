// J1 — cópia de reserva da Câmara (src/data/deputados.json)
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import copia from '../src/data/deputados.json' with { type: 'json' };
import { iniciar, mockCamara, mockGemini, perguntar } from './ajuda.js';

let srv;
let camara;
beforeEach(async () => {
  srv = await iniciar();
  camara = mockCamara('fora'); // Câmara fora do ar em todos os testes deste arquivo
});
afterEach(async () => {
  camara.restaurar();
  await srv.encerrar();
});

test('J1: o arquivo da cópia é válido (513 deputados, data da coleta, sem CPF)', () => {
  assert.ok(copia.dados.length >= 500);
  assert.ok(!Number.isNaN(Date.parse(copia.coletadoEm)));
  for (const d of copia.dados) {
    assert.deepEqual(Object.keys(d).sort(), ['foto', 'id', 'nome', 'partido', 'uf']);
  }
  assert.ok(!JSON.stringify(copia).toLowerCase().includes('cpf'));
});

test('J1: "oi tudo bem" com a Câmara fora não dá erro', async () => {
  const { status, body } = await perguntar(srv.base, 'oi tudo bem');
  assert.equal(status, 200);
  assert.equal(body.sem_evidencia, true);
});

test('J1: FatoBot usa a cópia e mostra a data dela como fonte', async () => {
  mockGemini('Tabata Amaral é deputada federal pelo PSB-SP [1].');
  const { status, body } = await perguntar(srv.base, 'Qual o partido de Tabata Amaral?');
  assert.equal(status, 200);
  assert.equal(body.modo, 'ia_com_fontes');
  const [fonte] = body.fontes;
  const dia = copia.coletadoEm.slice(0, 10).split('-').reverse().join('/');
  assert.match(fonte.titulo, new RegExp(`cópia de reserva de ${dia}`));
  assert.equal(fonte.data, copia.coletadoEm);
  assert.match(fonte.url, /dadosabertos\.camara\.leg\.br\/api\/v2\/deputados\/204534$/);
});

test('J1: busca de deputados usa a cópia quando a Câmara cai', async () => {
  const res = await fetch(`${srv.base}/api/deputados?busca=tabata`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.total, 1);
  assert.match(body.fonte.nome, /cópia de reserva/);
  assert.equal(body.fonte.consultadoEm, copia.coletadoEm);
});
