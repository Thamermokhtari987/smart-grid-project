"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartGridSimulationEngine = void 0;
class SmartGridSimulationEngine {
    static instance;
    // Internal states
    batterySocs = [95.0, 70.0, 45.0];
    batterySohs = [99.2, 96.5, 93.8];
    batteryCapacities = [20.0, 15.0, 10.0];
    batteryMinSocs = [20.0, 20.0, 20.0];
    batteryMaxSocs = [98.0, 98.0, 98.0];
    batteryMaxChargeRates = [6.0, 5.0, 3.5];
    batteryMaxDischargeRates = [6.0, 5.0, 3.5];
    constructor() { }
    static getInstance() {
        if (!SmartGridSimulationEngine.instance) {
            SmartGridSimulationEngine.instance = new SmartGridSimulationEngine();
        }
        return SmartGridSimulationEngine.instance;
    }
    setBatteryState(batteryIndex, soc) {
        if (batteryIndex >= 0 && batteryIndex < 3) {
            this.batterySocs[batteryIndex] = Math.max(0, Math.min(100, soc));
        }
    }
    resetDefaults() {
        this.batterySocs = [95.0, 70.0, 45.0];
    }
    /**
     * Run one complete simulation tick with consistent physics & priority load management
     */
    executeTick(params = {}) {
        const timestamp = new Date();
        const mode = params.operatingMode || 'AUTOMATIC';
        const hour = params.timeOfDayHours !== undefined ? params.timeOfDayHours : (new Date().getHours() + new Date().getMinutes() / 60);
        const solarFactor = params.solarFactor !== undefined ? params.solarFactor : 1.0;
        const weather = params.weather || 'Sunny';
        // 1. Calculate Solar Generation
        let weatherMultiplier = 1.0;
        if (weather === 'Partly Cloudy')
            weatherMultiplier = 0.75;
        if (weather === 'Cloudy')
            weatherMultiplier = 0.35;
        if (weather === 'Rainy')
            weatherMultiplier = 0.15;
        let solarProductionKw = 0;
        // Photovoltaic sun window: 06:00 to 18:30
        if (hour >= 6.0 && hour <= 18.5) {
            const sunRatio = (hour - 6.0) / 12.5; // 0 to 1
            const peakSolarKw = 16.5; // 16.5 kWp system
            solarProductionKw = peakSolarKw * Math.sin(sunRatio * Math.PI) * solarFactor * weatherMultiplier;
        }
        solarProductionKw = Math.max(0, parseFloat(solarProductionKw.toFixed(2)));
        // Apply battery overrides if given
        if (params.batteryOverrides) {
            if (params.batteryOverrides.battery1Soc !== undefined)
                this.batterySocs[0] = params.batteryOverrides.battery1Soc;
            if (params.batteryOverrides.battery2Soc !== undefined)
                this.batterySocs[1] = params.batteryOverrides.battery2Soc;
            if (params.batteryOverrides.battery3Soc !== undefined)
                this.batterySocs[2] = params.batteryOverrides.battery3Soc;
        }
        // 2. Initial Zone Configuration
        const zoneConfigs = [
            { num: 1, name: 'Critical Zone', priority: 'Critical', level: 1, defaultKw: 5.0, color: '#EF4444' },
            { num: 2, name: 'High Priority Zone', priority: 'High', level: 2, defaultKw: 4.0, color: '#F97316' },
            { num: 3, name: 'Medium Priority Zone', priority: 'Medium', level: 3, defaultKw: 6.0, color: '#3B82F6' },
            { num: 4, name: 'Low Priority Zone', priority: 'Low', level: 4, defaultKw: 3.0, color: '#10B981' },
        ];
        const zones = zoneConfigs.map(zc => {
            let reqKw = zc.defaultKw;
            let isConnected = true;
            if (zc.num === 1) {
                if (params.zoneOverrides?.zone1Kw !== undefined)
                    reqKw = params.zoneOverrides.zone1Kw;
                if (params.zoneOverrides?.zone1Active !== undefined)
                    isConnected = params.zoneOverrides.zone1Active;
            }
            else if (zc.num === 2) {
                if (params.zoneOverrides?.zone2Kw !== undefined)
                    reqKw = params.zoneOverrides.zone2Kw;
                if (params.zoneOverrides?.zone2Active !== undefined)
                    isConnected = params.zoneOverrides.zone2Active;
            }
            else if (zc.num === 3) {
                if (params.zoneOverrides?.zone3Kw !== undefined)
                    reqKw = params.zoneOverrides.zone3Kw;
                if (params.zoneOverrides?.zone3Active !== undefined)
                    isConnected = params.zoneOverrides.zone3Active;
            }
            else if (zc.num === 4) {
                if (params.zoneOverrides?.zone4Kw !== undefined)
                    reqKw = params.zoneOverrides.zone4Kw;
                if (params.zoneOverrides?.zone4Active !== undefined)
                    isConnected = params.zoneOverrides.zone4Active;
            }
            return {
                zoneNumber: zc.num,
                name: zc.name,
                priority: zc.priority,
                priorityLevel: zc.level,
                nominalKw: zc.defaultKw,
                requestedKw: isConnected ? parseFloat(reqKw.toFixed(2)) : 0,
                suppliedKw: isConnected ? parseFloat(reqKw.toFixed(2)) : 0,
                reductionPercent: 0,
                isConnected,
                shedStatus: isConnected ? 'NORMAL' : 'SHED',
            };
        });
        const totalRequestedLoadKw = parseFloat(zones.reduce((sum, z) => sum + (z.isConnected ? z.requestedKw : 0), 0).toFixed(2));
        const netPowerBalanceKw = parseFloat((solarProductionKw - totalRequestedLoadKw).toFixed(2));
        const decisionLogs = [];
        // Battery setup
        const batteries = [0, 1, 2].map(i => {
            const cap = this.batteryCapacities[i];
            const soc = this.batterySocs[i];
            const minSoc = this.batteryMinSocs[i];
            const maxSoc = this.batteryMaxSocs[i];
            const stored = parseFloat((cap * soc / 100).toFixed(2));
            const avail = parseFloat(Math.max(0, (cap * (soc - minSoc) / 100)).toFixed(2));
            return {
                batteryNumber: i + 1,
                name: `Battery ${i + 1} (${cap} kWh)`,
                capacityKwh: cap,
                soc,
                soh: this.batterySohs[i],
                storedKwh: stored,
                availableKwh: avail,
                minSoc,
                maxSoc,
                maxChargeKw: this.batteryMaxChargeRates[i],
                maxDischargeKw: this.batteryMaxDischargeRates[i],
                powerFlowKw: 0,
                status: 'IDLE',
            };
        });
        let gridImportKw = 0;
        let gridExportKw = 0;
        let systemState = 'BALANCED';
        const minReservePct = params.minBatteryReservePct || 30.0;
        const sellPrice = params.sellPriceTnd || 0.250;
        const autoSell = params.sellingEnabled !== undefined ? params.sellingEnabled : true;
        // ==========================================
        // SCENARIO A: SOLAR SURPLUS (Solar > Load)
        // ==========================================
        if (netPowerBalanceKw > 0.05) {
            systemState = 'SURPLUS';
            let surplusKw = netPowerBalanceKw;
            decisionLogs.push({
                timestamp,
                situation: 'SURPLUS',
                reason: `Solar production (${solarProductionKw} kW) exceeds active loads (${totalRequestedLoadKw} kW).`,
                action: 'Supplying 100% load to all zones and charging batteries in order of priority.',
                affectedEntity: 'Solar Panels, All Zones',
            });
            // Charge batteries: Battery 1 first, then 2, then 3
            for (const b of batteries) {
                if (surplusKw <= 0.01)
                    break;
                if (b.soc < b.maxSoc) {
                    const headroomKwh = b.capacityKwh * (b.maxSoc - b.soc) / 100;
                    const maxChargePower = Math.min(b.maxChargeKw, headroomKwh * 2.0); // C-rate constraint
                    const allocatedKw = Math.min(surplusKw, maxChargePower);
                    if (allocatedKw > 0.05) {
                        b.powerFlowKw = parseFloat(allocatedKw.toFixed(2));
                        b.status = 'CHARGING';
                        surplusKw -= allocatedKw;
                        decisionLogs.push({
                            timestamp,
                            situation: 'SURPLUS',
                            reason: `${b.name} has available charging capacity (SOC: ${b.soc.toFixed(1)}%).`,
                            action: `Routing +${allocatedKw.toFixed(2)} kW into ${b.name}.`,
                            affectedEntity: b.name,
                        });
                    }
                }
            }
            // If surplus still remains after charging batteries
            if (surplusKw > 0.1) {
                const avgSoc = batteries.reduce((acc, b) => acc + b.soc, 0) / batteries.length;
                if (autoSell && avgSoc >= minReservePct) {
                    gridExportKw = parseFloat(surplusKw.toFixed(2));
                    decisionLogs.push({
                        timestamp,
                        situation: 'SURPLUS',
                        reason: `Surplus power of ${gridExportKw} kW available with safe battery reserve (${avgSoc.toFixed(1)}% >= ${minReservePct}%).`,
                        action: `Exporting ${gridExportKw} kW to national grid at ${sellPrice.toFixed(3)} TND/kWh.`,
                        affectedEntity: 'Electricity Grid',
                    });
                }
            }
        }
        // ==========================================
        // SCENARIO B: BALANCED (-0.05 <= Net <= 0.05)
        // ==========================================
        else if (Math.abs(netPowerBalanceKw) <= 0.05) {
            systemState = 'BALANCED';
            decisionLogs.push({
                timestamp,
                situation: 'BALANCED',
                reason: 'Generation closely matches instantaneous consumption.',
                action: 'System operating in equilibrium with zero net storage shift.',
                affectedEntity: 'Smart Inverter',
            });
        }
        // ==========================================
        // SCENARIO C: DEFICIT (Solar < Load)
        // ==========================================
        else {
            systemState = 'DEFICIT';
            let remainingDeficitKw = Math.abs(netPowerBalanceKw);
            decisionLogs.push({
                timestamp,
                situation: 'DEFICIT',
                reason: `Solar production (${solarProductionKw} kW) is insufficient to meet load (${totalRequestedLoadKw} kW). Deficit: ${remainingDeficitKw.toFixed(2)} kW.`,
                action: 'Initiating battery discharge across available units.',
                affectedEntity: 'Batteries, Energy Management System',
            });
            // Discharge batteries: Battery 1 first, then 2, then 3
            for (const b of batteries) {
                if (remainingDeficitKw <= 0.01)
                    break;
                if (b.soc > b.minSoc) {
                    const usableEnergyKwh = b.capacityKwh * (b.soc - b.minSoc) / 100;
                    const maxDischargePower = Math.min(b.maxDischargeKw, usableEnergyKwh * 2.0);
                    const drawKw = Math.min(remainingDeficitKw, maxDischargePower);
                    if (drawKw > 0.05) {
                        b.powerFlowKw = -parseFloat(drawKw.toFixed(2));
                        b.status = 'DISCHARGING';
                        remainingDeficitKw -= drawKw;
                        decisionLogs.push({
                            timestamp,
                            situation: 'DEFICIT',
                            reason: `${b.name} has available reserve (${b.soc.toFixed(1)}% > min ${b.minSoc}%).`,
                            action: `Discharging -${drawKw.toFixed(2)} kW from ${b.name}.`,
                            affectedEntity: b.name,
                        });
                    }
                }
            }
            // If battery capacity is insufficient to clear deficit:
            if (remainingDeficitKw > 0.05) {
                // Step 1: In ECO mode or automatic, attempt proportional load reduction on non-critical zones
                if (mode === 'ECO' || mode === 'AUTOMATIC') {
                    // Reduce Zone 4 by up to 50%
                    const z4 = zones.find(z => z.zoneNumber === 4);
                    if (z4 && z4.isConnected && remainingDeficitKw > 0.05) {
                        const possibleReduction = z4.requestedKw * 0.50;
                        const reduction = Math.min(remainingDeficitKw, possibleReduction);
                        z4.suppliedKw = parseFloat((z4.requestedKw - reduction).toFixed(2));
                        z4.reductionPercent = parseFloat(((reduction / z4.requestedKw) * 100).toFixed(1));
                        z4.shedStatus = 'REDUCED';
                        remainingDeficitKw -= reduction;
                        decisionLogs.push({
                            timestamp,
                            situation: 'DEFICIT',
                            reason: 'Applying smart soft reduction before full disconnection.',
                            action: `Zone 4 consumption reduced by ${z4.reductionPercent}% (-${reduction.toFixed(2)} kW).`,
                            affectedEntity: 'Zone 4 (Low Priority)',
                        });
                    }
                    // If still deficit, reduce Zone 3 by up to 35%
                    const z3 = zones.find(z => z.zoneNumber === 3);
                    if (z3 && z3.isConnected && remainingDeficitKw > 0.05) {
                        const possibleReduction = z3.requestedKw * 0.35;
                        const reduction = Math.min(remainingDeficitKw, possibleReduction);
                        z3.suppliedKw = parseFloat((z3.requestedKw - reduction).toFixed(2));
                        z3.reductionPercent = parseFloat(((reduction / z3.requestedKw) * 100).toFixed(1));
                        z3.shedStatus = 'REDUCED';
                        remainingDeficitKw -= reduction;
                        decisionLogs.push({
                            timestamp,
                            situation: 'DEFICIT',
                            reason: 'Reducing medium-priority commercial/kitchen loads.',
                            action: `Zone 3 consumption reduced by ${z3.reductionPercent}% (-${reduction.toFixed(2)} kW).`,
                            affectedEntity: 'Zone 3 (Medium Priority)',
                        });
                    }
                }
                // Step 2: Automatic Load Shedding by Priority Order (Zone 4 -> Zone 3 -> Zone 2 -> Zone 1)
                if (remainingDeficitKw > 0.05 && mode !== 'MANUAL') {
                    // Shed Zone 4
                    const z4 = zones.find(z => z.zoneNumber === 4);
                    if (z4 && z4.isConnected && z4.suppliedKw > 0) {
                        const shedKw = z4.suppliedKw;
                        z4.suppliedKw = 0;
                        z4.reductionPercent = 100;
                        z4.isConnected = false;
                        z4.shedStatus = 'SHED';
                        remainingDeficitKw = Math.max(0, remainingDeficitKw - shedKw);
                        decisionLogs.push({
                            timestamp,
                            situation: 'DEFICIT',
                            reason: 'Storage depleted and power reduction insufficient.',
                            action: 'Zone 4 fully disconnected to preserve upper priority zones.',
                            affectedEntity: 'Zone 4 (Low Priority)',
                        });
                    }
                    // Shed Zone 3
                    if (remainingDeficitKw > 0.05) {
                        const z3 = zones.find(z => z.zoneNumber === 3);
                        if (z3 && z3.isConnected && z3.suppliedKw > 0) {
                            const shedKw = z3.suppliedKw;
                            z3.suppliedKw = 0;
                            z3.reductionPercent = 100;
                            z3.isConnected = false;
                            z3.shedStatus = 'SHED';
                            remainingDeficitKw = Math.max(0, remainingDeficitKw - shedKw);
                            decisionLogs.push({
                                timestamp,
                                situation: 'DEFICIT',
                                reason: 'Critical deficit continues.',
                                action: 'Zone 3 fully disconnected.',
                                affectedEntity: 'Zone 3 (Medium Priority)',
                            });
                        }
                    }
                    // Shed Zone 2
                    if (remainingDeficitKw > 0.05) {
                        const z2 = zones.find(z => z.zoneNumber === 2);
                        if (z2 && z2.isConnected && z2.suppliedKw > 0) {
                            const shedKw = z2.suppliedKw;
                            z2.suppliedKw = 0;
                            z2.reductionPercent = 100;
                            z2.isConnected = false;
                            z2.shedStatus = 'SHED';
                            remainingDeficitKw = Math.max(0, remainingDeficitKw - shedKw);
                            decisionLogs.push({
                                timestamp,
                                situation: 'CRITICAL',
                                reason: 'Severe energy deficit; preserving life-critical Zone 1.',
                                action: 'Zone 2 disconnected.',
                                affectedEntity: 'Zone 2 (High Priority)',
                            });
                        }
                    }
                    // Zone 1 is absolute last resort; if deficit still remains, grid import covers it or critical alarm
                    if (remainingDeficitKw > 0.05) {
                        gridImportKw = parseFloat(remainingDeficitKw.toFixed(2));
                        systemState = 'CRITICAL';
                        decisionLogs.push({
                            timestamp,
                            situation: 'CRITICAL',
                            reason: 'Zone 1 (Critical medical & IT infrastructure) protected via emergency grid bridge.',
                            action: `Importing ${gridImportKw} kW from external utility grid.`,
                            affectedEntity: 'Grid & Zone 1',
                        });
                    }
                }
                else if (remainingDeficitKw > 0.05 && mode === 'MANUAL') {
                    // In Manual mode, deficits pull from grid without automatic shedding
                    gridImportKw = parseFloat(remainingDeficitKw.toFixed(2));
                    decisionLogs.push({
                        timestamp,
                        situation: 'DEFICIT',
                        reason: 'Manual mode active: automatic load shedding bypassed.',
                        action: `Importing ${gridImportKw} kW from grid.`,
                        affectedEntity: 'Electricity Grid',
                    });
                }
            }
        }
        // Update battery stored & available energy
        const totalBatteryPowerKw = parseFloat(batteries.reduce((sum, b) => sum + b.powerFlowKw, 0).toFixed(2));
        const totalSuppliedLoadKw = parseFloat(zones.reduce((sum, z) => sum + z.suppliedKw, 0).toFixed(2));
        const unmetDemandKw = parseFloat(Math.max(0, totalRequestedLoadKw - totalSuppliedLoadKw).toFixed(2));
        // Financial revenue estimation
        const revenuePerHour = parseFloat((gridExportKw * sellPrice).toFixed(3));
        // Physical conservation check:
        // Solar + BatteryDischarge + GridImport = SuppliedLoad + BatteryCharge + GridExport
        // BatteryNet = Charge(+) or Discharge(-)
        const energyIn = solarProductionKw + gridImportKw + Math.max(0, -totalBatteryPowerKw);
        const energyOut = totalSuppliedLoadKw + gridExportKw + Math.max(0, totalBatteryPowerKw);
        const energyBalanceCheckOk = Math.abs(energyIn - energyOut) < 0.2;
        return {
            timestamp,
            operatingMode: mode,
            solarProductionKw,
            totalRequestedLoadKw,
            totalSuppliedLoadKw,
            unmetDemandKw,
            netPowerBalanceKw,
            systemState,
            zones,
            batteries,
            batteryNetPowerKw: totalBatteryPowerKw,
            gridImportKw,
            gridExportKw,
            financialRevenueTndPerHour: revenuePerHour,
            energyBalanceCheckOk,
            decisionLogs,
        };
    }
}
exports.SmartGridSimulationEngine = SmartGridSimulationEngine;
