// J1 — Atualiza a cópia de reserva dos deputados: src/data/deputados.json
//
// Uso (na pasta backend):  npm run atualizar-deputados
//
// A API usa essa cópia quando a Câmara não responde, mostrando a data da coleta como fonte.
// Rode antes da apresentação e faça commit do arquivo gerado. Não precisa de nenhuma chave.
import { writeFileSync } from 'node:fs';
import { CAMARA_API } from '../src/services/camara-fonte.js';

const ARQUIVO = new URL('../src/data/deputados.json', import.meta.url);
const TENTATIVAS = 4;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Aqui não há pressa: tenta várias vezes, com espera crescente.
async function buscar(caminho) {
  for (let t = 1; ; t++) {
    try {
      const res = await fetch(`${CAMARA_API}${caminho}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`Câmara respondeu ${res.status}`);
      return await res.json();
    } catch (err) {
      if (t >= TENTATIVAS) throw err;
      console.log(`  tentativa ${t} falhou (${err.message}), tentando de novo...`);
      await esperar(3000 * t);
    }
  }
}

async function main() {
  console.log('Buscando a lista de deputados em exercício na Câmara...');
  const porId = new Map();
  for (let pagina = 1; ; pagina++) {
    const json = await buscar(`/deputados?ordem=ASC&ordenarPor=nome&itens=100&pagina=${pagina}`);
    for (const d of json.dados) {
      porId.set(d.id, { id: d.id, nome: d.nome, partido: d.siglaPartido, uf: d.siglaUf, foto: d.urlFoto });
    }
    console.log(`  página ${pagina}: ${porId.size} deputados até agora`);
    if (!json.links?.some((l) => l.rel === 'next') || json.dados.length === 0) break;
  }

  if (porId.size < 400) {
    throw new Error(`Só ${porId.size} deputados: a Câmara deve estar com problema. Arquivo NÃO alterado.`);
  }

  const dados = [...porId.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const copia = {
    descricao: 'Cópia de reserva da lista de deputados em exercício. Gerada por npm run atualizar-deputados.',
    fonte: `${CAMARA_API}/deputados`,
    coletadoEm: new Date().toISOString(),
    total: dados.length,
    dados,
  };

  // Um deputado por linha: fica fácil de ver o que mudou no GitHub.
  const linhas = dados.map((d) => '    ' + JSON.stringify(d)).join(',\n');
  const { dados: _, ...cabecalho } = copia;
  const corpo = JSON.stringify(cabecalho, null, 2).replace(/\n}$/, `,\n  "dados": [\n${linhas}\n  ]\n}\n`);
  JSON.parse(corpo); // garante que o arquivo é um JSON válido
  writeFileSync(ARQUIVO, corpo);

  console.log(`✅ ${dados.length} deputados salvos em src/data/deputados.json (coleta: ${copia.coletadoEm}).`);
  console.log('   Faça commit desse arquivo para a cópia ir junto com o código.');
}

main().catch((err) => {
  console.error('❌ Falhou:', err.message);
  process.exit(1);
});
