import { Router } from 'express';

const router = Router();

// Formulário do botão de WhatsApp (RF15): o usuário preenche nome, motivo e,
// se quiser, o link suspeito. A API valida e devolve o link wa.me com a mensagem
// pronta. Nada é guardado (LGPD): os dados só vão na mensagem que a pessoa envia.
//
// O número de atendimento fica em WHATSAPP_NUMERO (no .env / na Vercel),
// com código do país e DDD, só números. Ex.: 5561999999999
export const MOTIVOS = ['Denunciar conteúdo suspeito', 'Dúvida', 'Sugestão', 'Problema no site', 'Outro'];

const limpar = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

// GET /api/whatsapp/motivos → lista para o <select> do formulário
router.get('/motivos', (req, res) => res.json({ motivos: MOTIVOS }));

// POST /api/whatsapp  body: { nome, motivo, link?, mensagem? }
router.post('/', (req, res) => {
  const numero = String(process.env.WHATSAPP_NUMERO ?? '').replace(/\D/g, '');
  if (numero.length < 12 || numero.length > 13) {
    console.error('WhatsApp: WHATSAPP_NUMERO não configurado ou inválido');
    return res.status(503).json({ erro: 'O atendimento por WhatsApp não está configurado.' });
  }

  const nome = limpar(req.body?.nome);
  const motivo = limpar(req.body?.motivo);
  const link = limpar(req.body?.link);
  const mensagem = typeof req.body?.mensagem === 'string' ? req.body.mensagem.trim() : '';

  if (nome.length < 2 || nome.length > 80) {
    return res.status(400).json({ erro: 'Informe seu nome (2 a 80 caracteres).' });
  }
  if (!MOTIVOS.includes(motivo)) {
    return res.status(400).json({ erro: 'Escolha um motivo da lista.', motivos: MOTIVOS });
  }
  if (link && (!/^https?:\/\/\S+$/i.test(link) || link.length > 500)) {
    return res.status(400).json({ erro: 'O link deve começar com http:// ou https://' });
  }
  if (mensagem.length > 500) {
    return res.status(400).json({ erro: 'A mensagem pode ter no máximo 500 caracteres.' });
  }

  const texto = [
    '*FATO REAL — Atendimento*',
    `*Nome:* ${nome}`,
    `*Motivo:* ${motivo}`,
    link ? `*Link:* ${link}` : null,
    mensagem ? `*Mensagem:* ${mensagem}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  res.json({ url: `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, texto });
});

export default router;
