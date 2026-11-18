# Fato Real — memória do projeto para o Claude

Rede social cívica do PI do Senac (turma DS 2025): informação política verificada, perfis de candidatos, comunidades e o assistente FatoBot.

## Como trabalhar aqui
- **Idioma:** tudo em português do Brasil, simples e direto (o público vai de jovens a idosos). Código, comentários, commits e textos da interface.
- **Branch do front-end:** `luiz/frontend`. Não fazer push em outras branches nem abrir PR sem pedido explícito.
- **Commits:** mensagem em português, título curto + lista do que mudou.
- **Antes de dizer que terminou:** `npx ng build` sem erros e capturas das telas mexidas (ver skills abaixo).

## Stack
- Front-end: **Angular 22 + TypeScript** (componentes standalone, signals, `@if/@for`), em `frontend/`. Estilos globais em `frontend/src/styles.scss`.
- Banco/autenticação: **Supabase** (`frontend/src/app/core/supabase.ts`). Sem Supabase configurado o site roda em **modo demonstração** (dados no localStorage).
- Dados públicos: API de Dados Abertos da **Câmara** (`dadosabertos.camara.leg.br/api/v2`) e do **Senado** (`legis.senado.leg.br/dadosabertos`). Elas bloqueiam acesso de fora do Brasil: em servidores na nuvem, testar com `--mock`.
- Rodar: `cd frontend && npm start` (porta 4200). Para testes: `npx ng serve --port 4300`.

## Regras de conteúdo (importantes)
- **Nunca inventar dados** sobre políticos, notícias, números ou checagens. Só fonte oficial ou registro verificado com link. Sem fonte, mostrar "sem dados" / "Em análise".
- Polêmicas e processos de políticos: só com fonte oficial (STF, TSE, CNJ, Agência Brasil...). Processo não é condenação.
- Pessoas e mensagens de exemplo do modo demonstração levam "(exemplo)" no nome.
- O FatoBot nunca opina: responde com fonte ou diz que não há evidência.

## Visual (decisões do Luiz)
- **Foco atual: computador.** Protótipo de celular não é prioridade agora (o layout só não pode quebrar).
- **Modo claro:** verde do Fato Real. **Modo escuro:** azul-marinho com cartões de "vidro" e destaques **verde-limão** (`--lima: #c6f432`), inspirado nos slides da apresentação.
- Os slides em `apresentacao/` são **referência só de visual** (ícones, cores, cartões, selos), **não de conteúdo** — o conteúdo deles é técnico.
- **Selos de status** padronizados (`shared/selo-status.ts`): Verificado, Confiável, Em análise, Novo, Sem contexto, Evidência insuficiente, Falso. Usar sempre esse componente.
- Ícones em quadradinhos coloridos (`.icone-tile`, `.ps-icone`), cartões com título + ícone (`.ps-cartao`, `.ps-titulo`).
- O FatoBot é uma **bolinha flutuante** (`shared/fatobot-bolha.ts`) que acompanha a pessoa; não volta para o menu lateral.
- "Meu perfil" fica no menu e no cartão do topo da lateral (é rede social: o perfil é o ponto de partida para postar).
- Perfil de político segue a estrutura do slide 10 (cabeçalho com resumo do mandato, cartões, linha do tempo, fontes). Perfil de pessoa segue a mesma base, no estilo Orkut + LinkedIn.

## Mapa rápido
- `frontend/src/app/pages/` — telas (inicio, politicos, congresso, verificar = "Fato ou Fake", comunidades, conta/perfil, fatobot...).
- `frontend/src/app/core/` — serviços e dados (politicos.service, ficha-politico, congresso, comunidades.service, fato-ou-fake, registros-verificados...).
- `frontend/src/app/shared/` — componentes reutilizáveis (selo-status, redes-sociais, fatobot-bolha, projeto-acoes...).
- `frontend/scripts/preview/` — `capturas.cjs` (prints + checagem de problemas) e `mocks.cjs` (APIs falsas para teste).

## Skills do projeto
- `/preview` — compila, tira prints das telas, publica o preview e mostra o resultado.
- `/revisar-tela <tela>` — revisão visual de uma tela no claro e no escuro.
- `/subir` — confere o build e faz commit + push na `luiz/frontend`.
