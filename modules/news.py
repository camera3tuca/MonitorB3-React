import streamlit as st
import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt
import seaborn as sns
import requests
from datetime import datetime
import pytz
import warnings
import xml.etree.ElementTree as ET
import html as html_lib
import re

def _limpar_html(texto):
    """Remove tags HTML, decodifica entidades e normaliza espaços em branco."""
    if not texto:
        return ""
    texto = re.sub(r'<[^>]+>', '', texto)
    texto = html_lib.unescape(texto)
    # Colapsa quebras de linha e espaços múltiplos num único espaço. Sem isso,
    # títulos/descrições multi-linha (comuns no Google News em português) injetam
    # '\n' no HTML do card e o Markdown do Streamlit passa a tratar as linhas
    # indentadas do template como bloco de código, exibindo o HTML como texto.
    texto = re.sub(r'\s+', ' ', texto)
    return texto.strip()


# ── Sentimento por manchete (finVADER léxico-financeiro, sem nltk) ────────────
# Reproduz o método do finVADER: base VADER (pacote vaderSentiment, Python puro)
# + léxicos financeiros SentiBigNomics e Henry mesclados. Vendorizamos o léxico
# (modules/fin_lexicon.json) para NÃO depender do pacote finvader, que fixa
# nltk==3.6.2 e poderia conflitar com o openbb no deploy. O analisador é
# construído uma única vez (cache) e reaproveitado por manchete.
import os as _os
import json as _json_sent

_ANALISADOR_SENT = None
_SENT_INDISPONIVEL = False


def _obter_analisador_sentimento():
    """Constrói (uma vez) o analisador VADER com o léxico financeiro mesclado.
    Retorna None se o vaderSentiment não estiver disponível — a UI degrada sem
    quebrar."""
    global _ANALISADOR_SENT, _SENT_INDISPONIVEL
    if _ANALISADOR_SENT is not None:
        return _ANALISADOR_SENT
    if _SENT_INDISPONIVEL:
        return None
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        sia = SentimentIntensityAnalyzer()
        caminho = _os.path.join(_os.path.dirname(__file__), 'fin_lexicon.json')
        with open(caminho, 'r', encoding='utf-8') as f:
            lex = _json_sent.load(f)
        sia.lexicon.update(lex)  # léxico financeiro sobre a base VADER
        _ANALISADOR_SENT = sia
        return sia
    except Exception:
        _SENT_INDISPONIVEL = True
        return None


def _sentimento_manchete(texto_en):
    """Classifica UMA manchete (em inglês — o léxico é em inglês) e devolve um
    dicionário com rótulo, score, emoji e cor; ou None se indisponível.

    IMPORTANTE: chamar SEMPRE sobre o título original em inglês, antes da
    tradução para pt-BR (o léxico financeiro é em inglês)."""
    sia = _obter_analisador_sentimento()
    if sia is None or not texto_en or not texto_en.strip():
        return None
    try:
        c = sia.polarity_scores(texto_en)['compound']
    except Exception:
        return None
    if c >= 0.05:
        return {'score': c, 'label': 'Positivo', 'emoji': '🟢',
                'cor': '#15803d', 'bg': '#dcfce7'}
    if c <= -0.05:
        return {'score': c, 'label': 'Negativo', 'emoji': '🔴',
                'cor': '#b91c1c', 'bg': '#fee2e2'}
    return {'score': c, 'label': 'Neutro', 'emoji': '⚪',
            'cor': '#64748b', 'bg': '#e2e8f0'}


def _formatar_data(pub_raw):
    """Converte data RSS -> (str formatada dd/mm/aa HH:MM, datetime UTC para ordenação)."""
    formatos = [
        '%a, %d %b %Y %H:%M:%S %z', '%a, %d %b %Y %H:%M:%S GMT',
        '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S%z', '%d %b %Y %H:%M:%S %z',
    ]
    for fmt in formatos:
        try:
            dt = datetime.strptime(pub_raw.strip(), fmt)
            dt_naive = dt.replace(tzinfo=None)
            return dt.strftime('%d/%m/%Y %H:%M'), dt_naive
        except Exception:
            continue
    return pub_raw, None


