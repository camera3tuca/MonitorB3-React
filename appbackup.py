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
from modules.ml import _prever_preco_ml_cached
from modules.rl import *
from modules.rl import _executar_agente_rl_cached, _sigmoid, _relu, _softmax, _QNetwork, _RLAgent, _get_state_rl
from modules.tradingview import *
from modules.minervini import *
from modules.minervini import _calcular_minervini_cached, _buscar_ibov
from modules.triple_screen import *
from modules.fundamentals import *
from modules.technical import *
from modules.styles import *

st.set_page_config(
    page_title="Monitor BDRs - Swing Trade",
    page_icon="📉",
    layout="wide"
)

warnings.filterwarnings('ignore')

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
    <h1 class="main-title">📊 Monitor BDR - Swing Trade Pro</h1>
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
    st.markdown("**🎯 Foco:** BDRs em Queda com Potencial")

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

if st.button("🔄 Atualizar Análise", type="primary"):
    with st.spinner("Conectando à API e baixando dados..."):
        # Usar dicionário local de BDRs em vez de buscar da BRAPI
        lista_bdrs = list(NOMES_BDRS.keys())

        df = buscar_dados(lista_bdrs)

        if df.empty:
            st.error("Erro ao carregar dados. Se o Yahoo tiver bloqueado, aguarde alguns minutos.")
            st.stop()

    # Calcular indicadores
    with st.spinner("Calculando indicadores técnicos..."):
        df_calc = calcular_indicadores(df)

    # Analisar oportunidades usando dicionário local
    with st.spinner("Analisando oportunidades..."):
        oportunidades = analisar_oportunidades(df_calc, NOMES_BDRS)

        if oportunidades:
            # Atualizar os nomes nas oportunidades (já processados em analisar_oportunidades)
            # Salvar no session_state
            st.session_state['oportunidades'] = oportunidades
            st.session_state['df_calc'] = df_calc

