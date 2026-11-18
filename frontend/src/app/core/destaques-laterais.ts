/**
 * Conteúdos do espaço dinâmico no canto inferior esquerdo (menu lateral).
 * Eles se alternam sozinhos. Para trocar, edite esta lista (no futuro, pode vir de uma tabela "destaques" no Supabase).
 * Regra: nada de informação sem fonte. Campanhas e comunicados do próprio projeto.
 */
export interface DestaqueLateral {
  tipo: 'Projeto' | 'Campanha' | 'Comunicado' | 'Dica';
  titulo: string;
  texto?: string;
  imagem?: string;
  icone?: string;
  cor: string;
  rota: string;
  acao: string;
}

export const DESTAQUES_LATERAIS: DestaqueLateral[] = [
  { tipo: 'Projeto', titulo: 'Juntos por um Brasil mais informado!', imagem: 'img/brasil-juntos.svg', cor: '#ffc21a', rota: '/sobre', acao: 'Conheça o Fato Real' },
  { tipo: 'Campanha', titulo: 'Recebeu uma mensagem suspeita?', texto: 'Verifique antes de compartilhar. Leva menos de um minuto.', icone: 'fact_check', cor: '#16a34a', rota: '/fato-ou-fake', acao: 'Verificar agora' },
  { tipo: 'Comunicado', titulo: 'Toda informação aqui tem fonte', texto: 'Dados oficiais da Câmara, do Senado e do TSE, com data da consulta.', icone: 'verified', cor: '#2563eb', rota: '/sobre', acao: 'Como verificamos' },
  { tipo: 'Dica', titulo: 'Quem representa você?', texto: 'Veja deputados e senadores do seu estado e como eles votam.', icone: 'how_to_vote', cor: '#7c4dff', rota: '/politicos', acao: 'Ver políticos' },
];
