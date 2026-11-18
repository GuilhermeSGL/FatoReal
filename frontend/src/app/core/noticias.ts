/**
 * Notícias da aba Notícias. Selecionadas pela equipe, sempre com o título original e o link para a fonte.
 * Regras: só fontes oficiais ou agências públicas; título copiado da matéria; resumo só quando alguém
 * da equipe leu a matéria (sem resumo, o site manda ler na fonte). Nada de "há X minutos" inventado.
 * Quando o back-end tiver o feed automático (GET {API_URL}/noticias), esta lista vira só reserva.
 */
export type Categoria = 'Política' | 'Eleições' | 'Economia' | 'Saúde' | 'Educação' | 'Meio ambiente' | 'Justiça' | 'Sociedade' | 'Mundo';

export interface InfoCategoria {
  nome: Categoria;
  icone: string;
  cor: string;
  /** Imagem ilustrativa do site usada quando a notícia não tem imagem própria. */
  imagem?: string;
}

export const CATEGORIAS: InfoCategoria[] = [
  { nome: 'Política', icone: 'account_balance', cor: '#7c4dff', imagem: 'img/capa-camara-e-senado-em-pauta.svg' },
  { nome: 'Eleições', icone: 'how_to_vote', cor: '#e11d48', imagem: 'img/capa-eleicoes-e-voto.svg' },
  { nome: 'Economia', icone: 'payments', cor: '#d97706', imagem: 'img/capa-contas-publicas.svg' },
  { nome: 'Saúde', icone: 'health_and_safety', cor: '#dc2626', imagem: 'img/capa-saude-publica-e-sus.svg' },
  { nome: 'Educação', icone: 'school', cor: '#16a34a', imagem: 'img/capa-juventude-e-participacao.svg' },
  { nome: 'Meio ambiente', icone: 'eco', cor: '#0891b2', imagem: 'img/capa-meio-ambiente-e-clima.svg' },
  { nome: 'Justiça', icone: 'balance', cor: '#64748b', imagem: 'img/capa-seguranca-publica.svg' },
  { nome: 'Sociedade', icone: 'diversity_3', cor: '#9333ea', imagem: 'img/capa-checagem-de-fatos.svg' },
  { nome: 'Mundo', icone: 'public', cor: '#2563eb' },
];

export function infoCategoria(c: Categoria): InfoCategoria {
  return CATEGORIAS.find((x) => x.nome === c) ?? CATEGORIAS[0];
}

export interface Noticia {
  /** Título como está na matéria original. */
  titulo: string;
  /** Uma ou duas frases fiéis à matéria, sem opinião. Opcional: sem resumo conferido, fica vazio. */
  resumo?: string;
  categoria: Categoria;
  /** Data como aparece no card (ex.: "12 nov. 2026" ou "nov. 2026" quando o dia não foi conferido). */
  data: string;
  fonte: string;
  url: string;
  /** Imagem própria da notícia. Sem ela, usa a ilustração da categoria. */
  imagem?: string;
  /** Pergunta sugerida para o FatoBot sobre o assunto. */
  pergunta?: string;
  /** Vai para o carrossel do topo. */
  destaque?: boolean;
}

/** Data em que a equipe revisou esta lista pela última vez. */
export const LISTA_ATUALIZADA_EM = '18 nov. 2026';

const AB = 'Agência Brasil';
const AC = 'Agência Câmara';
const AS = 'Agência Senado';
const RN = 'Radioagência Nacional';

