import React, { useState, useEffect } from 'react';
import { TrendingDown, Clock, Info, ShieldCheck, ChevronDown, ChevronUp, BookOpen, Sparkles, Globe, ExternalLink, RefreshCw, GraduationCap, Download, Smartphone, Star } from 'lucide-react';

interface MarketStatus {
  status: 'aberta' | 'pre-abertura' | 'leilao' | 'fechada';
  label: string;
  sublabel: string;
  badgeClass: string;
  dotClass: string;
}

export interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
  dataSource?: 'server' | 'direct' | 'cache';
  onOpenEducationalGuide?: (tab?: 'visao-geral' | 'passo-a-passo' | 'indicadores' | 'gestao-risco' | 'faq') => void;
  onOpenInstallModal?: () => void;
  onRatePlayStore?: () => void;
  isInstallable?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  lastUpdated,
  dataSource = 'server',
  onOpenEducationalGuide,
  onOpenInstallModal,
  onRatePlayStore,
  isInstallable = false
}) => {
  const [horaBrasilia, setHoraBrasilia] = useState<string>('');
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({
    status: 'fechada',
    label: 'Bolsa Fechada',
    sublabel: 'Abre às 10:00',
    badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    dotClass: 'bg-rose-500',
  });
  const [guiaAberto, setGuiaAberto] = useState<boolean>(false);

  useEffect(() => {
    const updateTimeAndMarket = () => {
      try {
        const now = new Date();
        const str = now.toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setHoraBrasilia(str);

        // Get Brasilia date/hours
        const brasiliaDateStr = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
        const brasiliaDate = new Date(brasiliaDateStr);
        const dayOfWeek = brasiliaDate.getDay(); // 0 = Sun, 6 = Sat
        const hours = brasiliaDate.getHours();
        const minutes = brasiliaDate.getMinutes();
        const totalMinutes = hours * 60 + minutes;

        // B3 Market Hours Logic (Brasília):
        // Weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          setMarketStatus({
            status: 'fechada',
            label: 'Bolsa Fechada',
            sublabel: 'Fim de semana (Abre seg 10h)',
            badgeClass: 'bg-slate-700/50 border-slate-600/60 text-slate-300',
            dotClass: 'bg-slate-500',
          });
        } else if (totalMinutes >= 600 && totalMinutes < 1015) {
          // 10:00 (600 min) to 16:55 (1015 min) -> Pregão Regular
          setMarketStatus({
            status: 'aberta',
            label: 'Bolsa Aberta',
            sublabel: 'Pregão B3 ao vivo (10h - 17h)',
            badgeClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
            dotClass: 'bg-emerald-400 animate-pulse',
          });
        } else if (totalMinutes >= 585 && totalMinutes < 600) {
          // 09:45 to 10:00 -> Pré-Abertura
          setMarketStatus({
            status: 'pre-abertura',
            label: 'Pré-Abertura',
            sublabel: 'Leilão inicial de abertura',
            badgeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
            dotClass: 'bg-amber-400 animate-ping',
          });
        } else if (totalMinutes >= 1015 && totalMinutes < 1020) {
          // 16:55 to 17:00 -> Leilão de fechamento
          setMarketStatus({
            status: 'leilao',
            label: 'Leilão Fechamento',
            sublabel: 'Call de fechamento das ações',
            badgeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
            dotClass: 'bg-amber-400',
          });
        } else if (totalMinutes >= 1020 && totalMinutes < 1080) {
          // 17:00 to 18:00 -> After-Market
          setMarketStatus({
            status: 'leilao',
            label: 'After-Market B3',
            sublabel: 'Pós-mercado até 18:00',
            badgeClass: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
            dotClass: 'bg-blue-400',
          });
        } else {
          // Fechada (Durante a noite / madrugada)
          const info = totalMinutes < 585 ? 'Abre às 10:00' : 'Reabre amanhã às 10:00';
          setMarketStatus({
            status: 'fechada',
            label: 'Bolsa Fechada',
            sublabel: info,
            badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
            dotClass: 'bg-rose-400',
          });
        }
      } catch {
        setHoraBrasilia(new Date().toLocaleTimeString('pt-BR'));
      }
    };
    updateTimeAndMarket();
    const interval = setInterval(updateTimeAndMarket, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Brand */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/icon.svg"
            alt="Monitor da Bolsa de Valores Logo"
            className="w-12 h-12 md:w-13 md:h-13 rounded-xl shadow-lg border border-slate-700/80 bg-slate-900 object-cover flex-shrink-0"
          />
          <div className="flex flex-col justify-center">
            {/* ScienceBit Logomark in Header */}
            <div className="mb-1 flex items-center">
              <a
                href="https://sciencebit.com.br"
                target="_blank"
                rel="noopener noreferrer"
                title="ScienceBit Computer - sciencebit.com.br"
                className="inline-flex items-center hover:opacity-90 transition group"
              >
                <img
                  src="/sciencebit-logo.svg"
                  alt="ScienceBit Computer"
                  className="h-5 sm:h-6 w-auto object-contain filter drop-shadow-sm group-hover:brightness-110 transition"
                />
              </a>
            </div>

            {/* Main App Title */}
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight leading-tight">
                Monitor da Bolsa de Valores
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                Ao Vivo
              </span>
            </div>

            {/* Swing Trade phrase directly below Monitor da Bolsa de Valores */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm font-bold text-blue-400 tracking-wide uppercase">
                Swing Trade
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <p className="text-xs text-slate-400 font-medium hidden sm:inline">
                Análise Técnica Avançada &amp; Rastreamento em Tempo Real
              </p>
            </div>
          </div>
        </div>

        {/* Right Status Pill Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Market Status (Bolsa Aberta / Fechada) */}
          <div
            id="market-status-badge"
            title={`Status B3: ${marketStatus.label} - ${marketStatus.sublabel}`}
            className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg font-medium shadow-sm transition ${marketStatus.badgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${marketStatus.dotClass}`}></span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 leading-tight">
              <span className="font-bold">{marketStatus.label}</span>
              <span className="text-[10px] opacity-75 font-normal">({marketStatus.sublabel})</span>
            </div>
          </div>

          {/* Horário de Brasília */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-emerald-400 font-semibold">{horaBrasilia || '--:--:--'}</span>
            <span className="text-[10px] text-slate-500">(Brasília)</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Estratégia: <strong className="text-white">Reversão Sobrevenda</strong></span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Timeframe: <strong className="text-white">Diário / 6M</strong></span>
          </div>

          {/* Manual Refresh Button & Last Updated Timestamp */}
          {onRefresh && (
            <div className="flex items-center gap-1.5">
              <button
                id="btn-manual-refresh"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Atualizar cotações e scanner da B3 agora"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-200' : ''}`} />
                <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
              </button>
              {lastUpdated && (
                <div
                  title={`Fonte de dados: ${dataSource === 'server' ? 'Servidor Nuvem B3' : dataSource === 'direct' ? 'Feed B3 Direto' : 'Cache Local Offline'}`}
                  className="hidden sm:flex items-center gap-1 bg-slate-900/80 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-slate-300 text-[11px]"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-400">Atualizado:</span>
                  <strong className="font-mono text-white">
                    {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Install on Google Play Button */}
          {onOpenInstallModal && (
            <button
              id="btn-open-install-modal"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/80 hover:border-emerald-500/50 active:scale-95 font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer text-xs"
              title="Instalar Aplicativo Oficial no Google Play Store"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M3.6 1.48L13.9 12 3.6 22.52c-.37-.36-.6-.88-.6-1.52V3c0-.64.23-1.16.6-1.52z" fill="#00C1A6"/>
                <path d="M17.43 8.47L4.62 1.15C4.24.94 3.88.94 3.6 1.48l10.3 10.52 3.53-3.53z" fill="#0086F0"/>
                <path d="M17.43 15.53l-3.53-3.53L3.6 22.52c.28.54.64.54 1.02.33l12.81-7.32z" fill="#FF3333"/>
                <path d="M21.57 10.12l-4.14-2.37-3.53 3.53 3.53 3.53 4.14-2.37c1.17-.67 1.17-1.78 0-2.45z" fill="#FFBA00"/>
              </svg>
              <span className="hidden sm:inline">Google Play</span>
              <span className="sm:hidden">Play Store</span>
            </button>
          )}

          {/* Rate on Google Play Button */}
          <button
            id="btn-rate-playstore"
            onClick={onRatePlayStore || (() => window.open('https://play.google.com/store/apps/details?id=com.sciencebit.monitorb3', '_blank'))}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400/50 active:scale-95 font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer text-xs"
            title="Avaliar o Aplicativo com 5 Estrelas no Google Play Store"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
            <span className="hidden sm:inline">Avaliar App</span>
            <span className="sm:hidden">Avaliar</span>
          </button>

          {/* WhatsApp Support Button */}
          <a
            id="btn-header-whatsapp"
            href="https://wa.me/5562999755774?text=Ol%C3%A1!%20Vim%20pelo%20aplicativo%20Monitor%20Bolsa%20de%20Valores%20e%20gostaria%20de%20tirar%20uma%20d%C3%BAvida."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 active:scale-95 font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer text-xs"
            title="Falar no WhatsApp: +55 (62) 99975-5774"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.11 7.44C8.95 7.44 8.68 7.5 8.46 7.74C8.23 7.99 7.6 8.58 7.6 9.78C7.6 10.98 8.48 12.14 8.6 12.3C8.72 12.46 10.33 14.94 12.8 16C13.39 16.26 13.84 16.41 14.2 16.52C14.79 16.71 15.33 16.68 15.75 16.62C16.22 16.55 17.2 16.03 17.41 15.45C17.61 14.86 17.61 14.36 17.55 14.25C17.49 14.15 17.34 14.09 17.11 13.98C16.89 13.86 15.79 13.32 15.59 13.25C15.38 13.17 15.23 13.14 15.08 13.36C14.93 13.59 14.5 14.09 14.37 14.24C14.24 14.39 14.11 14.41 13.89 14.3C13.66 14.18 12.93 13.94 12.07 13.17C11.4 12.57 10.95 11.83 10.82 11.61C10.69 11.39 10.81 11.27 10.92 11.16C11.02 11.06 11.15 10.89 11.26 10.76C11.37 10.64 11.41 10.55 11.48 10.4C11.56 10.26 11.52 10.13 11.46 10.02C11.41 9.9 10.95 8.78 10.76 8.32C10.58 7.87 10.39 7.93 10.25 7.92H9.81C9.66 7.92 9.43 7.98 9.24 8.18"/>
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          {/* Didactic Guide Button */}
          <button
            id="btn-open-educational-guide"
            onClick={() => onOpenEducationalGuide ? onOpenEducationalGuide('visao-geral') : setGuiaAberto(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow-blue-500/25 transition cursor-pointer text-xs"
            title="Abrir o Manual Didático e Guia Completo do Investidor"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-100" />
            <span className="hidden sm:inline">Aprenda a Usar</span>
            <span className="sm:hidden">Aprenda</span>
          </button>

          {/* Quick Guide toggle button */}
          <button
            id="btn-toggle-guide"
            onClick={() => setGuiaAberto(!guiaAberto)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs"
            title="Exibir resumo rápido de fórmulas e indicadores"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Resumo</span>
            {guiaAberto ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
          </button>

          {/* App Brand Badge with Logo & Version */}
          <div
            id="brand-logo-badge"
            title="Monitor Bolsa de Valores - Versão 1.0.5"
            className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300 shadow-sm"
          >
            <img src="/icon.svg" alt="Monitor Bolsa de Valores" className="w-4 h-4 rounded flex-shrink-0" />
            <span className="font-semibold text-white tracking-wide">Monitor Bolsa</span>
            <span className="bg-blue-500/25 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
              v1.0.5
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Guide */}
      {guiaAberto && (
        <div
          className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-700/60 overflow-hidden transition-all duration-300"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pb-2 text-xs">
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Índice de Sobrevenda (IS)
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Média harmônica combinada do RSI(14) e Estocástico(14). Valores <strong className="text-emerald-400">&gt; 70</strong> indicam exaustão vendedora e potencial repique.
              </p>
            </div>

            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                RSI &amp; Estocástico
              </h4>
              <p className="text-slate-300 leading-relaxed">
                RSI &lt; 30 e Estocástico &lt; 20 confirmam sobrevenda técnica extrema. Cruzamentos para cima geram gatilho imediato de compra.
              </p>
            </div>

            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Fibonacci (61.8% Golden Zone)
              </h4>
              <p className="text-slate-300 leading-relaxed">
                A retração de 61.8% representa a mais forte região de suporte matemático para continuação da tendência primária.
              </p>
            </div>

            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-purple-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                Triple Screen (Alexander Elder)
              </h4>
              <p className="text-slate-300 leading-relaxed">
                1ª Tela (Maré: EMA13), 2ª Tela (Onda: EFI2 oscilador) e 3ª Tela (Execução: Buy Stop no topo anterior).
              </p>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-400 px-1">
            <span>Metodologias quantitativas aplicadas aos ativos da B3 (Ações, BDRs, ETFs e FIIs).</span>
            {onOpenEducationalGuide && (
              <button
                onClick={() => onOpenEducationalGuide('passo-a-passo')}
                className="inline-flex items-center gap-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer self-start sm:self-auto"
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
                <span>Abrir Manual Didático Completo (5 Etapas &amp; Gestão de Risco)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
