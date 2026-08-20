import React, { useState, useEffect, useRef } from 'react';
import { AssetOpportunity } from '../types';
import { ChevronUp, ChevronDown, CheckCircle2, ArrowDownRight, Eye, Layers, Filter, X, ChevronRight } from 'lucide-react';
import { getSectorStyle } from '../utils/sectorUtils';

interface OpportunitiesTableProps {
  opportunities: AssetOpportunity[];
  selectedTicker: string | null;
  onSelectTicker: (ticker: string) => void;
  selectedSector?: string;
  onSelectSector?: (sector: string) => void;
  availableSectors?: [string, number][];
  detailContent?: React.ReactNode;
}

type SortField = 'IS' | 'Queda_Dia' | 'Score' | 'Liquidez' | 'Preco' | 'Volume' | 'Ticker' | 'Setor';

export const OpportunitiesTable: React.FC<OpportunitiesTableProps> = ({
  opportunities,
  selectedTicker,
  onSelectTicker,
  selectedSector = 'all',
  onSelectSector,
  availableSectors = [],
  detailContent,
}) => {
  const [sortField, setSortField] = useState<SortField>('Queda_Dia');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const detailRef = useRef<HTMLTableRowElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  // Keep track of the visible width of the table card
  useEffect(() => {
    if (!tableContainerRef.current) return;
    const updateWidth = () => {
      if (tableContainerRef.current) {
        setContainerWidth(tableContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(tableContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto scroll smoothly to the expanded chart/analysis row
  useEffect(() => {
    if (selectedTicker && detailRef.current) {
      const timer = setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedTicker]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'Queda_Dia' || field === 'Ticker' || field === 'Setor');
    }
  };

  const sortedData = [...opportunities].sort((a, b) => {
    let vA = a[sortField];
    let vB = b[sortField];
    if (sortField === 'Queda_Dia') {
      // Queda_Dia is negative, sortAsc = true means biggest drop first (-8% before -2%)
      return sortAsc ? (a.Queda_Dia - b.Queda_Dia) : (b.Queda_Dia - a.Queda_Dia);
    }
    if (sortField === 'Setor') {
      const sA = (a.Setor || 'Outros').toLowerCase();
      const sB = (b.Setor || 'Outros').toLowerCase();
      return sortAsc ? sA.localeCompare(sB) : sB.localeCompare(sA);
    }
    if (typeof vA === 'string') {
      return sortAsc ? (vA as string).localeCompare(vB as string) : (vB as string).localeCompare(vA as string);
    }
    return sortAsc ? (Number(vA) - Number(vB)) : (Number(vB) - Number(vA));
  });

  const getPotentialBadge = (potencial: string) => {
    switch (potencial) {
      case 'Muito Alta':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap">🟢 Muito Alta</span>;
      case 'Alta':
        return <span className="bg-green-500/20 text-green-300 border border-green-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">🟢 Alta</span>;
      case 'Média':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">🟡 Média</span>;
      default:
        return <span className="bg-slate-700/50 text-slate-300 border border-slate-600/40 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">⚪ Baixa</span>;
    }
  };

  const getClassBadge = (classe: string) => {
    switch (classe) {
      case 'BDR':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded">BDR</span>;
      case 'ETF':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded">ETF</span>;
      default:
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded">Ação</span>;
    }
  };

  const formatBRL = (v: number) => {
    return `R$ ${Number(v || 0).toFixed(2)}`;
  };

  const formatVolume = (v: number) => {
    if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(0)}k`;
    return `R$ ${v.toFixed(0)}`;
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden mb-8">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-850">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🎯 Oportunidades Identificadas</span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">
              {opportunities.length} encontrados
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Clique em qualquer ativo para carregar o painel completo de análise técnica e preditiva.
          </p>
        </div>

        {/* Quick Sector Filter Dropdown & Status */}
        {onSelectSector && availableSectors.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 font-medium">Setor:</span>
              <select
                id="select-table-sector-filter"
                value={selectedSector}
                onChange={(e) => onSelectSector(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all" className="bg-slate-900 text-white">Todos os Setores</option>
                {availableSectors.map(([sec, count]) => (
                  <option key={sec} value={sec} className="bg-slate-900 text-white">
                    {sec} ({count})
                  </option>
                ))}
              </select>
              {selectedSector !== 'all' && (
                <button
                  onClick={() => onSelectSector('all')}
                  className="text-rose-400 hover:text-rose-300 ml-1 p-0.5"
                  title="Limpar filtro de setor"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div ref={tableContainerRef} className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-700 select-none">
              <th className="py-3 px-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('Ticker')}>
                <div className="flex items-center gap-1">
                  Ticker {sortField === 'Ticker' && (sortAsc ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                </div>
              </th>
              <th className="py-3 px-2">Classe</th>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('Setor')}>
                <div className="flex items-center gap-1">
                  Setor {sortField === 'Setor' && (sortAsc ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                </div>
              </th>
              <th className="py-3 px-3">Empresa</th>
              <th className="py-3 px-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort('Liquidez')}>
                <div className="flex items-center justify-center gap-1">
                  Liq. {sortField === 'Liquidez' && (sortAsc ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('Preco')}>
                <div className="flex items-center justify-end gap-1">
                  Preço {sortField === 'Preco' && (sortAsc ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('Queda_Dia')}>
                <div className="flex items-center justify-end gap-1">
                  Queda {sortField === 'Queda_Dia' && (sortAsc ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                </div>
              </th>
              <th className="py-3 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('IS')}>
                <div className="flex items-center justify-center gap-1">
                  I.S. (Sobrevenda) {sortField === 'IS' && (sortAsc ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('Volume')}>
                <div className="flex items-center justify-end gap-1">
                  Vol. Fin. {sortField === 'Volume' && (sortAsc ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                </div>
              </th>
              <th className="py-3 px-2 text-center">Potencial</th>
              <th className="py-3 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('Score')}>
                <div className="flex items-center justify-center gap-1">
                  Score {sortField === 'Score' && (sortAsc ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />)}
                </div>
              </th>
              <th className="py-3 px-3">Sinais Técnicos</th>
              <th className="py-3 px-2 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedData.map((row) => {
              const isSelected = row.Ticker === selectedTicker;
              const sector = row.Setor || 'Outros';
              const sectorStyle = getSectorStyle(sector);

              return (
                <React.Fragment key={row.Ticker}>
                  <tr
                    id={`row-asset-${row.Ticker.toLowerCase()}`}
                    onClick={() => onSelectTicker(isSelected ? '' : row.Ticker)}
                    className={`transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/80 border-l-4 border-l-blue-500 text-white font-medium shadow-inner'
                        : 'hover:bg-slate-700/40 text-slate-300'
                    }`}
                  >
                    {/* Ticker */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-sm text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{row.Ticker}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                    </td>

                    {/* Classe */}
                    <td className="py-3 px-2 whitespace-nowrap">
                      {getClassBadge(row.Classe)}
                    </td>

                    {/* Setor */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectSector) {
                            onSelectSector(selectedSector === sector ? 'all' : sector);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${sectorStyle.badgeClass} ${sectorStyle.pillHoverClass}`}
                        title={`Filtrar pelo setor: ${sector}`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${sectorStyle.dotColor}`} />
                        <span>{sector}</span>
                      </button>
                    </td>

                    {/* Empresa */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-200 max-w-[150px] truncate" title={row.Empresa}>
                      {row.Empresa}
                    </td>

                    {/* Liquidez */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        row.Liquidez >= 7 ? 'bg-cyan-500/20 text-cyan-300' : row.Liquidez >= 4 ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'
                      }`}>
                        💧 {row.Liquidez}/10
                      </span>
                    </td>

                    {/* Preco */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-white whitespace-nowrap">
                      {formatBRL(row.Preco)}
                    </td>

                    {/* Queda */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        {row.Queda_Dia.toFixed(2)}%
                      </span>
                    </td>

                    {/* IS */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.IS >= 70 ? 'bg-emerald-500' : row.IS >= 50 ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, row.IS)}%` }}
                          />
                        </div>
                        <span className={`font-mono font-bold ${
                          row.IS >= 70 ? 'text-emerald-400' : 'text-slate-300'
                        }`}>
                          {row.IS}
                        </span>
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                      {formatVolume(row.Volume)}
                    </td>

                    {/* Potencial */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {getPotentialBadge(row.Potencial)}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {row.Score}/10
                      </span>
                    </td>

                    {/* Sinais */}
                    <td className="py-3 px-3 text-xs text-slate-400 max-w-[220px] truncate" title={row.Sinais}>
                      {row.Sinais || '-'}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <button
                        id={`btn-inspect-${row.Ticker.toLowerCase()}`}
                        type="button"
                        className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center justify-center mx-auto gap-1 text-[11px] font-bold ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                            : 'bg-slate-700/70 hover:bg-slate-600 text-slate-300'
                        }`}
                        title={isSelected ? 'Ocultar análise' : 'Abrir análise logo abaixo'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">{isSelected ? 'Ocultar' : 'Ver'}</span>
                      </button>
                    </td>
                  </tr>

                  {/* Inline Expanded Chart & Inspection Detail Section */}
                  {isSelected && detailContent && (
                    <tr
                      key={`${row.Ticker}-expanded-detail`}
                      ref={detailRef}
                      id={`row-detail-${row.Ticker.toLowerCase()}`}
                      className="bg-slate-950/95"
                    >
                      <td colSpan={13} className="p-0 border-y-2 border-blue-500/50 bg-slate-950">
                        <div
                          className="sticky left-0 overflow-hidden p-2 sm:p-4 max-w-full"
                          style={{
                            width: containerWidth ? `${containerWidth}px` : '100%',
                            maxWidth: '100vw'
                          }}
                        >
                          {detailContent}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
