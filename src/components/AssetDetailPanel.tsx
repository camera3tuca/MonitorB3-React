import React from 'react';
import {
  AssetOpportunity,
  HistoricalCandle,
  FibonacciLevels,
  TripleScreenResult,
  MinerviniResult,
  FlowResult,
  MLPredictionResult,
  RLAgentResult,
  BacktestResult,
  FundamentalsData,
  NewsArticle
} from '../types';
import { TechnicalChart } from './TechnicalChart';
import { TripleScreenPanel } from './panels/TripleScreenPanel';
import { MinerviniPanel } from './panels/MinerviniPanel';
import { FlowPanel } from './panels/FlowPanel';
import { MLPredictionPanel } from './panels/MLPredictionPanel';
import { RLAgentPanel } from './panels/RLAgentPanel';
import { BacktestPanel } from './panels/BacktestPanel';
import { FundamentalsPanel } from './panels/FundamentalsPanel';
import { NewsSentimentPanel } from './panels/NewsSentimentPanel';
import { getSectorStyle } from '../utils/sectorUtils';
import {
  BarChart2,
  Compass,
  Award,
  Activity,
  Brain,
  Bot,
  History,
  Landmark,
  Newspaper,
  X
} from 'lucide-react';

export type TabType = 'grafico' | 'triplescreen' | 'minervini' | 'flow' | 'ml' | 'rl' | 'backtest' | 'fundamentalista' | 'noticias';

interface AssetDetailPanelProps {
  selectedOpp: AssetOpportunity;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  candles: HistoricalCandle[];
  fibonacci: FibonacciLevels;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  tripleScreen: TripleScreenResult;
  minervini: MinerviniResult;
  flowResult: FlowResult;
  mlPrediction: MLPredictionResult;
  rlAgent: RLAgentResult;
  backtestData: BacktestResult;
  fundamentals: FundamentalsData | null;
  news: NewsArticle[];
  onClose?: () => void;
}