export const NOTICIAS: Noticia[] = [
  {
    titulo: 'TSE multa Meta em R$ 7,5 milhões por descumprir ordens nas eleições',
    resumo:
      'Por unanimidade, o Tribunal Superior Eleitoral entendeu que a empresa respondeu de forma incompleta e com atraso a ordens sobre a distribuição de conteúdo político nas eleições de 2026. A multa não encerra o caso: o tribunal continua investigando se houve favorecimento de candidaturas.',
    categoria: 'Eleições', data: '10 nov. 2026', fonte: 'Tribunal Superior Eleitoral', destaque: true,
    url: 'https://www.tse.jus.br/comunicacao/noticias/2026/Novembro/tse-multa-facebook-em-r-7-5-milhoes-por-descumprir-determinacoes-judiciais',
    imagem: 'img/noticia-tse-meta.svg',
    pergunta: 'Que regras as plataformas digitais precisam seguir durante as eleições no Brasil?',
  },
  {
    titulo: 'Medida que amplia crédito a exportações segue para sanção',
    categoria: 'Economia', data: '17 nov. 2026', fonte: AS, destaque: true,
    url: 'https://www12.senado.leg.br/noticias/materias/2026/11/17/medida-que-amplia-credito-a-exportacoes-segue-para-sancao',
    imagem: 'img/destaque-congresso.svg',
    pergunta: 'O que significa um projeto "seguir para sanção"?',
  },
  {
    titulo: 'MEC aprova diretrizes para o uso de inteligência artificial em cada etapa da educação',
    resumo:
      'As regras, propostas pelo Conselho Nacional de Educação, tratam a IA como ferramenta de apoio que não substitui o professor. Entre os pontos estão a proibição de usar IA para corrigir redações e provas dissertativas e limites ao uso sem supervisão por crianças até o 5º ano.',
    categoria: 'Educação', data: 'nov. 2026', fonte: AB, destaque: true,
    url: 'https://agenciabrasil.ebc.com.br/educacao/noticia/2026-11/mec-aprova-diretrizes-para-uso-de-ia-em-cada-etapa-da-educacao',
    imagem: 'img/noticia-ia-educacao.svg',
    pergunta: 'O que é o Conselho Nacional de Educação e como ele define regras para as escolas?',
  },
  {
    titulo: 'Texto principal do ajuste fiscal é aprovado pelo Senado',
    categoria: 'Economia', data: '12 nov. 2026', fonte: AS, destaque: true,
    url: 'https://www12.senado.leg.br/noticias/materias/2026/11/12/texto-principal-do-ajuste-fiscal-e-aprovado-pelo-senado',
    pergunta: 'O que é um ajuste fiscal e como ele passa pelo Congresso?',
  },
  {
    titulo: 'Monitor do El Niño: apenas 284 municípios têm planos de contingência',
    resumo:
      'Levantamento mostra que só 284 cidades brasileiras têm um plano de contingência para os efeitos do El Niño, fenômeno que altera chuvas e temperaturas no país. Esse plano define áreas de risco, abrigos e rotas de evacuação antes de a emergência acontecer.',
    categoria: 'Meio ambiente', data: 'nov. 2026', fonte: AB, destaque: true,
    url: 'https://agenciabrasil.ebc.com.br/meio-ambiente/noticia/2026-11/monitor-do-el-nino-apenas-284-municipios-tem-planos-de-contingencia',
    imagem: 'img/noticia-el-nino.svg',
    pergunta: 'O que é um plano de contingência municipal e quem é responsável por ele?',
  },
  {
    titulo: 'Democratas conquistam maioria na Câmara e no Senado dos EUA',
    categoria: 'Mundo', data: 'nov. 2026', fonte: RN, destaque: true,
    url: 'https://agenciabrasil.ebc.com.br/radioagencia-nacional/internacional/audio/2026-11/democratas-conquistam-maioria-na-camara-e-no-senado-dos-eua',
    pergunta: 'Como funciona o Congresso dos Estados Unidos?',
  },
  {
    titulo: 'Senado aprova regras de qualidade e segurança para implantes cirúrgicos',
    categoria: 'Saúde', data: '17 nov. 2026', fonte: AS,
    url: 'https://www12.senado.leg.br/noticias/materias/2026/11/17/senado-aprova-regras-de-qualidade-e-seguranca-para-implantes-cirurgicos',
  },
  {
    titulo: 'Congresso aprova reforço orçamentário para ministérios e Judiciário',
    categoria: 'Economia', data: '12 nov. 2026', fonte: AS,
    url: 'https://www12.senado.leg.br/noticias/materias/2026/11/12/congresso-aprova-reforco-orcamentario-para-ministerios-e-judiciario',
    pergunta: 'O que é crédito suplementar no Orçamento?',
  },
  {
    titulo: 'Congresso aprova possibilidade de novas nomeações de servidores em 2026',
    categoria: 'Política', data: '12 nov. 2026', fonte: AS,
    url: 'https://www12.senado.leg.br/noticias/materias/2026/11/12/congresso-aprova-possibilidade-de-novas-nomeacoes-de-servidores-em-2026',
  },
  {
    titulo: 'Senado aprova proteção de recursos para internet em escolas públicas',
    categoria: 'Educação', data: '11 nov. 2026', fonte: AS,
    url: 'https://www12.senado.leg.br/noticias/materias/2026/11/11/senado-aprova-protecao-de-recursos-para-internet-em-escolas-publicas',
  },
  {
    titulo: 'Renegociação de dívidas rurais é aprovada pelo Senado e vai à sanção presidencial',
    categoria: 'Economia', data: '11 nov. 2026', fonte: AS,
    url: 'https://www12.senado.leg.br/noticias/materias/2026/11/11/renegociacao-de-dividas-rurais-e-aprovada-pelo-senado-e-vai-a-sancao-presidencial',
  },
  {
    titulo: 'Brasileiros encontram fake news com frequência, diz pesquisa',
    categoria: 'Sociedade', data: 'nov. 2026', fonte: AB,
    url: 'https://agenciabrasil.ebc.com.br/geral/noticia/2026-11/brasileiros-encontram-fake-news-com-frequencia-diz-pesquisa',
    pergunta: 'Como saber se uma notícia é falsa antes de compartilhar?',
  },
  {
    titulo: 'Câmara aprova crédito extraordinário de R$ 300 milhões para defesa civil',
    categoria: 'Política', data: 'nov. 2026', fonte: AC,
    url: 'https://www.camara.leg.br/noticias/1320344-camara-aprova-credito-extraordinario-de-r-300-milhoes-para-defesa-civil-acompanhe',
  },
  {
    titulo: 'Novo painel de dados mostra chuva abaixo da média em 70% do país',
    categoria: 'Meio ambiente', data: 'nov. 2026', fonte: AB,
    url: 'https://agenciabrasil.ebc.com.br/meio-ambiente/noticia/2026-11/novo-painel-de-dados-mostra-chuva-abaixo-da-media-em-70-do-pais',
  },
  {
    titulo: 'STF: ministro Fachin arquiva inquérito das Fake News',
    categoria: 'Justiça', data: 'nov. 2026', fonte: AB,
    url: 'https://agenciabrasil.ebc.com.br/justica/noticia/2026-11/stf-ministro-fachin-arquiva-inquerito-das-fake-news',
    pergunta: 'O que significa arquivar um inquérito no STF?',
  },
  {
    titulo: 'Comissão aprova criação de programa de atendimento domiciliar de saúde para idosos pelo SUS',
    categoria: 'Saúde', data: 'nov. 2026', fonte: AC,
    url: 'https://www.camara.leg.br/noticias/1316336-comissao-aprova-criacao-de-programa-de-atendimento-domiciliar-de-saude-para-idosos-pelo-sus',
    pergunta: 'O que acontece com um projeto depois que uma comissão aprova?',
  },
  {
    titulo: 'Derrota de Trump abre espaço para rever tarifaço, diz analista',
    categoria: 'Mundo', data: 'nov. 2026', fonte: RN,
    url: 'https://agenciabrasil.ebc.com.br/radioagencia-nacional/internacional/audio/2026-11/derrota-de-trump-abre-espaco-para-rever-tarifaco-diz-analista',
  },
  {
    titulo: 'Dino decidirá sobre ações contra fim da escala 6x1 até sexta-feira',
    categoria: 'Justiça', data: 'nov. 2026', fonte: RN,
    url: 'https://agenciabrasil.ebc.com.br/radioagencia-nacional/justica/audio/2026-11/dino-decidira-sobre-acoes-contra-fim-da-escala-6x1-ate-sexta-feira',
  },
  {
    titulo: 'Brasil avança em políticas de alimentação e clima, diz estudo',
    categoria: 'Meio ambiente', data: 'nov. 2026', fonte: AB,
    url: 'https://agenciabrasil.ebc.com.br/meio-ambiente/noticia/2026-11/brasil-avanca-em-politicas-de-alimentacao-e-clima-diz-estudo',
  },
  {
    titulo: 'Câmara aprova criação de programa para acompanhamento psicossocial de crianças e adolescentes',
    categoria: 'Sociedade', data: 'nov. 2026', fonte: AC,
    url: 'https://www.camara.leg.br/noticias/1316057-camara-aprova-criacao-de-programa-para-acompanhamento-psicossocial-de-criancas-e-adolescentes',
  },
  {
    titulo: 'Lula garante que programas sociais serão mantidos',
    categoria: 'Política', data: 'nov. 2026', fonte: AB,
    url: 'https://agenciabrasil.ebc.com.br/politica/noticia/2026-11/lula-garante-que-programas-sociais-serao-mantidos',
  },
  {
    titulo: 'Câmara de SP arquiva pedido de impeachment contra Ricardo Nunes',
    categoria: 'Política', data: 'nov. 2026', fonte: AB,
    url: 'https://agenciabrasil.ebc.com.br/politica/noticia/2026-11/camara-de-sp-arquiva-pedido-de-impeachment-contra-ricardo-nunes',
  },
  {
    titulo: 'Comissão aprova programa para ampliar ações de atividade física no SUS',
    categoria: 'Saúde', data: 'nov. 2026', fonte: AC,
    url: 'https://www.camara.leg.br/noticias/1317164-comissao-aprova-programa-para-ampliar-acoes-de-atividade-fisica-no-sus',
  },
  {
    titulo: 'TSE confirma inelegibilidade de condenado por violência contra a mulher',
    categoria: 'Eleições', data: 'out. 2026', fonte: 'Tribunal Superior Eleitoral',
    url: 'https://www.tse.jus.br/comunicacao/noticias/2026/Outubro/e-confirma-inelegibilidade-de-candidato-condenado-por-violencia-contra-a-mulher',
    pergunta: 'O que torna um candidato inelegível no Brasil?',
  },
  {
    titulo: 'TSE dá 24h para Meta e X explicarem distribuição de material político',
    categoria: 'Eleições', data: 'out. 2026', fonte: AB,
    url: 'https://agenciabrasil.ebc.com.br/justica/noticia/2026-10/tse-da-24h-para-meta-e-x-explicarem-distribuicao-de-material-politico',
  },
];

/** Mantido para quem ainda importa o nome antigo (ex.: página inicial). */
export const NOTICIAS_DESTAQUE = NOTICIAS.filter((n) => n.destaque && n.resumo);
