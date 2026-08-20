"""
Flow.AI — aproximação do indicador de fluxo de big players.

Lógica:
  - Agressão compradora  = (Close - Low)  / (High - Low)
  - Agressão vendedora   = (High - Close) / (High - Low)
  - Agressão líquida     = compradora - vendedora  [-1, +1]
  - Volume relativo      = Volume / média_20 candles
  - Flow bruto           = agressão_líquida × volume_relativo
  - Flow acumulado (N)   = soma rolante dos últimos N candles
  - Sinal               Verde / Amarelo / Vermelho
"""

import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import warnings

warnings.filterwarnings("ignore")

# ── Parâmetros ──────────────────────────────────────────────────────────────
_JANELA_VOL   = 20    # períodos para média de volume
_JANELA_FLOW  = 5     # períodos para acumular flow
_LIMIAR_VOL   = 1.3   # volume relativo mínimo para sinal válido
_LIMIAR_COMP  = 1.5   # flow acumulado mínimo p/ sinal de compra
_LIMIAR_VEND  = -1.5  # flow acumulado máximo p/ sinal de venda
_HIST_VELAS   = 60    # candles exibidos no mini-gráfico


def calcular_flow(df_ticker: pd.DataFrame) -> pd.DataFrame | None:
    """
    Recebe DataFrame com colunas Close, High, Low, Open, Volume.
    Retorna DataFrame com colunas extras de flow ou None se dados insuficientes.
    """
    needed = {"Close", "High", "Low", "Open", "Volume"}
    if df_ticker is None or df_ticker.empty:
        return None
    if not needed.issubset(df_ticker.columns):
        return None

    df = df_ticker.copy()

    candle_range = df["High"] - df["Low"]
    candle_range = candle_range.replace(0, np.nan)

    df["buy_aggression"]  = (df["Close"] - df["Low"])  / candle_range
    df["sell_aggression"] = (df["High"]  - df["Close"]) / candle_range
    df["net_aggression"]  = df["buy_aggression"] - df["sell_aggression"]

    vol_media = df["Volume"].rolling(_JANELA_VOL, min_periods=5).mean()
    df["vol_ratio"] = df["Volume"] / vol_media.replace(0, np.nan)

    df["flow_raw"] = df["net_aggression"] * df["vol_ratio"]
    df["flow_cum"] = df["flow_raw"].rolling(_JANELA_FLOW, min_periods=1).sum()

    def _sinal(row):
        if pd.isna(row["flow_cum"]) or pd.isna(row["vol_ratio"]):
            return "amarelo"
        if row["flow_cum"] >= _LIMIAR_COMP and row["vol_ratio"] >= _LIMIAR_VOL:
            return "verde"
        if row["flow_cum"] <= _LIMIAR_VEND and row["vol_ratio"] >= _LIMIAR_VOL:
            return "vermelho"
        return "amarelo"

    df["flow_sinal"] = df.apply(_sinal, axis=1)
    return df.dropna(subset=["flow_cum"])


def _badge(sinal: str) -> str:
    cores = {
        "verde":    ("#00c853", "🟢 COMPRA"),
        "amarelo":  ("#ffd600", "🟡 AGUARDAR"),
        "vermelho": ("#d50000", "🔴 VENDA"),
    }
    cor, texto = cores.get(sinal, ("#888888", "⚪ —"))
    return (
        f'<span style="background:{cor};color:#fff;padding:6px 18px;'
        f'border-radius:20px;font-weight:700;font-size:1.1rem;">{texto}</span>'
    )


def _grafico_flow(df: pd.DataFrame, ticker: str):
    df_plot = df.tail(_HIST_VELAS).copy()

    fig, (ax_price, ax_flow) = plt.subplots(
        2, 1, figsize=(10, 5), sharex=True,
        gridspec_kw={"height_ratios": [3, 1]},
    )
    fig.patch.set_facecolor("#0e1117")
    for ax in (ax_price, ax_flow):
        ax.set_facecolor("#0e1117")
        ax.tick_params(colors="#aaaaaa")
        for spine in ax.spines.values():
            spine.set_edgecolor("#333333")

    # ── Preço com cor do sinal ───────────────────────────────────────────
    cores_map = {"verde": "#00c853", "amarelo": "#ffd600", "vermelho": "#d50000"}
    for i in range(1, len(df_plot)):
        cor = cores_map.get(df_plot["flow_sinal"].iloc[i], "#888888")
        ax_price.plot(
            df_plot.index[i - 1:i + 1],
            df_plot["Close"].iloc[i - 1:i + 1],
            color=cor, linewidth=1.8,
        )

    ax_price.set_ylabel("Preço (R$)", color="#cccccc", fontsize=9)
    ax_price.set_title(f"Flow.AI — {ticker}", color="#ffffff", fontsize=11, pad=8)

    # ── Flow acumulado ───────────────────────────────────────────────────
    flow = df_plot["flow_cum"].values
    cores_flow = [
        cores_map.get(s, "#888888") for s in df_plot["flow_sinal"]
    ]
    ax_flow.bar(df_plot.index, flow, color=cores_flow, alpha=0.8, width=0.8)
    ax_flow.axhline(_LIMIAR_COMP,  color="#00c853", linestyle="--", linewidth=0.8, alpha=0.6)
    ax_flow.axhline(_LIMIAR_VEND,  color="#d50000", linestyle="--", linewidth=0.8, alpha=0.6)
    ax_flow.axhline(0, color="#555555", linewidth=0.6)
    ax_flow.set_ylabel("Flow", color="#cccccc", fontsize=9)

    # Legenda
    patches = [
        mpatches.Patch(color="#00c853", label="Compra"),
        mpatches.Patch(color="#ffd600", label="Aguardar"),
        mpatches.Patch(color="#d50000", label="Venda"),
    ]
    ax_flow.legend(handles=patches, loc="upper left", fontsize=7,
                   facecolor="#1e1e1e", labelcolor="#cccccc", framealpha=0.6)

    plt.tight_layout(pad=0.5)
    return fig


