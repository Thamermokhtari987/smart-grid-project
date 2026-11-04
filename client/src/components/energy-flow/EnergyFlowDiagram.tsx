import React from 'react';
import { SystemKPIs, Zone, Battery as BatteryType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface EnergyFlowProps {
  kpis: SystemKPIs | null;
  zones?: Zone[];
  batteries?: BatteryType[];
}

export const EnergyFlowDiagram: React.FC<EnergyFlowProps> = ({ kpis, zones = [], batteries = [] }) => {
  const { t, isRtl } = useLanguage();

  const solarKw = kpis?.solarProductionKw || 0;
  const loadKw = kpis?.totalConsumptionKw || 0;
  const gridImportKw = kpis?.gridImportKw || 0;
  const gridExportKw = kpis?.gridExportKw || 0;
  const netBalance = kpis?.netPowerBalanceKw || 0;

  // Battery aggregated flow
  const b1Soc = batteries[0]?.soc ?? 95;
  const b2Soc = batteries[1]?.soc ?? 70;
  const b3Soc = batteries[2]?.soc ?? 45;

  // Determine active flow directions
  const isSolarFlowing = solarKw > 0.1;
  const isCharging = netBalance > 0.2;
  const isDischarging = netBalance < -0.2 && (gridImportKw < loadKw);
  const isExporting = gridExportKw > 0.1;
  const isImporting = gridImportKw > 0.1;

  return (
    <div className="relative w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Flow Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 z-10 relative">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-lg font-bold text-white tracking-wide">{t('flow_title')}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{t('flow_subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {t('legend_solar')}: {solarKw} kW
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            {t('legend_battery')}: {((b1Soc + b2Soc + b3Soc) / 3).toFixed(0)}% Avg
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {t('legend_consumption')}: {loadKw} kW
          </div>
        </div>
      </div>

      {/* SVG Diagram Canvas */}
      <div className="relative w-full max-w-5xl mx-auto overflow-x-auto py-4">
        <svg viewBox="0 0 1000 520" className="w-full h-auto min-w-[750px]">
          <defs>
            {/* Glow filters */}
            <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Solar Panels (X: 500, Y: 80) -> Central Smart EMS (X: 500, Y: 180) */}
          <line x1="500" y1="80" x2="500" y2="180" stroke="#334155" strokeWidth="4" />
          {isSolarFlowing && (
            <line
              x1="500" y1="80" x2="500" y2="180"
              stroke="#F59E0B" strokeWidth="4"
              className="animate-flow"
              filter="url(#glowGold)"
            />
          )}

          {/* 2. Central EMS -> Left branch (Batteries at X: 160) */}
          <line x1="420" y1="240" x2="260" y2="240" stroke="#334155" strokeWidth="3" />
          <path d="M 260 240 L 260 140 L 200 140" fill="none" stroke="#334155" strokeWidth="3" />
          <path d="M 260 240 L 200 240" fill="none" stroke="#334155" strokeWidth="3" />
          <path d="M 260 240 L 260 340 L 200 340" fill="none" stroke="#334155" strokeWidth="3" />

          {(isCharging || isDischarging) && (
            <>
              <line
                x1="420" y1="240" x2="260" y2="240"
                stroke="#A855F7" strokeWidth="3"
                className={isCharging ? "animate-flow-reverse" : "animate-flow"}
                filter="url(#glowPurple)"
              />
              <path
                d="M 260 240 L 260 140 L 200 140"
                fill="none" stroke="#A855F7" strokeWidth="3"
                className={isCharging ? "animate-flow-reverse" : "animate-flow"}
              />
              <path
                d="M 260 240 L 200 240"
                fill="none" stroke="#A855F7" strokeWidth="3"
                className={isCharging ? "animate-flow-reverse" : "animate-flow"}
              />
              <path
                d="M 260 240 L 260 340 L 200 340"
                fill="none" stroke="#A855F7" strokeWidth="3"
                className={isCharging ? "animate-flow-reverse" : "animate-flow"}
              />
            </>
          )}

          {/* 3. Central EMS -> Right branch (Zones 1-4 at X: 780) */}
          <line x1="580" y1="240" x2="740" y2="240" stroke="#334155" strokeWidth="3" />
          <path d="M 740 240 L 740 100 L 780 100" fill="none" stroke="#334155" strokeWidth="3" />
          <path d="M 740 240 L 740 190 L 780 190" fill="none" stroke="#334155" strokeWidth="3" />
          <path d="M 740 240 L 740 290 L 780 290" fill="none" stroke="#334155" strokeWidth="3" />
          <path d="M 740 240 L 740 380 L 780 380" fill="none" stroke="#334155" strokeWidth="3" />

          {loadKw > 0.1 && (
            <>
              <line
                x1="580" y1="240" x2="740" y2="240"
                stroke="#EF4444" strokeWidth="3"
                className="animate-flow"
                filter="url(#glowRed)"
              />
              <path d="M 740 240 L 740 100 L 780 100" fill="none" stroke="#EF4444" strokeWidth="3" className="animate-flow" />
              <path d="M 740 240 L 740 190 L 780 190" fill="none" stroke="#F97316" strokeWidth="3" className="animate-flow" />
              <path d="M 740 240 L 740 290 L 780 290" fill="none" stroke="#3B82F6" strokeWidth="3" className="animate-flow" />
              <path d="M 740 240 L 740 380 L 780 380" fill="none" stroke="#10B981" strokeWidth="3" className="animate-flow" />
            </>
          )}

          {/* 4. Central EMS -> Bottom Grid Connection */}
          <line x1="500" y1="300" x2="500" y2="400" stroke="#334155" strokeWidth="4" />
          {isExporting && (
            <line x1="500" y1="300" x2="500" y2="400" stroke="#10B981" strokeWidth="4" className="animate-flow" filter="url(#glowGreen)" />
          )}
          {isImporting && (
            <line x1="500" y1="300" x2="500" y2="400" stroke="#3B82F6" strokeWidth="4" className="animate-flow-reverse" />
          )}

          {/* Flow Labels */}
          <g transform="translate(508, 130)">
            <rect x="0" y="-12" width="80" height="22" rx="4" fill="#1E293B" stroke="#F59E0B" strokeWidth="1" />
            <text x="40" y="3" textAnchor="middle" fill="#FBBF24" fontSize="11" fontWeight="bold">
              {solarKw} kW
            </text>
          </g>

          <g transform="translate(290, 218)">
            <rect x="0" y="-12" width="95" height="22" rx="4" fill="#1E293B" stroke="#A855F7" strokeWidth="1" />
            <text x="47" y="3" textAnchor="middle" fill="#C084FC" fontSize="11" fontWeight="bold">
              {isCharging ? `+${Math.min(6, netBalance).toFixed(1)} kW` : (isDischarging ? `-${Math.min(6, Math.abs(netBalance)).toFixed(1)} kW` : '0.0 kW')}
            </text>
          </g>

          <g transform="translate(620, 218)">
            <rect x="0" y="-12" width="90" height="22" rx="4" fill="#1E293B" stroke="#EF4444" strokeWidth="1" />
            <text x="45" y="3" textAnchor="middle" fill="#F87171" fontSize="11" fontWeight="bold">
              {loadKw} kW
            </text>
          </g>

          {/* Nodes */}
          {/* Solar */}
          <g transform="translate(420, 10)">
            <rect width="160" height="70" rx="12" fill="#172A45" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="35" cy="35" r="18" fill="#F59E0B" fillOpacity="0.2" />
            <path d="M 35 25 L 35 45 M 25 35 L 45 35" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <text x="65" y="30" fill="#FFFFFF" fontSize="12" fontWeight="bold">{t('node_solar')}</text>
            <text x="65" y="48" fill="#FBBF24" fontSize="14" fontWeight="extrabold">{solarKw} kW</text>
          </g>

          {/* Smart EMS */}
          <g transform="translate(420, 180)">
            <rect width="160" height="120" rx="16" fill="#101B2D" stroke="#3B82F6" strokeWidth="3" />
            <circle cx="80" cy="42" r="22" fill="#2563EB" fillOpacity="0.2" />
            <path d="M 80 28 L 73 43 L 80 43 L 78 54 L 88 39 L 81 39 Z" fill="#60A5FA" />
            <text x="80" y="78" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">{t('node_ems')}</text>
            <text x="80" y="94" textAnchor="middle" fill="#94A3B8" fontSize="10">{t('node_ems_desc')}</text>
            <text
              x="80" y="110" textAnchor="middle"
              fill={kpis?.systemState === 'SURPLUS' ? '#34D399' : (kpis?.systemState === 'DEFICIT' ? '#F87171' : '#60A5FA')}
              fontSize="11" fontWeight="extrabold"
            >
              [{kpis?.systemState || 'BALANCED'}]
            </text>
          </g>

          {/* Batteries */}
          <g transform="translate(30, 105)">
            <rect width="170" height="65" rx="10" fill="#172A45" stroke="#8B5CF6" strokeWidth="1.5" />
            <text x="16" y="26" fill="#E2E8F0" fontSize="11" fontWeight="bold">BATTERIE 1 (20 kWh)</text>
            <text x="16" y="44" fill="#C084FC" fontSize="13" fontWeight="bold">SOC: {b1Soc.toFixed(0)}%</text>
            <rect x="16" y="50" width="138" height="6" rx="3" fill="#334155" />
            <rect x="16" y="50" width={(138 * Math.min(100, b1Soc)) / 100} height="6" rx="3" fill="#8B5CF6" />
          </g>

          <g transform="translate(30, 205)">
            <rect width="170" height="65" rx="10" fill="#172A45" stroke="#8B5CF6" strokeWidth="1.5" />
            <text x="16" y="26" fill="#E2E8F0" fontSize="11" fontWeight="bold">BATTERIE 2 (15 kWh)</text>
            <text x="16" y="44" fill="#C084FC" fontSize="13" fontWeight="bold">SOC: {b2Soc.toFixed(0)}%</text>
            <rect x="16" y="50" width="138" height="6" rx="3" fill="#334155" />
            <rect x="16" y="50" width={(138 * Math.min(100, b2Soc)) / 100} height="6" rx="3" fill="#8B5CF6" />
          </g>

          <g transform="translate(30, 305)">
            <rect width="170" height="65" rx="10" fill="#172A45" stroke="#8B5CF6" strokeWidth="1.5" />
            <text x="16" y="26" fill="#E2E8F0" fontSize="11" fontWeight="bold">BATTERIE 3 (10 kWh)</text>
            <text x="16" y="44" fill="#C084FC" fontSize="13" fontWeight="bold">SOC: {b3Soc.toFixed(0)}%</text>
            <rect x="16" y="50" width="138" height="6" rx="3" fill="#334155" />
            <rect x="16" y="50" width={(138 * Math.min(100, b3Soc)) / 100} height="6" rx="3" fill="#8B5CF6" />
          </g>

          {/* Zones */}
          <g transform="translate(780, 70)">
            <rect width="190" height="60" rx="10" fill="#172A45" stroke="#EF4444" strokeWidth="2" />
            <text x="16" y="26" fill="#FCA5A5" fontSize="11" fontWeight="bold">ZONE 1 (Critique)</text>
            <text x="16" y="44" fill="#FFFFFF" fontSize="13" fontWeight="extrabold">{zones[0]?.currentConsumption || 4.8} kW</text>
          </g>

          <g transform="translate(780, 160)">
            <rect width="190" height="60" rx="10" fill="#172A45" stroke="#F97316" strokeWidth="1.5" />
            <text x="16" y="26" fill="#FDBA74" fontSize="11" fontWeight="bold">ZONE 2 (Haute)</text>
            <text x="16" y="44" fill="#FFFFFF" fontSize="13" fontWeight="extrabold">{zones[1]?.currentConsumption || 3.6} kW</text>
          </g>

          <g transform="translate(780, 260)">
            <rect width="190" height="60" rx="10" fill="#172A45" stroke="#3B82F6" strokeWidth="1.5" />
            <text x="16" y="26" fill="#93C5FD" fontSize="11" fontWeight="bold">ZONE 3 (Moyenne)</text>
            <text x="16" y="44" fill="#FFFFFF" fontSize="13" fontWeight="extrabold">{zones[2]?.currentConsumption || 5.2} kW</text>
          </g>

          <g transform="translate(780, 350)">
            <rect width="190" height="60" rx="10" fill="#172A45" stroke="#10B981" strokeWidth="1.5" />
            <text x="16" y="26" fill="#6EE7B7" fontSize="11" fontWeight="bold">ZONE 4 (Basse)</text>
            <text x="16" y="44" fill="#FFFFFF" fontSize="13" fontWeight="extrabold">
              {zones[3]?.isConnected ? `${zones[3]?.currentConsumption || 2.4} kW` : 'DÉLESTÉE'}
            </text>
          </g>

          {/* Grid */}
          <g transform="translate(420, 400)">
            <rect width="160" height="75" rx="12" fill="#172A45" stroke={isExporting ? '#10B981' : (isImporting ? '#3B82F6' : '#64748B')} strokeWidth="2" />
            <circle cx="35" cy="37" r="18" fill="#3B82F6" fillOpacity="0.2" />
            <text x="65" y="32" fill="#FFFFFF" fontSize="11" fontWeight="bold">{t('node_grid')}</text>
            <text x="65" y="52" fill={isExporting ? '#34D399' : (isImporting ? '#60A5FA' : '#94A3B8')} fontSize="12" fontWeight="bold">
              {isExporting ? `Export: ${gridExportKw} kW` : (isImporting ? `Import: ${gridImportKw} kW` : 'Synchronisé')}
            </text>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-glow-solar" />
            {t('legend_solar')}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 shadow-glow-battery" />
            {t('legend_battery')}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            {t('legend_consumption')}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-glow-green" />
            {t('legend_export')}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-glow-blue" />
            {t('legend_grid')}
          </span>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Hiérarchie : Zone 1 (Critique) &gt; Zone 2 (Haute) &gt; Zone 3 (Moy) &gt; Zone 4 (Délestage)
        </div>
      </div>
    </div>
  );
};
