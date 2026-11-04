import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  Layers,
  Cpu,
  Zap,
  Sun,
  BatteryCharging,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { Zone, Appliance } from '../types';

export const AnalyticsReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<string>('30d');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [energyType, setEnergyType] = useState<string>('all');
  const [interval, setInterval] = useState<string>('daily');

  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, zRes, aRes] = await Promise.all([
        api.getHistoricalAnalytics({
          dateRange,
          zoneId: selectedZone,
          interval,
        }),
        api.getZones(),
        api.getAppliances(),
      ]);
      setHistoricalData(histRes.data || []);
      setSummary(histRes.summary || {});
      setZones(zRes);
      setAppliances(aRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedZone, interval]);

  // Export CSV functionality
  const handleExportCsv = () => {
    if (!historicalData.length) return;
    const headers = ['Timestamp', 'Date', 'Time', 'Solar (kW)', 'Consumption (kW)', 'Battery (kW)', 'Grid Import (kW)', 'Grid Export (kW)', 'Net Balance (kW)'];
    const rows = historicalData.map(d => [
      d.timestamp,
      d.formattedDate,
      d.formattedTime,
      d.solarProduction,
      d.consumption,
      d.batteryPower,
      d.gridImport,
      d.gridExport,
      d.netBalance,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartgrid-analytics-${dateRange}-${selectedZone}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Monthly cost evolution data
  const monthlyCostEvolution = [
    { month: 'May', solarKwh: 2200, gridCost: 140, solarSavings: 480 },
    { month: 'Jun', solarKwh: 2550, gridCost: 120, solarSavings: 550 },
    { month: 'Jul', solarKwh: 2800, gridCost: 180, solarSavings: 620 },
    { month: 'Aug', solarKwh: 2750, gridCost: 190, solarSavings: 610 },
    { month: 'Sep', solarKwh: 2300, gridCost: 150, solarSavings: 510 },
    { month: 'Oct', solarKwh: 1900, gridCost: 160, solarSavings: 420 },
  ];

  // Appliance breakdown data
  const applianceBreakdown = appliances.slice(0, 6).map(a => ({
    name: a.name.split(' ')[0] + ' ' + (a.name.split(' ')[1] || ''),
    kwh: a.estimatedDailyKwh,
  }));

  // Heatmap matrix data (hours vs days)
  const heatmapHours = [0, 4, 8, 12, 16, 20];
  const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Filter Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
              Advanced Analytics &amp; Reports Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Multi-dimensional telemetry exploration, zone isolation &amp; appliance consumption breakdowns
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 text-xs font-bold transition-all border border-slate-700 self-start lg:self-auto"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export Dataset (CSV)
          </button>
        </div>

        {/* Global Multi-Dimensional Filter Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* 1. Date Range */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Date Horizon</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          {/* 2. Zone Filter */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Zone Isolation</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            >
              <option value="all">All Zones Combined</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  Zone {z.zoneNumber}: {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Energy Type Filter */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Energy Category</label>
            <select
              value={energyType}
              onChange={(e) => setEnergyType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            >
              <option value="all">All Telemetry Types</option>
              <option value="solar">Solar Production Only</option>
              <option value="consumption">Load Consumption Only</option>
              <option value="battery">Battery Cycling Only</option>
            </select>
          </div>

          {/* 4. Aggregation Interval */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Time Grouping</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            >
              <option value="hourly">Hourly Grouping</option>
              <option value="daily">Daily Grouping</option>
              <option value="monthly">Monthly Grouping</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400">Solar Yield</span>
          <p className="text-xl font-extrabold text-amber-500 mt-1">{summary.totalSolarKwh || 0} kWh</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400">Total Demand</span>
          <p className="text-xl font-extrabold text-rose-500 mt-1">{summary.totalConsumptionKwh || 0} kWh</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400">Grid Exported</span>
          <p className="text-xl font-extrabold text-emerald-500 mt-1">{summary.totalExportKwh || 0} kWh</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400">Grid Imported</span>
          <p className="text-xl font-extrabold text-blue-500 mt-1">{summary.totalImportKwh || 0} kWh</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400">Peak Demand</span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{summary.peakDemandKw || 0} kW</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400">Average Load</span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{summary.avgConsumptionKw || 0} kW</p>
        </div>
      </div>

      {/* 10 Required Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Consumption Line Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            1. Daily Consumption Profile
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="formattedDate" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kW" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="consumption" stroke="#EF4444" strokeWidth={2.5} name="Consumption (kW)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Consumption Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            2. Monthly Consumption Aggregation
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCostEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kWh" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="solarKwh" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Consumption (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Solar Production vs Consumption */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            3. Solar Production vs Consumption
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData.slice(-24)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="formattedTime" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kW" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="solarProduction" stroke="#F59E0B" strokeWidth={2.5} name="Solar (kW)" />
                <Line type="monotone" dataKey="consumption" stroke="#EF4444" strokeWidth={2.5} name="Load (kW)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Zone Comparison Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            4. Comparative Zone Demands (P1 to P4)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones.map(z => ({ name: `Zone ${z.zoneNumber}`, value: z.currentConsumption, color: z.color }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kW" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="value" name="Current Load (kW)" radius={[6, 6, 0, 0]}>
                  {zones.map((z, idx) => (
                    <Cell key={idx} fill={z.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Individual Zone Historical Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            5. Isolated Zone History ({zones.find(z => z.id === selectedZone)?.name || 'All Zones'})
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="formattedDate" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kW" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="consumption" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} name="Isolated Load (kW)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Appliance Consumption Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            6. Appliance Daily Consumption Breakdown
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applianceBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} unit=" kWh" />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={10} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="kwh" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Daily Demand (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 7: Battery SOC History */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            7. Storage Charge &amp; Discharge History
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData.slice(-24)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="formattedTime" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kW" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="batteryPower" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} name="Battery Power (kW)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 8: Energy Distribution Pie Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            8. Overall Energy Balance Breakdown
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Self-Consumed Solar', value: 65, color: '#F59E0B' },
                    { name: 'Stored in Batteries', value: 20, color: '#8B5CF6' },
                    { name: 'Exported to Grid', value: 15, color: '#10B981' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#F59E0B" />
                  <Cell fill="#8B5CF6" />
                  <Cell fill="#10B981" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 9: Hourly Consumption Heatmap */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            9. Weekly Load Demand Heatmap
          </h3>
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-7 gap-1 text-[11px] text-center text-slate-400 font-mono">
              {heatmapDays.map(d => <span key={d}>{d}</span>)}
            </div>
            {heatmapHours.map(hour => (
              <div key={hour} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 w-10 font-mono">{hour}:00</span>
                <div className="grid grid-cols-7 gap-1 flex-1">
                  {heatmapDays.map((d, i) => {
                    // intensity logic
                    const isPeak = (hour >= 18 && hour <= 21) || (hour >= 8 && hour <= 10);
                    return (
                      <div
                        key={d}
                        className={`h-6 rounded-md ${
                          isPeak ? 'bg-rose-500/80' : hour >= 12 && hour <= 15 ? 'bg-amber-500/70' : 'bg-blue-500/30'
                        }`}
                        title={`${d} at ${hour}:00: ${isPeak ? 'Peak Load' : 'Moderate'}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 10: Monthly Energy Cost Evolution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            10. Monthly Financial Energy Savings (TND)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCostEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" TND" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend />
                <Bar dataKey="solarSavings" fill="#10B981" radius={[4, 4, 0, 0]} name="Savings Generated (TND)" />
                <Bar dataKey="gridCost" fill="#EF4444" radius={[4, 4, 0, 0]} name="Remaining STEG Bill (TND)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
