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
import math


def _tv_num(v, casas=None):
    """Converte para float com segurança (TradingView pode devolver None/NaN)."""
    try:
        if v is None:
            return None
        fv = float(v)
        if math.isnan(fv) or math.isinf(fv):
            return None
        return round(fv, casas) if casas is not None else fv
    except (TypeError, ValueError):
        return None


def _tv_rec_label(v):
    """Rótulo/cor a partir do Recommend.All do TradingView (-1 a +1)."""
    if v is None:
        return 'N/A', '#94a3b8'
    if   v >=  0.5: return 'FORTE COMPRA', '#15803d'
    elif v >=  0.1: return 'COMPRA',        '#16a34a'
    elif v >= -0.1: return 'NEUTRO',         '#b45309'
    elif v >= -0.5: return 'VENDA',          '#dc2626'
    else:           return 'FORTE VENDA',   '#7f1d1d'


# TradingView usa uma classificação de setores diferente do Yahoo; mapeia as mais
# comuns para as chaves de PEERS_POR_SETOR (senão os peers ficariam vazios).
_TV_SETOR_YAHOO = {
    'Technology Services': 'Technology', 'Electronic Technology': 'Technology',
    'Finance': 'Financial Services', 'Health Technology': 'Healthcare',
    'Health Services': 'Healthcare', 'Retail Trade': 'Consumer Cyclical',
    'Consumer Durables': 'Consumer Cyclical', 'Consumer Services': 'Consumer Cyclical',
    'Consumer Non-Durables': 'Consumer Defensive', 'Communications': 'Communication Services',
    'Energy Minerals': 'Energy', 'Producer Manufacturing': 'Industrials',
    'Industrial Services': 'Industrials', 'Transportation': 'Industrials',
    'Commercial Services': 'Industrials', 'Distribution Services': 'Industrials',
    'Utilities': 'Utilities', 'Process Industries': 'Basic Materials',
    'Non-Energy Minerals': 'Basic Materials',
}


def _buscar_tv_screener(ticker_us, mercado='america'):
    """Dados REAIS do TradingView para o ticker, no mesmo formato do dict do
    painel — incluindo a recomendação oficial (Recommend.All).

    ``mercado`` seleciona o screener: ``'america'`` para o ativo subjacente de
    um BDR nos EUA; ``'brazil'`` para um ativo nativo da B3 (ação/FII/ETF).
    Retorna ``None`` se a lib/consulta falhar (o chamador cai no yfinance)."""
    try:
        from tradingview_screener import Query, col
    except Exception:
        return None

    # Núcleo (técnicos + recomendação) — campos bem estabelecidos.
    campos_core = [
        'name', 'close', 'open', 'high', 'low', 'volume', 'change',
        'Recommend.All', 'Recommend.MA', 'Recommend.Other',
        'RSI', 'RSI[1]', 'Stoch.K', 'Stoch.D', 'CCI20', 'ADX',
        'MACD.macd', 'MACD.signal',
        'SMA20', 'SMA50', 'SMA200', 'EMA20', 'EMA50',
        'BB.upper', 'BB.lower', 'ATR', 'Volatility.D',
        'relative_volume_10d_calc', 'average_volume_10d_calc',
        'market_cap_basic', 'price_earnings_ttm',
        'sector', 'industry', 'price_52_week_high', 'price_52_week_low',
    ]
    # Fundamentais extras (nomes menos garantidos): P/B, EPS e dividend yield.
    campos_full = campos_core + ['price_book_fq', 'earnings_per_share_basic_ttm', 'dividends_yield']

    df = None
    for campos in (campos_full, campos_core):
        try:
            _, _df = (
                Query()
                .select(*campos)
                .where(col('name') == ticker_us)
                .set_markets(mercado)
                .limit(1)
                .get_scanner_data()
            )
            if _df is not None and not _df.empty:
                df = _df
                break
        except Exception:
            continue
    if df is None or df.empty:
        return None

    r = df.iloc[0]
    def g(k, casas=None):
        return _tv_num(r.get(k), casas)

    close = g('close')
    if close is None:
        return None
    change = g('change', 2)
    prev = close / (1 + change / 100) if (change is not None and change != -100) else close
    change_abs = _tv_num(close - prev, 2) if prev else None

    macd = g('MACD.macd', 4)
    macd_sig = g('MACD.signal', 4)
    macd_hist = _tv_num((macd - macd_sig), 4) if (macd is not None and macd_sig is not None) else None

    rec_all = g('Recommend.All', 3)
    rec_lbl, rec_cor = _tv_rec_label(rec_all)

    sma20, sma50, sma200 = g('SMA20'), g('SMA50'), g('SMA200')
    rsi_v, stk_v, cci_v = g('RSI', 1), g('Stoch.K', 1), g('CCI20', 1)

    # Contagem de sinais (mesma lógica do caminho yfinance) para o cartão "SINAIS".
    buys = sum([
        1 if (rsi_v is not None and rsi_v < 45) else 0,
        1 if (close and sma20 and close > sma20) else 0,
        1 if (close and sma50 and close > sma50) else 0,
        1 if (close and sma200 and close > sma200) else 0,
        1 if (macd_hist is not None and macd_hist > 0) else 0,
        1 if (stk_v is not None and stk_v < 50) else 0,
        1 if (cci_v is not None and cci_v < 0) else 0,
    ])
    sells = sum([
        1 if (rsi_v is not None and rsi_v > 55) else 0,
        1 if (close and sma20 and close < sma20) else 0,
        1 if (close and sma50 and close < sma50) else 0,
        1 if (close and sma200 and close < sma200) else 0,
        1 if (macd_hist is not None and macd_hist < 0) else 0,
        1 if (stk_v is not None and stk_v > 50) else 0,
        1 if (cci_v is not None and cci_v > 0) else 0,
    ])
    neutral = max(0, 7 - buys - sells)

    setor_tv = str(r.get('sector') or '').strip()
    setor = _TV_SETOR_YAHOO.get(setor_tv, setor_tv)

    return {
        'erro': None, 'fonte': 'TradingView', 'ticker': ticker_us,
        'close': g('close', 2), 'open': g('open', 2),
        'high': g('high', 2), 'low': g('low', 2),
        'volume': g('volume', 0), 'change_pct': change, 'change_abs': change_abs,
        'sma20': g('SMA20', 2), 'sma50': g('SMA50', 2), 'sma200': g('SMA200', 2),
        'ema20': g('EMA20', 2), 'ema50': g('EMA50', 2),
        'rsi': rsi_v, 'rsi_prev': g('RSI[1]', 1),
        'macd': macd, 'macd_signal': macd_sig, 'macd_hist': macd_hist,
        'stoch_k': stk_v, 'stoch_d': g('Stoch.D', 1),
        'cci': cci_v, 'adx': g('ADX', 1),
        'bb_upper': g('BB.upper', 2), 'bb_lower': g('BB.lower', 2),
        'bb_basis': _tv_num((g('BB.upper') + g('BB.lower')) / 2, 2) if (g('BB.upper') is not None and g('BB.lower') is not None) else None,
        'vol_rel': g('relative_volume_10d_calc', 2), 'vol_avg10': g('average_volume_10d_calc', 0),
        'rec_val': rec_all, 'rec_label': rec_lbl, 'rec_cor': rec_cor,
        'rec_ma': g('Recommend.MA', 3), 'rec_outros': g('Recommend.Other', 3),
        'buys': buys, 'sells': sells, 'neutral': neutral, 'total_sinais': 7,
        'mktcap': g('market_cap_basic'), 'eps': g('earnings_per_share_basic_ttm', 2),
        'pe': g('price_earnings_ttm', 1), 'pb': g('price_book_fq', 2),
        'div_yield': g('dividends_yield', 2),   # TradingView já entrega em %
        'setor': setor, 'industria': str(r.get('industry') or '').strip(),
        'atr': g('ATR', 2), 'volatilidade': g('Volatility.D', 2),
        'max_52s': g('price_52_week_high', 2), 'min_52s': g('price_52_week_low', 2),
    }


