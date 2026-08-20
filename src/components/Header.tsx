import React, { useState, useEffect } from 'react';
import { TrendingDown, Clock, Info, ShieldCheck, ChevronDown, ChevronUp, BookOpen, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Header: React.FC = () => {
  const [horaBrasilia, setHoraBrasilia] = useState<string>('');
  const [guiaAberto, setGuiaAberto] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const str = now.toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setHoraBrasilia(str);
      } catch {
        setHoraBrasilia(new Date().toLocaleTimeString('pt-BR'));
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-inner">
            <TrendingDown className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                Monitor B3 <span className="text-blue-400 font-medium text-lg">Swing Trade Pro</span>
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Análise Técnica Avançada | Rastreamento de Oportunidades em Tempo Real
            </p>
          </div>
        </div>

        {/* Right Status Pill Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
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

          {/* Guide toggle button */}
          <button
            id="btn-toggle-guide"
            onClick={() => setGuiaAberto(!guiaAberto)}
            className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-blue-200 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guia de Indicadores</span>
            {guiaAberto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Guide */}
      <AnimatePresence>
        {guiaAberto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-700/60 overflow-hidden"
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
