import random
from collections import deque
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
def _executar_agente_rl_cached(ticker, episodes=8, window_size=5):
    """Wrapper cacheado para executar_agente_rl — evita re-treino a cada interação."""
    try:
        from modules.yf_session import baixar as _yf_baixar
        df_raw = _yf_baixar(f"{ticker}.SA", period='1y', interval='1d',
                            auto_adjust=True, progress=False, timeout=30)
        if df_raw is None or df_raw.empty:
            return {'erro': 'Sem dados para o agente RL.'}
        if isinstance(df_raw.columns, pd.MultiIndex):
            df_raw.columns = df_raw.columns.get_level_values(0)
        close = df_raw['Close'].dropna()
        df_raw['EMA20'] = close.ewm(span=20).mean()
        df_raw['RSI14'] = 50.0   # placeholder — RL usa só Close
        return executar_agente_rl(df_raw.dropna(subset=['Close']), ticker, episodes, window_size)
    except Exception as e:
        return {'erro': f'Erro no agente RL: {str(e)}'}


def _sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -500, 500)))


def _relu(x):
    return np.maximum(0, x)


def _softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()


class _QNetwork:
    """Rede neural MLP NumPy puro — com gradient clipping e guarda contra NaN."""
    def __init__(self, state_size, action_size, lr=0.005):
        self.lr = lr
        # He init (melhor para ReLU)
        self.W1 = np.random.randn(state_size, 32) * np.sqrt(2.0 / state_size)
        self.b1 = np.zeros(32)
        self.W2 = np.random.randn(32, 16) * np.sqrt(2.0 / 32)
        self.b2 = np.zeros(16)
        self.W3 = np.random.randn(16, action_size) * np.sqrt(2.0 / 16)
        self.b3 = np.zeros(action_size)
        self._clip = 1.0   # gradient clipping threshold

    def predict(self, x):
        x  = np.asarray(x, dtype=np.float64).flatten()
        h1 = _relu(x  @ self.W1 + self.b1)
        h2 = _relu(h1 @ self.W2 + self.b2)
        out = h2 @ self.W3 + self.b3
        # Substitui NaN por 0 antes de retornar
        return np.nan_to_num(out, nan=0.0, posinf=1.0, neginf=-1.0)

    def train(self, x, y_target):
        x        = np.asarray(x, dtype=np.float64).flatten()
        y_target = np.asarray(y_target, dtype=np.float64)
        # Forward
        h1  = _relu(x  @ self.W1 + self.b1)
        h2  = _relu(h1 @ self.W2 + self.b2)
        out = h2 @ self.W3 + self.b3
        # MSE gradient
        d_out = (out - y_target)                     # shape (action_size,)
        # Backprop camada 3
        dW3 = np.outer(h2, d_out)
        db3 = d_out
        # Backprop camada 2
        d_h2 = (d_out @ self.W3.T) * (h2 > 0)
        dW2  = np.outer(h1, d_h2)
        db2  = d_h2
        # Backprop camada 1
        d_h1 = (d_h2 @ self.W2.T) * (h1 > 0)
        dW1  = np.outer(x, d_h1)
        db1  = d_h1
        # Gradient clipping + atualização
        for p, g in [(self.W3,dW3),(self.b3,db3),
                     (self.W2,dW2),(self.b2,db2),
                     (self.W1,dW1),(self.b1,db1)]:
            g_clipped = np.clip(g, -self._clip, self._clip)
            p -= self.lr * g_clipped
        # Zera NaN que possam ter surgido
        for attr in ['W1','b1','W2','b2','W3','b3']:
            arr = getattr(self, attr)
            if np.any(np.isnan(arr)):
                setattr(self, attr, np.nan_to_num(arr, nan=0.0))


