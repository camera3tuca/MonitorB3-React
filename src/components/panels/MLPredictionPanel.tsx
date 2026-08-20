import React from 'react';
import { MLPredictionResult } from '../../types';
import { Brain, TrendingUp, TrendingDown, Target, BarChart2, Cpu, CheckCircle } from 'lucide-react';

interface MLPredictionPanelProps {
  data: MLPredictionResult;
  ticker: string;
}

export const MLPredictionPanel: React.FC<MLPredictionPanelProps> = ({ data, ticker }) => {
  const isAlta = data.tendencia === 'ALTA';

  return (
    <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-700/70">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Machine Learning — Previsão Preditiva (Ensemble 5 Dias) — {ticker}
          </h3>
          <p className="text-xs text-slate-400">
            Regressores multivariados treinados com séries temporais de retornos, distâncias de médias e indicadores de momento.
          </p>
        </div>

        {/* Prediction Badge */}
        <div className={`px-4 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-1.5 ${
          isAlta ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}>
          {isAlta ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
          <span>Tendência D+5: {data.tendencia} ({data.variacao_prevista_pct >= 0 ? '+' : ''}{data.variacao_prevista_pct.toFixed(2)}%)</span>
        </div>
      </div>

      {/* Target Comparison Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 font-mono">
          <div className="text-xs text-slate-400 mb-1">Preço Atual</div>
          <div className="text-2xl font-bold text-white">R$ {data.preco_atual.toFixed(2)}</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 font-mono">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-indigo-400" /> Alvo Preditivo D+5
          </div>
          <div className="text-2xl font-bold text-indigo-300">R$ {data.preco_previsto_5d.toFixed(2)}</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 font-mono">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Modelo Campeão
          </div>
          <div className="text-sm font-bold text-cyan-300 mt-1">{data.melhor_modelo}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">R² Score: {(data.r2_score * 100).toFixed(0)}% de aderência</div>
        </div>
      </div>

      {/* 5-Day Horizon Forecast Curve */}
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
        Trajetória de Preços D+1 a D+5 (com Intervalo de Confiança 95%)
      </h4>
      <div className="grid grid-cols-5 gap-2 mb-5">
        {data.previsoes_dias.map((p) => (
          <div key={p.dia} className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 text-center font-mono">
            <div className="text-[11px] font-bold text-indigo-400 mb-1">{p.data}</div>
            <div className="text-sm font-bold text-white mb-1">R$ {p.preco.toFixed(2)}</div>
            <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
              R$ {p.limite_inf.toFixed(2)} ~ {p.limite_sup.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Models Comparison & Feature Weights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Performance Comparison */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4">
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            Comparativo de Modelos Avaliados
          </h5>
          <div className="space-y-2">
            {data.modelos_comparacao.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-slate-800/60">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                  {m.modelo}
                </span>
                <span className="text-slate-400">
                  R²: <strong className="text-emerald-400">{(m.r2 * 100).toFixed(0)}%</strong> | MAE: <strong className="text-slate-200">R$ {m.mae.toFixed(2)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Importance */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4">
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            Importância dos Indicadores (Feature Importance)
          </h5>
          <div className="space-y-2">
            {data.features_importantes.map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">{f.feature}</span>
                  <span className="text-indigo-300 font-bold">{(f.peso * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${f.peso * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