export const AssetDetailPanel: React.FC<AssetDetailPanelProps> = ({
  selectedOpp,
  activeTab,
  setActiveTab,
  candles,
  fibonacci,
  timeframe,
  setTimeframe,
  tripleScreen,
  minervini,
  flowResult,
  mlPrediction,
  rlAgent,
  backtestData,
  fundamentals,
  news,
  onClose
}) => {
  return (
    <div id="asset-detail-section" className="space-y-4 p-2 sm:p-4 bg-slate-900/95 border border-blue-500/40 rounded-xl shadow-xl w-full max-w-full overflow-hidden transition-all duration-300">
      {/* Asset Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-850 to-slate-800 border border-slate-700/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-mono font-extrabold text-blue-300 text-lg shadow-inner shrink-0">
            {selectedOpp.Ticker.slice(0, 4)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-white font-mono">{selectedOpp.Ticker}</h2>
              <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded font-semibold">
                {selectedOpp.Classe}
              </span>
              {selectedOpp.Setor && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getSectorStyle(selectedOpp.Setor).badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${getSectorStyle(selectedOpp.Setor).dotColor}`} />
                  {selectedOpp.Setor}
                </span>
              )}
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-2 py-0.5 rounded">
                {selectedOpp.Queda_Dia.toFixed(2)}% hoje
              </span>
              {selectedOpp.Gap !== 0 && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono px-2 py-0.5 rounded">
                  Gap: {selectedOpp.Gap > 0 ? '+' : ''}{selectedOpp.Gap.toFixed(2)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">{selectedOpp.Empresa}</p>
          </div>
        </div>

        {/* Fast Stats Bar & Close Button */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400">Preço:</span> <strong className="text-white">R$ {selectedOpp.Preco.toFixed(2)}</strong>
          </div>
          <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400">I.S.:</span> <strong className="text-emerald-400">{selectedOpp.IS}</strong>
          </div>
          <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400">RSI(14):</span> <strong className={selectedOpp.RSI14 < 30 ? 'text-emerald-400' : 'text-slate-300'}>{selectedOpp.RSI14}</strong>
          </div>
          <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400">Score:</span> <strong className="text-amber-400">{selectedOpp.Score}/10</strong>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto md:ml-2 p-1.5 bg-slate-700/60 hover:bg-rose-600/80 hover:text-white text-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-sans font-semibold"
              title="Fechar painel do ativo"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Fechar</span>
            </button>
          )}
        </div>
      </div>

      {/* Analysis Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none text-xs select-none">
        <button
          id="tab-chart"
          type="button"
          onClick={() => setActiveTab('grafico')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'grafico'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Gráfico Técnico &amp; Fibonacci</span>
        </button>

        <button
          id="tab-triplescreen"
          type="button"
          onClick={() => setActiveTab('triplescreen')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'triplescreen'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Multi-Timeframe (3 Telas)</span>
        </button>

        <button
          id="tab-minervini"
          type="button"
          onClick={() => setActiveTab('minervini')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'minervini'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Filtro de Tendência &amp; Fases</span>
        </button>

        <button
          id="tab-flow"
          type="button"
          onClick={() => setActiveTab('flow')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'flow'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Fluxo &amp; Volume Institucional</span>
        </button>

        <button
          id="tab-ml"
          type="button"
          onClick={() => setActiveTab('ml')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'ml'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>ML Preditivo (5D)</span>
        </button>

        <button
          id="tab-rl"
          type="button"
          onClick={() => setActiveTab('rl')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'rl'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Agente RL (Q-Learning)</span>
        </button>

        <button
          id="tab-backtest"
          type="button"
          onClick={() => setActiveTab('backtest')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'backtest'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Backtest Histórico</span>
        </button>

        <button
          id="tab-fundamentalista"
          type="button"
          onClick={() => setActiveTab('fundamentalista')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'fundamentalista'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Valuation</span>
        </button>

        <button
          id="tab-noticias"
          type="button"
          onClick={() => setActiveTab('noticias')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'noticias'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Notícias &amp; IA</span>
        </button>
      </div>

      {/* Tab View Content */}
      <div className="pt-2">
        {activeTab === 'grafico' && (
          <div className="space-y-4">
            <TechnicalChart
              candles={candles}
              fibonacci={fibonacci}
              ticker={selectedOpp.Ticker}
              timeframe={timeframe}
              onChangeTimeframe={(tf) => setTimeframe(tf)}
            />

            {/* Fibonacci Summary Bar */}
            {fibonacci && fibonacci.high > 0 && (
              <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold uppercase">Posição Fibonacci:</span>
                  <span className="text-yellow-400 font-bold bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">
                    {fibonacci.currentNear}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-slate-300">
                  <div>Topo 100%: <strong className="text-white">R$ {fibonacci.fib0.toFixed(2)}</strong></div>
                  <div>Fibo 38.2%: <strong className="text-slate-200">R$ {fibonacci.fib382.toFixed(2)}</strong></div>
                  <div>Fibo 50.0%: <strong className="text-slate-200">R$ {fibonacci.fib500.toFixed(2)}</strong></div>
                  <div>Fibo 61.8% (Golden Zone): <strong className="text-yellow-400 font-bold">R$ {fibonacci.fib618.toFixed(2)}</strong></div>
                  <div>Fundo 0%: <strong className="text-white">R$ {fibonacci.fib100.toFixed(2)}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'triplescreen' && (
          <TripleScreenPanel data={tripleScreen} ticker={selectedOpp.Ticker} />
        )}

        {activeTab === 'minervini' && (
          <MinerviniPanel data={minervini} ticker={selectedOpp.Ticker} />
        )}

        {activeTab === 'flow' && (
          <FlowPanel data={flowResult} ticker={selectedOpp.Ticker} />
        )}

        {activeTab === 'ml' && (
          <MLPredictionPanel data={mlPrediction} ticker={selectedOpp.Ticker} />
        )}

        {activeTab === 'rl' && (
          <RLAgentPanel data={rlAgent} ticker={selectedOpp.Ticker} />
        )}

        {activeTab === 'backtest' && (
          <BacktestPanel data={backtestData} ticker={selectedOpp.Ticker} />
        )}

        {activeTab === 'fundamentalista' && fundamentals && (
          <FundamentalsPanel data={fundamentals} ticker={selectedOpp.Ticker} />
        )}

        {activeTab === 'noticias' && (
          <NewsSentimentPanel articles={news} ticker={selectedOpp.Ticker} />
        )}
      </div>
    </div>
  );
};
