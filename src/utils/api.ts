import { AssetClass, AssetOpportunity, FundamentalsData, NewsArticle } from '../types';
import { resolveSector } from './sectorUtils';
import { NOMES_BDRS } from '../data/curatedData';

// API URL helper to dynamically route requests to the live backend server
// when running inside native Android (Capacitor/WebView) or web environment.
const BACKEND_URL = 'https://ais-dev-l6afs53p7hhhp64rewakdk-45073816214.us-west2.run.app';

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (typeof window !== 'undefined') {
    const isCapacitor =
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '');

    if (isCapacitor || (window as any).Capacitor?.isNativePlatform?.()) {
      return `${BACKEND_URL}${cleanEndpoint}`;
    }
  }

  return cleanEndpoint;
}

// ── Direct Client-Side Fallback for TradingView Scanner ──
function classificarAtivoDirect(ticker: string, tvType?: string, typespecs?: string[]): AssetClass {
  const t = ticker.toUpperCase();
  if (typespecs?.includes('etf') || t.endsWith('11') && ['BOVA11', 'SMAL11', 'IVVB11', 'HASH11', 'SPXI11', 'GOLD11', 'BRAX11', 'DIVO11'].includes(t)) {
    return 'ETF';
  }
  if (t.endsWith('34') || t.endsWith('35') || tvType === 'dr') {
    return 'BDR';
  }
  if (t.endsWith('11') && (tvType === 'fund' || t.startsWith('HGLG') || t.startsWith('KNRI') || t.startsWith('MXRF') || t.startsWith('XPML') || t.startsWith('BTLG'))) {
    return 'FII';
  }
  if (t.endsWith('3') || t.endsWith('4') || t.endsWith('5') || t.endsWith('6')) {
    return 'Ação';
  }
  return 'Ação';
}

function calcularLiquidezDirect(finHoje: number, fin30d: number, close: number) {
  const baseFin = fin30d > 0 ? (finHoje * 0.4 + fin30d * 0.6) : finHoje;
  const numNegociosEst = Math.max(1, Math.round(baseFin / (close * 15 || 500)));

  let liquidez = 1;
  if (baseFin >= 30_000_000) liquidez = 10;
  else if (baseFin >= 12_000_000) liquidez = 9;
  else if (baseFin >= 3_000_000) liquidez = 8;
  else if (baseFin >= 1_000_000) liquidez = 7;
  else if (baseFin >= 400_000) liquidez = 6;
  else if (baseFin >= 150_000) liquidez = 5;
  else if (baseFin >= 60_000) liquidez = 4;
  else if (baseFin >= 25_000) liquidez = 3;
  else if (baseFin >= 8_000) liquidez = 2;
  else liquidez = 1;

  let avisoLiquidez: string | undefined;
  if (liquidez === 1) {
    avisoLiquidez = 'Volume diário muito reduzido (< R$ 8k/dia). Poucos negócios executados na B3. Utilize ordens limitadas para evitar distorção de spread no Profit.';
  } else if (liquidez === 2) {
    avisoLiquidez = 'Liquidez moderada para BDR/Small Cap (~R$ 8k a R$ 25k/dia). Opere com ordens limitadas proporcionais às ofertas do Profit.';
  }

  return { liquidez, avisoLiquidez, numNegociosEst };
}

function gerarSinaisDirect(p: number, rsi: number, stoch: number, macdHist: number, ema20?: number, ema50?: number, ema200?: number) {
  const sinais: string[] = [];
  const explicacoes: string[] = [];
  let score = 0;

  if (rsi < 30) {
    sinais.push('RSI Sobrevendido');
    explicacoes.push(`RSI em ${rsi.toFixed(1)} indica forte sobrevenda (< 30).`);
    score += 3;
  } else if (rsi < 40) {
    sinais.push('RSI Baixo');
    score += 1.5;
  }

  if (stoch < 20) {
    sinais.push('Estocástico em Fundo');
    explicacoes.push(`Estocástico em ${stoch.toFixed(1)} marca sobrevenda.`);
    score += 2;
  }

  if (macdHist > 0) {
    sinais.push('MACD Positivo');
    score += 1.5;
  }

  if (ema20 && p > ema20) {
    sinais.push('Acima EMA20');
    score += 1;
  }
  if (ema50 && p > ema50) {
    sinais.push('Acima EMA50');
    score += 1;
  }
  if (ema200 && p > ema200) {
    sinais.push('Acima EMA200 (Tendência Primária Alta)');
    score += 1.5;
  }

  let potencial: 'Muito Alta' | 'Alta' | 'Média' | 'Baixa' = 'Baixa';
  if (score >= 7) potencial = 'Muito Alta';
  else if (score >= 5) potencial = 'Alta';
  else if (score >= 3) potencial = 'Média';

  return { sinais: sinais.join(', ') || 'Correção técnica', explicacoes, score: Math.min(10, Math.round(score * 10) / 10), potencial };
}