def _traduzir_com_mymemory(textos):
    """Traduz lista en->pt-BR via MyMemory em paralelo."""
    if not textos:
        return textos
    def _um(texto):
        if not texto or not texto.strip():
            return texto
        try:
            resp = requests.get("https://api.mymemory.translated.net/get",
                params={"q": texto[:450], "langpair": "en|pt-br"}, timeout=5)
            if resp.status_code == 200:
                t = resp.json().get("responseData", {}).get("translatedText", "")
                if t and t.upper() != texto.upper():
                    return t
        except Exception:
            pass
        return texto
    from concurrent.futures import ThreadPoolExecutor, as_completed
    results = [None] * len(textos)
    with ThreadPoolExecutor(max_workers=6) as ex:
        fut_map = {ex.submit(_um, t): i for i, t in enumerate(textos)}
        for fut in as_completed(fut_map):
            results[fut_map[fut]] = fut.result()
    return results


def _parsear_item_rss(item, fonte_nome):
    """Extrai campos padronizados de um <item> XML."""
    titulo_raw = _limpar_html(item.findtext('title', ''))
    if not titulo_raw or len(titulo_raw) < 8:
        return None
    pub_raw  = item.findtext('pubDate', '') or item.findtext('updated', '')
    data_fmt, dt_obj = _formatar_data(pub_raw) if pub_raw else ('', None)
    desc = _limpar_html(item.findtext('description', '') or
                        item.findtext('summary', ''))[:350]
    if desc and titulo_raw.lower()[:40] in desc.lower():
        desc = ''
    titulo     = titulo_raw
    fonte_real = fonte_nome
    if fonte_nome == 'Google News' and ' - ' in titulo_raw:
        partes     = titulo_raw.rsplit(' - ', 1)
        titulo     = partes[0].strip()
        fonte_real = partes[1].strip()[:40]
    return {'titulo': titulo, 'link': item.findtext('link', ''),
            'data': data_fmt, 'dt': dt_obj, 'descricao': desc,
            'fonte': fonte_nome, 'fonte_real': fonte_real}


def _buscar_rss(url, fonte_nome, max_n=8, headers=None):
    """Busca e parseia qualquer feed RSS."""
    noticias = []
    _h = headers or {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        resp = requests.get(url, headers=_h, timeout=9)
        if resp.status_code != 200:
            return []
        root    = ET.fromstring(resp.content)
        channel = root.find('channel') or root
        for item in (channel.findall('item') + root.findall('.//item'))[:max_n * 2]:
            n = _parsear_item_rss(item, fonte_nome)
            if n:
                noticias.append(n)
            if len(noticias) >= max_n:
                break
    except Exception:
        pass
    return noticias


def _buscar_yahoo_rss(ticker_us, max_noticias=10):
    """Yahoo Finance RSS — usa URL específica do ticker para notícias relevantes."""
    for url in [
        f"https://finance.yahoo.com/rss/headline?s={ticker_us}",
        f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker_us}&region=US&lang=en-US",
    ]:
        r = _buscar_rss(url, 'Yahoo Finance', max_noticias)
        if r: return r
    return []


def _buscar_gurufocus_rss(ticker_us, max_noticias=6):
    return _buscar_rss(f"https://www.gurufocus.com/news/rss/{ticker_us}",
                       'GuruFocus', max_noticias)


def _buscar_seekingalpha_rss(ticker_us, max_noticias=6):
    for url in [f"https://seekingalpha.com/api/sa/combined/{ticker_us}.xml",
                f"https://seekingalpha.com/symbol/{ticker_us}/feed.xml"]:
        r = _buscar_rss(url, 'Seeking Alpha', max_noticias)
        if r: return r
    return []


def _buscar_marketwatch_rss(ticker_us, max_noticias=5):
    noticias = _buscar_rss(
        "https://feeds.marketwatch.com/marketwatch/realtimeheadlines/",
        'MarketWatch', 100)
    tl = ticker_us.lower()
    return [n for n in noticias
            if tl in (n['titulo'] + n['descricao']).lower()][:max_noticias]