def renderizar_painel_flow(df_ticker: pd.DataFrame, ticker: str, empresa: str):
    """
    Ponto de entrada chamado pelo app.py.
    df_ticker: DataFrame com colunas Close/High/Low/Open/Volume para um único ticker.
    """
    st.markdown("---")
    st.markdown(
        '<h3 class="section-header">🌊 Flow.AI — Fluxo de Big Players</h3>',
        unsafe_allow_html=True,
    )

    with st.expander("ℹ️ O que é o Flow.AI"):
        st.markdown("""
Estima a **pressão compradora vs. vendedora** analisando a posição do fechamento dentro de cada candle, ponderada pelo volume — uma aproximação do fluxo de grandes players.

- **Agressão compradora** = `(Fechamento − Mínima) / (Máxima − Mínima)`; **vendedora** = `(Máxima − Fechamento) / (Máxima − Mínima)`.
- O **fluxo líquido** (compra − venda) × volume relativo é acumulado numa janela, gerando o **sinal**: 🟢 compra · 🟡 aguardar · 🔴 venda.

> É um indicador **derivado do preço/volume** (não é o book real de ofertas). Use como confirmação de força do movimento, junto com as demais seções.
        """)

    df_flow = calcular_flow(df_ticker)

    if df_flow is None or df_flow.empty:
        st.info("Dados insuficientes para calcular o Flow.")
        return

    ultimo = df_flow.iloc[-1]
    sinal_atual = ultimo["flow_sinal"]

    # ── Linha de métricas ────────────────────────────────────────────────
    mc1, mc2, mc3, mc4 = st.columns(4)

    with mc1:
        st.markdown("**Sinal atual**")
        st.markdown(_badge(sinal_atual), unsafe_allow_html=True)

    with mc2:
        vr = ultimo.get("vol_ratio", 0) or 0
        st.metric("Volume relativo", f"{vr:.2f}×",
                  delta="surge" if vr >= _LIMIAR_VOL else "normal",
                  delta_color="normal" if vr >= _LIMIAR_VOL else "off")

    with mc3:
        fc = ultimo.get("flow_cum", 0) or 0
        st.metric("Flow acumulado (5 candles)", f"{fc:.2f}")

    with mc4:
        na = ultimo.get("net_aggression", 0) or 0
        label = "Compradores" if na > 0.1 else ("Vendedores" if na < -0.1 else "Neutro")
        st.metric("Agressão do último candle", f"{na:.2f}", delta=label,
                  delta_color="normal" if na > 0.1 else ("inverse" if na < -0.1 else "off"))

    # ── Gráfico ──────────────────────────────────────────────────────────
    fig = _grafico_flow(df_flow, ticker)
    st.pyplot(fig)
    plt.close(fig)

    # ── Histórico dos últimos 10 sinais ──────────────────────────────────
    with st.expander("📋 Histórico dos últimos 10 sinais de Flow"):
        hist = df_flow[["Close", "Volume", "vol_ratio", "flow_cum", "flow_sinal"]].tail(10).copy()
        hist.columns = ["Fechamento", "Volume", "Vol. Relativo", "Flow Acum.", "Sinal"]
        hist["Sinal"] = hist["Sinal"].map(
            {"verde": "🟢 Compra", "amarelo": "🟡 Aguardar", "vermelho": "🔴 Venda"}
        )
        hist.index = hist.index.strftime("%d/%m/%Y")
        st.dataframe(hist.iloc[::-1], width="stretch")

    st.caption(
        "⚠️ Aproximação de fluxo de ordens via OHLCV público. "
        "Não acessa book de ofertas ou tape real. Use como sinal auxiliar."
    )
