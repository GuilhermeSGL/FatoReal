// Termos do glossário (Base da Política e "Fato do dia" na página inicial).

export interface Termo {
  termo: string;
  categoria: string;
  icone: string;
  definicao: string;
  /** Exemplo concreto, para a ideia ficar clara. */
  exemplo: string;
}

export const GLOSSARIO: Termo[] = [
  { termo: 'Projeto de lei (PL)', categoria: 'Leis', icone: 'description',
    definicao: 'Proposta de nova lei ou de mudança em uma lei existente.',
    exemplo: 'O texto passa por comissões e pelo plenário da Câmara e do Senado antes de ir para sanção.' },
  { termo: 'PEC', categoria: 'Leis', icone: 'menu_book',
    definicao: 'Proposta de Emenda à Constituição. Precisa ser aprovada em dois turnos em cada Casa, por três quintos dos votos.',
    exemplo: 'Mudar algo escrito na Constituição, como regras de aposentadoria, exige uma PEC.' },
  { termo: 'Lei complementar', categoria: 'Leis', icone: 'library_books',
    definicao: 'Lei que regulamenta assuntos que a Constituição manda tratar dessa forma. Precisa de maioria absoluta.',
    exemplo: 'A Lei de Responsabilidade Fiscal (LC 101/2000) é uma lei complementar.' },
  { termo: 'Medida provisória', categoria: 'Executivo', icone: 'bolt',
    definicao: 'Ato do presidente com força de lei imediata, em casos de relevância e urgência.',
    exemplo: 'Vale assim que é publicada, mas perde a validade se o Congresso não aprovar em até 60 dias, prorrogáveis por mais 60.' },
  { termo: 'Sanção e veto', categoria: 'Executivo', icone: 'approval',
    definicao: 'Sanção é a aprovação de um projeto pelo chefe do Executivo; veto é a recusa, total ou parcial.',
    exemplo: 'Depois que o Congresso aprova um projeto, o presidente tem 15 dias úteis para sancionar ou vetar.' },
  { termo: 'Plenário', categoria: 'Congresso', icone: 'groups',
    definicao: 'Reunião de todos os parlamentares de uma Casa para votar.',
    exemplo: 'É no plenário que acontece a votação final de um projeto na Câmara ou no Senado.' },
  { termo: 'Comissão', categoria: 'Congresso', icone: 'diversity_3',
    definicao: 'Grupo menor de parlamentares que analisa projetos sobre um tema antes do plenário.',
    exemplo: 'Um projeto sobre escolas costuma passar pela Comissão de Educação.' },
  { termo: 'CPI', categoria: 'Congresso', icone: 'manage_search',
    definicao: 'Comissão Parlamentar de Inquérito. Investiga um fato determinado, por prazo certo; é criada com a assinatura de um terço da Casa.',
    exemplo: 'Pode convocar pessoas para depor e pedir quebra de sigilos, mas não julga nem condena ninguém.' },
  { termo: 'Quórum', categoria: 'Congresso', icone: 'how_to_reg',
    definicao: 'Número mínimo de parlamentares presentes, ou de votos, para abrir uma votação ou aprovar uma proposta.',
    exemplo: 'Uma PEC precisa de três quintos dos votos: 308 dos 513 deputados.' },
  { termo: 'Legislatura', categoria: 'Congresso', icone: 'calendar_month',
    definicao: 'Período de quatro anos de trabalho do Congresso, igual ao mandato dos deputados federais.',
    exemplo: 'A legislatura atual começou em fevereiro de 2023 e vai até janeiro de 2027.' },
  { termo: 'Emenda parlamentar', categoria: 'Orçamento', icone: 'payments',
    definicao: 'Indicação feita por deputados e senadores de onde aplicar uma parte do Orçamento federal.',
    exemplo: 'Um deputado pode indicar verba para uma obra ou um serviço de saúde na sua região.' },
  { termo: 'Cota parlamentar', categoria: 'Orçamento', icone: 'receipt_long',
    definicao: 'Verba para despesas do mandato, como passagens, combustível e divulgação. Os gastos são públicos.',
    exemplo: 'No perfil de cada deputado, aqui no Fato Real, dá para ver esses gastos por categoria.' },
  { termo: 'Federação partidária', categoria: 'Partidos', icone: 'handshake',
    definicao: 'União de partidos que atuam juntos, como se fossem um só, por pelo menos quatro anos.',
    exemplo: 'Partidos federados disputam as eleições juntos e atuam como um bloco no Congresso.' },
];

/** Termo do dia: muda à meia-noite e passa por todos os termos. */
export function termoDoDia(data = new Date()): Termo {
  const inicio = new Date(data.getFullYear(), 0, 0).getTime();
  const dia = Math.floor((data.getTime() - inicio) / 86_400_000);
  return GLOSSARIO[dia % GLOSSARIO.length];
}