def _buscar_google_news_rss(ticker_us, empresa_nome='', max_noticias=10):
    """
    Google News RSS — usa nome da empresa como query principal.
    Para tickers curtos ou ambíguos (palavras comuns), usa APENAS o nome.
    """
    _ambiguos = {
        'bk','ge','gm','ms','gs','t','f','a','k','x','y','z','v','c',
        'bony','bone','ball','ally','bell','dell','ford','snap','coin',
        'dash','zoom','open','link','mark','wave','work','zone',
    }
    ticker_ambiguo = (len(ticker_us) <= 2 or ticker_us.lower() in _ambiguos)

    queries = []
    if empresa_nome and empresa_nome.strip():
        nome_limpo = re.sub(
            r'\b(Corporation|Corp|Incorporated|Inc|Limited|Ltd|Company|Co|'
            r'Group|Holdings|PLC|ETF|Fund|Trust|Bancorp|Mellon)\b\.?',
            '', empresa_nome, flags=re.IGNORECASE
        ).strip().strip(',').strip()
        if nome_limpo and len(nome_limpo) > 3:
            queries.append(nome_limpo)

    # Só adiciona ticker se não for ambíguo e ainda não tiver queries suficientes
    if not ticker_ambiguo and ticker_us not in queries:
        queries.append(ticker_us)

    if not queries:
        queries = [empresa_nome or ticker_us]

    noticias = []
    hdrs = {'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9'}
    for query in queries:
        url = (f"https://news.google.com/rss/search"
               f"?q={requests.utils.quote(query)}+stock&hl=en-US&gl=US&ceid=US:en")
        noticias += _buscar_rss(url, 'Google News', max_noticias, hdrs)
        if len(noticias) >= max_noticias:
            break
    return noticias[:max_noticias]


def _buscar_finviz(ticker_us, max_noticias=5):
    noticias = []
    headers  = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        resp = requests.get(f"https://finviz.com/quote.ashx?t={ticker_us}",
                            headers=headers, timeout=10)
        if resp.status_code != 200:
            return []
        matches   = re.findall(
            r'<a[^>]+href="(https?://[^"]+)"[^>]*class="[^"]*tab-link[^"]*"[^>]*>([^<]+)</a>',
            resp.text)
        datas_raw = re.findall(r'(\w{3}-\d{2}-\d{2}\s+\d{2}:\d{2}(?:AM|PM))', resp.text)
        for i, (link, titulo) in enumerate(matches[:max_noticias]):
            titulo = _limpar_html(titulo)
            if not titulo or len(titulo) < 10:
                continue
            data_fmt, dt_obj = _formatar_data(datas_raw[i]) if i < len(datas_raw) else ('', None)
            noticias.append({'titulo': titulo, 'link': link, 'data': data_fmt,
                             'dt': dt_obj, 'descricao': '',
                             'fonte': 'Finviz', 'fonte_real': 'Finviz'})
    except Exception:
        pass
    return noticias


