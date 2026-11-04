import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SystemKPIs, SystemSettings, NotificationItem } from '../types';
import { api } from '../services/api';

interface SystemContextType {
  kpis: SystemKPIs | null;
  settings: SystemSettings | null;
  mode: 'AUTOMATIC' | 'MANUAL' | 'ECO';
  unreadAlertsCount: number;
  recentAlerts: NotificationItem[];
  isLoading: boolean;
  error: string | null;
  refreshSystem: () => Promise<void>;
  updateOperatingMode: (newMode: 'AUTOMATIC' | 'MANUAL' | 'ECO') => Promise<void>;
  markAlertRead: (id: string) => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kpis, setKpis] = useState<SystemKPIs | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [mode, setMode] = useState<'AUTOMATIC' | 'MANUAL' | 'ECO'>('AUTOMATIC');
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);
  const [recentAlerts, setRecentAlerts] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSystem = useCallback(async () => {
    try {
      const [statusRes, alertsRes] = await Promise.all([
        api.getSystemStatus(),
        api.getAlerts(undefined, false),
      ]);

      setKpis(statusRes.kpis);
      setSettings(statusRes.settings);
      setMode(statusRes.mode);
      setRecentAlerts(alertsRes);
      setUnreadAlertsCount(alertsRes.filter(a => !a.isRead).length);
      setError(null);
    } catch (err: any) {
      console.warn('System poll error:', err.message);
      // Fallback fallback data so UI remains interactive even before server starts
      if (!kpis) {
        setKpis({
          solarProductionKw: 12.4,
          totalConsumptionKw: 14.2,
          requestedConsumptionKw: 14.2,
          availableBatteryEnergyKwh: 32.5,
          avgBatteryChargePct: 70.0,
          activeZonesCount: 4,
          totalZonesCount: 4,
          totalEnergySoldKwh: 124.6,
          totalRevenueSoldTnd: 31.15,
          netPowerBalanceKw: -1.8,
          systemState: 'DEFICIT',
          gridImportKw: 0,
          gridExportKw: 0,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [kpis]);

  useEffect(() => {
    refreshSystem();
    const interval = setInterval(refreshSystem, 4000); // 4-second reactive polling
    return () => clearInterval(interval);
  }, [refreshSystem]);

  const updateOperatingMode = async (newMode: 'AUTOMATIC' | 'MANUAL' | 'ECO') => {
    setMode(newMode);
    try {
      await api.setOperatingMode(newMode);
      await refreshSystem();
    } catch (err: any) {
      console.error(err);
    }
  };

  const markAlertRead = async (id: string) => {
    try {
      await api.markAlertRead(id);
      setRecentAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
      setUnreadAlertsCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <SystemContext.Provider
      value={{
        kpis,
        settings,
        mode,
        unreadAlertsCount,
        recentAlerts,
        isLoading,
        error,
        refreshSystem,
        updateOperatingMode,
        markAlertRead,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within SystemProvider');
  return context;
};
