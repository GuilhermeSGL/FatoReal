# Roteiro final do vídeo — Fato Real (banca PI Senac, 01/12/2026)

Formato: **1920×1080, 16:9, 24 fps**, para telão. Duração: **1min02,5s**.
Montagem automática: `apresentacao/video/montar.sh` (FFmpeg). Pedido original: `roteiro.txt`, na pasta do Drive "Video Final - FATO REAL Claude".

Personagens: **BIA** (camisa branca, chega frustrada) · **LU** (camiseta verde e fone, no notebook) · **LOCUTOR** (narração).

---

## 1. Linha do tempo (já montada no script)

| Tempo | Clipe | Arquivo | Tratamento |
|---|---|---|---|
| 00:00–00:08,0 | **0** Brasília + voo do passarinho | Drive `Cena 1 e 2/cena de transição.mp4` | **câmera lenta 70%** com quadros interpolados (6 s → 8,4 s); escala 1,62 + recorte; `delogo` na marca KlingAI |
| 00:08,0 | corte invisível 0 → 1 | — | enquadramento medido com OpenCV (Clipe1 = 1,514 × Clipe0); fusão de 0,4 s |
| 00:08,0–00:18,0 | **1** Bia chega e se debruça | Drive `M - Cena1/Referência de vídeo-1795502210761.mp4` | zoom 107% |
| 00:18,0–00:28,0 | **2** desabafo no travesseiro | `cena2.zip` (mesmo arquivo de `M - Cena2`) | zoom 107%, **áudio espanhol removido** |
| 00:28,0–00:38,0 | **3** levanta e senta | Drive `M - Cena3/reference2video-1795505011000.mp4` | zoom 107% (some a marca Media.io) |
| 00:38,0–00:46,0 | **4** por cima do ombro, clique em VERIFICAR (8 s) | `cena4.zip` | zoom 107%; nos últimos 0,7 s a câmera mergulha na tela do notebook |
| 00:45,5–00:58,0 | **5** gravação de tela do site | (a gravar) | fusão de 0,5 s saindo da tela do notebook |
| 00:57,5–01:02,5 | **Cartela final** | `apresentacao/video/cartela.png` | fusão de 0,5 s; escurece no fim |

**Duração total: 1min02,5s** (cumpre o mínimo de 1 minuto).
**Zoom de 107%** (e não 104–105%): é o menor valor que tira a marca Media.io dos Clipes 2 e 3 **e** deixa o Clipe 0 e o Clipe 1 com o mesmo enquadramento.

---

## 2. Roteiro de vozes e sons (PT-BR)

> Todo o áudio original dos clipes é **removido**. Grave as vozes com voz **normal**, num lugar com som seco: o efeito abafado é colocado depois pelo script.

| Tempo | Quem | Fala / som | Efeito |
|---|---|---|---|
| 00:00 | SFX | vento suave + passarinhos ao amanhecer (fade-in 2 s) | ambiente |
| ~00:01,5 | SFX | **bater de asas** quando o passarinho cruza as torres | — |
| 00:00,8–00:07,0 | LOCUTOR *(opcional)* | "Todo dia, decisões tomadas em Brasília mudam a nossa vida. Mas, no meio de tanta informação… em quem acreditar?" | limpa |
| ~00:07,0 | SFX | asas desacelerando, pouso no parapeito | — |
| ~00:10,0 | SFX | **porta abrindo** (sincronizar com a imagem) | — |
| ~00:12,0 | SFX | **porta fechando** + passos até a janela | — |
| ~00:13,0 | SFX | Lu tirando o fone (clique de plástico) | — |
| 00:13,5–00:15,3 | BIA | *(suspiro)* "Ai… eu não aguento mais." | limpa |
| **00:18,0–00:25,0** | BIA | "Todo mundo brigando por política… cada um fala uma coisa. Eu nem sei mais o que é verdade, nem quais são os meus direitos!" | **ABAFADA (passa-baixa 800 Hz)** |
| 00:25,2–00:27,8 | LU | *(sorrindo, de longe)* "Ei, Bia! Vem cá, olha isso aqui!" | limpa |
| 00:28,5–00:29,5 | BIA | "O quê?" | limpa |
| ~00:30,5 | SFX | colchão quando ela senta | — |
| 00:31,0–00:37,0 | LU | "É o Fato Real. Você pesquisa político, pergunta pro FatoBot e confere tudo nas fontes oficiais." | limpa |
| 00:38,3–00:39,8 | BIA | "Deixa eu testar uma coisa." | limpa |
| 00:40,5–00:42,0 | LU | "Clica em Verificar." | limpa |
| **00:43,8** | SFX | **clique/toque** (o dedo toca em VERIFICAR aos 5,8 s do Clipe 4) | — |
| 00:45,0–00:46,0 | SFX | **whoosh** do mergulho na tela; trilha sobe | — |
| 00:46,0–00:50,0 | LOCUTOR | "Cole o que você recebeu. O Fato Real confere nas fontes oficiais e mostra a fonte e a data." | limpa |
| 00:50,2–00:54,0 | LOCUTOR | "Pesquise deputados e senadores, com dados abertos da Câmara e do Senado." | limpa |
| 00:54,2–00:57,5 | LOCUTOR | "E converse em comunidades por tema, com regras e denúncia." | limpa |
| 00:58,3–01:01,8 | LOCUTOR | "**Fato Real.** Pesquise, entenda, confira as fontes." | limpa; trilha fecha num acorde |

