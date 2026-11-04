import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  TrendingUp,
  Sun,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  Battery,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';

export const SolarSavingsPage: React.FC = () => {
  const [monthlyCons, setMonthlyCons] = useState<number>(1250);
  const [monthlySolar, setMonthlySolar] = useState<number>(1800);
  const [systemCost, setSystemCost] = useState<number>(29500);
  const [contractedPower, setContractedPower] = useState<number>(6.0);

  const [comparison, setComparison] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await api.getSolarSavingsComparison({
        monthlyConsumptionKwh: monthlyCons,
        monthlySolarProductionKwh: monthlySolar,
        systemCostTnd: systemCost,
        powerKva: contractedPower,
      });
      setComparison(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [monthlyCons, monthlySolar, systemCost, contractedPower]);

  const chartData = comparison ? [
    {
      name: 'Grid Only',
      billTnd: comparison.scenarioGridOnly.totalBillTtcTnd,
      annualCost: comparison.scenarioGridOnly.annualBillTtcTnd,
    },
    {
      name: 'Solar + Storage',
      billTnd: comparison.scenarioWithSolar.totalBillTtcTnd,
      annualCost: comparison.scenarioWithSolar.netAnnualCostTnd,
    },
  ] : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#101B2D] to-slate-900 border border-emerald-900/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Solar Financial Savings &amp; ROI Simulator</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Financial comparison between 100% grid dependence vs intelligent photovoltaic + storage deployment
              </p>
            </div>
          </div>
        </div>

        {comparison && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <span className="text-[11px] uppercase font-bold text-slate-400">Estimated STEG Bill Reduction</span>
            <p className="text-3xl font-extrabold text-emerald-400 mt-0.5">
              {comparison.billReductionPercent}%
            </p>
          </div>
        )}
      </div>

      {/* Interactive Controls & Scenario Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-emerald-500" />
            Installation &amp; Consumption Inputs
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1 text-slate-700 dark:text-slate-300">
                <span>Monthly Electricity Demand</span>
                <strong className="text-rose-500">{monthlyCons} kWh/mo</strong>
              </div>
              <input
                type="range"
                min="300"
                max="3000"
                step="50"
                value={monthlyCons}
                onChange={(e) => setMonthlyCons(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-slate-700 dark:text-slate-300">
                <span>Monthly Solar Generation</span>
                <strong className="text-amber-500">{monthlySolar} kWh/mo</strong>
              </div>
              <input
                type="range"
                min="500"
                max="3500"
                step="50"
                value={monthlySolar}
                onChange={(e) => setMonthlySolar(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-slate-700 dark:text-slate-300">
                <span>Turnkey Solar + BESS Cost</span>
                <strong className="text-blue-500">{systemCost} TND</strong>
              </div>
              <input
                type="range"
                min="10000"
                max="60000"
                step="1000"
                value={systemCost}
                onChange={(e) => setSystemCost(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Contracted Power Subscribed
              </label>
              <select
                value={contractedPower}
                onChange={(e) => setContractedPower(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
              >
                <option value={4}>4 kVA (Standard)</option>
                <option value={6}>6 kVA (Residential Pro)</option>
                <option value={10}>10 kVA (Heavy Domestic)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Columns */}
        <div className="lg:col-span-8 space-y-6">
          {comparison && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Scenario 1: Grid Only */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-rose-200 dark:border-rose-950 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                    SCENARIO 1: GRID ONLY
                  </span>
                  <Zap className="w-4 h-4 text-rose-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  100% Utility Dependency
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Monthly Billed Energy</span>
                    <strong className="text-slate-900 dark:text-white">{comparison.scenarioGridOnly.billedKwh} kWh</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Estimated Monthly STEG Bill</span>
                    <strong className="text-rose-500 font-mono text-base">{comparison.scenarioGridOnly.totalBillTtcTnd} TND</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Annual Electricity Expenditure</span>
                    <strong className="text-rose-500 font-mono text-base">{comparison.scenarioGridOnly.annualBillTtcTnd} TND</strong>
                  </div>
                </div>
              </div>

              {/* Scenario 2: Solar + Storage */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-emerald-500/40 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                    SCENARIO 2: SOLAR + BESS
                  </span>
                  <Sun className="w-4 h-4 text-emerald-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Intelligent Microgrid Powered
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Net Grid Energy Billed</span>
                    <strong className="text-emerald-500">{comparison.scenarioWithSolar.billedKwh} kWh</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Monthly STEG Residual Bill</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-base">{comparison.scenarioWithSolar.totalBillTtcTnd} TND</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Annual Feed-In Credit Earned</span>
                    <strong className="text-emerald-400 font-mono text-base">+{comparison.scenarioWithSolar.annualExportRevenueTnd} TND</strong>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Net Annual Operating Cost</span>
                    <strong className="text-emerald-500 font-mono text-base">{comparison.scenarioWithSolar.netAnnualCostTnd} TND</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ROI Metric Cards */}
          {comparison && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-slate-500">Net Monthly Savings</span>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{comparison.monthlySavingsTnd} TND
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-slate-500">Net Annual Savings</span>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{comparison.annualSavingsTnd} TND
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <span className="text-slate-500">Estimated Payback Period (ROI)</span>
                <p className="text-2xl font-extrabold text-blue-600 dark:text-cyan-400 mt-1">
                  {comparison.paybackPeriodYears} Years
                </p>
              </div>
            </div>
          )}

          {/* Visual Bar Comparison Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Annual Utility Expenditure Comparison (TND)
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} unit=" TND" />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                  <Bar dataKey="annualCost" fill="#10B981" radius={[6, 6, 0, 0]} name="Annual Cost (TND)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
