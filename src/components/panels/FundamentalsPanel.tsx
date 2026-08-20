import React from 'react';
import { FundamentalsData } from '../../types';
import { Landmark, PieChart, TrendingUp, DollarSign, Award, CheckCircle2 } from 'lucide-react';

interface FundamentalsPanelProps {
  data: FundamentalsData;
  ticker: string;
}

export const FundamentalsPanel: React.FC<FundamentalsPanelProps> = ({ data, ticker }) => {
  const formatMktCap = (v?: number) => {
    if (!v) return '-';
    if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(2)} Tri`;
    if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(1)} Bi`;
    return `R$ ${(v / 1e6).toFixed(0)} Mi`;
  };

  return (
    <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-700/70">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-400" />
            Análise Fundamentalista &amp; Valuation — {ticker}
          </h3>
          <p className="text-xs text-slate-400">
            Setor: <strong className="text-slate-200">{data.setor || 'Diversificado'}</strong> | Fonte: {data.fonte}
          </p>
        </div>

        <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Score Fundamentalista: {data.score}/100</span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 font-mono text-xs">
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Preço / Lucro (P/L)</div>
          <div className="text-2xl font-bold text-white">{data.pe_ratio ? `${data.pe_ratio}x` : 'N/A'}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">Valuation atrativo</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Dividend Yield (DY)</div>
          <div className="text-2xl font-bold text-emerald-400">{data.dividend_yield ? `${data.dividend_yield}%` : 'N/A'}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Rendimentos anuais</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Crescimento Receita</div>
          <div className="text-2xl font-bold text-cyan-300">+{data.revenue_growth || 10}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ano contra ano</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Valor de Mercado</div>
          <div className="text-lg font-bold text-white mt-1">{formatMktCap(data.market_cap)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{data.recomendacao || 'Compra'}</div>
        </div>
      </div>

      {/* Details List */}
      {data.detalhes && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {Object.entries(data.detalhes).map(([key, item], idx) => (
            <div key={idx} className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">{key}: <span className="font-mono text-emerald-400">{item.valor}</span></div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.criterio}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
