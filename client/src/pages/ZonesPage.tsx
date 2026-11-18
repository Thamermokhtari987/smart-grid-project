import React, { useState, useEffect } from 'react';
import {
  Layers,
  Power,
  Edit2,
  Sliders,
  AlertOctagon,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Tv,
  Eye,
  TrendingUp,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { Zone, Appliance } from '../types';
import { Modal } from '../components/ui/Modal';
import { useLanguage } from '../context/LanguageContext';

export const ZonesPage: React.FC = () => {
  const { t } = useLanguage();
  const [zones, setZones] = useState<Zone[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPriority, setNewPriority] = useState<Zone['priority']>('Medium');
  const [newPriorityLevel, setNewPriorityLevel] = useState(3);
  const [newDefaultConsumption, setNewDefaultConsumption] = useState(5);
  const [newMaxLimit, setNewMaxLimit] = useState(8);
  const [newColor, setNewColor] = useState('#3B82F6');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPriority, setEditPriority] = useState<string>('Critical');
  const [editPriorityLevel, setEditPriorityLevel] = useState<number>(1);
  const [editDefaultConsumption, setEditDefaultConsumption] = useState<number>(5);
  const [editMaxLimit, setEditMaxLimit] = useState<number>(8);

  const fetchZones = async () => {
    try {
      const [zRes, aRes] = await Promise.all([api.getZones(), api.getAppliances()]);
      setZones(zRes);
      setAppliances(aRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const totalLoad = zones.reduce((sum, z) => sum + (z.isConnected ? z.currentConsumption : 0), 0);

  const handleToggleConnection = async (zone: Zone) => {
    try {
      const updated = await api.updateZone(zone.id, {
        isConnected: !zone.isConnected,
      });
      setZones(prev => prev.map(z => z.id === zone.id ? updated : z));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (zone: Zone) => {
    setSelectedZone(zone);
    setEditName(zone.name);
    setEditPriority(zone.priority);
    setEditPriorityLevel(zone.priorityLevel);
    setEditDefaultConsumption(zone.defaultConsumption);
    setEditMaxLimit(zone.maxLimit);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    try {
      const updated = await api.updateZone(selectedZone.id, {
        name: editName,
        priority: editPriority as any,
        priorityLevel: Number(editPriorityLevel),
        defaultConsumption: Number(editDefaultConsumption),
        maxLimit: Number(editMaxLimit),
      });
      setZones(prev => prev.map(z => z.id === selectedZone.id ? updated : z));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const resetAddForm = () => {
    setNewName('');
    setNewPriority('Medium');
    setNewPriorityLevel(3);
    setNewDefaultConsumption(5);
    setNewMaxLimit(8);
    setNewColor('#3B82F6');
    setActionError('');
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setActionError('');
    try {
      const created = await api.createZone({
        name: newName,
        priority: newPriority,
        priorityLevel: Number(newPriorityLevel),
        defaultConsumption: Number(newDefaultConsumption),
        maxLimit: Number(newMaxLimit),
        color: newColor,
      });
      setZones((current) => [...current, created].sort((a, b) => a.zoneNumber - b.zoneNumber));
      setIsAddModalOpen(false);
      resetAddForm();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = async (zone: Zone) => {
    const confirmed = window.confirm(
      `Delete "${zone.name}"? This will also remove its connected appliances.`
    );
    if (!confirmed) return;

    setActionError('');
    try {
      await api.deleteZone(zone.id);
      setZones((current) => current.filter((item) => item.id !== zone.id));
      setAppliances((current) => current.filter((item) => item.zoneId !== zone.id));
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleOpenView = (zone: Zone) => {
    setSelectedZone(zone);
    setIsViewModalOpen(true);
  };

  // Comparison chart data
  const comparisonData = zones.map(z => ({
    name: `Zone ${z.zoneNumber}`,
    label: z.name,
    current: z.isConnected ? z.currentConsumption : 0,
    daily: z.dailyConsumption,
    color: z.color,
  }));

  const getPriorityLabel = (level: number, priority: string) => {
    switch (level) {
      case 1:
        return t('priority_critical');
      case 2:
        return t('priority_high');
      case 3:
        return t('priority_medium');
      case 4:
        return t('priority_low');
      default:
        return `${priority} (P${level})`;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            {t('zones_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('zones_subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {actionError && (
            <span className="text-xs font-semibold text-rose-600">{actionError}</span>
          )}
          <button
            type="button"
            onClick={() => {
              resetAddForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Zone
          </button>
        </div>
      </div>

      {/* 4 Distinct Zone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {zones.map((zone) => {
          const zoneAppliances = appliances.filter(a => a.zoneId === zone.id);
          const percentOfTotal = totalLoad > 0 && zone.isConnected
            ? ((zone.currentConsumption / totalLoad) * 100).toFixed(1)
            : '0.0';

          return (
            <div
              key={zone.id}
              className={`relative rounded-3xl p-6 bg-white dark:bg-[#101B2D] border transition-all duration-200 shadow-md flex flex-col justify-between ${
                zone.isConnected
                  ? 'border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
                  : 'border-rose-400/50 dark:border-rose-900/40 opacity-75'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                      Zone {zone.zoneNumber}
                    </span>
                  </div>

                  {/* Priority Tag */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                      zone.priority === 'Critical'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                        : zone.priority === 'High'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : zone.priority === 'Medium'
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    }`}
                  >
                    {getPriorityLabel(zone.priorityLevel, zone.priority)}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2 truncate">
                  {zone.name}
                </h3>

                {/* Consumption Figure */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {zone.isConnected ? zone.currentConsumption : 0}
                    </span>
                    <span className="text-sm font-semibold text-slate-400 ml-1">kW</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {t('zone_power_limit')}: {zone.maxLimit} kW
                  </span>
                </div>

                {/* Reduction or Connection status */}
                <div className="mt-2">
                  {zone.reductionPercent > 0 && zone.isConnected ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                      -{zone.reductionPercent}%
                    </span>
                  ) : !zone.isConnected ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500">
                      {t('status_shed')}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      {percentOfTotal}% {t('kpi_total_consumption')}
                    </span>
                  )}
                </div>

                {/* Progress load limit bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (zone.currentConsumption / zone.maxLimit) * 100)}%`,
                      backgroundColor: zone.color,
                    }}
                  />
                </div>

                {/* Mini details list */}
                <div className="mt-5 space-y-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{t('monitoring_total_daily')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {zone.dailyConsumption} kWh
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{t('monitoring_monthly_cons')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {zone.monthlyConsumption} kWh
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{t('nav_appliances')}</span>
                    <span className="font-semibold text-blue-500">
                      {zoneAppliances.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleToggleConnection(zone)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    zone.isConnected
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {zone.isConnected ? t('disconnect') : t('reconnect')}
                </button>

                <button
                  onClick={() => handleOpenEdit(zone)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                  title={t('edit')}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenView(zone)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                  title={t('view_all')}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteZone(zone)}
                  className="p-2 rounded-xl text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 transition-colors"
                  title="Delete zone"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              {t('chart_zone_breakdown')}
            </h3>
            <p className="text-xs text-slate-400">{t('chart_zone_breakdown_desc')}</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={11} unit=" kW" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="current" name={t('series_load')} radius={[6, 6, 0, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Add Zone Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Zone"
        subtitle="Create a new managed energy zone"
      >
        <form onSubmit={handleCreateZone} className="space-y-4">
          {actionError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Zone name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="e.g. Workshop Zone"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => {
                  const priority = e.target.value as Zone['priority'];
                  setNewPriority(priority);
                  setNewPriorityLevel(priority === 'Critical' ? 1 : priority === 'High' ? 2 : priority === 'Medium' ? 3 : 4);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Color</label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-full h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Consumption (kW)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={newDefaultConsumption}
                onChange={(e) => setNewDefaultConsumption(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Power limit (kW)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={newMaxLimit}
                onChange={(e) => setNewMaxLimit(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
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
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold"
            >
              {isSaving ? 'Adding...' : 'Add Zone'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Zone Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`${t('edit')}: ${selectedZone?.name || ''}`}
        subtitle={t('edit_zone_modal_title')}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {t('appliance_name')}
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('priority_critical').split(' ')[0]}
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Critical">{t('priority_critical')}</option>
                <option value="High">{t('priority_high')}</option>
                <option value="Medium">{t('priority_medium')}</option>
                <option value="Low">{t('priority_low')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('priority_critical').split(' ')[0]} Level (1-4)
              </label>
              <input
                type="number"
                min="1"
                max="4"
                value={editPriorityLevel}
                onChange={(e) => setEditPriorityLevel(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('zone_current_power')} (kW)
              </label>
              <input
                type="number"
                step="0.1"
                value={editDefaultConsumption}
                onChange={(e) => setEditDefaultConsumption(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('zone_power_limit')} (kW)
              </label>
              <input
                type="number"
                step="0.1"
                value={editMaxLimit}
                onChange={(e) => setEditMaxLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
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

      {/* View Zone Details & Appliances Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`${selectedZone?.name}`}
        subtitle={`${t('nav_appliances')} • Zone ${selectedZone?.zoneNumber}`}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-slate-400 text-xs">{t('priority_critical').split(' ')[0]}</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{getPriorityLabel(selectedZone?.priorityLevel || 1, selectedZone?.priority || '')}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">{t('zone_current_power')}</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedZone?.defaultConsumption} kW</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">{t('zone_power_limit')}</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedZone?.maxLimit} kW</p>
            </div>
          </div>

          <h4 className="font-bold text-sm text-slate-900 dark:text-white pt-2">
            {t('nav_appliances')} ({appliances.filter(a => a.zoneId === selectedZone?.id).length})
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {appliances.filter(a => a.zoneId === selectedZone?.id).map(app => (
              <div
                key={app.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{app.name}</p>
                  <p className="text-slate-400">{app.category} • {app.nominalPower}W • {app.dailyHours}h/{t('filter_today')}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-500">{app.estimatedDailyKwh} kWh</span>
                  <p className="text-[10px] text-slate-400">Class {app.energyClass}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
