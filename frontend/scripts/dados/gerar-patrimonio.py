#!/usr/bin/env python3
"""
Gera os arquivos de patrimônio declarado (public/dados/patrimonio/{casa}-{id}.json).

De onde vêm os dados (tudo oficial e público):
  - TSE, dados abertos: candidatos (consulta_cand) e bens declarados (bem_candidato) de 2022 e 2018
    https://dadosabertos.tse.jus.br/
  - Câmara: deputados em exercício e o CPF de cada um (API de Dados Abertos)
  - Senado: senadores em exercício (API de Dados Abertos)

Como cruza:
  - Deputados: pelo CPF (Câmara x TSE), cargo Deputado Federal. Exato.
  - Senadores: pelo nome completo + UF (o Senado não publica CPF), cargo Senador ou suplente.
O CPF só é usado aqui, no cruzamento: ele NÃO vai para os arquivos do site.

Uso (precisa de acesso às APIs da Câmara e do Senado, que bloqueiam fora do Brasil):
  python3 scripts/dados/gerar-patrimonio.py --pasta /tmp/tse
Depois: conferir alguns perfis no site e fazer commit da pasta public/dados/patrimonio.
"""
import argparse, csv, glob, json, os, re, unicodedata, urllib.request, zipfile
import concurrent.futures as cf

TSE = 'https://cdn.tse.jus.br/estatistica/sead/odsele'
CAMARA = 'https://dadosabertos.camara.leg.br/api/v2'
SENADO = 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json'
ANOS = ('2022', '2018')  # mais recente primeiro
SAIDA = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'dados', 'patrimonio')


def baixar_json(url):
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().upper()
    return re.sub(r'\s+', ' ', s).strip()


def preparar_tse(pasta):
    for ano in ANOS:
        for tipo in ('bem_candidato', 'consulta_cand'):
            zipado = os.path.join(pasta, f'{tipo}_{ano}.zip')
            destino = os.path.join(pasta, f'{tipo}_{ano}')
            if not os.path.exists(zipado):
                print('baixando', os.path.basename(zipado))
                urllib.request.urlretrieve(f'{TSE}/{tipo}/{tipo}_{ano}.zip', zipado)
            if not os.path.isdir(destino):
                with zipfile.ZipFile(zipado) as z:
                    z.extractall(destino)


def linhas(padrao):
    for arq in glob.glob(padrao):
        if arq.endswith('_BRASIL.csv'):
            continue  # o arquivo BRASIL repete o conteúdo dos estados
        with open(arq, encoding='latin1') as h:
            yield from csv.DictReader(h, delimiter=';')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pasta', default='/tmp/tse', help='onde guardar os arquivos do TSE')
    pasta = ap.parse_args().pasta
    os.makedirs(pasta, exist_ok=True)
    os.makedirs(SAIDA, exist_ok=True)
    preparar_tse(pasta)

    cargos = ('DEPUTADO FEDERAL', 'SENADOR', '1º SUPLENTE', '2º SUPLENTE')
    cand = {ano: [
        {'sq': r['SQ_CANDIDATO'], 'cpf': r['NR_CPF_CANDIDATO'], 'nome': norm(r['NM_CANDIDATO']), 'uf': r['SG_UF'],
         'cargo': r['DS_CARGO'], 'sit': r['DS_SIT_TOT_TURNO'], 'eleicao': r['DS_ELEICAO']}
        for r in linhas(f'{pasta}/consulta_cand_{ano}/*.csv') if r['DS_CARGO'] in cargos
    ] for ano in ANOS}

    bens = {}
    for ano in ANOS:
        for r in linhas(f'{pasta}/bem_candidato_{ano}/*.csv'):
            valor = float(r['VR_BEM_CANDIDATO'].replace('.', '').replace(',', '.') or 0)
            bens.setdefault((ano, r['SQ_CANDIDATO']), {})[r['NR_ORDEM_BEM_CANDIDATO']] = {
                'tipo': r['DS_TIPO_BEM_CANDIDATO'].strip(), 'descricao': r['DS_BEM_CANDIDATO'].strip()[:140], 'valor': round(valor, 2)}

    def gravar(casa, pid, nome, ano, c):
        itens = sorted(bens.get((ano, c['sq']), {}).values(), key=lambda x: -x['valor'])
        situacao = None if c['sit'].startswith('#') else c['sit'].capitalize()
        doc = {'casa': casa, 'id': pid, 'nome': nome, 'ano': int(ano), 'eleicao': c['eleicao'],
               'cargo_disputado': c['cargo'].title(), 'situacao': situacao,
               'total': round(sum(i['valor'] for i in itens), 2), 'quantidade': len(itens), 'bens': itens,
               'fonte': {'titulo': f'TSE · Dados abertos: bens declarados pelos candidatos ({ano})',
                         'url': f'https://dadosabertos.tse.jus.br/dataset/candidatos-{ano}'}}
        with open(os.path.join(SAIDA, f'{casa}-{pid}.json'), 'w') as f:
            json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))

    # Deputados: CPF vem do detalhe de cada um na Câmara
    lista = baixar_json(f'{CAMARA}/deputados?itens=1000&ordem=ASC&ordenarPor=nome')['dados']
    with cf.ThreadPoolExecutor(8) as ex:
        cpfs = dict(ex.map(lambda d: (d['id'], baixar_json(f"{CAMARA}/deputados/{d['id']}")['dados'].get('cpf')), lista))
    feitos = 0
    for d in lista:
        achou = next(((ano, c) for ano in ANOS for c in cand[ano] if c['cpf'] == cpfs.get(d['id']) and c['cargo'] == 'DEPUTADO FEDERAL'), None)
        if achou:
            gravar('camara', d['id'], d['nome'], *achou)
            feitos += 1
    print(f'deputados: {feitos} de {len(lista)}')

    # Senadores: nome completo + UF
    sen = baixar_json(SENADO)['ListaParlamentarEmExercicio']['Parlamentares']['Parlamentar']
    feitos = 0
    for s in sen:
        i = s['IdentificacaoParlamentar']
        nome, uf = norm(i['NomeCompletoParlamentar']), i.get('UfParlamentar')
        achou = next(((ano, c) for ano in ANOS for c in cand[ano]
                      if c['nome'] == nome and c['uf'] == uf and c['cargo'] != 'DEPUTADO FEDERAL'), None)
        if achou:
            gravar('senado', i['CodigoParlamentar'], i['NomeParlamentar'], *achou)
            feitos += 1
        else:
            print('senador não encontrado no TSE:', i['NomeParlamentar'], uf)
    print(f'senadores: {feitos} de {len(sen)}')


if __name__ == '__main__':
    main()
