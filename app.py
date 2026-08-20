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

from modules.news import *
from modules.news import _limpar_html, _formatar_data, _traduzir_com_mymemory, _parsear_item_rss, _buscar_rss, _buscar_yahoo_rss, _buscar_gurufocus_rss, _buscar_seekingalpha_rss, _buscar_marketwatch_rss, _buscar_google_news_rss, _buscar_finviz, _analisar_sentimento_noticias, _renderizar_card_noticia
from modules.ml import *
from modules.ml import _prever_preco_ml_cached, _backtestar_ml_cached, renderizar_backtest_ml
from modules.rl import *
from modules.rl import _executar_agente_rl_cached, _sigmoid, _relu, _softmax, _QNetwork, _RLAgent, _get_state_rl
from modules.tradingview import *
from modules.minervini import *
from modules.minervini import _calcular_minervini_cached, _buscar_ibov
from modules.triple_screen import *
from modules.fundamentals import *
from modules.technical import *
from modules.styles import *
from modules.etf import *
from modules.etf import eh_etf, buscar_dados_etf, mapear_etf_us
from modules.ativos import CLASSES, classificar_ativo, eh_bdr, eh_ativo_nativo_b3
from modules.flow import renderizar_painel_flow
from modules.backtest import backtestar_scanner, renderizar_backtest_scanner, backtestar_triple_screen, renderizar_backtest_triple_screen

st.set_page_config(
    page_title="Monitor B3 - Swing Trade",
    page_icon="📉",
    layout="wide"
)

warnings.filterwarnings('ignore')

# Silencia o ruído do yfinance no log (ex.: "possibly delisted", "HTTP Error 404")
# para BDRs sem dado no Yahoo. Como o scanner principal usa o TradingView, esses
# avisos são apenas de buscas pontuais (detalhe de 1 ticker) e já são tratados na UI.
import logging
logging.getLogger('yfinance').setLevel(logging.CRITICAL)

plt.style.use('seaborn-v0_8-darkgrid')

sns.set_palette("husl")

TERMINACOES_BDR = ('31', '32', '33', '34', '35', '39')

