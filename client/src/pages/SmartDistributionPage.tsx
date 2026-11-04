import React, { useState, useEffect } from 'react';
import {
  GitFork,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Flame,
  ArrowRight,
  Sliders,
  RefreshCw,
  Search,
  Filter,
  Activity,
  Layers,
  BatteryCharging,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { api } from '../services/api';
import { DistributionDecision, Zone, Battery } from '../types';

export const SmartDistributionPage: React.FC = () => {
  const { mode, updateOperatingMode, kpis } = useSystem();
  const [decisions, setDecisions] = useState<DistributionDecision[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [situationFilter, setSituationFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [decRes, zRes, bRes] = await Promise.all([
        api.getDistributionDecisions(50),
        api.getZones(),
        api.getBatteries(),
      ]);
      setDecisions(decRes);
      setZones(zRes);
      setBatteries(bRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredDecisions = decisions.filter((d) => {
    const matchesSearch =
      d.reason.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.action.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.affectedEntity.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesSituation = situationFilter === 'ALL' || d.situation === situationFilter;
    return matchesSearch && matchesSituation;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#101B2D] via-slate-900 to-[#101B2D] border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-cyan-400">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Smart Distribution Engine</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Core energy routing, priority-ranked load shedding hierarchy, and hysteresis prevention
              </p>
            </div>
          </div>
        </div>

        {/* Operating Mode Buttons */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-800/80 border border-slate-700">
          {(['AUTOMATIC', 'ECO', 'MANUAL'] as const).map((m) => (
            <button
              key={m}
              onClick={() => updateOperatingMode(m)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === m
                  ? m === 'AUTOMATIC'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : m === 'ECO'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Operating Logic Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Scenario A: Surplus */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Scenario A: Solar Surplus</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            When <strong>Solar &gt; Load</strong>:
          </p>
          <ul className="space-y-1.5 text-slate-500 dark:text-slate-400 list-disc list-inside">
            <li>Supply 100% of Zone 1, 2, 3, and 4 loads.</li>
            <li>Recharge Battery 1 (P1) up to 98% max SOC.</li>
            <li>Recharge Battery 2 &amp; 3 with surplus energy.</li>
            <li>Export leftover surplus to grid when reserve &ge; 30%.</li>
          </ul>
        </div>

        {/* Scenario B: Deficit & Shedding */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Scenario B: Energy Deficit</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            When <strong>Solar &lt; Load</strong>:
          </p>
          <ul className="space-y-1.5 text-slate-500 dark:text-slate-400 list-disc list-inside">
            <li>Draw discharge power from batteries up to 20% min reserve.</li>
            <li>In ECO mode: Throttle non-critical Zone 4 by 40%.</li>
            <li><strong>Shedding Order:</strong> Shed Zone 4 &rarr; Zone 3 &rarr; Zone 2.</li>
            <li><strong>Zone 1 (Critical)</strong> is preserved at all times.</li>
          </ul>
        </div>

        {/* Dynamic State Status */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Current Dispatch State</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {mode}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-slate-500">
                Net Power: <strong className="text-slate-900 dark:text-white">{kpis?.netPowerBalanceKw} kW</strong>
              </p>
              <p className="text-slate-500">
                Active Supply: <strong className="text-slate-900 dark:text-white">{kpis?.totalConsumptionKw} kW</strong>
              </p>
              <p className="text-slate-500">
                Batteries Dispatched: <strong className="text-purple-400">{batteries.filter(b => b.chargingStatus !== 'IDLE').length} units</strong>
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-400">
            Anti-cycling hysteresis: 5-minute minimum switching threshold active.
          </div>
        </div>
      </div>

      {/* Decision Log Header & Controls */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Live Decision Telemetry Log
            </h3>
            <p className="text-xs text-slate-400">
              Auditable timestamped record of every smart EMS automated dispatch action
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search log reason or action..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 w-52 sm:w-64"
              />
            </div>

            {/* Situation Filter */}
            <select
              value={situationFilter}
              onChange={(e) => setSituationFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Situations</option>
              <option value="SURPLUS">Surplus</option>
              <option value="DEFICIT">Deficit</option>
              <option value="CRITICAL">Critical</option>
              <option value="BALANCED">Balanced</option>
            </select>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Decision Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Situation</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Affected Hardware</th>
                <th className="py-3 px-4">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredDecisions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No decisions matching filters
                  </td>
                </tr>
              ) : (
                filteredDecisions.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          d.situation === 'SURPLUS'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            : d.situation === 'DEFICIT'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            : d.situation === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                        }`}
                      >
                        {d.situation}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs">{d.reason}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-sm">{d.action}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{d.affectedEntity}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] text-slate-400">{d.mode}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
