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

@st.cache_data(ttl=1800, show_spinner=False)
def _calcular_minervini_cached(ticker):
    """Wrapper cacheado para calcular_minervini."""
    try:
        from modules.yf_session import baixar as _yf_baixar
        df_raw = _yf_baixar(f"{ticker}.SA", period='1y', interval='1d',
                            auto_adjust=True, progress=False, timeout=30)
        if df_raw is None or df_raw.empty:
            return {'erro': 'Sem dados para análise Minervini.'}
        if isinstance(df_raw.columns, pd.MultiIndex):
            df_raw.columns = df_raw.columns.get_level_values(0)
        close = df_raw['Close'].dropna()
        df_raw['EMA20']  = close.ewm(span=20).mean()
        df_raw['RSI14']  = 50.0
        df_raw['Stoch_K']= 50.0
        sma20 = close.rolling(20).mean(); std20 = close.rolling(20).std()
        df_raw['BB_Lower'] = sma20 - std20*2
        df_raw['BB_Upper'] = sma20 + std20*2
        return calcular_minervini(df_raw.dropna(subset=['Close']), ticker)
    except Exception as e:
        return {'erro': f'Erro Minervini: {str(e)}'}


@st.cache_data(ttl=3600)
def _buscar_ibov():
    """Baixa o IBOV para usar como benchmark de Relative Strength."""
    try:
        from modules.yf_session import baixar as _yf_baixar
        df = _yf_baixar('^BVSP', period='1y', interval='1d',
                        auto_adjust=True, progress=False, timeout=30)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        return df['Close'].dropna()
    except Exception:
        return None


