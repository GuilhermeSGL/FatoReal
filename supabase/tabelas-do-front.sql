-- =====================================================================
-- Fato Real: tabelas que o front-end já usa e que faltam no schema.sql
-- (achadas no site publicado em 23/11/2026: o Supabase respondia 404).
--
-- Como usar: Supabase > SQL Editor > colar tudo > Run.
-- Pode rodar mais de uma vez sem erro (if not exists / drop policy if exists).
-- Depende do schema.sql (tabelas perfis e comunidades, funções eh_membro e eh_moderador).
-- =====================================================================

-- ---------- 1. Polêmicas e processos dos políticos (perfil do político) ----------
-- Só a moderação cadastra, sempre com link da fonte oficial. Processo não é condenação.
create table if not exists public.politico_alertas (
  id          bigint generated always as identity primary key,
  politico_id bigint not null,                       -- id da Câmara ou do Senado
  casa        text   not null default 'camara' check (casa in ('camara', 'senado')),
  tipo        text   not null,                       -- TipoAlerta do front (core/modelos.ts)
  titulo      text   not null check (char_length(titulo) between 3 and 200),
  descricao   text   not null default '' check (char_length(descricao) <= 2000),
  orgao       text   not null,                       -- STF, TSE, CNJ, Agência Brasil...
  data        date,
  fonte_url   text   not null check (fonte_url ~ '^https?://'),
  criado_por  uuid   references public.perfis(id) on delete set null default auth.uid(),
  criado_em   timestamptz not null default now()
);
create index if not exists politico_alertas_politico on public.politico_alertas (politico_id, casa);
alter table public.politico_alertas enable row level security;
drop policy if exists "alertas: todos leem" on public.politico_alertas;
create policy "alertas: todos leem" on public.politico_alertas for select using (true);
drop policy if exists "alertas: moderação cadastra" on public.politico_alertas;
create policy "alertas: moderação cadastra" on public.politico_alertas for insert with check (public.eh_moderador());
drop policy if exists "alertas: moderação apaga" on public.politico_alertas;
create policy "alertas: moderação apaga" on public.politico_alertas for delete using (public.eh_moderador());

-- ---------- 2. Opinião da pessoa sobre um projeto de lei (a favor / contra) ----------
create table if not exists public.opinioes_projetos (
  proposicao_id bigint not null,
  usuario_id    uuid   not null references public.perfis(id) on delete cascade default auth.uid(),
  opiniao       text   not null check (opiniao in ('favor', 'contra')),
  criado_em     timestamptz not null default now(),
  primary key (proposicao_id, usuario_id)
);
alter table public.opinioes_projetos enable row level security;
-- LGPD: opinião política é dado sensível (RN06). Ninguém lê a opinião dos outros:
-- cada pessoa lê só a própria linha, e os totais saem pela função contagem_opinioes (só números).
drop policy if exists "opinioes: todos leem" on public.opinioes_projetos;
drop policy if exists "opinioes: a própria pessoa lê" on public.opinioes_projetos;
create policy "opinioes: a própria pessoa lê" on public.opinioes_projetos
  for select using (usuario_id = auth.uid());

-- Totais de um projeto, sem dizer quem votou (LGPD: opinião política é dado sensível)
create or replace function public.contagem_opinioes(p_proposicao bigint)
returns table (favor bigint, contra bigint)
language sql stable security definer set search_path = public as $$
  select count(*) filter (where opiniao = 'favor'),
         count(*) filter (where opiniao = 'contra')
  from public.opinioes_projetos
  where proposicao_id = p_proposicao;
$$;
grant execute on function public.contagem_opinioes(bigint) to anon, authenticated;
drop policy if exists "opinioes: a própria pessoa grava" on public.opinioes_projetos;
create policy "opinioes: a própria pessoa grava" on public.opinioes_projetos for insert with check (usuario_id = auth.uid());
drop policy if exists "opinioes: a própria pessoa muda" on public.opinioes_projetos;
create policy "opinioes: a própria pessoa muda" on public.opinioes_projetos for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
drop policy if exists "opinioes: a própria pessoa apaga" on public.opinioes_projetos;
create policy "opinioes: a própria pessoa apaga" on public.opinioes_projetos for delete using (usuario_id = auth.uid());

