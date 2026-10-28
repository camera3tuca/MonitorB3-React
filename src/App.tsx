import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ScannerFilters } from './components/ScannerFilters';
import { OpportunitiesTable } from './components/OpportunitiesTable';
import { AssetDetailPanel, TabType } from './components/AssetDetailPanel';
import { EducationalModal } from './components/EducationalModal';
import { EducationalBanner } from './components/EducationalBanner';
import { InstallAppModal } from './components/InstallAppModal';
import { usePWAInstall } from './hooks/usePWAInstall';

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

  // PWA Installation Hook
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isInAppBrowser,
    isInstallModalOpen,
    setIsInstallModalOpen,
    promptInstall,
  } = usePWAInstall();

  // Educational Guide State
  const [isEducationalModalOpen, setIsEducationalModalOpen] = useState<boolean>(false);
  const [educationalInitialTab, setEducationalInitialTab] = useState<
    'visao-geral' | 'passo-a-passo' | 'indicadores' | 'gestao-risco' | 'faq'
  >('visao-geral');

  const handleOpenEducationalGuide = (
    tab?: 'visao-geral' | 'passo-a-passo' | 'indicadores' | 'gestao-risco' | 'faq'
  ) => {
    setEducationalInitialTab(tab || 'visao-geral');
    setIsEducationalModalOpen(true);
  };

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
        onOpenEducationalGuide={handleOpenEducationalGuide}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onRatePlayStore={() => setIsInstallModalOpen(true)}
        isInstallable={isInstallable}
      />

      {/* Mobile Play Store Quick Notification Banner */}
      {!isInstalled && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-emerald-500/30 px-4 py-2 sm:hidden flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2 overflow-hidden">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M3.6 1.48L13.9 12 3.6 22.52c-.37-.36-.6-.88-.6-1.52V3c0-.64.23-1.16.6-1.52z" fill="#00C1A6"/>
              <path d="M17.43 8.47L4.62 1.15C4.24.94 3.88.94 3.6 1.48l10.3 10.52 3.53-3.53z" fill="#0086F0"/>
              <path d="M17.43 15.53l-3.53-3.53L3.6 22.52c.28.54.64.54 1.02.33l12.81-7.32z" fill="#FF3333"/>
              <path d="M21.57 10.12l-4.14-2.37-3.53 3.53 3.53 3.53 4.14-2.37c1.17-.67 1.17-1.78 0-2.45z" fill="#FFBA00"/>
            </svg>
            <span className="text-slate-200 truncate font-medium">
              Disponível no Google Play Store
            </span>
          </div>
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-3 py-1 rounded-lg text-xs shadow transition whitespace-nowrap ml-2 flex-shrink-0"
          >
            Instalar
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Educational Didactic Banner */}
        <EducationalBanner onOpenModal={handleOpenEducationalGuide} />

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
          onOpenEducationalGuide={handleOpenEducationalGuide}
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

      {/* Educational Guide Modal */}
      <EducationalModal
        isOpen={isEducationalModalOpen}
        onClose={() => setIsEducationalModalOpen(false)}
        initialTab={educationalInitialTab}
      />

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        defaultPackageId="com.sciencebit.monitorb3"
      />

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
              <button
                onClick={() => setIsInstallModalOpen(true)}
                title="Instalar aplicativo oficial no Google Play Store"
                className="text-emerald-400 hover:text-emerald-300 underline text-[11px] font-semibold cursor-pointer transition flex items-center gap-1"
              >
                <span>Google Play Store</span>
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => setIsInstallModalOpen(true)}
                title="Avaliar o aplicativo com 5 estrelas no Google Play"
                className="text-amber-400 hover:text-amber-300 underline text-[11px] font-semibold cursor-pointer transition flex items-center gap-1"
              >
                <span>⭐ Avaliar App</span>
              </button>
              <span className="text-slate-600">•</span>
              <a
                href="https://wa.me/5562999755774?text=Ol%C3%A1!%20Vim%20pelo%20aplicativo%20Monitor%20Bolsa%20de%20Valores."
                target="_blank"
                rel="noopener noreferrer"
                title="Falar no WhatsApp: +55 (62) 99975-5774"
                className="text-emerald-400 hover:text-emerald-300 underline text-[11px] font-semibold cursor-pointer transition flex items-center gap-1"
              >
                <span>💬 WhatsApp: (62) 99975-5774</span>
              </a>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => handleOpenEducationalGuide('visao-geral')}
                title="Abrir o manual didático completo para aprender a operar Swing Trade"
                className="text-blue-400 hover:text-blue-300 underline text-[11px] font-semibold cursor-pointer transition"
              >
                Guia Didático
              </button>
              <span className="text-slate-600">•</span>
              <span className="bg-slate-800/80 border border-slate-750 text-slate-300 px-2.5 py-1 rounded-lg font-medium text-[11px]">
                Versão 1.0.5
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
                title="ScienceBit Computer - sciencebit.com.br"
                className="hover:opacity-90 transition inline-flex items-center group"
              >
                <img
                  src="/sciencebit-logo.svg"
                  alt="ScienceBit Computer"
                  className="h-7 sm:h-8 w-auto object-contain filter drop-shadow group-hover:brightness-110 transition"
                />
              </a>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Engenharia de Software • Cloud Run • Streamlit &amp; IoT</span>
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

      {/* Floating WhatsApp Support Button */}
      <a
        id="floating-whatsapp-btn"
        href="https://wa.me/5562999755774?text=Ol%C3%A1!%20Vim%20pelo%20aplicativo%20Monitor%20Bolsa%20de%20Valores%20e%20gostaria%20de%20tirar%20uma%20d%C3%BAvida."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        title="Falar no WhatsApp: +55 (62) 99975-5774"
        className="fixed bottom-5 right-5 z-40 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white p-3 sm:px-4 sm:py-2.5 rounded-full shadow-xl shadow-emerald-950/80 flex items-center gap-2 border border-emerald-300/40 transition-all hover:shadow-emerald-500/40 cursor-pointer group"
      >
        <svg className="w-6 h-6 fill-current flex-shrink-0" viewBox="0 0 24 24">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.11 7.44C8.95 7.44 8.68 7.5 8.46 7.74C8.23 7.99 7.6 8.58 7.6 9.78C7.6 10.98 8.48 12.14 8.6 12.3C8.72 12.46 10.33 14.94 12.8 16C13.39 16.26 13.84 16.41 14.2 16.52C14.79 16.71 15.33 16.68 15.75 16.62C16.22 16.55 17.2 16.03 17.41 15.45C17.61 14.86 17.61 14.36 17.55 14.25C17.49 14.15 17.34 14.09 17.11 13.98C16.89 13.86 15.79 13.32 15.59 13.25C15.38 13.17 15.23 13.14 15.08 13.36C14.93 13.59 14.5 14.09 14.37 14.24C14.24 14.39 14.11 14.41 13.89 14.3C13.66 14.18 12.93 13.94 12.07 13.17C11.4 12.57 10.95 11.83 10.82 11.61C10.69 11.39 10.81 11.27 10.92 11.16C11.02 11.06 11.15 10.89 11.26 10.76C11.37 10.64 11.41 10.55 11.48 10.4C11.56 10.26 11.52 10.13 11.46 10.02C11.41 9.9 10.95 8.78 10.76 8.32C10.58 7.87 10.39 7.93 10.25 7.92H9.81C9.66 7.92 9.43 7.98 9.24 8.18"/>
        </svg>
        <span className="hidden sm:inline font-bold text-xs text-white">WhatsApp</span>
      </a>
    </div>
  );
};
