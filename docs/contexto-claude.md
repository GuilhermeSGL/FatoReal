# Contexto para o Claude (retomar o trabalho)

> Em uma conversa nova, peça: **"leia o arquivo docs/contexto-claude.md do repositório"**.
> As regras de trabalho e o visual combinado ficam no `CLAUDE.md` da raiz.
> Atualizado em 18/11/2026.

## O projeto
- **Fato Real**: rede social de informação cívica (PI do Senac, turma DS 2025). O que vale é o **Trello** "PI Senac - FATO REAL", que é o que o professor pediu.
- **Tecnologias:** Angular 22 (pasta `frontend/`), Supabase (banco e login), API em Node/Express (pasta `backend/`, na branch `joao/backend`), hospedagem na Vercel.
- **Entrega final:** 1º/12/2026. Código congelado em 28/11.
- **Equipe:** Luiz Gustavo (GitHub `Liipez`) cuida do **front-end**. João cuida do **back-end**. Coordenador: Guilherme. Vice: Pablo.

## GitHub
- **Repositório oficial:** `SenacDS2025-PI/FatoReal` (https://github.com/SenacDS2025-PI/FatoReal).
- O repositório antigo (`matheussss237/FatoReal`) **não recebe mais trabalho**.
- **Branch do front:** `luiz/frontend`. Ao terminar cada pedido: commit + push nela.
- **Não fazer sem o Luiz pedir:** force-push, mexer na `main` ou nas branches dos outros, abrir Pull Request.

### Branches (situação em 18/11/2026)
| Branch | Para que serve | Último commit |
|---|---|---|
| `main` | versão principal | 11/11 — Supabase: tabela seguidores, campos do perfil e busca de políticos ao vivo |
| `luiz/frontend` | trabalho do front (Luiz) | 18/11 — Memória do projeto e skills para o Claude |
| `luiz-gustavo` | branch antiga do front (parou no `89d4611`) | 10/11 — Deixa a branch só com o front |
| `joao/backend` | API em Node, testes, guia do Supabase | 17/11 — Supabase: guia de ambientes (dev e prod) e cadastro na Vercel |
| `integracao` | junção do front com o back | 11/11 — Merge de `luiz/frontend` em `integracao` |
| `deploy-vercel` | configuração do deploy | 11/11 — Vercel: site (Angular) e API (Express) no mesmo projeto |
| `backup/matheus-2026-11-17` | cópia de segurança | 11/11 — Revisão do front e do banco para o Supabase de verdade |

Em 18/11 a `luiz/frontend` tinha 25 commits que a `main` não tem, e a `main` tinha 14 que a `luiz/frontend` não tem.

## O que já está pronto no front
- **Visual dos slides:** modo claro verde; modo escuro azul-marinho com cartões de "vidro" e destaques verde-limão. Selos de status padronizados (`shared/selo-status.ts`), ícones em quadradinhos coloridos.
- **Topo:** logo, busca com sugestões, sino de notificações, botão de tema, engrenagem e foto com menu.
- **Menu lateral** com "Meu perfil" e cartão do perfil no topo. O **FatoBot** é uma bolinha flutuante (`shared/fatobot-bolha.ts`).
- **Telas:**
  - Início: meus representantes, Fato do dia, termômetro de fake news, enquetes e feed.
  - Candidatos: busca com índice A–Z, mapa do Brasil, seguir, comparar dois deputados, ranking de gastos e de presença.
  - Perfil do político (formato do slide 10): resumo do mandato, projetos, votações, gastos, discursos, carreira, pontos de atenção e polêmicas **só com fonte oficial**.
  - Congresso, Notícias (carrossel), Base da Política (glossário e como uma lei nasce), Fato ou Fake junto com Verificar, Comunidades, Mensagens, Notificações, Configurações.
  - Conta: entrar, cadastrar, recuperar senha e perfil da pessoa no estilo Orkut + LinkedIn (com página de edição).
  - Institucionais: sobre, regras, termos, privacidade e contato.
- **Modo demonstração:** sem Supabase configurado, tudo funciona com dados no navegador (localStorage). Pessoas e mensagens de exemplo levam "(exemplo)" no nome.
- **Dados públicos:** APIs da Câmara e do Senado. Elas bloqueiam acesso de fora do Brasil; em servidor na nuvem, testar com `--mock` (`frontend/scripts/preview/mocks.cjs`).

## Como rodar
1. `cd frontend`
2. `npm ci` (só na primeira vez)
3. `npm start` e abrir http://localhost:4200
4. Para conferir o build: `npm run build` (em 18/11 passou sem erros nem avisos).

No Windows, o PowerShell precisou de `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. Não usar o Live Server ("Go Live"): ele não monta o Angular.

## Skills do Claude (pasta `.claude/skills/`)
- `/preview` — compila, tira prints (claro e escuro) e publica o preview.
- `/revisar-tela <tela>` — revisão visual de uma tela.
- `/subir` — confere o build e faz commit + push na `luiz/frontend`.

## Pendências
- Ligar o Supabase de verdade (URL e chave `anon` em `frontend/.env` e na Vercel). Modelo do arquivo: `frontend/.env.exemplo`. **Chaves e senhas nunca vão para o repositório.**
- Juntar o front com a API do João (`POST /api/fatobot` e `POST /api/verificar`, contratos em `frontend/README.md`), que está na `joao/backend`.
- Deploy na Vercel (configuração na branch `deploy-vercel`).
- Trocar o e-mail de contato provisório (`contato.fatoreal@exemplo.com`) em `frontend/src/app/pages/institucional/institucional.ts`.
- Avisar o coordenador que Notícias, Base da Política, Verificar, Mensagens e Notificações (antes "fora do piloto" no Trello) entraram no site.
