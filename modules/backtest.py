"""
Backtest do sinal do scanner.

Valida, sobre o histórico de preços, a estratégia que o próprio scanner usa
para apontar oportunidades (função ``gerar_sinal`` de ``modules.technical`` —
compra na correção dentro de tendência de alta). Em vez de só *afirmar* que um
sinal é bom, este módulo mede o que ele teria rendido: Win Rate, retorno vs
Buy & Hold, Sharpe, drawdown e número de operações.

O motor é reutilizável: recebe um DataFrame de histórico (OHLC + indicadores) e
devolve um dicionário de métricas. A renderização (``renderizar_backtest_scanner``)
importa o Streamlit de forma tardia, para o motor poder ser testado isolado.
"""

import numpy as np
import pandas as pd


# Classificações que o scanner considera "oportunidade de compra".
_CLASSIF_COMPRA = ("Alta", "Muito Alta")


def _rodar_engine(bt_df, entrada_arr, rsi_arr, exit_rsi, max_hold, cash, comissao):
    """Executa o backtest com a lib ``backtesting`` sobre um frame OHLC.

    ``entrada_arr`` (0/1) marca as barras em que o scanner apontaria compra;
    a saída ocorre quando o RSI recupera (>= ``exit_rsi``, alvo atingido) ou
    após ``max_hold`` barras (limite de permanência)."""
    from backtesting import Backtest, Strategy

    class _EstrategiaScanner(Strategy):
        def init(self):
            self._entrada = self.I(lambda: entrada_arr, name="sinal", plot=False)
            self._rsi = self.I(lambda: rsi_arr, name="rsi", plot=False)
            self._barra_entrada = 0

        def next(self):
            i = len(self.data) - 1
            if not self.position:
                if self._entrada[-1] > 0:
                    self.buy()
                    self._barra_entrada = i
            else:
                held = i - self._barra_entrada
                rsi_atual = self._rsi[-1]
                if (rsi_atual is not None and not np.isnan(rsi_atual)
                        and rsi_atual >= exit_rsi) or held >= max_hold:
                    self.position.close()

    bt = Backtest(bt_df, _EstrategiaScanner, cash=cash,
                  commission=comissao, finalize_trades=True)
    return bt.run()


