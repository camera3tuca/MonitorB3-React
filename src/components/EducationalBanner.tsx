import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface EducationalBannerProps {
  onOpenModal: (tab?: 'visao-geral' | 'passo-a-passo' | 'indicadores' | 'gestao-risco' | 'faq') => void;
}

export const EducationalBanner: React.FC<EducationalBannerProps> = ({ onOpenModal }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('didactic_banner_expanded');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('didactic_banner_expanded', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-950/40 via-slate-850 to-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Title & Badge */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Como Operar com o Monitor: Guia Rápido de Swing Trade
              </h3>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Didático &amp; Prático
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Rastreie exaustão vendedora, valide confluências técnicas e opere com gestão de risco profissional.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            onClick={() => onOpenModal('passo-a-passo')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition cursor-pointer"
            title="Abrir o manual didático completo com todas as etapas e indicadores"
          >
            <GraduationCap className="w-4 h-4 text-blue-200" />
            <span>Aprender a Usar</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
          </button>

          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
            title={isExpanded ? 'Recolher resumo de dicas' : 'Expandir resumo de dicas'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">Recolher</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden sm:inline">Dicas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Quick Tips Grid */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-750/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200 text-xs">
          {/* Card 1 */}
          <div
            onClick={() => onOpenModal('indicadores')}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-750 hover:border-blue-500/40 p-3 rounded-xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-blue-400 font-bold mb-1.5">
              <Zap className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
              <span>1. Quedas &amp; Sobrevenda (IS &gt; 70)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Ativos com vários dias seguidos no vermelho ou com <strong>IS &gt; 70 (RSI &lt; 30)</strong> indicam que a pressão vendedora secou, abrindo espaço para repiques rápidos.
            </p>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => onOpenModal('indicadores')}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-750 hover:border-amber-500/40 p-3 rounded-xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1.5">
              <Target className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              <span>2. Suporte de Fibonacci 61.8%</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Clique no ativo para conferir o gráfico: retrações na <strong>Golden Zone de 61.8%</strong> representam o suporte matemático mais respeitado por grandes players institucionais.
            </p>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => onOpenModal('gestao-risco')}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-750 hover:border-emerald-500/40 p-3 rounded-xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              <span>3. Stop Loss Obrigatório &amp; Risco 1:2</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Posicione o Stop Loss abaixo da mínima recente e busque alvo no mínimo 2x maior nas médias móveis. Nunca arrisque mais de 1% a 2% do seu patrimônio por trade.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
