// J2 — tempo de resposta: a pergunta termina em até ~25 s no pior caso
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITES } from '../src/services/camara.js';
import { LIMITES_IA } from '../src/services/gemini.js';
import { LIMITES_FATOBOT } from '../src/services/fatobot.js';
import { iniciar, mockCamara, mockGemini, perguntar } from './ajuda.js';

test('J2: as contas do pior caso fecham em até 25 s', () => {
  // Lista: Supabase + Câmara. Perfil: Câmara + Supabase. Gemini: só o que sobrar do total.
  const piorFontes = 2 * (LIMITES.supabaseMs + LIMITES.camaraMs);
  assert.ok(LIMITES_FATOBOT.totalMs <= 25_000, 'prazo total acima de 25 s');
  assert.ok(piorFontes + LIMITES_IA.minimoParaTentarMs <= LIMITES_FATOBOT.totalMs, 'fontes comem o prazo todo');
  assert.ok(LIMITES_IA.porModeloMs < LIMITES_FATOBOT.totalMs);
});

test('J2: com Câmara e Gemini travados, a resposta respeita o prazo (limites reduzidos)', async () => {
  const antes = { ...LIMITES, ...LIMITES_IA, totalMs: LIMITES_FATOBOT.totalMs };
  Object.assign(LIMITES, { camaraMs: 150, supabaseMs: 100 });
  Object.assign(LIMITES_IA, { porModeloMs: 300, minimoParaTentarMs: 50 });
  LIMITES_FATOBOT.totalMs = 1_000;
  process.env.GEMINI_MODEL_RESERVA = 'modelo-reserva';

  const srv = await iniciar();
  const camara = mockCamara('trava');
  const gemini = mockGemini('trava');
  try {
    const inicio = Date.now();
    const { status, body } = await perguntar(srv.base, 'Qual o partido de Tabata Amaral?');
    const duracao = Date.now() - inicio;

    assert.equal(status, 200);
    assert.ok(duracao < 1_300, `demorou ${duracao} ms (prazo: 1000 ms)`);
    assert.equal(body.modo, 'somente_fontes');
    assert.equal(body.motivo_sem_ia, 'tempo_esgotado');
    assert.match(body.fontes[0].titulo, /cópia de reserva/);
    assert.equal(gemini.length, 2, 'tentou o principal e o reserva');
  } finally {
    camara.restaurar();
    await srv.encerrar();
    delete process.env.GEMINI_MODEL_RESERVA;
    Object.assign(LIMITES, { camaraMs: antes.camaraMs, supabaseMs: antes.supabaseMs });
    Object.assign(LIMITES_IA, { porModeloMs: antes.porModeloMs, minimoParaTentarMs: antes.minimoParaTentarMs });
    LIMITES_FATOBOT.totalMs = antes.totalMs;
  }
});

test('J2: sem novas tentativas — cada página da Câmara é pedida uma vez só', async () => {
  const srv = await iniciar();
  const camara = mockCamara('fora');
  try {
    await perguntar(srv.base, 'Qual o partido de Tabata Amaral?');
    const paginas = camara.chamadas.filter((u) => u.includes('pagina='));
    const perfis = camara.chamadas.filter((u) => /\/deputados\/\d+$/.test(u));
    assert.equal(paginas.length, 6, 'as 6 páginas, em paralelo, uma vez cada');
    assert.equal(new Set(paginas).size, 6);
    assert.equal(perfis.length, 1);
  } finally {
    camara.restaurar();
    await srv.encerrar();
  }
});

test('J2: depois de uma falha, a próxima pergunta não espera a Câmara de novo (1 min)', async () => {
  const srv = await iniciar();
  const camara = mockCamara('fora');
  try {
    await perguntar(srv.base, 'oi tudo bem');
    const antes = camara.chamadas.filter((u) => u.includes('pagina=')).length;
    const { status } = await perguntar(srv.base, 'oi tudo bem');
    const depois = camara.chamadas.filter((u) => u.includes('pagina=')).length;
    assert.equal(status, 200);
    assert.equal(depois, antes, 'a segunda pergunta foi direto para a cópia');
  } finally {
    camara.restaurar();
    await srv.encerrar();
  }
});

test('J2: o prazo NÃO vai para o Google (ele recusa prazos abaixo de 10s com erro 400)', async () => {
  const srv = await iniciar();
  const camara = mockCamara('ok');
  const chamadas = mockGemini('Tabata Amaral é deputada federal pelo PSB-SP [1].');
  try {
    await perguntar(srv.base, 'Qual o partido de Tabata Amaral?');
    const { config } = chamadas[0];
    assert.equal(config.httpOptions?.timeout, undefined, 'httpOptions.timeout vira o cabeçalho X-Server-Timeout');
    assert.ok(config.abortSignal instanceof AbortSignal);
  } finally {
    camara.restaurar();
    await srv.encerrar();
  }
});
