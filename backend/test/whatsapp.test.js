import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let base;

beforeEach(() => {
  process.env.WHATSAPP_NUMERO = '55 (61) 99999-0000';
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
});

afterEach(() => {
  delete process.env.WHATSAPP_NUMERO;
  server.close();
});

const enviar = (corpo) =>
  fetch(`${base}/api/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });

test('monta o link wa.me com a mensagem formatada', async () => {
  const res = await enviar({
    nome: 'Maria',
    motivo: 'Denunciar conteúdo suspeito',
    link: 'https://exemplo.com/boato',
    mensagem: 'Recebi no grupo da família',
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.url.startsWith('https://wa.me/5561999990000?text='));
  const texto = decodeURIComponent(body.url.split('?text=')[1]);
  assert.match(texto, /\*Nome:\* Maria/);
  assert.match(texto, /\*Motivo:\* Denunciar conteúdo suspeito/);
  assert.match(texto, /\*Link:\* https:\/\/exemplo\.com\/boato/);
  assert.match(texto, /\*Mensagem:\* Recebi no grupo da família/);
});

test('link e mensagem são opcionais', async () => {
  const body = await (await enviar({ nome: 'João', motivo: 'Dúvida' })).json();
  const texto = decodeURIComponent(body.url.split('?text=')[1]);
  assert.ok(!texto.includes('Link:'));
  assert.ok(!texto.includes('Mensagem:'));
});

test('lista de motivos', async () => {
  const body = await (await fetch(`${base}/api/whatsapp/motivos`)).json();
  assert.ok(body.motivos.includes('Dúvida'));
});

test('validações → 400', async () => {
  assert.equal((await enviar({ nome: 'M', motivo: 'Dúvida' })).status, 400);
  assert.equal((await enviar({ nome: 'Maria', motivo: 'Qualquer' })).status, 400);
  assert.equal((await enviar({ nome: 'Maria', motivo: 'Dúvida', link: 'javascript:alert(1)' })).status, 400);
  assert.equal((await enviar({ nome: 'Maria', motivo: 'Dúvida', mensagem: 'x'.repeat(501) })).status, 400);
});

test('sem número configurado → 503', async () => {
  delete process.env.WHATSAPP_NUMERO;
  assert.equal((await enviar({ nome: 'Maria', motivo: 'Dúvida' })).status, 503);
});
