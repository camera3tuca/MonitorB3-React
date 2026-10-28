import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  HelpCircle,
  CheckCircle2,
  Target,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Compass,
  Activity,
  Sparkles,
  DollarSign,
  Lightbulb,
  X,
  ChevronRight,
  ArrowRight,
  Sliders,
  BarChart2,
  Award,
  Zap,
  Info
} from 'lucide-react';

interface EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'visao-geral' | 'passo-a-passo' | 'indicadores' | 'gestao-risco' | 'faq';
}

type TabKey = 'visao-geral' | 'passo-a-passo' | 'indicadores' | 'gestao-risco' | 'faq';

export const EducationalModal: React.FC<EducationalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'visao-geral'
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-850 via-slate-800 to-slate-850 border-b border-slate-700/80 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <GraduationCap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Guia Didático do Investidor
                </h2>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Manual de Swing Trade
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aprenda a interpretar os sinais, rastrear oportunidades e gerenciar suas operações com segurança.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Fechar guia didático"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('visao-geral')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
              activeTab === 'visao-geral'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('passo-a-passo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
              activeTab === 'passo-a-passo'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>2. Passo a Passo</span>
          </button>

          <button
            onClick={() => setActiveTab('indicadores')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
              activeTab === 'indicadores'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. Indicadores &amp; Métricas</span>
          </button>

          <button
            onClick={() => setActiveTab('gestao-risco')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
              activeTab === 'gestao-risco'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Gestão de Risco</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>5. Dúvidas Frequentes</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm leading-relaxed text-slate-300">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'visao-geral' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  O que é o Monitor da Bolsa de Valores?
                </h3>
                <p>
                  O aplicativo é um <strong>scanner quantitativo de mercado em tempo real</strong> focado na modalidade de <strong>Swing Trade</strong> na B3 (Bolsa de Valores do Brasil). Ele monitora centenas de ações, BDRs, ETFs e Fundos Imobiliários (FIIs) para identificar ativos que sofreram <strong>quedas expressivas ou consecutivas</strong> e atingiram <strong>zonas de sobrevenda técnica extrema</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-850 border border-slate-700/70 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <TrendingUp className="w-4 h-4" />
                    O que é Swing Trade?
                  </div>
                  <p className="text-xs text-slate-300">
                    Ao contrário do Day Trade (que dura minutos ou horas e encerra no mesmo dia), o Swing Trade busca capturar <strong>movimentos de tendência e repiques que duram de 2 dias a algumas semanas</strong>.
                  </p>
                  <ul className="text-xs space-y-1.5 text-slate-400 pt-1">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Menor estresse e menor custo de corretagem e taxas.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Análise baseada em gráficos diários (1D) e semanais.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Possibilidade de operar mesmo trabalhando em outra profissão.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-850 border border-slate-700/70 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Activity className="w-4 h-4" />
                    Por que buscar ativos em queda?
                  </div>
                  <p className="text-xs text-slate-300">
                    O mercado financeiro funciona como um pêndulo elástico: movimentos de queda exagerada criam <strong>assimetria favorável</strong> para compradores pacientes.
                  </p>
                  <ul className="text-xs space-y-1.5 text-slate-400 pt-1">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Exaustão Vendedora:</strong> Quando todos que queriam vender já venderam, o preço tende a repicar com força.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Risco Controlado:</strong> Comprar próximo de suportes históricos permite colocar um Stop Loss curto e bem definido.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Alvo Amplo:</strong> O potencial de retorno até as médias móveis costuma ser 2x a 3x maior que o risco assumido.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Strategy core rules */}
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4">
                <h4 className="font-bold text-blue-300 text-xs sm:text-sm mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  O Pilar da Estratégia: Confluência Técnica
                </h4>
                <p className="text-xs text-slate-300">
                  Nunca compre apenas porque uma ação caiu. A verdadeira oportunidade surge quando há <strong>confluência</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="font-bold text-blue-400 block mb-1">1. Sobrevenda Extrema</span>
                    <span className="text-slate-400">RSI &lt; 30 ou Índice de Sobrevenda (IS) &gt; 70.</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="font-bold text-amber-400 block mb-1">2. Suporte Matemático</span>
                    <span className="text-slate-400">Preço testando Fibonacci 61.8% ou média móvel longa.</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="font-bold text-emerald-400 block mb-1">3. Gatilho de Entrada</span>
                    <span className="text-slate-400">Candle de reversão (martelo) ou rompimento da máxima anterior.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASSO A PASSO */}
          {activeTab === 'passo-a-passo' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                Siga este <strong>roteiro prático de 5 etapas</strong> em cada pregão para selecionar seus trades com disciplina profissional:
              </div>

              {/* Step 1 */}
              <div className="flex gap-3.5 bg-slate-850 p-4 rounded-xl border border-slate-700/70">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                  1
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-white text-sm">Filtre a Classe e Tendência Desejada</h4>
                  <p className="text-xs text-slate-300">
                    Use a barra superior de filtros para escolher a categoria: <strong>Ação, BDR, ETF ou FII</strong>. Você pode clicar em uma classe para isolá-la ou selecionar todas.
                  </p>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400">
                    <strong className="text-amber-400">Dica de Mestre:</strong> Ative o filtro <span className="text-white font-mono">&gt; EMA 200</span>. Isso seleciona apenas ativos que estão em <em>tendência primária de alta</em> no longo prazo e estão apenas fazendo uma correção saudável (Pullback). Essa é a configuração de maior taxa de acerto do Swing Trade.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3.5 bg-slate-850 p-4 rounded-xl border border-slate-700/70">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                  2
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-white text-sm">Examine a Tabela de Oportunidades</h4>
                  <p className="text-xs text-slate-300">
                    A tabela lista os ativos em ordem de prioridade técnica. Observe:
                  </p>
                  <ul className="text-xs space-y-1 text-slate-400 list-disc list-inside">
                    <li><strong className="text-white">Queda do Dia:</strong> percentual de desvalorização no pregão.</li>
                    <li><strong className="text-white">I.S. (Índice de Sobrevenda):</strong> acima de 70 indica alerta máximo de repique iminente.</li>
                    <li><strong className="text-white">Liq. (Liquidez Real):</strong> prefira ativos com nota acima de 5 para garantir facilidade de entrada e saída.</li>
                    <li><strong className="text-white">Potencial:</strong> classificação automática do algoritmo (Alta ou Muito Alta).</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3.5 bg-slate-850 p-4 rounded-xl border border-slate-700/70">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                  3
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-white text-sm">Clique no Ativo para Abrir o Painel Completo</h4>
                  <p className="text-xs text-slate-300">
                    Ao clicar em qualquer linha da tabela, abre-se logo abaixo o painel detalhado de inteligência:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                      <span className="text-blue-400 font-bold block">Gráfico + Fibo</span>
                      <span className="text-slate-400">Verifique a retração 61.8%</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                      <span className="text-purple-400 font-bold block">Triple Screen</span>
                      <span className="text-slate-400">Sistema Alexander Elder</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                      <span className="text-emerald-400 font-bold block">Minervini</span>
                      <span className="text-slate-400">Template de Força Relativa</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                      <span className="text-amber-400 font-bold block">IA &amp; Machine Learning</span>
                      <span className="text-slate-400">Projeção probabilística de D+5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3.5 bg-slate-850 p-4 rounded-xl border border-slate-700/70">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                  4
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-white text-sm">Trace seu Plano: Entrada, Stop Loss e Alvo</h4>
                  <p className="text-xs text-slate-300">
                    Nunca entre em uma operação sem ter os 3 números anotados antes de abrir a corretora:
                  </p>
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                    <p><span className="text-blue-400 font-bold">🎯 Ponto de Entrada:</span> no rompimento da máxima do dia de sobrevenda (Buy Stop) ou no fechamento confirmando candle de alta.</p>
                    <p><span className="text-rose-400 font-bold">🛑 Stop Loss (Proteção):</span> colocado logo abaixo da mínima do movimento de queda (ex: 1% abaixo do suporte de Fibonacci ou mínima recente).</p>
                    <p><span className="text-emerald-400 font-bold">🏁 Alvo de Lucro (Take Profit):</span> teste da Média Móvel EMA 20 ou EMA 50, garantindo relação ganho/perda de no mínimo 2 para 1.</p>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-3.5 bg-slate-850 p-4 rounded-xl border border-slate-700/70">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                  5
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-white text-sm">Gerencie a Posição na Sua Corretora</h4>
                  <p className="text-xs text-slate-300">
                    Abra seu Home Broker ou aplicativo de corretora (ex: Toro, Clear, Rico, XP, BTG, Inter) e execute a ordem com a quantidade calculada para seu tamanho de capital.
                  </p>
                  <p className="text-xs text-slate-400">
                    Quando o ativo subir 1x o tamanho do seu risco, realize um lucro parcial (venda metade) e mova seu Stop Loss para o preço de entrada (Breakeven). Assim a operação fica com <strong>risco zero</strong>!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INDICADORES E MÉTRICAS */}
          {activeTab === 'indicadores' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-slate-300">
                Entenda a lógica matemática por trás dos principais indicadores que alimentam os algoritmos do aplicativo:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* IS */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-blue-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      Índice de Sobrevenda (IS)
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">0 a 100</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Média harmônica combinada de <strong>RSI(14)</strong> e <strong>Estocástico(14)</strong>.
                  </p>
                  <ul className="text-xs space-y-1 text-slate-400 pt-1">
                    <li><strong className="text-emerald-400">&gt; 70:</strong> Sobrevenda alta. Vendedores exaustos.</li>
                    <li><strong className="text-emerald-300">&gt; 80:</strong> Sobrevenda extrema. Alta probabilidade de repique técnico.</li>
                    <li><strong className="text-slate-400">&lt; 50:</strong> Mercado neutro ou em alta.</li>
                  </ul>
                </div>

                {/* RSI */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      RSI / IFR (Índice de Força Relativa)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Período 14</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Mede a velocidade e a magnitude dos movimentos direcionais de preço.
                  </p>
                  <ul className="text-xs space-y-1 text-slate-400 pt-1">
                    <li><strong className="text-rose-400">&lt; 30:</strong> Ativo sobrevendido.</li>
                    <li><strong className="text-rose-300">&lt; 20:</strong> Nível de sobrevenda raro na B3, excelente para repique.</li>
                    <li><strong className="text-slate-400">&gt; 70:</strong> Sobrecomprado (evitar novas compras).</li>
                  </ul>
                </div>

                {/* Fibonacci */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      Fibonacci (Golden Zone 61.8%)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">Retração de Ouro</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    A retração de 61.8% de Fibonacci é o nível matemático de maior defesa institucional. Ativos que recuam até 61.8% e mostram candle de reversão frequentemente retomam a pernada de alta.
                  </p>
                </div>

                {/* Triple Screen */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      <Compass className="w-4 h-4" />
                      Triple Screen (Alexander Elder)
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">3 Telas</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Sistema consagrado mundialmente:
                  </p>
                  <ul className="text-xs space-y-1 text-slate-400 pt-1">
                    <li><strong>1ª Tela (Maré):</strong> Tendência maior pela EMA 13.</li>
                    <li><strong>2ª Tela (Onda):</strong> Força dos ursos pelo oscilador EFI(2).</li>
                    <li><strong>3ª Tela (Gatilho):</strong> Buy Stop acionado no rompimento.</li>
                  </ul>
                </div>

                {/* Minervini */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-cyan-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Trend Template de Mark Minervini
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">Estágio 2</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Verifica se o papel atende aos critérios do campeão de trading Mark Minervini: alinhamento das médias móveis EMA 50, EMA 150 e EMA 200 para garantir que o papel tem saúde técnica estrutural.
                  </p>
                </div>

                {/* Liquidez Real */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Liquidez Real Executada (Liq 1-10)
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Escala 1 a 10</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Avalia o volume financeiro real negociado no dia. Evita que você compre ativos com book vazio, garantindo facilidade para montar e liquidar sua posição no preço de mercado sem perdas ocultas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GESTÃO DE RISCO */}
          {activeTab === 'gestao-risco' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-rose-300 text-sm">A Regra Fundamental: Sobrevivência em Primeiro Lugar</h4>
                  <p className="text-xs text-slate-300">
                    No mercado de ações, os melhores traders do mundo erram entre 40% e 50% das operações. O segredo da consistência matemática é simples: <strong>ganhar muito quando acertar, e perder pouco quando errar</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Regra do 1% a 2% de Risco Máximo
                  </h4>
                  <p className="text-xs text-slate-300">
                    Nunca arrisque mais do que <strong>1% a 2% do seu capital total</strong> em uma única operação se o Stop Loss for acionado.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono">
                    Exemplo: Se você possui R$ 20.000 em conta, seu prejuízo máximo em um trade perdedor não pode passar de R$ 200 a R$ 400. Ajuste a quantidade de ações compradas conforme a distância do Stop!
                  </div>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Relação Risco x Retorno Mínima de 1:2
                  </h4>
                  <p className="text-xs text-slate-300">
                    Só entre em um trade se o alvo de ganho for no mínimo o dobro da distância do Stop Loss.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono">
                    Se o Stop estiver a 3% de distância abaixo da mínima, seu Alvo deve estar a no mínimo +6% a +9% de lucro em direção às médias móveis.
                  </div>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Stop Loss é Sagrado
                  </h4>
                  <p className="text-xs text-slate-300">
                    Nunca retire nem amplie seu Stop Loss quando o preço estiver caindo. Se a tese não se confirmou, aceite a pequena perda e preserve seu capital para a próxima oportunidade.
                  </p>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Diversificação Inteligente
                  </h4>
                  <p className="text-xs text-slate-300">
                    Nunca coloque 100% do seu dinheiro em uma única ação ou setor. Distribua suas operações em 4 a 6 ativos de setores descorrelacionados (ex: Bancos, Energia, Commodities, Varejo).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-700/70 space-y-1">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  O aplicativo compra ou vende as ações automaticamente?
                </h4>
                <p className="text-xs text-slate-300">
                  Não. O Monitor da Bolsa de Valores é uma <strong>ferramenta independente de análise gráfica, inteligência quantitativa e scanner de mercado</strong>. As ordens de compra e venda devem ser emitidas por você mesmo através do aplicativo ou Home Broker da sua própria corretora de preferência.
                </p>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-700/70 space-y-1">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  Qual o melhor horário do dia para olhar o aplicativo?
                </h4>
                <p className="text-xs text-slate-300">
                  Para Swing Trade, os momentos mais estratégicos são:
                </p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside pt-1">
                  <li><strong>Entre 11:00 e 12:00:</strong> após a abertura da B3 e de Wall Street (NYSE/Nasdaq), quando a volatilidade inicial se assenta.</li>
                  <li><strong>Entre 16:00 e 16:45 (final do pregão):</strong> o momento ideal para conferir os candles que fecharam na mínima ou confirmaram repique, permitindo planejar a entrada para o dia seguinte ou comprar no fechamento.</li>
                </ul>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-700/70 space-y-1">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  O que significa o botão &quot;Carregar mais (+100)&quot; e &quot;Exibir todos&quot;?
                </h4>
                <p className="text-xs text-slate-300">
                  Para garantir máxima velocidade e economia de bateria no celular, a tabela exibe inicialmente os 100 ativos com maior queda/sobrevenda. Clicando em <strong>&quot;Carregar mais (+100)&quot;</strong> ou <strong>&quot;Exibir todos&quot;</strong>, você carrega a lista completa de todos os ativos do mercado sem cortes.
                </p>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-700/70 space-y-1">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  Quanto tempo em média dura uma operação de Swing Trade?
                </h4>
                <p className="text-xs text-slate-300">
                  Em média de <strong>3 a 10 dias úteis</strong>. Quando o ativo atinge o alvo de retorno até a média móvel (EMA 20) ou aciona a realização parcial, o trade é encerrado com lucro no bolso.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/80 border-t border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Conteúdo didático e analítico para formação do investidor consciente.</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
            >
              <span>Entendi, Começar a Analisar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
