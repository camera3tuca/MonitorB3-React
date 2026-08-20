import React from 'react';
import { TripleScreenResult } from '../../types';
import { ShieldCheck, Compass, Waves, Crosshair, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface TripleScreenPanelProps {
  data: TripleScreenResult;
  ticker: string;
}

export const TripleScreenPanel: React.FC<TripleScreenPanelProps> = ({ data, ticker }) => {
  const getVerdictBadge = () => {
    if (data.veredicto === 'COMPRA') {
      return (
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-extrabold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          VEREDICTO: COMPRA TÉCNICA
        </span>
      );
    }
    if (data.veredicto === 'VENDA') {
      return (
        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-sm font-extrabold px-4 py-1.5 rounded-full flex items-center gap-1.5">
          <XCircle className="w-4 h-4 text-rose-400" />
          VEREDICTO: VENDA / FICAR DE FORA
        </span>
      );
    }
    return (
      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        VEREDICTO: AGUARDAR CONFIRMAÇÃO
      </span>
    );
  };

  return (
    <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-700/70">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            Estratégia Multi-Timeframe (3 Telas de Análise) — {ticker}
          </h3>
          <p className="text-xs text-slate-400">
            Três camadas complementares de análise (Tendência Maior, Oscilação Intermediária e Ponto de Gatilho) para filtrar ruídos.
          </p>
        </div>
        <div>{getVerdictBadge()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1ª Tela: A Maré */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-400" />
                1ª Tela: A Maré
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                data.tela1.status === 'ALTA' ? 'bg-emerald-500/20 text-emerald-300' : data.tela1.status === 'BAIXA' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {data.tela1.emoji} {data.tela1.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {data.tela1.desc}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Slope EMA13: <strong className="text-white">{data.tela1.ema13Slope >= 0 ? '+' : ''}{data.tela1.ema13Slope.toFixed(2)}</strong></span>
            <span>Distância: <strong className="text-white">{data.tela1.distPct.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* 2ª Tela: A Onda */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                2ª Tela: A Onda
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                data.tela2.status === 'SOBREVENDA' ? 'bg-emerald-500/20 text-emerald-300' : data.tela2.status === 'SOBRECOMPRA' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {data.tela2.emoji} {data.tela2.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {data.tela2.desc}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            <span>Force Index EFI(2): <strong className="text-white">{(data.tela2.efi2 / 1e6).toFixed(2)}M</strong></span>
          </div>
        </div>

        {/* 3ª Tela: A Execução */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-amber-400" />
                3ª Tela: A Execução
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                data.tela3.status === 'BUY_STOP' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {data.tela3.emoji} {data.tela3.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {data.tela3.desc}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Gatilho: <strong className="text-emerald-400">R$ {data.tela3.stopPrice.toFixed(2)}</strong></span>
            <span>Stop-Loss: <strong className="text-rose-400">R$ {data.tela3.stopLossPrice.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