@st.cache_data(ttl=300, show_spinner=False)
def buscar_dados_tradingview(ticker_us, ticker_bdr='', mercado='america'):
    """
    Busca os dados do painel. Tenta primeiro os dados REAIS do TradingView
    (incluindo a recomendação oficial Recommend.All) e, se falhar, cai para o
    yfinance com indicadores calculados localmente.

    ``mercado='america'`` consulta o ativo subjacente de um BDR nos EUA;
    ``mercado='brazil'`` consulta um ativo nativo da B3 (ação/FII/ETF), caso em
    que o fallback yfinance usa o sufixo ``.SA``.
    """
    # 1) Dados reais do TradingView
    _tv = _buscar_tv_screener(ticker_us, mercado=mercado)
    if _tv is not None:
        return _tv

    # 2) Fallback: yfinance + indicadores locais (estilo TradingView)
    try:
        from modules.yf_session import criar_ticker

        # Ativos nativos da B3 negociam com sufixo .SA no Yahoo.
        _yf_ticker = f'{ticker_us}.SA' if mercado == 'brazil' else f'{ticker_us}'
        t    = criar_ticker(_yf_ticker)
        hist = t.history(period='1y', interval='1d', auto_adjust=True)
        if hist.empty:
            return {'erro': f'Ticker {_yf_ticker} não encontrado no yfinance.'}

        # ── Fundamentais: tenta fast_info primeiro, depois .info ─────────────
        info = {}
        mktcap_val = None
        try:
            fi = t.fast_info
            mktcap_val = getattr(fi, 'market_cap', None)
        except Exception:
            pass
        try:
            info = t.info or {}
            if not mktcap_val:
                mktcap_val = info.get('marketCap')
        except Exception:
            # .info pode falhar com rate limit — usa fast_info como fallback
            try:
                fi = t.fast_info
                info = {
                    'marketCap':      getattr(fi, 'market_cap',       None),
                    'trailingEps':    getattr(fi, 'eps_trailing_12mo', None),
                    'trailingPE':     getattr(fi, 'pe_forward',        None),
                    'priceToBook':    None,
                    'dividendYield':  getattr(fi, 'dividend_yield',    None),
                    'sector':         '',
                    'industry':       '',
                }
                mktcap_val = info['marketCap']
            except Exception:
                pass

        close = hist['Close'].dropna()
        high  = hist['High'].dropna()
        low   = hist['Low'].dropna()
        vol   = hist['Volume'].dropna()

        def _r(v, d=2):
            try:
                fv = float(v)
                return None if str(fv) in ('nan','inf','-inf') else round(fv, d)
            except Exception:
                return None

        def _sma(s, n): return _r(s.rolling(n).mean().iloc[-1]) if len(s) >= n else None
        def _ema(s, n): return _r(s.ewm(span=n).mean().iloc[-1]) if len(s) >= n else None

        # ── Médias móveis ──────────────────────────────────────────────────────
        sma20  = _sma(close, 20);  sma50  = _sma(close, 50);  sma200 = _sma(close, 200)
        ema9   = _ema(close,  9);  ema20  = _ema(close, 20);  ema50  = _ema(close, 50)

        # ── RSI 14 ────────────────────────────────────────────────────────────
        delta = close.diff()
        g = delta.clip(lower=0).rolling(14).mean()
        l = (-delta.clip(upper=0)).rolling(14).mean()
        rsi_s = 100 - 100 / (1 + g / l.replace(0, float('nan')))
        rsi_v     = _r(rsi_s.iloc[-1], 1) if len(close) >= 15 else None
        rsi_prev  = _r(rsi_s.iloc[-2], 1) if len(close) >= 16 else None

        # ── MACD (12,26,9) ────────────────────────────────────────────────────
        ema12 = close.ewm(span=12).mean()
        ema26 = close.ewm(span=26).mean()
        ml = ema12 - ema26; ms = ml.ewm(span=9).mean(); mh = ml - ms
        macd_v  = _r(ml.iloc[-1], 4) if len(close) >= 26 else None
        macd_sv = _r(ms.iloc[-1], 4) if len(close) >= 26 else None
        macd_hv = _r(mh.iloc[-1], 4) if len(close) >= 26 else None

        # ── Bollinger Bands (20,2) ─────────────────────────────────────────────
        sb = close.rolling(20).mean(); std = close.rolling(20).std()
        bb_u  = _r((sb + std*2).iloc[-1]) if len(close) >= 20 else None
        bb_l  = _r((sb - std*2).iloc[-1]) if len(close) >= 20 else None
        bb_bv = _r(sb.iloc[-1])           if len(close) >= 20 else None

        # ── Estocástico K/D (14,3) ─────────────────────────────────────────────
        l14 = low.rolling(14).min(); h14 = high.rolling(14).max()
        stk_s = 100 * (close - l14) / (h14 - l14 + 1e-9)
        std_s = stk_s.rolling(3).mean()
        stk_v = _r(stk_s.iloc[-1], 1) if len(close) >= 14 else None
        std_v = _r(std_s.iloc[-1], 1) if len(close) >= 17 else None

        # ── CCI 20 ─────────────────────────────────────────────────────────────
        tp = (high + low + close) / 3
        cci_s = (tp - tp.rolling(20).mean()) / (0.015 * tp.rolling(20).std() + 1e-9)
        cci_v = _r(cci_s.iloc[-1], 1) if len(close) >= 20 else None

        # ── ADX 14 ─────────────────────────────────────────────────────────────
        plus_dm  = high.diff().clip(lower=0)
        minus_dm = (-low.diff()).clip(lower=0)
        tr = pd.concat([high-low, (high-close.shift()).abs(), (low-close.shift()).abs()],
                       axis=1).max(axis=1)
        atr14_s = tr.rolling(14).mean()
        plus_di  = 100 * plus_dm.rolling(14).mean()  / (atr14_s + 1e-9)
        minus_di = 100 * minus_dm.rolling(14).mean() / (atr14_s + 1e-9)
        dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di + 1e-9)
        adx_v  = _r(dx.rolling(14).mean().iloc[-1], 1) if len(close) >= 28 else None
        atr_v  = _r(atr14_s.iloc[-1]) if len(close) >= 14 else None

        # ── Volume relativo ────────────────────────────────────────────────────
        vol_avg = float(vol.rolling(10).mean().iloc[-1]) if len(vol) >= 10 else None
        vol_rel = _r(float(vol.iloc[-1]) / vol_avg, 2)  if vol_avg and vol_avg > 0 else None

        # ── Preço e variação ───────────────────────────────────────────────────
        preco     = float(close.iloc[-1])
        preco_ant = float(close.iloc[-2]) if len(close) >= 2 else preco
        var_pct   = (preco - preco_ant) / preco_ant * 100 if preco_ant else 0

        # ── Score de recomendação com pesos ──────────────────────────────────
        # Usa média ponderada em vez de contagem simples para evitar empate
        score_compra = score_venda = 0.0

        # RSI (peso 2) — sinal mais forte
        if rsi_v is not None:
            if   rsi_v < 30: score_compra += 2.0
            elif rsi_v < 45: score_compra += 1.0
            elif rsi_v > 70: score_venda  += 2.0
            elif rsi_v > 55: score_venda  += 1.0

        # Tendência de médias (peso 3 — mais importante)
        if sma20 and sma50 and sma200:
            if preco > sma20 > sma50 > sma200: score_compra += 3.0
            elif preco > sma50 > sma200:        score_compra += 2.0
            elif preco > sma200:                score_compra += 1.0
            elif preco < sma20 < sma50 < sma200:score_venda  += 3.0
            elif preco < sma50 < sma200:         score_venda  += 2.0
            elif preco < sma200:                 score_venda  += 1.0
        elif sma20 and sma50:
            if preco > sma20 > sma50: score_compra += 2.0
            elif preco < sma20 < sma50: score_venda += 2.0

        # MACD (peso 1.5)
        if macd_hv is not None:
            if macd_hv > 0: score_compra += 1.5
            else:           score_venda  += 1.5

        # Cruzamento MACD linha vs sinal (peso 1)
        if macd_v is not None and macd_sv is not None:
            if macd_v > macd_sv: score_compra += 1.0
            else:                score_venda  += 1.0

        # Estocástico (peso 1)
        if stk_v is not None:
            if   stk_v < 20: score_compra += 1.0
            elif stk_v > 80: score_venda  += 1.0

        # Bollinger (peso 0.5)
        if bb_u and bb_l:
            if preco < bb_l:  score_compra += 0.5
            elif preco > bb_u: score_venda += 0.5

        # CCI (peso 0.5)
        if cci_v is not None:
            if   cci_v < -100: score_compra += 0.5
            elif cci_v >  100: score_venda  += 0.5

        peso_total = score_compra + score_venda
        if peso_total > 0:
            rec_score = round((score_compra - score_venda) / peso_total, 3)
        else:
            rec_score = 0.0

        # Conta sinais individuais para exibição
        buys    = sum([
            1 if rsi_v and rsi_v < 45 else 0,
            1 if preco and sma20 and preco > sma20 else 0,
            1 if preco and sma50 and preco > sma50 else 0,
            1 if preco and sma200 and preco > sma200 else 0,
            1 if macd_hv and macd_hv > 0 else 0,
            1 if stk_v and stk_v < 50 else 0,
            1 if cci_v and cci_v < 0 else 0,
        ])
        sells   = sum([
            1 if rsi_v and rsi_v > 55 else 0,
            1 if preco and sma20 and preco < sma20 else 0,
            1 if preco and sma50 and preco < sma50 else 0,
            1 if preco and sma200 and preco < sma200 else 0,
            1 if macd_hv and macd_hv < 0 else 0,
            1 if stk_v and stk_v > 50 else 0,
            1 if cci_v and cci_v > 0 else 0,
        ])
        neutral = max(0, 7 - buys - sells)
        total_s = 7

        def _rec_label(v):
            if v is None: return 'N/A', '#94a3b8'
            if   v >=  0.4: return 'FORTE COMPRA', '#15803d'
            elif v >=  0.1: return 'COMPRA',        '#16a34a'
            elif v >= -0.1: return 'NEUTRO',         '#b45309'
            elif v >= -0.4: return 'VENDA',          '#dc2626'
            else:           return 'FORTE VENDA',   '#7f1d1d'

        rl, rc = _rec_label(rec_score)

        # ── 52 semanas ─────────────────────────────────────────────────────────
        max52 = _r(high.iloc[-252:].max()) if len(high) >= 30 else None
        min52 = _r(low.iloc[-252:].min())  if len(low)  >= 30 else None

        # ── Fundamentais ───────────────────────────────────────────────────────
        # mktcap_val já foi obtido no início (fast_info ou .info)
        eps_val  = info.get('trailingEps')
        pe_val   = _r(info.get('trailingPE'), 1)
        pb_val   = _r(info.get('priceToBook'), 2)
        div_raw  = info.get('dividendYield') or 0
        div_y    = round(float(div_raw) * 100, 2) if div_raw else None
        setor_v  = info.get('sector', '')   or ''
        indust_v = info.get('industry', '') or ''

        # Tenta fast_info se .info não trouxe dados
        if not eps_val or not pe_val:
            try:
                fi2 = t.fast_info
                if not pe_val:
                    pe_ft = getattr(fi2, 'pe_forward', None)
                    if pe_ft: pe_val = _r(pe_ft, 1)
            except Exception:
                pass

        return {
            'erro': None, 'fonte': 'yfinance', 'ticker': ticker_us,
            'close': _r(preco), 'open': _r(float(hist['Open'].iloc[-1])),
            'high':  _r(float(high.iloc[-1])), 'low': _r(float(low.iloc[-1])),
            'volume': _r(float(vol.iloc[-1]), 0), 'change_pct': _r(var_pct),
            'change_abs': _r(preco - preco_ant),
            'sma20': sma20, 'sma50': sma50, 'sma200': sma200,
            'ema20': ema20, 'ema50': ema50,
            'rsi': rsi_v, 'rsi_prev': rsi_prev,
            'macd': macd_v, 'macd_signal': macd_sv, 'macd_hist': macd_hv,
            'stoch_k': stk_v, 'stoch_d': std_v,
            'cci': cci_v, 'adx': adx_v,
            'bb_upper': bb_u, 'bb_lower': bb_l, 'bb_basis': bb_bv,
            'vol_rel': vol_rel, 'vol_avg10': _r(vol_avg, 0),
            'rec_val': rec_score, 'rec_label': rl, 'rec_cor': rc,
            'rec_ma': None, 'rec_outros': None,
            'buys': buys, 'sells': sells, 'neutral': neutral, 'total_sinais': total_s,
            'mktcap': mktcap_val, 'eps': eps_val,
            'pe': pe_val, 'pb': pb_val,
            'div_yield': div_y, 'setor': setor_v,
            'industria': indust_v,
            'atr': atr_v, 'volatilidade': None,
            'max_52s': max52, 'min_52s': min52,
        }
    except Exception as e:
        return {'erro': f'Erro ao buscar dados ({ticker_us}): {str(e)}'}


