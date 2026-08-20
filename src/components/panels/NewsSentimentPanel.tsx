import React from 'react';
import { NewsArticle } from '../../types';
import { Newspaper, ExternalLink, ThumbsUp, ThumbsDown, Minus, TrendingUp } from 'lucide-react';

interface NewsSentimentPanelProps {
  articles: NewsArticle[];
  ticker: string;
}

export const NewsSentimentPanel: React.FC<NewsSentimentPanelProps> = ({ articles, ticker }) => {
  const getSentimentBadge = (sent?: NewsArticle['sentimento']) => {
    if (!sent) return null;
    if (sent.label === 'Positivo') {
      return (
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
          <ThumbsUp className="w-3 h-3" /> Positivo ({(sent.score * 100).toFixed(0)}%)
        </span>
      );
    }
    if (sent.label === 'Negativo') {
      return (
        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
          <ThumbsDown className="w-3 h-3" /> Negativo
        </span>
      );
    }
    return (
      <span className="bg-slate-700/50 text-slate-300 border border-slate-600/40 text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
        <Minus className="w-3 h-3" /> Neutro
      </span>
    );
  };

  return (
    <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/70">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-400" />
            Notícias &amp; Análise de Sentimento (IA) — {ticker}
          </h3>
          <p className="text-xs text-slate-400">
            Feed curado das principais fontes financeiras (InfoMoney, Valor, Investing, Money Times).
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {articles.map((item, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 hover:border-slate-600 transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-white hover:text-blue-400 flex items-center gap-1.5 transition"
              >
                <span>{item.titulo}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              </a>
              <div>{getSentimentBadge(item.sentimento)}</div>
            </div>

            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
              {item.resumo}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
              <span>Fonte: <strong className="text-slate-400">{item.fonte}</strong></span>
              {item.dt && <span>• {item.dt}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
