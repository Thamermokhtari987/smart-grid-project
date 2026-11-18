import {
  SystemKPIs,
  Zone,
  Appliance,
  Battery,
  DistributionDecision,
  NotificationItem,
  SimulationScenario,
  StegBillResult,
  SystemSettings,
} from '../types';

const API_BASE = '/api';

export const api = {
  // System Status & KPIs
  getSystemStatus: async () => {
    const res = await fetch(`${API_BASE}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json() as Promise<{
      status: string;
      mode: 'AUTOMATIC' | 'MANUAL' | 'ECO';
      timestamp: string;
      kpis: SystemKPIs;
      simulationTick: any;
      settings: SystemSettings;
    }>;
  },

  // Zones
  getZones: async () => {
    const res = await fetch(`${API_BASE}/zones`);
    if (!res.ok) throw new Error('Failed to fetch zones');
    return res.json() as Promise<Zone[]>;
  },

  updateZone: async (id: string, data: Partial<Zone>) => {
    const res = await fetch(`${API_BASE}/zones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update zone');
    return res.json() as Promise<Zone>;
  },

  createZone: async (data: {
    name: string;
    priority: Zone['priority'];
    priorityLevel: number;
    defaultConsumption: number;
    maxLimit: number;
    color: string;
  }) => {
    const res = await fetch(`${API_BASE}/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.error || 'Failed to create zone');
    }
    return res.json() as Promise<Zone>;
  },

  deleteZone: async (id: string) => {
    const res = await fetch(`${API_BASE}/zones/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.error || 'Failed to delete zone');
    }
    return res.json() as Promise<{ success: boolean; deletedId: string }>;
  },

  // Appliances
  getAppliances: async (zoneId?: string) => {
    const url = zoneId ? `${API_BASE}/appliances?zoneId=${zoneId}` : `${API_BASE}/appliances`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch appliances');
    return res.json() as Promise<Appliance[]>;
  },

  createAppliance: async (data: Partial<Appliance>) => {
    const res = await fetch(`${API_BASE}/appliances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create appliance');
    return res.json() as Promise<Appliance>;
  },

  updateAppliance: async (id: string, data: Partial<Appliance>) => {
    const res = await fetch(`${API_BASE}/appliances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update appliance');
    return res.json() as Promise<Appliance>;
  },

  deleteAppliance: async (id: string) => {
    const res = await fetch(`${API_BASE}/appliances/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete appliance');
    return res.json();
  },

  simulateApplianceAging: async (id: string, params: {
    simulationYears: number;
    annualEfficiencyDegradation: number;
    maintenanceCondition: string;
    usageIntensity: number;
  }) => {
    const res = await fetch(`${API_BASE}/appliances/${id}/aging-simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to simulate appliance aging');
    return res.json();
  },

  // Batteries
  getBatteries: async () => {
    const res = await fetch(`${API_BASE}/batteries`);
    if (!res.ok) throw new Error('Failed to fetch batteries');
    return res.json() as Promise<Battery[]>;
  },

  updateBattery: async (id: string, data: Partial<Battery>) => {
    const res = await fetch(`${API_BASE}/batteries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update battery');
    return res.json() as Promise<Battery>;
  },

  simulateBatteryAction: async (id: string, action: 'CHARGE' | 'DISCHARGE', amountKw: number) => {
    const res = await fetch(`${API_BASE}/batteries/${id}/simulate-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, amountKw }),
    });
    if (!res.ok) throw new Error('Failed to simulate battery action');
    return res.json() as Promise<Battery>;
  },

  // Simulation Center
  getScenarios: async () => {
    const res = await fetch(`${API_BASE}/simulation/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch simulation scenarios');
    return res.json() as Promise<SimulationScenario[]>;
  },

  runSimulation: async (params: any) => {
    const res = await fetch(`${API_BASE}/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to run simulation');
    return res.json();
  },

  runScenarioById: async (scenarioId: string) => {
    const res = await fetch(`${API_BASE}/simulation/run-scenario/${scenarioId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to run scenario');
    return res.json();
  },

  resetSimulation: async () => {
    const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset simulation');
    return res.json();
  },

  // Smart Distribution
  getDistributionDecisions: async (limit: number = 30) => {
    const res = await fetch(`${API_BASE}/distribution/decisions?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch distribution decisions');
    return res.json() as Promise<DistributionDecision[]>;
  },

  setOperatingMode: async (mode: 'AUTOMATIC' | 'MANUAL' | 'ECO') => {
    const res = await fetch(`${API_BASE}/distribution/mode`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) throw new Error('Failed to update operating mode');
    return res.json();
  },

  // Trading
  getTradingStats: async () => {
    const res = await fetch(`${API_BASE}/trading/stats`);
    if (!res.ok) throw new Error('Failed to fetch trading stats');
    return res.json();
  },

  updateTradingSettings: async (settings: any) => {
    const res = await fetch(`${API_BASE}/trading/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update trading settings');
    return res.json();
  },

  // Analytics & Historical Data
  getHistoricalAnalytics: async (params: {
    dateRange?: string;
    startDate?: string;
    endDate?: string;
    zoneId?: string;
    interval?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/analytics/historical?${query}`);
    if (!res.ok) throw new Error('Failed to fetch historical analytics');
    return res.json();
  },

  // STEG Bill Simulator
  getStegTariffs: async () => {
    const res = await fetch(`${API_BASE}/steg/tariffs`);
    if (!res.ok) throw new Error('Failed to fetch STEG tariffs');
    return res.json();
  },

  calculateStegBill: async (params: {
    customerType: string;
    contractedPowerKva: number;
    billingPeriodMonths: number;
    totalConsumptionKwh: number;
    solarSelfConsumedKwh?: number;
    solarExportedKwh?: number;
    exportTariffTnd?: number;
    saveRecord?: boolean;
    tariffVersionId?: string;
  }) => {
    const res = await fetch(`${API_BASE}/steg/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to calculate STEG bill');
    return res.json() as Promise<StegBillResult>;
  },

  createTariffVersion: async (tariff: any) => {
    const res = await fetch(`${API_BASE}/steg/tariffs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tariff),
    });
    if (!res.ok) throw new Error('Failed to create tariff version');
    return res.json();
  },

  // Solar Savings
  getSolarSavingsComparison: async (params: {
    monthlyConsumptionKwh?: number;
    monthlySolarProductionKwh?: number;
    systemCostTnd?: number;
    powerKva?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/savings/comparison?${query}`);
    if (!res.ok) throw new Error('Failed to fetch solar savings comparison');
    return res.json();
  },

  // Alerts
  getAlerts: async (severity?: string, unreadOnly?: boolean) => {
    const query = new URLSearchParams();
    if (severity) query.append('severity', severity);
    if (unreadOnly) query.append('unreadOnly', 'true');
    const res = await fetch(`${API_BASE}/alerts?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json() as Promise<NotificationItem[]>;
  },

  markAlertRead: async (id: string) => {
    const res = await fetch(`${API_BASE}/alerts/${id}/read`, { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to mark alert as read');
    return res.json();
  },

  markAllAlertsRead: async () => {
    const res = await fetch(`${API_BASE}/alerts/mark-all-read`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to mark all alerts as read');
    return res.json();
  },

  // Monthly Reports
  getMonthlyReports: async () => {
    const res = await fetch(`${API_BASE}/reports/monthly`);
    if (!res.ok) throw new Error('Failed to fetch monthly reports');
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json() as Promise<SystemSettings>;
  },

  updateSettings: async (settings: Partial<SystemSettings>) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json() as Promise<SystemSettings>;
  },
};