**Cuidados com o texto (regras do projeto):** o site chama o resultado de *avaliação preliminar*, então não dizemos que ele "garante a verdade". O FatoBot pode opinar (deixando claro que é opinião), então não dizemos que ele responde "exclusivamente" com fontes. Nenhuma fala acusa político real.

**Como entregar o áudio para o script:** um arquivo `locucao.wav` com **todas as vozes já no tempo do vídeo** (grave assistindo à prévia), `musica.mp3` (trilha sem direitos: Biblioteca de Áudio do YouTube ou Pixabay) e, se quiser, `sfx.wav`. O script aplica o abafado entre 18,0 s e 25,0 s, abaixa a música quando há voz (*ducking*) e normaliza tudo em −14 LUFS.

---

## 3. Gravação de tela (Clipe 5) — custo zero

**Ordem recomendada:** começar pela **verificação**, porque o Clipe 4 termina clicando em VERIFICAR (o zoom "cai" no resultado). Depois Políticos e Comunidades.

Preparação: Chrome em **modo escuro** do site (cordinha do tema ou Configurações → Escuro), zoom do navegador em **110%**, barra de favoritos escondida (`Ctrl+Shift+B`), notificações desligadas, **F11**. OBS Studio em 1920×1080, 30 ou 60 fps. Grave cada parte num arquivo e com folga: eu acelero e corto para caber em 12,5 s.

1. **Verificação (~4 s no vídeo)** — em `/fato-ou-fake`, colar *A Câmara dos Deputados tem 513 deputados.* → **Verificar** → rolar até o **Resultado da verificação**, parar no **selo**, na **Fonte primária** e na **Data da consulta**. Se vier "Em análise" ou "Evidência insuficiente", **vale assim mesmo**: não editamos o resultado.
   *Alternativa com FatoBot:* abrir a bolinha do FatoBot e clicar na sugestão "Quantos deputados tem a Câmara?". Leia a resposta antes de usar.
2. **Políticos (~4,5 s)** — menu **Políticos** → buscar um deputado (escolha neutra, por exemplo um do seu estado) → abrir o perfil → rolar até os cartões e as **fontes**, com a data de atualização.
3. **Comunidades (~4 s)** — menu **Comunidades** → abrir uma comunidade → mostrar o **mural** (um post com comentários e curtidas) → mostrar o botão de **denunciar** → aba **Regras**.

---

## 4. Como rodar a montagem

```bash
cd apresentacao/video
```
Coloque os arquivos em `entrada/` (`clipe0.mp4` … `clipe5.mp4`, `cartela.png`, e opcionalmente `locucao.wav`, `musica.mp3`, `sfx.wav`) e rode:
```bash
bash montar.sh
```
Sai `saida/fato_real_final.mp4` (H.264, AAC 320k, `faststart`). Para o que ainda faltar, o script põe uma tela provisória com aviso, e dá para ver o tempo todo.

No CapCut ou no Premiere, os mesmos números valem: **Escala 107%** e deslocamento para cima nos clipes 1–4, e Clipe 0 a 70% da velocidade (com interpolação de quadros) e escalado para 162%, e fusão de 0,4 s em 00:08,0.

## 5. Checklist antes da banca
- [ ] Assistir inteiro no projetor da sala, com o som da sala.
- [ ] Nenhuma marca d'água nos cantos, nenhum trecho em espanhol.
- [ ] Legendas sem erro (CapCut → Legendas automáticas, revisar).
- [ ] Resultado mostrado no site é o real e não acusa nenhum político.
- [ ] MP4 no pen drive **e** no Drive. Vídeo **não** vai para o GitHub.