st.markdown("""
<style>
    /* Cabeçalho principal */
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 10px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .main-title {
        color: white;
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0;
        text-align: center;
    }
    .main-subtitle {
        color: rgba(255, 255, 255, 0.9);
        font-size: 1.1rem;
        text-align: center;
        margin-top: 0.5rem;
    }

    /* Cards de métricas */
    .metric-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #667eea;
    }

    /* Melhorar botões */
    .stButton > button {
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        border: none;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        transition: all 0.3s ease;
    }
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    /* Melhorar checkboxes */
    .stCheckbox {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Seções */
    .section-header {
        color: #667eea;
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 2rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #667eea;
    }

    /* Tabela */
    .dataframe {
        border-radius: 8px;
        overflow: hidden;
    }

    /* Info boxes */
    .stAlert {
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)

fuso_brasil = pytz.timezone('America/Sao_Paulo')

agora = datetime.now(fuso_brasil)

data_hora_analise = agora.strftime("%d/%m/%Y às %H:%M:%S")

dia_semana = agora.strftime("%A")

dias_pt = {
    'Monday': 'Segunda-feira',
    'Tuesday': 'Terça-feira',
    'Wednesday': 'Quarta-feira',
    'Thursday': 'Quinta-feira',
    'Friday': 'Sexta-feira',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo'
}

dia_semana_pt = dias_pt.get(dia_semana, dia_semana)

st.markdown(f"""
<div class="main-header">
    <h1 class="main-title">📊 Monitor B3 - Swing Trade Pro</h1>
    <p class="main-subtitle">Análise Técnica Avançada | Rastreamento de Oportunidades em Tempo Real</p>
    <p style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem; text-align: center; margin-top: 0.5rem;">
        🕐 {dia_semana_pt}, {data_hora_analise} (Horário de Brasília)
    </p>
</div>
""", unsafe_allow_html=True)

col_info1, col_info2, col_info3 = st.columns(3)

with col_info1:
    st.markdown("**📈 Estratégia:** Reversão em Sobrevenda")

with col_info2:
    st.markdown("**🎯 Foco:** Ativos da B3 em Queda com Potencial")

with col_info3:
    st.markdown("**⏱️ Timeframe:** 6 Meses | Diário")

st.markdown("---")

with st.expander("📚 Guia dos Indicadores - Entenda os Sinais", expanded=False):
    st.markdown("""
    ### 🎯 Índice de Sobrevenda (I.S.)
    **O que é:** Combina RSI e Estocástico para medir o nível de sobrevenda.
    - **75-100**: 🔴 Muito sobrevendido (alta probabilidade de reversão)
    - **60-75**: 🟠 Sobrevendido moderado
    - **< 60**: ⚪ Não sobrevendido

    ### 📉 RSI (Relative Strength Index)
    **O que é:** Mede a força do movimento de preço (0-100).
    - **< 30**: 🟢 Zona de sobrevenda (possível reversão para alta)
    - **30-70**: Zona neutra
    - **> 70**: 🔴 Zona de sobrecompra (possível reversão para baixa)

    ### 📊 Estocástico
    **O que é:** Compara o preço de fechamento com a faixa de preços recente.
    - **< 20**: 🟢 Muito sobrevendido (sinal de compra potencial)
    - **20-80**: Zona neutra
    - **> 80**: 🔴 Sobrecomprado (cuidado)

    ### 📈 MACD (Moving Average Convergence Divergence)
    **O que é:** Mostra a relação entre duas médias móveis.
    - **Virando positivo**: 🟢 Momento de alta começando
    - **Histograma crescente**: Força compradora aumentando

    ### 🎨 Bandas de Bollinger
    **O que é:** Envelope de volatilidade ao redor da média.
    - **Preço abaixo da banda inferior**: 🟢 Sobrevendido (possível reversão)
    - **Preço na banda superior**: 🔴 Sobrecomprado

    ### 🌟 Fibonacci (61.8% - Zona de Ouro)
    **O que é:** Níveis onde o preço tende a encontrar suporte/resistência.
    - **61.8%**: ⭐ Nível mais importante - alta probabilidade de reversão
    - **38.2% e 50%**: Suportes intermediários
    - **Próximo de um nível**: Atenção para possível reversão

    ### 📊 Médias Móveis (EMAs)
    **O que é:** Mostram a direção da tendência.
    - **Preço acima das 3 EMAs**: 🟢 Tendência de alta consolidada
    - **EMA20 > EMA50 > EMA200**: Alinhamento de alta (ideal!)
    - **Preço caindo MAS acima das EMAs**: 📈 Correção em tendência de alta (oportunidade!)

    ### 🖥️ Estratégia Triple Screen (Alexander Elder, 1986)
    **O que é:** Método de 3 camadas publicado por Elder na *Futures Magazine* em 1986. Combina indicadores de tendência com osciladores em timeframes diferentes, eliminando os pontos fracos de cada um. A metáfora: negocie *com* a maré, não contra ela.

    **As 3 Telas (adaptadas para dados diários):**
    - 🌊 **1ª Tela — A Maré (EMA13 + MACD 12,26,9):** Elder usa a **inclinação da EMA13 semanal** como filtro principal de tendência. Como nosso monitor só tem dados diários, usamos a EMA13 diária. O MACD(12,26,9) confirma. EMA13 subindo + MACD positivo = maré de alta. Só opere na direção da maré.
    - 🌀 **2ª Tela — A Onda (EFI 2):** Elder recomenda o **Force Index(2)** ou outro oscilador (Stoch, Williams %R) no timeframe intermediário. Identifica *correções* dentro da tendência maior. Em uptrend: aguarde o EFI cair para sobrevenda → oportunidade de compra. Em downtrend: aguarde sobrecompra → oportunidade de venda.
    - 🎯 **3ª Tela — A Execução (Buy/Sell Stop):** Sem indicador — pura ação do preço. Em setup de compra: coloque um Buy Stop 1 tick acima da máxima anterior. Se o mercado subir e acionar o stop, você entra. Se continuar caindo, a ordem não é executada. Stop-Loss na mínima recente.

    **Sinal completo de compra:** EMA13 subindo + EFI em sobrevenda + Buy Stop acionado
    **Sinal completo de venda:** EMA13 caindo + EFI em sobrecompra + Sell Stop acionado

    ### 💡 Como Usar Este Monitor
    1. **Filtre** por EMAs para encontrar correções em tendências de alta
    2. **Procure** I.S. alto (>75) = forte sobrevenda
    3. **Confirme** com RSI < 30 e Estocástico < 20
    4. **Verifique** se está próximo de Fibonacci 61.8%
    5. **Aplique o Triple Screen:** veja se a maré e a onda estão alinhadas
    6. **Entre** somente quando as 3 telas confirmarem! 🚀
    """)

st.markdown("---")

# --- SELEÇÃO DO UNIVERSO DE ATIVOS ---
# Define quais classes da B3 entram na varredura. Por padrão, todas.
st.markdown("**🌐 Universo de ativos (B3):**")
classes_selecionadas = st.multiselect(
    "Selecione as classes de ativos para varrer",
    options=list(CLASSES),
    default=list(CLASSES),
    help="Ações (ON/PN/Units), BDRs e ETFs nacionais. Marque todas para "
         "varrer o mercado à vista; ou restrinja a uma classe específica.",
    label_visibility="collapsed",
)

if st.button("🔄 Atualizar Análise", type="primary"):
    buscar_oportunidades_mercado.clear()
    buscar_oportunidades_tv.clear()
    classes_scan = classes_selecionadas or list(CLASSES)
    oportunidades = None

    # Caminho rápido: scanner em massa via TradingView (1 requisição, sem o
    # bloqueio de IP do Yahoo). Varre TODO o mercado à vista da B3 filtrando
    # pelas classes escolhidas. O histórico do ticker selecionado é buscado
    # sob demanda no gráfico (obter_historico_ticker).
    with st.spinner("Buscando dados ao vivo do mercado B3 (TradingView)..."):
        oportunidades = buscar_oportunidades_mercado(classes_scan, NOMES_BDRS)

    # Fallback: se o TradingView falhar, usa o caminho antigo via yfinance.
    # O yfinance não varre o mercado inteiro, então recai sobre a lista curada
    # de BDRs (universo original) — melhor entregar algo do que nada.
    if not oportunidades:
        buscar_dados.clear()
        lista_bdrs = list(NOMES_BDRS.keys())
        with st.spinner("TradingView indisponível — baixando BDRs via Yahoo Finance..."):
            df = buscar_dados(lista_bdrs)
            if df.empty:
                st.error("Erro ao carregar dados. Se o Yahoo tiver bloqueado, aguarde alguns minutos.")
                st.stop()
        with st.spinner("Calculando indicadores técnicos..."):
            df_calc = calcular_indicadores(df)
        with st.spinner("Analisando oportunidades..."):
            oportunidades = analisar_oportunidades(df_calc, NOMES_BDRS)

    if oportunidades:
        st.session_state['oportunidades'] = oportunidades
        # Registra quando a análise foi feita (horário de Brasília)
        st.session_state['analise_timestamp'] = datetime.now(pytz.timezone('America/Sao_Paulo'))

if 'oportunidades' in st.session_state:
    oportunidades = st.session_state['oportunidades']

    # Criar DataFrame das oportunidades
    df_res = pd.DataFrame(oportunidades)
    df_res = df_res.sort_values(by='Queda_Dia', ascending=True)

    st.success(f"✅ {len(oportunidades)} oportunidades detectadas!")
    _ts_analise = st.session_state.get('analise_timestamp')
    if _ts_analise:
        st.caption(f"🕒 Análise realizada em {_ts_analise.strftime('%d/%m/%Y às %H:%M')} (horário de Brasília)")

    # --- FILTROS COM DESIGN PROFISSIONAL ---
    st.markdown('<h3 class="section-header">🎯 Filtros de Tendência</h3>', unsafe_allow_html=True)

    st.markdown("""
    <div style='background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                padding: 1rem; border-radius: 8px; margin-bottom: 1rem;'>
        <p style='margin: 0; color: #334155; font-weight: 500;'>
            💡 <strong>Dica:</strong> Selecione as médias móveis para filtrar ativos em correção dentro de tendências de alta
        </p>
    </div>
    """, unsafe_allow_html=True)

    with st.expander("ℹ️ Como usar os filtros"):
        st.markdown("""
Os filtros ajudam a focar em **correções dentro de tendências de alta** (o objetivo do app), removendo quedas em tendência de baixa.

- **Classe do ativo:** restringe a tabela a Ações, BDRs e/ou ETFs. Vazio = todas as classes que foram varridas.
- **Acima da EMA20 / EMA50 / EMA200:** mostra só ativos cujo preço está **acima** da média escolhida. A EMA200 filtra a tendência de **longo prazo** (a mais importante); EMA20/50, curto/médio prazo. Pode combinar mais de uma.
- **Liquidez mínima:** oculta ativos abaixo do ranking de liquidez escolhido (0 = sem filtro; 10 = só os mais líquidos). Útil para evitar papéis com pouco volume e gaps.

> Sem nenhum filtro marcado, a tabela mostra **todos** os ativos em queda no dia.
        """)

    # Filtro por classe de ativo (aplicado sobre o resultado já varrido).
    classes_disponiveis = sorted(
        {opp.get('Classe') for opp in oportunidades if opp.get('Classe')},
        key=lambda c: list(CLASSES).index(c) if c in CLASSES else 99,
    )
    filtro_classes = st.multiselect(
        "🏷️ Classe do ativo",
        options=classes_disponiveis,
        default=[],
        help="Restringe a tabela às classes escolhidas (Ação/BDR/ETF). "
             "Vazio = mostra todas as classes varridas.",
    )

    col_filtro1, col_filtro2, col_filtro3 = st.columns(3)

    with col_filtro1:
        filtrar_ema20 = st.checkbox(
            "📈 Acima da EMA20",
            value=False,
            help="Preço acima da EMA20 (curto prazo)"
        )

    with col_filtro2:
        filtrar_ema50 = st.checkbox(
            "📊 Acima da EMA50",
            value=False,
            help="Preço acima da EMA50 (médio prazo)"
        )

    with col_filtro3:
        filtrar_ema200 = st.checkbox(
            "📉 Acima da EMA200",
            value=False,
            help="Preço acima da EMA200 (longo prazo)"
        )

    # Slider de liquidez
    st.markdown("**💧 Liquidez mínima:**")
    ranking_min_liq = st.slider(
        "0 = sem filtro  |  10 = máxima exigência",
        min_value=0, max_value=10, value=0, step=1,
        help="Filtra ativos pelo ranking de liquidez 0-10. Quanto maior, menor o risco de gaps e volume baixo."
    )

    # Botão global dos backtests (opt-in) — desligado por padrão para não pesar.
    # Quando ligado, a BDR selecionada exibe os backtests de validação histórica
    # (sinal do scanner, Triple Screen e modelo de ML walk-forward).
    rodar_bt = st.toggle(
        "🔬 Rodar backtests de validação histórica no ativo selecionado",
        value=False,
        key="rodar_bt_global",
        help="Desligado por padrão para não pesar o carregamento. Ligue para "
             "validar no histórico o sinal do scanner, o Triple Screen e o "
             "modelo de ML — recalcula ao abrir cada ativo (pode levar segundos).",
    )

    # Aplicar filtros se algum selecionado
    if filtrar_ema20 or filtrar_ema50 or filtrar_ema200 or filtro_classes or ranking_min_liq > 0:
        df_res_filtrado = []
        contadores = {'ema20': 0, 'ema50': 0, 'ema200': 0, 'classe': 0, 'sem_dados': 0}

        for opp in oportunidades:
            ticker = opp['Ticker']
            try:
                # Filtro por classe — aplicado primeiro, sem precisar de histórico
                if filtro_classes:
                    if opp.get('Classe') not in filtro_classes:
                        continue
                    contadores['classe'] += 1

                ultimo_close = opp.get('Preco')
                if ultimo_close is None or pd.isna(ultimo_close):
                    contadores['sem_dados'] += 1
                    continue

                # Verificar cada condição separadamente, usando as EMAs já
                # entregues pelo scanner (TradingView ou fallback yfinance).
                passa_filtro = True

                # Filtro EMA20
                if filtrar_ema20:
                    ema20 = opp.get('EMA20')
                    if pd.notna(ema20) and ultimo_close > ema20:
                        contadores['ema20'] += 1
                    else:
                        passa_filtro = False

                # Filtro EMA50
                if filtrar_ema50 and passa_filtro:
                    ema50 = opp.get('EMA50')
                    if pd.notna(ema50) and ultimo_close > ema50:
                        contadores['ema50'] += 1
                    else:
                        passa_filtro = False

                # Filtro EMA200
                if filtrar_ema200 and passa_filtro:
                    ema200 = opp.get('EMA200')
                    if pd.notna(ema200) and ultimo_close > ema200:
                        contadores['ema200'] += 1
                    else:
                        passa_filtro = False

                # Filtro de Liquidez
                if ranking_min_liq > 0 and passa_filtro:
                    if opp.get('Liquidez', 0) < ranking_min_liq:
                        passa_filtro = False

                # Adicionar se passou em todos os filtros
                if passa_filtro:
                    df_res_filtrado.append(opp)

            except Exception as e:
                contadores['sem_dados'] += 1
                continue

        if df_res_filtrado:
            df_res = pd.DataFrame(df_res_filtrado)
            df_res = df_res.sort_values(by='Queda_Dia', ascending=True)

            # Mensagem personalizada com estatísticas
            filtros_ativos = []
            if filtrar_ema20:
                filtros_ativos.append(f"EMA20 ({contadores['ema20']} ✓)")
            if filtrar_ema50:
                filtros_ativos.append(f"EMA50 ({contadores['ema50']} ✓)")
            if filtrar_ema200:
                filtros_ativos.append(f"EMA200 ({contadores['ema200']} ✓)")
            if filtro_classes:
                filtros_ativos.append(f"Classe {'/'.join(filtro_classes)} ({contadores['classe']} ✓)")

            st.markdown(f"""
            <div style='background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
                        padding: 1rem; border-radius: 8px; margin: 1rem 0;'>
                <p style='margin: 0; color: #166534; font-weight: 600; font-size: 1.1rem;'>
                    ✅ {len(df_res)} ativos encontrados | Filtros ativos: {' + '.join(filtros_ativos) if filtros_ativos else 'Liquidez'}
                </p>
            </div>
            """, unsafe_allow_html=True)
        else:
            # Mostrar estatísticas de debug
            filtros_ativos = []
            if filtrar_ema20:
                filtros_ativos.append(f"EMA20 ({contadores['ema20']} acima)")
            if filtrar_ema50:
                filtros_ativos.append(f"EMA50 ({contadores['ema50']} acima)")
            if filtrar_ema200:
                filtros_ativos.append(f"EMA200 ({contadores['ema200']} acima)")
            if filtro_classes:
                filtros_ativos.append(f"Classe {'/'.join(filtro_classes)} ({contadores['classe']} encontrados)")

            st.markdown(f"""
            <div style='background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
                        padding: 1rem; border-radius: 8px; margin: 1rem 0;'>
                <p style='margin: 0; color: #7c3626; font-weight: 600;'>
                    ⚠️ Nenhum ativo passou em TODOS os filtros combinados
                </p>
                <p style='margin: 0.5rem 0 0 0; color: #7c3626; font-size: 0.9rem;'>
                    📊 {' | '.join(filtros_ativos)} | {contadores['sem_dados']} sem dados suficientes
                </p>
            </div>
            """, unsafe_allow_html=True)
            df_res = pd.DataFrame()  # DataFrame vazio

    if not df_res.empty:
        # --- TABELA INTERATIVA ---
        st.markdown('<h3 class="section-header">📊 Oportunidades Detectadas</h3>', unsafe_allow_html=True)

        st.markdown("""
        <div style='background: #f8fafc; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; border-left: 4px solid #667eea;'>
            <p style='margin: 0; color: #475569; font-size: 0.95rem;'>
                💡 <strong>Dica:</strong> Clique em qualquer linha da tabela para visualizar o gráfico técnico completo
            </p>
        </div>
        """, unsafe_allow_html=True)

        with st.expander("ℹ️ O que é esta seção e como ler cada coluna"):
            st.markdown("""
Lista os ativos da B3 que **caíram no dia** e podem ser oportunidades de compra (correção). Dados ao vivo do TradingView, ordenados da maior para a menor queda.

- **Classe:** tipo do ativo — Ação, BDR ou ETF.
- **Empresa / Liq. (💧):** nome do ativo e **ranking de liquidez 0–10** (pelo volume financeiro médio/dia). Quanto maior, menor o risco de spread/gap e mais fácil entrar e sair.
- **Preço:** cotação atual do ativo na B3 (R\$).
- **Queda_Dia:** variação % no dia (a tabela só mostra quedas).
- **I.S. (Índice de Sobrevenda):** `((100−RSI)+(100−Estocástico))/2`. Quanto **maior**, mais sobrevendido (0–100).
- **Vol. R\$:** volume financeiro médio negociado por dia (R\$).
- **Gap:** diferença % entre a **abertura** de hoje e o **fechamento anterior**.
- **Sinal (Potencial):** qualidade da oportunidade — Baixa / Média / Alta / Muito Alta. Em **tendência de baixa** (abaixo da EMA200) fica limitado a "Média".
- **Força:** pontuação 0–10 somando os sinais detectados.
- **Sinais Técnicos:** gatilhos encontrados (RSI Oversold, Stoch. Fundo, Correção em Alta, Testando EMA200, Abaixo EMA200, etc.).

> ⚠️ É um **rastreador**, não recomendação de compra. Confirme sempre no gráfico e nas demais seções.
            """)

        evento = st.dataframe(
            df_res.style.map(estilizar_potencial, subset=['Potencial'])
                        .map(estilizar_is, subset=['IS'])
                        .map(estilizar_liquidez, subset=['Liquidez'])
            .format({
                'Preco': 'R$ {:.2f}',
                'Volume': 'R$ {:,.0f}',
                'Queda_Dia': '{:.2f}%',
                'Gap': '{:.2f}%',
                'IS': '{:.0f}',
                'RSI14': '{:.0f}',
                'Stoch': '{:.0f}',
                'Liquidez': '{:.0f}'
            }),
            column_order=("Ticker", "Classe", "Empresa", "Liquidez", "Preco", "Queda_Dia", "IS", "Volume", "Gap", "Potencial", "Score", "Sinais"),
            column_config={
                "Classe": st.column_config.TextColumn("Classe", width="small",
                    help="Tipo do ativo: Ação, BDR ou ETF"),
                "Empresa": st.column_config.TextColumn("Empresa", width="medium"),
                "Liquidez": st.column_config.NumberColumn("💧 Liq.", width="small",
                    help="Ranking de Liquidez 0-10 (🔴 baixa → 🟢 alta)"),
                "IS": st.column_config.NumberColumn("I.S.", help="Índice de Sobrevenda"),
                "Volume": st.column_config.NumberColumn("Vol. R$", help="Volume financeiro médio (R$/dia) ≈ volume × preço"),
                "Score": st.column_config.ProgressColumn("Força", format="%d", min_value=0, max_value=10),
                "Potencial": st.column_config.Column("Sinal"),
                "Sinais": st.column_config.TextColumn("Sinais Técnicos", width="large")
            },
            width="stretch",
            hide_index=True,
            on_select="rerun",
            selection_mode="single-row"
        )

        # --- GRÁFICO INTERATIVO ---
        if evento.selection and evento.selection.rows:
            st.markdown("---")
            linha_selecionada = evento.selection.rows[0]
            row = df_res.iloc[linha_selecionada]
            ticker = row['Ticker']

            st.markdown(f'<h3 class="section-header">📈 Análise Técnica: {ticker} - {row["Empresa"]}</h3>', unsafe_allow_html=True)

            with st.expander("ℹ️ Como ler o gráfico técnico"):
                st.markdown("""
O gráfico tem **4 painéis** (histórico via Yahoo; escolha o *timeframe* diário/semanal/mensal e o *zoom*):

- **Painel de Preço:** a linha/candles do preço, as médias **EMA20 (azul), EMA50 (laranja) e EMA200 (verde)**, as **bandas de Bollinger** (sombra cinza) e os **níveis de Fibonacci** (linhas tracejadas coloridas + "Zona de Ouro" na 61,8%). O **título** resume: *I.S.*, a **tendência** (acima/abaixo das EMAs) e o Fibonacci mais próximo.
- **RSI (14):** força relativa 0–100. Abaixo de 30 = sobrevendido; acima de 70 = sobrecomprado.
- **Estocástico %K:** oscilador 0–100. Abaixo de 20 = fundo; acima de 80 = topo.
- **Volume:** barras verdes (dia de alta) / vermelhas (baixa) + média móvel de 20.

> **Importante:** os números do **card ao lado** (Preço, Queda, I.S., Sinais) vêm do TradingView (tempo quase real); o **gráfico** vem do Yahoo (fechamento). Pequenas diferenças entre eles são normais.
                """)

            try:
                df_ticker = obter_historico_ticker(ticker)
                df_ticker = df_ticker.dropna() if df_ticker is not None else pd.DataFrame()

                # Fallback: se a BDR não tem histórico no Yahoo (comum em BDRs novas/
                # ilíquidas), usa o gráfico do ATIVO US subjacente, convertido para a
                # cotação atual da BDR (mesma forma/indicadores, só a escala muda).
                # Dispara também quando o histórico da BDR é CURTO demais (Yahoo traz
                # só uns dias), usando o US se ele tiver mais barras — evita gráfico
                # "achatado" de poucos dias como no A1PP34.
                # O fallback para o ativo subjacente nos EUA só faz sentido para
                # BDRs; ativos nativos da B3 (ações/FIIs/ETFs) têm histórico
                # próprio via .SA e não têm equivalente americano.
                fonte_grafico_us = None
                _MIN_BARRAS_GRAF = 40
                if eh_bdr(ticker) and (df_ticker.empty or len(df_ticker) < _MIN_BARRAS_GRAF):
                    # Para BDR de ETF, o ticker US vem do mapa curado (mapear_etf_us);
                    # para ações, do mapa padrão. O strip de dígitos não acha o fundo
                    # americano (ex.: BEWY39 -> 'BEWY' inexistente; correto é 'EWY').
                    _ticker_us_graf = mapear_etf_us(ticker) if eh_etf(ticker) else mapear_ticker_us(ticker)
                    if _ticker_us_graf and _ticker_us_graf != ticker:
                        _df_us = obter_historico_us_escalado(_ticker_us_graf, row['Preco'])
                        if _df_us is not None:
                            _df_us = _df_us.dropna()
                            if len(_df_us) > len(df_ticker):
                                df_ticker = _df_us
                                fonte_grafico_us = _ticker_us_graf

                if df_ticker.empty:
                    raise ValueError("__SEM_HISTORICO__")

                if fonte_grafico_us:
                    st.caption(f"ℹ️ Sem histórico da BDR na B3 — exibindo o gráfico do ativo subjacente **{fonte_grafico_us}** (EUA), convertido pela cotação atual da BDR. Forma e indicadores são os mesmos; a escala é aproximada.")

                # As métricas do detalhe (preço, queda, EMAs, sinais) vêm do screener
                # (TradingView) — fonte atual e a MESMA base do filtro de EMAs. Para
                # BDRs ilíquidas o histórico diário do yfinance costuma estar defasado,
                # então ele é usado apenas para DESENHAR as linhas do gráfico, e os
                # valores/EMAs atuais do TradingView são passados para o status do gráfico
                # ficar coerente com a tabela e com o filtro.
                emas_screener = {
                    'EMA20':  row.get('EMA20'),
                    'EMA50':  row.get('EMA50'),
                    'EMA200': row.get('EMA200'),
                }

                # ── Controles do gráfico ─────────────────────────────────────────
                st.markdown("**⚙️ Configurações do Gráfico:**")
                ctrl_col1, ctrl_col2, ctrl_col3, ctrl_col4, ctrl_col5 = st.columns([2, 1, 1, 1, 1])

                with ctrl_col1:
                    timeframe_sel = st.radio(
                        "📅 Timeframe",
                        options=['Horário (60min)', 'Diário', 'Semanal', 'Mensal'],
                        index=1,
                        horizontal=True,
                        key=f"tf_{ticker}"
                    )

                with ctrl_col2:
                    tipo_graf = st.selectbox(
                        "📊 Tipo",
                        options=['Linha', 'Candlestick'],
                        index=0,
                        key=f"tipo_{ticker}"
                    )

                with ctrl_col3:
                    zoom_opcoes = {
                        'Tudo': None,
                        '3M':  63,
                        '1M':  21,
                        '15d': 15,
                        '5d':  5,
                    }
                    zoom_label = st.selectbox(
                        "🔍 Período visível",
                        options=list(zoom_opcoes.keys()),
                        index=0,
                        key=f"zoom_sel_{ticker}"
                    )
                    zoom_val = zoom_opcoes[zoom_label]

                with ctrl_col4:
                    if st.button("🔎+  Zoom In", key=f"zin_{ticker}"):
                        current_zoom = st.session_state.get(f'zoom_custom_{ticker}', None)
                        if current_zoom is None:
                            st.session_state[f'zoom_custom_{ticker}'] = max(10, len(df_ticker) // 2)
                        else:
                            st.session_state[f'zoom_custom_{ticker}'] = max(10, int(current_zoom * 0.6))

                with ctrl_col5:
                    if st.button("🔍−  Zoom Out", key=f"zout_{ticker}"):
                        current_zoom = st.session_state.get(f'zoom_custom_{ticker}', None)
                        if current_zoom is None:
                            pass
                        else:
                            new_zoom = int(current_zoom * 1.6)
                            total = len(df_ticker)
                            if new_zoom >= total:
                                st.session_state[f'zoom_custom_{ticker}'] = None
                            else:
                                st.session_state[f'zoom_custom_{ticker}'] = new_zoom

                # Zoom: dropdown tem prioridade; botões ajustam dentro do dropdown "Tudo"
                zoom_final = zoom_val
                if zoom_val is None and f'zoom_custom_{ticker}' in st.session_state:
                    zoom_final = st.session_state[f'zoom_custom_{ticker}']
                elif zoom_val is not None:
                    # Resetar zoom customizado quando usuário escolhe período fixo
                    st.session_state.pop(f'zoom_custom_{ticker}', None)

                # Layout: gráfico maior à esquerda, info à direita
                col1, col2 = st.columns([3, 1])

                with col1:
                    # Busca dados horários reais quando necessário
                    df_horario = None
                    if timeframe_sel == 'Horário (60min)':
                        with st.spinner('Carregando dados horários (60min)...'):
                            df_horario = buscar_dados_horario(ticker)
                        if df_horario is None:
                            st.caption('⚠️ Dados horários indisponíveis — usando fallback diário.')

                    # Para semanal/mensal, puxa mais histórico para que os
                    # indicadores recalculados nesses timeframes tenham barras
                    # suficientes (ex.: EMA200 semanal precisa de ~5 anos). O
                    # diário/horário mantém o histórico padrão (1 ano).
                    df_ticker_plot = df_ticker
                    _periodo_tf = {'Semanal': '5y', 'Mensal': 'max'}.get(timeframe_sel)
                    if _periodo_tf:
                        try:
                            # Se o gráfico está no fallback US, puxa o histórico longo
                            # também do ativo US; senão, da própria BDR.
                            if fonte_grafico_us:
                                _df_longo = obter_historico_us_escalado(fonte_grafico_us, row['Preco'], periodo=_periodo_tf)
                            else:
                                _df_longo = obter_historico_ticker(ticker, periodo=_periodo_tf)
                            if _df_longo is not None and not _df_longo.dropna(subset=['Close']).empty:
                                df_ticker_plot = _df_longo
                        except Exception:
                            pass

                    try:
                        fig = plotar_grafico(df_ticker_plot, ticker, row['Empresa'], row['RSI14'], row['IS'],
                                             timeframe=timeframe_sel,
                                             zoom_periods=zoom_final,
                                             tipo_grafico=tipo_graf,
                                             df_horario=df_horario,
                                             preco_atual=row['Preco'],
                                             emas_atual=emas_screener)
                    except TypeError:
                        # Resiliência ao recarregamento parcial de módulos no Streamlit
                        # Cloud: se a versão em cache de plotar_grafico ainda não tiver os
                        # kwargs novos, desenha sem eles (status cai para base yfinance).
                        fig = plotar_grafico(df_ticker_plot, ticker, row['Empresa'], row['RSI14'], row['IS'],
                                             timeframe=timeframe_sel,
                                             zoom_periods=zoom_final,
                                             tipo_grafico=tipo_graf,
                                             df_horario=df_horario)
                    st.pyplot(fig)

                with col2:
                    potencial = row['Potencial']

                    # Card de potencial
                    if "Alta" in potencial:
                        cor_bg = "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)"
                        cor_texto = "#166534"
                        icone = "🟢"
                    elif "Média" in potencial:
                        cor_bg = "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)"
                        cor_texto = "#7c3626"
                        icone = "🟡"
                    else:
                        cor_bg = "linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)"
                        cor_texto = "#2d3436"
                        icone = "⚪"

                    st.markdown(f"""
                    <div style='background: {cor_bg}; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;'>
                        <h2 style='margin: 0; color: {cor_texto}; text-align: center;'>
                            {icone} {potencial}
                        </h2>
                    </div>
                    """, unsafe_allow_html=True)

                    st.metric("💰 Preço Atual", f"R$ {row['Preco']:.2f}")
                    st.metric("📉 Queda no Dia", f"{row['Queda_Dia']:.2f}%", delta_color="inverse")
                    st.metric("🎯 I.S. (Sobrevenda)", f"{row['IS']:.0f}/100")

                    if row['Gap'] < -1:
                        st.metric("⚡ Gap de Abertura", f"{row['Gap']:.2f}%", delta_color="inverse")

                    st.markdown(f"**⭐ Score:** {row['Score']}/10")
                    # Escapa os '$' para o Streamlit não interpretar como fórmula (LaTeX).
                    st.markdown(f"**📊 Volume (R\\$/dia):** R\\$ {row['Volume']:,.0f}")

                    # Sinais técnicos
                    st.markdown("""
                    <div style='background: #e0e7ff; padding: 0.75rem; border-radius: 6px; margin-top: 1rem;'>
                        <p style='margin: 0; font-weight: 600; color: #3730a3; font-size: 0.9rem;'>
                            📋 Sinais Detectados
                        </p>
                    </div>
                    """, unsafe_allow_html=True)
                    st.markdown(f"<p style='font-size: 0.85rem; color: #475569;'>{row['Sinais']}</p>", unsafe_allow_html=True)

                    # Explicações didáticas
                    if 'Explicacoes' in row and row['Explicacoes']:
                        st.markdown("""
                        <div style='background: #fef3c7; padding: 0.75rem; border-radius: 6px; margin-top: 1rem;'>
                            <p style='margin: 0; font-weight: 600; color: #92400e; font-size: 0.9rem;'>
                                💡 O que isso significa?
                            </p>
                        </div>
                        """, unsafe_allow_html=True)
                        for explicacao in row['Explicacoes']:
                            st.markdown(f"<p style='font-size: 0.82rem; color: #92400e; margin: 0.3rem 0;'>• {explicacao}</p>", unsafe_allow_html=True)

            except Exception as e:
                if str(e) == "__SEM_HISTORICO__":
                    if eh_etf(ticker):
                        st.info(
                            f"📊 Gráfico técnico indisponível para a BDR de ETF **{ticker}** — "
                            "sem histórico na B3 e sem ETF americano equivalente mapeado. "
                            "Os dados do fundo (composição, patrimônio, taxa) aparecem em "
                            "**Detalhes da ETF**, logo abaixo.")
                    else:
                        st.warning(
                            f"📊 Sem histórico para **{ticker}** no momento "
                            "(o Yahoo pode ter bloqueado temporariamente). "
                            "Tente novamente em instantes.")
                else:
                    st.error(f"❌ Erro ao carregar gráfico: {e}")

            # === PAINEL DETALHADO DE ETF (se aplicável) ===
            if eh_etf(ticker):
                st.markdown("---")
                with st.spinner(f"Buscando dados detalhados da ETF {ticker}..."):
                    dados_etf = buscar_dados_etf(ticker)
                renderizar_painel_etf(dados_etf, ticker, row['Empresa'])

            # === ESTRATÉGIA TRIPLE SCREEN ===
            st.markdown("---")
            try:
                df_ticker_ts = obter_historico_ticker(ticker)
                if df_ticker_ts is None or df_ticker_ts.dropna().empty:
                    resultado_ts = None
                else:
                    resultado_ts = analisar_triple_screen(df_ticker_ts.dropna())
            except Exception:
                resultado_ts = None
            renderizar_triple_screen(resultado_ts, ticker, row['Empresa'])

            # === BACKTESTS DE VALIDAÇÃO HISTÓRICA (opt-in global) ===
            # O botão fica junto dos filtros, acima do scanner (rodar_bt). Só
            # computa quando ligado — evita recalcular os sinais barra a barra
            # (scanner, Triple Screen) e retreinar o ensemble de ML (walk-forward)
            # a cada seleção de BDR.
            if rodar_bt:
                st.markdown("---")
                # Valida no histórico a MESMA regra que a tabela usa para apontar
                # a oportunidade. Usa o histórico da BDR; se for curto demais
                # (BDR ilíquida), cai para o ativo US subjacente, como o gráfico.
                try:
                    _hist_bt = obter_historico_ticker(ticker)
                    _hist_bt = _hist_bt.dropna(subset=['Close']) if _hist_bt is not None else pd.DataFrame()
                    # Fallback para o ativo US subjacente só vale para BDRs.
                    if eh_bdr(ticker) and (_hist_bt.empty or len(_hist_bt) < 80):
                        _tk_us_bt = mapear_etf_us(ticker) if eh_etf(ticker) else mapear_ticker_us(ticker)
                        if _tk_us_bt and _tk_us_bt != ticker:
                            _df_us_bt = obter_historico_us_escalado(_tk_us_bt, row['Preco'])
                            if _df_us_bt is not None:
                                _df_us_bt = _df_us_bt.dropna(subset=['Close'])
                                if len(_df_us_bt) > len(_hist_bt):
                                    _hist_bt = _df_us_bt
                    with st.spinner("Rodando backtest do sinal..."):
                        resultado_bt = backtestar_scanner(_hist_bt)
                except Exception:
                    resultado_bt = None
                    _hist_bt = None
                renderizar_backtest_scanner(resultado_bt, ticker, row['Empresa'])

                # Backtest do Triple Screen (Elder) — reaproveita o mesmo histórico.
                try:
                    with st.spinner("Rodando backtest do Triple Screen..."):
                        resultado_bt_ts = (backtestar_triple_screen(_hist_bt)
                                           if _hist_bt is not None else None)
                except Exception:
                    resultado_bt_ts = None
                renderizar_backtest_triple_screen(resultado_bt_ts, ticker, row['Empresa'])

            # === PAINEL FUNDAMENTALISTA (ABAIXO DO GRÁFICO) ===
            st.markdown("---")
            st.markdown('<h3 class="section-header">📊 Análise Fundamentalista</h3>', unsafe_allow_html=True)

            with st.expander("ℹ️ O que é o score fundamentalista"):
                st.markdown("""
Avalia a **saúde da empresa** (para BDRs, a empresa-mãe no exterior; para ações/FIIs/ETFs, a própria emissora na B3) — não o preço do papel —, com um score **0–100%** a partir de uma base neutra de 50, somando bônus e penalidades:

- **P/E Ratio (Preço/Lucro):** múltiplo de valuation. Baixo/moderado soma pontos; muito alto (>50) penaliza.
- **Dividend Yield:** dividendo anual ÷ preço. Yields maiores somam pontos.
- **Crescimento de Receita:** crescimento anual das vendas.
- **Recomendação de Analistas:** consenso (compra/manter/venda).
- **Market Cap:** porte da empresa.

Faixas: **≥80% Excelente · 65–79 Bom · 50–64 Neutro · 35–49 Atenção · <35 Evitar**. As fontes são tentadas em cascata: **Yahoo Finance → OpenBB/FMP → BRAPI (B3)**.

> É análise de **médio/longo prazo** — complementa (não substitui) a leitura técnica de curto prazo do swing trade.
                """)

            with st.spinner(f"Buscando dados fundamentalistas de {ticker}..."):
                fund_data = buscar_dados_fundamentalistas(ticker)

            if fund_data:
                # Card com score em porcentagem
                score = fund_data['score']
                fonte = fund_data.get('fonte', 'Yahoo Finance')
                ticker_fonte = fund_data.get('ticker_fonte', ticker)

                if score >= 80:
                    cor_fundo = "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)"
                    cor_texto = "#166534"
                    label = "EXCELENTE"
                elif score >= 65:
                    cor_fundo = "linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)"
                    cor_texto = "#065f46"
                    label = "BOM"
                elif score >= 50:
                    cor_fundo = "linear-gradient(135deg, #fde047 0%, #fbbf24 100%)"
                    cor_texto = "#92400e"
                    label = "NEUTRO"
                elif score >= 35:
                    cor_fundo = "linear-gradient(135deg, #fdcb6e 0%, #ff7043 100%)"
                    cor_texto = "#7c3626"
                    label = "ATENÇÃO"
                else:
                    cor_fundo = "linear-gradient(135deg, #ef5350 0%, #c62828 100%)"
                    cor_texto = "white"
                    label = "EVITAR"

                st.markdown(f"""
                <div style='background: {cor_fundo}; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;'>
                    <div style='text-align: center;'>
                        <h1 style='margin: 0; color: {cor_texto}; font-size: 4rem; font-weight: 900;'>{score:.0f}%</h1>
                        <p style='margin: 0.5rem 0 0 0; color: {cor_texto}; font-size: 1.5rem; font-weight: 600;'>
                            {label}
                        </p>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                # Fonte dos dados
                if 'BRAPI' in fonte:
                    st.info(f"📡 **Fonte:** {fonte} | Ticker: **{ticker_fonte}**\n\n⚠️ *Dados limitados disponíveis para este ativo. Score baseado em Market Cap e Volume na B3.*")
                elif eh_bdr(ticker):
                    st.success(f"📡 **Fonte:** {fonte} | Ticker US: **{ticker_fonte}**")
                else:
                    st.success(f"📡 **Fonte:** {fonte} | Ticker: **{ticker_fonte}**")

                # Moeda dos valores: BRAPI é dado da B3 (em reais); Yahoo/FMP em dólar.
                moeda_fund = 'R$' if 'BRAPI' in fonte else '$'

                # Métricas em colunas
                col1, col2, col3 = st.columns(3)

                with col1:
                    st.markdown("### 📈 Valuation")
                    if fund_data.get('pe_ratio'):
                        st.metric("P/E Ratio", f"{fund_data['pe_ratio']:.2f}")
                    else:
                        st.metric("P/E Ratio", "N/A")

                    if fund_data.get('market_cap'):
                        mcap_b = fund_data['market_cap'] / 1e9
                        if mcap_b >= 1000:
                            st.metric("Market Cap", f"{moeda_fund}{mcap_b/1000:.2f}T")
                        else:
                            st.metric("Market Cap", f"{moeda_fund}{mcap_b:.1f}B")
                    else:
                        st.metric("Market Cap", "N/A")

                with col2:
                    st.markdown("### 💰 Rentabilidade")
                    if fund_data.get('dividend_yield'):
                        st.metric("Dividend Yield", f"{fund_data['dividend_yield']*100:.2f}%")
                    else:
                        st.metric("Dividend Yield", "N/A")

                    if fund_data.get('revenue_growth'):
                        growth = fund_data['revenue_growth'] * 100
                        st.metric("Crescimento Receita", f"{growth:+.1f}%",
                                 delta=f"{growth:.1f}%" if growth > 0 else None)
                    elif fund_data.get('volume_b3'):
                        st.metric("Volume B3", f"{fund_data['volume_b3']:,.0f}")
                    else:
                        st.metric("Crescimento Receita", "N/A")

                with col3:
                    st.markdown("### 🎯 Info")
                    rec = fund_data.get('recomendacao')
                    if rec and rec != 'N/A':
                        rec_map = {
                            'strong_buy': ('🟢 COMPRA FORTE', 'green'),
                            'buy': ('🟢 Compra', 'green'),
                            'hold': ('🟡 Manter', 'orange'),
                            'sell': ('🔴 Venda', 'red'),
                            'strong_sell': ('🔴 VENDA FORTE', 'red'),
                        }
                        rec_texto, rec_cor = rec_map.get(rec, (rec.upper(), 'gray'))
                        st.markdown(f"**Analistas:**")
                        st.markdown(f"<h3 style='color: {rec_cor}; margin: 0;'>{rec_texto}</h3>", unsafe_allow_html=True)

                    if fund_data.get('setor') and fund_data['setor'] != 'N/A':
                        st.markdown(f"**Setor:**")
                        st.markdown(f"<p style='font-size: 1.1rem; margin: 0;'>{fund_data['setor']}</p>", unsafe_allow_html=True)
                    else:
                        st.markdown("**Setor:** N/A")

                # Detalhamento da Pontuação
                st.markdown("---")
                st.markdown("### 📋 Detalhamento da Pontuação")

                detalhes = fund_data.get('detalhes', {})

                # Criar tabela de detalhamento
                dados_tabela = []

                # Verificar se tem dados BRAPI ou Yahoo
                if 'fonte' in detalhes and 'BRAPI' in detalhes['fonte'].get('valor', ''):
                    # Dados da BRAPI
                    fonte_det = detalhes.get('fonte', {})
                    dados_tabela.append({
                        'Métrica': 'Fonte de Dados',
                        'Valor': fonte_det.get('valor', 'BRAPI'),
                        'Pontos': '-',
                        'Avaliação': fonte_det.get('criterio', 'Dados da B3')
                    })

                    mcap_det = detalhes.get('market_cap', {})
                    if mcap_det.get('valor'):
                        mcap_val = mcap_det['valor'] / 1e9
                        if mcap_val >= 1000:
                            valor_str = f"{moeda_fund}{mcap_val/1000:.2f}T"
                        else:
                            valor_str = f"{moeda_fund}{mcap_val:.1f}B"
                        dados_tabela.append({
                            'Métrica': 'Market Cap',
                            'Valor': valor_str,
                            'Pontos': f"{mcap_det['pontos']:+d}/20",
                            'Avaliação': mcap_det.get('criterio', '-')
                        })

                    vol_det = detalhes.get('volume', {})
                    if vol_det.get('valor'):
                        dados_tabela.append({
                            'Métrica': 'Volume B3',
                            'Valor': f"{vol_det['valor']:,.0f}",
                            'Pontos': f"{vol_det['pontos']:+d}/10",
                            'Avaliação': vol_det.get('criterio', '-')
                        })
                else:
                    # Dados do Yahoo Finance (completos)
                    pe_det = detalhes.get('pe_ratio', {})
                    if pe_det.get('valor'):
                        dados_tabela.append({
                            'Métrica': 'P/E Ratio',
                            'Valor': f"{pe_det['valor']:.2f}",
                            'Pontos': f"{pe_det['pontos']:+d}/15",
                            'Avaliação': pe_det.get('criterio', '-')
                        })

                    div_det = detalhes.get('dividend_yield', {})
                    if div_det.get('valor'):
                        dados_tabela.append({
                            'Métrica': 'Dividend Yield',
                            'Valor': f"{div_det['valor']*100:.2f}%",
                            'Pontos': f"{div_det['pontos']:+d}/10",
                            'Avaliação': div_det.get('criterio', '-')
                        })

                    rev_det = detalhes.get('revenue_growth', {})
                    if rev_det.get('valor') is not None:
                        dados_tabela.append({
                            'Métrica': 'Crescimento Receita',
                            'Valor': f"{rev_det['valor']*100:+.1f}%",
                            'Pontos': f"{rev_det['pontos']:+d}/15",
                            'Avaliação': rev_det.get('criterio', '-')
                        })

                    rec_det = detalhes.get('recomendacao', {})
                    if rec_det.get('valor'):
                        dados_tabela.append({
                            'Métrica': 'Recomendação Analistas',
                            'Valor': rec_det['valor'].replace('_', ' ').title(),
                            'Pontos': f"{rec_det['pontos']:+d}/10",
                            'Avaliação': rec_det.get('criterio', '-')
                        })

                    mcap_det = detalhes.get('market_cap', {})
                    if mcap_det.get('valor'):
                        mcap_val = mcap_det['valor'] / 1e9
                        if mcap_val >= 1000:
                            valor_str = f"{moeda_fund}{mcap_val/1000:.2f}T"
                        else:
                            valor_str = f"{moeda_fund}{mcap_val:.1f}B"
                        dados_tabela.append({
                            'Métrica': 'Market Cap',
                            'Valor': valor_str,
                            'Pontos': f"{mcap_det['pontos']:+d}/10",
                            'Avaliação': mcap_det.get('criterio', '-')
                        })

                if dados_tabela:
                    df_detalhes = pd.DataFrame(dados_tabela)
                    st.dataframe(
                        df_detalhes,
                        width="stretch",
                        hide_index=True,
                        column_config={
                            "Métrica": st.column_config.TextColumn("Métrica", width="medium"),
                            "Valor": st.column_config.TextColumn("Valor Atual", width="small"),
                            "Pontos": st.column_config.TextColumn("Pontos", width="small"),
                            "Avaliação": st.column_config.TextColumn("Avaliação", width="medium"),
                        }
                    )

                    st.caption(f"**Score Total:** {score:.0f}/100 (Base: 50 + Bônus/Penalidades)")
                else:
                    st.warning("Não há detalhes disponíveis para esta análise.")

            else:
                st.warning(f"⚠️ Não foi possível obter dados fundamentalistas para {ticker}")
                if eh_bdr(ticker):
                    ticker_us = mapear_ticker_us(ticker)
                    st.info(f"""
                💡 **Por que isso acontece?**

                - Ticker BDR: `{ticker}`
                - Ticker US mapeado: `{ticker_us}`

                **Tentativas realizadas:**
                1. ❌ Yahoo Finance (empresa mãe) - Sem dados
                2. ❌ OpenBB / FMP (empresa mãe) - Sem dados
                3. ❌ BRAPI (BDR na B3) - Sem dados

                **Possíveis causas:**
                - BDR muito nova ou com baixíssimo volume
                - Ticker não listado ou delisted
                - Dados ainda não disponíveis nas APIs públicas

                **Solução:** Infelizmente este ticker não possui dados fundamentalistas disponíveis nas fontes consultadas.
                """)
                else:
                    st.info(f"""
                💡 **Por que isso acontece?**

                - Ticker na B3: `{ticker}.SA`

                **Tentativas realizadas:**
                1. ❌ Yahoo Finance (ticker .SA) - Sem dados
                2. ❌ BRAPI (ativo na B3) - Sem dados

                **Possíveis causas:**
                - Ativo muito novo ou com baixíssimo volume
                - FII/ETF sem métricas fundamentalistas clássicas (P/L, ROE) nas APIs
                - Ticker não listado ou dados ainda indisponíveis nas APIs públicas

                **Solução:** Este ativo não possui dados fundamentalistas disponíveis nas fontes consultadas.
                """)

            # === MÓDULO DE MACHINE LEARNING ===
            st.markdown("---")
            # Usa wrapper cacheado — só re-treina se o ticker mudar
            resultado_ml = _prever_preco_ml_cached(ticker, dias_previsao=5)
            renderizar_painel_ml(resultado_ml, ticker, row['Empresa'], dias_previsao=5)

            # Backtest walk-forward do modelo — valida se seguir a previsão
            # diária teria dado dinheiro (o que o R² não responde). Gated pelo
            # mesmo botão dos demais backtests, para não retreinar sem opt-in.
            if rodar_bt:
                with st.spinner("Rodando backtest walk-forward do modelo..."):
                    resultado_bt_ml = _backtestar_ml_cached(ticker)
                renderizar_backtest_ml(resultado_bt_ml, ticker, row['Empresa'])

            # === MÓDULO DE REINFORCEMENT LEARNING ===
            resultado_rl = _executar_agente_rl_cached(ticker, episodes=8, window_size=5)
            renderizar_painel_rl(resultado_rl, ticker, row['Empresa'])

            # === ANÁLISE DE FASE — METODOLOGIA MINERVINI ===
            resultado_mv = _calcular_minervini_cached(ticker)
            renderizar_painel_minervini(resultado_mv, ticker, row['Empresa'])

            # === FLOW.AI — FLUXO DE BIG PLAYERS ===
            try:
                df_flow_input = obter_historico_ticker(ticker)
                if df_flow_input is not None and not df_flow_input.dropna().empty:
                    renderizar_painel_flow(df_flow_input.dropna(), ticker, row['Empresa'])
            except Exception:
                pass

            # === TRADINGVIEW SCREENER — DADOS AO VIVO ===
            # BDR: consulta o ativo subjacente nos EUA. Ativo nativo da B3
            # (ação/FII/ETF): consulta o próprio ticker no mercado brasileiro.
            if eh_bdr(ticker):
                ticker_tv = mapear_ticker_us(ticker)
                mercado_tv = 'america'
            else:
                ticker_tv = ticker
                mercado_tv = 'brazil'
            with st.spinner(f'Buscando dados TradingView para {ticker_tv}...'):
                dados_tv = buscar_dados_tradingview(ticker_tv, ticker, mercado=mercado_tv)
            peers_tv = []
            if not dados_tv.get('erro') and dados_tv.get('setor'):
                peers_tv = buscar_peers_tradingview(
                    dados_tv['setor'], ticker_tv, top_n=5, mercado=mercado_tv)
            renderizar_painel_tradingview(dados_tv, ticker_tv, row['Empresa'], peers_tv)

            # === SEÇÃO DE NOTÍCIAS ===
            st.markdown("---")
            st.markdown('<h3 class="section-header">📰 Últimas Notícias da Empresa</h3>', unsafe_allow_html=True)

            with st.expander("ℹ️ Sobre as notícias"):
                st.markdown("""
Reúne as notícias dos **últimos 30 dias** da empresa-mãe, de várias fontes (Yahoo Finance, Google News, Seeking Alpha, MarketWatch, Finviz, GuruFocus), **traduzidas para o português**.

- Um resumo de **análise de sentimento** (via IA) indica se o noticiário está mais positivo, neutro ou negativo, considerando a variação do dia.
- Os cards trazem a manchete, a fonte e a data; os **links** levam à matéria original.

> Use como **contexto qualitativo** — notícias explicam movimentos, mas não substituem a análise técnica e o gerenciamento de risco.
                """)

            # BDR: notícias da empresa-mãe pelo ticker US. Ativo nativo da B3:
            # notícias pelo próprio ticker .SA (Yahoo) + nome em português, que o
            # Google News resolve para o noticiário brasileiro.
            if eh_bdr(ticker):
                ticker_us_news = mapear_ticker_us(ticker)
            else:
                ticker_us_news = f"{ticker}.SA"
            # Nome da empresa: prioriza fund_data, depois NOMES_BDRS, depois row['Empresa']
            empresa_nome_news = (
                NOMES_BDRS.get(ticker)
                or row.get('Empresa', ticker_us_news)
                or ticker_us_news
            )
            setor_news        = ''
            variacao_dia_news = None
            if fund_data:
                nome_fund = fund_data.get('nome', '') or ''
                if nome_fund and len(nome_fund) > 3:
                    empresa_nome_news = nome_fund
                setor_news = fund_data.get('setor', '') or ''
            # Pega variação do dia se disponível na linha da tabela
            try:
                variacao_dia_news = float(row.get('Queda_Dia', 0) or 0)
            except Exception:
                variacao_dia_news = None

            # Cabeçalho com info + botão atualizar
            hc1, hc2 = st.columns([4, 1])
            with hc1:
                st.markdown(
                    f"🔎 **{empresa_nome_news}** &nbsp;·&nbsp; `{ticker_us_news}`"
                    + (f" &nbsp;·&nbsp; *{setor_news}*" if setor_news else ""),
                    unsafe_allow_html=True
                )
            with hc2:
                if st.button("🔄 Atualizar", key=f"btn_news_{ticker}", width="stretch"):
                    buscar_noticias_com_traducao.clear()

            with st.spinner("Buscando notícias recentes..."):
                noticias_lista = buscar_noticias_com_traducao(ticker_us_news, empresa_nome_news)

            if noticias_lista:
                # ── Análise de sentimento via Claude AI ───────────────────────
                with st.spinner("Analisando sentimento das notícias..."):
                    sentimento_html = _analisar_sentimento_noticias(
                        noticias_lista, ticker_us_news,
                        empresa_nome_news, variacao_dia_news)
                if sentimento_html:
                    st.markdown(sentimento_html, unsafe_allow_html=True)

                # ── Placar de sentimento por manchete (finVADER léxico) ─────────
                # Complementa a análise da IA: contagem determinística por
                # manchete, funciona mesmo se a chamada ao Claude falhar.
                _sents = [n.get('sentimento') for n in noticias_lista if n.get('sentimento')]
                if _sents:
                    _pos = sum(1 for s in _sents if s['label'] == 'Positivo')
                    _neg = sum(1 for s in _sents if s['label'] == 'Negativo')
                    _neu = len(_sents) - _pos - _neg
                    _media = sum(s['score'] for s in _sents) / len(_sents)
                    if _media >= 0.05:
                        _tom, _tcor = 'predominância positiva', '#15803d'
                    elif _media <= -0.05:
                        _tom, _tcor = 'predominância negativa', '#b91c1c'
                    else:
                        _tom, _tcor = 'tom neutro/misto', '#64748b'
                    st.markdown(
                        f"<div style='display:flex;gap:0.6rem;align-items:center;flex-wrap:wrap;"
                        f"margin:-0.3rem 0 0.6rem;font-size:0.8rem;'>"
                        f"<span style='font-weight:700;color:#475569;'>Sentimento das manchetes:</span>"
                        f"<span style='color:#15803d;font-weight:700;'>🟢 {_pos}</span>"
                        f"<span style='color:#64748b;font-weight:700;'>⚪ {_neu}</span>"
                        f"<span style='color:#b91c1c;font-weight:700;'>🔴 {_neg}</span>"
                        f"<span style='color:{_tcor};'>· {_tom} (média {_media:+.2f})</span>"
                        f"<span style='color:#94a3b8;font-size:0.7rem;'>· léxico financeiro finVADER</span>"
                        f"</div>", unsafe_allow_html=True)

                # ── Caption de resumo ──────────────────────────────────────────
                from collections import Counter
                contagem_fontes = Counter(n['fonte'] for n in noticias_lista)
                fontes_str = ' · '.join(
                    f"{f} ({c})" for f, c in contagem_fontes.most_common())
                # Data mais recente
                datas_validas = [n['dt'] for n in noticias_lista if n.get('dt')]
                data_mais_recente = (max(datas_validas).strftime('%d/%m/%Y %H:%M')
                                     if datas_validas else '—')
                st.caption(
                    f"✅ {len(noticias_lista)} notícias dos últimos 30 dias · "
                    f"Mais recente: {data_mais_recente} · "
                    f"{fontes_str} · 🌐 Traduzidas para português")

                # ── Cards em 2 colunas (ordenados por data desc) ───────────────
                col_n1, col_n2 = st.columns(2)
                metade = (len(noticias_lista) + 1) // 2
                with col_n1:
                    for noticia in noticias_lista[:metade]:
                        st.markdown(_renderizar_card_noticia(noticia), unsafe_allow_html=True)
                with col_n2:
                    for noticia in noticias_lista[metade:]:
                        st.markdown(_renderizar_card_noticia(noticia), unsafe_allow_html=True)

                # ── Links rápidos ──────────────────────────────────────────────
                st.markdown("---")
                st.markdown("**🔗 Acompanhe nas fontes originais:**")
                lc = st.columns(5)
                links_fontes = [
                    ("📊 Yahoo Finance", f"https://finance.yahoo.com/quote/{ticker_us_news}/news/"),
                    ("🌐 Google News",   f"https://news.google.com/search?q={requests.utils.quote(empresa_nome_news)}+stock&hl=pt-BR"),
                    ("📈 Seeking Alpha", f"https://seekingalpha.com/symbol/{ticker_us_news}/news"),
                    ("🔍 Finviz",        f"https://finviz.com/quote.ashx?t={ticker_us_news}"),
                    ("🧙 GuruFocus",     f"https://www.gurufocus.com/news/{ticker_us_news}"),
                ]
                for col, (label, url) in zip(lc, links_fontes):
                    col.markdown(f"[{label}]({url})")
            else:
                st.warning(
                    f"⚠️ Nenhuma notícia encontrada nos últimos 30 dias para "
                    f"**{empresa_nome_news}** (`{ticker_us_news}`). Acesse diretamente:"
                )
                lc2 = st.columns(5)
                links_fontes = [
                    ("📊 Yahoo Finance", f"https://finance.yahoo.com/quote/{ticker_us_news}/news/"),
                    ("🌐 Google News",   f"https://news.google.com/search?q={requests.utils.quote(empresa_nome_news)}+stock&hl=pt-BR"),
                    ("📈 Seeking Alpha", f"https://seekingalpha.com/symbol/{ticker_us_news}/news"),
                    ("🔍 Finviz",        f"https://finviz.com/quote.ashx?t={ticker_us_news}"),
                    ("🧙 GuruFocus",     f"https://www.gurufocus.com/news/{ticker_us_news}"),
                ]
                for col, (label, url) in zip(lc2, links_fontes):
                    col.markdown(f"[{label}]({url})")

        else:
            st.markdown("""
            <div style='background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
                        padding: 2rem; border-radius: 8px; text-align: center; margin: 2rem 0;'>
                <p style='margin: 0; color: #3730a3; font-size: 1.1rem; font-weight: 500;'>
                    👆 Selecione um ativo na tabela acima para visualizar a análise técnica completa
                </p>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style='background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
                    padding: 2rem; border-radius: 8px; text-align: center;'>
            <h3 style='margin: 0; color: #7c3626;'>📊 Nenhuma oportunidade detectada</h3>
            <p style='margin: 0.5rem 0 0 0; color: #7c3626;'>
                Aguarde novas oportunidades ou ajuste os critérios de filtro
            </p>
        </div>
        """, unsafe_allow_html=True)

st.markdown("---")

st.markdown("""
<div style='text-align: center; padding: 2rem 0; color: #64748b;'>
    <p style='margin: 0; font-size: 0.9rem;'>
        <strong>Monitor B3 - Swing Trade Pro</strong> | Powered by Python, yFinance & Streamlit
    </p>
    <p style='margin: 0.5rem 0 0 0; font-size: 0.8rem;'>
        ⚠️ Este sistema é apenas para fins educacionais. Não constitui recomendação de investimento.
    </p>
</div>
""", unsafe_allow_html=True)
