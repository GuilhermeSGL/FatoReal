#!/usr/bin/env python3
"""
Gera public/dados/noticias.json com notícias reais dos feeds RSS oficiais.

Regras do Fato Real (CLAUDE.md): só fonte oficial ou agência pública, TÍTULO ORIGINAL e LINK.
Não escreve resumo (resumo só quando alguém da equipe leu a matéria) e não usa imagem de fora:
o site mostra a ilustração do assunto.

Fontes: Agência Brasil (por editoria), Agência Câmara (por tema e últimas) e Agência Senado.
O assunto vem da editoria/tema do feed; nas listas gerais, de palavras do título (padrão: Política).
"Eleições" junta as matérias que falam de TSE, urna, eleitor, título de eleitor etc.

Uso: python3 scripts/dados/gerar-noticias.py   (rodar de dentro de frontend/)
É uma reserva até o back-end ter o feed automático (GET /api/noticias).
"""
import json, os, re, urllib.request, html
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

AB = 'https://agenciabrasil.ebc.com.br/rss/{}/feed.xml'
CD = 'https://www.camara.leg.br/noticias/rss/dinamico/{}'
FEEDS = [
    # Feeds por tema primeiro: o assunto deles vale mais que o das listas gerais
    (CD.format('ELEICOES'), 'Agência Câmara', 'Eleições'),
    (CD.format('SAUDE'), 'Agência Câmara', 'Saúde'),
    (CD.format('EDUCACAO'), 'Agência Câmara', 'Educação'),
    (CD.format('MEIO-AMBIENTE'), 'Agência Câmara', 'Meio ambiente'),
    (CD.format('ECONOMIA'), 'Agência Câmara', 'Economia'),
    (CD.format('DIREITO-E-JUSTICA'), 'Agência Câmara', 'Justiça'),
    (CD.format('SEGURANCA'), 'Agência Câmara', 'Justiça'),
    (CD.format('DIREITOS-HUMANOS'), 'Agência Câmara', 'Sociedade'),
    (CD.format('RELACOES-EXTERIORES'), 'Agência Câmara', 'Mundo'),
    (AB.format('politica'), 'Agência Brasil', 'Política'),
    (AB.format('economia'), 'Agência Brasil', 'Economia'),
    (AB.format('saude'), 'Agência Brasil', 'Saúde'),
    (AB.format('educacao'), 'Agência Brasil', 'Educação'),
    (AB.format('meio-ambiente'), 'Agência Brasil', 'Meio ambiente'),
    (AB.format('justica'), 'Agência Brasil', 'Justiça'),
    (AB.format('geral'), 'Agência Brasil', 'Sociedade'),
    (AB.format('internacional'), 'Agência Brasil', 'Mundo'),
    (AB.format('ultimasnoticias'), 'Agência Brasil', None),
    ('https://www.camara.leg.br/noticias/rss/ultimas-noticias', 'Agência Câmara', None),
    ('https://www12.senado.leg.br/noticias/rss', 'Agência Senado', None),
]

# Palavras do título → assunto (para feeds sem editoria). Ordem importa.
PALAVRAS = [
    ('Eleições', r'\b(TSE|eleitor|eleitora|eleitoral|eleições|eleição|urna|título de eleitor|candidat|voto)\b'),
    ('Saúde', r'\b(saúde|SUS|vacina|hospital|médic|doença|remédio|câncer|dengue)\b'),
    ('Educação', r'\b(educação|escola|ensino|professor|estudante|aluno|universidade|Enem|MEC)\b'),
    ('Meio ambiente', r'\b(ambiental|clima|climátic|desmatamento|floresta|Amazônia|COP|enchente|seca|El Niño)\b'),
    ('Economia', r'\b(economia|imposto|tribut|orçamento|fiscal|PIB|inflação|salário|crédito|dívida|renda|juros)\b'),
    ('Justiça', r'\b(STF|STJ|Justiça|tribunal|crime|penal|polícia|prisão|ministro do Supremo)\b'),
    ('Mundo', r'\b(EUA|Estados Unidos|China|Argentina|ONU|internacional|guerra|Europa)\b'),
    ('Sociedade', r'\b(mulher|criança|idoso|indígena|racismo|violência|direitos)\b'),
]
MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']


def baixar(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'FatoReal/1.0 (projeto escolar)'})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def assunto(titulo, padrao):
    for nome, er in PALAVRAS:
        if re.search(er, titulo, re.I):
            # Eleições vale mesmo em feed com editoria (ex.: matéria do TSE na editoria Política)
            if nome == 'Eleições' or padrao is None:
                return nome
    return padrao or 'Política'


def main():
    vistos, saida = set(), []
    for url, fonte, padrao in FEEDS:
        try:
            raiz = ET.fromstring(baixar(url))
        except Exception as e:
            print('falhou:', url, e)
            continue
        for item in raiz.iter('item'):
            titulo = html.unescape((item.findtext('title') or '').strip())
            link = (item.findtext('link') or '').strip()
            quando = item.findtext('pubDate')
            if not titulo or not link.startswith('https://') or link in vistos:
                continue
            try:
                d = parsedate_to_datetime(quando)
            except Exception:
                continue
            vistos.add(link)
            saida.append({
                'titulo': titulo, 'categoria': assunto(titulo, padrao),
                'data': f'{d.day} {MESES[d.month - 1]} {d.year}', 'quando': d.isoformat(),
                'fonte': fonte, 'url': link,
            })
    saida.sort(key=lambda n: n['quando'], reverse=True)
    destino = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'dados', 'noticias.json')
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, 'w') as f:
        json.dump({'gerado_em': saida[0]['quando'] if saida else None, 'noticias': saida}, f, ensure_ascii=False, indent=0)
    por = {}
    for n in saida:
        por[n['categoria']] = por.get(n['categoria'], 0) + 1
    print(len(saida), 'notícias:', por)


if __name__ == '__main__':
    main()
