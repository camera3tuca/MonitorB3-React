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

def analisar_triple_screen(df_ticker):
    """
    Avalia a Estratégia Triple Screen de Alexander Elder nos dados diários da BDR.

    Como o nosso monitor trabalha apenas com timeframe diário (dados de 1 ano),
    adaptamos as três telas conforme a metodologia original de Elder:
      • 1ª Tela (Maré)     → EMA13 diária: inclinação define a tendência dominante
                              + MACD(12,26,9) histograma confirma direção
      • 2ª Tela (Onda)     → EFI(2): oscilador que detecta sobrevenda/sobrecompra
                              na correção dentro da tendência maior
      • 3ª Tela (Execução) → Buy/Sell Stop na máxima/mínima recente (sem indicador)

    Retorna dict com:
      tela1, tela2, tela3 — dicts com status, valor e descrição
      veredicto — "COMPRA", "VENDA" ou "AGUARDAR"
      forca     — int 0-3 (quantas telas confirmam)
    """
    try:
        close  = df_ticker['Close'].dropna()
        volume = df_ticker['Volume'].dropna()

        if len(close) < 30:
            return None

        # ── TELA 1: EMA13 + MACD(12,26,9) — identifica a MARÉ ───────────────────────
        # Elder original: slope da EMA13 semanal define a tendência dominante.
        # Adaptação para dados diários: EMA13 diária (≈ tendência de 2-3 semanas).
        # MACD(12,26,9) histograma reforça a direção.
        ema13 = close.ewm(span=13, adjust=False).mean()

        # Inclinação da EMA13 (últimas 3 barras para suavizar ruído)
        ema13_slope = ema13.iloc[-1] - ema13.iloc[-3]  # variação em 3 dias

        # MACD(12,26,9) histograma
        ema12       = close.ewm(span=12, adjust=False).mean()
        ema26       = close.ewm(span=26, adjust=False).mean()
        macd_line   = ema12 - ema26
        macd_signal = macd_line.ewm(span=9, adjust=False).mean()
        macd_hist   = macd_line - macd_signal
        macd_val    = macd_hist.iloc[-1]
        macd_slope  = macd_hist.iloc[-1] - macd_hist.iloc[-2]

        ema13_val   = ema13.iloc[-1]
        preco_ult   = close.iloc[-1]

        # Tendência confirmada por EMA13 (preço acima/abaixo) + inclinação + MACD
        alta_confirmada  = (ema13_slope > 0) and (macd_val > 0 or macd_slope > 0)
        baixa_confirmada = (ema13_slope < 0) and (macd_val < 0 or macd_slope < 0)

        pct_dist = ((preco_ult - ema13_val) / ema13_val) * 100  # distância % do preço à EMA13

        if alta_confirmada:
            tela1_status = "ALTA"
            tela1_emoji  = "🟢"
            tela1_desc   = (
                f"EMA13 com inclinação ascendente (+{ema13_slope:+.2f}) e "
                f"MACD(12,26,9) {'positivo' if macd_val > 0 else 'virando para cima'}. "
                f"Preço está {abs(pct_dist):.1f}% {'acima' if pct_dist >= 0 else 'abaixo'} da EMA13. "
                "A MARÉ está de alta — opere apenas compras, aguardando correções (ondas)."
            )
        elif baixa_confirmada:
            tela1_status = "BAIXA"
            tela1_emoji  = "🔴"
            tela1_desc   = (
                f"EMA13 com inclinação descendente ({ema13_slope:+.2f}) e "
                f"MACD(12,26,9) {'negativo' if macd_val < 0 else 'virando para baixo'}. "
                f"Preço está {abs(pct_dist):.1f}% {'abaixo' if pct_dist <= 0 else 'acima'} da EMA13. "
                "A MARÉ está de baixa — opere apenas vendas, aguardando repiques (ondas)."
            )
        else:
            tela1_status = "NEUTRO"
            tela1_emoji  = "🟡"
            tela1_desc   = (
                f"EMA13 sem direção clara (slope: {ema13_slope:+.2f}) ou "
                f"MACD(12,26,9) conflitante (histograma: {macd_val:+.4f}). "
                "Sinais divergentes — aguarde a maré se definir antes de agir."
            )

        # ── TELA 2: EFI(2) — identifica a ONDA (correção dentro da tendência) ────────
        # Elder recomenda o Force Index(2) como oscilador para a 2ª tela.
        # EFI2 = EMA(2) de [(Fechamento atual − Fechamento anterior) × Volume]
        idx_comum = close.index.intersection(volume.index)
        close_c   = close.loc[idx_comum]
        volume_c  = volume.loc[idx_comum]
        efi_bruto = close_c.diff() * volume_c
        efi2      = efi_bruto.ewm(span=2, adjust=False).mean()
        efi2_val  = efi2.iloc[-1]

        # Limiares dinâmicos baseados no desvio padrão histórico do EFI2
        efi2_std  = efi2.std()
        limiar_pos = efi2_std * 0.5   # sobrecompra
        limiar_neg = -efi2_std * 0.5  # sobrevenda

        if efi2_val < limiar_neg:
            tela2_status = "SOBREVENDA"
            tela2_emoji  = "🟢"
            # O contexto depende da MARÉ real (1ª Tela): só sobrevenda em maré de
            # ALTA é sinal de compra. Em maré de baixa, é possível continuação.
            if tela1_status == "ALTA":
                _ctx = "Como a maré (1ª Tela) está de alta, este é o momento de buscar entrada de COMPRA."
            elif tela1_status == "BAIXA":
                _ctx = ("⚠️ Mas a maré (1ª Tela) está de BAIXA: sobrevenda em tendência de baixa "
                        "NÃO é sinal de compra — pode ser continuação da queda. Elder recomenda "
                        "não operar contra a maré.")
            else:
                _ctx = "Aguarde a maré (1ª Tela) definir a direção antes de agir."
            tela2_desc = (
                f"EFI(2) = {efi2_val:,.0f} (abaixo do limiar {limiar_neg:,.0f}). "
                "A ONDA está em sobrevenda — compradores começando a absorver a pressão vendedora. "
                + _ctx
            )
        elif efi2_val > limiar_pos:
            tela2_status = "SOBRECOMPRA"
            tela2_emoji  = "🔴"
            if tela1_status == "BAIXA":
                _ctx = "Como a maré (1ª Tela) está de baixa, este é o momento de buscar saída/VENDA."
            elif tela1_status == "ALTA":
                _ctx = ("Mas a maré (1ª Tela) está de ALTA: sobrecompra em tendência de alta "
                        "costuma ser apenas um repique — pode continuar subindo, não é sinal de venda.")
            else:
                _ctx = "Aguarde a maré (1ª Tela) definir a direção antes de agir."
            tela2_desc = (
                f"EFI(2) = {efi2_val:,.0f} (acima do limiar {limiar_pos:,.0f}). "
                "A ONDA está em sobrecompra — vendedores começando a pressionar. "
                + _ctx
            )
        else:
            tela2_status = "NEUTRO"
            tela2_emoji  = "🟡"
            tela2_desc   = (
                f"EFI(2) = {efi2_val:,.0f} (zona neutra: {limiar_neg:,.0f} a {limiar_pos:,.0f}). "
                "Onda em território neutro — aguarde o EFI recuar para sobrevenda (para compra em uptrend) "
                "ou avançar para sobrecompra (para venda em downtrend)."
            )

        # ── TELA 3: EXECUÇÃO — Buy/Sell Stop (sem indicador, ação do preço) ──────────
        preco_atual = close.iloc[-1]
        maxima_rec  = df_ticker['High'].iloc[-5:].max()
        minima_rec  = df_ticker['Low'].iloc[-5:].min()

        if tela1_status == "ALTA" and tela2_status == "SOBREVENDA":
            tela3_status = "COMPRA"
            tela3_emoji  = "🚀"
            stop_loss   = round(minima_rec, 2)
            entrada_ref = round(maxima_rec, 2)
            tela3_desc  = (
                f"✅ Setup de COMPRA confirmado!\n"
                f"• Entrada (Buy Stop): acima de R$ {entrada_ref:.2f} "
                f"(máxima dos últimos 5 dias)\n"
                f"• Stop-Loss: R$ {stop_loss:.2f} "
                f"(mínima dos últimos 5 dias)\n"
                f"• Risco por cota: R$ {(entrada_ref - stop_loss):.2f}\n"
                f"• Lógica Elder: EMA13 de alta + EFI em sobrevenda = "
                "correção esgotada dentro de uptrend. Buy Stop garante que só entramos "
                "se o mercado confirmar a retomada."
            )
        elif tela1_status == "BAIXA" and tela2_status == "SOBRECOMPRA":
            tela3_status = "VENDA"
            tela3_emoji  = "📉"
            stop_loss   = round(maxima_rec, 2)
            entrada_ref = round(minima_rec, 2)
            tela3_desc  = (
                f"⚠️ Setup de VENDA confirmado!\n"
                f"• Entrada (Sell Stop): abaixo de R$ {entrada_ref:.2f} "
                f"(mínima dos últimos 5 dias)\n"
                f"• Stop-Loss: R$ {stop_loss:.2f} "
                f"(máxima dos últimos 5 dias)\n"
                f"• Risco por cota: R$ {(stop_loss - entrada_ref):.2f}\n"
                f"• Lógica Elder: EMA13 de baixa + EFI em sobrecompra = "
                "repique esgotado dentro de downtrend. Sell Stop garante que só entramos "
                "se o mercado confirmar a retomada da queda."
            )
        else:
            tela3_status = "AGUARDAR"
            tela3_emoji  = "⏳"
            pendente = []
            if tela1_status == "NEUTRO":
                pendente.append("1ª Tela: aguardar EMA13 definir direção + MACD confirmar")
            elif tela1_status == "ALTA" and tela2_status != "SOBREVENDA":
                pendente.append("2ª Tela: maré de alta confirmada — aguardar EFI(2) atingir sobrevenda")
            elif tela1_status == "BAIXA" and tela2_status != "SOBRECOMPRA":
                pendente.append("2ª Tela: maré de baixa confirmada — aguardar EFI(2) atingir sobrecompra")
            else:
                pendente.append("Telas 1 e 2 divergentes — aguardar alinhamento")
            tela3_desc = (
                "Setup incompleto. " + " | ".join(pendente) + ".\n"
                "Elder ensina: nunca entre no mercado sem as duas primeiras telas alinhadas. "
                "Paciência é parte da estratégia."
            )

        # Força: 1 ponto por tela alinhada na mesma direção
        forca = 0
        if tela1_status == "ALTA":      forca += 1
        if tela2_status == "SOBREVENDA": forca += 1
        if tela3_status == "COMPRA":    forca += 1

        return {
            'tela1': {'status': tela1_status, 'emoji': tela1_emoji,
                      'valor': round(ema13_slope, 4), 'desc': tela1_desc},
            'tela2': {'status': tela2_status, 'emoji': tela2_emoji,
                      'valor': round(efi2_val, 0), 'desc': tela2_desc},
            'tela3': {'status': tela3_status, 'emoji': tela3_emoji, 'desc': tela3_desc},
            'veredicto': tela3_status,
            'forca': forca,
            'preco_atual': round(preco_atual, 2),
            # Séries para mini-gráficos (últimos 60 dias)
            'serie_close': close.iloc[-60:],
            'serie_macd':  ema13.iloc[-60:],      # usamos EMA13 no mini-gráfico da 1ª tela
            'serie_efi2':  efi2.iloc[-60:],
            'limiar_pos':  limiar_pos,
            'limiar_neg':  limiar_neg,
            'maxima_rec':  round(maxima_rec, 2),
            'minima_rec':  round(minima_rec, 2),
        }

    except Exception:
        return None


