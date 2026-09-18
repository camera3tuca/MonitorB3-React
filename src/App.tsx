import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ScannerFilters } from './components/ScannerFilters';
import { OpportunitiesTable } from './components/OpportunitiesTable';
import { AssetDetailPanel, TabType } from './components/AssetDetailPanel';

import {
  AssetClass,
  AssetOpportunity,
  HistoricalCandle,
  FibonacciLevels,
  TripleScreenResult,
  MinerviniResult,
  MLPredictionResult,
  RLAgentResult,
  FlowResult,
  FundamentalsData,
  NewsArticle,
  BacktestResult
} from './types';

import {
  enrichCandles,
  calculateFibonacci,
  calculateTripleScreen,
  calculateMinervini,
  calculateFlow,
  calculateMLPrediction,
  calculateRLAgent,
  runScannerBacktest
} from './utils/indicators';
import { getSectorStyle } from './utils/sectorUtils';
import { getApiUrl, fetchScannerData, clearAppCacheAndReload } from './utils/api';

import {
  Activity,
  Award,
  BarChart2,
  Bot,
  Brain,
  ChevronRight,
  Compass,
  History,
  Info,
  Landmark,
  Layers,
  Newspaper,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  Globe,
  ExternalLink
} from 'lucide-react';

export const App: React.FC = () => {
  const allClasses: AssetClass[] = ['Ação', 'BDR', 'ETF', 'FII'];

  // Filters State
  const [selectedClasses, setSelectedClasses] = useState<AssetClass[]>(['Ação', 'BDR', 'ETF', 'FII']);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [filterEMA20, setFilterEMA20] = useState<boolean>(false);
  const [filterEMA50, setFilterEMA50] = useState<boolean>(false);
  const [filterEMA200, setFilterEMA200] = useState<boolean>(false);
  const [minLiquidez, setMinLiquidez] = useState<number>(1);
  const [showBacktests, setShowBacktests] = useState<boolean>(false);

  // Scanner Data State
  const [opportunities, setOpportunities] = useState<AssetOpportunity[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>('PETR4');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'server' | 'direct' | 'cache'>('server');

  // Active Asset Analysis State
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [activeTab, setActiveTab] = useState<
    'grafico' | 'triplescreen' | 'minervini' | 'flow' | 'ml' | 'rl' | 'backtest' | 'fundamentalista' | 'noticias'
  >('grafico');

  const [candles, setCandles] = useState<HistoricalCandle[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);

  // Toggle or isolate Asset Class filter
  const handleToggleClass = (c: AssetClass) => {
    // If all classes are currently selected, tapping a specific class isolates it to view ONLY that class
    if (selectedClasses.length === allClasses.length) {
      setSelectedClasses([c]);
      return;
    }

    if (selectedClasses.includes(c)) {
      if (selectedClasses.length > 1) {
        setSelectedClasses(selectedClasses.filter((item) => item !== c));
      } else {
        // If clicking the only active class, reset to all
        setSelectedClasses(allClasses);
      }
    } else {
      setSelectedClasses([...selectedClasses, c]);
    }
  };

  const handleSelectAllClasses = () => {
    setSelectedClasses(allClasses);
  };

  // Fetch opportunities scanner with smart fallback
  const fetchScanner = async () => {
    setIsScanning(true);
    try {
      const result = await fetchScannerData(selectedClasses);
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        setOpportunities(result.data);
        setLastUpdated(new Date(result.timestamp));
        setDataSource(result.source);
        if (!selectedTicker && result.data.length > 0) {
          setSelectedTicker(result.data[0].Ticker);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar scanner:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchScanner();

    // Auto-refresh quotes every 60 seconds
    const interval = setInterval(() => {
      fetchScanner();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedClasses]);

  // Fetch selected ticker historical candles and details
  useEffect(() => {
    if (!selectedTicker) return;

    let isMounted = true;
    setIsLoadingHistory(true);

    const loadData = async () => {
      try {
        // Fetch historical candles
        const histRes = await fetch(getApiUrl(`/api/history/${selectedTicker}?timeframe=${timeframe}&range=1y`));
        if (histRes.ok && isMounted) {
          const histJson = await histRes.json();
          if (histJson.candles && Array.isArray(histJson.candles)) {
            const opp = opportunities.find(o => o.Ticker === selectedTicker);
            const anchors = {
              ema20: histJson.indicators?.ema20 ?? opp?.EMA20,
              ema50: histJson.indicators?.ema50 ?? opp?.EMA50,
              ema200: histJson.indicators?.ema200 ?? opp?.EMA200,
              rsi14: histJson.indicators?.rsi ?? opp?.RSI14,
              stochK: histJson.indicators?.stochK ?? opp?.Stoch,
            };
            const enriched = enrichCandles(histJson.candles, anchors);
            setCandles(enriched);
          }
        }

        // Fetch fundamentals
        const fundRes = await fetch(getApiUrl(`/api/fundamentals/${selectedTicker}`));
        if (fundRes.ok && isMounted) {
          const fundJson = await fundRes.json();
          setFundamentals(fundJson);
        }

        // Fetch news
        const newsRes = await fetch(getApiUrl(`/api/news/${selectedTicker}`));
        if (newsRes.ok && isMounted) {
          const newsJson = await newsRes.json();
          if (newsJson.artigos) {
            setNews(newsJson.artigos);
          }
        }
      } catch (err) {
        console.error(`Erro ao carregar dados de ${selectedTicker}:`, err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedTicker, timeframe]);

  // Available Sectors with counts
  const availableSectors = useMemo(() => {
    const counts: Record<string, number> = {};
    opportunities.forEach((op) => {
      const s = op.Setor || 'Outros';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [opportunities]);

  // Filtered Opportunities List
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((op) => {
      if (!selectedClasses.includes(op.Classe)) return false;
      if (selectedSector !== 'all' && (op.Setor || 'Outros') !== selectedSector) return false;
      if (op.Liquidez < minLiquidez) return false;
      if (filterEMA20 && (!op.EMA20 || typeof op.EMA20 !== 'number' || isNaN(op.EMA20) || op.Preco <= op.EMA20)) return false;
      if (filterEMA50 && (!op.EMA50 || typeof op.EMA50 !== 'number' || isNaN(op.EMA50) || op.Preco <= op.EMA50)) return false;
      if (filterEMA200 && (!op.EMA200 || typeof op.EMA200 !== 'number' || isNaN(op.EMA200) || op.Preco <= op.EMA200)) return false;
      return true;
    });
  }, [opportunities, selectedClasses, selectedSector, minLiquidez, filterEMA20, filterEMA50, filterEMA200]);

  // Selected Opportunity Object
  const selectedOpp = useMemo(() => {
    return opportunities.find((o) => o.Ticker === selectedTicker) || filteredOpportunities.find((o) => o.Ticker === selectedTicker) || filteredOpportunities[0] || null;
  }, [opportunities, filteredOpportunities, selectedTicker]);

  // Computed Indicators for Active Asset
  const fibonacci: FibonacciLevels = useMemo(() => {
    return calculateFibonacci(candles);
  }, [candles]);

  const tripleScreen: TripleScreenResult = useMemo(() => {
    return calculateTripleScreen(candles);
  }, [candles]);

  const minervini: MinerviniResult = useMemo(() => {
    return calculateMinervini(candles);
  }, [candles]);

  const flowResult: FlowResult = useMemo(() => {
    return calculateFlow(candles);
  }, [candles]);

  const mlPrediction: MLPredictionResult = useMemo(() => {
    return calculateMLPrediction(candles, selectedTicker || 'ATIVO', 5);
  }, [candles, selectedTicker]);

  const rlAgent: RLAgentResult = useMemo(() => {
    return calculateRLAgent(candles, selectedTicker || 'ATIVO');
  }, [candles, selectedTicker]);

  const backtestData: BacktestResult = useMemo(() => {
    return runScannerBacktest(candles);
  }, [candles]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Header */}
      <Header
        onRefresh={fetchScanner}
        isRefreshing={isScanning}
        lastUpdated={lastUpdated}
        dataSource={dataSource}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Scanner Filters */}
        <ScannerFilters
          selectedClasses={selectedClasses}
          onToggleClass={handleToggleClass}
          onSelectAllClasses={handleSelectAllClasses}
          selectedSector={selectedSector}
          setSelectedSector={setSelectedSector}
          availableSectors={availableSectors}
          filterEMA20={filterEMA20}
          setFilterEMA20={setFilterEMA20}
          filterEMA50={filterEMA50}
          setFilterEMA50={setFilterEMA50}
          filterEMA200={filterEMA200}
          setFilterEMA200={setFilterEMA200}
          minLiquidez={minLiquidez}
          setMinLiquidez={setMinLiquidez}
          showBacktests={showBacktests}
          setShowBacktests={setShowBacktests}
          isScanning={isScanning}
          onRefresh={fetchScanner}
          totalFiltered={filteredOpportunities.length}
          totalTotal={opportunities.length}
        />

        {/* Opportunities Table with Inline Expandable Chart & Analysis */}
        <OpportunitiesTable
          opportunities={filteredOpportunities}
          selectedTicker={selectedTicker}
          onSelectTicker={(t) => setSelectedTicker(t)}
          selectedSector={selectedSector}
          onSelectSector={setSelectedSector}
          availableSectors={availableSectors}
          detailContent={
            selectedOpp ? (
              <AssetDetailPanel
                selectedOpp={selectedOpp}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                candles={candles}
                fibonacci={fibonacci}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                tripleScreen={tripleScreen}
                minervini={minervini}
                flowResult={flowResult}
                mlPrediction={mlPrediction}
                rlAgent={rlAgent}
                backtestData={backtestData}
                fundamentals={fundamentals}
                news={news}
                onClose={() => setSelectedTicker(null)}
              />
            ) : null
          }
        />
      </main>

      {/* Footer & Regulatory / Educational Disclaimer */}
      <footer className="mt-12 border-t border-slate-800 bg-slate-900/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-2.5">
              <img
                src="/icon.svg"
                alt="Monitor Bolsa de Valores"
                className="w-6 h-6 rounded-lg border border-slate-700 bg-slate-950 p-0.5 flex-shrink-0"
              />
              <span className="font-semibold text-slate-200">Monitor da Bolsa de Valores</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 font-semibold">Swing Trade</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Scanner &amp; Análise Quantitativa</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="bg-slate-800/80 border border-slate-750 text-slate-300 px-2.5 py-1 rounded-lg font-medium text-[11px]">
                Versão 1.0.4
              </span>
              <button
                onClick={clearAppCacheAndReload}
                title="Limpar cache do navegador / WebView e recarregar dados novos"
                className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer transition"
              >
                Limpar Cache
              </button>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-400">
                © {new Date().getFullYear()} Monitor Bolsa de Valores. Todos os direitos reservados.
              </span>
            </div>
          </div>

          {/* ScienceBit Logomark Developer Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Desenvolvido por:</span>
              <a
                href="https://sciencebit.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition inline-flex items-center"
              >
                <img
                  src="/sciencebit-logo.svg"
                  alt="ScienceBit Computer"
                  className="h-7 w-auto object-contain"
                />
              </a>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Engenharia de Software, Soluções em Nuvem e Análise Quantitativa</span>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 text-[11px] leading-relaxed text-slate-400">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-750">
              <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span>⚠️ Aviso Legal, Direitos &amp; Declaração de Risco (Disclaimer)</span>
              </p>
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded">
                Finalidade Educacional
              </span>
            </div>
            <p>
              Este aplicativo e todas as suas análises, modelos estatísticos, projeções de aprendizado de máquina (Machine Learning), backtests e pontuações têm <strong>caráter estritamente educacional, analítico e informativo</strong>. Nenhuma informação apresentada constitui recomendação de compra, venda ou alocação de valores mobiliários, ações, BDRs, ETFs ou derivativos.
            </p>
            <p className="mt-1.5">
              <strong>Desenvolvimento &amp; Conteúdo:</strong> Desenvolvido e mantido para fins de pesquisa quantitativa e educação financeira independente sobre o mercado de capitais brasileiro.
            </p>
            <p className="mt-1.5">
              <strong>Isenção de Vínculo:</strong> Este é um software independente de análise quantitativa e educacional de mercado. Não possui qualquer afiliação, parceria, patrocínio ou vínculo institucional com a B3 S.A. – Brasil, Bolsa, Balcão, nem com quaisquer corretoras ou provedores de índices comerciais. Todas as marcas eventualmente citadas pertencem aos seus respectivos titulares e são mencionadas unicamente a título de referência contextual.
            </p>
            <p className="mt-1.5">
              <strong>Fontes de Dados &amp; Cotações:</strong> As informações e cotações de mercado são obtidas através de feeds públicos com fins educacionais e podem apresentar atraso regulamentar (delayed quotes). Rentabilidade passada não representa garantia de retorno futuro. Antes de tomar qualquer decisão financeira, avalie seus objetivos e consulte um profissional de investimentos credenciado junto à CVM/ANBIMA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
