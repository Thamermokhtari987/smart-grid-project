import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Edit2,
  Activity,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  HelpCircle,
  Clock,
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
} from 'recharts';
import { api } from '../services/api';
import { Appliance, Zone } from '../types';
import { Modal } from '../components/ui/Modal';
import { useLanguage } from '../context/LanguageContext';

export const AppliancePage: React.FC = () => {
  const { t } = useLanguage();
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null);
  const [agingSimulationResult, setAgingSimulationResult] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cooling',
    zoneId: '',
    nominalPower: 1200,
    dailyHours: 8,
    operatingFreq: 1,
    ageYears: 2,
    efficiency: 92,
    energyClass: 'A++',
    degradationRate: 1.5,
    maintenanceCondition: 'Good',
  });

  // Aging Simulation controls
  const [simYears, setSimYears] = useState(5);
  const [simDegradationRate, setSimDegradationRate] = useState(2.0);
  const [simCondition, setSimCondition] = useState('Good');
  const [simUsageIntensity, setSimUsageIntensity] = useState(1.0);

  const fetchData = async () => {
    try {
      const [appRes, zRes] = await Promise.all([api.getAppliances(), api.getZones()]);
      setAppliances(appRes);
      setZones(zRes);
      if (zRes.length > 0 && !formData.zoneId) {
        setFormData(prev => ({ ...prev, zoneId: zRes[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAppliance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAppliance(formData);
      setAppliances(prev => [...prev, created]);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        category: 'Cooling',
        zoneId: zones[0]?.id || '',
        nominalPower: 1200,
        dailyHours: 8,
        operatingFreq: 1,
        ageYears: 2,
        efficiency: 92,
        energyClass: 'A++',
        degradationRate: 1.5,
        maintenanceCondition: 'Good',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAppliance = async (id: string) => {
    try {
      await api.deleteAppliance(id);
      setAppliances(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAgingSimulation = async (app: Appliance) => {
    setSelectedAppliance(app);
    setSimYears(5);
    setSimDegradationRate(app.degradationRate || 2.0);
    setSimCondition(app.maintenanceCondition || 'Good');
    setSimUsageIntensity(1.0);
    setIsAgingModalOpen(true);
    await runAgingSimulation(app.id, 5, app.degradationRate || 2.0, app.maintenanceCondition || 'Good', 1.0);
  };

  const runAgingSimulation = async (
    applianceId: string,
    years: number,
    degRate: number,
    condition: string,
    intensity: number
  ) => {
    try {
      const result = await api.simulateApplianceAging(applianceId, {
        simulationYears: years,
        annualEfficiencyDegradation: degRate,
        maintenanceCondition: condition,
        usageIntensity: intensity,
      });
      setAgingSimulationResult(result);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAppliances = selectedZoneFilter === 'ALL'
    ? appliances
    : appliances.filter(a => a.zoneId === selectedZoneFilter);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            {t('appliances_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('appliances_subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t('add_appliance')}
        </button>
      </div>

      {/* Zone Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedZoneFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedZoneFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {t('all')} ({appliances.length})
        </button>
        {zones.map(z => (
          <button
            key={z.id}
            onClick={() => setSelectedZoneFilter(z.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedZoneFilter === z.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
            Zone {z.zoneNumber}: {z.name}
          </button>
        ))}
      </div>

      {/* Appliance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAppliances.map((app) => {
          const zoneObj = zones.find(z => z.id === app.zoneId);
          const percentOver = app.baselineKwh > 0
            ? Math.round(((app.estimatedDailyKwh - app.baselineKwh) / app.baselineKwh) * 100)
            : 0;

          return (
            <div
              key={app.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-500/40 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {app.category}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                      {app.name}
                    </h3>
                  </div>

                  <span className="px-2 py-1 rounded-lg text-xs font-extrabold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {app.energyClass}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zoneObj?.color || '#3B82F6' }} />
                  <span>{zoneObj ? `${zoneObj.name} (P${zoneObj.priorityLevel})` : t('all')}</span>
                </div>

                {/* Energy Numbers */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">{t('appliance_nominal_power')}</span>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {app.nominalPower} W
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">{t('appliance_daily_hours')}</span>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {app.dailyHours} h / {t('filter_today')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">{t('monitoring_total_daily')}</span>
                    <p className="text-base font-extrabold text-blue-600 dark:text-cyan-400 mt-0.5">
                      {app.estimatedDailyKwh} kWh
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">{t('metric_panel_efficiency')}</span>
                    <p className="text-base font-extrabold text-emerald-500 mt-0.5">
                      {app.efficiency}%
                    </p>
                  </div>
                </div>

                {/* Aging indicator */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('appliance_age_years')}: {app.ageYears} ({app.maintenanceCondition})</span>
                  {percentOver > 0 ? (
                    <span className="font-semibold text-rose-500">
                      +{percentOver}% ({t('appliance_aging_factor')})
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-500">
                      {t('status_normal')}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleOpenAgingSimulation(app)}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-900/50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  {t('consumption_evolution')}
                </button>

                <button
                  onClick={() => handleDeleteAppliance(app.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title={t('delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Appliance Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('add_appliance')}
        subtitle={t('appliances_subtitle')}
      >
        <form onSubmit={handleCreateAppliance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {t('appliance_name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('appliance_name')}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('appliance_category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Cooling">{t('cat_cooling')}</option>
                <option value="HVAC">{t('cat_hvac')}</option>
                <option value="Computing">{t('cat_it')}</option>
                <option value="Kitchen">{t('cat_cooking')}</option>
                <option value="Lighting">{t('cat_lighting')}</option>
                <option value="EV">{t('cat_ev')}</option>
                <option value="Multimedia">{t('cat_multimedia')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('appliance_zone')}
              </label>
              <select
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {zones.map(z => (
                  <option key={z.id} value={z.id}>
                    Zone {z.zoneNumber}: {z.name} (P{z.priorityLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('appliance_nominal_power')} (W)
              </label>
              <input
                type="number"
                min="10"
                value={formData.nominalPower}
                onChange={(e) => setFormData({ ...formData, nominalPower: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('appliance_daily_hours')}
              </label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                max="24"
                value={formData.dailyHours}
                onChange={(e) => setFormData({ ...formData, dailyHours: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Classe Énergie
              </label>
              <select
                value={formData.energyClass}
                onChange={(e) => setFormData({ ...formData, energyClass: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="A+++">A+++</option>
                <option value="A++">A++</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('appliance_age_years')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.ageYears}
                onChange={(e) => setFormData({ ...formData, ageYears: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('metric_panel_efficiency')} (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={formData.efficiency}
                onChange={(e) => setFormData({ ...formData, efficiency: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                État
              </label>
              <select
                value={formData.maintenanceCondition}
                onChange={(e) => setFormData({ ...formData, maintenanceCondition: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Bon / Good</option>
                <option value="Fair">Moyen / Fair</option>
                <option value="Poor">Usé / Poor</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Consumption Evolution & Aging Simulation Modal */}
      <Modal
        isOpen={isAgingModalOpen}
        onClose={() => setIsAgingModalOpen(false)}
        title={`${t('consumption_evolution')}: ${selectedAppliance?.name}`}
        subtitle={t('appliances_subtitle')}
        maxWidth="max-w-4xl"
      >
        {agingSimulationResult && (
          <div className="space-y-6">
            {/* Interactive Control Sliders */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Horizon: {simYears} Yrs
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={simYears}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setSimYears(y);
                    if (selectedAppliance) runAgingSimulation(selectedAppliance.id, y, simDegradationRate, simCondition, simUsageIntensity);
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t('appliance_aging_factor')}: {simDegradationRate}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={simDegradationRate}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setSimDegradationRate(r);
                    if (selectedAppliance) runAgingSimulation(selectedAppliance.id, simYears, r, simCondition, simUsageIntensity);
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Condition
                </label>
                <select
                  value={simCondition}
                  onChange={(e) => {
                    const c = e.target.value;
                    setSimCondition(c);
                    if (selectedAppliance) runAgingSimulation(selectedAppliance.id, simYears, simDegradationRate, c, simUsageIntensity);
                  }}
                  className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Bon</option>
                  <option value="Fair">Moyen</option>
                  <option value="Poor">Dégradé</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Intensité: {simUsageIntensity}x
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={simUsageIntensity}
                  onChange={(e) => {
                    const i = Number(e.target.value);
                    setSimUsageIntensity(i);
                    if (selectedAppliance) runAgingSimulation(selectedAppliance.id, simYears, simDegradationRate, simCondition, i);
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Smart Recommendation Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                agingSimulationResult.recommendationUrgency === 'HIGH'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : agingSimulationResult.recommendationUrgency === 'MEDIUM'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">{t('audit_recommendation')}</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                  {t('audit_recommendation_desc')}
                </p>
              </div>
            </div>

            {/* Projected Consumption Line Chart */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('consumption_evolution')}
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={agingSimulationResult.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="projectedYear" stroke="#94A3B8" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#94A3B8" fontSize={11} unit=" kWh" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={11} unit="%" domain={[50, 100]} />
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
                      yAxisId="left"
                      type="monotone"
                      dataKey="dailyConsumptionKwh"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                      name={t('series_load')}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="projectedEfficiency"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      name={t('metric_panel_efficiency')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Replacement Comparison Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/40 dark:to-slate-800/80 border border-blue-200 dark:border-blue-900/50 space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                {t('btn_calculate_roi')}
              </h4>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between text-xs gap-3">
                <div>
                  <span className="text-slate-400">{t('annual_savings')}</span>
                  <p className="text-base font-extrabold text-emerald-500">
                    +{agingSimulationResult.replacementComparison.annualSavingsTnd} DT / an
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">{t('kpi_initial_capex')}</span>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">
                    {agingSimulationResult.replacementComparison.estimatedReplacementCostTnd} DT
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">{t('payback_period')}</span>
                  <p className="text-base font-extrabold text-blue-500">
                    {agingSimulationResult.replacementComparison.paybackPeriodYears} Ans
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