def backtestar_scanner(historico_df, exit_rsi=55, max_hold=20,
                       cash=10000.0, comissao=0.001, min_barras=80):
    """Roda o backtest do sinal do scanner sobre ``historico_df``.

    Retorna um dicionário. Quando não é possível rodar (amostra curta, sem
    sinais, lib ausente), retorna ``{'ok': False, 'motivo': ...}`` — nunca
    levanta exceção para o chamador.
    """
    try:
        if historico_df is None or len(historico_df) < min_barras:
            return {"ok": False, "motivo": "historico_curto",
                    "amostra": 0 if historico_df is None else len(historico_df)}

        # Reusa a lógica de indicadores e de sinal do módulo técnico (fonte da
        # verdade — o backtest testa exatamente o que a tabela mostra).
        from modules.technical import _indicadores_basicos, gerar_sinal

        df = historico_df.copy()
        if "RSI14" not in df.columns or "EMA200" not in df.columns:
            df = _indicadores_basicos(df)

        # backtesting.py exige colunas Open/High/Low/Close capitalizadas.
        if "Open" not in df.columns:
            df["Open"] = df["Close"]
        for _c in ("High", "Low"):
            if _c not in df.columns:
                df[_c] = df["Close"]
        df = df.dropna(subset=["Open", "High", "Low", "Close"])
        if len(df) < min_barras:
            return {"ok": False, "motivo": "historico_curto", "amostra": len(df)}

        rsi_arr = df["RSI14"].to_numpy(dtype=float)

        # Reconstrói, barra a barra, a classificação do scanner.
        eh_compra = np.zeros(len(df), dtype=bool)
        for i in range(len(df)):
            try:
                _, _, classif, _ = gerar_sinal(df.iloc[i], df.iloc[: i + 1])
            except Exception:
                classif = "Baixa"
            eh_compra[i] = classif in _CLASSIF_COMPRA

        # Entrada por BORDA: compra só no instante em que a oportunidade
        # *aparece* (o sinal cruza para Alta/Muito Alta), não a cada barra em
        # que ele segue ligado. É assim que se age sobre o scanner — senão o
        # backtest vira "ficar sempre comprado" e só acumula corretagem.
        entrada = np.zeros(len(df), dtype=float)
        entrada[1:] = (eh_compra[1:] & ~eh_compra[:-1]).astype(float)
        if eh_compra[0]:
            entrada[0] = 1.0

        if entrada.sum() < 3:
            return {"ok": False, "motivo": "poucos_sinais", "amostra": len(df)}

        colunas = ["Open", "High", "Low", "Close"]
        if "Volume" in df.columns:
            colunas.append("Volume")
        bt_df = df[colunas].copy()

        stats = _rodar_engine(bt_df, entrada, rsi_arr, exit_rsi,
                              max_hold, cash, comissao)

        n_trades = int(stats.get("# Trades", 0))
        if n_trades == 0:
            return {"ok": False, "motivo": "sem_trades", "amostra": len(df)}

        def _f(chave, padrao=0.0):
            v = stats.get(chave, padrao)
            try:
                v = float(v)
                return padrao if np.isnan(v) else v
            except (TypeError, ValueError):
                return padrao

        retorno = _f("Return [%]")
        buyhold = _f("Buy & Hold Return [%]")
        return {
            "ok": True,
            "amostra": len(df),
            "n_trades": n_trades,
            "win_rate": _f("Win Rate [%]"),
            "retorno_pct": retorno,
            "buyhold_pct": buyhold,
            "vantagem_pct": retorno - buyhold,
            "sharpe": _f("Sharpe Ratio"),
            "max_dd_pct": _f("Max. Drawdown [%]"),
            "exposure_pct": _f("Exposure Time [%]"),
            "avg_trade_pct": _f("Avg. Trade [%]"),
            "best_trade_pct": _f("Best Trade [%]"),
            "worst_trade_pct": _f("Worst Trade [%]"),
        }
    except ImportError:
        return {"ok": False, "motivo": "lib_ausente"}
    except Exception as e:  # nunca quebra a página por causa do backtest
        return {"ok": False, "motivo": "erro", "detalhe": str(e)[:120]}


