import React from 'react';
import { FlowResult } from '../../types';
import { Activity, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface FlowPanelProps {
  data: FlowResult;
  ticker: string;
}

export const FlowPanel: React.FC<FlowPanelProps> = ({ data, ticker }) => {
  const getBadge = () => {
    if (data.sinal === 'verde') {
      return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full">🟢 FLUXO COMPRADOR FORTE</span>;
    }
    if (data.sinal === 'vermelho') {
      return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1 rounded-full">🔴 FLUXO VENDEDOR DOMINANTE</span>;
    }
    return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full">🟡 FLUXO NEUTRO / AGUARDAR</span>;
  };

  const buyPct = Math.round(data.buy_aggression * 100);
  const sellPct = Math.round(data.sell_aggression * 100);

  return (
    <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-700/70">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Rastreamento de Fluxo &amp; Volume Institucional — {ticker}
          </h3>
          <p className="text-xs text-slate-400">
            Estimativa de agressão compradora vs vendedora ponderada pelo volume relativo e variação intradiária.
          </p>
        </div>
        <div>{getBadge()}</div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* Agressão Compradora */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center justify-between">
            <span>Agressão Compradora</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mb-2">
            {buyPct}%
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${buyPct}%` }} />
          </div>
        </div>

        {/* Agressão Vendedora */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center justify-between">
            <span>Agressão Vendedora</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mb-2">
            {sellPct}%
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${sellPct}%` }} />
          </div>
        </div>

        {/* Volume Relativo & Acumulado */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="text-slate-400 mb-1 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Volume Relativo (vs 20d):</div>
            <div className="text-lg font-bold text-white mb-2">{data.vol_ratio.toFixed(2)}x a média</div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-slate-300">
            Flow Acumulado (5d): <strong className={data.flow_cum > 0 ? 'text-emerald-400' : 'text-rose-400'}>{data.flow_cum.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Mini Visual Flow Sparkbars */}
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
        Histórico Recente de Agressão do Fluxo
      </h4>
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto">
        <div className="flex items-end gap-1 h-20 min-w-[500px]">
          {data.historico.map((h, i) => {
            const hPct = Math.min(100, Math.max(10, Math.abs(h.flow_cum) * 20));
            const isPos = h.flow_cum >= 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className={`w-full rounded-t transition-all ${
                    h.sinal === 'verde' ? 'bg-emerald-500' : h.sinal === 'vermelho' ? 'bg-rose-500' : 'bg-slate-700'
                  }`}
                  style={{ height: `${hPct}%` }}
                />
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 bg-slate-800 text-[10px] text-white p-1 rounded font-mono pointer-events-none whitespace-nowrap z-10 border border-slate-600">
                  {h.date}: {h.flow_cum.toFixed(2)} ({h.sinal})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
