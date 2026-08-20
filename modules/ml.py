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

def _preparar_df_ml(ticker):
    """Baixa 1 ano da BDR e calcula os indicadores que o modelo consome.
    Compartilhado entre a previsão e o backtest. Retorna DataFrame ou None."""
    from modules.yf_session import baixar as _yf_baixar
    df_raw = _yf_baixar(f"{ticker}.SA", period='1y', interval='1d',
                        auto_adjust=True, progress=False, timeout=30)
    if df_raw is None or df_raw.empty:
        return None
    if isinstance(df_raw.columns, pd.MultiIndex):
        df_raw.columns = df_raw.columns.get_level_values(0)
    close = df_raw['Close'].dropna()
    df_raw['EMA20']    = close.ewm(span=20).mean()
    df_raw['EMA50']    = close.ewm(span=50).mean()
    df_raw['EMA200']   = close.ewm(span=200).mean()
    delta = close.diff()
    ganho = delta.clip(lower=0).rolling(14).mean()
    perda = (-delta.clip(upper=0)).rolling(14).mean()
    df_raw['RSI14']    = 100 - (100 / (1 + ganho / perda.replace(0, float('nan'))))
    sma20 = close.rolling(20).mean()
    std20 = close.rolling(20).std()
    df_raw['BB_Lower'] = sma20 - std20 * 2
    df_raw['BB_Upper'] = sma20 + std20 * 2
    ema12 = close.ewm(span=12).mean()
    ema26 = close.ewm(span=26).mean()
    macd  = ema12 - ema26
    df_raw['MACD_Hist'] = macd - macd.ewm(span=9).mean()
    return df_raw.dropna(subset=['Close'])


@st.cache_data(ttl=1800, show_spinner=False)
def _prever_preco_ml_cached(ticker, dias_previsao=5):
    """Wrapper cacheado para prever_preco_ml — evita re-treino a cada interação."""
    try:
        df = _preparar_df_ml(ticker)
        if df is None:
            return {'erro': 'Sem dados para o modelo.'}
        return prever_preco_ml(df, ticker, dias_previsao)
    except Exception as e:
        return {'erro': f'Erro no modelo ML: {str(e)}'}


@st.cache_data(ttl=1800, show_spinner=False)
def _backtestar_ml_cached(ticker):
    """Wrapper cacheado para backtestar_ml — o walk-forward é caro (retreinos),
    então cacheia por ticker."""
    try:
        df = _preparar_df_ml(ticker)
        if df is None:
            return {'ok': False, 'motivo': 'dados'}
        return backtestar_ml(df)
    except Exception as e:
        return {'ok': False, 'motivo': 'erro', 'detalhe': str(e)[:120]}


def _construir_features_ml(df_ticker):
    """Feature engineering + target compartilhados entre a previsão (prever_preco_ml)
    e o backtest walk-forward (backtestar_ml). Manter num só lugar garante que o
    backtest valide EXATAMENTE as mesmas features que o modelo em produção usa.

    Retorna ``(df, feature_cols)`` em caso de sucesso, ou ``(None, msg_erro)``.
    """
    df = df_ticker.copy().sort_index()

    # --- Colunas mínimas necessárias ---
    for col in ['Close', 'EMA20', 'RSI14']:
        if col not in df.columns:
            return None, f'Coluna {col} não encontrada nos dados.'

    df = df.dropna(subset=['Close', 'EMA20', 'RSI14'])

    if len(df) < 80:
        return None, 'Dados insuficientes para treinar o ensemble (mín. 80 dias).'

    close = df['Close']

    # ── Feature engineering (multi-period returns, inspirado no notebook) ──
    df['LogRet_1d']  = np.log(close).diff(1)
    df['LogRet_5d']  = np.log(close).diff(5)
    df['LogRet_15d'] = np.log(close).diff(15)
    df['LogRet_30d'] = np.log(close).diff(30)

    df['Volatil_10d'] = df['LogRet_1d'].rolling(10).std()
    df['Volatil_20d'] = df['LogRet_1d'].rolling(20).std()

    df['EMA_Dist20']  = (close - df['EMA20']) / df['EMA20']
    if 'EMA50' in df.columns:
        df['EMA_Dist50'] = (close - df['EMA50']) / df['EMA50']
    if 'EMA200' in df.columns:
        df['EMA_Dist200'] = (close - df['EMA200']) / df['EMA200']

    if 'BB_Upper' in df.columns and 'BB_Lower' in df.columns:
        bw = df['BB_Upper'] - df['BB_Lower']
        df['BB_pctB'] = (close - df['BB_Lower']) / bw.replace(0, np.nan)

    if 'MACD_Hist' in df.columns:
        df['MACD_Hist_norm'] = df['MACD_Hist'] / close

    # Target: retorno log do próximo dia
    df['Target_LogRet'] = df['LogRet_1d'].shift(-1)
    df = df.dropna()

    feature_cols = [c for c in [
        'LogRet_1d', 'LogRet_5d', 'LogRet_15d', 'LogRet_30d',
        'Volatil_10d', 'Volatil_20d',
        'RSI14', 'EMA_Dist20',
        'EMA_Dist50', 'EMA_Dist200',
        'BB_pctB', 'MACD_Hist_norm',
    ] if c in df.columns]

    return df, feature_cols