def renderizar_backtest_scanner(resultado, ticker, empresa):
    """Renderiza o card de backtest do sinal do scanner (estilo claro do app)."""
    import streamlit as st

    with st.expander("🔁 Backtest do Sinal (validação histórica)", expanded=False):
        st.markdown("""
ℹ️ Pega a **mesma regra** que o scanner usa para apontar oportunidades (compra na
**correção dentro de tendência de alta** — o sinal que aparece na tabela) e
aplica-a **para trás**, sobre o histórico de preços do ativo, simulando as
operações que teriam acontecido.

- **Entrada:** quando o sinal do scanner classificaria como *Alta* ou *Muito Alta*.
- **Saída:** quando o RSI recupera (alvo) ou após um limite de tempo no papel.
- **Buy & Hold:** o que você teria feito só comprando e segurando no mesmo período — a régua de comparação.

> ⚠️ É uma validação **indicativa**, não uma promessa. Backtest de **um** ativo
> com histórico curto tem baixa significância estatística; use como mais um
> filtro, junto com o resto da análise.
        """)

        if not resultado or not resultado.get("ok"):
            motivos = {
                "historico_curto": "histórico insuficiente para um backtest confiável",
                "poucos_sinais": "o sinal quase não apareceu neste ativo no período",
                "sem_trades": "nenhuma operação foi fechada no período",
                "lib_ausente": "biblioteca de backtest indisponível no ambiente",
                "erro": "não foi possível rodar o backtest agora",
            }
            motivo = (resultado or {}).get("motivo", "erro")
            amostra = (resultado or {}).get("amostra")
            extra = f" ({amostra} barras)" if amostra else ""
            st.info(f"🔁 Backtest indisponível para **{ticker}**: "
                    f"{motivos.get(motivo, motivos['erro'])}{extra}.")
            return

        r = resultado
        venceu = r["vantagem_pct"] > 0
        if venceu:
            bg, borda, cor = "#f0fdf4", "#86efac", "#15803d"
            icone, veredito = "✅", "O sinal superou o Buy & Hold no período"
        else:
            bg, borda, cor = "#fef2f2", "#fca5a5", "#b91c1c"
            icone, veredito = "⚠️", "O sinal NÃO superou o Buy & Hold no período"

        st.markdown(f"""
    <div style='background:{bg};border:1px solid {borda};border-left:4px solid {cor};
                border-radius:12px;padding:0.9rem 1.1rem;margin-bottom:0.9rem;'>
        <div style='display:flex;align-items:center;gap:0.5rem;'>
            <span style='font-size:1.3rem;'>{icone}</span>
            <div>
                <div style='font-weight:800;font-size:0.9rem;color:{cor};'>{veredito}</div>
                <div style='font-size:0.78rem;color:#64748b;'>
                    {r['n_trades']} operações simuladas · {r['amostra']} barras de histórico</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

        c1, c2, c3 = st.columns(3)
        c1.metric("🎯 Taxa de Acerto", f"{r['win_rate']:.0f}%")
        c2.metric("📈 Retorno do Sinal", f"{r['retorno_pct']:+.1f}%")
        c3.metric("🪙 Buy & Hold", f"{r['buyhold_pct']:+.1f}%",
                  delta=f"{r['vantagem_pct']:+.1f} p.p.")

        c4, c5, c6 = st.columns(3)
        c4.metric("⚖️ Sharpe", f"{r['sharpe']:.2f}")
        c5.metric("📉 Max Drawdown", f"{r['max_dd_pct']:.1f}%")
        c6.metric("⏱️ Tempo Exposto", f"{r['exposure_pct']:.0f}%")

        st.caption(
            f"Por operação — média {r['avg_trade_pct']:+.2f}% · "
            f"melhor {r['best_trade_pct']:+.2f}% · pior {r['worst_trade_pct']:+.2f}%. "
            "Custo de corretagem simulado: 0,1% por ordem."
        )


# ════════════════════════════════════════════════════════════════════════════
# Backtest da estratégia Triple Screen (Alexander Elder)
# ════════════════════════════════════════════════════════════════════════════

def _metricas_de_stats(stats, amostra):
    """Converte o objeto de estatísticas do ``backtesting`` num dict padrão,
    tratando NaN/ausências. Compartilhado pelos backtests que usam a engine."""
    def _f(chave, padrao=0.0):
        v = stats.get(chave, padrao)
        try:
            v = float(v)
            return padrao if np.isnan(v) else v
        except (TypeError, ValueError):
            return padrao

    retorno = _f("Return [%]")
    buyhold = _f("Buy & Hold Return [%]")
    return {
        "ok": True,
        "amostra": amostra,
        "n_trades": int(stats.get("# Trades", 0)),
        "win_rate": _f("Win Rate [%]"),
        "retorno_pct": retorno,
        "buyhold_pct": buyhold,
        "vantagem_pct": retorno - buyhold,
        "sharpe": _f("Sharpe Ratio"),
        "max_dd_pct": _f("Max. Drawdown [%]"),
        "exposure_pct": _f("Exposure Time [%]"),
        "avg_trade_pct": _f("Avg. Trade [%]"),
        "best_trade_pct": _f("Best Trade [%]"),
        "worst_trade_pct": _f("Worst Trade [%]"),
    }


def _rodar_engine_saida(bt_df, entrada_arr, sair_arr, max_hold, cash, comissao):
    """Engine genérica: compra quando ``entrada_arr`` marca (1) e fecha a posição
    quando ``sair_arr`` marca (1) ou após ``max_hold`` barras."""
    from backtesting import Backtest, Strategy

    class _EstrategiaSaida(Strategy):
        def init(self):
            self._entrada = self.I(lambda: entrada_arr, name="entrada", plot=False)
            self._sair = self.I(lambda: sair_arr, name="sair", plot=False)
            self._barra_entrada = 0

        def next(self):
            i = len(self.data) - 1
            if not self.position:
                if self._entrada[-1] > 0:
                    self.buy()
                    self._barra_entrada = i
            else:
                if self._sair[-1] > 0 or (i - self._barra_entrada) >= max_hold:
                    self.position.close()

    bt = Backtest(bt_df, _EstrategiaSaida, cash=cash,
                  commission=comissao, finalize_trades=True)
    return bt.run()


def backtestar_triple_screen(historico_df, max_hold=25, cash=10000.0,
                             comissao=0.001, min_barras=80):
    """Backtest do setup de COMPRA do Triple Screen (Elder), reusando
    ``analisar_triple_screen`` como fonte da verdade.

    - Entrada (por borda): quando o veredicto vira **COMPRA** (1ª Tela ALTA +
      2ª Tela SOBREVENDA).
    - Saída: quando a **maré** (1ª Tela) deixa de ser ALTA — Elder: saia quando
      a tendência dominante muda — ou após ``max_hold`` barras.
    - A cada barra, o Triple Screen é recalculado só com dados até ali (janela
      expansível), sem vazamento de futuro.
    """
    try:
        if historico_df is None or len(historico_df) < min_barras:
            return {"ok": False, "motivo": "historico_curto",
                    "amostra": 0 if historico_df is None else len(historico_df)}

        from modules.triple_screen import analisar_triple_screen

        df = historico_df.copy()
        if "Open" not in df.columns:
            df["Open"] = df["Close"]
        for _c in ("High", "Low"):
            if _c not in df.columns:
                df[_c] = df["Close"]
        df = df.dropna(subset=["Open", "High", "Low", "Close"])
        if len(df) < min_barras or "Volume" not in df.columns:
            return {"ok": False, "motivo": "historico_curto", "amostra": len(df)}

        n = len(df)
        # Reconstrói o veredicto e a maré (1ª Tela) barra a barra.
        eh_compra = np.zeros(n, dtype=bool)
        mare_alta = np.zeros(n, dtype=bool)
        for i in range(n):
            if i < 34:  # Triple Screen exige ~30 barras; antes disso não avalia
                continue
            try:
                res = analisar_triple_screen(df.iloc[: i + 1])
            except Exception:
                res = None
            if res:
                eh_compra[i] = res.get("veredicto") == "COMPRA"
                mare_alta[i] = res.get("tela1", {}).get("status") == "ALTA"

        # Entrada por BORDA (o setup COMPRA acaba de aparecer).
        entrada = np.zeros(n, dtype=float)
        entrada[1:] = (eh_compra[1:] & ~eh_compra[:-1]).astype(float)
        if entrada.sum() < 3:
            return {"ok": False, "motivo": "poucos_sinais", "amostra": n}

        # Saída: a maré deixou de ser ALTA.
        sair = (~mare_alta).astype(float)

        colunas = ["Open", "High", "Low", "Close", "Volume"]
        bt_df = df[colunas].copy()

        stats = _rodar_engine_saida(bt_df, entrada, sair, max_hold, cash, comissao)
        metricas = _metricas_de_stats(stats, n)
        if metricas["n_trades"] == 0:
            return {"ok": False, "motivo": "sem_trades", "amostra": n}
        return metricas
    except ImportError:
        return {"ok": False, "motivo": "lib_ausente"}
    except Exception as e:
        return {"ok": False, "motivo": "erro", "detalhe": str(e)[:120]}


def renderizar_backtest_triple_screen(resultado, ticker, empresa):
    """Card de backtest do Triple Screen (estilo claro do app)."""
    import streamlit as st

    with st.expander("🔁 Backtest do Triple Screen (validação histórica)", expanded=False):
        st.markdown("""
ℹ️ Aplica **para trás** o setup de **COMPRA** do Triple Screen (1ª Tela em alta +
2ª Tela em sobrevenda) sobre o histórico, simulando as operações que teriam
acontecido.

- **Entrada:** quando o veredicto vira *SETUP DE COMPRA*.
- **Saída:** quando a **maré** (1ª Tela) deixa de ser de alta — o próprio Elder
  manda sair quando a tendência dominante muda.
- **Buy & Hold:** a régua de comparação no mesmo período.

> ⚠️ Validação **indicativa**. Amostra de um ativo é estatisticamente fraca —
> use como mais um filtro, não como promessa.
        """)

        if not resultado or not resultado.get("ok"):
            motivos = {
                "historico_curto": "histórico insuficiente (ou sem volume) para um backtest confiável",
                "poucos_sinais": "o setup de compra quase não apareceu neste ativo no período",
                "sem_trades": "nenhuma operação foi fechada no período",
                "lib_ausente": "biblioteca de backtest indisponível no ambiente",
                "erro": "não foi possível rodar o backtest agora",
            }
            motivo = (resultado or {}).get("motivo", "erro")
            amostra = (resultado or {}).get("amostra")
            extra = f" ({amostra} barras)" if amostra else ""
            st.info(f"🔁 Backtest do Triple Screen indisponível para **{ticker}**: "
                    f"{motivos.get(motivo, motivos['erro'])}{extra}.")
            return

        r = resultado
        venceu = r["vantagem_pct"] > 0
        if venceu:
            bg, borda, cor = "#f0fdf4", "#86efac", "#15803d"
            icone, veredito = "✅", "O setup superou o Buy & Hold no período"
        else:
            bg, borda, cor = "#fef2f2", "#fca5a5", "#b91c1c"
            icone, veredito = "⚠️", "O setup NÃO superou o Buy & Hold no período"

        st.markdown(f"""
    <div style='background:{bg};border:1px solid {borda};border-left:4px solid {cor};
                border-radius:12px;padding:0.9rem 1.1rem;margin-bottom:0.9rem;'>
        <div style='display:flex;align-items:center;gap:0.5rem;'>
            <span style='font-size:1.3rem;'>{icone}</span>
            <div>
                <div style='font-weight:800;font-size:0.9rem;color:{cor};'>{veredito}</div>
                <div style='font-size:0.78rem;color:#64748b;'>
                    {r['n_trades']} operações simuladas · {r['amostra']} barras de histórico</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

        c1, c2, c3 = st.columns(3)
        c1.metric("🎯 Taxa de Acerto", f"{r['win_rate']:.0f}%")
        c2.metric("📈 Retorno do Setup", f"{r['retorno_pct']:+.1f}%")
        c3.metric("🪙 Buy & Hold", f"{r['buyhold_pct']:+.1f}%",
                  delta=f"{r['vantagem_pct']:+.1f} p.p.")

        c4, c5, c6 = st.columns(3)
        c4.metric("⚖️ Sharpe", f"{r['sharpe']:.2f}")
        c5.metric("📉 Max Drawdown", f"{r['max_dd_pct']:.1f}%")
        c6.metric("⏱️ Tempo Exposto", f"{r['exposure_pct']:.0f}%")

        st.caption(
            f"Por operação — média {r['avg_trade_pct']:+.2f}% · "
            f"melhor {r['best_trade_pct']:+.2f}% · pior {r['worst_trade_pct']:+.2f}%. "
            "Custo de corretagem simulado: 0,1% por ordem."
        )
