export type AssetClass = 'Ação' | 'BDR' | 'ETF' | 'FII';

export interface AssetOpportunity {
  Ticker: string;
  Empresa: string;
  Classe: AssetClass;
  Setor: string;
  Preco: number;
  Volume: number;
  Queda_Dia: number;
  Gap: number;
  IS: number;
  RSI14: number;
  Stoch: number;
  Potencial: 'Muito Alta' | 'Alta' | 'Média' | 'Baixa';
  Score: number;
  Sinais: string;
  Explicacoes: string[];
  Liquidez: number;
  EMA20?: number;
  EMA50?: number;
  EMA200?: number;
}

export interface HistoricalCandle {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  stochK?: number;
  stochD?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  bbUpper?: number;
  bbLower?: number;
  bbBasis?: number;
}

export interface FibonacciLevels {
  high: number;
  low: number;
  fib0: number;
  fib236: number;
  fib382: number;
  fib500: number;
  fib618: number; // Golden Zone
  fib786: number;
  fib100: number;
  currentNear?: string;
}

export interface TripleScreenResult {
  tela1: {
    status: 'ALTA' | 'BAIXA' | 'NEUTRO';
    emoji: string;
    ema13: number;
    ema13Slope: number;
    macdHist: number;
    distPct: number;
    desc: string;
  };
  tela2: {
    status: 'SOBREVENDA' | 'SOBRECOMPRA' | 'NEUTRO';
    emoji: string;
    efi2: number;
    desc: string;
  };
  tela3: {
    status: 'BUY_STOP' | 'SELL_STOP' | 'AGUARDAR';
    emoji: string;
    stopPrice: number;
    stopLossPrice: number;
    desc: string;
  };
  veredicto: 'COMPRA' | 'VENDA' | 'AGUARDAR';
  forca: number; // 0 - 3
}

export interface MinerviniCriterion {
  id: number;
  nome: string;
  atendido: boolean;
  detalhe: string;
}

export interface MinerviniResult {
  fase: number; // 1 to 4
  fase_nome: string;
  fase_cor: string;
  fase_desc: string;
  criterios: MinerviniCriterion[];
  criterios_ok: number;
  score_forca: number;
  rs_score: number;
  rs_slope: number;
  stop_loss: number;
  stop_tipo: string;
  risco_pct: number;
  alvo_2r: number;
  alvo_3r: number;
  rr_ratio: number;
  sma50: number;
  sma150: number;
  sma200: number;
  max_52s: number;
  min_52s: number;
  regime_ibov: string;
  erro?: string | null;
}

export interface MLPredictionResult {
  ticker: string;
  preco_atual: number;
  preco_previsto_5d: number;
  variacao_prevista_pct: number;
  tendencia: 'ALTA' | 'BAIXA' | 'LATERAL';
  r2_score: number;
  melhor_modelo: string;
  previsoes_dias: { dia: number; data: string; preco: number; limite_inf: number; limite_sup: number }[];
  modelos_comparacao: { modelo: string; r2: number; mae: number }[];
  features_importantes: { feature: string; peso: number }[];
}

export interface RLAgentResult {
  ticker: string;
  total_trades: number;
  win_rate: number;
  retorno_agente_pct: number;
  retorno_buy_hold_pct: number;
  alpha_pct: number;
  acoes_recentes: { data: string; preco: number; acao: 'COMPRA' | 'MANTER' | 'VENDA'; q_valor: number }[];
  curva_equity: { data: string; agente: number; buy_hold: number }[];
  estatisticas: {
    episodes: number;
    lucro_medio_trade: number;
    max_drawdown: number;
    sharpe_ratio: number;
  };
}

export interface FlowResult {
  sinal: 'verde' | 'amarelo' | 'vermelho';
  flow_cum: number;
  vol_ratio: number;
  buy_aggression: number;
  sell_aggression: number;
  net_aggression: number;
  historico: {
    date: string;
    close: number;
    flow_cum: number;
    vol_ratio: number;
    sinal: 'verde' | 'amarelo' | 'vermelho';
  }[];
}

export interface FundamentalsData {
  score: number;
  fonte: string;
  ticker_fonte: string;
  pe_ratio?: number;
  market_cap?: number;
  dividend_yield?: number;
  revenue_growth?: number;
  volume_b3?: number;
  recomendacao?: string;
  setor?: string;
  detalhes?: Record<string, { valor?: any; pontos: number; criterio: string }>;
}

export interface PeerInfo {
  ticker: string;
  preco: number;
  var_pct: number;
  vol_rel: number;
  rec: string;
  mktcap: number;
  rsi: number;
}

export interface TradingViewDetails {
  erro?: string | null;
  fonte: string;
  ticker: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  change_pct: number;
  change_abs: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
  stoch_k?: number;
  stoch_d?: number;
  cci?: number;
  adx?: number;
  macd?: number;
  macd_signal?: number;
  macd_hist?: number;
  bb_upper?: number;
  bb_lower?: number;
  bb_basis?: number;
  vol_rel?: number;
  vol_avg10?: number;
  rec_val?: number;
  rec_label: string;
  rec_cor: string;
  buys: number;
  sells: number;
  neutral: number;
  total_sinais: number;
  mktcap?: number;
  eps?: number;
  pe?: number;
  pb?: number;
  div_yield?: number;
  setor?: string;
  industria?: string;
  atr?: number;
  volatilidade?: number;
  max_52s?: number;
  min_52s?: number;
  peers?: PeerInfo[];
}

export interface NewsArticle {
  titulo: string;
  fonte: string;
  dt?: string;
  link: string;
  resumo?: string;
  sentimento?: {
    label: 'Positivo' | 'Neutro' | 'Negativo';
    score: number;
  };
}

export interface BacktestResult {
  total_trades: number;
  taxa_acerto: number;
  retorno_total: number;
  retorno_medio: number;
  profit_factor: number;
  max_drawdown: number;
  trades: {
    entrada_data: string;
    entrada_preco: number;
    saida_data: string;
    saida_preco: number;
    retorno_pct: number;
    resultado: 'GAIN' | 'LOSS';
    dias: number;
  }[];
  equity_curve: { date: string; equity: number }[];
}
