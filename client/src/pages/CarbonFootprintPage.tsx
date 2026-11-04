import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Sun,
  ShieldCheck,
  TrendingUp,
  TreeDeciduous,
  Car,
  Fuel,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { useSystem } from '../context/SystemContext';

export const CarbonFootprintPage: React.FC = () => {
  const { kpis, settings } = useSystem();

  // Carbon metrics
  const co2Factor = settings?.co2FactorKgPerKwh || 0.580; // kg CO2 / kWh
  const totalSolarYield = 14850; // simulated cumulative solar kWh
  const totalCo2AvoidedKg = totalSolarYield * co2Factor;
  const totalCo2AvoidedTons = (totalCo2AvoidedKg / 1000).toFixed(2);
  const treesEquivalent = Math.round(totalCo2AvoidedKg / 22); // ~22kg CO2 per tree/year
  const carKmEquivalent = Math.round(totalCo2AvoidedKg * 8.5); // ~118g CO2/km

  const monthlyFootprintData = [
    { month: 'May', co2AvoidedKg: 1276, solarKwh: 2200 },
    { month: 'Jun', co2AvoidedKg: 1479, solarKwh: 2550 },
    { month: 'Jul', co2AvoidedKg: 1624, solarKwh: 2800 },
    { month: 'Aug', co2AvoidedKg: 1595, solarKwh: 2750 },
    { month: 'Sep', co2AvoidedKg: 1334, solarKwh: 2300 },
    { month: 'Oct', co2AvoidedKg: 1102, solarKwh: 1900 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#101B2D] to-slate-900 border border-emerald-900/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Environmental Impact &amp; Carbon Offset</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Quantified greenhouse gas abatement based on Tunisian grid carbon intensity ({co2Factor} kg CO₂ / kWh)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Tunisia STEG Emission Factor: {co2Factor} kg CO₂/kWh</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="CO₂ Emissions Avoided"
          value={totalCo2AvoidedTons}
          unit="Tons"
          trend="up"
          trendValue={`${totalCo2AvoidedKg.toFixed(0)} kg`}
          comparison="Cumulative lifetime"
          icon={Leaf}
          iconColor="text-emerald-500"
          glowColor="green"
        />

        <StatCard
          title="Solar Energy Harnessed"
          value={(totalSolarYield / 1000).toFixed(1)}
          unit="MWh"
          trend="up"
          trendValue="18 kWp Array"
          comparison="Clean kWh generated"
          icon={Sun}
          iconColor="text-amber-500"
          glowColor="solar"
        />

        <StatCard
          title="Forest Tree Equivalent"
          value={treesEquivalent}
          unit="Trees"
          trend="up"
          trendValue="Annual Absorption"
          comparison="Equiv. carbon sink"
          icon={TreeDeciduous}
          iconColor="text-emerald-400"
          glowColor="green"
        />

        <StatCard
          title="Vehicle Offset"
          value={(carKmEquivalent / 1000).toFixed(0)}
          unit="k km"
          trend="up"
          trendValue="Gasoline Avoided"
          comparison="Passenger vehicle km"
          icon={Car}
          iconColor="text-blue-500"
          glowColor="blue"
        />
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Monthly CO₂ Emissions Avoided (kg CO₂)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFootprintData}>
                <defs>
                  <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kg" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="co2AvoidedKg" stroke="#10B981" strokeWidth={2.5} fill="url(#co2Grad)" name="CO2 Avoided (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental Indicators Table */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Renewable Integration &amp; Decarbonization Ratios
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Renewable Energy Self-Sufficiency</p>
                <p className="text-slate-400 text-[11px]">Percentage of total electrical demand met via on-site solar + BESS</p>
              </div>
              <strong className="text-lg font-extrabold text-emerald-500">74.2%</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Grid Utility Dependence</p>
                <p className="text-slate-400 text-[11px]">Fraction of load requiring utility thermal imports</p>
              </div>
              <strong className="text-lg font-extrabold text-blue-500">25.8%</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Green Energy Export Ratio</p>
                <p className="text-slate-400 text-[11px]">Surplus clean power injected into national grid</p>
              </div>
              <strong className="text-lg font-extrabold text-amber-500">18.5%</strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic text-center">
            * Estimates calculated using ANME (Agence Nationale pour la Maîtrise de l'Énergie) benchmark factors for Tunisia.
          </p>
        </div>
      </div>
    </div>
  );
};
