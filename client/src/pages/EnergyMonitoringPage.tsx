import React, { useState, useEffect } from 'react';
import {
  Sun,
  Zap,
  Activity,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  Legend,
  CartesianGrid,
} from 'recharts';
import { useSystem } from '../context/SystemContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { StatCard } from '../components/ui/StatCard';

export const EnergyMonitoringPage: React.FC = () => {
  const { kpis } = useSystem();
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<string>('7d');
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.getHistoricalAnalytics({ dateRange });
        setData(res.data || []);
        setSummary(res.summary || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [dateRange]);

  const balanceState = kpis?.systemState || 'BALANCED';
  const balanceKw = kpis?.netPowerBalanceKw || 0;

  // Monthly distribution breakdown
  const monthlyDistribution = [
    { name: t('monitoring_source_solar'), value: 48, color: '#F59E0B' },
    { name: t('monitoring_source_battery'), value: 32, color: '#8B5CF6' },
    { name: t('monitoring_source_grid'), value: 20, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            {t('monitoring_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('monitoring_subtitle')}
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
          {[
            { id: 'today', label: t('filter_today') },
            { id: 'yesterday', label: t('filter_yesterday') },
            { id: '7d', label: t('filter_7d') },
            { id: '30d', label: t('filter_30d') },
            { id: '90d', label: t('filter_90d') },
            { id: '1y', label: t('filter_1y') },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setDateRange(f.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                dateRange === f.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Production & Consumption KPI Matrices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Solar Matrix */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('monitoring_photovoltaic_production')}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-mono">
              18.0 kWp
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">{t('monitoring_instantaneous')}</span>
              <p className="text-lg font-extrabold text-amber-500 mt-0.5">{kpis?.solarProductionKw || 14.8} kW</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">{t('monitoring_daily_prod')}</span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">86.4 kWh</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">{t('monitoring_weekly_total')}</span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">605.2 kWh</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">{t('monitoring_monthly_forecast')}</span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">2,480 kWh</p>
            </div>
          </div>
        </div>

        {/* Consumption Matrix */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('monitoring_electricity_consumption')}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500">
              4 {t('kpi_active_zones')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">{t('monitoring_total_instantaneous')}</span>
              <p className="text-lg font-extrabold text-rose-500 mt-0.5">{kpis?.totalConsumptionKw || 16.0} kW</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">{t('monitoring_total_daily')}</span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">248.0 kWh</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">{t('monitoring_peak_demand')}</span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{summary.peakDemandKw || 21.4} kW</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400">{t('monitoring_monthly_cons')}</span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">7,390 kWh</p>
            </div>
          </div>
        </div>

        {/* Energy Balance Matrix */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('monitoring_power_balance_state')}
              </h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                balanceState === 'SURPLUS'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : balanceState === 'DEFICIT'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}
            >
              {t(balanceState.toLowerCase())}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">{t('monitoring_net_power_balance')}</span>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {balanceKw > 0 ? `+${balanceKw}` : balanceKw} kW
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400">{t('monitoring_formula')}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {balanceState === 'SURPLUS'
                ? t('monitoring_desc_surplus')
                : balanceState === 'DEFICIT'
                ? t('monitoring_desc_deficit')
                : t('monitoring_desc_balanced')}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Production vs Consumption Line Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('monitoring_chart_1_title')}
              </h3>
              <p className="text-xs text-slate-400">{t('monitoring_chart_1_desc')}</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(-30)}>
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
                <Legend />
                <Line
                  type="monotone"
                  dataKey="solarProduction"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={false}
                  name={t('series_solar')}
                />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  dot={false}
                  name={t('series_load')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Hourly Consumption Area Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('monitoring_chart_2_title')}
              </h3>
              <p className="text-xs text-slate-400">{t('monitoring_chart_2_desc')}</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.slice(-24)}>
                <defs>
                  <linearGradient id="hourlyConsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
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
                  dataKey="consumption"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fill="url(#hourlyConsGrad)"
                  name={t('series_load')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Daily Production Bar Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('monitoring_chart_3_title')}
              </h3>
              <p className="text-xs text-slate-400">{t('monitoring_chart_3_desc')}</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="formattedDate" stroke="#94A3B8" fontSize={11} />
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
                  dataKey="solarProduction"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                  name={t('series_solar')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Monthly Energy Distribution Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('monitoring_chart_4_title')}
              </h3>
              <p className="text-xs text-slate-400">{t('monitoring_chart_4_desc')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={monthlyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {monthlyDistribution.map((entry, index) => (
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

            <div className="space-y-3">
              {monthlyDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
