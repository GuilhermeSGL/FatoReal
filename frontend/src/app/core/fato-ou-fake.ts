/** Afirmações para o jogo "Fato ou Fake". Todas conferidas na Constituição, em leis ou no TSE. */
export interface Afirmacao {
  id: number;
  texto: string;
  fato: boolean;
  explicacao: string;
  fonte: { titulo: string; url: string };
}

const CF = { titulo: 'Constituição Federal (Planalto)', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' };

export const AFIRMACOES: Afirmacao[] = [
  { id: 1, texto: 'O voto é obrigatório para quem tem entre 18 e 70 anos.', fato: true,
    explicacao: 'A Constituição diz que votar é obrigatório para maiores de 18 anos e opcional para quem tem 16 ou 17 anos, mais de 70 anos ou é analfabeto (art. 14, § 1º).', fonte: CF },
  { id: 2, texto: 'O mandato de um senador dura 4 anos.', fato: false,
    explicacao: 'O mandato de senador é de 8 anos. Cada estado elege 3 senadores, renovados alternadamente: um terço numa eleição e dois terços na seguinte (art. 46).', fonte: CF },
  { id: 3, texto: 'A Câmara dos Deputados tem 513 deputados federais.', fato: true,
    explicacao: 'São 513 deputados, divididos entre os estados de acordo com a população. Cada estado tem no mínimo 8 e no máximo 70.',
    fonte: { titulo: 'Lei Complementar 78/1993 (Planalto)', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp78.htm' } },
  { id: 4, texto: 'Se mais da metade dos votos forem nulos, a eleição é cancelada.', fato: false,
    explicacao: 'Boato antigo. Votos nulos e brancos não entram na conta dos votos válidos. A eleição só é anulada quando votos são anulados pela Justiça por fraude, e não por eleitores que votaram nulo.',
    fonte: { titulo: 'Código Eleitoral, art. 224 (Planalto)', url: 'https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm' } },
  { id: 5, texto: 'Para ser deputado federal é preciso ter pelo menos 25 anos.', fato: false,
    explicacao: 'A idade mínima para deputado federal é 21 anos. 35 anos é para presidente e senador, 30 para governador e 18 para vereador (art. 14, § 3º).', fonte: CF },
  { id: 6, texto: 'O presidente pode ser reeleito quantas vezes quiser, desde que ganhe a eleição.', fato: false,
    explicacao: 'O presidente pode ser reeleito só uma vez seguida. Depois de dois mandatos consecutivos, precisa esperar um mandato para concorrer de novo (art. 14, § 5º).', fonte: CF },
  { id: 7, texto: 'A urna eletrônica fica conectada à internet durante a votação.', fato: false,
    explicacao: 'A urna eletrônica não tem nenhuma conexão com a internet, nem por cabo nem sem fio. Os votos são gravados nela e somados depois.',
    fonte: { titulo: 'TSE: urna eletrônica', url: 'https://www.tse.jus.br/eleicoes/urna-eletronica' } },
  { id: 8, texto: 'Os cidadãos podem apresentar um projeto de lei diretamente à Câmara.', fato: true,
    explicacao: 'É a iniciativa popular: o projeto precisa da assinatura de pelo menos 1% dos eleitores do país, espalhados por pelo menos 5 estados (art. 61, § 2º). A Lei da Ficha Limpa nasceu assim.', fonte: CF },
  { id: 9, texto: 'Para mudar a Constituição, basta a maioria simples dos deputados.', fato: false,
    explicacao: 'Uma PEC precisa de 3/5 dos votos (308 deputados e 49 senadores), em dois turnos em cada Casa (art. 60, § 2º).', fonte: CF },
  { id: 10, texto: 'Quem é condenado por um tribunal (órgão colegiado) por certos crimes fica inelegível, mesmo antes do fim do processo.', fato: true,
    explicacao: 'É a Lei da Ficha Limpa: condenação por órgão colegiado em crimes como corrupção e lavagem de dinheiro deixa a pessoa inelegível, mesmo cabendo recurso.',
    fonte: { titulo: 'Lei Complementar 135/2010 (Planalto)', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp135.htm' } },
  { id: 11, texto: 'Jovens de 16 anos podem votar.', fato: true,
    explicacao: 'Sim. Para quem tem 16 ou 17 anos o voto é facultativo: pode tirar o título e votar se quiser (art. 14, § 1º, II, c).', fonte: CF },
  { id: 12, texto: 'A idade mínima para ser presidente da República é 35 anos.', fato: true,
    explicacao: 'Para presidente, vice-presidente e senador, a idade mínima é 35 anos (art. 14, § 3º, VI, a).', fonte: CF },
  { id: 13, texto: 'Deputados e senadores podem ser presos em qualquer situação, como qualquer cidadão.', fato: false,
    explicacao: 'Desde a diplomação, parlamentares só podem ser presos em flagrante de crime inafiançável. Nesse caso, a Casa decide em 24 horas se mantém a prisão (art. 53, § 2º).', fonte: CF },
  { id: 14, texto: 'O voto no Brasil é secreto.', fato: true,
    explicacao: 'O voto direto e secreto é cláusula pétrea: não pode ser abolido nem por emenda constitucional (art. 14 e art. 60, § 4º, II).', fonte: CF },
  { id: 15, texto: 'O presidente pode criar leis sozinho por decreto, sem passar pelo Congresso.', fato: false,
    explicacao: 'O presidente pode editar medidas provisórias, que valem na hora, mas perdem efeito se o Congresso não as aprovar em até 120 dias (art. 62). Decretos comuns só regulamentam leis que já existem.', fonte: CF },
];

/** Número da semana do ano (as perguntas mudam toda segunda-feira). */
export function semanaDoAno(d = new Date()): number {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dia = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - dia);
  const inicio = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x.getTime() - inicio.getTime()) / 86400000 + 1) / 7);
}

/** 5 afirmações da semana, sempre as mesmas para todo mundo durante a semana. */
export function rodadaDaSemana(semana = semanaDoAno()): Afirmacao[] {
  const n = AFIRMACOES.length;
  const passo = 7; // primo com 15: percorre todas antes de repetir
  return Array.from({ length: 5 }, (_, i) => AFIRMACOES[(semana * 5 + i) * passo % n]);
}
