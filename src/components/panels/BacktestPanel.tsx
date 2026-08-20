import React from 'react';
import { BacktestResult } from '../../types';
import { History, TrendingUp, CheckCircle, XCircle, BarChart2, ShieldCheck } from 'lucide-react';

interface BacktestPanelProps {
  data: BacktestResult;
  ticker: string;
}

export const BacktestPanel: React.FC<BacktestPanelProps> = ({ data, ticker }) => {
  return (
    <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-700/70">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Validação Histórica da Estratégia de Sobrevenda (Backtest) — {ticker}
          </h3>
          <p className="text-xs text-slate-400">
            Simulação de entradas em RSI &lt; 35 / Estocástico em fundo com alvo de 5% e stop de 3.5% nos últimos 12 meses.
          </p>
        </div>

        <div className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span>Retorno Total: +{data.retorno_total.toFixed(1)}%</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 font-mono text-xs">
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Taxa de Acerto</div>
          <div className="text-2xl font-bold text-emerald-400">{data.taxa_acerto.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{data.total_trades} trades executados</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Profit Factor</div>
          <div className="text-2xl font-bold text-cyan-300">{data.profit_factor.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ganhos / Perdas</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Retorno Médio / Trade</div>
          <div className="text-2xl font-bold text-indigo-300">+{data.retorno_medio.toFixed(2)}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Média por operação</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Max Drawdown</div>
          <div className="text-2xl font-bold text-rose-400">-{data.max_drawdown}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Risco controlado</div>
        </div>
      </div>

      {/* Trades Ledger */}
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
        Histórico das Operações Realizadas
      </h4>
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <th className="py-2.5 px-3">Data Entrada</th>
              <th className="py-2.5 px-3">Preço Entrada</th>
              <th className="py-2.5 px-3">Data Saída</th>
              <th className="py-2.5 px-3">Preço Saída</th>
              <th className="py-2.5 px-3">Duração</th>
              <th className="py-2.5 px-3">Resultado</th>
              <th className="py-2.5 px-3 text-right">Retorno %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.trades.map((t, i) => (
              <tr key={i} className="hover:bg-slate-800/40">
                <td className="py-2 px-3 text-slate-300">{t.entrada_data}</td>
                <td className="py-2 px-3 text-white">R$ {t.entrada_preco.toFixed(2)}</td>
                <td className="py-2 px-3 text-slate-300">{t.saida_data}</td>
                <td className="py-2 px-3 text-white">R$ {t.saida_preco.toFixed(2)}</td>
                <td className="py-2 px-3 text-slate-400">{t.dias} dias</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    t.resultado === 'GAIN' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {t.resultado === 'GAIN' ? '✅ GAIN' : '❌ LOSS'}
                  </span>
                </td>
                <td className={`py-2 px-3 text-right font-bold ${
                  t.retorno_pct > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {t.retorno_pct > 0 ? '+' : ''}{t.retorno_pct.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
