import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  CheckCheck,
  Search,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { NotificationItem } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts(severityFilter, unreadOnly);
      setAlerts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, unreadOnly]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markAlertRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = alerts.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            Alerts &amp; Notification Telemetry Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated alerts, health warnings, threshold overruns, and routine audit logs
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4 text-blue-500" />
          Mark All Read
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['ALL', 'CRITICAL', 'WARNING', 'INFORMATION'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                severityFilter === s
                  ? s === 'CRITICAL'
                    ? 'bg-rose-600 text-white shadow-md'
                    : s === 'WARNING'
                    ? 'bg-amber-600 text-white shadow-md'
                    : s === 'INFORMATION'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <span>Unread Only</span>
          </label>

          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No notifications matching current filters.
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !alert.isRead
                  ? 'bg-white dark:bg-[#101B2D] border-blue-500/50 shadow-md shadow-blue-500/5'
                  : 'bg-white/60 dark:bg-[#101B2D]/60 border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl flex-shrink-0 mt-0.5">
                  {alert.severity === 'CRITICAL' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                  ) : alert.severity === 'WARNING' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-500" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-500'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {alert.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {alert.entityType && (
                      <span>Component: {alert.entityType}</span>
                    )}
                  </div>
                </div>
              </div>

              {!alert.isRead && (
                <button
                  onClick={() => handleMarkRead(alert.id)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 text-xs font-bold hover:bg-blue-100 transition-colors self-end sm:self-center flex-shrink-0"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
