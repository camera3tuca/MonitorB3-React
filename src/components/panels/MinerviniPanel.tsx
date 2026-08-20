import React from 'react';
import { MinerviniResult } from '../../types';
import { Award, CheckCircle, XCircle, TrendingUp, ShieldAlert, Target } from 'lucide-react';

interface MinerviniPanelProps {
  data: MinerviniResult;
  ticker: string;
}

export const MinerviniPanel: React.FC<MinerviniPanelProps> = ({ data, ticker }) => {
  return (
    <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      {/* Header with Stage Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-700/70">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Classificação de Fases de Mercado &amp; Trend Template — {ticker}
          </h3>
          <p className="text-xs text-slate-400">
            Avaliação de 8 critérios objetivos de alinhamento de médias móveis e diagnóstico do ciclo de mercado.
          </p>
        </div>

        {/* Phase Pill */}
        <div
          className="px-3.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-2 shadow-md"
          style={{
            backgroundColor: `${data.fase_cor}15`,
            borderColor: `${data.fase_cor}40`,
            color: data.fase_cor,
          }}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{data.fase_nome}</span>
        </div>
      </div>

      {/* Stage Description & Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-700/70 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Diagnóstico do Ciclo Atual
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {data.fase_desc}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Score de Força:</span>
            <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                style={{ width: `${data.score_forca}%` }}
              />
            </div>
            <strong className="text-emerald-400">{data.score_forca}% ({data.criterios_ok}/8 aprovados)</strong>
          </div>
        </div>

        {/* Risco / Retorno Alvos */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 flex flex-col justify-between text-xs font-mono">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Stop-Loss:</span>
              <strong>R$ {data.stop_loss.toFixed(2)} (-{data.risco_pct.toFixed(1)}%)</strong>
            </div>
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Alvo 2R (1:2):</span>
              <strong>R$ {data.alvo_2r.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between text-cyan-400">
              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Alvo 3R (1:3):</span>
              <strong>R$ {data.alvo_3r.toFixed(2)}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center">
            Stop calculado via {data.stop_tipo}
          </div>
        </div>
      </div>

      {/* 8 Minervini Criteria Checklist */}
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
        Checklist dos 8 Critérios do Trend Template
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {data.criterios.map((c) => (
          <div
            key={c.id}
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
              c.atendido
                ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-200'
                : 'bg-slate-900/50 border-slate-800 text-slate-400'
            }`}
          >
            {c.atendido ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold text-white">
                {c.id}. {c.nome}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {c.detalhe}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