class _RLAgent:
    """Agente DQN com Experience Replay, política ε-greedy e reward normalizado."""
    def __init__(self, state_size, action_size=3):
        self.state_size    = state_size
        self.action_size   = action_size
        self.memory        = deque(maxlen=1000)
        self.inventory     = []
        self.gamma         = 0.95
        self.epsilon       = 1.0
        self.epsilon_min   = 0.01
        self.epsilon_decay = 0.995
        self.model         = _QNetwork(state_size, action_size, lr=0.005)

    def act(self, state, is_eval=False):
        if not is_eval and np.random.rand() <= self.epsilon:
            return np.random.randint(self.action_size)
        q = self.model.predict(state)
        return int(np.argmax(q))

    def exp_replay(self, batch_size):
        if len(self.memory) < batch_size:
            return
        batch = random.sample(list(self.memory), batch_size)
        for state, action, reward, next_state, done in batch:
            target = reward
            if not done:
                next_q  = self.model.predict(next_state)
                target  = reward + self.gamma * float(np.max(next_q))
            q_vals          = self.model.predict(state).copy()
            q_vals[action]  = np.clip(target, -10, 10)   # clamp target
            self.model.train(state, q_vals)
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay


def _get_state_rl(prices, t, window):
    """Estado = diferenças de preço sigmoid numa janela de `window` passos."""
    # Pega os últimos `window+1` preços para calcular `window` diferenças
    start  = max(0, t - window + 1)
    block  = prices[start:t + 1].astype(np.float64)
    if len(block) < window + 1:
        block = np.concatenate([np.full(window + 1 - len(block), block[0]), block])
    # `window` diferenças consecutivas normalizadas por sigmoid
    diffs = np.diff(block[-window - 1:])
    return _sigmoid(diffs).astype(np.float32)


