import React from 'react';
import { RefreshCw, Filter, Layers, Droplets, Sparkles, PieChart, X } from 'lucide-react';
import { AssetClass } from '../types';
import { getSectorStyle } from '../utils/sectorUtils';

interface ScannerFiltersProps {
  selectedClasses: AssetClass[];
  onToggleClass: (classe: AssetClass) => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  availableSectors: [string, number][];
  filterEMA20: boolean;
  setFilterEMA20: (v: boolean) => void;
  filterEMA50: boolean;
  setFilterEMA50: (v: boolean) => void;
  filterEMA200: boolean;
  setFilterEMA200: (v: boolean) => void;
  minLiquidez: number;
  setMinLiquidez: (v: number) => void;
  showBacktests: boolean;
  setShowBacktests: (v: boolean) => void;
  isScanning: boolean;
  onRefresh: () => void;
  totalFiltered: number;
  totalTotal: number;
}

export const ScannerFilters: React.FC<ScannerFiltersProps> = ({
  selectedClasses,
  onToggleClass,
  selectedSector,
  setSelectedSector,
  availableSectors,
  filterEMA20,
  setFilterEMA20,
  filterEMA50,
  setFilterEMA50,
  filterEMA200,
  setFilterEMA200,
  minLiquidez,
  setMinLiquidez,
  showBacktests,
  setShowBacktests,
  isScanning,
  onRefresh,
  totalFiltered,
  totalTotal,
}) => {
  const classesList: AssetClass[] = ['Ação', 'BDR', 'ETF'];

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 lg:p-5 shadow-xl mb-6 space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left Side: Universe & Trend Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 lg:gap-6">
          {/* Universo de Ativos */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Universo:
            </span>
            <div className="flex items-center gap-1.5">
              {classesList.map((c) => {
                const active = selectedClasses.includes(c);
                return (
                  <button
                    key={c}
                    id={`btn-filter-class-${c.toLowerCase()}`}
                    onClick={() => onToggleClass(c)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition border cursor-pointer ${
                      active
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/30'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {c}s
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros de Tendência (EMAs) */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/70 px-3.5 py-1.5 rounded-xl border border-slate-700/70 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              Tendência:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                id="checkbox-filter-ema20"
                type="checkbox"
                checked={filterEMA20}
                onChange={(e) => setFilterEMA20(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
              />
              <span>&gt; EMA20</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                id="checkbox-filter-ema50"
                type="checkbox"
                checked={filterEMA50}
                onChange={(e) => setFilterEMA50(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
              />
              <span>&gt; EMA50</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                id="checkbox-filter-ema200"
                type="checkbox"
                checked={filterEMA200}
                onChange={(e) => setFilterEMA200(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
              />
              <span>&gt; EMA200 (Tendência Maior)</span>
            </label>
          </div>

          {/* Slider de Liquidez Mínima */}
          <div className="flex items-center gap-2.5 bg-slate-900/70 px-3.5 py-1.5 rounded-xl border border-slate-700/70 text-xs">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-medium">Liquidez:</span>
            <input
              id="slider-min-liquidez"
              type="range"
              min="1"
              max="10"
              value={minLiquidez}
              onChange={(e) => setMinLiquidez(Number(e.target.value))}
              className="w-20 accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="font-bold text-cyan-300 font-mono w-4">{minLiquidez}+</span>
          </div>

          {/* Toggle de Backtests Históricos */}
          <label className="flex items-center gap-2 bg-slate-900/70 px-3.5 py-1.5 rounded-xl border border-slate-700/70 text-xs cursor-pointer text-purple-300 hover:text-purple-200 select-none">
            <input
              id="checkbox-toggle-backtest"
              type="checkbox"
              checked={showBacktests}
              onChange={(e) => setShowBacktests(e.target.checked)}
              className="w-3.5 h-3.5 accent-purple-500 rounded cursor-pointer"
            />
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Validação Histórica</span>
          </label>
        </div>

        {/* Right Side: Refresh button & counters */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-700/60">
          <div className="text-right">
            <div className="text-xs text-slate-400">
              Mostrando <strong className="text-emerald-400 font-mono font-bold">{totalFiltered}</strong> de {totalTotal} ativos em queda
            </div>
          </div>

          <button
            id="btn-refresh-scan"
            onClick={onRefresh}
            disabled={isScanning}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-blue-900/40 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Escanear...' : 'Atualizar Análise'}</span>
          </button>
        </div>
      </div>

      {/* Sector Filter Bar */}
      <div className="pt-3 border-t border-slate-700/60 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          <PieChart className="w-3.5 h-3.5 text-indigo-400" />
          <span>Filtrar por Setor:</span>
        </div>

        {/* Sector Quick Chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          <button
            id="filter-sector-all"
            onClick={() => setSelectedSector('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition border cursor-pointer ${
              selectedSector === 'all'
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            Todos ({totalTotal})
          </button>

          {availableSectors.map(([sectorName, count]) => {
            const style = getSectorStyle(sectorName);
            const isSelected = selectedSector === sectorName;
            return (
              <button
                key={sectorName}
                id={`filter-sector-${sectorName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedSector(isSelected ? 'all' : sectorName)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition border cursor-pointer ${
                  isSelected
                    ? `${style.badgeClass} ring-2 ring-blue-500/50 font-bold shadow-md`
                    : 'bg-slate-900/60 border-slate-700/70 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${style.dotColor}`} />
                <span>{sectorName}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}

          {selectedSector !== 'all' && (
            <button
              id="btn-clear-sector-filter"
              onClick={() => setSelectedSector('all')}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition cursor-pointer"
              title="Limpar filtro de setor"
            >
              <X className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
