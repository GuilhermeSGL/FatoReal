#!/usr/bin/env node
/**
 * Tira prints das telas principais (computador, modo claro e escuro) e aponta problemas:
 * erros de JavaScript, rolagem lateral no celular e imagens quebradas.
 *
 * Uso (com o site rodando, ex.: npx ng serve --port 4300):
 *   node scripts/preview/capturas.cjs --saida /pasta/prints [--base http://localhost:4300] [--so perfil-politico,congresso] [--mock] [--celular]
 *
 * --celular  também tira prints no tamanho de celular (por enquanto o foco é o computador).
 * --mock  responde as APIs da Câmara/Senado com dados fictícios (para ambientes sem acesso a elas).
 * Precisa do Playwright (npm i -D playwright, ou um já instalado na máquina).
 */
const path = require('path');
const fs = require('fs');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, l) => (a.startsWith('--') ? [...acc, [a.slice(2), l[i + 1] && !l[i + 1].startsWith('--') ? l[i + 1] : true]] : acc), []),
);
const base = args.base || 'http://localhost:4300';
const saida = path.resolve(args.saida || 'prints');
const so = typeof args.so === 'string' ? args.so.split(',') : null;
fs.mkdirSync(saida, { recursive: true });

let chromium, devices;
try {
  ({ chromium, devices } = require('playwright'));
} catch {
  console.error('Playwright não encontrado. Instale com: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}
const { instalar, deps } = require('./mocks.cjs');

const USUARIO = {
  id: 'demo-captura', email: 'demo@fatoreal.app', nome: 'Pessoa de Teste', moderador: false, criado_em: '2026-09-01T12:00:00Z',
  bio: 'Perfil de teste para as capturas de tela.', profissao: 'Estudante', cidade: 'Recife', uf: 'PE', interesses: ['Política', 'Educação'],
  redes: { instagram: '@fatoreal', whatsapp: '(81) 99999-0000' },
};

const TELAS = [
  { nome: 'inicio', rota: '/' },
  { nome: 'candidatos', rota: '/politicos' },
  { nome: 'perfil-politico', rota: `/politicos/${deps[0].id}`, espera: 3500 },
  { nome: 'congresso', rota: '/congresso', espera: 2500 },
  { nome: 'fato-ou-fake', rota: '/fato-ou-fake' },
  { nome: 'comunidades', rota: '/comunidades' },
  { nome: 'meu-perfil', rota: '/perfil', logado: true },
  { nome: 'base-politica', rota: '/base-da-politica' },
].filter((t) => !so || so.includes(t.nome));

const MODOS = [
  { nome: 'claro', tema: 'claro', opcoes: { viewport: { width: 1440, height: 900 } } },
  { nome: 'escuro', tema: 'escuro', opcoes: { viewport: { width: 1440, height: 900 } } },
  ...(args.celular ? [{ nome: 'celular', tema: 'claro', opcoes: devices['iPhone 13'] }] : []),
];

(async () => {
  const navegador = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const relatorio = [];
  for (const modo of MODOS) {
    for (const tela of TELAS) {
      const pagina = await navegador.newPage(modo.opcoes);
      const problemas = [];
      pagina.on('pageerror', (e) => problemas.push('Erro JS: ' + e.message));
      if (args.mock) await instalar(pagina);
      await pagina.addInitScript(([tema, usuario]) => {
        localStorage.setItem('fatoreal-boas-vindas-v1', '1');
        localStorage.setItem('fatoreal-tema', tema);
        sessionStorage.setItem('fatoreal-dica-bot', '1');
        if (usuario) localStorage.setItem('fatoreal-demo:usuario', usuario);
      }, [modo.tema, tela.logado ? JSON.stringify(USUARIO) : null]);
      try {
        await pagina.goto(base + tela.rota, { waitUntil: 'networkidle', timeout: 30000 });
      } catch {
        await pagina.goto(base + tela.rota).catch(() => problemas.push('Página não abriu'));
      }
      await pagina.waitForTimeout(tela.espera || 1500);
      const checagem = await pagina.evaluate(() => ({
        rolagemLateral: document.documentElement.scrollWidth - window.innerWidth,
        imagensQuebradas: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:')).map((i) => i.src).slice(0, 5),
      }));
      if (checagem.rolagemLateral > 2) problemas.push(`Rolagem lateral de ${checagem.rolagemLateral}px`);
      for (const src of checagem.imagensQuebradas) problemas.push('Imagem quebrada: ' + src);
      const arquivo = path.join(saida, `${tela.nome}-${modo.nome}.png`);
      await pagina.screenshot({ path: arquivo, fullPage: modo.nome !== 'celular' });
      relatorio.push({ tela: tela.nome, modo: modo.nome, arquivo, problemas });
      await pagina.close();
    }
  }
  await navegador.close();
  fs.writeFileSync(path.join(saida, 'relatorio.json'), JSON.stringify(relatorio, null, 2));
  const comProblema = relatorio.filter((r) => r.problemas.length);
  console.log(`${relatorio.length} capturas em ${saida}`);
  for (const r of comProblema) console.log(`⚠ ${r.tela} (${r.modo}): ${r.problemas.join(' | ')}`);
  if (!comProblema.length) console.log('Nenhum problema encontrado.');
})();
