import React, { useState, useEffect } from 'react';
import {
  Sun,
  Zap,
  BatteryCharging,
  Layers,
  Coins,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useSystem } from '../context/SystemContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import { EnergyFlowDiagram } from '../components/energy-flow/EnergyFlowDiagram';
import { Zone, Battery } from '../types';

export const OverviewPage: React.FC = () => {
  const { kpis, refreshSystem } = useSystem();
  const { t } = useLanguage();

  const [zones, setZones] = useState<Zone[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<string>('7d');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [zRes, bRes, histRes] = await Promise.all([
        api.getZones(),
        api.getBatteries(),
        api.getHistoricalAnalytics({ dateRange }),
      ]);
      setZones(zRes);
      setBatteries(bRes);
      setHistoryData(histRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshSystem(), fetchData()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const zonePieData = zones.map((z) => ({
    name: z.name,
    value: z.currentConsumption,
    color: z.color,
  }));

  const stateColor =
    kpis?.systemState === 'SURPLUS'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      : kpis?.systemState === 'DEFICIT'
      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/40';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#101B2D] to-slate-900 border border-slate-800 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              {t('nav_overview')}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${stateColor}`}>
              ● {kpis?.systemState ? t(kpis.systemState.toLowerCase()) : t('balanced')}
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {t('overview_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date range selector */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            {[
              { id: 'today', label: t('filter_today') },
              { id: '7d', label: t('filter_7d') },
              { id: '30d', label: t('filter_30d') },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setDateRange(r.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  dateRange === r.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={t('refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (6 cards required by prompt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Solar Production */}
        <StatCard
          title={t('kpi_solar_production')}
          value={kpis?.solarProductionKw ?? 14.8}
          unit="kW"
          trend="up"
          trendValue="+12.4%"
          comparison={t('comparison_vs_yesterday')}
          icon={Sun}
          iconColor="text-amber-500"
          glowColor="solar"
        />

        {/* 2. Total Consumption */}
        <StatCard
          title={t('kpi_total_consumption')}
          value={kpis?.totalConsumptionKw ?? 16.0}
          unit="kW"
          trend={kpis?.netPowerBalanceKw && kpis.netPowerBalanceKw < 0 ? 'down' : 'up'}
          trendValue={kpis?.netPowerBalanceKw && kpis.netPowerBalanceKw < 0 ? t('deficit') : t('surplus')}
          comparison={`${t('comparison_demand')}: ${kpis?.requestedConsumptionKw ?? 16.0} kW`}
          icon={Zap}
          iconColor="text-rose-500"
        />

        {/* 3. Available Battery Energy */}
        <StatCard
          title={t('kpi_battery_energy')}
          value={kpis?.availableBatteryEnergyKwh ?? 32.5}
          unit="kWh"
          trend="neutral"
          trendValue={t('badge_3_banks')}
          comparison={`${t('comparison_nominal')}: 45 kWh`}
          icon={BatteryCharging}
          iconColor="text-purple-500"
          glowColor="battery"
        />

        {/* 4. Average Battery Charge */}
        <StatCard
          title={t('kpi_avg_battery_soc')}
          value={kpis?.avgBatteryChargePct ?? 70.0}
          unit="%"
          trend="up"
          trendValue="B1: 95%"
          comparison={t('comparison_healthy_reserve')}
          icon={BatteryCharging}
          iconColor="text-purple-400"
          glowColor="battery"
        />

        {/* 5. Active Zones */}
        <StatCard
          title={t('kpi_active_zones')}
          value={`${kpis?.activeZonesCount ?? 4} / 4`}
          unit="Zones"
          trend="neutral"
          trendValue={t('comparison_online')}
          comparison={`Z1 - Z4 ${t('comparison_connected')}`}
          icon={Layers}
          iconColor="text-blue-500"
          glowColor="blue"
        />

        {/* 6. Total Energy Sold */}
        <StatCard
          title={t('kpi_total_sold')}
          value={kpis?.totalEnergySoldKwh ?? 124.6}
          unit="kWh"
          trend="up"
          trendValue={`+${kpis?.totalRevenueSoldTnd ?? 31.15} TND`}
          comparison="@ 0.250 TND/kWh"
          icon={Coins}
          iconColor="text-emerald-500"
          glowColor="green"
        />
      </div>

      {/* Energy Flow Visualization Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t('flow_title')}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('flow_auto_balance_active')}
          </span>
        </div>
        <EnergyFlowDiagram kpis={kpis} zones={zones} batteries={batteries} />
      </section>

      {/* Overview Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Solar Production vs Electricity Consumption */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('chart_solar_vs_load')}
              </h3>
              <p className="text-xs text-slate-400">{t('chart_solar_vs_load_desc')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {t('series_solar')}
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                {t('series_load')}
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData.slice(-24)}>
                <defs>
                  <linearGradient id="solarColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="consColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="formattedTime" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="solarProduction"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#solarColor)"
                  name={t('series_solar')}
                />
                <Area
                  type="monotone"
                  dataKey="consumption"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#consColor)"
                  name={t('series_load')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Battery Charge & Storage History */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('chart_battery_charge_history')}
              </h3>
              <p className="text-xs text-slate-400">{t('chart_battery_charge_desc')}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30">
              {t('badge_3_banks')}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData.slice(-24)}>
                <defs>
                  <linearGradient id="batteryFlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="formattedTime" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="batteryPower"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fill="url(#batteryFlowGrad)"
                  name={t('series_batteries')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Energy Distribution by Zone */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('chart_zone_breakdown')}
              </h3>
              <p className="text-xs text-slate-400">{t('chart_zone_breakdown_desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={zonePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {zonePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2.5">
              {zones.map((z) => (
                <div key={z.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md" style={{ backgroundColor: z.color }} />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                      {z.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {z.currentConsumption} kW (P{z.priorityLevel})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Daily Energy Balance */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('chart_net_power_balance')}
              </h3>
              <p className="text-xs text-slate-400">{t('chart_net_power_desc')}</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData.slice(-16)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="formattedTime" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar
                  dataKey="netBalance"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  name={t('series_net_balance')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
