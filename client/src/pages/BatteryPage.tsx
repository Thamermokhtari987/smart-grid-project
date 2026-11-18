import React, { useState, useEffect } from 'react';
import {
  BatteryCharging,
  BatteryMedium,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Play,
  RotateCcw,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { Battery } from '../types';
import { Modal } from '../components/ui/Modal';
import { useLanguage } from '../context/LanguageContext';

export const BatteryPage: React.FC = () => {
  const { t } = useLanguage();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Simulation test amount
  const [simAmountKw, setSimAmountKw] = useState(2.5);

  // Edit config state
  const [editCapacity, setEditCapacity] = useState(20);
  const [editMinSoc, setEditMinSoc] = useState(20);
  const [editMaxSoc, setEditMaxSoc] = useState(98);
  const [editPriority, setEditPriority] = useState(1);
  const [editMaxChargeRate, setEditMaxChargeRate] = useState(6);
  const [editMaxDischargeRate, setEditMaxDischargeRate] = useState(6);

  const fetchBatteries = async () => {
    try {
      const res = await api.getBatteries();
      setBatteries(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatteries();
    const interval = setInterval(fetchBatteries, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateAction = async (b: Battery, action: 'CHARGE' | 'DISCHARGE') => {
    try {
      const updated = await api.simulateBatteryAction(b.id, action, simAmountKw);
      setBatteries(prev => prev.map(item => item.id === b.id ? updated : item));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenConfig = (b: Battery) => {
    setSelectedBattery(b);
    setEditCapacity(b.capacity);
    setEditMinSoc(b.minSoc);
    setEditMaxSoc(b.maxSoc);
    setEditPriority(b.priority);
    setEditMaxChargeRate(b.maxChargeKw);
    setEditMaxDischargeRate(b.maxDischargeKw);
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBattery) return;
    try {
      const updated = await api.updateBattery(selectedBattery.id, {
        capacity: Number(editCapacity),
        minSoc: Number(editMinSoc),
        maxSoc: Number(editMaxSoc),
        priority: Number(editPriority),
        maxChargeKw: Number(editMaxChargeRate),
        maxDischargeKw: Number(editMaxDischargeRate),
      });
      setBatteries(prev => prev.map(item => item.id === selectedBattery.id ? updated : item));
      setIsConfigModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Mock historical SOC telemetry
  const socHistory = [
    { time: '00:00', B1: 95, B2: 70, B3: 45 },
    { time: '04:00', B1: 82, B2: 60, B3: 35 },
    { time: '08:00', B1: 72, B2: 50, B3: 28 },
    { time: '11:00', B1: 88, B2: 64, B3: 38 },
    { time: '14:00', B1: 98, B2: 85, B3: 55 },
    { time: '17:00', B1: 95, B2: 78, B3: 50 },
    { time: '20:00', B1: 90, B2: 70, B3: 45 },
    { time: '23:00', B1: 95, B2: 70, B3: 45 },
  ];

  // Comparison data
  const comparisonData = batteries.map(b => ({
    name: `Bank ${b.batteryNumber}`,
    capacity: b.capacity,
    stored: b.storedEnergy,
    available: b.availableEnergy,
    soh: b.soh,
  }));

  const totalCapacity = batteries.reduce((s, b) => s + b.capacity, 0);
  const totalStored = batteries.reduce((s, b) => s + b.storedEnergy, 0);
  const totalAvailable = batteries.reduce((s, b) => s + b.availableEnergy, 0);

  const getStatusLabel = (status: string) => {
    if (status === 'CHARGING') return t('status_charging');
    if (status === 'DISCHARGING') return t('status_discharging');
    return t('status_idle');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BatteryCharging className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            {t('batteries_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('batteries_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-300">
            {t('stored_energy')}: {totalStored.toFixed(1)} / {totalCapacity} kWh
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-300">
            {t('usable_energy')}: {totalAvailable.toFixed(1)} kWh
          </div>
        </div>
      </div>

      {/* 3 Distinct Battery Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {batteries.map((b) => {
          const stored = parseFloat((b.capacity * b.soc / 100).toFixed(2));
          const available = parseFloat(Math.max(0, (b.capacity * (b.soc - b.minSoc) / 100)).toFixed(2));

          return (
            <div
              key={b.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between hover:border-purple-500/50 transition-all duration-200"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 uppercase tracking-wider">
                      {t('priority_critical').split(' ')[0]} P{b.priority}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1.5">
                      {b.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      b.chargingStatus === 'CHARGING'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                        : b.chargingStatus === 'DISCHARGING'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    ● {getStatusLabel(b.chargingStatus)}
                  </span>
                </div>

                {/* Big SOC Gauge */}
                <div className="mt-5 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                      {b.soc.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5 font-semibold">SOC</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-500">
                    SOH: {b.soh}%
                  </span>
                </div>

                {/* Visual SOC Progress bar with reserve cutoff markers */}
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 relative overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
                    style={{ width: `${b.soc}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>Min: {b.minSoc}%</span>
                  <span>Max: {b.maxSoc}%</span>
                </div>

                {/* Mathematical Formula breakdown table */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">{t('battery_capacity')}</span>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {b.capacity} kWh
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">{t('stored_energy')}</span>
                    <p className="text-base font-extrabold text-purple-500 mt-0.5">
                      {stored} kWh
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">{t('usable_energy')}</span>
                    <p className="text-base font-extrabold text-emerald-500 mt-0.5">
                      {available} kWh
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">{t('battery_max_charge')}</span>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {b.maxChargeKw} kW
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulation Testing Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulateAction(b, 'CHARGE')}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all border border-emerald-500/20 flex items-center justify-center gap-1"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {t('sim_charge')}
                  </button>
                  <button
                    onClick={() => handleSimulateAction(b, 'DISCHARGE')}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all border border-amber-500/20 flex items-center justify-center gap-1"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {t('sim_discharge')}
                  </button>
                </div>

                <button
                  onClick={() => handleOpenConfig(b)}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t('configure_battery')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Battery Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOC Evolution Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('chart_2_title')}
              </h3>
              <p className="text-xs text-slate-400">24-hour cycle progression across Battery 1, 2, and 3</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={socHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="B1" stroke="#8B5CF6" strokeWidth={2.5} name={`${t('battery_1_name')} (20kWh)`} />
                <Line type="monotone" dataKey="B2" stroke="#3B82F6" strokeWidth={2.5} name={`${t('battery_2_name')} (15kWh)`} />
                <Line type="monotone" dataKey="B3" stroke="#10B981" strokeWidth={2.5} name={`${t('battery_3_name')} (10kWh)`} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Battery Capacity & Usable Reserve Comparison */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('stored_energy')} vs {t('usable_energy')}
              </h3>
              <p className="text-xs text-slate-400">Total stored vs energy above minimum reserve threshold</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} unit=" kWh" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Bar dataKey="capacity" fill="#475569" radius={[4, 4, 0, 0]} name={t('battery_capacity')} />
                <Bar dataKey="stored" fill="#8B5CF6" radius={[4, 4, 0, 0]} name={t('stored_energy')} />
                <Bar dataKey="available" fill="#10B981" radius={[4, 4, 0, 0]} name={t('usable_energy')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Battery Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={`${t('configure_battery')}: ${selectedBattery?.name}`}
        subtitle={t('batteries_subtitle')}
      >
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('battery_capacity')} (kWh)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={editCapacity}
                onChange={(e) => setEditCapacity(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('priority_critical').split(' ')[0]} (1-3)
              </label>
              <input
                type="number"
                min="1"
                max="3"
                value={editPriority}
                onChange={(e) => setEditPriority(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('setting_battery_min_soc')}
              </label>
              <input
                type="number"
                min="10"
                max="50"
                value={editMinSoc}
                onChange={(e) => setEditMinSoc(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Maximum Cutoff SOC (%)
              </label>
              <input
                type="number"
                min="80"
                max="100"
                value={editMaxSoc}
                onChange={(e) => setEditMaxSoc(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('battery_max_charge')}
              </label>
              <input
                type="number"
                step="0.5"
                value={editMaxChargeRate}
                onChange={(e) => setEditMaxChargeRate(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('battery_max_discharge')}
              </label>
              <input
                type="number"
                step="0.5"
                value={editMaxDischargeRate}
                onChange={(e) => setEditMaxDischargeRate(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
