# Divisão do backend: João × Matheus

Objetivo: os dois trabalham ao mesmo tempo **sem conflito de código**. Para isso, cada um é
dono de arquivos diferentes e ninguém edita o arquivo do outro.

> Proposta do João (17/11). Quem decide o escopo é o coordenador (Guilherme; Pablo no período em que ele estiver fora).

## Quem é dono de quê

| | **João**: FatoBot, fontes e IA | **Matheus**: autenticação, conta e admin |
|---|---|---|
| Pastas e arquivos | `src/routes/*` · `src/services/*` · `src/data/*` · `src/utils/*` · `scripts/*` | **tudo dentro de `src/auth/`** |
| Rotas | `/api/health`, `/api/deputados`, `/api/fatobot`, `/api/verificar`, `/api/cep`, `/api/whatsapp` | `/api/auth`, `/api/conta`, `/api/admin` |
| Testes | `test/*.test.js` que já existem + novos do João | `test/auth-*.test.js` (prefixo `auth-`) |
| Documentação | `backend/README.md` | `src/auth/README.md` |
| Branch | `joao/...` | `matheus/...` |

**Pode importar, não pode editar.** O Matheus pode *usar* funções do João (ex.: `limparTextoUsuario`,
`comPrazo`), mas se precisar mudar alguma, pede para o João. O mesmo vale ao contrário.

### Arquivos compartilhados (regras)

| Arquivo | Regra |
|---|---|
| `src/app.js` | **Ninguém mexe.** A área do Matheus já está registrada (`app.use('/api', authRouter)`). Rotas novas dele entram em `src/auth/index.js`. |
| `.env.example` | Cada um edita **só o seu bloco**. O do Matheus é o último do arquivo. |
| `package.json` / `package-lock.json` | Precisou de biblioteca nova? Avise o outro no grupo. Se der conflito no `package-lock.json`, aceite qualquer lado e rode `npm install`. |

## Tarefas

### João

| # | Tarefa | Arquivos | Prazo |
|---|---|---|---|
| J10 | **Limite de uso por IP** no FatoBot e no Verificar, para proteger a cota grátis do Gemini (a partir do código do Matheus no backup, com crédito). Aplicado dentro das rotas, sem mexer no `app.js`. | `src/utils/limite.js`, `src/routes/fatobot.js`, `src/routes/verificar.js` | 20/11 |
| J11 | **Base de conhecimento da Constituição** no FatoBot ("o que são os Três Poderes?"), a partir do backup do Matheus, com crédito. | `src/data/base-conhecimento.js`, `src/services/fatobot.js` | 20/11 |
| J12 | **`/api/health` com o status das fontes** (Câmara, cópia de reserva, Supabase, Gemini), para conferir tudo antes da apresentação. | `src/routes/health.js` | 24/11 |
| J13 | **Anexos do Verificar**: aplicar a decisão do grupo (ajustar texto ou guardar para revisão humana). | `src/services/verificar.js`, `src/routes/verificar.js` | 24/11 |
| J14 | **Antes da apresentação**: `npm run atualizar-deputados`, importação no Supabase oficial e ensaio com a turma. | `src/data/deputados.json` | 27/11 |

### Matheus

| # | Tarefa | Arquivos | Prazo |
|---|---|---|---|
| M1 | **Middleware de login.** `exigirLogin`: lê `Authorization: Bearer <token>` (o token de sessão do Supabase que o front já tem), valida com `supabase.auth.getUser(token)` e coloca o usuário em `req.usuario`. Sem token ou token inválido → `401`. `exigirModerador`: confere `perfis.is_moderador`; se não for → `403`. | `src/auth/middlewares.js` | 20/11 |
| M2 | **Supabase "como o usuário".** Cliente criado com a chave pública **e o token do usuário**, para as regras de segurança (RLS) do `schema.sql` valerem. **Nunca** usar a `service_role` na API. | `src/auth/supabase-usuario.js` | 20/11 |
| M3 | **Conta (LGPD).** `GET /api/conta/me` (perfil do usuário logado) e `DELETE /api/conta` (chama a função `excluir_minha_conta()` do banco com o token do usuário). | `src/auth/rotas/conta.js` | 24/11 |
| M4 | **Dashboard do administrador.** `GET /api/admin/metricas` (só moderador): total de usuários, comunidades, publicações e denúncias abertas. | `src/auth/rotas/admin.js` | 24/11 |
| M5 | **Login com Gmail (desafio).** Ativar o Google em *Supabase → Authentication → Providers* e o SMTP do e-mail de confirmação; documentar o passo a passo e combinar com o Luiz o `signInWithOAuth` no front. | `src/auth/README.md` (e painel do Supabase) | 26/11 |
| M6 | **Testes** de M1–M4 com Supabase falso (sem internet), rodando no `npm test`. | `test/auth-*.test.js` | junto de cada tarefa |

## Como trabalhar (passo a passo)

1. **Primeiro** o PR #4 (`joao/backend`) entra na `main`. Ele traz a área `src/auth/` já registrada.
2. O Matheus cria a branch dele **a partir da `main` atualizada**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b matheus/auth
   ```
3. Um PR pequeno por tarefa (ex.: só M1+M2). Antes de abrir o PR, traga a `main` de novo:
   ```bash
   git pull origin main
   npm test
   ```
4. **Revisão cruzada:** o João revisa os PRs do Matheus e o Matheus revisa os do João (o Gustavo também pode revisar).
5. Ninguém faz commit direto na `main`.

## Combinados de segurança

- Chaves só no `.env` (local) e nas variáveis da Vercel. Nunca no código, no front ou no chat.
- A API **nunca** usa a `service_role`: as regras de segurança do banco (RLS) precisam valer.
- Nada de dados pessoais além do mínimo (LGPD). Não registrar e-mail, token ou senha em `console.log`.
