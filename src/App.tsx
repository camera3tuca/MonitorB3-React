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
  Zap
} from 'lucide-react';

export const App: React.FC = () => {
  // Filters State
  const [selectedClasses, setSelectedClasses] = useState<AssetClass[]>(['Ação', 'BDR', 'ETF']);
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

  // Active Asset Analysis State
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [activeTab, setActiveTab] = useState<
    'grafico' | 'triplescreen' | 'minervini' | 'flow' | 'ml' | 'rl' | 'backtest' | 'fundamentalista' | 'noticias'
  >('grafico');

  const [candles, setCandles] = useState<HistoricalCandle[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);

  // Toggle Asset Class filter
  const handleToggleClass = (c: AssetClass) => {
    if (selectedClasses.includes(c)) {
      if (selectedClasses.length > 1) {
        setSelectedClasses(selectedClasses.filter((item) => item !== c));
      }
    } else {
      setSelectedClasses([...selectedClasses, c]);
    }
  };

  // Fetch opportunities scanner
  const fetchScanner = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classes: selectedClasses })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setOpportunities(json.data);
          if (!selectedTicker && json.data.length > 0) {
            setSelectedTicker(json.data[0].Ticker);
          }
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
  }, []);

  // Fetch selected ticker historical candles and details
  useEffect(() => {
    if (!selectedTicker) return;

    let isMounted = true;
    setIsLoadingHistory(true);

    const loadData = async () => {
      try {
        // Fetch historical candles
        const histRes = await fetch(`/api/history/${selectedTicker}?timeframe=${timeframe}&range=1y`);
        if (histRes.ok && isMounted) {
          const histJson = await histRes.json();
          if (histJson.candles && Array.isArray(histJson.candles)) {
            const enriched = enrichCandles(histJson.candles);
            setCandles(enriched);
          }
        }

        // Fetch fundamentals
        const fundRes = await fetch(`/api/fundamentals/${selectedTicker}`);
        if (fundRes.ok && isMounted) {
          const fundJson = await fundRes.json();
          setFundamentals(fundJson);
        }

        // Fetch news
        const newsRes = await fetch(`/api/news/${selectedTicker}`);
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
    return filteredOpportunities.find((o) => o.Ticker === selectedTicker) || filteredOpportunities[0] || null;
  }, [filteredOpportunities, selectedTicker]);

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
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Scanner Filters */}
        <ScannerFilters
          selectedClasses={selectedClasses}
          onToggleClass={handleToggleClass}
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
      <footer className="mt-12 border-t border-slate-850 bg-slate-900/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-300">Monitor B3 - Swing Trade Pro</span>
              <span>•</span>
              <span>Scanner &amp; Análise Quantitativa</span>
            </div>
            <div className="text-slate-400">
              © {new Date().getFullYear()} Monitor B3. Todos os direitos reservados.
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 text-[11px] leading-relaxed text-slate-400">
            <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <span>⚠️ Aviso Legal, Direitos &amp; Declaração de Risco (Disclaimer)</span>
            </p>
            <p>
              Este aplicativo e todas as suas análises, modelos estatísticos, projeções de aprendizado de máquina (Machine Learning), backtests e pontuações têm <strong>caráter estritamente educacional, analítico e informativo</strong>. Nenhuma informação apresentada constitui recomendação de compra, venda ou alocação de valores mobiliários, ações, BDRs, ETFs ou derivativos.
            </p>
            <p className="mt-1">
              <strong>Isenção de Vínculo:</strong> Este é um software independente de análise quantitativa e educacional de mercado. Não possui qualquer afiliação, parceria, patrocínio ou vínculo institucional com a B3 S.A. – Brasil, Bolsa, Balcão, nem com quaisquer corretoras ou provedores de índices comerciais. Todas as marcas eventualmente citadas pertencem aos seus respectivos titulares e são mencionadas unicamente a título de referência contextual.
            </p>
            <p className="mt-1">
              <strong>Fontes de Dados &amp; Cotações:</strong> As informações e cotações de mercado são obtidas através de feeds públicos com fins educacionais e podem apresentar atraso regulamentar (delayed quotes). Rentabilidade passada não representa garantia de retorno futuro. Antes de tomar qualquer decisão financeira, avalie seus objetivos e consulte um profissional de investimentos credenciado junto à CVM/ANBIMA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
