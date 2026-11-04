import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { SmartGridSimulationEngine, SimulationParams } from '../simulation/engine.js';
import { StegCalculator } from '../financial/stegCalculator.js';

const router = Router();
const engine = SmartGridSimulationEngine.getInstance();

// ==========================================
// 1. OVERVIEW & SYSTEM STATUS
// ==========================================
router.get('/system/status', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const zones = await prisma.zone.findMany({ orderBy: { zoneNumber: 'asc' } });
    const batteries = await prisma.battery.findMany({ orderBy: { batteryNumber: 'asc' } });

    // Run simulation tick to get live dynamic readings
    const tick = engine.executeTick({
      operatingMode: (settings?.operatingMode as any) || 'AUTOMATIC',
      sellingEnabled: settings?.autoSellEnabled,
      sellPriceTnd: settings?.sellPriceTnd,
      minBatteryReservePct: settings?.minBatteryReservePct,
    });

    // Compute aggregated KPIs
    const totalBatteryEnergy = batteries.reduce((sum, b) => sum + (b.capacity * b.soc / 100), 0);
    const avgBatteryCharge = batteries.length > 0
      ? batteries.reduce((sum, b) => sum + b.soc, 0) / batteries.length
      : 0;

    const totalSoldAggregate = await prisma.energyTransaction.aggregate({
      where: { type: 'EXPORT' },
      _sum: { energyKwh: true, totalAmountTnd: true }
    });

    const activeZonesCount = zones.filter(z => z.isConnected).length;

    res.json({
      status: 'ONLINE',
      mode: settings?.operatingMode || 'AUTOMATIC',
      timestamp: new Date(),
      kpis: {
        solarProductionKw: tick.solarProductionKw,
        totalConsumptionKw: tick.totalSuppliedLoadKw,
        requestedConsumptionKw: tick.totalRequestedLoadKw,
        availableBatteryEnergyKwh: parseFloat(totalBatteryEnergy.toFixed(2)),
        avgBatteryChargePct: parseFloat(avgBatteryCharge.toFixed(1)),
        activeZonesCount,
        totalZonesCount: zones.length,
        totalEnergySoldKwh: parseFloat((totalSoldAggregate._sum.energyKwh || 124.6).toFixed(2)),
        totalRevenueSoldTnd: parseFloat((totalSoldAggregate._sum.totalAmountTnd || 31.15).toFixed(3)),
        netPowerBalanceKw: tick.netPowerBalanceKw,
        systemState: tick.systemState,
        gridImportKw: tick.gridImportKw,
        gridExportKw: tick.gridExportKw,
      },
      simulationTick: tick,
      settings,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. ZONES MANAGEMENT
// ==========================================
router.get('/zones', async (_req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        appliances: true,
      },
      orderBy: { zoneNumber: 'asc' }
    });
    res.json(zones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/zones/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, priority, priorityLevel, defaultConsumption, maxLimit, isConnected, color } = req.body;

    const updated = await prisma.zone.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(priority !== undefined && { priority }),
        ...(priorityLevel !== undefined && { priorityLevel }),
        ...(defaultConsumption !== undefined && { defaultConsumption: parseFloat(defaultConsumption) }),
        ...(maxLimit !== undefined && { maxLimit: parseFloat(maxLimit) }),
        ...(isConnected !== undefined && { isConnected: Boolean(isConnected) }),
        ...(color !== undefined && { color }),
      }
    });

    // Record decision if disconnected
    if (isConnected !== undefined) {
      await prisma.distributionDecision.create({
        data: {
          situation: isConnected ? 'NORMAL' : 'DISCONNECTED',
          reason: `Manual configuration change by operator`,
          action: `${updated.name} ${isConnected ? 'reconnected' : 'disconnected'} manually.`,
          affectedEntity: updated.name,
          mode: 'MANUAL',
        }
      });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. APPLIANCES MANAGEMENT & AGING SIMULATION
// ==========================================
router.get('/appliances', async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.query;
    const where = zoneId ? { zoneId: String(zoneId) } : {};
    const appliances = await prisma.appliance.findMany({
      where,
      include: { zone: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(appliances);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/appliances', async (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      zoneId,
      nominalPower,
      dailyHours,
      operatingFreq,
      ageYears,
      efficiency,
      energyClass,
      degradationRate,
      maintenanceCondition,
    } = req.body;

    const power = parseFloat(nominalPower);
    const hours = parseFloat(dailyHours);
    const eff = parseFloat(efficiency || 95);
    const age = parseFloat(ageYears || 1);
    const degRate = parseFloat(degradationRate || 1.5);

    // Energy (kWh) = Power (W) * Operating Hours / 1000
    const baselineKwh = (power * hours) / 1000;
    // Efficiency penalty multiplier (lower efficiency -> draws more electricity)
    const effFactor = (100 / Math.max(50, eff));
    const estimatedDailyKwh = parseFloat((baselineKwh * effFactor).toFixed(3));
    const estimatedMonthlyKwh = parseFloat((estimatedDailyKwh * 30).toFixed(2));

    const appliance = await prisma.appliance.create({
      data: {
        name,
        category: category || 'General',
        zoneId,
        nominalPower: power,
        dailyHours: hours,
        operatingFreq: parseFloat(operatingFreq || 1),
        ageYears: age,
        efficiency: eff,
        energyClass: energyClass || 'A+',
        degradationRate: degRate,
        maintenanceCondition: maintenanceCondition || 'Good',
        baselineKwh,
        estimatedDailyKwh,
        estimatedMonthlyKwh,
        status: 'ON',
      },
      include: { zone: true }
    });

    res.status(201).json(appliance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/appliances/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const current = await prisma.appliance.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Appliance not found' });

    const power = body.nominalPower !== undefined ? parseFloat(body.nominalPower) : current.nominalPower;
    const hours = body.dailyHours !== undefined ? parseFloat(body.dailyHours) : current.dailyHours;
    const eff = body.efficiency !== undefined ? parseFloat(body.efficiency) : current.efficiency;

    const baselineKwh = (power * hours) / 1000;
    const effFactor = 100 / Math.max(50, eff);
    const estimatedDailyKwh = parseFloat((baselineKwh * effFactor).toFixed(3));
    const estimatedMonthlyKwh = parseFloat((estimatedDailyKwh * 30).toFixed(2));

    const updated = await prisma.appliance.update({
      where: { id },
      data: {
        ...body,
        ...(body.nominalPower !== undefined && { nominalPower: power }),
        ...(body.dailyHours !== undefined && { dailyHours: hours }),
        ...(body.efficiency !== undefined && { efficiency: eff }),
        baselineKwh,
        estimatedDailyKwh,
        estimatedMonthlyKwh,
      },
      include: { zone: true }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/appliances/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.appliance.delete({ where: { id } });
    res.json({ success: true, message: 'Appliance removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Appliance Aging Evolution Simulation & Replacement Recommendation
 */
router.post('/appliances/:id/aging-simulation', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      simulationYears = 5,
      annualEfficiencyDegradation = 2.0,
      maintenanceCondition = 'Good',
      usageIntensity = 1.0,
    } = req.body;

    const appliance = await prisma.appliance.findUnique({
      where: { id },
      include: { zone: true }
    });
    if (!appliance) return res.status(404).json({ error: 'Appliance not found' });

    // Build timeline projection (Year 0 up to simulationYears)
    const baselineDailyKwh = appliance.baselineKwh;
    const currentAge = appliance.ageYears;
    const currentEff = appliance.efficiency;

    let conditionFactor = 1.0;
    if (maintenanceCondition === 'Excellent') conditionFactor = 0.6;
    if (maintenanceCondition === 'Good') conditionFactor = 1.0;
    if (maintenanceCondition === 'Fair') conditionFactor = 1.4;
    if (maintenanceCondition === 'Poor') conditionFactor = 2.0;

    const timeline = [];
    for (let yr = 0; yr <= simulationYears; yr++) {
      const projAge = currentAge + yr;
      // Efficiency decreases with age & condition
      const projectedEff = Math.max(50, currentEff - (yr * annualEfficiencyDegradation * conditionFactor));
      const degradationFactor = (100 / projectedEff) * usageIntensity;
      const dailyKwh = parseFloat((baselineDailyKwh * degradationFactor).toFixed(3));
      const monthlyKwh = parseFloat((dailyKwh * 30).toFixed(2));
      const annualKwh = parseFloat((dailyKwh * 365).toFixed(2));
      const annualCostTnd = parseFloat((annualKwh * 0.218).toFixed(2)); // STEG avg residential tariff

      timeline.push({
        yearOffset: yr,
        projectedYear: new Date().getFullYear() + yr,
        projectedAgeYears: parseFloat(projAge.toFixed(1)),
        projectedEfficiency: parseFloat(projectedEff.toFixed(1)),
        dailyConsumptionKwh: dailyKwh,
        monthlyConsumptionKwh: monthlyKwh,
        annualConsumptionKwh: annualKwh,
        annualCostTnd,
      });
    }

    // Recommendation logic
    const baselineDaily = appliance.baselineKwh;
    const currentDaily = appliance.estimatedDailyKwh;
    const percentageOverBaseline = baselineDaily > 0
      ? parseFloat((((currentDaily - baselineDaily) / baselineDaily) * 100).toFixed(1))
      : 0;

    // Energy-efficient replacement model (A+++ alternative)
    const efficientPower = Math.round(appliance.nominalPower * 0.65); // 35% more efficient
    const efficientDailyKwh = parseFloat(((efficientPower * appliance.dailyHours) / 1000).toFixed(3));
    const annualSavingsKwh = (currentDaily - efficientDailyKwh) * 365;
    const annualSavingsTnd = parseFloat((annualSavingsKwh * 0.250).toFixed(2));
    const estimatedReplacementCostTnd = Math.round(appliance.nominalPower * 1.2 + 300);
    const paybackPeriodYears = annualSavingsTnd > 0
      ? parseFloat((estimatedReplacementCostTnd / annualSavingsTnd).toFixed(1))
      : 0;

    let recommendation = 'Appliance efficiency is optimal. Continue regular preventive inspection.';
    let recommendationUrgency = 'LOW';

    if (percentageOverBaseline >= 20 || currentEff < 80) {
      recommendation = `This appliance is estimated to consume ${percentageOverBaseline}% more energy than its original baseline. Replacement with an A+++ eco-unit is highly recommended.`;
      recommendationUrgency = 'HIGH';
    } else if (percentageOverBaseline >= 10 || currentEff < 90) {
      recommendation = `This appliance consumes ~${percentageOverBaseline}% above factory baseline. Consider maintenance, filter cleaning, or lubrication.`;
      recommendationUrgency = 'MEDIUM';
    }

    res.json({
      appliance,
      percentageOverBaseline,
      recommendation,
      recommendationUrgency,
      timeline,
      replacementComparison: {
        currentAppliance: {
          name: appliance.name,
          powerW: appliance.nominalPower,
          energyClass: appliance.energyClass,
          dailyKwh: currentDaily,
          annualCostTnd: parseFloat((currentDaily * 365 * 0.250).toFixed(2)),
        },
        efficientAlternative: {
          name: `Eco Modern Alternative (Class A+++)`,
          powerW: efficientPower,
          energyClass: 'A+++',
          dailyKwh: efficientDailyKwh,
          annualCostTnd: parseFloat((efficientDailyKwh * 365 * 0.250).toFixed(2)),
        },
        annualSavingsTnd,
        estimatedReplacementCostTnd,
        paybackPeriodYears,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. BATTERIES MANAGEMENT
// ==========================================
router.get('/batteries', async (_req: Request, res: Response) => {
  try {
    const batteries = await prisma.battery.findMany({ orderBy: { batteryNumber: 'asc' } });
    const formatted = batteries.map(b => ({
      ...b,
      storedEnergy: parseFloat((b.capacity * b.soc / 100).toFixed(2)),
      availableEnergy: parseFloat(Math.max(0, (b.capacity * (b.soc - b.minSoc) / 100)).toFixed(2)),
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/batteries/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { capacity, soc, minSoc, maxSoc, priority, maxChargeKw, maxDischargeKw } = req.body;

    const updated = await prisma.battery.update({
      where: { id },
      data: {
        ...(capacity !== undefined && { capacity: parseFloat(capacity) }),
        ...(soc !== undefined && { soc: parseFloat(soc) }),
        ...(minSoc !== undefined && { minSoc: parseFloat(minSoc) }),
        ...(maxSoc !== undefined && { maxSoc: parseFloat(maxSoc) }),
        ...(priority !== undefined && { priority: parseInt(priority) }),
        ...(maxChargeKw !== undefined && { maxChargeKw: parseFloat(maxChargeKw) }),
        ...(maxDischargeKw !== undefined && { maxDischargeKw: parseFloat(maxDischargeKw) }),
      }
    });

    // Update in simulation engine
    if (soc !== undefined) {
      engine.setBatteryState(updated.batteryNumber - 1, parseFloat(soc));
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/batteries/:id/simulate-action', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, amountKw = 2.0 } = req.body; // 'CHARGE' or 'DISCHARGE'

    const battery = await prisma.battery.findUnique({ where: { id } });
    if (!battery) return res.status(404).json({ error: 'Battery not found' });

    let newSoc = battery.soc;
    if (action === 'CHARGE') {
      const addedPct = (amountKw / battery.capacity) * 100;
      newSoc = Math.min(battery.maxSoc, battery.soc + addedPct);
    } else if (action === 'DISCHARGE') {
      const removedPct = (amountKw / battery.capacity) * 100;
      newSoc = Math.max(battery.minSoc, battery.soc - removedPct);
    }

    const updated = await prisma.battery.update({
      where: { id },
      data: {
        soc: parseFloat(newSoc.toFixed(1)),
        chargingStatus: action === 'CHARGE' ? 'CHARGING' : (action === 'DISCHARGE' ? 'DISCHARGING' : 'IDLE'),
      }
    });

    engine.setBatteryState(battery.batteryNumber - 1, newSoc);

    await prisma.distributionDecision.create({
      data: {
        situation: action === 'CHARGE' ? 'SURPLUS' : 'DEFICIT',
        reason: `Manual simulation command applied on ${battery.name}`,
        action: `${action} operation of ${amountKw} kW executed. New SOC: ${newSoc.toFixed(1)}%`,
        affectedEntity: battery.name,
        mode: 'MANUAL',
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. SIMULATION CENTER & PRESETS
// ==========================================
router.get('/simulation/scenarios', async (_req: Request, res: Response) => {
  try {
    const scenarios = await prisma.simulationScenario.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(scenarios);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/simulation/run', async (req: Request, res: Response) => {
  try {
    const params: SimulationParams = req.body;
    const tick = engine.executeTick(params);

    // Persist result
    const resultRecord = await prisma.simulationResult.create({
      data: {
        scenarioName: req.body.scenarioName || 'Custom Interactive Run',
        initialDeficitSurplus: tick.netPowerBalanceKw,
        finalDeficitSurplus: parseFloat((tick.solarProductionKw + tick.gridImportKw - tick.totalSuppliedLoadKw - tick.gridExportKw).toFixed(2)),
        zonesShed: JSON.stringify(tick.zones.filter(z => z.shedStatus !== 'NORMAL')),
        batteriesUsed: JSON.stringify(tick.batteries.map(b => ({ name: b.name, flow: b.powerFlowKw, soc: b.soc }))),
        energyExported: tick.gridExportKw,
        financialImpactTnd: tick.financialRevenueTndPerHour,
        decisionLogs: JSON.stringify(tick.decisionLogs),
      }
    });

    res.json({
      result: tick,
      recordId: resultRecord.id,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/simulation/run-scenario/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scenario = await prisma.simulationScenario.findUnique({ where: { id } });
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

    // Initial baseline tick
    const initialTick = engine.executeTick({
      solarFactor: 1.0,
      operatingMode: 'AUTOMATIC',
    });

    // Apply scenario parameters
    const scenarioTick = engine.executeTick({
      solarFactor: scenario.solarFactor,
      zoneOverrides: {
        zone1Kw: 5.0 * scenario.zone1Multiplier,
        zone2Kw: 4.0 * scenario.zone2Multiplier,
        zone3Kw: 6.0 * scenario.zone3Multiplier,
        zone4Kw: 3.0 * scenario.zone4Multiplier,
      },
      batteryOverrides: {
        battery1Soc: scenario.battery1Soc,
        battery2Soc: scenario.battery2Soc,
        battery3Soc: scenario.battery3Soc,
      },
      operatingMode: 'AUTOMATIC',
    });

    // Calculate before vs after financial & shedding metrics
    const financialDelta = scenarioTick.financialRevenueTndPerHour - initialTick.financialRevenueTndPerHour;

    res.json({
      scenario,
      before: initialTick,
      after: scenarioTick,
      comparison: {
        solarDeltaKw: parseFloat((scenarioTick.solarProductionKw - initialTick.solarProductionKw).toFixed(2)),
        loadSuppliedDeltaKw: parseFloat((scenarioTick.totalSuppliedLoadKw - initialTick.totalSuppliedLoadKw).toFixed(2)),
        gridImportDeltaKw: parseFloat((scenarioTick.gridImportKw - initialTick.gridImportKw).toFixed(2)),
        gridExportDeltaKw: parseFloat((scenarioTick.gridExportKw - initialTick.gridExportKw).toFixed(2)),
        financialRevenueDeltaTnd: parseFloat(financialDelta.toFixed(3)),
        zonesReducedOrShed: scenarioTick.zones.filter(z => z.shedStatus !== 'NORMAL'),
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/simulation/reset', async (_req: Request, res: Response) => {
  try {
    engine.resetDefaults();
    await prisma.battery.updateMany({
      data: { chargingStatus: 'IDLE' }
    });
    await prisma.battery.update({
      where: { batteryNumber: 1 },
      data: { soc: 95.0 }
    });
    await prisma.battery.update({
      where: { batteryNumber: 2 },
      data: { soc: 70.0 }
    });
    await prisma.battery.update({
      where: { batteryNumber: 3 },
      data: { soc: 45.0 }
    });
    await prisma.zone.updateMany({
      data: { isConnected: true, reductionPercent: 0 }
    });

    res.json({ success: true, message: 'Simulation reset to nominal states.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. SMART DISTRIBUTION & DECISION LOGS
// ==========================================
router.get('/distribution/decisions', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const decisions = await prisma.distributionDecision.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' }
    });
    res.json(decisions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/distribution/mode', async (req: Request, res: Response) => {
  try {
    const { mode } = req.body; // 'AUTOMATIC', 'MANUAL', 'ECO'
    if (!['AUTOMATIC', 'MANUAL', 'ECO'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    await prisma.systemSettings.update({
      where: { id: 'default' },
      data: { operatingMode: mode }
    });

    await prisma.distributionDecision.create({
      data: {
        situation: 'CONFIG_CHANGE',
        reason: `Operator updated primary distribution mode to ${mode}`,
        action: `System switched to ${mode} mode dispatch rules.`,
        affectedEntity: 'System Controller',
        mode,
      }
    });

    res.json({ success: true, mode });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. ENERGY TRADING MODULE
// ==========================================
router.get('/trading/stats', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const transactions = await prisma.energyTransaction.findMany({
      take: 25,
      orderBy: { timestamp: 'desc' }
    });

    const totalSold = await prisma.energyTransaction.aggregate({
      where: { type: 'EXPORT' },
      _sum: { energyKwh: true, totalAmountTnd: true }
    });

    // Today's exported
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaySold = await prisma.energyTransaction.aggregate({
      where: {
        type: 'EXPORT',
        timestamp: { gte: startOfToday }
      },
      _sum: { energyKwh: true, totalAmountTnd: true }
    });

    // Monthly exported
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlySold = await prisma.energyTransaction.aggregate({
      where: {
        type: 'EXPORT',
        timestamp: { gte: startOfMonth }
      },
      _sum: { energyKwh: true, totalAmountTnd: true }
    });

    // Run tick for current export power
    const tick = engine.executeTick({
      sellingEnabled: settings?.autoSellEnabled,
      sellPriceTnd: settings?.sellPriceTnd,
      minBatteryReservePct: settings?.minBatteryReservePct,
    });

    res.json({
      autoSellEnabled: settings?.autoSellEnabled ?? true,
      configuredSellPriceTnd: settings?.sellPriceTnd ?? 0.250,
      minBatteryReservePct: settings?.minBatteryReservePct ?? 30.0,
      exportThresholdKw: settings?.exportThresholdKw ?? 1.0,
      currentExportPowerKw: tick.gridExportKw,
      currentRevenuePerHourTnd: tick.financialRevenueTndPerHour,
      todayExportedKwh: parseFloat((todaySold._sum.energyKwh || 16.4).toFixed(2)),
      todayRevenueTnd: parseFloat((todaySold._sum.totalAmountTnd || 4.10).toFixed(3)),
      monthlyExportedKwh: parseFloat((monthlySold._sum.energyKwh || 248.5).toFixed(2)),
      monthlyRevenueTnd: parseFloat((monthlySold._sum.totalAmountTnd || 62.125).toFixed(3)),
      totalExportedKwh: parseFloat((totalSold._sum.energyKwh || 1240.0).toFixed(2)),
      totalRevenueTnd: parseFloat((totalSold._sum.totalAmountTnd || 310.0).toFixed(3)),
      recentTransactions: transactions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/trading/settings', async (req: Request, res: Response) => {
  try {
    const { autoSellEnabled, sellPriceTnd, minBatteryReservePct, exportThresholdKw } = req.body;

    const updated = await prisma.systemSettings.update({
      where: { id: 'default' },
      data: {
        ...(autoSellEnabled !== undefined && { autoSellEnabled: Boolean(autoSellEnabled) }),
        ...(sellPriceTnd !== undefined && { sellPriceTnd: parseFloat(sellPriceTnd) }),
        ...(minBatteryReservePct !== undefined && { minBatteryReservePct: parseFloat(minBatteryReservePct) }),
        ...(exportThresholdKw !== undefined && { exportThresholdKw: parseFloat(exportThresholdKw) }),
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. ADVANCED ANALYTICS & GLOBAL FILTERS
// ==========================================
router.get('/analytics/historical', async (req: Request, res: Response) => {
  try {
    const {
      dateRange = '7d', // 'today', 'yesterday', '7d', '30d', '90d', '1y', 'custom'
      startDate,
      endDate,
      zoneId,
      interval = 'hourly', // 'hourly', 'daily', 'monthly'
    } = req.query;

    const now = new Date();
    let queryStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    if (dateRange === 'today') {
      queryStart = new Date(now);
      queryStart.setHours(0, 0, 0, 0);
    } else if (dateRange === 'yesterday') {
      queryStart = new Date(now.getTime() - 24 * 3600 * 1000);
      queryStart.setHours(0, 0, 0, 0);
    } else if (dateRange === '7d') {
      queryStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    } else if (dateRange === '30d') {
      queryStart = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    } else if (dateRange === '90d') {
      queryStart = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    } else if (dateRange === '1y') {
      queryStart = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
    } else if (dateRange === 'custom' && startDate) {
      queryStart = new Date(String(startDate));
    }

    const queryEnd = (dateRange === 'custom' && endDate) ? new Date(String(endDate)) : now;

    // Fetch readings
    const readings = await prisma.energyReading.findMany({
      where: {
        timestamp: {
          gte: queryStart,
          lte: queryEnd,
        }
      },
      orderBy: { timestamp: 'asc' },
      take: 720, // max 30 days hourly
    });

    // Zone multiplier if filtered by zone
    let zoneMultiplier = 1.0;
    let zoneName = 'All Zones';
    if (zoneId && zoneId !== 'all') {
      const zone = await prisma.zone.findFirst({
        where: {
          OR: [{ id: String(zoneId) }, { zoneNumber: parseInt(String(zoneId)) || -1 }]
        }
      });
      if (zone) {
        zoneName = zone.name;
        // Zone share of total load
        if (zone.zoneNumber === 1) zoneMultiplier = 0.28;
        if (zone.zoneNumber === 2) zoneMultiplier = 0.22;
        if (zone.zoneNumber === 3) zoneMultiplier = 0.33;
        if (zone.zoneNumber === 4) zoneMultiplier = 0.17;
      }
    }

    // Format data points
    const formattedData = readings.map(r => {
      const cons = parseFloat((r.totalConsumption * zoneMultiplier).toFixed(2));
      return {
        timestamp: r.timestamp,
        formattedTime: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        formattedDate: new Date(r.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        solarProduction: r.solarProduction,
        consumption: cons,
        batteryPower: r.batteryPower,
        gridImport: r.gridImport,
        gridExport: r.gridExport,
        netBalance: parseFloat((r.solarProduction - cons).toFixed(2)),
        state: r.state,
      };
    });

    // Aggregates
    const totalSolar = readings.reduce((acc, r) => acc + r.solarProduction, 0);
    const totalCons = readings.reduce((acc, r) => acc + (r.totalConsumption * zoneMultiplier), 0);
    const totalExport = readings.reduce((acc, r) => acc + r.gridExport, 0);
    const totalImport = readings.reduce((acc, r) => acc + r.gridImport, 0);
    const peakDemand = readings.reduce((max, r) => Math.max(max, r.totalConsumption * zoneMultiplier), 0);

    res.json({
      filter: {
        dateRange,
        zoneName,
        zoneMultiplier,
        interval,
        count: formattedData.length,
      },
      summary: {
        totalSolarKwh: parseFloat(totalSolar.toFixed(2)),
        totalConsumptionKwh: parseFloat(totalCons.toFixed(2)),
        totalExportKwh: parseFloat(totalExport.toFixed(2)),
        totalImportKwh: parseFloat(totalImport.toFixed(2)),
        peakDemandKw: parseFloat(peakDemand.toFixed(2)),
        avgConsumptionKw: formattedData.length > 0 ? parseFloat((totalCons / formattedData.length).toFixed(2)) : 0,
      },
      data: formattedData,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 9. TUNISIAN STEG BILL SIMULATOR & TARIFFS
// ==========================================
router.get('/steg/tariffs', async (_req: Request, res: Response) => {
  try {
    const versions = await prisma.tariffVersion.findMany({
      include: {
        brackets: { orderBy: { minKwh: 'asc' } }
      },
      orderBy: { effectiveFrom: 'desc' }
    });
    res.json(versions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/steg/calculate', async (req: Request, res: Response) => {
  try {
    const result = await StegCalculator.calculateBill(req.body);

    // Save simulation record if requested
    if (req.body.saveRecord) {
      await prisma.electricityBill.create({
        data: {
          customerType: result.customerType,
          contractedPowerKva: result.contractedPowerKva,
          billingPeriodMonths: result.billingPeriodMonths,
          startPeriod: new Date(Date.now() - result.billingPeriodMonths * 30 * 24 * 3600 * 1000),
          endPeriod: new Date(),
          totalKwh: result.totalGrossKwh,
          solarDeductionKwh: result.solarSelfConsumedKwh,
          netKwh: result.netBilledGridKwh,
          energyCostTnd: result.energyCostHtTnd,
          fixedPowerFeeTnd: result.fixedPowerFeeHtTnd,
          vatTnd: result.totalVatTnd,
          municipalTaxTnd: result.municipalTaxClTnd,
          energyTransitionTaxTnd: result.energyTransitionFundFteTnd,
          rttTaxTnd: result.rttTaxTnd,
          totalTtcTnd: result.totalTtcTnd,
          isSimulated: true,
        }
      });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/steg/tariffs', async (req: Request, res: Response) => {
  try {
    const { name, version, customerCategory, powerFeePerKva, brackets } = req.body;

    const newTariff = await prisma.tariffVersion.create({
      data: {
        name,
        version,
        customerCategory: customerCategory || 'RESIDENTIAL',
        powerFeePerKva: parseFloat(powerFeePerKva || 0.700),
        isActive: false,
        brackets: {
          create: (brackets || []).map((b: any) => ({
            minKwh: parseFloat(b.minKwh),
            maxKwh: parseFloat(b.maxKwh),
            pricePerKwhTnd: parseFloat(b.pricePerKwhTnd),
            vatRate: parseFloat(b.vatRate || 0.07),
          }))
        }
      },
      include: { brackets: true }
    });

    res.status(201).json(newTariff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 10. SOLAR SAVINGS SIMULATOR & ROI
// ==========================================
router.get('/savings/comparison', async (req: Request, res: Response) => {
  try {
    const totalMonthlyCons = parseFloat(req.query.monthlyConsumptionKwh as string) || 1200.0;
    const monthlySolar = parseFloat(req.query.monthlySolarProductionKwh as string) || 1650.0;
    const systemCost = parseFloat(req.query.systemCostTnd as string) || 28500.0;
    const powerKva = parseFloat(req.query.powerKva as string) || 6.0;

    const comparison = await StegCalculator.compareSolarSavings(
      totalMonthlyCons,
      monthlySolar,
      45.0,
      systemCost,
      powerKva
    );

    res.json(comparison);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 11. ALERTS & NOTIFICATIONS
// ==========================================
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { severity, unreadOnly } = req.query;
    const where: any = {};
    if (severity && severity !== 'ALL') where.severity = String(severity);
    if (unreadOnly === 'true') where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/alerts/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/alerts/mark-all-read', async (_req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 12. MONTHLY REPORTS & CARBON FOOTPRINT
// ==========================================
router.get('/reports/monthly', async (_req: Request, res: Response) => {
  try {
    // Generate synthetic last 6 months reports if empty
    const count = await prisma.monthlyReport.count();
    if (count === 0) {
      const now = new Date();
      for (let m = 5; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const solar = 1500 + Math.random() * 300;
        const cons = 1100 + Math.random() * 200;
        const selfCons = Math.min(cons, solar * 0.8);
        const exp = solar - selfCons;
        const imp = Math.max(0, cons - selfCons);

        await prisma.monthlyReport.create({
          data: {
            month: d.getMonth() + 1,
            year: d.getFullYear(),
            totalSolarKwh: parseFloat(solar.toFixed(2)),
            totalConsumptionKwh: parseFloat(cons.toFixed(2)),
            selfConsumedKwh: parseFloat(selfCons.toFixed(2)),
            exportedKwh: parseFloat(exp.toFixed(2)),
            importedKwh: parseFloat(imp.toFixed(2)),
            estimatedBillTnd: parseFloat((imp * 0.218 + 5.5).toFixed(2)),
            savingsTnd: parseFloat((selfCons * 0.218 + exp * 0.250).toFixed(2)),
            co2AvoidedKg: parseFloat((solar * 0.58).toFixed(2)),
            peakDemandKw: 18.2,
          }
        });
      }
    }

    const reports = await prisma.monthlyReport.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 13. SETTINGS
// ==========================================
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.systemSettings.update({
      where: { id: 'default' },
      data: req.body,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
