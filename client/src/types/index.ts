export interface SystemKPIs {
  solarProductionKw: number;
  totalConsumptionKw: number;
  requestedConsumptionKw: number;
  availableBatteryEnergyKwh: number;
  avgBatteryChargePct: number;
  activeZonesCount: number;
  totalZonesCount: number;
  totalEnergySoldKwh: number;
  totalRevenueSoldTnd: number;
  netPowerBalanceKw: number;
  systemState: 'SURPLUS' | 'BALANCED' | 'DEFICIT' | 'CRITICAL';
  gridImportKw: number;
  gridExportKw: number;
}

export interface Zone {
  id: string;
  zoneNumber: number;
  name: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityLevel: number;
  defaultConsumption: number;
  currentConsumption: number;
  dailyConsumption: number;
  monthlyConsumption: number;
  maxLimit: number;
  isConnected: boolean;
  reductionPercent: number;
  color: string;
  appliances?: Appliance[];
}

export interface Appliance {
  id: string;
  name: string;
  category: string;
  zoneId: string;
  zone?: Zone;
  nominalPower: number;
  dailyHours: number;
  operatingFreq: number;
  installationDate: string;
  ageYears: number;
  efficiency: number;
  status: 'ON' | 'OFF' | 'REDUCED';
  energyClass: string;
  degradationRate: number;
  maintenanceCondition: string;
  baselineKwh: number;
  estimatedDailyKwh: number;
  estimatedMonthlyKwh: number;
}

export interface Battery {
  id: string;
  batteryNumber: number;
  name: string;
  capacity: number;
  soc: number;
  soh: number;
  minSoc: number;
  maxSoc: number;
  maxChargeKw: number;
  maxDischargeKw: number;
  chargingStatus: 'IDLE' | 'CHARGING' | 'DISCHARGING' | 'FAULT';
  priority: number;
  storedEnergy: number;
  availableEnergy: number;
  roundtripEff?: number;
}

export interface DistributionDecision {
  id: string;
  timestamp: string;
  reason: string;
  situation: 'SURPLUS' | 'DEFICIT' | 'BALANCED' | 'CRITICAL' | 'NORMAL' | 'CONFIG_CHANGE' | 'DISCONNECTED';
  action: string;
  affectedEntity: string;
  mode: 'AUTOMATIC' | 'MANUAL' | 'ECO';
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFORMATION';
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  solarFactor: number;
  zone1Multiplier: number;
  zone2Multiplier: number;
  zone3Multiplier: number;
  zone4Multiplier: number;
  battery1Soc: number;
  battery2Soc: number;
  battery3Soc: number;
  isPreset: boolean;
}

export interface StegBracketLine {
  bracketName: string;
  minKwh: number;
  maxKwh: number;
  consumedKwhInBracket: number;
  rateTnd: number;
  amountHtTnd: number;
  vatRate: number;
  vatAmountTnd: number;
}

export interface StegBillResult {
  customerType: string;
  contractedPowerKva: number;
  billingPeriodMonths: number;
  totalGrossKwh: number;
  solarSelfConsumedKwh: number;
  netBilledGridKwh: number;
  averageMonthlyKwh: number;
  bracketBreakdown: StegBracketLine[];
  energyCostHtTnd: number;
  fixedPowerFeeHtTnd: number;
  fixedPowerFeeVatTnd: number;
  totalHtTnd: number;
  energyVatTnd: number;
  totalVatTnd: number;
  municipalTaxClTnd: number;
  energyTransitionFundFteTnd: number;
  rttTaxTnd: number;
  stampDutyTnd: number;
  totalTaxesAndFeesTnd: number;
  totalTtcTnd: number;
  solarExportRevenueTnd: number;
  netPayableAfterSolarTnd: number;
  isSimulated: boolean;
  tariffVersionName: string;
  disclaimer: string;
}

export interface SystemSettings {
  id: string;
  platformName: string;
  currency: string;
  language: string;
  timezone: string;
  operatingMode: 'AUTOMATIC' | 'MANUAL' | 'ECO';
  autoSellEnabled: boolean;
  sellPriceTnd: number;
  minBatteryReservePct: number;
  exportThresholdKw: number;
  co2FactorKgPerKwh: number;
  simulationSpeed: number;
  defaultSolarCapacity: number;
}
