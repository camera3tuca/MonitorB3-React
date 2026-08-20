"""
Classificação de ativos negociados na B3.

Este módulo centraliza a lógica que separa o universo à vista da B3 nas
classes que o app monitora:

- ``Ação``  — ações ordinárias/preferenciais e Units (papéis nativos da B3);
- ``BDR``   — Brazilian Depositary Receipts (inclui BDRs de ETFs, sufixo 39);
- ``FII``   — Fundos de Investimento Imobiliário;
- ``ETF``   — ETFs nacionais.

A classificação preferencial usa os campos ``type`` e ``typespecs`` do
TradingView (disponíveis no scanner em massa). Quando esses metadados não
estão presentes (ex.: detalhe de um único ticker), recorre ao sufixo do
código de negociação, que é suficiente para as decisões do app — sobretudo
distinguir um BDR (que precisa de mapeamento para o ativo subjacente nos EUA)
de um ativo nativo da B3 (que negocia direto via ``.SA``/BRAPI).
"""

# Sufixos dos códigos de BDR na B3. O sufixo 39 é reservado para BDRs de ETFs.
TERMINACOES_BDR = ('31', '32', '33', '34', '35', '39')
TERMINACAO_ETF_BDR = '39'

# Classes oferecidas/varridas pelo app (ordem usada na UI).
#
# FIIs foram removidos do universo a pedido do uso do app. Ainda assim,
# ``classificar_ativo`` continua identificando FIIs (typespec 'reit'): isso é
# necessário para EXCLUÍ-los corretamente do resultado — sem essa distinção, um
# fundo imobiliário seria rotulado como ETF por engano. Para reincluir FIIs,
# basta acrescentar 'FII' a esta tupla.
CLASSES = ('Ação', 'BDR', 'ETF')

# Mapa Classe -> tipo(s) do TradingView, para filtrar a varredura no servidor.
CLASSE_PARA_TV_TYPE = {
    'Ação': ('stock',),
    'BDR':  ('dr',),
    'FII':  ('fund',),
    'ETF':  ('fund',),
}

# ETFs nacionais conhecidos (sufixo 11). Usado apenas como desempate quando o
# TradingView não traz ``typespecs`` para separar ETF de FII — em produção os
# typespecs normalmente estão presentes e este conjunto raramente é acionado.
ETFS_B3 = {
    'BOVA11', 'BOVV11', 'BOVB11', 'BRAX11', 'PIBB11', 'SMAL11', 'DIVO11',
    'FIND11', 'MATB11', 'ECOO11', 'GOVE11', 'ISUS11', 'SMAC11', 'XBOV11',
    'IVVB11', 'SPXI11', 'SPXB11', 'NASD11', 'TECK11', 'XINA11', 'XFIX11',
    'EURP11', 'ACWI11', 'WRLD11', 'ASIA11', 'EIND11', 'HASH11', 'GOLD11',
    'DEFI11', 'WEB311', 'CRPT11', 'QBTC11', 'QETH11', 'BITH11', 'ETHE11',
    'IB5M11', 'B5P211', 'FIXA11', 'IMAB11', 'IRFM11', 'LFTS11', 'USDB11',
    'DOLA11', 'JOGO11', 'ESGB11', 'URNM11', 'DNAI11', 'AGRI11',
}


def eh_bdr(ticker):
    """True se o código de negociação é de um BDR (sufixos 31–35, 39)."""
    return str(ticker or '').strip().upper()[-2:] in TERMINACOES_BDR


def eh_fracionario(ticker):
    """True para tickers do mercado fracionário da B3 (sufixo 'F').

    Na B3 o mercado fracionário adiciona um 'F' ao código normal (ex.: PETR4 ->
    PETR4F, EQPA5 -> EQPA5F, AAPL34 -> AAPL34F). São duplicatas de baixa liquidez
    do lote-padrão e **não existem no Yahoo Finance** (não há ``PETR4F.SA``), por
    isso o scanner os descarta em favor do lote-padrão equivalente.
    """
    t = str(ticker or '').strip().upper()
    return len(t) >= 2 and t.endswith('F') and t[-2].isdigit()


def eh_ativo_nativo_b3(ticker):
    """True para ativos nativos da B3 (ações, Units, FIIs, ETFs nacionais).

    São os ativos que negociam diretamente na B3 e têm histórico/fundamentos
    disponíveis via ``.SA`` (Yahoo) e BRAPI, sem depender do mapeamento para
    o ativo subjacente nos EUA (que só faz sentido para BDRs).
    """
    return not eh_bdr(ticker)


def eh_etf_bdr(ticker):
    """True se é um BDR de ETF (sufixo 39)."""
    return str(ticker or '').strip().upper().endswith(TERMINACAO_ETF_BDR)


def classificar_ativo(ticker, tv_type=None, typespecs=None):
    """Classifica um ativo em ``Ação`` / ``BDR`` / ``FII`` / ``ETF``.

    ``tv_type`` e ``typespecs`` são os campos homônimos do TradingView; quando
    ausentes, a classificação recai sobre o sufixo do ticker.
    """
    t = str(ticker or '').strip().upper()
    suf2 = t[-2:]
    # ``typespecs`` normalmente é uma lista (ex.: ['reit']); tolera string única
    # e valores nulos/NaN sem quebrar.
    if typespecs is None or isinstance(typespecs, float):
        typespecs = []
    elif isinstance(typespecs, str):
        typespecs = [typespecs]
    specs = {str(s).strip().lower() for s in typespecs}
    ttype = str(tv_type or '').strip().lower()

    # 1) BDRs — tipo 'dr' no TradingView ou sufixo característico (31–35, 39),
    #    incluindo BDRs de ETFs (39), que continuam sendo BDRs.
    if ttype == 'dr' or suf2 in TERMINACOES_BDR:
        return 'BDR'

    # 2) Ações — o TradingView marca ON, PN e Units como 'stock'.
    if ttype == 'stock':
        return 'Ação'

    # 3) Fundos — separa ETF nacional de FII pelos typespecs quando houver.
    if ttype == 'fund' or (not ttype and t.endswith('11')):
        if 'reit' in specs:
            return 'FII'
        if specs & {'etf', 'etn', 'etc'} or t in ETFS_B3:
            return 'ETF'
        # Sem typespec discriminante: na B3 a maioria dos fundos com sufixo 11
        # (fora os ETFs conhecidos) são FIIs.
        return 'FII'

    # 4) Fallback: trata como ação.
    return 'Ação'


def tv_types_para_classes(classes):
    """Conjunto de tipos do TradingView que cobre as ``classes`` pedidas.

    Ex.: ['Ação', 'FII'] -> {'stock', 'fund'}. Retorna ``None`` quando nenhuma
    classe é informada (sinaliza "todas as classes").
    """
    if not classes:
        return None
    tipos = set()
    for c in classes:
        tipos.update(CLASSE_PARA_TV_TYPE.get(c, ()))
    return tipos or None