def calcular_minervini(df_ticker, ticker):
    """
    Calcula a análise completa de fase + Trend Template de Minervini para um BDR.

    Retorna dict com:
      fase            : int 1-4
      fase_nome       : str
      fase_cor        : str (hex)
      fase_desc       : str
      criterios       : list[dict]  — os 8 critérios do Trend Template
      criterios_ok    : int (0-8)
      score_forca     : float 0-100
      rs_score        : float 0-10
      rs_slope        : float
      stop_loss       : float
      stop_tipo       : str
      risco_pct       : float
      alvo_2r         : float
      alvo_3r         : float
      rr_ratio        : float
      sma50           : float
      sma150          : float
      sma200          : float
      max_52s         : float
      min_52s         : float
      regime_ibov     : str
      erro            : str | None
    """
    try:
        df = df_ticker.copy().sort_index()
        if 'Close' not in df.columns or len(df) < 60:
            return {'erro': 'Dados insuficientes (mín. 60 dias).'}

        close  = df['Close'].dropna()
        high   = df['High'].dropna()  if 'High'  in df.columns else close
        low    = df['Low'].dropna()   if 'Low'   in df.columns else close
        n      = len(close)

        # ── Médias móveis simples (SMA) ──────────────────────────────────────────
        def sma(s, w):
            return float(s.rolling(w).mean().iloc[-1]) if len(s) >= w else float('nan')

        sma50  = sma(close, 50)
        sma150 = sma(close, 150) if n >= 150 else sma(close, min(n, 100))
        sma200 = sma(close, 200) if n >= 200 else sma(close, min(n, 150))
        preco  = float(close.iloc[-1])

        # Slope da SMA200 (último mês vs 20 pregões atrás)
        if n >= 220:
            sma200_serie = close.rolling(200).mean().dropna()
            slope200 = (float(sma200_serie.iloc[-1]) - float(sma200_serie.iloc[-20])) / float(sma200_serie.iloc[-20]) * 100
        else:
            slope200 = 0.0

        # ── 52 semanas ────────────────────────────────────────────────────────────
        janela_52s = min(n, 252)
        max_52s = float(high.iloc[-janela_52s:].max())
        min_52s = float(low.iloc[-janela_52s:].min())

        # ── Classificação de Fase (Weinstein / Ryan) ──────────────────────────────
        # Fase 2 = sma50 > sma150 > sma200, tudo subindo, preço acima das três
        # Fase 1 = consolidação (sma50 ≈ sma200, preço oscilando)
        # Fase 3 = distribuição (sma50 começa cair, preço abaixo de sma50)
        # Fase 4 = queda (sma50 < sma200, ambas caindo)
        import math
        def _ok(v): return not (math.isnan(v) if isinstance(v, float) else False)

        if _ok(sma50) and _ok(sma150) and _ok(sma200):
            if sma50 > sma150 > sma200 and preco > sma50 and slope200 > 0:
                fase = 2
            elif sma50 < sma200 and slope200 < -0.5:
                fase = 4
            elif preco < sma50 and sma50 < sma150:
                fase = 3
            else:
                fase = 1
        else:
            fase = 1

        fases_cfg = {
            1: ('Base / Acumulação',  '#f59e0b', '⏸️ Ativo em consolidação. Ainda não confirma uptrend. Aguardar rompimento.'),
            2: ('Uptrend Confirmado', '#16a34a', '🚀 Fase de compra! Tendência confirmada com SMAs em cascata e preço acima de todas.'),
            3: ('Distribuição',       '#ea580c', '⚠️ Sinais de topo. Momentum fraquejando. Considere reduzir posição.'),
            4: ('Downtrend',          '#dc2626', '🔴 Tendência de baixa confirmada. Evitar compras. Aguardar nova base.'),
        }
        fase_nome, fase_cor, fase_desc = fases_cfg[fase]

        # ── Trend Template de Minervini (8 critérios) ────────────────────────────
        def c(ok, nome, detalhe):
            return {'ok': ok, 'nome': nome, 'detalhe': detalhe}

        criterios = [
            c(preco > sma150 and preco > sma200,
              'Preço > SMA150 e SMA200',
              f'Preço R${preco:.2f} vs SMA150 R${sma150:.2f} / SMA200 R${sma200:.2f}'),
            c(sma150 > sma200,
              'SMA150 > SMA200',
              f'SMA150 R${sma150:.2f} vs SMA200 R${sma200:.2f}'),
            c(slope200 > 0,
              'SMA200 em tendência de alta ≥ 1 mês',
              f'Slope SMA200: {slope200:+.2f}% no último mês'),
            c(_ok(sma50) and _ok(sma150) and _ok(sma200) and sma50 > sma150 > sma200,
              'SMA50 > SMA150 > SMA200 (cascata)',
              f'SMA50 R${sma50:.2f} > SMA150 R${sma150:.2f} > SMA200 R${sma200:.2f}'),
            c(preco > sma50,
              'Preço > SMA50',
              f'Preço R${preco:.2f} vs SMA50 R${sma50:.2f}'),
            c((preco - min_52s) / (min_52s + 1e-9) >= 0.25,
              'Preço ≥ 25% acima da mínima de 52 semanas',
              f'Mínima 52s: R${min_52s:.2f} | +{(preco/min_52s-1)*100:.1f}% acima'),
            c((max_52s - preco) / (max_52s + 1e-9) <= 0.25,
              'Preço dentro de 25% da máxima de 52 semanas',
              f'Máxima 52s: R${max_52s:.2f} | {(max_52s/preco-1)*100:.1f}% abaixo da máxima'),
            c(True, 'Relative Strength ≥ 7/10',
              'Calculado abaixo contra IBOV'),   # placeholder — atualizado após RS calc
        ]

        # ── Relative Strength vs IBOV ─────────────────────────────────────────────
        ibov = _buscar_ibov()
        rs_slope = 0.0
        rs_score = 5.0   # neutro como default
        if ibov is not None and len(ibov) >= 63:
            try:
                ibov_alinhado = ibov.reindex(close.index, method='ffill').dropna()
                comum = close.index.intersection(ibov_alinhado.index)
                if len(comum) >= 63:
                    s = close.loc[comum].iloc[-63:]
                    b = ibov_alinhado.loc[comum].iloc[-63:]
                    rs_ratio = (s / s.iloc[0]) / (b / b.iloc[0])
                    # slope linear normalizado
                    xs = np.arange(len(rs_ratio))
                    rs_slope = float(np.polyfit(xs, rs_ratio.values, 1)[0] * 63)
                    rs_score = float(np.clip((rs_slope + 0.3) / 0.6 * 10, 0, 10))
            except Exception:
                pass

        # Atualiza critério 8 com RS real
        rs_ok = rs_score >= 7.0
        criterios[7] = c(rs_ok,
                         'Relative Strength ≥ 7/10 vs IBOV',
                         f'RS Score: {rs_score:.1f}/10 | Slope 63d: {rs_slope:+.3f}')

        criterios_ok = sum(1 for cr in criterios if cr['ok'])

        # ── Score de Força (0-100, linear como o Ryan) ────────────────────────────
        # Fase (40 pts) + Trend Template (35 pts) + RS (15 pts) + posição 52s (10 pts)
        score_fase   = {1: 15, 2: 40, 3: 5, 4: 0}[fase]
        score_tt     = round(criterios_ok / 8 * 35, 1)
        score_rs     = round(rs_score / 10 * 15, 1)
        pct_52s      = (preco - min_52s) / max(max_52s - min_52s, 1e-9)   # 0=min, 1=max
        score_52s    = round(min(pct_52s, 1.0) * 10, 1)
        score_forca  = round(score_fase + score_tt + score_rs + score_52s, 1)

        # ── Stop Loss (ATR14 ou mínimo 20 dias, igual ao Ryan) ────────────────────
        if len(high) >= 14 and len(low) >= 14:
            tr = pd.concat([
                high - low,
                (high - close.shift(1)).abs(),
                (low  - close.shift(1)).abs()
            ], axis=1).max(axis=1)
            atr14 = float(tr.rolling(14).mean().iloc[-1])
            stop_atr   = preco - atr14 * 2.0
            stop_swing = float(low.iloc[-20:].min()) * 0.98
            stop_loss  = max(stop_atr, stop_swing)
            stop_tipo  = 'ATR×2' if stop_atr >= stop_swing else 'Mínimo 20d'
        else:
            stop_loss = preco * 0.92
            stop_tipo = 'Estimado (8%)'

        risco_pct = (preco - stop_loss) / preco * 100
        alvo_2r   = preco + (preco - stop_loss) * 2
        alvo_3r   = preco + (preco - stop_loss) * 3
        rr_ratio  = ((alvo_2r - preco) / max(preco - stop_loss, 1e-9))

        # ── Regime do IBOV ────────────────────────────────────────────────────────
        regime_ibov = 'Indisponível'
        if ibov is not None and len(ibov) >= 200:
            ib  = ibov.iloc[-1]
            ib50  = float(ibov.rolling(50).mean().iloc[-1])
            ib200 = float(ibov.rolling(200).mean().iloc[-1])
            if ib > ib50 > ib200:
                regime_ibov = '🟢 Fase 2 — Mercado em alta'
            elif ib < ib50 < ib200:
                regime_ibov = '🔴 Fase 4 — Mercado em queda'
            elif ib < ib50:
                regime_ibov = '🟠 Fase 3 — Distribuição'
            else:
                regime_ibov = '🟡 Fase 1 — Base / Consolidação'

        return {
            'erro'         : None,
            'fase'         : fase,
            'fase_nome'    : fase_nome,
            'fase_cor'     : fase_cor,
            'fase_desc'    : fase_desc,
            'criterios'    : criterios,
            'criterios_ok' : criterios_ok,
            'score_forca'  : score_forca,
            'rs_score'     : rs_score,
            'rs_slope'     : rs_slope,
            'stop_loss'    : round(stop_loss, 2),
            'stop_tipo'    : stop_tipo,
            'risco_pct'    : round(risco_pct, 2),
            'alvo_2r'      : round(alvo_2r, 2),
            'alvo_3r'      : round(alvo_3r, 2),
            'rr_ratio'     : round(rr_ratio, 2),
            'sma50'        : round(sma50, 2)  if _ok(sma50)  else None,
            'sma150'       : round(sma150, 2) if _ok(sma150) else None,
            'sma200'       : round(sma200, 2) if _ok(sma200) else None,
            'max_52s'      : round(max_52s, 2),
            'min_52s'      : round(min_52s, 2),
            'preco'        : round(preco, 2),
            'regime_ibov'  : regime_ibov,
        }

    except Exception as e:
        return {'erro': f'Erro na análise Minervini: {str(e)}'}