@st.cache_data(ttl=1800, show_spinner=False)
def buscar_peers_tradingview(setor, ticker_us_excluir, top_n=5):
    """
    Busca peers do mesmo setor via yfinance usando uma lista curada
    por setor (S&P 500 / NASDAQ 100 representativos).
    """
    PEERS_POR_SETOR = {
        'Technology':             ['AAPL','MSFT','NVDA','GOOGL','META','AMZN','AMD','INTC','AVGO','ORCL'],
        'Financial Services':     ['JPM','BAC','WFC','GS','MS','BLK','C','AXP','BK','USB'],
        'Healthcare':             ['JNJ','UNH','PFE','ABBV','MRK','TMO','ABT','BMY','AMGN','GILD'],
        'Consumer Cyclical':      ['TSLA','AMZN','HD','MCD','NKE','SBUX','TGT','LOW','BKNG','F'],
        'Communication Services': ['GOOGL','META','NFLX','DIS','CMCSA','T','VZ','TMUS','SNAP','RBLX'],
        'Industrials':            ['CAT','BA','HON','UPS','RTX','GE','MMM','LMT','DE','FDX'],
        'Consumer Defensive':     ['WMT','PG','KO','PEP','COST','PM','MO','CL','GIS','KMB'],
        'Energy':                 ['XOM','CVX','COP','EOG','SLB','PSX','VLO','MPC','OXY','PXD'],
        'Basic Materials':        ['LIN','APD','ECL','SHW','FCX','NEM','ALB','DD','PPG','NUE'],
        'Real Estate':            ['AMT','PLD','CCI','EQIX','SPG','O','VICI','DLR','PSA','AVB'],
        'Utilities':              ['NEE','DUK','SO','D','EXC','AEP','SRE','PCG','ED','ETR'],
    }

    candidatos = PEERS_POR_SETOR.get(setor, [])
    candidatos = [t for t in candidatos if t != ticker_us_excluir][:top_n + 2]

    if not candidatos:
        return []

    peers = []
    try:
        from modules.yf_session import baixar as _yf_baixar
        dfs = _yf_baixar(candidatos, period='5d', interval='1d',
                         auto_adjust=True, progress=False, timeout=15)
        if dfs.empty:
            return []
        if isinstance(dfs.columns, pd.MultiIndex):
            close_df = dfs['Close']
        else:
            close_df = dfs[['Close']]

        for ticker_p in candidatos:
            try:
                col_close = close_df[ticker_p] if ticker_p in close_df.columns else None
                if col_close is None or col_close.dropna().empty:
                    continue
                preco_p = float(col_close.dropna().iloc[-1])
                preco_ant_p = float(col_close.dropna().iloc[-2]) if len(col_close.dropna()) >= 2 else preco_p
                var_p = (preco_p - preco_ant_p) / preco_ant_p * 100 if preco_ant_p else 0

                # RSI rápido
                hist_p = col_close.dropna()
                rsi_p = None
                if len(hist_p) >= 5:
                    d = hist_p.diff()
                    g = d.clip(lower=0).mean(); l = (-d.clip(upper=0)).mean()
                    rsi_p = round(100 - 100/(1+g/(l+1e-9)), 1)

                # Recomendação simplificada
                def _rec_p(rsi):
                    if rsi is None: return '—'
                    if rsi < 35:  return '🟢 Compra'
                    if rsi > 65:  return '🔴 Venda'
                    return '🟡 Neutro'

                peers.append({
                    'ticker': ticker_p, 'preco': round(preco_p, 2),
                    'var_pct': round(var_p, 2), 'vol_rel': 1.0,
                    'rec': _rec_p(rsi_p), 'mktcap': 0, 'rsi': rsi_p or 50,
                })
                if len(peers) >= top_n:
                    break
            except Exception:
                continue
    except Exception:
        pass
    return peers