def _analisar_sentimento_noticias(noticias, ticker_us, empresa_nome, variacao_dia=None):
    """Chama Claude API para análise de sentimento e resumo executivo das notícias."""
    if not noticias:
        return None
    try:
        import json as _json
        titulos_e_desc = "\n".join(
            f"- [{n['data']}] {n['titulo']}"
            + (f": {n['descricao'][:150]}" if n.get('descricao') else "")
            for n in noticias[:10])
        variacao_txt = f"(variação recente: {variacao_dia:+.2f}%)" if variacao_dia else ""
        prompt = (
            f"Você é analista financeiro especializado em BDRs e ações americanas.\n\n"
            f"Analise as notícias recentes sobre {empresa_nome} (ticker: {ticker_us}) {variacao_txt}:\n\n"
            f"{titulos_e_desc}\n\n"
            f'Responda APENAS com JSON válido sem texto fora, neste formato exato:\n'
            f'{{"sentimento":"POSITIVO|NEGATIVO|NEUTRO|MISTO","score":número -10 a 10,'
            f'"resumo":"2-3 frases em pt-BR sobre os temas e impacto no preço",'
            f'"fatores_alta":["fator1","fator2"],"fatores_baixa":["fator1","fator2"],'
            f'"palavras_chave":["p1","p2","p3"]}}'
        )
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"Content-Type": "application/json"},
            json={"model": "claude-sonnet-4-20250514", "max_tokens": 600,
                  "messages": [{"role": "user", "content": prompt}]},
            timeout=20)
        if resp.status_code != 200:
            return None
        texto = resp.json()['content'][0]['text'].strip()
        m = re.search(r'\{.*\}', texto, re.DOTALL)
        if not m:
            return None
        dados      = _json.loads(m.group())
        sentimento = dados.get('sentimento', 'NEUTRO')
        score      = float(dados.get('score', 0))
        resumo     = dados.get('resumo', '')
        fat_alta   = dados.get('fatores_alta', [])
        fat_baixa  = dados.get('fatores_baixa', [])
        palavras   = dados.get('palavras_chave', [])
        cfg = {
            'POSITIVO': ('#f0fdf4','#15803d','#dcfce7','📈','Sentimento Positivo'),
            'NEGATIVO': ('#fef2f2','#b91c1c','#fecaca','📉','Sentimento Negativo'),
            'NEUTRO'  : ('#f8fafc','#475569','#e2e8f0','➡️','Sentimento Neutro'),
            'MISTO'   : ('#fffbeb','#b45309','#fef3c7','⚖️','Sentimento Misto'),
        }
        bg, cor, badge, icone, label = cfg.get(sentimento, cfg['NEUTRO'])
        score_pct   = int((score + 10) / 20 * 100)
        cor_bar     = '#16a34a' if score > 2 else '#dc2626' if score < -2 else '#94a3b8'
        fat_alta_li = ''.join(f"<li>{f}</li>" for f in fat_alta[:3]) or '<li>—</li>'
        fat_baixa_li= ''.join(f"<li>{f}</li>" for f in fat_baixa[:3]) or '<li>—</li>'
        tags_html   = ' '.join(
            f"<span style='background:#e0e7ff;color:#3730a3;padding:0.1rem 0.4rem;"
            f"border-radius:999px;font-size:0.7rem;font-weight:600;'>{p}</span>"
            for p in palavras[:6])
        return f"""
        <div style='background:{bg};border:1px solid {badge};border-left:4px solid {cor};
                    border-radius:12px;padding:1rem 1.1rem;margin-bottom:1rem;'>
            <div style='display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;'>
                <span style='font-size:1.3rem;'>{icone}</span>
                <div style='flex:1;'>
                    <div style='font-weight:800;font-size:0.88rem;color:{cor};'>{label}</div>
                    <div style='background:#e2e8f0;border-radius:99px;height:5px;margin-top:0.2rem;'>
                        <div style='background:{cor_bar};width:{score_pct}%;height:5px;
                                    border-radius:99px;'></div></div>
                </div>
                <span style='font-size:0.78rem;font-weight:800;color:{cor};'>{score:+.1f}/10</span>
            </div>
            <p style='margin:0 0 0.6rem;font-size:0.84rem;color:#1e293b;line-height:1.55;'>
                🧠 <strong>Análise IA:</strong> {resumo}</p>
            <div style='display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.6rem;'>
                <div style='background:#f0fdf4;border-radius:8px;padding:0.5rem 0.65rem;'>
                    <div style='font-size:0.65rem;font-weight:700;color:#15803d;margin-bottom:0.25rem;'>
                        📈 Fatores de Alta</div>
                    <ul style='margin:0;padding-left:1rem;font-size:0.74rem;
                                color:#166534;line-height:1.5;'>{fat_alta_li}</ul>
                </div>
                <div style='background:#fef2f2;border-radius:8px;padding:0.5rem 0.65rem;'>
                    <div style='font-size:0.65rem;font-weight:700;color:#b91c1c;margin-bottom:0.25rem;'>
                        📉 Fatores de Baixa</div>
                    <ul style='margin:0;padding-left:1rem;font-size:0.74rem;
                                color:#991b1b;line-height:1.5;'>{fat_baixa_li}</ul>
                </div>
            </div>
            {f"<div style='margin-bottom:0.4rem;'>{tags_html}</div>" if tags_html else ""}
            <div style='font-size:0.63rem;color:#94a3b8;'>
                ⚡ Análise gerada por Claude AI · {len(noticias[:10])} notícias recentes</div>
        </div>"""
    except Exception:
        return None