-- ---------- 3. Bate-papo em grupo das comunidades (Mensagens > Comunidades) ----------
create table if not exists public.mensagens_comunidade (
  id            bigint generated always as identity primary key,
  comunidade_id bigint not null references public.comunidades(id) on delete cascade,
  autor_id      uuid   not null references public.perfis(id) on delete cascade default auth.uid(),
  texto         text   not null check (char_length(texto) between 1 and 2000),
  criado_em     timestamptz not null default now()
);
create index if not exists mensagens_comunidade_lista on public.mensagens_comunidade (comunidade_id, criado_em desc);
alter table public.mensagens_comunidade enable row level security;
drop policy if exists "grupo: membros leem" on public.mensagens_comunidade;
create policy "grupo: membros leem" on public.mensagens_comunidade for select using (public.eh_membro(comunidade_id) or public.eh_moderador());
drop policy if exists "grupo: membros escrevem" on public.mensagens_comunidade;
create policy "grupo: membros escrevem" on public.mensagens_comunidade for insert with check (autor_id = auth.uid() and public.eh_membro(comunidade_id));
drop policy if exists "grupo: autor ou moderação apaga" on public.mensagens_comunidade;
create policy "grupo: autor ou moderação apaga" on public.mensagens_comunidade for delete using (autor_id = auth.uid() or public.eh_moderador());

-- ---------- 4. Checagens recentes (lista "últimas checagens" do Fato ou Fake) ----------
-- Quem publica checagem é a moderação (pelo site, logada como moderadora). Todos leem.
-- A API não usa a chave de serviço (combinado de segurança) e não grava nesta tabela.
create table if not exists public.checagens (
  id         bigint generated always as identity primary key,
  afirmacao  text not null check (char_length(afirmacao) between 3 and 1000),
  estado     text not null,                          -- EstadoVerificacao do front (core/fatobot.service.ts)
  resumo     text not null default '',
  fonte      jsonb,                                  -- { "titulo": "...", "url": "https://..." }
  criado_em  timestamptz not null default now()
);
alter table public.checagens enable row level security;
drop policy if exists "checagens: todos leem" on public.checagens;
create policy "checagens: todos leem" on public.checagens for select using (true);
drop policy if exists "checagens: moderação publica" on public.checagens;
create policy "checagens: moderação publica" on public.checagens
  for insert with check (public.eh_moderador());
drop policy if exists "checagens: moderação apaga" on public.checagens;
create policy "checagens: moderação apaga" on public.checagens
  for delete using (public.eh_moderador());

-- ---------- 5. Favoritos ("Salvos" no Meu Perfil) ----------
-- Cada pessoa vê, salva e apaga só os próprios favoritos.
create table if not exists public.favoritos (
  id         bigint generated always as identity primary key,
  usuario_id uuid   not null default auth.uid() references public.perfis(id) on delete cascade,
  tipo       text   not null check (tipo in ('politico', 'projeto', 'noticia', 'publicacao', 'comunidade')),
  ref_id     text   not null,
  titulo     text   not null default '' check (char_length(titulo) <= 200),
  url        text   check (url is null or url ~ '^https?://'),
  criado_em  timestamptz not null default now(),
  unique (usuario_id, tipo, ref_id)
);
alter table public.favoritos enable row level security;
drop policy if exists "favoritos: a própria pessoa lê" on public.favoritos;
create policy "favoritos: a própria pessoa lê" on public.favoritos for select using (usuario_id = auth.uid());
drop policy if exists "favoritos: a própria pessoa salva" on public.favoritos;
create policy "favoritos: a própria pessoa salva" on public.favoritos for insert with check (usuario_id = auth.uid());
drop policy if exists "favoritos: a própria pessoa apaga" on public.favoritos;
create policy "favoritos: a própria pessoa apaga" on public.favoritos for delete using (usuario_id = auth.uid());
