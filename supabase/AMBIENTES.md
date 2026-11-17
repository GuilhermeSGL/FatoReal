# Ambientes do banco: desenvolvimento e produção

O projeto usa **2 bancos Supabase** (o plano grátis limita os projetos ativos) para cobrir 4 ambientes:

| Ambiente | Onde roda | Banco |
|---|---|---|
| **Teste automático** | `npm test` | Nenhum: os testes usam um Supabase simulado |
| **Desenvolvimento** | `.env` de cada um, no próprio computador | **`fato-real-dev`** |
| **Homologação** | Prévias da Vercel (cada branch e cada PR) | **`fato-real-dev`** |
| **Produção** | `https://fato-real.vercel.app` (branch `main`), usado na apresentação | **`fato-real-prod`** |

Regras:
- Toda mudança no `schema.sql` roda **primeiro no dev**. Só depois de testada vai para a produção.
- Testes e dados de mentira **só no dev**. Na produção, só dados de verdade.
- A chave `service_role` (secreta) **nunca** vai para a Vercel, o front, o GitHub ou o chat.
  Ela só é usada no computador de quem roda `npm run importar`.

---

## 1. Criar a organização e os 2 projetos

1. Entre em https://supabase.com/dashboard.
2. Crie uma organização do grupo (para o banco não ficar na conta pessoal de ninguém):
   **New organization** → nome `Fato Real` → plano **Free** → **Create organization**.
3. Convide o grupo: **Organization settings → Team → Invite** (no mínimo o Pablo e o Guilherme).
4. Crie o projeto de desenvolvimento: **New project**
   - Name: `fato-real-dev`
   - Database password: clique em **Generate a password** e guarde num gerenciador de senhas
     (não mande no grupo nem no chat)
   - Region: **South America (São Paulo)**
   - **Create new project** (leva uns 2 minutos)
5. Repita o passo 4 com o nome **`fato-real-prod`**.

> Se aparecer aviso de limite de projetos grátis: confira que o projeto temporário
> (usado só para o primeiro deploy) não tem nada importante, e então pause ou apague ele em
> **Project settings → General**.

## 2. Criar as tabelas (nos dois projetos)

Em **cada** projeto (`fato-real-dev` e `fato-real-prod`):

1. Menu da esquerda → **SQL Editor** → **New query**.
2. Copie **todo** o conteúdo de [`schema.sql`](schema.sql), cole e clique em **Run**.
3. Confira em **Table Editor**: devem aparecer `perfis`, `politicos`, `comunidades`, `publicacoes`, `comentarios`, `curtidas`, `denuncias` etc.

## 3. Endereços de login (Authentication → URL Configuration)

Isso é necessário para a confirmação de e-mail, a recuperação de senha e o login com Google voltarem para o site certo.

| Campo | `fato-real-prod` | `fato-real-dev` |
|---|---|---|
| **Site URL** | `https://fato-real.vercel.app` | `http://localhost:4200` |
| **Redirect URLs** (botão *Add URL*) | `https://fato-real.vercel.app/**` | `http://localhost:4200/**` e `https://fato-real-*-fato-real.vercel.app/**` (prévias da Vercel) |

## 4. Onde achar a URL e a chave pública de cada projeto

No projeto aberto, clique no botão verde **Connect** (no topo). No quadro `.env.local` aparecem:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co          ← este valor é a SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...     ← este valor é a SUPABASE_ANON_KEY
```

Os nomes ali são do Next.js; **use só o valor** (o que vem depois do `=`).
Também dá para achar em **Project settings → API Keys** (*Publishable key*).

## 5. Cadastrar na Vercel

1. Entre em https://vercel.com → time **Fato Real** → projeto **fato-real** → **Settings** → **Environment Variables**.
2. **Produção** (as variáveis que já existem apontam para o banco temporário):
   - Na linha `SUPABASE_URL` (Production), clique em **⋯ → Edit**, cole a URL do **`fato-real-prod`** e salve.
   - Faça o mesmo com `SUPABASE_ANON_KEY` (chave pública do **`fato-real-prod`**).
3. **Homologação** (variáveis novas, só para as prévias):
   - Clique em **Add New** (ou **Add Environment Variable**).
   - Key: `SUPABASE_URL` · Value: URL do **`fato-real-dev`**.
   - Em **Environments**, deixe marcado **só Preview** (desmarque Production e Development).
   - **Save**. Repita com `SUPABASE_ANON_KEY` (chave pública do **`fato-real-dev`**).
4. **Não cadastre** a `SUPABASE_SERVICE_ROLE_KEY`.
5. Opcional: para o FatoBot ter IA nas prévias, cadastre `GEMINI_API_KEY` só em **Preview**,
   de preferência com **outra chave** do AI Studio (para os testes não gastarem a cota da apresentação).

Ao final, a lista deve ficar assim:

| Key | Production | Preview |
|---|---|---|
| `SUPABASE_URL` | URL do `fato-real-prod` | URL do `fato-real-dev` |
| `SUPABASE_ANON_KEY` | chave pública do prod | chave pública do dev |
| `GEMINI_API_KEY` | chave da apresentação | (opcional) outra chave |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | `gemini-3.5-flash-lite` |

## 6. Publicar de novo (as variáveis só valem em deploys novos)

- **Produção:** **Deployments** → no deploy mais recente marcado *Production*, clique em **⋯ → Redeploy**.
- **Prévias:** qualquer push novo numa branch já usa as variáveis de Preview (ou **Redeploy** numa prévia).

## 7. Cada um no seu computador

Nos arquivos locais (que **não** vão para o GitHub), use sempre o **dev**:

- `backend/.env` → `SUPABASE_URL` e `SUPABASE_ANON_KEY` do **`fato-real-dev`**
- `frontend/.env` → as mesmas duas

## 8. Dados

| | `fato-real-dev` | `fato-real-prod` |
|---|---|---|
| Deputados | `npm run importar -- 20` à vontade, para testar | `npm run importar` completo, **uma vez**, antes da apresentação |
| Moderador | `update` no fim do `schema.sql` com o e-mail de quem testa | `update` com o e-mail de quem vai moderar na apresentação |
| Usuários e publicações | contas de teste à vontade | só contas de verdade |

Para importar, o `backend/.env` de quem roda precisa da `SUPABASE_URL` e da `SUPABASE_SERVICE_ROLE_KEY`
**do projeto de destino** (Project settings → API Keys → *Secret key*). Depois de importar no prod,
volte o `.env` para o dev.

## 9. Conferir

- **Produção** (`https://fato-real.vercel.app`): cadastro, login e recuperação de senha funcionam,
  e o e-mail de confirmação leva de volta para o site.
- **Prévia** de uma branch: o site **não** mostra o aviso de "modo demonstração" e usa o banco dev
  (uma conta criada na prévia **não** existe na produção).
- Depois da importação: `.../api/deputados?busca=tabata` mostra a fonte *"(cópia salva no Fato Real)"*.
