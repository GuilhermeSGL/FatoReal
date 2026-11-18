---
name: subir
description: Confere o build e salva o trabalho no GitHub (commit + push na branch luiz/frontend), com mensagem em português. Use quando pedirem "sobe no git", "salva", "manda pro GitHub".
---

# /subir — salvar no GitHub

1. Confirme que está na branch `luiz/frontend` (`git branch --show-current`). Se não estiver, pare e pergunte.
2. `cd frontend && npx ng build` — só continue se compilar sem erro.
3. `git status` — confira que só entram arquivos do trabalho (nada de `.env`, `environment.ts` com chaves, `node_modules`, `dist`).
4. Commit com mensagem em português: título curto e uma lista do que mudou, do ponto de vista de quem usa o site.
5. `git push -u origin luiz/frontend` (se a rede falhar, tente de novo algumas vezes).
6. Responda ao Luiz com o que foi salvo e como atualizar no computador dele:
   na pasta `FatoReal-turma`: `git pull`, depois `cd frontend` e `npm start`.