if 'oportunidades' in st.session_state and 'df_calc' in st.session_state:
    oportunidades = st.session_state['oportunidades']
    df_calc = st.session_state['df_calc']

    # Criar DataFrame das oportunidades
    df_res = pd.DataFrame(oportunidades)
    df_res = df_res.sort_values(by='Queda_Dia', ascending=True)

    st.success(f"✅ {len(oportunidades)} oportunidades detectadas!")

    # --- FILTROS COM DESIGN PROFISSIONAL ---
    st.markdown('<h3 class="section-header">🎯 Filtros de Tendência</h3>', unsafe_allow_html=True)

    st.markdown("""
    <div style='background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                padding: 1rem; border-radius: 8px; margin-bottom: 1rem;'>
        <p style='margin: 0; color: #334155; font-weight: 500;'>
            💡 <strong>Dica:</strong> Selecione as médias móveis para filtrar BDRs em correção dentro de tendências de alta
        </p>
    </div>
    """, unsafe_allow_html=True)

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
        help="Filtra BDRs pelo ranking de liquidez 0-10. Quanto maior, menor o risco de gaps e volume baixo."
    )

    # Aplicar filtros se algum selecionado
    if filtrar_ema20 or filtrar_ema50 or filtrar_ema200 or ranking_min_liq > 0:
        df_res_filtrado = []
        contadores = {'ema20': 0, 'ema50': 0, 'ema200': 0, 'sem_dados': 0}

        for opp in oportunidades:
            ticker = opp['Ticker']
            try:
                df_ticker = df_calc.xs(ticker, axis=1, level=1).dropna()

                # Verificar tamanho mínimo
                tam = len(df_ticker)
                if tam < 20:
                    contadores['sem_dados'] += 1
                    continue

                ultimo_close = df_ticker['Close'].iloc[-1]

                # Verificar cada condição separadamente
                passa_filtro = True

                # Filtro EMA20
                if filtrar_ema20:
                    if 'EMA20' in df_ticker.columns and tam >= 20:
                        ultima_ema20 = df_ticker['EMA20'].iloc[-1]
                        if pd.notna(ultima_ema20) and ultimo_close > ultima_ema20:
                            contadores['ema20'] += 1
                        else:
                            passa_filtro = False
                    else:
                        passa_filtro = False

                # Filtro EMA50
                if filtrar_ema50 and passa_filtro:
                    if 'EMA50' in df_ticker.columns and tam >= 50:
                        ultima_ema50 = df_ticker['EMA50'].iloc[-1]
                        if pd.notna(ultima_ema50) and ultimo_close > ultima_ema50:
                            contadores['ema50'] += 1
                        else:
                            passa_filtro = False
                    else:
                        passa_filtro = False

                # Filtro EMA200
                if filtrar_ema200 and passa_filtro:
                    # EMA200 precisa de pelo menos 50 períodos para ser significativa
                    if 'EMA200' in df_ticker.columns and tam >= 50:
                        ultima_ema200 = df_ticker['EMA200'].iloc[-1]
                        if pd.notna(ultima_ema200) and ultimo_close > ultima_ema200:
                            contadores['ema200'] += 1
                        else:
                            passa_filtro = False
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

            st.markdown(f"""
            <div style='background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
                        padding: 1rem; border-radius: 8px; margin: 1rem 0;'>
                <p style='margin: 0; color: #166534; font-weight: 600; font-size: 1.1rem;'>
                    ✅ {len(df_res)} BDRs encontradas | Filtros ativos: {' + '.join(filtros_ativos)}
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

            st.markdown(f"""
            <div style='background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
                        padding: 1rem; border-radius: 8px; margin: 1rem 0;'>
                <p style='margin: 0; color: #7c3626; font-weight: 600;'>
                    ⚠️ Nenhuma BDR passou em TODOS os filtros combinados
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

        evento = st.dataframe(
            df_res.style.map(estilizar_potencial, subset=['Potencial'])
                        .map(estilizar_is, subset=['IS'])
                        .map(estilizar_liquidez, subset=['Liquidez'])
            .format({
                'Preco': 'R$ {:.2f}',
                'Volume': '{:,.0f}',
                'Queda_Dia': '{:.2f}%',
                'Gap': '{:.2f}%',
                'IS': '{:.0f}',
                'RSI14': '{:.0f}',
                'Stoch': '{:.0f}',
                'Liquidez': '{:.0f}'
            }),
            column_order=("Ticker", "Empresa", "Liquidez", "Preco", "Queda_Dia", "IS", "Volume", "Gap", "Potencial", "Score", "Sinais"),
            column_config={
                "Empresa": st.column_config.TextColumn("Empresa", width="medium"),
                "Liquidez": st.column_config.NumberColumn("💧 Liq.", width="small",
                    help="Ranking de Liquidez 0-10 (🔴 baixa → 🟢 alta)"),
                "IS": st.column_config.NumberColumn("I.S.", help="Índice de Sobrevenda"),
                "Volume": st.column_config.NumberColumn("Vol.", help="Volume Financeiro"),
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

            try:
                df_ticker = df_calc.xs(ticker, axis=1, level=1).dropna()

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
                            st.session_state[f'zoom_custom_{ticker}'] = max(10, len(df_calc.xs(ticker, axis=1, level=1).dropna()) // 2)
                        else:
                            st.session_state[f'zoom_custom_{ticker}'] = max(10, int(current_zoom * 0.6))

                with ctrl_col5:
                    if st.button("🔍−  Zoom Out", key=f"zout_{ticker}"):
                        current_zoom = st.session_state.get(f'zoom_custom_{ticker}', None)
                        if current_zoom is None:
                            pass
                        else:
                            new_zoom = int(current_zoom * 1.6)
                            total = len(df_calc.xs(ticker, axis=1, level=1).dropna())
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

                    fig = plotar_grafico(df_ticker, ticker, row['Empresa'], row['RSI14'], row['IS'],
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
                    st.markdown(f"**📊 Volume:** {row['Volume']:,.0f}")

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
                st.error(f"❌ Erro ao carregar gráfico: {e}")

            # === ESTRATÉGIA TRIPLE SCREEN ===
            st.markdown("---")
            try:
                df_ticker_ts = df_calc.xs(ticker, axis=1, level=1).dropna()
                resultado_ts = analisar_triple_screen(df_ticker_ts)
            except Exception:
                resultado_ts = None
            renderizar_triple_screen(resultado_ts, ticker, row['Empresa'])

            # === PAINEL FUNDAMENTALISTA (ABAIXO DO GRÁFICO) ===
            st.markdown("---")
            st.markdown('<h3 class="section-header">📊 Análise Fundamentalista</h3>', unsafe_allow_html=True)

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
                    st.info(f"📡 **Fonte:** {fonte} | Ticker: **{ticker_fonte}**\n\n⚠️ *Dados limitados disponíveis para esta BDR. Score baseado em Market Cap e Volume na B3.*")
                else:
                    st.success(f"📡 **Fonte:** {fonte} | Ticker US: **{ticker_fonte}**")

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
                            st.metric("Market Cap", f"${mcap_b/1000:.2f}T")
                        else:
                            st.metric("Market Cap", f"${mcap_b:.1f}B")
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
                            valor_str = f"${mcap_val/1000:.2f}T"
                        else:
                            valor_str = f"${mcap_val:.1f}B"
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
                            valor_str = f"${mcap_val/1000:.2f}T"
                        else:
                            valor_str = f"${mcap_val:.1f}B"
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

            # === MÓDULO DE MACHINE LEARNING ===
            st.markdown("---")
            # Usa wrapper cacheado — só re-treina se o ticker mudar
            resultado_ml = _prever_preco_ml_cached(ticker, dias_previsao=5)
            renderizar_painel_ml(resultado_ml, ticker, row['Empresa'], dias_previsao=5)

            # === MÓDULO DE REINFORCEMENT LEARNING ===
            resultado_rl = _executar_agente_rl_cached(ticker, episodes=8, window_size=5)
            renderizar_painel_rl(resultado_rl, ticker, row['Empresa'])

            # === ANÁLISE DE FASE — METODOLOGIA MINERVINI ===
            resultado_mv = _calcular_minervini_cached(ticker)
            renderizar_painel_minervini(resultado_mv, ticker, row['Empresa'])

            # === TRADINGVIEW SCREENER — DADOS AO VIVO ===
            ticker_us_tv = mapear_ticker_us(ticker)
            with st.spinner(f'Buscando dados TradingView para {ticker_us_tv}...'):
                dados_tv = buscar_dados_tradingview(ticker_us_tv, ticker)
            peers_tv = []
            if not dados_tv.get('erro') and dados_tv.get('setor'):
                peers_tv = buscar_peers_tradingview(
                    dados_tv['setor'], ticker_us_tv, top_n=5)
            renderizar_painel_tradingview(dados_tv, ticker_us_tv, row['Empresa'], peers_tv)

            # === SEÇÃO DE NOTÍCIAS ===
            st.markdown("---")
            st.markdown('<h3 class="section-header">📰 Últimas Notícias da Empresa</h3>', unsafe_allow_html=True)

            ticker_us_news    = mapear_ticker_us(ticker)
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
                variacao_dia_news = float(row.get('Var. Dia', row.get('Variacao', 0)) or 0)
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
                if st.button("🔄 Atualizar", key=f"btn_news_{ticker}", use_container_width=True):
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
                    👆 Selecione uma BDR na tabela acima para visualizar a análise técnica completa
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
        <strong>Monitor BDR - Swing Trade Pro</strong> | Powered by Python, yFinance & Streamlit
    </p>
    <p style='margin: 0.5rem 0 0 0; font-size: 0.8rem;'>
        ⚠️ Este sistema é apenas para fins educacionais. Não constitui recomendação de investimento.
    </p>
</div>
""", unsafe_allow_html=True)