def executar_agente_rl(df_ticker, ticker, episodes=12, window_size=5, max_steps=None):
    """
    Treina o agente RL nos dados históricos (80%) e avalia no conjunto de teste (20%).
    """
    try:
        np.random.seed(42)
        random.seed(42)

        df = df_ticker.copy().sort_index()
        if 'Close' not in df.columns or len(df) < 60:
            return {'erro': 'Dados insuficientes para o agente RL (mín. 60 dias).'}

        prices = df['Close'].dropna().values.astype(np.float64)
        # Normaliza preços para escala [0,1] — evita gradientes enormes
        p_min, p_max = prices.min(), prices.max()
        p_range      = p_max - p_min if p_max > p_min else 1.0
        prices_norm  = (prices - p_min) / p_range

        split      = int(len(prices) * 0.80)
        train_raw  = prices[:split]
        train_norm = prices_norm[:split]
        test_raw   = prices[split:]
        test_norm  = prices_norm[split:]

        agent      = _RLAgent(state_size=window_size)
        batch_size = 32
        historico_lucro = []

        # ── TREINAMENTO ───────────────────────────────────────────────────────────
        l = min(len(train_norm) - 1, max_steps or len(train_norm))
        for ep in range(episodes):
            state         = _get_state_rl(train_norm, 0, window_size)
            total_profit  = 0.0
            agent.inventory = []

            for t in range(l):
                action     = agent.act(state)
                next_state = _get_state_rl(train_norm, t + 1, window_size)
                reward     = 0.0

                if action == 1:   # comprar
                    agent.inventory.append(train_raw[t])

                elif action == 2:   # vender
                    if agent.inventory:
                        bought = agent.inventory.pop(0)
                        pnl    = train_raw[t] - bought
                        # Reward normalizado pelo preço — evita escala absurda
                        reward = pnl / (bought + 1e-9)
                        total_profit += pnl
                    else:
                        # Penaliza venda sem estoque
                        reward = -0.01

                done = (t == l - 1)
                # Força venda no último passo se tiver estoque
                if done and agent.inventory:
                    for b in agent.inventory:
                        total_profit += train_raw[t] - b
                    agent.inventory = []

                agent.memory.append((state, action, reward, next_state, done))
                state = next_state

                if len(agent.memory) >= batch_size:
                    agent.exp_replay(batch_size)

            historico_lucro.append(round(total_profit, 2))

        # ── AVALIAÇÃO (test set) ──────────────────────────────────────────────────
        state         = _get_state_rl(test_norm, 0, window_size)
        total_profit_test = 0.0
        agent.inventory   = []
        compras_test      = []
        vendas_test       = []

        for t in range(len(test_norm) - 1):
            action     = agent.act(state, is_eval=True)
            next_state = _get_state_rl(test_norm, t + 1, window_size)

            if action == 1:
                agent.inventory.append(test_raw[t])
                compras_test.append((t, test_raw[t]))
            elif action == 2 and agent.inventory:
                bought  = agent.inventory.pop(0)
                pnl_op  = test_raw[t] - bought
                total_profit_test += pnl_op
                vendas_test.append((t, test_raw[t], pnl_op))

            state = next_state

        # Fecha posições abertas ao final
        if agent.inventory:
            ultimo_p = test_raw[-1]
            for b in agent.inventory:
                pnl_op = ultimo_p - b
                total_profit_test += pnl_op
                vendas_test.append((len(test_raw) - 1, ultimo_p, pnl_op))

        # ── Recomendação: último estado nos dados completos ───────────────────────
        prices_full_norm = prices_norm
        ult_estado = _get_state_rl(prices_full_norm, len(prices_full_norm) - 1, window_size)
        ult_q      = agent.model.predict(ult_estado)
        # Se todos NaN (rede instável), usa Hold
        if np.any(np.isnan(ult_q)):
            ult_q = np.array([0.0, 0.0, 0.0])
        ult_acao   = int(np.argmax(ult_q))
        rec_map    = {0: 'AGUARDAR', 1: 'COMPRAR', 2: 'VENDER'}

        return {
            'erro'                      : None,
            'precos_treino'             : train_raw,
            'precos_teste'              : test_raw,
            'compras_teste'             : compras_test,
            'vendas_teste'              : vendas_test,
            'lucro_treino'              : round(historico_lucro[-1] if historico_lucro else 0, 2),
            'lucro_teste'               : round(total_profit_test, 2),
            'historico_lucro_episodios' : historico_lucro,
            'episodios'                 : episodes,
            'window_size'               : window_size,
            'recomendacao'              : rec_map[ult_acao],
            'q_values'                  : [round(float(v), 4) for v in ult_q],
            'split_idx'                 : split,
            'precos_completos'          : prices,
        }

    except Exception as e:
        return {'erro': f'Erro no agente RL: {str(e)}'}


