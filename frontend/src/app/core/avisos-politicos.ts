/** Avisos sobre os políticos que a pessoa segue: projetos novos, discursos e votos no plenário (Câmara). */
import { emLotes, votacoesNominais } from './ficha-politico';
import { jsonCamara } from './politicos.service';
import { Seguido } from './seguidos.service';

export interface AvisoPolitico { id: string; texto: string; rota: string; data: string }

const DIAS = 30;
let cache: { chave: string; em: number; dados: Promise<AvisoPolitico[]> } | null = null;

function curto(t: string, n = 90) {
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

/** Busca no máximo uma vez a cada 15 minutos (as notificações atualizam a cada troca de página). */
export function avisosDosSeguidos(seguidos: Seguido[]): Promise<AvisoPolitico[]> {
  const deputados = seguidos.filter((s) => s.casa === 'camara').slice(0, 10);
  const chave = deputados.map((d) => d.id).join(',');
  if (!deputados.length) return Promise.resolve([]);
  if (cache && cache.chave === chave && Date.now() - cache.em < 15 * 60000) return cache.dados;
  const dados = buscar(deputados).catch(() => []);
  cache = { chave, em: Date.now(), dados };
  return dados;
}

async function buscar(deputados: Seguido[]): Promise<AvisoPolitico[]> {
  const desde = new Date(Date.now() - DIAS * 86400000).toISOString().slice(0, 10);
  const porDeputado = await emLotes(deputados, 3, async (d) => {
    const rota = `/politicos/${d.id}`;
    const [props, disc] = await Promise.allSettled([
      jsonCamara<{ dados: { id: number; siglaTipo: string; numero: number; ano: number; ementa: string }[] }>(
        `/proposicoes?idDeputadoAutor=${d.id}&dataApresentacaoInicio=${desde}&siglaTipo=PL,PEC,PLP,PDL&itens=3&ordem=DESC&ordenarPor=id`,
      ),
      jsonCamara<{ dados: { dataHoraInicio: string; sumario?: string }[] }>(
        `/deputados/${d.id}/discursos?dataInicio=${desde}&ordenarPor=dataHoraInicio&ordem=DESC&itens=1`,
      ),
    ]);
    const avisos: AvisoPolitico[] = [];
    if (props.status === 'fulfilled') {
      const datas = await emLotes(props.value.dados, 3, (p) => jsonCamara<{ dados: { dataApresentacao?: string } }>(`/proposicoes/${p.id}`));
      props.value.dados.forEach((p, i) =>
        avisos.push({
          id: `pp-${p.id}`,
          texto: `${d.nome} apresentou o ${p.siglaTipo} ${p.numero}/${p.ano}: “${curto(p.ementa)}”`,
          rota,
          data: datas[i]?.dados.dataApresentacao ?? new Date(Date.now() - DIAS * 86400000).toISOString(),
        }),
      );
    }
    if (disc.status === 'fulfilled' && disc.value.dados[0]) {
      const x = disc.value.dados[0];
      avisos.push({ id: `pd-${d.id}-${x.dataHoraInicio}`, texto: `${d.nome} discursou na Câmara${x.sumario ? `: “${curto(x.sumario)}”` : ''}`, rota, data: x.dataHoraInicio });
    }
    return avisos;
  });

  // Votos nas 3 votações mais recentes do plenário
  const votos: AvisoPolitico[] = [];
  try {
    const nominais = (await votacoesNominais()).slice(0, 3);
    for (const { v, votos: lista } of nominais) {
      for (const d of deputados) {
        const meu = lista.find((x) => x.deputado_?.id === d.id);
        const sobre = v.proposicaoObjeto ? `no ${v.proposicaoObjeto}` : 'numa votação do plenário';
        votos.push({
          id: `pv-${v.id}-${d.id}`,
          texto: meu ? `${d.nome} votou “${meu.tipoVoto}” ${sobre}` : `${d.nome} não votou ${sobre}`,
          rota: `/politicos/${d.id}`,
          data: v.dataHoraRegistro ?? v.data ?? new Date().toISOString(),
        });
      }
    }
  } catch {
    /* sem votações agora */
  }
  return [...porDeputado.flatMap((x) => x ?? []), ...votos];
}