def renderizar_painel_minervini(resultado, ticker, empresa):
    """Renderiza a seção de Análise de Fase Minervini dentro de um st.expander."""
    with st.expander("📊 Análise de Fase — Metodologia Minervini / Weinstein", expanded=False):

        if resultado.get('erro'):
            st.warning(f"⚠️ {resultado['erro']}")
            return

        fase         = resultado['fase']
        fase_nome    = resultado['fase_nome']
        fase_cor     = resultado['fase_cor']
        fase_desc    = resultado['fase_desc']
        criterios    = resultado['criterios']
        crit_ok      = resultado['criterios_ok']
        score        = resultado['score_forca']
        rs_score     = resultado['rs_score']
        rs_slope     = resultado['rs_slope']
        stop_loss    = resultado['stop_loss']
        stop_tipo    = resultado['stop_tipo']
        risco_pct    = resultado['risco_pct']
        alvo_2r      = resultado['alvo_2r']
        alvo_3r      = resultado['alvo_3r']
        rr_ratio     = resultado['rr_ratio']
        sma50        = resultado['sma50']
        sma150       = resultado['sma150']
        sma200       = resultado['sma200']
        max_52s      = resultado['max_52s']
        min_52s      = resultado['min_52s']
        preco        = resultado['preco']
        regime_ibov  = resultado['regime_ibov']

        # ── Cabeçalho explicativo ─────────────────────────────────────────────────
        st.markdown(f"""
        <div style='background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);
                    padding:1rem 1.4rem;border-radius:12px;margin-bottom:1rem;'>
            <div style='display:flex;align-items:center;gap:0.8rem;margin-bottom:0.5rem;'>
                <span style='font-size:1.8rem;'>📊</span>
                <div>
                    <div style='color:#93c5fd;font-weight:800;font-size:1rem;'>
                        Trend Template — Mark Minervini (SEPA)</div>
                    <div style='color:#bfdbfe;font-size:0.78rem;'>
                        Fase Weinstein · 8 Critérios · RS vs IBOV · Stop ATR · R:R</div>
                </div>
            </div>
            <p style='margin:0;color:#bfdbfe;font-size:0.79rem;line-height:1.6;'>
                🧠 <strong style='color:#93c5fd;'>Metodologia:</strong>
                Baseada no sistema <em>Ryan</em> (github.com/camera3tuca/Ryan), que implementa o
                <strong>Trend Template de Mark Minervini</strong> — compra apenas ações em
                <strong>Fase 2 confirmada</strong> (SMA50 &gt; SMA150 &gt; SMA200 em cascata ascendente).
                Adaptado para BDRs com benchmark no <strong>IBOV</strong> em vez de SPY.
                Stop Loss calculado por <strong>ATR×2 ou mínimo de 20 pregões</strong>.
                Sinal de compra exige <strong>≥ 7 de 8 critérios</strong> e R:R ≥ 2:1.
            </p>
        </div>""", unsafe_allow_html=True)

        # ── Linha 1: Fase + Score + Regime IBOV ──────────────────────────────────
        c1, c2, c3 = st.columns(3)

        # Card de Fase
        fases_bg = {1:'#fef3c7', 2:'#f0fdf4', 3:'#fff7ed', 4:'#fef2f2'}
        with c1:
            st.markdown(f"""
            <div style='background:{fases_bg[fase]};border:2px solid {fase_cor};
                        border-left:6px solid {fase_cor};
                        padding:0.9rem 1rem;border-radius:10px;min-height:130px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:0.68rem;font-weight:700;color:#94a3b8;
                            text-transform:uppercase;letter-spacing:.06em;margin-bottom:0.3rem;'>
                    Fase de Weinstein</div>
                <div style='font-size:1.6rem;font-weight:900;color:{fase_cor};line-height:1.1;'>
                    Fase {fase}</div>
                <div style='font-size:0.85rem;font-weight:700;color:{fase_cor};
                            margin:0.2rem 0 0.4rem;'>{fase_nome}</div>
                <div style='font-size:0.7rem;color:#475569;line-height:1.4;'>{fase_desc}</div>
            </div>""", unsafe_allow_html=True)

        # Card de Score de Força
        cor_s = '#15803d' if score >= 70 else '#b45309' if score >= 45 else '#b91c1c'
        bg_s  = '#f0fdf4' if score >= 70 else '#fffbeb' if score >= 45 else '#fef2f2'
        label_s = ('COMPRA FORTE' if score >= 80 else 'BOM' if score >= 65
                   else 'NEUTRO' if score >= 45 else 'FRACO' if score >= 25 else 'EVITAR')
        barra_s = min(int(score), 100)
        with c2:
            st.markdown(f"""
            <div style='background:{bg_s};border:2px solid #e2e8f0;padding:0.9rem 1rem;
                        border-radius:10px;min-height:130px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:0.68rem;font-weight:700;color:#94a3b8;
                            text-transform:uppercase;letter-spacing:.06em;margin-bottom:0.3rem;'>
                    Score de Força</div>
                <div style='font-size:2rem;font-weight:900;color:{cor_s};line-height:1;'>
                    {score:.0f}/100</div>
                <div style='background:#e2e8f0;border-radius:99px;height:6px;margin:0.4rem 0;'>
                    <div style='background:{cor_s};width:{barra_s}%;height:6px;border-radius:99px;'></div></div>
                <div style='font-size:0.8rem;font-weight:700;color:{cor_s};'>{label_s}</div>
                <div style='font-size:0.65rem;color:#94a3b8;margin-top:0.2rem;'>
                    Fase(40)+TT(35)+RS(15)+52s(10)</div>
            </div>""", unsafe_allow_html=True)

        # Card Regime IBOV
        with c3:
            st.markdown(f"""
            <div style='background:#f8fafc;border:2px solid #e2e8f0;padding:0.9rem 1rem;
                        border-radius:10px;min-height:130px;
                        display:flex;flex-direction:column;justify-content:center;gap:0.5rem;'>
                <div style='font-size:0.68rem;font-weight:700;color:#94a3b8;
                            text-transform:uppercase;letter-spacing:.06em;'>
                    Regime de Mercado</div>
                <div style='font-size:0.9rem;font-weight:700;color:#1e293b;
                            line-height:1.4;'>{regime_ibov}</div>
                <div style='font-size:0.68rem;color:#94a3b8;'>
                    IBOV — benchmark local para RS</div>
                <div style='border-top:1px solid #e2e8f0;padding-top:0.4rem;
                            font-size:0.75rem;color:#334155;'>
                    RS vs IBOV (63d):
                    <strong style='color:{"#16a34a" if rs_score >= 7 else "#dc2626"}'>
                        {rs_score:.1f}/10</strong>
                    &nbsp;<span style='color:{"#16a34a" if rs_slope >= 0 else "#dc2626"}'>
                        ({rs_slope:+.3f} slope)</span>
                </div>
            </div>""", unsafe_allow_html=True)

        st.markdown("<div style='height:0.9rem'></div>", unsafe_allow_html=True)

        # ── Trend Template: checklist dos 8 critérios ─────────────────────────────
        st.markdown(f"**📋 Trend Template de Minervini — {crit_ok}/8 critérios atendidos:**")

        # Barra de progresso do template
        tt_pct = int(crit_ok / 8 * 100)
        tt_cor = '#16a34a' if crit_ok >= 7 else '#d97706' if crit_ok >= 5 else '#dc2626'
        tt_label = '✅ SINAL DE COMPRA' if crit_ok >= 7 else '⚠️ PARCIAL' if crit_ok >= 5 else '❌ NÃO ATENDE'
        st.markdown(f"""
        <div style='background:#f1f5f9;border-radius:8px;padding:0.6rem 0.8rem;
                    margin-bottom:0.7rem;display:flex;align-items:center;gap:0.8rem;'>
            <div style='flex:1;background:#e2e8f0;border-radius:99px;height:8px;'>
                <div style='background:{tt_cor};width:{tt_pct}%;height:8px;border-radius:99px;'></div>
            </div>
            <div style='font-size:0.82rem;font-weight:700;color:{tt_cor};white-space:nowrap;'>
                {crit_ok}/8 &nbsp;— {tt_label}</div>
        </div>""", unsafe_allow_html=True)

        # Grid de critérios em 2 colunas
        col_a, col_b = st.columns(2)
        for i, cr in enumerate(criterios):
            icone = '✅' if cr['ok'] else '❌'
            bg_cr = '#f0fdf4' if cr['ok'] else '#fef2f2'
            borda_cr = '#86efac' if cr['ok'] else '#fca5a5'
            cor_cr   = '#15803d' if cr['ok'] else '#b91c1c'
            html_cr = f"""
            <div style='background:{bg_cr};border:1px solid {borda_cr};border-radius:8px;
                        padding:0.55rem 0.7rem;margin-bottom:0.4rem;'>
                <div style='font-size:0.75rem;font-weight:700;color:{cor_cr};'>
                    {icone} {cr['nome']}</div>
                <div style='font-size:0.66rem;color:#64748b;margin-top:0.1rem;'>
                    {cr['detalhe']}</div>
            </div>"""
            if i % 2 == 0:
                col_a.markdown(html_cr, unsafe_allow_html=True)
            else:
                col_b.markdown(html_cr, unsafe_allow_html=True)

        st.markdown("<div style='height:0.6rem'></div>", unsafe_allow_html=True)

        # ── Linha 2: SMAs + 52s ───────────────────────────────────────────────────
        st.markdown("**📐 Médias Móveis e Níveis de Referência:**")
        mc1, mc2, mc3, mc4, mc5 = st.columns(5)
        def _sma_card(col, label, val, preco_atual):
            if val is None:
                col.markdown(f"<div style='text-align:center;font-size:0.7rem;color:#94a3b8;'>{label}<br>—</div>",
                             unsafe_allow_html=True)
                return
            # Preço ACIMA da SMA = bom (verde); abaixo = ruim (vermelho)
            acima = preco_atual > val
            cor   = '#15803d' if acima else '#b91c1c'
            label_pos = '▲ Preço acima' if acima else '▼ Preço abaixo'
            col.markdown(f"""
            <div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                        padding:0.5rem;text-align:center;'>
                <div style='font-size:0.65rem;color:#94a3b8;font-weight:700;
                            text-transform:uppercase;'>{label}</div>
                <div style='font-size:1rem;font-weight:800;color:{cor};'>R${val:.2f}</div>
                <div style='font-size:0.6rem;color:{cor};font-weight:600;'>
                    {label_pos}</div>
            </div>""", unsafe_allow_html=True)

        _sma_card(mc1, 'SMA 50',  sma50,  preco)
        _sma_card(mc2, 'SMA 150', sma150, preco)
        _sma_card(mc3, 'SMA 200', sma200, preco)
        mc4.markdown(f"""
        <div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                    padding:0.5rem;text-align:center;'>
            <div style='font-size:0.65rem;color:#94a3b8;font-weight:700;
                        text-transform:uppercase;'>Máx 52s</div>
            <div style='font-size:1rem;font-weight:800;color:#334155;'>R${max_52s:.2f}</div>
            <div style='font-size:0.6rem;color:#64748b;'>
                {(max_52s/preco-1)*100:.1f}% acima</div>
        </div>""", unsafe_allow_html=True)
        mc5.markdown(f"""
        <div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                    padding:0.5rem;text-align:center;'>
            <div style='font-size:0.65rem;color:#94a3b8;font-weight:700;
                        text-transform:uppercase;'>Mín 52s</div>
            <div style='font-size:1rem;font-weight:800;color:#334155;'>R${min_52s:.2f}</div>
            <div style='font-size:0.6rem;color:#64748b;'>
                {(preco/min_52s-1)*100:.1f}% acima</div>
        </div>""", unsafe_allow_html=True)

        st.markdown("<div style='height:0.6rem'></div>", unsafe_allow_html=True)

        # ── Linha 3: Stop Loss + Alvos + R:R ─────────────────────────────────────
        st.markdown("**🎯 Gestão de Risco (Ryan-style ATR):**")
        rc1, rc2, rc3, rc4 = st.columns(4)

        rc1.markdown(f"""
        <div style='background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;
                    padding:0.6rem;text-align:center;'>
            <div style='font-size:0.65rem;font-weight:700;color:#b91c1c;
                        text-transform:uppercase;'>Stop Loss</div>
            <div style='font-size:1.1rem;font-weight:900;color:#b91c1c;'>
                R${stop_loss:.2f}</div>
            <div style='font-size:0.62rem;color:#94a3b8;'>{stop_tipo}</div>
            <div style='font-size:0.68rem;color:#b91c1c;font-weight:600;
                        margin-top:0.2rem;'>Risco: {risco_pct:.1f}%</div>
        </div>""", unsafe_allow_html=True)

        rc2.markdown(f"""
        <div style='background:#f0fdf4;border:1px solid #86efac;border-radius:8px;
                    padding:0.6rem;text-align:center;'>
            <div style='font-size:0.65rem;font-weight:700;color:#15803d;
                        text-transform:uppercase;'>Alvo R:R 2:1</div>
            <div style='font-size:1.1rem;font-weight:900;color:#15803d;'>
                R${alvo_2r:.2f}</div>
            <div style='font-size:0.62rem;color:#94a3b8;'>+{(alvo_2r/preco-1)*100:.1f}% do preço atual</div>
        </div>""", unsafe_allow_html=True)

        rc3.markdown(f"""
        <div style='background:#f0fdf4;border:1px solid #86efac;border-radius:8px;
                    padding:0.6rem;text-align:center;'>
            <div style='font-size:0.65rem;font-weight:700;color:#15803d;
                        text-transform:uppercase;'>Alvo R:R 3:1</div>
            <div style='font-size:1.1rem;font-weight:900;color:#15803d;'>
                R${alvo_3r:.2f}</div>
            <div style='font-size:0.62rem;color:#94a3b8;'>+{(alvo_3r/preco-1)*100:.1f}% do preço atual</div>
        </div>""", unsafe_allow_html=True)

        rr_ok  = rr_ratio >= 2.0
        rr_cor = '#15803d' if rr_ok else '#b91c1c'
        rr_bg  = '#f0fdf4' if rr_ok else '#fef2f2'
        rr_brd = '#86efac' if rr_ok else '#fca5a5'
        rc4.markdown(f"""
        <div style='background:{rr_bg};border:1px solid {rr_brd};border-radius:8px;
                    padding:0.6rem;text-align:center;'>
            <div style='font-size:0.65rem;font-weight:700;color:{rr_cor};
                        text-transform:uppercase;'>R:R Atual</div>
            <div style='font-size:1.3rem;font-weight:900;color:{rr_cor};'>
                {rr_ratio:.1f}:1</div>
            <div style='font-size:0.68rem;font-weight:600;color:{rr_cor};'>
                {"✅ Favorável (≥2:1)" if rr_ok else "❌ Desfavorável (<2:1)"}</div>
        </div>""", unsafe_allow_html=True)

        # ── Rodapé com metodologia ────────────────────────────────────────────────
        st.markdown(f"""
        <div style='margin-top:0.8rem;padding:0.7rem 1rem;background:#f1f5f9;
                    border-radius:8px;font-size:0.74rem;color:#64748b;line-height:1.7;'>
            📚 <strong>Referências:</strong>
            Mark Minervini — <em>Trade Like a Stock Market Wizard</em> (2013) &nbsp;|&nbsp;
            Stan Weinstein — <em>Secrets for Profiting in Bull and Bear Markets</em> &nbsp;|&nbsp;
            Implementação: <em>github.com/camera3tuca/Ryan</em>
            <br>
            ⚠️ <strong>Atenção:</strong>
            Score e fase são indicadores técnicos. Não constituem recomendação de investimento.
            BDRs com menos de 150/200 pregões usam SMAs com janelas reduzidas.
        </div>""", unsafe_allow_html=True)