def renderizar_painel_rl(resultado_rl, ticker, empresa):
    """Renderiza o painel do Agente de Reinforcement Learning."""
    with st.expander("🎮 Agente de Reinforcement Learning — Estratégia de Trading", expanded=False):

        if resultado_rl.get('erro'):
            st.warning(f"⚠️ {resultado_rl['erro']}")
            return

        rec         = resultado_rl['recomendacao']
        lucro_teste = resultado_rl['lucro_teste']
        historico   = resultado_rl['historico_lucro_episodios']
        compras     = resultado_rl['compras_teste']
        vendas      = resultado_rl['vendas_teste']
        precos_test = resultado_rl['precos_teste']
        precos_full = resultado_rl['precos_completos']
        split_idx   = resultado_rl['split_idx']
        q_vals      = resultado_rl['q_values']
        episodios   = resultado_rl['episodios']
        window_size = resultado_rl['window_size']

        # ── Cabeçalho ─────────────────────────────────────────────────────────────
        st.markdown(f"""
        <div style='background:#f8fafc;border:1px solid #e2e8f0;border-left:5px solid #667eea;
                    padding:0.95rem 1.2rem;border-radius:10px;margin-bottom:1rem;'>
            <div style='display:flex;align-items:center;gap:0.7rem;margin-bottom:0.5rem;'>
                <span style='font-size:1.9rem;'>🎮</span>
                <div>
                    <div style='color:#1e293b;font-weight:800;font-size:1rem;'>
                        Deep Q-Learning (DQN) — Agente de Trading
                    </div>
                    <div style='color:#64748b;font-size:0.78rem;'>
                        Treinado por {episodios} episódios · Estado: janela de {window_size} dias · Ações: Hold / Buy / Sell
                    </div>
                </div>
            </div>
            <p style='margin:0;color:#475569;font-size:0.82rem;line-height:1.65;'>
                ℹ️ <strong style='color:#334155;'>Como funciona:</strong>
                O agente observa as <em>diferenças de preço</em> numa janela deslizante (estado),
                decide entre <strong>Comprar, Vender ou Aguardar</strong> (ação) e recebe como recompensa
                o <strong>PnL realizado</strong> em cada venda. Uma rede neural MLP (64→32 neurônios, ReLU)
                aproxima a função Q(s,a) — o valor esperado de cada ação em cada estado.
                O treinamento usa <strong>Experience Replay</strong> (buffer de 500 transações, mini-batch de 32)
                e política <strong>ε-greedy</strong> com decaimento progressivo do ε.
                <br><br>
                ⚠️ <strong style='color:#b45309;'>Aviso:</strong>
                RL é altamente sensível à qualidade dos dados e ao número de episódios.
                Use como sinal complementar — nunca como único critério de decisão.
            </p>
        </div>""", unsafe_allow_html=True)

        # ── Cards: Recomendação + Lucro Teste + Q-Values ──────────────────────────
        cfg_rec = {
            'COMPRAR' : ('#d4fc79','#96e6a1','#14532d','🚀'),
            'VENDER'  : ('#fca5a5','#ef4444','#7f1d1d','📉'),
            'AGUARDAR': ('#fde047','#fbbf24','#78350f','⏸️'),
        }
        bg1, bg2, cor_txt, icone_rec = cfg_rec[rec]
        c1, c2, c3 = st.columns(3)

        with c1:
            st.markdown(f"""
            <div style='background:linear-gradient(135deg,{bg1} 0%,{bg2} 100%);
                        padding:1.2rem;border-radius:10px;text-align:center;height:120px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:2rem;'>{icone_rec}</div>
                <div style='font-weight:800;font-size:1rem;color:{cor_txt};'>
                    {rec}</div>
                <div style='font-size:0.74rem;color:{cor_txt};margin-top:0.2rem;'>
                    Recomendação do Agente</div>
            </div>""", unsafe_allow_html=True)

        with c2:
            sinal_l = '+' if lucro_teste >= 0 else ''
            cor_l   = '#15803d' if lucro_teste >= 0 else '#b91c1c'
            st.markdown(f"""
            <div style='background:#f8fafc;border:2px solid #e2e8f0;padding:1.2rem;
                        border-radius:10px;text-align:center;height:120px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:1.6rem;font-weight:800;color:{cor_l};'>
                    {sinal_l}R${lucro_teste:.2f}</div>
                <div style='font-size:0.8rem;color:#64748b;margin-top:0.25rem;'>
                    Lucro Acumulado (Teste)<br>
                    <span style='font-size:0.7rem;'>{len(compras)} compras · {len(vendas)} vendas</span>
                </div>
            </div>""", unsafe_allow_html=True)

        with c3:
            q_hold = q_vals[0] if not (isinstance(q_vals[0], float) and q_vals[0] != q_vals[0]) else 0.0
            q_buy  = q_vals[1] if not (isinstance(q_vals[1], float) and q_vals[1] != q_vals[1]) else 0.0
            q_sell = q_vals[2] if not (isinstance(q_vals[2], float) and q_vals[2] != q_vals[2]) else 0.0
            melhor_acao = ['Hold','Buy','Sell'][int(np.argmax([q_hold, q_buy, q_sell]))]
            def _qfmt(v):
                return f"{v:+.4f}" if abs(v) < 999 else f"{v:+.1f}"
            st.markdown(f"""
            <div style='background:#f8fafc;border:2px solid #e2e8f0;padding:0.9rem 1rem;
                        border-radius:10px;min-height:120px;
                        display:flex;flex-direction:column;justify-content:center;'>
                <div style='font-size:0.7rem;font-weight:700;color:#94a3b8;
                            text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem;'>
                    Q-Values (estado atual)</div>
                <div style='font-size:0.85rem;color:#334155;margin-bottom:0.18rem;'>
                    ⏸️ Hold &nbsp;<strong style='color:#475569;'>{_qfmt(q_hold)}</strong></div>
                <div style='font-size:0.85rem;color:#15803d;margin-bottom:0.18rem;'>
                    🛒 Buy &nbsp;&nbsp;<strong>{_qfmt(q_buy)}</strong></div>
                <div style='font-size:0.85rem;color:#b91c1c;margin-bottom:0.35rem;'>
                    💰 Sell &nbsp;&nbsp;<strong>{_qfmt(q_sell)}</strong></div>
                <div style='font-size:0.68rem;color:#94a3b8;'>
                    Maior Q &rarr; ação escolhida: <strong>{melhor_acao}</strong></div>
            </div>""", unsafe_allow_html=True)

        st.markdown("<div style='height:0.9rem'></div>", unsafe_allow_html=True)

        # ── Gráfico 1: Evolução do lucro por episódio ─────────────────────────────
        st.markdown("**📈 Aprendizado do Agente — Lucro por Episódio (Treino):**")
        fig_ep, ax_ep = plt.subplots(figsize=(9, 2.8))
        fig_ep.patch.set_facecolor('#f8fafc')
        ax_ep.set_facecolor('#f8fafc')
        xs_ep = list(range(1, len(historico) + 1))
        cores_ep = ['#16a34a' if v >= 0 else '#dc2626' for v in historico]
        ax_ep.bar(xs_ep, historico, color=cores_ep, alpha=0.8, edgecolor='white', linewidth=0.5)
        ax_ep.axhline(0, color='#94a3b8', linewidth=1, linestyle='--')
        for xi, yi in zip(xs_ep, historico):
            ax_ep.annotate(f'R${yi:.0f}', xy=(xi, yi),
                           xytext=(0, 5 if yi >= 0 else -14),
                           textcoords='offset points',
                           ha='center', fontsize=7.5, color='#1e293b', fontweight='600')
        ax_ep.set_xticks(xs_ep)
        ax_ep.set_xticklabels([f'Ep {i}' for i in xs_ep], fontsize=8.5)
        ax_ep.set_ylabel('Lucro (R$)', fontsize=8.5, color='#64748b')
        ax_ep.set_title(f'Evolução do Lucro durante o Treinamento — {ticker}',
                        fontsize=9, color='#334155', pad=8, fontweight='bold')
        ax_ep.spines['top'].set_visible(False)
        ax_ep.spines['right'].set_visible(False)
        ax_ep.grid(axis='y', alpha=0.15)
        plt.tight_layout()
        st.pyplot(fig_ep)
        plt.close(fig_ep)

        # ── Gráfico 2: Comportamento no conjunto de teste (Buy/Sell markers) ───────
        st.markdown("**📊 Simulação no Conjunto de Teste — Sinais de Compra/Venda:**")
        fig_ts, ax_ts = plt.subplots(figsize=(11, 4))
        fig_ts.patch.set_facecolor('#f8fafc')
        ax_ts.set_facecolor('#f8fafc')

        xs_test = list(range(len(precos_test)))
        ax_ts.plot(xs_test, precos_test, color='#334155', linewidth=1.8,
                   label='Preço', zorder=2)

        if compras:
            cx = [c[0] for c in compras]
            cy = [c[1] for c in compras]
            ax_ts.scatter(cx, cy, color='#16a34a', marker='^', s=100,
                          zorder=5, label=f'Compra ({len(compras)})', edgecolors='white', linewidth=0.8)

        if vendas:
            vx = [v[0] for v in vendas]
            vy = [v[1] for v in vendas]
            vc = ['#16a34a' if v[2] >= 0 else '#dc2626' for v in vendas]
            ax_ts.scatter(vx, vy, color=vc, marker='v', s=100,
                          zorder=5, label=f'Venda ({len(vendas)})', edgecolors='white', linewidth=0.8)

        sinal_lt = '+' if lucro_teste >= 0 else ''
        ax_ts.set_title(
            f'Agente RL no Teste — {ticker} | Lucro Total: {sinal_lt}R${lucro_teste:.2f}',
            fontsize=9.5, color='#334155', pad=10, fontweight='bold')
        ax_ts.set_ylabel('Preço (R$)', fontsize=9, color='#64748b')
        ax_ts.set_xlabel(f'Dias (conjunto de teste — últimos {len(precos_test)} pregões)',
                         fontsize=8.5, color='#64748b', labelpad=6)
        ax_ts.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'R${v:.2f}'))
        ax_ts.legend(fontsize=8, framealpha=0.9, loc='upper left')
        ax_ts.spines['top'].set_visible(False)
        ax_ts.spines['right'].set_visible(False)
        ax_ts.grid(alpha=0.12)
        plt.tight_layout()
        st.pyplot(fig_ts)
        plt.close(fig_ts)

        # ── Tabela de operações ────────────────────────────────────────────────────
        if vendas:
            # Resumo: taxa de acerto + resultado, para o total (que pode ser negativo
            # mesmo com várias operações de lucro no topo da lista) fazer sentido.
            n_lucro = sum(1 for v in vendas if v[2] >= 0)
            n_prej  = len(vendas) - n_lucro
            taxa    = (n_lucro / len(vendas) * 100) if vendas else 0
            st.markdown(
                f"**📋 Operações de Venda no Conjunto de Teste** — "
                f"{len(vendas)} operações · ✅ {n_lucro} lucro · ❌ {n_prej} prejuízo · "
                f"acerto **{taxa:.0f}%** · resultado **{'+' if lucro_teste >= 0 else ''}R\\${lucro_teste:.2f}**"
            )
            ops_data = []
            for i, v in enumerate(vendas):
                pnl = v[2]
                ops_data.append({
                    'Op': f'#{i+1}',
                    'Dia': f'D+{v[0]}',
                    'Preço Venda': f'R${v[1]:.2f}',
                    'PnL': f'{"+" if pnl >= 0 else ""}R${pnl:.2f}',
                    'Resultado': '✅ Lucro' if pnl >= 0 else '❌ Prejuízo',
                })
            import pandas as pd
            df_ops = pd.DataFrame(ops_data)
            st.dataframe(df_ops, width="stretch", hide_index=True)

        # ── Legenda técnica ────────────────────────────────────────────────────────
        st.markdown("""
        <div style='margin-top:0.6rem;padding:0.8rem 1rem;background:#f1f5f9;
                    border-radius:8px;font-size:0.76rem;color:#64748b;line-height:1.7;'>
            🧠 <strong>Arquitetura DQN:</strong> MLP 3 camadas (64→32→3 neurônios) · Ativação ReLU · Xavier init
            &nbsp;|&nbsp; 🔄 <strong>Experience Replay:</strong> buffer=500, batch=32
            &nbsp;|&nbsp; 📉 <strong>ε-greedy:</strong> ε=1.0 → 0.05 (decay=0.99)
            &nbsp;|&nbsp; 🎯 <strong>γ (desconto):</strong> 0.95
            &nbsp;|&nbsp; 📊 <strong>Recompensa:</strong> PnL realizado na venda
        </div>""", unsafe_allow_html=True)
