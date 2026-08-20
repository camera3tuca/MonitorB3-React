import React from 'react';
import { RLAgentResult } from '../../types';
import { Bot, Trophy, ArrowUpRight, TrendingUp, ShieldCheck, Zap, Activity } from 'lucide-react';

interface RLAgentPanelProps {
  data: RLAgentResult;
  ticker: string;
}

export const RLAgentPanel: React.FC<RLAgentPanelProps> = ({ data, ticker }) => {
  return (
    <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-700/70">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            Agente RL (Q-Learning Deep Policy) — {ticker}
          </h3>
          <p className="text-xs text-slate-400">
            Simulador de aprendizado por reforço que aprendeu a temporizar compras de repique maximizando o Sharpe Ratio.
          </p>
        </div>

        <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <span>Alpha Gerado: +{data.alpha_pct.toFixed(2)}% vs Buy &amp; Hold</span>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 font-mono text-xs">
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Taxa de Acerto (Win Rate)</div>
          <div className="text-2xl font-bold text-emerald-400">{data.win_rate.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{data.total_trades} operações no ciclo</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Retorno do Agente RL</div>
          <div className="text-2xl font-bold text-cyan-300">+{data.retorno_agente_pct.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Retorno acumulado</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Retorno Buy &amp; Hold</div>
          <div className="text-2xl font-bold text-slate-300">+{data.retorno_buy_hold_pct.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Estratégia passiva</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-slate-400 mb-1">Sharpe Ratio / Drawdown</div>
          <div className="text-2xl font-bold text-amber-400">{data.estatisticas.sharpe_ratio}</div>
          <div className="text-[11px] text-rose-400 mt-0.5">Max DD: -{data.estatisticas.max_drawdown}%</div>
        </div>
      </div>

      {/* Action Table */}
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-blue-400" />
        Decisões Recentes da Política de Q-Learning
      </h4>
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-x-auto mb-4">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <th className="py-2.5 px-3">Data</th>
              <th className="py-2.5 px-3">Preço Fech.</th>
              <th className="py-2.5 px-3">Ação Executada</th>
              <th className="py-2.5 px-3">Q-Value Calculado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.acoes_recentes.map((a, i) => (
              <tr key={i} className="hover:bg-slate-800/40">
                <td className="py-2 px-3 text-slate-300">{a.data}</td>
                <td className="py-2 px-3 text-white font-semibold">R$ {a.preco.toFixed(2)}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    a.acao === 'COMPRA'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : a.acao === 'VENDA'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {a.acao === 'COMPRA' ? '🛒 COMPRA' : a.acao === 'VENDA' ? '💰 VENDA' : '⏸️ MANTER'}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className={a.q_valor > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                    {a.q_valor >= 0 ? '+' : ''}{a.q_valor}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