@st.cache_data(ttl=300, show_spinner=False)
def buscar_peers_tradingview(setor, ticker_us_excluir, top_n=6, mercado='america'):
    """
    Busca os principais peers do mesmo setor no TradingView,
    ordenados por volume relativo (momentum de mercado).

    ``mercado`` seleciona o screener ('america' para peers do ativo US de um
    BDR; 'brazil' para peers de um ativo nativo da B3).
    """
    try:
        from tradingview_screener import Query, col
        if not setor:
            return []
        _, df = (
            Query()
            .select('name', 'close', 'change', 'volume',
                    'relative_volume_10d_calc', 'Recommend.All',
                    'market_cap_basic', 'RSI')
            .where(
                col('sector') == setor,
                col('market_cap_basic') > 1_000_000_000,
                col('type') == 'stock',
            )
            .order_by('market_cap_basic', ascending=False)
            .limit(top_n + 2)
            .set_markets(mercado)
            .get_scanner_data()
        )
        peers = []
        for _, row in df.iterrows():
            nome = str(row.get('name', '')).split(':')[-1]
            if nome == ticker_us_excluir:
                continue
            def _rec(v):
                if v is None: return 'N/A'
                v = float(v)
                if v >= 0.5:  return '🟢 F.Compra'
                if v >= 0.1:  return '🟩 Compra'
                if v >= -0.1: return '🟡 Neutro'
                if v >= -0.5: return '🟥 Venda'
                return '🔴 F.Venda'
            peers.append({
                'ticker'  : nome,
                'preco'   : round(float(row.get('close', 0) or 0), 2),
                'var_pct' : round(float(row.get('change', 0) or 0), 2),
                'vol_rel' : round(float(row.get('relative_volume_10d_calc', 1) or 1), 2),
                'rec'     : _rec(row.get('Recommend.All')),
                'mktcap'  : float(row.get('market_cap_basic', 0) or 0),
                'rsi'     : round(float(row.get('RSI', 50) or 50), 1),
            })
            if len(peers) >= top_n:
                break
        return peers
    except Exception:
        return []


