import React, { useState, useEffect } from 'react';
import {
  Coins,
  ArrowUpRight,
  ShieldCheck,
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/ui/StatCard';

export const EnergyTradingPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form settings state
  const [autoSell, setAutoSell] = useState(true);
  const [price, setPrice] = useState(0.250);
  const [minReserve, setMinReserve] = useState(30);
  const [threshold, setThreshold] = useState(1.0);

  const fetchStats = async () => {
    try {
      const res = await api.getTradingStats();
      setStats(res);
      setAutoSell(res.autoSellEnabled);
      setPrice(res.configuredSellPriceTnd);
      setMinReserve(res.minBatteryReservePct);
      setThreshold(res.exportThresholdKw);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateTradingSettings({
        autoSellEnabled: autoSell,
        sellPriceTnd: Number(price),
        minBatteryReservePct: Number(minReserve),
        exportThresholdKw: Number(threshold),
      });
      await fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#101B2D] to-slate-900 border border-emerald-900/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Simulated Energy Trading Market</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Surplus solar feed-in dispatch, dynamic tariff monetization &amp; utility credit tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Active Feed-in Tariff: {price.toFixed(3)} TND / kWh</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current Export Power"
          value={stats?.currentExportPowerKw ?? 0.0}
          unit="kW"
          trend="up"
          trendValue={`~${stats?.currentRevenuePerHourTnd ?? 0} TND/h`}
          comparison="Dynamic feed-in"
          icon={ArrowUpRight}
          iconColor="text-emerald-500"
          glowColor="green"
        />

        <StatCard
          title="Today Exported"
          value={stats?.todayExportedKwh ?? 16.4}
          unit="kWh"
          trend="up"
          trendValue={`+${stats?.todayRevenueTnd ?? 4.10} TND`}
          comparison="Generated revenue"
          icon={Coins}
          iconColor="text-amber-500"
          glowColor="solar"
        />

        <StatCard
          title="Monthly Exported"
          value={stats?.monthlyExportedKwh ?? 248.5}
          unit="kWh"
          trend="up"
          trendValue={`+${stats?.monthlyRevenueTnd ?? 62.12} TND`}
          comparison="Current month"
          icon={TrendingUp}
          iconColor="text-blue-500"
          glowColor="blue"
        />

        <StatCard
          title="All-Time Cumulative"
          value={stats?.totalExportedKwh ?? 1240.0}
          unit="kWh"
          trend="up"
          trendValue={`+${stats?.totalRevenueTnd ?? 310.0} TND`}
          comparison="STEG credits credited"
          icon={DollarSign}
          iconColor="text-emerald-400"
          glowColor="green"
        />
      </div>

      {/* Configuration & Trading Policy Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Trading Parameters
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">Policy Rules</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {/* Auto sell toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Auto-Selling Surplus</p>
                <p className="text-slate-400 text-[11px]">Sell only after active loads are 100% supplied</p>
              </div>
              <input
                type="checkbox"
                checked={autoSell}
                onChange={(e) => setAutoSell(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Feed-In Selling Price (TND / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">Official STEG residential surplus reference: 0.250 TND</p>
            </div>

            {/* Min Reserve */}
            <div>
              <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>Minimum Battery Reserve</span>
                <span className="text-purple-500 font-bold">{minReserve}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={minReserve}
                onChange={(e) => setMinReserve(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Never sell storage energy below this safety margin.</p>
            </div>

            {/* Threshold */}
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Minimum Export Surplus Threshold (kW)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/30"
            >
              {savingSettings ? 'Updating...' : 'Save Market Policy'}
            </button>
          </form>
        </div>

        {/* Transactions Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Recent Simulated Export Transactions
              </h3>
              <p className="text-xs text-slate-400">Real-time ledger of exported surplus electricity batches</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
              Audit Verified
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Energy Exported</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3">Credit Earned</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {(!stats?.recentTransactions || stats.recentTransactions.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No export transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentTransactions.slice(0, 8).map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {new Date(tx.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {tx.energyKwh} kWh
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {tx.pricePerKwh.toFixed(3)} TND
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-500">
                        +{tx.totalAmountTnd.toFixed(3)} TND
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
            <strong>Simulation Notice:</strong> All grid feed-in operations and monetary credits are simulated based on the configured STEG solar self-consumption surplus framework. No actual financial payments or physical grid injections are executed.
          </div>
        </div>
      </div>
    </div>
  );
};