def renderizar_triple_screen(resultado, ticker, empresa):
    """
    Renderiza o painel Triple Screen dentro de um st.expander.
    Totalmente isolado — não toca em nenhuma outra seção.
    """
    with st.expander("🖥️ Estratégia Triple Screen — Alexander Elder", expanded=False):

        if resultado is None:
            st.warning("⚠️ Dados insuficientes para calcular o Triple Screen.")
            return

        veredicto = resultado['veredicto']
        forca     = resultado['forca']
        t1        = resultado['tela1']
        t2        = resultado['tela2']
        t3        = resultado['tela3']

        # ── Cabeçalho explicativo (estilo claro e uniforme) ──────────────────────────
        st.markdown("""
        <div style='background:#f8fafc;border:1px solid #e2e8f0;border-left:5px solid #667eea;
                    padding:0.95rem 1.2rem;border-radius:10px;margin-bottom:1.2rem;'>
            <p style='margin:0;color:#475569;font-size:0.83rem;line-height:1.65;'>
                ℹ️ <strong style='color:#334155;'>Como funciona o Triple Screen:</strong>
                Criado por <strong>Alexander Elder</strong> em 1986, combina três "telas" em
                timeframes diferentes para filtrar ruído e confirmar tendências.
                A metáfora do oceano: negocie com a <em>maré</em>, não contra ela.<br><br>
                🌊 <strong style='color:#1e293b;'>1ª Tela — A Maré (EMA13 + MACD):</strong>
                A <strong>inclinação da EMA13</strong> define a tendência dominante —
                é a tela mais importante. O MACD(12,26,9) reforça a direção.
                Elder original usa EMA13 <em>semanal</em>;
                adaptamos para <em>diário</em> por ser nosso único timeframe.<br>
                🌀 <strong style='color:#1e293b;'>2ª Tela — A Onda (EFI 2):</strong>
                O <strong>Force Index(2)</strong> oscila dentro da tendência maior,
                identificando correções (sobrevenda em uptrend = oportunidade de compra)
                e repiques (sobrecompra em downtrend = oportunidade de venda).<br>
                🎯 <strong style='color:#1e293b;'>3ª Tela — A Execução:</strong>
                Sem indicador — usa a <em>ação do preço</em>.
                Buy Stop acima da máxima recente (compra) ou
                Sell Stop abaixo da mínima recente (venda).
                O mercado confirma o movimento — ou a ordem não é executada.
            </p>
        </div>""", unsafe_allow_html=True)

        # ── Veredicto geral ──────────────────────────────────────────────────────────
        cfg_v = {
            "COMPRA":   ("#d4edda", "#155724", "#28a745", "🚀", "SETUP DE COMPRA"),
            "VENDA":    ("#f8d7da", "#721c24", "#dc3545", "📉", "SETUP DE VENDA"),
            "AGUARDAR": ("#fff3cd", "#856404", "#ffc107", "⏳", "AGUARDAR ALINHAMENTO"),
        }
        bg_v, txt_v, brd_v, ico_v, lbl_v = cfg_v[veredicto]

        estrelas = "⭐" * forca + "☆" * (3 - forca)
        st.markdown(f"""
        <div style='background:{bg_v};border:2px solid {brd_v};border-radius:12px;
                    padding:1.1rem 1.4rem;margin-bottom:1.2rem;
                    display:flex;align-items:center;gap:1rem;'>
            <div style='font-size:2.4rem;'>{ico_v}</div>
            <div>
                <div style='font-size:1.2rem;font-weight:800;color:{txt_v};'>{lbl_v}</div>
                <div style='font-size:0.82rem;color:{txt_v};margin-top:0.2rem;'>
                    Força do sinal: {estrelas} &nbsp;({forca}/3 telas alinhadas)
                    &nbsp;|&nbsp; {ticker} — {empresa}
                </div>
            </div>
        </div>""", unsafe_allow_html=True)

        # ── Três painéis das telas + mini-gráficos ──────────────────────────────────
        col1, col2, col3 = st.columns(3)

        cfg_s = {
            "ALTA":        ("#e8f5e9", "#1b5e20", "#43a047"),
            "BAIXA":       ("#ffebee", "#b71c1c", "#e53935"),
            "NEUTRO":      ("#fffde7", "#f57f17", "#fbc02d"),
            "SOBREVENDA":  ("#e8f5e9", "#1b5e20", "#43a047"),
            "SOBRECOMPRA": ("#ffebee", "#b71c1c", "#e53935"),
            "COMPRA":      ("#e8f5e9", "#1b5e20", "#43a047"),
            "VENDA":       ("#ffebee", "#b71c1c", "#e53935"),
            "AGUARDAR":    ("#fffde7", "#f57f17", "#fbc02d"),
        }

        serie_close  = resultado['serie_close']
        serie_macd   = resultado['serie_macd']
        serie_efi2   = resultado['serie_efi2']
        limiar_pos   = resultado['limiar_pos']
        limiar_neg   = resultado['limiar_neg']
        maxima_rec   = resultado['maxima_rec']
        minima_rec   = resultado['minima_rec']
        preco_atual  = resultado['preco_atual']

        for col, tela, num, nome, subtitulo in [
            (col1, t1, "1ª", "Maré",    "EMA13 + MACD(12,26,9)"),
            (col2, t2, "2ª", "Onda",    "EFI(2)"),
            (col3, t3, "3ª", "Execução","Buy/Sell Stop"),
        ]:
            bg_s, txt_s, brd_s = cfg_s.get(tela['status'], ("#f5f5f5","#333","#999"))
            if 'valor' in tela:
                v = tela['valor']
                if abs(v) < 1:
                    valor_fmt = f"{v:+.5f}"
                elif abs(v) >= 1000:
                    valor_fmt = f"{int(v):,}".replace(",", ".")
                else:
                    valor_fmt = f"{v:+.4f}"
            with col:
                valor_linha = (
                    f"<div style='font-size:0.74rem;color:{txt_s};margin-top:0.25rem;"
                    f"font-family:monospace;'>{valor_fmt}</div>"
                ) if 'valor' in tela else ""
                # Card de status
                st.markdown(f"""
                <div style='background:{bg_s};border:1.5px solid {brd_s};
                            border-radius:10px 10px 0 0;padding:0.75rem 0.9rem 0.5rem;'>
                    <div style='font-size:0.68rem;font-weight:700;color:{brd_s};
                                letter-spacing:.08em;text-transform:uppercase;'>
                        {num} TELA — {nome.upper()}
                    </div>
                    <div style='font-size:0.65rem;color:{txt_s};margin-bottom:0.4rem;'>
                        {subtitulo}
                    </div>
                    <div style='display:flex;align-items:center;gap:0.4rem;'>
                        <span style='font-size:1.3rem;line-height:1;'>{tela['emoji']}</span>
                        <span style='font-size:0.9rem;font-weight:800;color:{txt_s};'>
                            {tela['status']}
                        </span>
                    </div>
                    {valor_linha}
                </div>""", unsafe_allow_html=True)

                # Mini-gráfico para cada tela
                fig_mini, ax_m = plt.subplots(figsize=(3.2, 1.6))
                fig_mini.patch.set_facecolor(bg_s)
                ax_m.set_facecolor(bg_s)

                if num == "1ª":
                    # EMA13 sobre preço — inclinação positiva = maré de alta
                    xs   = range(len(serie_close))
                    pr   = serie_close.values
                    em13 = serie_macd.values   # serie_macd agora contém EMA13
                    cor_ema = brd_s
                    ax_m.plot(xs, pr,   color='#607d8b', linewidth=1.0,
                              alpha=0.6, label='Preço')
                    ax_m.plot(xs, em13, color=cor_ema, linewidth=2.0,
                              label='EMA13', zorder=3)
                    # Preenche acima/abaixo da EMA13
                    ax_m.fill_between(xs, pr, em13,
                                      where=(pr >= em13), alpha=0.15,
                                      color='#43a047', interpolate=True)
                    ax_m.fill_between(xs, pr, em13,
                                      where=(pr < em13),  alpha=0.15,
                                      color='#e53935', interpolate=True)
                    ax_m.set_title("EMA13 (Maré)", fontsize=7, color=txt_s, pad=3)

                elif num == "2ª":
                    # EFI(2) — histograma + limiares
                    xs = range(len(serie_efi2))
                    vals = serie_efi2.values
                    cores_b = [brd_s if v >= 0 else '#e53935' for v in vals]
                    ax_m.bar(xs, vals, color=cores_b, alpha=0.7, width=1.0)
                    ax_m.axhline(limiar_pos, color='#e53935', linewidth=0.9,
                                 linestyle='--', alpha=0.8)
                    ax_m.axhline(limiar_neg, color='#43a047', linewidth=0.9,
                                 linestyle='--', alpha=0.8)
                    ax_m.axhline(0, color='#90a4ae', linewidth=0.7, linestyle='-')
                    ax_m.set_title("EFI(2)", fontsize=7, color=txt_s, pad=3)

                else:
                    # Tela 3 — preço dos últimos 20 dias + faixas de Buy/Sell Stop
                    close_20 = serie_close.iloc[-20:]
                    xs = range(len(close_20))
                    vals = close_20.values
                    cor_linha = '#43a047' if t3['status'] == 'COMPRA' else \
                                '#e53935' if t3['status'] == 'VENDA' else '#f57f17'
                    ax_m.plot(xs, vals, color=cor_linha, linewidth=1.5, zorder=3)
                    ax_m.axhline(maxima_rec, color='#43a047', linewidth=1.0,
                                 linestyle='--', alpha=0.9,
                                 label=f'Buy Stop R${maxima_rec:.2f}')
                    ax_m.axhline(minima_rec, color='#e53935', linewidth=1.0,
                                 linestyle='--', alpha=0.9,
                                 label=f'Stop R${minima_rec:.2f}')
                    ax_m.axhline(preco_atual, color='#607d8b', linewidth=0.8,
                                 linestyle=':', alpha=0.7)
                    ax_m.fill_between(xs, maxima_rec, minima_rec,
                                      alpha=0.07, color=cor_linha)
                    ax_m.set_title("Preço + Stop", fontsize=7, color=txt_s, pad=3)

                for spine in ax_m.spines.values():
                    spine.set_visible(False)
                ax_m.set_xticks([])
                ax_m.tick_params(axis='y', labelsize=6, colors=txt_s, length=0)
                ax_m.yaxis.set_major_formatter(
                    plt.FuncFormatter(lambda v, _:
                        f'{v/1e6:.1f}M' if abs(v) >= 1e6 else
                        f'{v/1e3:.0f}K' if abs(v) >= 1e3 else
                        f'{v:.2f}'))
                plt.tight_layout(pad=0.3)
                st.pyplot(fig_mini)
                plt.close(fig_mini)

                # Borda inferior arredondada para fechar visualmente com o card
                st.markdown(f"""
                <div style='background:{bg_s};border:1.5px solid {brd_s};
                            border-top:none;border-radius:0 0 10px 10px;
                            height:6px;margin-top:-4px;'></div>
                """, unsafe_allow_html=True)

        # ── Detalhamento por tela ────────────────────────────────────────────────────
        st.markdown("<div style='height:0.8rem'></div>", unsafe_allow_html=True)

        for tela, num, icone, titulo in [
            (t1, "1ª", "🌊", "Tela — Identificação da Maré (EMA13 + MACD 12,26,9)"),
            (t2, "2ª", "🌀", "Tela — Sinal de Entrada pela Onda (EFI 2)"),
            (t3, "3ª", "🎯", "Tela — Execução (Ordem Stop)"),
        ]:
            bg_d, txt_d, _ = cfg_s.get(tela['status'], ("#f8fafc","#334155","#cbd5e1"))
            st.markdown(f"""
            <div style='background:{bg_d};border-left:4px solid;
                        border-color:{cfg_s.get(tela["status"],("","","#999"))[2]};
                        border-radius:0 8px 8px 0;padding:0.8rem 1rem;
                        margin-bottom:0.6rem;'>
                <div style='font-weight:700;font-size:0.88rem;color:{txt_d};
                            margin-bottom:0.35rem;'>{icone} {num} {titulo}</div>
                <div style='font-size:0.82rem;color:{txt_d};line-height:1.55;
                            white-space:pre-wrap;'>{tela['desc']}</div>
            </div>""", unsafe_allow_html=True)

        # ── Nota educacional ─────────────────────────────────────────────────────────
        st.markdown("""
        <div style='margin-top:0.8rem;padding:0.7rem 1rem;background:#eceff1;
                    border-radius:8px;font-size:0.76rem;color:#546e7a;line-height:1.5;'>
            📖 <strong>Importante:</strong> O Triple Screen foi concebido para múltiplos
            timeframes. Como este monitor usa apenas dados <em>diários</em>, a 1ª tela
            representa a tendência de <strong>médio prazo</strong> (últimas semanas) e a
            2ª tela a oscilação de <strong>curto prazo</strong> (últimos dias).
            Para máxima precisão, confirme sempre no gráfico semanal (1ª tela) e
            no gráfico horário (2ª tela) antes de executar qualquer ordem.
            &nbsp;|&nbsp;
            <a href="https://hw-br.online/education/triple-screen-strategy-3-steps-to-make-profit/"
               target="_blank" style='color:#0288d1;'>Leia o artigo completo ↗</a>
        </div>""", unsafe_allow_html=True)