def renderizar_painel_tradingview(dados, ticker_us, empresa, peers=None):
    """Renderiza a seção TradingView Screener dentro de um st.expander."""
    with st.expander("📡 TradingView — Dados ao Vivo & Recomendação", expanded=False):

        if dados.get('erro'):
            st.warning(f"⚠️ {dados['erro']}")
            st.caption("Verifique se `tradingview-screener` está no requirements.txt")
            return

        rec_label  = dados['rec_label']
        rec_cor    = dados['rec_cor']
        rec_val    = dados.get('rec_val') or 0
        buys       = dados['buys']
        sells      = dados['sells']
        neutral    = dados['neutral']
        total_s    = dados['total_sinais']
        close      = dados['close']
        change_pct = dados.get('change_pct') or 0
        rsi        = dados.get('rsi')
        adx        = dados.get('adx')
        vol_rel    = dados.get('vol_rel') or 1.0

        fonte_dados = dados.get('fonte', 'yfinance')
        fonte_icon  = '📡' if 'TradingView' in fonte_dados else '📊'
        fonte_label = fonte_dados
        st.markdown(f"""
        <div style='background:#f8fafc;border:1px solid #e2e8f0;border-left:5px solid #667eea;
                    padding:0.85rem 1.2rem;border-radius:10px;margin-bottom:1rem;
                    display:flex;align-items:center;gap:0.8rem;'>
            <span style='font-size:1.7rem;'>{fonte_icon}</span>
            <div>
                <div style='color:#1e293b;font-weight:800;font-size:1rem;'>
                    {fonte_label} — {ticker_us} ({empresa})</div>
                <div style='color:#64748b;font-size:0.75rem;'>
                    {'Dados via API TradingView · github.com/shner-elmo/TradingView-Screener' if 'TradingView' in fonte_dados else 'Dados via yfinance · indicadores calculados localmente'}
                    · Atualizado a cada 5 min</div>
            </div>
        </div>""", unsafe_allow_html=True)

        # ── Linha 1: Recomendação + Sinais + Preço + Variação ─────────────────
        c1, c2, c3, c4 = st.columns(4)

        # Card Recomendação
        rec_pct = int((float(rec_val) + 1) / 2 * 100)
        with c1:
            st.markdown(f"""
            <div style='background:#131722;border:2px solid {rec_cor};
                        border-radius:10px;padding:0.85rem;text-align:center;min-height:120px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:0.62rem;font-weight:700;color:#787b86;
                            text-transform:uppercase;letter-spacing:.06em;margin-bottom:0.3rem;'>
                    Recomendação TV</div>
                <div style='font-size:1.1rem;font-weight:900;color:{rec_cor};line-height:1.1;'>
                    {rec_label}</div>
                <div style='background:#2a2e39;border-radius:99px;height:5px;margin:0.4rem 0;'>
                    <div style='background:{rec_cor};width:{rec_pct}%;height:5px;border-radius:99px;'></div></div>
                <div style='font-size:0.7rem;color:#787b86;'>
                    Score: {float(rec_val):+.2f} (−1 a +1)</div>
            </div>""", unsafe_allow_html=True)

        # Card sinais compra/venda/neutro
        buy_pct  = int(buys   / total_s * 100)
        sell_pct = int(sells  / total_s * 100)
        neu_pct  = 100 - buy_pct - sell_pct
        with c2:
            st.markdown(f"""
            <div style='background:#131722;border:1px solid #2a2e39;
                        border-radius:10px;padding:0.85rem;min-height:120px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:0.62rem;font-weight:700;color:#787b86;
                            text-transform:uppercase;margin-bottom:0.5rem;'>
                    Sinais ({total_s} indicadores)</div>
                <div style='display:flex;gap:2px;border-radius:4px;overflow:hidden;
                            height:8px;margin-bottom:0.5rem;'>
                    <div style='background:#26a69a;width:{buy_pct}%;'></div>
                    <div style='background:#787b86;width:{neu_pct}%;'></div>
                    <div style='background:#ef5350;width:{sell_pct}%;'></div>
                </div>
                <div style='display:flex;justify-content:space-between;font-size:0.72rem;'>
                    <span style='color:#26a69a;font-weight:700;'>🟢 {buys} compra</span>
                    <span style='color:#787b86;'>⚪ {neutral}</span>
                    <span style='color:#ef5350;font-weight:700;'>🔴 {sells} venda</span>
                </div>
            </div>""", unsafe_allow_html=True)

        # Card preço
        sinal_v  = '+' if change_pct >= 0 else ''
        cor_v    = '#26a69a' if change_pct >= 0 else '#ef5350'
        with c3:
            st.markdown(f"""
            <div style='background:#131722;border:1px solid #2a2e39;
                        border-radius:10px;padding:0.85rem;text-align:center;min-height:120px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:0.62rem;font-weight:700;color:#787b86;
                            text-transform:uppercase;margin-bottom:0.3rem;'>Preço (USD)</div>
                <div style='font-size:1.6rem;font-weight:900;color:#d1d4dc;'>
                    ${close:.2f}</div>
                <div style='font-size:0.9rem;font-weight:700;color:{cor_v};'>
                    {sinal_v}{change_pct:.2f}%</div>
                <div style='font-size:0.62rem;color:#787b86;margin-top:0.2rem;'>
                    H: ${dados.get("high") or 0:.2f} &nbsp;|&nbsp; L: ${dados.get("low") or 0:.2f}</div>
            </div>""", unsafe_allow_html=True)

        # Card volume relativo
        vol_rel_safe = vol_rel if vol_rel is not None else 1.0
        vol_cor = '#26a69a' if vol_rel_safe >= 1.5 else '#ef5350' if vol_rel_safe < 0.7 else '#787b86'
        vol_lbl = 'Volume alto' if vol_rel_safe >= 1.5 else 'Volume baixo' if vol_rel_safe < 0.7 else 'Volume normal'
        with c4:
            st.markdown(f"""
            <div style='background:#131722;border:1px solid #2a2e39;
                        border-radius:10px;padding:0.85rem;text-align:center;min-height:120px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:0.62rem;font-weight:700;color:#787b86;
                            text-transform:uppercase;margin-bottom:0.3rem;'>Vol. Relativo (10d)</div>
                <div style='font-size:1.6rem;font-weight:900;color:{vol_cor};'>
                    {vol_rel_safe:.2f}x</div>
                <div style='font-size:0.75rem;color:{vol_cor};font-weight:600;'>{vol_lbl}</div>
                <div style='font-size:0.62rem;color:#787b86;margin-top:0.2rem;'>
                    Média 10d: {int(dados.get("vol_avg10") or 0):,}</div>
            </div>""", unsafe_allow_html=True)

        st.markdown("<div style='height:0.7rem'></div>", unsafe_allow_html=True)

        # ── Linha 2: Indicadores técnicos — 4+4 para mobile ──────────────────
        st.markdown("**📊 Indicadores Técnicos:**")

        def _ind_card(col_st, nome, valor, unidade='', cor_fn=None, fmt='.1f'):
            """
            Renderiza card de indicador com cor semântica.
            cor_fn(valor) -> '#hex' para lógica customizada por indicador.
            """
            if valor is None:
                col_st.markdown(f"""
                <div style='background:#131722;border:1px solid #2a2e39;border-radius:8px;
                            padding:0.55rem;text-align:center;'>
                    <div style='font-size:0.62rem;color:#787b86;font-weight:600;
                                text-transform:uppercase;'>{nome}</div>
                    <div style='font-size:1rem;color:#787b86;'>N/A</div>
                </div>""", unsafe_allow_html=True)
                return
            try:
                val_fmt = f"{valor:{fmt}}{unidade}"
            except Exception:
                val_fmt = f"{valor}{unidade}"
            cor = cor_fn(float(valor)) if cor_fn else '#d1d4dc'
            col_st.markdown(f"""
            <div style='background:#131722;border:1px solid #2a2e39;border-radius:8px;
                        padding:0.55rem;text-align:center;'>
                <div style='font-size:0.62rem;color:#787b86;font-weight:600;
                            text-transform:uppercase;'>{nome}</div>
                <div style='font-size:1.1rem;font-weight:800;color:{cor};'>{val_fmt}</div>
            </div>""", unsafe_allow_html=True)

        # Funções de cor por indicador
        def _cor_rsi(v):
            if v < 30: return '#26a69a'
            if v > 70: return '#ef5350'
            if v < 45: return '#80cbc4'
            if v > 55: return '#ef9a9a'
            return '#d1d4dc'

        def _cor_stoch(v):
            if v < 20: return '#26a69a'
            if v > 80: return '#ef5350'
            return '#d1d4dc'

        def _cor_cci(v):
            if v < -100: return '#26a69a'
            if v > 100:  return '#ef5350'
            return '#d1d4dc'

        def _cor_adx(v):
            # ADX: acima de 25 = tendência forte (neutro), acima de 50 = muito forte
            if v > 50: return '#26a69a'
            if v > 25: return '#d1d4dc'
            return '#787b86'

        def _cor_macd(v):
            return '#26a69a' if v > 0 else '#ef5350'

        def _cor_atr(v):
            return '#d1d4dc'  # ATR: sem julgamento de valor

        # Linha 1 de indicadores (4 colunas)
        cols_ind1 = st.columns(4)
        _ind_card(cols_ind1[0], 'RSI 14',    dados.get('rsi'),       cor_fn=_cor_rsi)
        _ind_card(cols_ind1[1], 'Stoch K',   dados.get('stoch_k'),   cor_fn=_cor_stoch)
        _ind_card(cols_ind1[2], 'CCI 20',    dados.get('cci'),        cor_fn=_cor_cci,   fmt='.0f')
        _ind_card(cols_ind1[3], 'ADX',       dados.get('adx'),        cor_fn=_cor_adx)

        st.markdown("<div style='height:0.3rem'></div>", unsafe_allow_html=True)

        # Linha 2 de indicadores (4 colunas)
        cols_ind2 = st.columns(4)
        _ind_card(cols_ind2[0], 'MACD',      dados.get('macd'),       cor_fn=_cor_macd,  fmt='.3f')
        _ind_card(cols_ind2[1], 'MACD Hist', dados.get('macd_hist'),  cor_fn=_cor_macd,  fmt='.3f')
        _ind_card(cols_ind2[2], 'ATR',       dados.get('atr'),        cor_fn=_cor_atr)
        _ind_card(cols_ind2[3], 'Volat. D',  dados.get('volatilidade'), unidade='%', cor_fn=_cor_atr)

        st.markdown("<div style='height:0.5rem'></div>", unsafe_allow_html=True)

        # ── Linha 3: Médias móveis vs preço ───────────────────────────────────
        st.markdown("**📐 Médias Móveis vs Preço:**")
        cols_ma = st.columns(5)
        smas = [('SMA 20', dados.get('sma20')), ('SMA 50', dados.get('sma50')),
                ('SMA 200', dados.get('sma200')), ('EMA 20', dados.get('ema20')),
                ('EMA 50', dados.get('ema50'))]
        for col_st, (nome, val) in zip(cols_ma, smas):
            if val and close:
                acima   = close > val
                cor     = '#26a69a' if acima else '#ef5350'
                dist_pct = abs(close - val) / val * 100
                lbl     = f'▲ +{dist_pct:.1f}%' if acima else f'▼ -{dist_pct:.1f}%'
                col_st.markdown(f"""
                <div style='background:#131722;border:1px solid #2a2e39;border-radius:8px;
                            padding:0.5rem;text-align:center;'>
                    <div style='font-size:0.62rem;color:#787b86;font-weight:600;
                                text-transform:uppercase;'>{nome}</div>
                    <div style='font-size:0.95rem;font-weight:800;color:{cor};'>
                        ${val:.2f}</div>
                    <div style='font-size:0.62rem;color:{cor};'>{lbl}</div>
                </div>""", unsafe_allow_html=True)
            else:
                col_st.markdown(f"""
                <div style='background:#131722;border:1px solid #2a2e39;border-radius:8px;
                            padding:0.5rem;text-align:center;'>
                    <div style='font-size:0.62rem;color:#787b86;'>{nome}</div>
                    <div style='color:#787b86;'>N/A</div>
                </div>""", unsafe_allow_html=True)

        st.markdown("<div style='height:0.5rem'></div>", unsafe_allow_html=True)

        # ── Linha 4: Bollinger + 52 semanas + Fundamentais ────────────────────
        col_bb, col_52, col_fund = st.columns(3)

        # Bollinger Bands
        bb_u = dados.get('bb_upper'); bb_l = dados.get('bb_lower'); bb_b = dados.get('bb_basis')
        if bb_u and bb_l and close:
            bb_pct = (close - bb_l) / max(bb_u - bb_l, 1e-9) * 100
            bb_pos = ('Acima da banda superior 🔴' if close > bb_u else
                      'Abaixo da banda inferior 🟢' if close < bb_l else
                      f'%B: {bb_pct:.0f}% da banda')
            bb_cor = '#ef5350' if close > bb_u else '#26a69a' if close < bb_l else '#787b86'
        else:
            bb_pos, bb_cor = 'N/A', '#787b86'

        with col_bb:
            bb_u_str = f'${bb_u:.2f}' if bb_u else 'N/A'
            bb_b_str = f'${bb_b:.2f}' if bb_b else 'N/A'
            bb_l_str = f'${bb_l:.2f}' if bb_l else 'N/A'
            st.markdown(f"""
            <div style='background:#131722;border:1px solid #2a2e39;border-radius:8px;
                        padding:0.65rem 0.8rem;'>
                <div style='font-size:0.65rem;font-weight:700;color:#787b86;
                            text-transform:uppercase;margin-bottom:0.4rem;'>
                    Bollinger Bands (20,2)</div>
                <div style='font-size:0.78rem;color:#d1d4dc;'>
                    Superior: <strong>{bb_u_str}</strong></div>
                <div style='font-size:0.78rem;color:#d1d4dc;'>
                    Basis: <strong>{bb_b_str}</strong></div>
                <div style='font-size:0.78rem;color:#d1d4dc;'>
                    Inferior: <strong>{bb_l_str}</strong></div>
                <div style='font-size:0.72rem;font-weight:700;color:{bb_cor};margin-top:0.3rem;'>
                    {bb_pos}</div>
            </div>""", unsafe_allow_html=True)

        # 52 semanas
        max52 = dados.get('max_52s'); min52 = dados.get('min_52s')
        if max52 and min52 and close:
            pct_range = (close - min52) / max(max52 - min52, 1e-9) * 100
            dist_max  = (max52 - close) / close * 100
        else:
            pct_range = dist_max = None

        with col_52:
            max52_str   = f'${max52:.2f}' if max52 else 'N/A'
            min52_str   = f'${min52:.2f}' if min52 else 'N/A'
            range_bar   = (f'<div style="background:#2a2e39;border-radius:99px;height:6px;margin:0.4rem 0;">'
                           f'<div style="background:#2962ff;width:{pct_range:.0f}%;height:6px;border-radius:99px;"></div></div>'
                           if pct_range is not None else '')
            posicao_str = (f'Posição: {pct_range:.0f}% do range · {dist_max:.1f}% abaixo da máx'
                           if pct_range is not None else 'N/A')
            st.markdown(f"""
            <div style='background:#131722;border:1px solid #2a2e39;border-radius:8px;
                        padding:0.65rem 0.8rem;'>
                <div style='font-size:0.65rem;font-weight:700;color:#787b86;
                            text-transform:uppercase;margin-bottom:0.4rem;'>
                    Faixa 52 Semanas</div>
                <div style='font-size:0.78rem;color:#d1d4dc;'>
                    Máx: <strong style='color:#ef5350;'>{max52_str}</strong>
                    &nbsp;·&nbsp;
                    Mín: <strong style='color:#26a69a;'>{min52_str}</strong>
                </div>
                {range_bar}
                <div style='font-size:0.7rem;color:#787b86;'>
                    {posicao_str}
                </div>
            </div>""", unsafe_allow_html=True)

        # Fundamentais
        pe   = dados.get('pe');   pb  = dados.get('pb')
        eps  = dados.get('eps');  div = dados.get('div_yield')
        mktc = dados.get('mktcap')
        mktc_str = (f"${mktc/1e12:.2f}T" if mktc and mktc >= 1e12 else
                    f"${mktc/1e9:.1f}B"  if mktc and mktc >= 1e9  else
                    f"${mktc/1e6:.0f}M"  if mktc else 'N/A')
        pe_str  = f"{pe:.1f}"   if pe  else 'N/A'
        pb_str  = f"{pb:.2f}"   if pb  else 'N/A'
        eps_str = f"${eps:.2f}" if eps else 'N/A'
        div_str = f"{div:.2f}%" if div else 'N/A'
        with col_fund:
            st.markdown(f"""
            <div style='background:#131722;border:1px solid #2a2e39;border-radius:8px;
                        padding:0.65rem 0.8rem;'>
                <div style='font-size:0.65rem;font-weight:700;color:#787b86;
                            text-transform:uppercase;margin-bottom:0.4rem;'>
                    Fundamentais</div>
                <div style='display:grid;grid-template-columns:1fr 1fr;gap:0.2rem;
                            font-size:0.76rem;color:#d1d4dc;'>
                    <span>Market Cap:</span><strong>{mktc_str}</strong>
                    <span>P/E:</span><strong>{pe_str}</strong>
                    <span>P/B:</span><strong>{pb_str}</strong>
                    <span>EPS (TTM):</span><strong>{eps_str}</strong>
                    <span>Div. Yield:</span><strong>{div_str}</strong>
                </div>
                <div style='font-size:0.65rem;color:#787b86;margin-top:0.35rem;'>
                    {dados.get('setor','') or ''}</div>
            </div>""", unsafe_allow_html=True)

        # ── Linha 5: Peers do setor ────────────────────────────────────────────
        if peers:
            st.markdown("<div style='height:0.5rem'></div>", unsafe_allow_html=True)
            st.markdown(f"**👥 Principais Peers — {dados.get('setor','Mesmo setor')}:**")
            peer_cols = st.columns(len(peers))
            for col_p, peer in zip(peer_cols, peers):
                vc = '#26a69a' if peer['var_pct'] >= 0 else '#ef5350'
                col_p.markdown(f"""
                <div style='background:#131722;border:1px solid #2a2e39;border-radius:8px;
                            padding:0.55rem;text-align:center;'>
                    <div style='font-size:0.8rem;font-weight:800;color:#d1d4dc;'>
                        {peer['ticker']}</div>
                    <div style='font-size:0.85rem;font-weight:700;color:#d1d4dc;'>
                        ${peer['preco']:.2f}</div>
                    <div style='font-size:0.72rem;color:{vc};font-weight:600;'>
                        {'+' if peer['var_pct']>=0 else ''}{peer['var_pct']:.2f}%</div>
                    <div style='font-size:0.62rem;color:#787b86;'>
                        RSI {peer['rsi']}</div>
                    <div style='font-size:0.6rem;color:#787b86;'>
                        {peer['rec']}</div>
                </div>""", unsafe_allow_html=True)

        # ── Rodapé ────────────────────────────────────────────────────────────
        st.markdown(f"""
        <div style='margin-top:0.8rem;padding:0.6rem 0.9rem;background:#131722;
                    border-radius:8px;font-size:0.7rem;color:#787b86;'>
            📡 Fonte: TradingView API via <em>tradingview-screener</em> (PyPI) ·
            github.com/shner-elmo/TradingView-Screener · MIT License ·
            ⏱️ Cache: 5 min · ⚠️ Dados informativos — não constituem recomendação de investimento.
        </div>""", unsafe_allow_html=True)
