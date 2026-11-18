---
name: revisar-tela
description: Revisão visual de uma tela do Fato Real no modo claro e escuro, procurando texto cortado, contraste ruim, elementos desalinhados, informação sem fonte e fuga do visual combinado. Use quando pedirem para revisar, refinar ou "deixar mais bonita/elegante" uma tela.
---

# /revisar-tela <nome-da-tela>

1. Rode as capturas só dessa tela: `node scripts/preview/capturas.cjs --saida <pasta> --mock --so <nome>` (com `npx ng serve --port 4300` rodando).
2. Abra os prints (claro e escuro) e avalie, nesta ordem:
   - **Clareza para todas as idades:** dá para entender em 5 segundos onde está cada informação? Títulos com ícone, textos curtos, nada de jargão técnico.
   - **Visual combinado** (ver CLAUDE.md): selos de status do `selo-status.ts`, ícones em quadradinho, cartões com título; no escuro, azul-marinho + verde-limão.
   - **Problemas:** texto cortado ou sobreposto, contraste baixo (principalmente no escuro), botões desalinhados, espaços estranhos, ícones faltando.
   - **Conteúdo:** algum número, nome ou notícia sem fonte? Algo inventado? (Proibido.)
3. Liste o que encontrou em ordem de importância, corrija o que for claramente problema, e rode as capturas de novo para comparar antes/depois.
4. Mostre ao Luiz os prints de depois e um resumo curto do que mudou.
