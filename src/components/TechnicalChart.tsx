import React, { useState, useMemo, useRef } from 'react';
import { HistoricalCandle, FibonacciLevels } from '../types';
import { Layers, ZoomIn, ZoomOut, BarChart2, TrendingUp, Maximize2 } from 'lucide-react';

interface TechnicalChartProps {
  candles: HistoricalCandle[];
  fibonacci: FibonacciLevels;
  ticker: string;
  timeframe: string;
  onChangeTimeframe: (tf: string) => void;
}

export const TechnicalChart: React.FC<TechnicalChartProps> = ({
  candles,
  fibonacci,
  ticker,
  timeframe,
  onChangeTimeframe,
}) => {
  const [chartMode, setChartMode] = useState<'candle' | 'line'>('line');
  const [rangeFilter, setRangeFilter] = useState<'all' | '6m' | '3m' | '1m' | '15d'>('6m');
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showFibonacci, setShowFibonacci] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter candles based on range
  const visibleCandles = useMemo(() => {
    if (!candles || !Array.isArray(candles) || candles.length === 0) return [];
    if (rangeFilter === '15d') return candles.slice(-15);
    if (rangeFilter === '1m') return candles.slice(-22);
    if (rangeFilter === '3m') return candles.slice(-66);
    if (rangeFilter === '6m') return candles.slice(-130);
    return candles;
  }, [candles, rangeFilter]);

  // Dimensions
  const width = 800;
  const heightMain = 340;
  const heightSub = 80;
  const padding = { top: 20, right: 65, bottom: 25, left: 15 };

  // Calculate scales with safe bounds
  const n = visibleCandles.length;

  const { yMin, yMax, maxVol } = useMemo(() => {
    if (n === 0) {
      return { yMin: 10, yMax: 20, maxVol: 1000 };
    }
    const prices: number[] = [];
    const vols: number[] = [];

    visibleCandles.forEach(c => {
      if (typeof c.low === 'number' && !isNaN(c.low) && isFinite(c.low)) prices.push(c.low);
      if (typeof c.high === 'number' && !isNaN(c.high) && isFinite(c.high)) prices.push(c.high);
      if (typeof c.open === 'number' && !isNaN(c.open) && isFinite(c.open)) prices.push(c.open);
      if (typeof c.close === 'number' && !isNaN(c.close) && isFinite(c.close)) prices.push(c.close);
      if (typeof c.volume === 'number' && !isNaN(c.volume) && isFinite(c.volume) && c.volume > 0) vols.push(c.volume);
    });

    const minP = prices.length > 0 ? Math.min(...prices) : 10;
    const maxP = prices.length > 0 ? Math.max(...prices) : 20;
    const priceMargin = (maxP - minP) * 0.08 || 1;
    const computedYMin = Math.max(0, minP - priceMargin);
    const computedYMax = Math.max(computedYMin + 0.5, maxP + priceMargin);
    const computedMaxVol = vols.length > 0 ? Math.max(...vols) : 1000;

    return {
      yMin: isNaN(computedYMin) || !isFinite(computedYMin) ? 10 : computedYMin,
      yMax: isNaN(computedYMax) || !isFinite(computedYMax) ? 20 : computedYMax,
      maxVol: isNaN(computedMaxVol) || !isFinite(computedMaxVol) ? 1000 : computedMaxVol
    };
  }, [visibleCandles, n]);

  const getX = (index: number) => {
    if (n <= 1) return padding.left + (width - padding.left - padding.right) / 2;
    const chartW = width - padding.left - padding.right;
    const safeIdx = Math.max(0, Math.min(n - 1, index));
    const val = padding.left + (safeIdx / (n - 1)) * chartW;
    return isNaN(val) || !isFinite(val) ? padding.left : val;
  };

  const getYPrice = (price: number | undefined | null) => {
    const chartH = heightMain - padding.top - padding.bottom;
    if (price === undefined || price === null || isNaN(price) || !isFinite(price) || yMax <= yMin) {
      return padding.top + chartH / 2;
    }
    const clamped = Math.max(yMin, Math.min(yMax, price));
    const val = padding.top + (1 - (clamped - yMin) / (yMax - yMin)) * chartH;
    return isNaN(val) || !isFinite(val) ? padding.top + chartH / 2 : val;
  };

  const activeCandle = hoverIndex !== null && visibleCandles[hoverIndex]
    ? visibleCandles[hoverIndex]
    : visibleCandles.length > 0
    ? visibleCandles[visibleCandles.length - 1]
    : null;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 lg:p-5 shadow-2xl">
      {/* Chart Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        {/* Timeframe & Mode */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            {['60m', '1d', '1wk', '1mo'].map((tf) => (
              <button
                key={tf}
                id={`btn-tf-${tf}`}
                onClick={() => onChangeTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  timeframe === tf ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf === '60m' ? '60m' : tf === '1d' ? 'Diário' : tf === '1wk' ? 'Semanal' : 'Mensal'}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setChartMode('candle')}
              className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                chartMode === 'candle' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartMode('line')}
              className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                chartMode === 'line' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Linha
            </button>
          </div>
        </div>

        {/* Overlays Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2 py-1 rounded border text-[11px] font-mono font-bold cursor-pointer transition ${
              showEMA20 ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            EMA20
          </button>
          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2 py-1 rounded border text-[11px] font-mono font-bold cursor-pointer transition ${
              showEMA50 ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            EMA50
          </button>
          <button
            onClick={() => setShowEMA200(!showEMA200)}
            className={`px-2 py-1 rounded border text-[11px] font-mono font-bold cursor-pointer transition ${
              showEMA200 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            EMA200
          </button>
          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2 py-1 rounded border text-[11px] font-mono font-bold cursor-pointer transition ${
              showBollinger ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            Bollinger
          </button>
          <button
            onClick={() => setShowFibonacci(!showFibonacci)}
            className={`px-2 py-1 rounded border text-[11px] font-mono font-bold cursor-pointer transition ${
              showFibonacci ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            Fibo 61.8%
          </button>
        </div>

        {/* Range Filters */}
        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
          {(['15d', '1m', '3m', '6m', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRangeFilter(r)}
              className={`px-2 py-1 rounded-md font-medium uppercase transition cursor-pointer ${
                rangeFilter === r ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Info Bar with Active Hover Data */}
      {activeCandle && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 mb-3 text-xs font-mono">
          <div><span className="text-slate-400">Data:</span> <strong className="text-white">{activeCandle.date}</strong></div>
          <div><span className="text-slate-400">Abertura:</span> <strong className="text-slate-200">R$ {activeCandle.open?.toFixed(2)}</strong></div>
          <div><span className="text-slate-400">Máx:</span> <strong className="text-emerald-400">R$ {activeCandle.high?.toFixed(2)}</strong></div>
          <div><span className="text-slate-400">Mín:</span> <strong className="text-rose-400">R$ {activeCandle.low?.toFixed(2)}</strong></div>
          <div><span className="text-slate-400">Fechamento:</span> <strong className="text-white font-bold">R$ {activeCandle.close?.toFixed(2)}</strong></div>
          <div><span className="text-slate-400">RSI:</span> <strong className={`${(activeCandle.rsi14 || 50) < 30 ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>{activeCandle.rsi14?.toFixed(1) || '-'}</strong></div>
          <div><span className="text-slate-400">Vol:</span> <strong className="text-cyan-400">{((activeCandle.volume || 0) / 1e6).toFixed(1)}M</strong></div>
        </div>
      )}

      {/* SVG Multi-Panel Chart */}
      <div className="relative w-full overflow-hidden select-none bg-slate-950 rounded-xl border border-slate-800">
        <svg
          viewBox={`0 0 ${width} ${heightMain + heightSub * 3}`}
          className="w-full h-auto cursor-crosshair block"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            const chartW = width - padding.left - padding.right;
            const rawIdx = Math.round(((mouseX - padding.left) / chartW) * (n - 1));
            const clampedIdx = Math.max(0, Math.min(n - 1, rawIdx));
            setHoverIndex(clampedIdx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="priceLineAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <filter id="priceLineGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect x={0} y={0} width={width} height={heightMain + heightSub * 3} fill="#0b0f19" />

          {/* ── PANEL 1: MAIN PRICE PANEL ── */}
          <g>
            {/* Horizontal Grid lines & Price axis */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const price = yMin + ratio * (yMax - yMin);
              const y = getYPrice(price);
              return (
                <g key={ratio}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={width - padding.right + 6} y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace">
                    R$ {price.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Fibonacci Retracement Levels */}
            {showFibonacci && fibonacci && typeof fibonacci.high === 'number' && fibonacci.high > 0 && typeof fibonacci.fib618 === 'number' && !isNaN(fibonacci.fib618) && (
              <g opacity={0.85}>
                {/* 61.8% Golden Zone Highlight */}
                <line
                  x1={padding.left}
                  y1={getYPrice(fibonacci.fib618)}
                  x2={width - padding.right}
                  y2={getYPrice(fibonacci.fib618)}
                  stroke="#eab308"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text x={width - padding.right + 6} y={getYPrice(fibonacci.fib618) + 3} fill="#eab308" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  Fibo 61.8%
                </text>

                {/* 50% Level */}
                {typeof fibonacci.fib500 === 'number' && !isNaN(fibonacci.fib500) && (
                  <>
                    <line
                      x1={padding.left}
                      y1={getYPrice(fibonacci.fib500)}
                      x2={width - padding.right}
                      y2={getYPrice(fibonacci.fib500)}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <text x={width - padding.right + 6} y={getYPrice(fibonacci.fib500) + 3} fill="#94a3b8" fontSize="8" fontFamily="monospace">
                      50.0%
                    </text>
                  </>
                )}
              </g>
            )}

            {/* Bollinger Bands Shaded Area */}
            {showBollinger && n > 1 && (
              <g opacity={0.15}>
                {visibleCandles.map((c, i) => {
                  if (i === 0 || c.bbUpper == null || c.bbLower == null || isNaN(c.bbUpper) || isNaN(c.bbLower)) return null;
                  const prev = visibleCandles[i - 1];
                  if (!prev || prev.bbUpper == null || prev.bbLower == null || isNaN(prev.bbUpper) || isNaN(prev.bbLower)) return null;
                  const x1 = getX(i - 1);
                  const x2 = getX(i);
                  const yU1 = getYPrice(prev.bbUpper);
                  const yU2 = getYPrice(c.bbUpper);
                  const yL1 = getYPrice(prev.bbLower);
                  const yL2 = getYPrice(c.bbLower);
                  return (
                    <polygon
                      key={i}
                      points={`${x1},${yU1} ${x2},${yU2} ${x2},${yL2} ${x1},${yL1}`}
                      fill="#a855f7"
                    />
                  );
                })}
              </g>
            )}

            {/* Bollinger Bands Lines */}
            {showBollinger && n > 0 && (
              <g fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" opacity={0.6}>
                <path d={visibleCandles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPrice(c.bbUpper || c.close)}`).join(' ')} />
                <path d={visibleCandles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPrice(c.bbLower || c.close)}`).join(' ')} />
              </g>
            )}

            {/* Moving Averages: EMA20, EMA50, EMA200 */}
            {showEMA20 && n > 0 && (
              <path
                d={visibleCandles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPrice(c.ema20 || c.close)}`).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
              />
            )}
            {showEMA50 && n > 0 && (
              <path
                d={visibleCandles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPrice(c.ema50 || c.close)}`).join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
            )}
            {showEMA200 && n > 0 && (
              <path
                d={visibleCandles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPrice(c.ema200 || c.close)}`).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
            )}

            {/* Candlesticks or Line Mode */}
            {chartMode === 'candle' ? (
              visibleCandles.map((c, i) => {
                const x = getX(i);
                const open = typeof c.open === 'number' && !isNaN(c.open) ? c.open : (c.close || 0);
                const close = typeof c.close === 'number' && !isNaN(c.close) ? c.close : open;
                const high = typeof c.high === 'number' && !isNaN(c.high) ? c.high : Math.max(open, close);
                const low = typeof c.low === 'number' && !isNaN(c.low) ? c.low : Math.min(open, close);
                const isUp = close >= open;
                const yHigh = getYPrice(high);
                const yLow = getYPrice(low);
                const bodyTop = getYPrice(Math.max(open, close));
                const bodyBottom = getYPrice(Math.min(open, close));
                const bodyHeight = Math.max(1.5, Math.abs(bodyBottom - bodyTop));
                const candleWidth = Math.max(2, Math.min(10, ((width - padding.left - padding.right) / Math.max(1, n)) * 0.7));
                const color = isUp ? '#22c55e' : '#ef4444';

                return (
                  <g key={i}>
                    {/* Wick */}
                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
                    {/* Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={Math.min(bodyTop, bodyBottom)}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color}
                      stroke={color}
                      strokeWidth="0.5"
                      rx="1"
                    />
                  </g>
                );
              })
            ) : (
              n > 0 && (
                <g>
                  {/* Subtle Gradient Area under Price Line */}
                  <path
                    d={`${visibleCandles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPrice(c.close)}`).join(' ')} L ${getX(n - 1)} ${heightMain - padding.bottom} L ${getX(0)} ${heightMain - padding.bottom} Z`}
                    fill="url(#priceLineAreaGrad)"
                  />
                  {/* Main High-Contrast Asset Price Line (3.5px thickness for clear differentiation) */}
                  <path
                    d={visibleCandles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPrice(c.close)}`).join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#priceLineGlow)"
                  />
                  {/* Highlight current / hovered price point */}
                  {activeCandle && (
                    <g>
                      <circle
                        cx={getX(hoverIndex !== null ? hoverIndex : n - 1)}
                        cy={getYPrice(activeCandle.close)}
                        r="4.5"
                        fill="#ffffff"
                        stroke="#0284c7"
                        strokeWidth="2.5"
                      />
                    </g>
                  )}
                </g>
              )
            )}

            {/* Empty / Loading Message */}
            {n === 0 && (
              <text x={width / 2} y={heightMain / 2} fill="#94a3b8" textAnchor="middle" fontSize="13" fontFamily="sans-serif">
                Carregando candles e indicadores técnicos...
              </text>
            )}
          </g>

          {/* ── PANEL 2: VOLUME PANEL ── */}
          <g transform={`translate(0, ${heightMain})`}>
            <rect x={0} y={0} width={width} height={heightSub} fill="#0d1322" />
            <line x1={padding.left} y1={0} x2={width - padding.right} y2={0} stroke="#334155" />
            <text x={padding.left + 5} y={14} fill="#64748b" fontSize="9" fontWeight="bold">VOLUME &amp; LIQUIDEZ</text>

            {visibleCandles.map((c, i) => {
              const x = getX(i);
              const isUp = (c.close || 0) >= (c.open || c.close || 0);
              const vol = typeof c.volume === 'number' && !isNaN(c.volume) && isFinite(c.volume) ? c.volume : 0;
              const barH = maxVol > 0 ? (vol / maxVol) * (heightSub - 20) : 0;
              const safeBarH = Math.max(0, isNaN(barH) ? 0 : barH);
              const barW = Math.max(1.5, ((width - padding.left - padding.right) / Math.max(1, n)) * 0.6);
              return (
                <rect
                  key={i}
                  x={x - barW / 2}
                  y={Math.max(0, heightSub - safeBarH - 5)}
                  width={barW}
                  height={safeBarH}
                  fill={isUp ? '#22c55e40' : '#ef444440'}
                  stroke={isUp ? '#22c55e' : '#ef4444'}
                  strokeWidth="0.5"
                />
              );
            })}
          </g>

          {/* ── PANEL 3: RSI(14) PANEL ── */}
          <g transform={`translate(0, ${heightMain + heightSub})`}>
            <rect x={0} y={0} width={width} height={heightSub} fill="#0b0f19" />
            <line x1={padding.left} y1={0} x2={width - padding.right} y2={0} stroke="#334155" />
            <text x={padding.left + 5} y={14} fill="#64748b" fontSize="9" fontWeight="bold">RSI (14) — SOBREVENDA &lt; 30</text>

            {/* Threshold lines: 30 & 70 */}
            <line x1={padding.left} y1={heightSub * 0.3} x2={width - padding.right} y2={heightSub * 0.3} stroke="#ef4444" strokeDasharray="3 3" opacity={0.4} />
            <text x={width - padding.right + 6} y={heightSub * 0.3 + 3} fill="#ef4444" fontSize="8">70</text>
            <line x1={padding.left} y1={heightSub * 0.7} x2={width - padding.right} y2={heightSub * 0.7} stroke="#22c55e" strokeDasharray="3 3" opacity={0.6} />
            <text x={width - padding.right + 6} y={heightSub * 0.7 + 3} fill="#22c55e" fontSize="8">30</text>

            {/* RSI Line */}
            {n > 0 && (
              <path
                d={visibleCandles.map((c, i) => {
                  const rsi = typeof c.rsi14 === 'number' && !isNaN(c.rsi14) ? c.rsi14 : 50;
                  const y = (1 - Math.max(0, Math.min(100, rsi)) / 100) * (heightSub - 20) + 10;
                  return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${isNaN(y) ? heightSub / 2 : y}`;
                }).join(' ')}
                fill="none"
                stroke="#eab308"
                strokeWidth="1.5"
              />
            )}
          </g>

          {/* ── PANEL 4: MACD PANEL ── */}
          <g transform={`translate(0, ${heightMain + heightSub * 2})`}>
            <rect x={0} y={0} width={width} height={heightSub} fill="#0d1322" />
            <line x1={padding.left} y1={0} x2={width - padding.right} y2={0} stroke="#334155" />
            <text x={padding.left + 5} y={14} fill="#64748b" fontSize="9" fontWeight="bold">MACD (12, 26, 9) HISTOGRAMA</text>

            {/* Zero Line */}
            <line x1={padding.left} y1={heightSub / 2} x2={width - padding.right} y2={heightSub / 2} stroke="#475569" strokeDasharray="2 2" />

            {visibleCandles.map((c, i) => {
              const x = getX(i);
              const hist = typeof c.macdHist === 'number' && !isNaN(c.macdHist) ? c.macdHist : 0;
              const h = Math.min(heightSub / 2 - 5, Math.abs(hist) * 20);
              const safeH = Math.max(1, isNaN(h) ? 1 : h);
              const isPos = hist >= 0;
              const barW = Math.max(1.5, ((width - padding.left - padding.right) / Math.max(1, n)) * 0.5);
              return (
                <rect
                  key={i}
                  x={x - barW / 2}
                  y={isPos ? heightSub / 2 - safeH : heightSub / 2}
                  width={barW}
                  height={safeH}
                  fill={isPos ? '#22c55e' : '#ef4444'}
                />
              );
            })}
          </g>

          {/* Hover Crosshair vertical line */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n && (
            <line
              x1={getX(hoverIndex)}
              y1={0}
              x2={getX(hoverIndex)}
              y2={heightMain + heightSub * 3}
              stroke="#94a3b8"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