async function fetchTradingViewDirect(classes: AssetClass[]): Promise<AssetOpportunity[]> {
  const tvColumns = [
    "name", "close", "change", "open", "high", "low", "volume",
    "RSI", "Stoch.K", "Stoch.D", "MACD.macd", "MACD.signal",
    "BB.lower", "BB.upper", "average_volume_10d_calc", "gap",
    "EMA20", "EMA50", "EMA200", "description", "type", "typespecs", "sector", "SMA200",
    "Value.Traded", "average_volume_30d_calc"
  ];

  const doScan = async (filter: any[]) => {
    const resp = await fetch('https://scanner.tradingview.com/brazil/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter,
        options: { lang: 'pt' },
        symbols: { query: { types: [] }, tickers: [] },
        columns: tvColumns,
        sort: { sortBy: 'change', sortOrder: 'asc' },
        range: [0, 80]
      })
    });
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.data || [];
  };

  const [stocks, bdrs, etfs, fiis] = await Promise.all([
    doScan([{ left: 'type', operation: 'equal', right: 'stock' }, { left: 'change', operation: 'less', right: 0 }]),
    doScan([{ left: 'type', operation: 'equal', right: 'dr' }, { left: 'change', operation: 'less', right: 0 }]),
    doScan([{ left: 'typespecs', operation: 'has', right: ['etf'] }, { left: 'change', operation: 'less', right: 0 }]),
    doScan([{ left: 'type', operation: 'equal', right: 'fund' }, { left: 'typespecs', operation: 'has_none_of', right: ['etf'] }, { left: 'change', operation: 'less', right: 0 }])
  ]);

  const combined = [...stocks, ...bdrs, ...etfs, ...fiis];
  const list: AssetOpportunity[] = [];
  const seen = new Set<string>();

  for (const item of combined) {
    const row = item.d;
    const rawTicker = String(row[0] || '').split(':').pop() || '';
    if (!rawTicker || rawTicker.endsWith('F') || seen.has(rawTicker)) continue;
    seen.add(rawTicker);

    const close = Number(row[1]) || 0;
    const change = Number(row[2]) || 0;
    if (close <= 0) continue;

    const classe = classificarAtivoDirect(rawTicker, row[20], row[21]);
    const setor = resolveSector(rawTicker, row[22], classe);
    const rsi = Number(row[7]) || 50;
    const stoch = Number(row[8]) || 50;
    const is = Math.round(((100 - rsi) * 0.6) + ((100 - stoch) * 0.4));
    const macdHist = (Number(row[10]) || 0) - (Number(row[11]) || 0);
    const ema20 = row[16] ? Number(Number(row[16]).toFixed(2)) : undefined;
    const ema50 = row[17] ? Number(Number(row[17]).toFixed(2)) : undefined;
    const ema200 = row[18] ? Number(Number(row[18]).toFixed(2)) : undefined;

    const valTraded = Number(row[24]) || (Number(row[6] || 0) * close);
    const volMed30 = (Number(row[25]) || Number(row[14]) || Number(row[6])) * close;
    const { liquidez, avisoLiquidez, numNegociosEst } = calcularLiquidezDirect(valTraded, volMed30, close);
    const { sinais, explicacoes, score, potencial } = gerarSinaisDirect(close, rsi, stoch, macdHist, ema20, ema50, ema200);

    const empresa = NOMES_BDRS[rawTicker] || row[19] || rawTicker;

    list.push({
      Ticker: rawTicker,
      Empresa: empresa,
      Classe: classe,
      Setor: setor,
      Preco: close,
      Volume: Number(row[6]) || 0,
      VolHoje: valTraded,
      VolMedio: volMed30,
      NumNegociosEst: numNegociosEst,
      AvisoLiquidez: avisoLiquidez,
      Queda_Dia: change,
      Gap: Number(row[15]) || 0,
      IS: is,
      RSI14: rsi,
      Stoch: stoch,
      Potencial: potencial,
      Score: score,
      Sinais: sinais,
      Explicacoes: explicacoes,
      Liquidez: liquidez,
      EMA20: ema20,
      EMA50: ema50,
      EMA200: ema200
    });
  }

  return list;
}

// ── Smart Scanner Data Fetcher with Fallback & Local Storage Cache ──
export async function fetchScannerData(classes: AssetClass[] = ['Ação', 'BDR', 'ETF', 'FII']): Promise<{
  data: AssetOpportunity[];
  timestamp: string;
  source: 'server' | 'direct' | 'cache';
}> {
  const cacheKey = 'monitor_b3_scanner_cache';

  // 1. Try local server endpoint first
  try {
    const res = await fetch(getApiUrl('/api/scan'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify({ classes })
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        const timestamp = new Date().toISOString();
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: json.data, timestamp }));
        } catch {}
        return { data: json.data, timestamp, source: 'server' };
      }
    }
  } catch (serverErr) {
    console.warn('API /api/scan indisponível no momento. Ativando scan direto TradingView:', serverErr);
  }

  // 2. Fallback: Query TradingView directly (works in native Android / Capacitor / PWA)
  try {
    const directData = await fetchTradingViewDirect(classes);
    if (directData && directData.length > 0) {
      const timestamp = new Date().toISOString();
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data: directData, timestamp }));
      } catch {}
      return { data: directData, timestamp, source: 'direct' };
    }
  } catch (directErr) {
    console.warn('TradingView direto indisponível, buscando do cache local:', directErr);
  }

  // 3. Last resort: Load from localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.data && Array.isArray(parsed.data)) {
        return { data: parsed.data, timestamp: parsed.timestamp || new Date().toISOString(), source: 'cache' };
      }
    }
  } catch {}

  return { data: [], timestamp: new Date().toISOString(), source: 'cache' };
}

// ── Helper to force clear cache and refresh ──
export async function clearAppCacheAndReload() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.error(e);
  }
  window.location.reload();
}
