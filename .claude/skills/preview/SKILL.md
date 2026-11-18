---
name: preview
description: Compila o front-end do Fato Real, tira prints das telas principais (modo claro e escuro), checa problemas e mostra o resultado para o Luiz. Use depois de qualquer mudança visual ou quando pedirem "pré-visualizar", "me mostra como ficou" ou "atualiza o link".
---

# /preview — ver como ficou

Objetivo: o Luiz ver a mudança funcionando sem precisar rodar nada no computador dele.

1. **Compilar** em `frontend/`: `npx ng build`. Se der erro, corrija antes de seguir (não mostre preview quebrado).
2. **Subir o site para teste:** `npx ng serve --port 4300` em segundo plano e espere aparecer `Local:` no log.
3. **Capturas:** `node scripts/preview/capturas.cjs --saida <pasta-temporária>/capturas --mock`
   - Use `--so tela1,tela2` para só as telas mexidas (nomes: inicio, candidatos, perfil-politico, congresso, fato-ou-fake, comunidades, meu-perfil, base-politica).
   - `--celular` só se pedirem: o foco atual é o computador.
   - `--mock` é necessário em servidor fora do Brasil (as APIs da Câmara/Senado bloqueiam).
   - Leia o resumo: qualquer linha com ⚠ precisa ser resolvida ou explicada.
4. **Olhe os prints** das telas mexidas (abra as imagens) e confira se a mudança pedida aparece e nada quebrou.
5. **Publicar o preview** (se a ferramenta de Artifact estiver disponível): build com `HASH_ROUTING=true npx ng build --base-href ./ --output-path <pasta>` e publique o `index.html` com os arquivos `.js/.css` no mesmo link de sempre (remova os arquivos antigos que sumiram do build, para não estourar o limite).
6. **Mostrar ao Luiz:** mande 1 a 3 prints das telas mexidas (os mais importantes) e o link. Explique em poucas linhas, sem termos técnicos, o que mudou e onde clicar.
7. Pare o servidor de teste no final (`pkill -f "ng serve --port 4300"`).