def _construir_candidatos_ml(n_train):
    """Constrói o dicionário de modelos candidatos do ensemble, com os mesmos
    hiperparâmetros usados em produção (dependem do tamanho do treino). Extraído
    para o backtest walk-forward treinar exatamente o mesmo ensemble."""
    from sklearn.linear_model import LinearRegression, ElasticNet
    from sklearn.ensemble import (GradientBoostingRegressor,
                                  RandomForestRegressor,
                                  ExtraTreesRegressor)
    # Menos estimadores + mais regularização + profundidade menor = menos overfitting
    pequeno = n_train < 150
    leaf_min = max(3, n_train // 30)
    return {
        'GradientBoosting': GradientBoostingRegressor(
            n_estimators=80 if pequeno else 150,
            learning_rate=0.08 if pequeno else 0.05,
            max_depth=2 if pequeno else 3,
            subsample=0.7,
            min_samples_leaf=leaf_min,
            random_state=42),
        'RandomForest': RandomForestRegressor(
            n_estimators=100,
            max_depth=3 if pequeno else 5,
            min_samples_leaf=leaf_min,
            max_features='sqrt',
            random_state=42, n_jobs=-1),
        'ExtraTrees': ExtraTreesRegressor(
            n_estimators=100,
            max_depth=3 if pequeno else 5,
            min_samples_leaf=leaf_min,
            max_features='sqrt',
            random_state=42, n_jobs=-1),
        'ElasticNet': ElasticNet(
            alpha=0.01 if pequeno else 0.001,
            l1_ratio=0.5, max_iter=5000),
        'LinearRegression': LinearRegression(),
    }


def backtestar_ml(df_ticker, refit_freq=21, custo=0.0005, min_teste=25):
    """Backtest WALK-FORWARD do sinal do ensemble de ML.

    A pergunta que o R²/RMSE não responde: **operar seguindo a previsão diária
    do modelo teria dado dinheiro?** Aqui medimos isso, sem vazamento de dados:

    - Janela expansível: em cada dia de teste ``t`` o modelo só enxerga dados
      até ``t`` (retreino a cada ``refit_freq`` pregões).
    - Previsão por MÉDIA do ensemble (evita o viés de escolher o "melhor" modelo
      olhando o próprio teste).
    - Regra: comprado (long) quando a previsão do próximo dia é positiva; fora do
      mercado caso contrário. Custo de ``custo`` por troca de posição.
    - Comparação com Buy & Hold no mesmo período de teste.

    Retorna dict de métricas ou ``{'ok': False, 'motivo': ...}`` — nunca levanta.
    """
    try:
        from sklearn.preprocessing import StandardScaler

        df, feature_cols = _construir_features_ml(df_ticker)
        if df is None:
            return {'ok': False, 'motivo': 'dados', 'detalhe': feature_cols}

        X = df[feature_cols].values
        y = df['Target_LogRet'].values  # log-retorno REALIZADO do próximo dia
        n = len(X)
        split = int(n * 0.80)
        n_teste = n - split
        if n_teste < min_teste:
            return {'ok': False, 'motivo': 'teste_curto', 'amostra': n, 'n_teste': n_teste}

        # ── Walk-forward: prevê cada dia do teste out-of-sample ───────────────
        preds = np.full(n_teste, np.nan)
        modelos = None
        scaler = None
        for j in range(n_teste):
            t = split + j
            if j % refit_freq == 0:  # retreino em janela expansível
                Xtr, ytr = X[:t], y[:t]
                scaler = StandardScaler()
                Xtr_sc = scaler.fit_transform(Xtr)
                modelos = []
                for mod in _construir_candidatos_ml(t).values():
                    try:
                        mod.fit(Xtr_sc, ytr)
                        modelos.append(mod)
                    except Exception:
                        continue
                if not modelos:
                    return {'ok': False, 'motivo': 'treino_falhou', 'amostra': n}
            x_sc = scaler.transform(X[t:t + 1])
            preds[j] = float(np.mean([m.predict(x_sc)[0] for m in modelos]))

        y_teste = y[split:]                 # log-retornos realizados
        ret_real = np.exp(y_teste) - 1.0    # retorno simples realizado por dia
        posicao = (preds > 0).astype(float)  # 1 = comprado, 0 = fora

        # Custo aplicado quando a posição MUDA (entra ou sai do mercado)
        trocas = np.abs(np.diff(np.concatenate([[0.0], posicao])))
        n_trades = int(trocas.sum())
        ret_estrategia = posicao * ret_real - trocas * custo

        equity = np.cumprod(1.0 + ret_estrategia)
        retorno_pct = (equity[-1] - 1.0) * 100
        buyhold_pct = (np.prod(1.0 + ret_real) - 1.0) * 100

        # Acurácia direcional: o sinal previsto bateu com o realizado?
        acertos_dir = np.mean((preds > 0) == (y_teste > 0)) * 100
        # Win rate dos dias EM QUE ESTEVE comprado
        dias_long = ret_real[posicao > 0]
        win_rate = float(np.mean(dias_long > 0) * 100) if len(dias_long) else 0.0

        # Sharpe anualizado da estratégia (dias úteis)
        sd = ret_estrategia.std()
        sharpe = float(ret_estrategia.mean() / sd * np.sqrt(252)) if sd > 1e-12 else 0.0

        # Max drawdown da curva de capital
        pico = np.maximum.accumulate(equity)
        max_dd = float(((equity - pico) / pico).min() * 100)

        exposure = float(posicao.mean() * 100)

        return {
            'ok': True,
            'amostra': n,
            'n_teste': n_teste,
            'retorno_pct': float(retorno_pct),
            'buyhold_pct': float(buyhold_pct),
            'vantagem_pct': float(retorno_pct - buyhold_pct),
            'acuracia_direcional': float(acertos_dir),
            'win_rate': win_rate,
            'sharpe': sharpe,
            'max_dd_pct': max_dd,
            'exposure_pct': exposure,
            'n_trades': n_trades,
        }
    except ImportError:
        return {'ok': False, 'motivo': 'lib_ausente'}
    except Exception as e:
        return {'ok': False, 'motivo': 'erro', 'detalhe': str(e)[:120]}


def renderizar_backtest_ml(resultado, ticker, empresa):
    """Card do backtest walk-forward do ML (estilo claro do app)."""
    with st.expander("🧪 Backtest do Modelo (walk-forward)", expanded=False):
        st.markdown("""
ℹ️ O **R²** diz se o modelo *ajusta* os dados — não se ele **ganha dinheiro**. Este
backtest responde a pergunta prática: *operar seguindo a previsão diária do
modelo teria sido lucrativo?*

- **Walk-forward:** a cada pregão o modelo só usa dados do **passado** (retreino
  periódico) — sem espiar o futuro.
- **Regra:** comprado quando a previsão do próximo dia é positiva; fora do
  mercado caso contrário.
- **Acurácia direcional:** com que frequência o modelo acerta a **direção** (alta/baixa).
- **Buy & Hold:** a régua — comprar e segurar no mesmo período de teste.

> ⚠️ Validação **indicativa** sobre uma janela de teste curta; use junto com o resto.
        """)

        if not resultado or not resultado.get('ok'):
            motivos = {
                'dados': 'dados insuficientes/incompletos para o modelo',
                'teste_curto': 'janela de teste muito curta para um backtest confiável',
                'treino_falhou': 'o modelo não pôde ser treinado neste ativo',
                'lib_ausente': 'scikit-learn indisponível no ambiente',
                'erro': 'não foi possível rodar o backtest agora',
            }
            motivo = (resultado or {}).get('motivo', 'erro')
            st.info(f"🧪 Backtest do modelo indisponível para **{ticker}**: "
                    f"{motivos.get(motivo, motivos['erro'])}.")
            return

        r = resultado
        venceu = r['vantagem_pct'] > 0
        if venceu:
            bg, borda, cor = '#f0fdf4', '#86efac', '#15803d'
            icone, veredito = '✅', 'Seguir o modelo superou o Buy & Hold no teste'
        else:
            bg, borda, cor = '#fef2f2', '#fca5a5', '#b91c1c'
            icone, veredito = '⚠️', 'Seguir o modelo NÃO superou o Buy & Hold no teste'

        st.markdown(f"""
    <div style='background:{bg};border:1px solid {borda};border-left:4px solid {cor};
                border-radius:12px;padding:0.9rem 1.1rem;margin-bottom:0.9rem;'>
        <div style='display:flex;align-items:center;gap:0.5rem;'>
            <span style='font-size:1.3rem;'>{icone}</span>
            <div>
                <div style='font-weight:800;font-size:0.9rem;color:{cor};'>{veredito}</div>
                <div style='font-size:0.78rem;color:#64748b;'>
                    walk-forward em {r['n_teste']} pregões de teste · {r['n_trades']} operações</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

        c1, c2, c3 = st.columns(3)
        c1.metric("🎯 Acerto de Direção", f"{r['acuracia_direcional']:.0f}%")
        c2.metric("📈 Retorno do Modelo", f"{r['retorno_pct']:+.1f}%")
        c3.metric("🪙 Buy & Hold", f"{r['buyhold_pct']:+.1f}%",
                  delta=f"{r['vantagem_pct']:+.1f} p.p.")

        c4, c5, c6 = st.columns(3)
        c4.metric("⚖️ Sharpe", f"{r['sharpe']:.2f}")
        c5.metric("📉 Max Drawdown", f"{r['max_dd_pct']:.1f}%")
        c6.metric("⏱️ Tempo Comprado", f"{r['exposure_pct']:.0f}%")

        st.caption(
            f"Win rate dos dias comprados: {r['win_rate']:.0f}% · "
            "custo de corretagem simulado: 0,05% por troca de posição. "
            "Previsão por média do ensemble, retreino a cada ~21 pregões."
        )


def prever_preco_ml(df_ticker, ticker, dias_previsao=5):
    """
    Ensemble de múltiplos modelos inspirado em framework de previsão de retornos de ações:
      - Gradient Boosting Regressor
      - Random Forest Regressor
      - Extra Trees Regressor
      - Elastic Net (regularização L1+L2)
      - Linear Regression (baseline)

    O melhor modelo (menor RMSE no conjunto de teste) é selecionado automaticamente.

    Features (inspiradas no notebook de Stock Price Prediction):
      - Retornos log em múltiplos horizontes: 1d, 5d, 15d, 30d (multi-period returns)
      - EMA20, EMA50, distância do preço às médias
      - RSI14 (oscilador de momento)
      - Volatilidade realizada (10d e 20d)
      - Bollinger %B (posição do preço na banda)
      - MACD Histogram (quando disponível)

    Target: retorno log do próximo dia (shift -1), reconvertido para preço.
    Split temporal 80/20 — sem data leakage.
    """
    try:
        from sklearn.linear_model import LinearRegression, ElasticNet
        from sklearn.ensemble import (GradientBoostingRegressor,
                                      RandomForestRegressor,
                                      ExtraTreesRegressor)
        from sklearn.preprocessing import StandardScaler
        from sklearn.metrics import r2_score, mean_squared_error
        import numpy as np

        df, feature_cols = _construir_features_ml(df_ticker)
        if df is None:
            return {'erro': feature_cols}  # feature_cols carrega a msg de erro

        X = df[feature_cols].values
        y = df['Target_LogRet'].values   # target: log-retorno

        # ── Split temporal 80/20 sem embaralhamento ──────────────────────────────
        split   = int(len(X) * 0.80)
        X_train = X[:split];  y_train = y[:split]
        X_test  = X[split:];  y_test  = y[split:]

        # Normalização por StandardScaler (melhor para GBM/RF que MinMax)
        scaler = StandardScaler()
        X_train_sc = scaler.fit_transform(X_train)
        X_test_sc  = scaler.transform(X_test)

        # ── Candidatos: hiperparâmetros ajustados para datasets pequenos (~200 amostras)
        candidatos = _construir_candidatos_ml(split)

        # ── Treinar e avaliar cada candidato ─────────────────────────────────────
        resultados_modelos = {}
        for nome, mod in candidatos.items():
            try:
                mod.fit(X_train_sc, y_train)
                # R² cru (pode ser negativo em séries financeiras). NÃO é zerado
                # aqui, senão todos empatam e a seleção/ordenação fica arbitrária.
                r2   = float(r2_score(y_test, mod.predict(X_test_sc)))
                rmse = float(np.sqrt(mean_squared_error(y_test, mod.predict(X_test_sc))))
                resultados_modelos[nome] = {'modelo': mod, 'r2': r2, 'rmse': rmse}
            except Exception:
                continue

        if not resultados_modelos:
            return {'erro': 'Todos os modelos falharam no treinamento.'}

        # Seleciona o melhor pelo MENOR RMSE. No mesmo conjunto de teste, menor
        # RMSE = maior R² — mas o RMSE nunca "empata em zero" como o R² clampado,
        # então é o critério robusto (evita escolher um modelo pior só por ordem).
        melhor_nome = min(resultados_modelos, key=lambda n: resultados_modelos[n]['rmse'])
        melhor      = resultados_modelos[melhor_nome]
        modelo      = melhor['modelo']
        confianca   = melhor['r2']

        # Ranking completo para exibição — do menor para o maior RMSE (melhor primeiro)
        ranking = sorted(
            [{'nome': n, 'r2': v['r2'], 'rmse': v['rmse']}
             for n, v in resultados_modelos.items()],
            key=lambda x: x['rmse']
        )

        # ── Previsão iterativa ────────────────────────────────────────────────────
        ultimo_idx   = -1
        estado       = {col: float(df[col].iloc[ultimo_idx]) for col in feature_cols}
        preco_cur    = float(df['Close'].iloc[ultimo_idx])
        previsoes    = []
        alpha20      = 2 / 21
        ema20_cur    = float(df['EMA20'].iloc[ultimo_idx])
        ema50_cur    = float(df['EMA50'].iloc[ultimo_idx]) if 'EMA50' in df.columns else ema20_cur
        ema200_cur   = float(df['EMA200'].iloc[ultimo_idx]) if 'EMA200' in df.columns else ema20_cur
        rsi_cur      = float(df['RSI14'].iloc[ultimo_idx])
        vol10_cur    = float(df['Volatil_10d'].iloc[ultimo_idx])
        vol20_cur    = float(df['Volatil_20d'].iloc[ultimo_idx])
        logret_5_hist  = list(df['LogRet_1d'].iloc[-5:].values)
        logret_15_hist = list(df['LogRet_1d'].iloc[-15:].values)
        logret_30_hist = list(df['LogRet_1d'].iloc[-30:].values)

        for _ in range(dias_previsao):
            feats = []
            logret_1 = estado.get('LogRet_1d', 0.0)

            logret_5_hist.append(logret_1)
            if len(logret_5_hist) > 5:   logret_5_hist.pop(0)
            logret_15_hist.append(logret_1)
            if len(logret_15_hist) > 15: logret_15_hist.pop(0)
            logret_30_hist.append(logret_1)
            if len(logret_30_hist) > 30: logret_30_hist.pop(0)

            estado_atualizado = {
                'LogRet_1d':      logret_1,
                'LogRet_5d':      sum(logret_5_hist),
                'LogRet_15d':     sum(logret_15_hist),
                'LogRet_30d':     sum(logret_30_hist),
                'Volatil_10d':    vol10_cur,
                'Volatil_20d':    vol20_cur,
                'RSI14':          rsi_cur,
                'EMA_Dist20':     (preco_cur - ema20_cur) / ema20_cur if ema20_cur else 0,
                'EMA_Dist50':     (preco_cur - ema50_cur) / ema50_cur if ema50_cur else 0,
                'EMA_Dist200':    (preco_cur - ema200_cur) / ema200_cur if ema200_cur else 0,
                'BB_pctB':        estado.get('BB_pctB', 0.5),
                'MACD_Hist_norm': estado.get('MACD_Hist_norm', 0.0),
            }
            feats = [estado_atualizado[c] for c in feature_cols]
            entrada_sc   = scaler.transform(np.array([feats]))
            logret_prev  = float(modelo.predict(entrada_sc)[0])

            preco_prev = preco_cur * np.exp(logret_prev)
            previsoes.append(round(preco_prev, 2))

            # Atualiza estado iterativo
            ret_real    = logret_prev
            vol10_cur   = vol10_cur * 0.9 + abs(ret_real) * 0.1
            vol20_cur   = vol20_cur * 0.95 + abs(ret_real) * 0.05
            ema20_cur   = alpha20 * preco_prev + (1 - alpha20) * ema20_cur
            ema50_cur   = (2/51) * preco_prev + (1 - 2/51) * ema50_cur
            ema200_cur  = (2/201) * preco_prev + (1 - 2/201) * ema200_cur
            delta = preco_prev - preco_cur
            ganho = max(delta, 0); perda = max(-delta, 0)
            rsi_cur = min(max(rsi_cur + (ganho - perda) / (preco_cur + 1e-9) * 30, 0), 100)
            estado['LogRet_1d'] = ret_real
            estado['BB_pctB']   = min(max(estado.get('BB_pctB', 0.5) + ret_real * 5, 0), 1)
            preco_cur = preco_prev

        variacao_pct = ((previsoes[-1] - float(df['Close'].iloc[-1])) /
                        float(df['Close'].iloc[-1])) * 100

        if   variacao_pct >  1.5: direcao = "ALTA"
        elif variacao_pct < -1.5: direcao = "BAIXA"
        else:                     direcao = "LATERAL"

        return {
            'erro'          : None,
            'previsoes'     : previsoes,
            'direcao'       : direcao,
            'variacao_pct'  : round(variacao_pct, 2),
            'confianca'     : round(confianca * 100, 1),  # R² real (pode ser negativo)
            'ultimo_preco'  : round(float(df['Close'].iloc[-1]), 2),
            'melhor_modelo' : melhor_nome,
            'ranking_modelos': ranking,
            'n_features'    : len(feature_cols),
            'features_usadas': feature_cols,
            'n_amostras'    : len(df),
            'rmse_melhor'   : round(melhor['rmse'], 6),
        }

    except ImportError:
        return {'erro': 'scikit-learn não instalado. Adicione scikit-learn ao requirements.txt.'}
    except Exception as e:
        return {'erro': f'Erro no ensemble: {str(e)}'}


def renderizar_painel_ml(resultado_ml, ticker, empresa, dias_previsao=5):
    """
    Renderiza o painel de previsão ML dentro de um st.expander.
    Totalmente isolado — não interfere em nenhuma outra seção.
    """
    with st.expander("🤖 Previsão por Inteligência Artificial — Ensemble de Modelos", expanded=False):

        if resultado_ml.get('erro'):
            st.warning(f"⚠️ {resultado_ml['erro']}")
            return

        direcao        = resultado_ml['direcao']
        variacao       = resultado_ml['variacao_pct']
        confianca      = resultado_ml['confianca']
        previsoes      = resultado_ml['previsoes']
        ult_preco      = resultado_ml['ultimo_preco']
        melhor_modelo  = resultado_ml.get('melhor_modelo', 'N/A')
        ranking        = resultado_ml.get('ranking_modelos', [])
        n_features     = resultado_ml.get('n_features', 0)
        features_usadas = resultado_ml.get('features_usadas', [])
        n_amostras     = resultado_ml.get('n_amostras', 0)
        rmse_melhor    = resultado_ml.get('rmse_melhor', 0)

        # Alerta de qualidade quando R² é muito baixo
        if confianca < 20:
            st.warning(
                f"⚠️ **Ajuste fraco (R² = {confianca:.1f}%):** com apenas ~{n_amostras} amostras "
                f"(1 ano de dados diários), modelos de ensemble tendem a ter R² baixo em séries "
                f"financeiras — que são inerentemente ruidosas. A direção prevista é indicativa, "
                f"não determinística. Use em conjunto com a análise técnica."
            )

        # Ícones por modelo
        icones_modelo = {
            'GradientBoosting':  '🌲',
            'RandomForest':      '🌳',
            'ExtraTrees':        '🌴',
            'ElasticNet':        '🔗',
            'LinearRegression':  '📏',
        }
        icone_melhor = icones_modelo.get(melhor_modelo, '🤖')

        # --- Cabeçalho explicativo ---
        nomes_pt = {
            'GradientBoosting': 'Gradient Boosting',
            'RandomForest':     'Random Forest',
            'ExtraTrees':       'Extra Trees',
            'ElasticNet':       'Elastic Net',
            'LinearRegression': 'Regressão Linear',
        }
        st.markdown(f"""
        <div style='background:#f8fafc;border:1px solid #e2e8f0;border-left:5px solid #667eea;
                    padding:0.95rem 1.2rem;border-radius:10px;margin-bottom:1rem;'>
            <div style='display:flex;align-items:center;gap:0.7rem;margin-bottom:0.5rem;'>
                <span style='font-size:1.7rem;'>{icone_melhor}</span>
                <div>
                    <div style='color:#1e293b;font-weight:800;font-size:1rem;'>
                        Modelo selecionado: {nomes_pt.get(melhor_modelo, melhor_modelo)}
                    </div>
                    <div style='color:#64748b;font-size:0.78rem;'>
                        Menor erro (RMSE) entre 5 algoritmos treinados simultaneamente
                    </div>
                </div>
            </div>
            <p style='margin:0;color:#475569;font-size:0.82rem;line-height:1.6;'>
                ℹ️ <strong style='color:#334155;'>Framework Ensemble:</strong>
                Cinco modelos (Gradient Boosting, Random Forest, Extra Trees, Elastic Net, Regressão Linear)
                foram treinados com <strong>{n_features} features</strong> derivadas de retornos logarítmicos
                em múltiplos horizontes (1d, 5d, 15d, 30d), volatilidade realizada, distância às EMAs,
                RSI14 e Bollinger %B. O target é o retorno log do próximo dia, reconvertido para preço.
                O melhor modelo no conjunto de teste (split 80/20 temporal) é usado para a previsão.
                <br><br>
                ⚠️ <strong style='color:#b45309;'>Aviso:</strong>
                Previsões de ML são estimativas estatísticas, não garantias.
                Use como <u>um dos critérios</u> da sua análise, nunca como único sinal.
            </p>
        </div>""", unsafe_allow_html=True)

        # --- Cards de resumo ---
        cfg = {
            "ALTA"   : ("#bbf7d0","#16a34a","#14532d","▲ ALTA PREVISTA",   "#dcfce7"),
            "BAIXA"  : ("#fecaca","#dc2626","#7f1d1d","▼ BAIXA PREVISTA",  "#fef2f2"),
            "LATERAL": ("#fef9c3","#d97706","#78350f","— LATERAL PREVISTA","#fefce8"),
        }
        bg_grad, cor_borda, cor_txt, label_dir, bg_light = cfg[direcao]
        col_dir, col_conf, col_var = st.columns(3)

        with col_dir:
            st.markdown(f"""
            <div style='background:{bg_light};border:2px solid {cor_borda};
                        border-left:6px solid {cor_borda};
                        padding:1rem 0.8rem;border-radius:10px;text-align:center;
                        min-height:115px;display:flex;flex-direction:column;
                        justify-content:center;gap:0.3rem;'>
                <div style='font-size:1.6rem;font-weight:900;color:{cor_borda};
                            letter-spacing:0.02em;line-height:1.1;'>{label_dir}</div>
                <div style='font-size:0.78rem;font-weight:600;color:{cor_txt};
                            opacity:0.8;'>próximos {dias_previsao} dias úteis</div>
            </div>""", unsafe_allow_html=True)

        with col_conf:
            # Barra de progresso CSS + label explicativo claro
            r2_val   = confianca           # R² em % (pode ser negativo)
            cor_c    = "#15803d" if r2_val >= 60 else "#b45309" if r2_val >= 30 else "#b91c1c"
            bg_bar_c = "#dcfce7" if r2_val >= 60 else "#fef3c7" if r2_val >= 30 else "#fee2e2"
            nivel    = ("Ajuste bom" if r2_val >= 60 else "Ajuste moderado" if r2_val >= 30
                        else "Ajuste fraco" if r2_val >= 0 else "Pior que a média (R²<0)")
            barra_w  = max(0, min(int(r2_val), 100))   # largura nunca negativa
            st.markdown(f"""
            <div style='background:#f8fafc;border:2px solid #e2e8f0;padding:0.9rem 1rem;
                        border-radius:10px;min-height:115px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:0.7rem;font-weight:700;color:#94a3b8;
                            text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.3rem;'>
                    Precisão do Modelo (R²)</div>
                <div style='font-size:2rem;font-weight:900;color:{cor_c};line-height:1;'>
                    {r2_val:.1f}%</div>
                <div style='background:#e2e8f0;border-radius:99px;height:6px;margin:0.45rem 0;'>
                    <div style='background:{cor_c};width:{barra_w}%;height:6px;
                                border-radius:99px;transition:width 0.4s;'></div>
                </div>
                <div style='font-size:0.72rem;color:#64748b;'>
                    {nivel} &nbsp;·&nbsp; {icone_melhor} {nomes_pt.get(melhor_modelo, melhor_modelo)}</div>
                <div style='font-size:0.67rem;color:#94a3b8;margin-top:0.15rem;'>
                    R²=1 perfeito · R²=0 aleatório · R²&lt;0 pior que a média</div>
            </div>""", unsafe_allow_html=True)

        with col_var:
            sinal_v = "+" if variacao >= 0 else ""
            cor_v   = "#15803d" if variacao > 1.5 else "#b91c1c" if variacao < -1.5 else "#b45309"
            seta_v  = "▲" if variacao > 1.5 else "▼" if variacao < -1.5 else "—"
            st.markdown(f"""
            <div style='background:#f8fafc;border:2px solid #e2e8f0;padding:0.9rem 1rem;
                        border-radius:10px;min-height:115px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:0.7rem;font-weight:700;color:#94a3b8;
                            text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.3rem;'>
                    Variação Estimada</div>
                <div style='font-size:2rem;font-weight:900;color:{cor_v};line-height:1;'>
                    {seta_v} {sinal_v}{variacao:.2f}%</div>
                <div style='font-size:0.72rem;color:#64748b;margin-top:0.4rem;'>
                    D0 &rarr; D+{dias_previsao} &nbsp;(previsão iterativa)</div>
                <div style='font-size:0.67rem;color:#94a3b8;margin-top:0.15rem;'>
                    Preço atual: R${ult_preco:.2f}</div>
            </div>""", unsafe_allow_html=True)

        st.markdown("<div style='height:1rem'></div>", unsafe_allow_html=True)

        # --- Ranking dos modelos — colunas Streamlit nativas (evita renderização bruta de HTML) ---
        if ranking:
            st.markdown("**🏆 Desempenho dos Modelos no Conjunto de Teste:**")
            medalhas = ['🥇','🥈','🥉','4°','5°']
            # Primeira linha: top 3
            cols_top = st.columns(3)
            for i, mod_info in enumerate(ranking[:3]):
                cor_rank = "#15803d" if i == 0 else "#64748b"
                borda_r  = "2px solid #22c55e" if i == 0 else "1px solid #e2e8f0"
                bg_rank  = "#f0fdf4" if i == 0 else "#f8fafc"
                r2_disp  = mod_info["r2"] * 100   # R² real (pode ser negativo)
                rmse_d   = mod_info["rmse"]
                nome_c   = nomes_pt.get(mod_info["nome"], mod_info["nome"])
                barra_w  = max(0, min(int(r2_disp * 2), 100))
                bar_cor  = "#22c55e" if i == 0 else "#94a3b8"
                with cols_top[i]:
                    st.markdown(f"""
                    <div style='background:{bg_rank};border:{borda_r};border-radius:10px;
                                padding:0.75rem 0.85rem;'>
                        <div style='font-size:1.1rem;margin-bottom:0.2rem;'>{medalhas[i]}</div>
                        <div style='font-size:0.72rem;font-weight:700;color:{cor_rank};
                                    margin-bottom:0.35rem;'>
                            {icones_modelo.get(mod_info["nome"],"")} {nome_c}</div>
                        <div style='font-size:1.4rem;font-weight:900;color:{cor_rank};
                                    line-height:1;margin-bottom:0.3rem;'>{r2_disp:.1f}%</div>
                        <div style='background:#e2e8f0;border-radius:99px;height:5px;
                                    margin-bottom:0.3rem;'>
                            <div style='background:{bar_cor};width:{barra_w}%;height:5px;
                                        border-radius:99px;'></div></div>
                        <div style='font-size:0.62rem;color:#94a3b8;'>
                            R² &nbsp;·&nbsp; RMSE {rmse_d:.5f}</div>
                    </div>""", unsafe_allow_html=True)
            # Segunda linha: posições 4 e 5
            if len(ranking) > 3:
                cols_bot = st.columns(len(ranking) - 3)
                for i, mod_info in enumerate(ranking[3:]):
                    idx = i + 3
                    r2_disp = mod_info["r2"] * 100   # R² real (pode ser negativo)
                    rmse_d  = mod_info["rmse"]
                    nome_c  = nomes_pt.get(mod_info["nome"], mod_info["nome"])
                    with cols_bot[i]:
                        st.markdown(f"""
                        <div style='background:#f8fafc;border:1px solid #e2e8f0;
                                    border-radius:10px;padding:0.65rem 0.75rem;'>
                            <div style='font-size:0.9rem;margin-bottom:0.15rem;'>{medalhas[idx]}</div>
                            <div style='font-size:0.7rem;font-weight:700;color:#64748b;
                                        margin-bottom:0.25rem;'>
                                {icones_modelo.get(mod_info["nome"],"")} {nome_c}</div>
                            <div style='font-size:1.2rem;font-weight:800;color:#64748b;
                                        line-height:1;margin-bottom:0.2rem;'>{r2_disp:.1f}%</div>
                            <div style='font-size:0.6rem;color:#94a3b8;'>
                                RMSE {rmse_d:.5f}</div>
                        </div>""", unsafe_allow_html=True)

        st.markdown("<div style='height:0.8rem'></div>", unsafe_allow_html=True)

        # --- Gráfico ---
        todos_precos = [ult_preco] + previsoes
        todos_labels = ["Hoje"] + [f"D+{i+1}" for i in range(dias_previsao)]
        cor_linha = "#16a34a" if direcao == "ALTA" else "#dc2626" if direcao == "BAIXA" else "#d97706"

        y_min = min(todos_precos) * 0.985
        y_max = max(todos_precos) * 1.015
        if (y_max - y_min) < ult_preco * 0.01:
            y_min = ult_preco * 0.992
            y_max = ult_preco * 1.008

        fig, ax = plt.subplots(figsize=(9, 3.5))
        fig.patch.set_facecolor('#f8fafc')
        ax.set_facecolor('#f8fafc')

        xs = list(range(len(todos_precos)))

        ax.fill_between(xs, todos_precos, y_min, alpha=0.18, color=cor_linha)
        ax.plot(xs, todos_precos,
                color=cor_linha, linewidth=2.5,
                marker='o', markersize=7,
                markerfacecolor='white',
                markeredgecolor=cor_linha, markeredgewidth=2.2,
                zorder=3)
        ax.scatter([0], [ult_preco], color='#6366f1', s=120, zorder=5, label='Hoje')
        ax.axhline(ult_preco, color='#94a3b8', linestyle='--', linewidth=1, alpha=0.5)

        margem = (y_max - y_min)
        for i, p in enumerate(todos_precos):
            ax.annotate(
                f'R${p:.2f}',
                xy=(i, p),
                xytext=(0, 12),
                textcoords='offset points',
                ha='center', va='bottom',
                fontsize=8, color='#1e293b', fontweight='700',
                bbox=dict(boxstyle='round,pad=0.2', facecolor='white',
                          edgecolor='#e2e8f0', alpha=0.85)
            )

        ax.set_ylim(y_min, y_max + margem * 0.45)
        ax.set_xticks(xs)
        ax.set_xticklabels(todos_labels, fontsize=9, color='#475569', fontweight='600')
        ax.set_ylabel('Preço (R$)', fontsize=8.5, color='#64748b')
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'R${v:.2f}'))
        ax.tick_params(axis='y', labelsize=8, colors='#64748b')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('#e2e8f0')
        ax.spines['bottom'].set_color('#e2e8f0')
        ax.set_title(
            f'Previsão Ensemble {icone_melhor} {nomes_pt.get(melhor_modelo,melhor_modelo)} — {ticker} ({empresa})',
            fontsize=9.5, color='#334155', pad=12, fontweight='bold')
        ax.grid(axis='y', alpha=0.12, color='#94a3b8')
        plt.tight_layout()
        st.pyplot(fig)
        plt.close(fig)

        # --- Tabela de previsões ---
        st.markdown("**📋 Preços Previstos por Dia:**")
        cols_prev = st.columns(dias_previsao)
        for i, (col, preco) in enumerate(zip(cols_prev, previsoes)):
            delta_pct = ((preco - ult_preco) / ult_preco) * 100
            sinal_d   = "+" if delta_pct >= 0 else ""
            cor_d     = "#15803d" if delta_pct > 0 else "#dc2626" if delta_pct < 0 else "#78350f"
            with col:
                st.markdown(f"""
                <div style='background:#fff;border:1px solid #e2e8f0;border-radius:8px;
                            padding:0.65rem 0.4rem;text-align:center;'>
                    <div style='font-size:0.7rem;color:#94a3b8;font-weight:700;
                                letter-spacing:.05em;'>D+{i+1}</div>
                    <div style='font-size:0.95rem;font-weight:800;color:#1e293b;
                                margin:0.15rem 0;'>R${preco:.2f}</div>
                    <div style='font-size:0.73rem;font-weight:600;color:{cor_d};'>
                        {sinal_d}{delta_pct:.1f}%</div>
                </div>""", unsafe_allow_html=True)

        # --- Features utilizadas ---
        if features_usadas:
            nomes_feat = {
                'LogRet_1d':      'Retorno Log 1d',
                'LogRet_5d':      'Retorno Log 5d',
                'LogRet_15d':     'Retorno Log 15d',
                'LogRet_30d':     'Retorno Log 30d',
                'Volatil_10d':    'Volatilidade 10d',
                'Volatil_20d':    'Volatilidade 20d',
                'RSI14':          'RSI 14',
                'EMA_Dist20':     'Dist. EMA20',
                'EMA_Dist50':     'Dist. EMA50',
                'EMA_Dist200':    'Dist. EMA200',
                'BB_pctB':        'Bollinger %B',
                'MACD_Hist_norm': 'MACD Hist.',
            }
            feat_str = ' &nbsp;|&nbsp; '.join(
                f'<span style="background:#e0e7ff;color:#3730a3;padding:0.1rem 0.4rem;'
                f'border-radius:4px;font-size:0.72rem;font-weight:600;">'
                f'{nomes_feat.get(f,f)}</span>'
                for f in features_usadas
            )
            st.markdown(f"""
            <div style='margin-top:0.8rem;padding:0.7rem 1rem;background:#f1f5f9;
                        border-radius:8px;font-size:0.76rem;color:#64748b;line-height:2;'>
                📐 <strong>Features utilizadas ({n_features}):</strong><br>{feat_str}
            </div>""", unsafe_allow_html=True)

        # --- Legenda de confiança ---
        st.markdown("""
        <div style='margin-top:0.6rem;padding:0.7rem 1rem;background:#f1f5f9;
                    border-radius:8px;font-size:0.76rem;color:#64748b;'>
            📊 <strong>Confiança (R²):</strong>
            &nbsp;🟢 ≥ 60% = Boa &nbsp;|&nbsp;
            🟡 40–60% = Moderada &nbsp;|&nbsp;
            🔴 &lt; 40% = Baixa — use com cautela &nbsp;|&nbsp;
            Split temporal 80/20 sem embaralhamento (sem data leakage)
        </div>""", unsafe_allow_html=True)