@st.cache_data(ttl=900, show_spinner=False)
def buscar_noticias_com_traducao(ticker_us, empresa_nome=''):
    """
    Agrega 6 fontes em paralelo, filtra últimos 30 dias,
    ordena por data desc, deduplica por similaridade e traduz.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    # Palavras-chave para filtro de relevância
    # Regra: ticker US válido (≥3 chars não-ambíguo) + palavras-chave do nome da empresa
    _stopwords = {
        'corp','inc','ltd','company','group','holdings','corporation',
        'limited','incorporated','fund','etf','plc','the','and','for',
        'new','york','bank','trust','national','american','united','first',
    }
    _genericas = {
        'tech','technology','global','international','financial','capital',
        'services','systems','solutions','management','digital','energy',
        'health','care','pharma','medical','bio',
    }
    # Palavras comuns do inglês que causam falsos positivos quando usadas como ticker
    _palavras_comuns_ingles = {
        'bony','bone','ball','ally','bell','dell','ford','snap','coin',
        'dash','lyft','uber','zoom','open','view','link','mark','move',
        'peak','sale','seal','shop','sign','spin','star','stem','tern',
        'trip','type','unit','wave','wind','wire','work','zone',
    }

    palavras_chave = set()

    # Só adiciona o ticker US se tiver 3+ chars E não for palavra comum do inglês
    if len(ticker_us) >= 3 and ticker_us.lower() not in _palavras_comuns_ingles:
        palavras_chave.add(ticker_us.lower())

    # Palavras do nome da empresa (4+ letras, fora das stopwords)
    if empresa_nome:
        for w in empresa_nome.split():
            wc = re.sub(r'[^\w]', '', w)
            if (len(wc) >= 4
                    and wc.lower() not in _stopwords
                    and wc.lower() not in _genericas):
                palavras_chave.add(wc.lower())

    # Se palavras_chave ficou vazio (ticker curto + nome genérico), usa empresa_nome completo
    if not palavras_chave and empresa_nome:
        palavras_chave = {empresa_nome.lower()[:20]}

    # Garante que temos ao menos o ticker
    if not palavras_chave:
        palavras_chave = {ticker_us.lower()}

    tarefas = {
        'yahoo'       : lambda: _buscar_yahoo_rss(ticker_us, 10),
        'google'      : lambda: _buscar_google_news_rss(ticker_us, empresa_nome, 10),
        'gurufocus'   : lambda: _buscar_gurufocus_rss(ticker_us, 6),
        'seekingalpha': lambda: _buscar_seekingalpha_rss(ticker_us, 6),
        'marketwatch' : lambda: _buscar_marketwatch_rss(ticker_us, 5),
        'finviz'      : lambda: _buscar_finviz(ticker_us, 5),
    }
    resultados = {}
    with ThreadPoolExecutor(max_workers=6) as ex:
        fut_map = {ex.submit(fn): nome for nome, fn in tarefas.items()}
        for fut in as_completed(fut_map, timeout=15):
            nome = fut_map[fut]
            try:
                resultados[nome] = fut.result()
            except Exception:
                resultados[nome] = []

    todas = []
    for fonte in ['yahoo','google','gurufocus','seekingalpha','marketwatch','finviz']:
        todas += resultados.get(fonte, [])

    # ── Filtro de relevância ESTRITO ──────────────────────────────────────────────
    # Exige que ao menos UMA palavra-chave apareça no TÍTULO da notícia.
    # Isso elimina notícias que mencionam o ticker apenas de passagem no corpo.
    def _titulo_relevante(n):
        titulo_lower = n.get('titulo', '').lower()
        return any(p in titulo_lower for p in palavras_chave)

    # Filtro secundário: título OU (descrição + fonte_real) — mais permissivo
    def _rel_amplo(n):
        txt = (n.get('titulo','') + ' ' + n.get('descricao','') +
               ' ' + n.get('fonte_real','')).lower()
        return any(p in txt for p in palavras_chave)

    # Tenta filtro estrito primeiro; cai no amplo se poucos resultados
    relevantes_estritos = [n for n in todas if _titulo_relevante(n)]
    relevantes_amplos   = [n for n in todas if _rel_amplo(n)]

    if len(relevantes_estritos) >= 4:
        relevantes = relevantes_estritos
    elif len(relevantes_amplos) >= 3:
        relevantes = relevantes_amplos
    else:
        # Último fallback: usa tudo (ticker muito obscuro)
        relevantes = todas

    # Filtra últimos 30 dias
    agora    = datetime.utcnow()
    recentes = [n for n in relevantes
                if n.get('dt') is None or (agora - n['dt']).days <= 30]
    if len(recentes) < 3:
        recentes = relevantes

    # Ordena mais recente primeiro
    recentes.sort(key=lambda n: n['dt'] if n.get('dt') else datetime(2000,1,1),
                  reverse=True)

    # Deduplica
    vistos, unicas = set(), []
    for n in recentes:
        chave = re.sub(r'[^\w\s]','', n['titulo'].lower().strip())
        chave = re.sub(r'\s+',' ', chave)[:60]
        if chave and chave not in vistos:
            vistos.add(chave)
            unicas.append(n)

    unicas = unicas[:12]
    if not unicas:
        return []

    # Sentimento por manchete — calculado sobre o título ORIGINAL em inglês,
    # ANTES da tradução (o léxico financeiro é em inglês). Fica guardado no
    # dict e sobrevive à sobrescrita do título traduzido.
    for n in unicas:
        n['sentimento'] = _sentimento_manchete(n.get('titulo', ''))

    # Tradução paralela
    tit_trad = _traduzir_com_mymemory([n['titulo'] for n in unicas])
    for n, t in zip(unicas, tit_trad):
        if t: n['titulo'] = t

    descs_idx = [(i, n['descricao']) for i, n in enumerate(unicas) if n.get('descricao')]
    if descs_idx:
        indices, descs = zip(*descs_idx)
        descs_trad = _traduzir_com_mymemory(list(descs))
        for i, d in zip(indices, descs_trad):
            if d: unicas[i]['descricao'] = d

    return unicas




def _renderizar_card_noticia(noticia):
    """Renderiza card de notícia em HTML com design aprimorado."""
    titulo     = noticia.get('titulo', '')
    link       = noticia.get('link', '#')
    data       = noticia.get('data_str', noticia.get('data', ''))
    desc       = noticia.get('descricao', '')
    fonte      = noticia.get('fonte', '')
    fonte_real = noticia.get('fonte_real', '')

    cores = {
        'Yahoo Finance': ('#eff6ff', '#1d4ed8', '#dbeafe', '📊'),
        'Google News':   ('#f0f9ff', '#0369a1', '#e0f2fe', '🌐'),
        'Seeking Alpha': ('#f0fdf4', '#15803d', '#dcfce7', '📈'),
        'GuruFocus':     ('#fefce8', '#854d0e', '#fef9c3', '🧙'),
        'MarketWatch':   ('#fdf2f8', '#9d174d', '#fce7f3', '📺'),
        'Finviz':        ('#fdf4ff', '#7e22ce', '#f3e8ff', '🔍'),
    }
    bg, cor_fonte, badge_bg, icone = cores.get(fonte, ('#f8fafc', '#475569', '#e2e8f0', '📰'))
    label_fonte = f"{icone} {fonte_real}" if fonte_real and fonte == 'Google News' else f"{icone} {fonte}"

    # Badge de sentimento da manchete (finVADER léxico-financeiro), se disponível.
    sent = noticia.get('sentimento')
    sent_html = ""
    if sent:
        sent_html = (
            f"<span style='background:{sent['bg']};color:{sent['cor']};font-size:0.62rem;"
            f"font-weight:700;padding:0.12rem 0.5rem;border-radius:999px;white-space:nowrap;"
            f"flex-shrink:0;' title='Sentimento da manchete (score {sent['score']:+.2f})'>"
            f"{sent['emoji']} {sent['label']}</span>"
        )

    desc_html = (
        f"<p style='margin:0.35rem 0 0;font-size:0.8rem;color:#64748b;"
        f"line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;"
        f"-webkit-box-orient:vertical;overflow:hidden;'>{desc}</p>"
    ) if desc else ""

    html = f"""
    <div style='background:{bg};border:1px solid {badge_bg};
                border-left:3px solid {cor_fonte};
                border-radius:10px;padding:0.85rem 1rem;margin-bottom:0.6rem;'>
        <div style='display:flex;justify-content:space-between;
                    align-items:flex-start;gap:0.5rem;margin-bottom:0.25rem;'>
            <div style='display:flex;gap:0.35rem;flex-wrap:wrap;align-items:center;'>
                <span style='background:{badge_bg};color:{cor_fonte};font-size:0.65rem;
                             font-weight:700;padding:0.12rem 0.5rem;border-radius:999px;
                             white-space:nowrap;flex-shrink:0;'>{label_fonte}</span>
                {sent_html}
            </div>
            <span style='font-size:0.68rem;color:#94a3b8;white-space:nowrap;'>{data}</span>
        </div>
        <a href="{link}" target="_blank"
           style='font-size:0.88rem;font-weight:700;color:#1e293b;
                  text-decoration:none;line-height:1.35;display:block;'>{titulo}</a>
        {desc_html}
    </div>"""
    # Achata o HTML em uma única linha (troca quebra+indentação por espaço). Sem
    # indentação de 4+ espaços, o Markdown do Streamlit nunca interpreta o card
    # como bloco de código, mesmo que algum campo ainda traga conteúdo inesperado.
    return re.sub(r'\n\s*', ' ', html).strip()
