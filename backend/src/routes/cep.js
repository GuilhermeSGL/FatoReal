import { Router } from 'express';
import { normalizarCep, consultarCep, CepError } from '../services/cep.js';
import { listarDeputados } from '../services/camara.js';

const router = Router();

// GET /api/cep/01310100
// Endereço automático (RF07) + deputados federais do estado (regionalização).
// Use ?politicos=0 para receber só o endereço (mais rápido).
router.get('/:cep', async (req, res, next) => {
  try {
    const cep = normalizarCep(req.params.cep);
    if (!cep) return res.status(400).json({ erro: 'CEP inválido: informe 8 números.' });

    const endereco = await consultarCep(cep);
    if (req.query.politicos === '0') return res.json({ endereco });

    // A lista de deputados é um extra: se a Câmara falhar, o endereço ainda volta.
    let deputados = null;
    try {
      const { dados, fonte } = await listarDeputados();
      deputados = {
        uf: endereco.uf,
        total: 0,
        dados: dados.filter((d) => d.uf === endereco.uf),
        fonte,
      };
      deputados.total = deputados.dados.length;
    } catch (err) {
      console.error('CEP: não foi possível listar os deputados do estado', err.message);
    }

    res.json({ endereco, deputados });
  } catch (err) {
    if (err instanceof CepError && err.status === 404) {
      return res.status(404).json({ erro: 'CEP não encontrado.' });
    }
    if (err instanceof CepError) {
      console.error(err.message);
      return res.status(502).json({ erro: 'O serviço de CEP não respondeu. Tente de novo em instantes.' });
    }
    next(err);
  }
});

export default router;
