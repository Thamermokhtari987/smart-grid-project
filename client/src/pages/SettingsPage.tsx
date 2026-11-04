import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  ShieldCheck,
  Globe,
  Zap,
  Battery,
  Layers,
  Receipt,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { SystemSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [platformName, setPlatformName] = useState('');
  const [currency, setCurrency] = useState('TND');
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Africa/Tunis');
  const [operatingMode, setOperatingMode] = useState<'AUTOMATIC' | 'MANUAL' | 'ECO'>('AUTOMATIC');
  const [defaultSolarCapacity, setDefaultSolarCapacity] = useState(18.0);
  const [sellPriceTnd, setSellPriceTnd] = useState(0.250);
  const [minBatteryReservePct, setMinBatteryReservePct] = useState(30.0);
  const [exportThresholdKw, setExportThresholdKw] = useState(1.0);
  const [co2Factor, setCo2Factor] = useState(0.580);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);

  const fetchSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res);
      setPlatformName(res.platformName);
      setCurrency(res.currency);
      setLanguage(res.language);
      setTimezone(res.timezone);
      setOperatingMode(res.operatingMode);
      setDefaultSolarCapacity(res.defaultSolarCapacity);
      setSellPriceTnd(res.sellPriceTnd);
      setMinBatteryReservePct(res.minBatteryReservePct);
      setExportThresholdKw(res.exportThresholdKw);
      setCo2Factor(res.co2FactorKgPerKwh);
      setSimulationSpeed(res.simulationSpeed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateSettings({
        platformName,
        currency,
        language,
        timezone,
        operatingMode,
        defaultSolarCapacity: Number(defaultSolarCapacity),
        sellPriceTnd: Number(sellPriceTnd),
        minBatteryReservePct: Number(minBatteryReservePct),
        exportThresholdKw: Number(exportThresholdKw),
        co2FactorKgPerKwh: Number(co2Factor),
        simulationSpeed: Number(simulationSpeed),
      });
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            Global Platform Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tunisian STEG tariff parameters, microgrid operating thresholds, and simulation parameters
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            Settings Saved Successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              1. General &amp; Localization Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Operational Currency
              </label>
              <input
                type="text"
                value={currency}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 font-mono text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Interface Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
              >
                <option value="English">English</option>
                <option value="Français">Français (STEG)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Local Timezone
              </label>
              <input
                type="text"
                value={timezone}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 font-mono text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Energy & Smart Distribution Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              2. Energy Generation &amp; Distribution Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nominal Solar Peak Array (kWp)
              </label>
              <input
                type="number"
                step="0.5"
                value={defaultSolarCapacity}
                onChange={(e) => setDefaultSolarCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Default Operating Dispatch Mode
              </label>
              <select
                value={operatingMode}
                onChange={(e) => setOperatingMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
              >
                <option value="AUTOMATIC">AUTOMATIC (Dynamic Shedding)</option>
                <option value="ECO">ECO (Pre-Reduction First)</option>
                <option value="MANUAL">MANUAL (Operator Override)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tunisia CO₂ Grid Factor (kg CO₂ / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={co2Factor}
                onChange={(e) => setCo2Factor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Battery & Trading Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Battery className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              3. Battery Storage &amp; Market Feed-In Policies
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Min Battery Reserve Before Selling (%)
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={minBatteryReservePct}
                onChange={(e) => setMinBatteryReservePct(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Feed-In Selling Price (TND / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={sellPriceTnd}
                onChange={(e) => setSellPriceTnd(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Min Export Trigger Threshold (kW)
              </label>
              <input
                type="number"
                step="0.5"
                value={exportThresholdKw}
                onChange={(e) => setExportThresholdKw(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Simulation Engine Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              4. Simulation Laboratory Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Simulation Clock Multiplier (Speed): {simulationSpeed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400">
              Random variation engine: Reproducible pseudo-random solar radiation perturbations seeded.
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            Save All Configurations
          </button>
        </div>
      </form>
    </div>
  );
};
