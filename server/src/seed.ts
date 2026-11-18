import { prisma } from './db.js';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function seedDatabase() {
  console.log('🌱 Checking / Seeding database...');

  // Demo/client administrator account
  const adminEmail = 'admin@gmail.com';
  const adminPasswordHash = await hashPassword('admin1234');
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Administrator',
        email: adminEmail,
        phone: '00000000',
        address: 'SMARTGRID',
        city: 'Tunis',
        passwordHash: adminPasswordHash,
        customerType: 'COMMERCIAL',
        contractedPowerKva: 4,
        role: 'CLIENT',
      },
    });
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: existingAdmin.name || 'Administrator',
        phone: existingAdmin.phone || '00000000',
        address: existingAdmin.address || 'SMARTGRID',
        city: existingAdmin.city || 'Tunis',
        passwordHash: adminPasswordHash,
        customerType: existingAdmin.customerType || 'COMMERCIAL',
        contractedPowerKva: existingAdmin.contractedPowerKva || 4,
        role: 'CLIENT',
      },
    });
  }

  // 1. Settings
  const existingSettings = await prisma.systemSettings.findUnique({
    where: { id: 'default' }
  });
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: {
        id: 'default',
        platformName: 'SMARTGRID Intelligent Platform',
        currency: 'TND',
        language: 'English',
        timezone: 'Africa/Tunis',
        operatingMode: 'AUTOMATIC',
        autoSellEnabled: true,
        sellPriceTnd: 0.250,
        minBatteryReservePct: 30.0,
        exportThresholdKw: 1.0,
        co2FactorKgPerKwh: 0.580,
        simulationSpeed: 1.0,
        defaultSolarCapacity: 18.0,
      }
    });
  }

  // 2. Zones
  const zoneCount = await prisma.zone.count();
  if (zoneCount === 0) {
    const zonesData = [
      {
        zoneNumber: 1,
        name: 'Critical Zone',
        priority: 'Critical',
        priorityLevel: 1,
        defaultConsumption: 5.0,
        currentConsumption: 4.8,
        dailyConsumption: 72.4,
        monthlyConsumption: 2150.0,
        maxLimit: 8.0,
        color: '#EF4444',
      },
      {
        zoneNumber: 2,
        name: 'High Priority Zone',
        priority: 'High',
        priorityLevel: 2,
        defaultConsumption: 4.0,
        currentConsumption: 3.6,
        dailyConsumption: 52.8,
        monthlyConsumption: 1620.0,
        maxLimit: 6.5,
        color: '#F97316',
      },
      {
        zoneNumber: 3,
        name: 'Medium Priority Zone',
        priority: 'Medium',
        priorityLevel: 3,
        defaultConsumption: 6.0,
        currentConsumption: 5.2,
        dailyConsumption: 84.1,
        monthlyConsumption: 2480.0,
        maxLimit: 9.0,
        color: '#3B82F6',
      },
      {
        zoneNumber: 4,
        name: 'Low Priority Zone',
        priority: 'Low',
        priorityLevel: 4,
        defaultConsumption: 3.0,
        currentConsumption: 2.4,
        dailyConsumption: 38.6,
        monthlyConsumption: 1140.0,
        maxLimit: 5.0,
        color: '#10B981',
      },
    ];

    for (const z of zonesData) {
      await prisma.zone.create({ data: z });
    }
  }

  // 3. Batteries
  const batteryCount = await prisma.battery.count();
  if (batteryCount === 0) {
    const batteriesData = [
      {
        batteryNumber: 1,
        name: 'Battery 1 (Primary High-Cap)',
        capacity: 20.0,
        soc: 95.0,
        soh: 99.2,
        minSoc: 20.0,
        maxSoc: 98.0,
        maxChargeKw: 6.0,
        maxDischargeKw: 6.0,
        chargingStatus: 'IDLE',
        priority: 1,
        storedEnergy: 20.0 * 0.95,
        availableEnergy: 20.0 * (0.95 - 0.20),
        roundtripEff: 94.0,
      },
      {
        batteryNumber: 2,
        name: 'Battery 2 (Secondary Storage)',
        capacity: 15.0,
        soc: 70.0,
        soh: 96.5,
        minSoc: 20.0,
        maxSoc: 98.0,
        maxChargeKw: 5.0,
        maxDischargeKw: 5.0,
        chargingStatus: 'CHARGING',
        priority: 2,
        storedEnergy: 15.0 * 0.70,
        availableEnergy: 15.0 * (0.70 - 0.20),
        roundtripEff: 92.0,
      },
      {
        batteryNumber: 3,
        name: 'Battery 3 (Auxiliary Buffer)',
        capacity: 10.0,
        soc: 45.0,
        soh: 93.8,
        minSoc: 20.0,
        maxSoc: 98.0,
        maxChargeKw: 3.5,
        maxDischargeKw: 3.5,
        chargingStatus: 'IDLE',
        priority: 3,
        storedEnergy: 10.0 * 0.45,
        availableEnergy: 10.0 * (0.45 - 0.20),
        roundtripEff: 90.0,
      },
    ];

    for (const b of batteriesData) {
      await prisma.battery.create({ data: b });
    }
  }

  // 4. Appliances
  const applianceCount = await prisma.appliance.count();
  if (applianceCount === 0) {
    const zones = await prisma.zone.findMany({ orderBy: { zoneNumber: 'asc' } });
    const z1 = zones.find(z => z.zoneNumber === 1)?.id!;
    const z2 = zones.find(z => z.zoneNumber === 2)?.id!;
    const z3 = zones.find(z => z.zoneNumber === 3)?.id!;
    const z4 = zones.find(z => z.zoneNumber === 4)?.id!;

    const appliances = [
      // Zone 1
      {
        name: 'Medical Monitoring & Oxygen Station',
        category: 'Medical',
        zoneId: z1,
        nominalPower: 850,
        dailyHours: 24,
        operatingFreq: 1,
        installationDate: new Date('2023-01-15'),
        ageYears: 2.8,
        efficiency: 97.0,
        status: 'ON',
        energyClass: 'A+++',
        degradationRate: 1.0,
        maintenanceCondition: 'Excellent',
        baselineKwh: (850 * 24) / 1000,
        estimatedDailyKwh: (850 * 24) / 1000 * 1.02,
        estimatedMonthlyKwh: ((850 * 24) / 1000 * 1.02) * 30,
      },
      {
        name: 'Commercial Vaccine Refrigerator',
        category: 'Cooling',
        zoneId: z1,
        nominalPower: 420,
        dailyHours: 24,
        operatingFreq: 1,
        installationDate: new Date('2022-06-10'),
        ageYears: 3.4,
        efficiency: 91.5,
        status: 'ON',
        energyClass: 'A++',
        degradationRate: 1.8,
        maintenanceCondition: 'Good',
        baselineKwh: (420 * 24) / 1000,
        estimatedDailyKwh: (420 * 24) / 1000 * 1.08,
        estimatedMonthlyKwh: ((420 * 24) / 1000 * 1.08) * 30,
      },
      {
        name: 'Critical Telemetry & Server Rack',
        category: 'Computing',
        zoneId: z1,
        nominalPower: 750,
        dailyHours: 24,
        operatingFreq: 1,
        installationDate: new Date('2024-02-01'),
        ageYears: 1.8,
        efficiency: 98.0,
        status: 'ON',
        energyClass: 'A+++',
        degradationRate: 0.8,
        maintenanceCondition: 'Excellent',
        baselineKwh: (750 * 24) / 1000,
        estimatedDailyKwh: (750 * 24) / 1000 * 1.01,
        estimatedMonthlyKwh: ((750 * 24) / 1000 * 1.01) * 30,
      },
      {
        name: 'Emergency LED Lighting Array',
        category: 'Lighting',
        zoneId: z1,
        nominalPower: 450,
        dailyHours: 14,
        operatingFreq: 1,
        installationDate: new Date('2023-08-20'),
        ageYears: 2.2,
        efficiency: 94.0,
        status: 'ON',
        energyClass: 'A++',
        degradationRate: 1.2,
        maintenanceCondition: 'Good',
        baselineKwh: (450 * 14) / 1000,
        estimatedDailyKwh: (450 * 14) / 1000 * 1.03,
        estimatedMonthlyKwh: ((450 * 14) / 1000 * 1.03) * 30,
      },

      // Zone 2
      {
        name: 'Computer Workstations (Cluster A)',
        category: 'Computing',
        zoneId: z2,
        nominalPower: 1600,
        dailyHours: 10,
        operatingFreq: 1,
        installationDate: new Date('2023-04-12'),
        ageYears: 2.6,
        efficiency: 93.0,
        status: 'ON',
        energyClass: 'A+',
        degradationRate: 2.0,
        maintenanceCondition: 'Good',
        baselineKwh: (1600 * 10) / 1000,
        estimatedDailyKwh: (1600 * 10) / 1000 * 1.06,
        estimatedMonthlyKwh: ((1600 * 10) / 1000 * 1.06) * 30,
      },
      {
        name: 'Inverter Office Air Conditioning',
        category: 'Cooling',
        zoneId: z2,
        nominalPower: 2200,
        dailyHours: 9,
        operatingFreq: 1,
        installationDate: new Date('2021-05-18'),
        ageYears: 4.5,
        efficiency: 84.0,
        status: 'ON',
        energyClass: 'A',
        degradationRate: 2.5,
        maintenanceCondition: 'Fair',
        baselineKwh: (2200 * 9) / 1000,
        estimatedDailyKwh: (2200 * 9) / 1000 * 1.15,
        estimatedMonthlyKwh: ((2200 * 9) / 1000 * 1.15) * 30,
      },
      {
        name: 'Production Laser Printing Hub',
        category: 'Appliances',
        zoneId: z2,
        nominalPower: 650,
        dailyHours: 6,
        operatingFreq: 2,
        installationDate: new Date('2022-11-05'),
        ageYears: 3.0,
        efficiency: 92.0,
        status: 'ON',
        energyClass: 'A',
        degradationRate: 1.5,
        maintenanceCondition: 'Good',
        baselineKwh: (650 * 6) / 1000,
        estimatedDailyKwh: (650 * 6) / 1000 * 1.05,
        estimatedMonthlyKwh: ((650 * 6) / 1000 * 1.05) * 30,
      },

      // Zone 3
      {
        name: 'Commercial Induction Kitchen Stove',
        category: 'Kitchen',
        zoneId: z3,
        nominalPower: 2800,
        dailyHours: 3.5,
        operatingFreq: 2,
        installationDate: new Date('2023-03-25'),
        ageYears: 2.7,
        efficiency: 96.0,
        status: 'ON',
        energyClass: 'A+++',
        degradationRate: 1.0,
        maintenanceCondition: 'Good',
        baselineKwh: (2800 * 3.5) / 1000,
        estimatedDailyKwh: (2800 * 3.5) / 1000 * 1.03,
        estimatedMonthlyKwh: ((2800 * 3.5) / 1000 * 1.03) * 30,
      },
      {
        name: 'High-Efficiency Heat Pump Water Heater',
        category: 'Appliances',
        zoneId: z3,
        nominalPower: 2100,
        dailyHours: 4,
        operatingFreq: 1,
        installationDate: new Date('2022-01-10'),
        ageYears: 3.8,
        efficiency: 88.0,
        status: 'ON',
        energyClass: 'A++',
        degradationRate: 2.2,
        maintenanceCondition: 'Good',
        baselineKwh: (2100 * 4) / 1000,
        estimatedDailyKwh: (2100 * 4) / 1000 * 1.10,
        estimatedMonthlyKwh: ((2100 * 4) / 1000 * 1.10) * 30,
      },
      {
        name: 'Eco Industrial Washing Machine',
        category: 'Appliances',
        zoneId: z3,
        nominalPower: 1900,
        dailyHours: 2.5,
        operatingFreq: 1,
        installationDate: new Date('2023-09-12'),
        ageYears: 2.1,
        efficiency: 94.0,
        status: 'ON',
        energyClass: 'A++',
        degradationRate: 1.5,
        maintenanceCondition: 'Good',
        baselineKwh: (1900 * 2.5) / 1000,
        estimatedDailyKwh: (1900 * 2.5) / 1000 * 1.04,
        estimatedMonthlyKwh: ((1900 * 2.5) / 1000 * 1.04) * 30,
      },
      {
        name: 'Lounge 75" Smart Display & Audio',
        category: 'Appliances',
        zoneId: z3,
        nominalPower: 350,
        dailyHours: 6,
        operatingFreq: 1,
        installationDate: new Date('2024-01-08'),
        ageYears: 1.9,
        efficiency: 97.0,
        status: 'ON',
        energyClass: 'A+',
        degradationRate: 1.0,
        maintenanceCondition: 'Excellent',
        baselineKwh: (350 * 6) / 1000,
        estimatedDailyKwh: (350 * 6) / 1000 * 1.02,
        estimatedMonthlyKwh: ((350 * 6) / 1000 * 1.02) * 30,
      },

      // Zone 4
      {
        name: 'Swimming Pool Circulation & Filter Pump',
        category: 'Outdoor',
        zoneId: z4,
        nominalPower: 1400,
        dailyHours: 6,
        operatingFreq: 1,
        installationDate: new Date('2020-07-22'),
        ageYears: 5.3,
        efficiency: 81.0,
        status: 'ON',
        energyClass: 'B',
        degradationRate: 3.2,
        maintenanceCondition: 'Fair',
        baselineKwh: (1400 * 6) / 1000,
        estimatedDailyKwh: (1400 * 6) / 1000 * 1.18,
        estimatedMonthlyKwh: ((1400 * 6) / 1000 * 1.18) * 30,
      },
      {
        name: 'Garden Architectural Lighting System',
        category: 'Outdoor',
        zoneId: z4,
        nominalPower: 850,
        dailyHours: 5,
        operatingFreq: 1,
        installationDate: new Date('2023-05-14'),
        ageYears: 2.5,
        efficiency: 92.0,
        status: 'ON',
        energyClass: 'A',
        degradationRate: 1.5,
        maintenanceCondition: 'Good',
        baselineKwh: (850 * 5) / 1000,
        estimatedDailyKwh: (850 * 5) / 1000 * 1.05,
        estimatedMonthlyKwh: ((850 * 5) / 1000 * 1.05) * 30,
      },
      {
        name: 'Garage EV Auxiliary Trickle Charger',
        category: 'Outdoor',
        zoneId: z4,
        nominalPower: 2200,
        dailyHours: 3,
        operatingFreq: 1,
        installationDate: new Date('2024-03-01'),
        ageYears: 1.7,
        efficiency: 97.5,
        status: 'REDUCED',
        energyClass: 'A+++',
        degradationRate: 0.8,
        maintenanceCondition: 'Excellent',
        baselineKwh: (2200 * 3) / 1000,
        estimatedDailyKwh: (2200 * 3) / 1000 * 1.01,
        estimatedMonthlyKwh: ((2200 * 3) / 1000 * 1.01) * 30,
      },
    ];

    for (const app of appliances) {
      await prisma.appliance.create({ data: app });
    }
  }

  // 5. Predefined Scenarios (10 scenarios)
  const scenarioCount = await prisma.simulationScenario.count();
  if (scenarioCount === 0) {
    const scenarios = [
      {
        name: 'Normal Day',
        description: 'Standard sunny Mediterranean day with balanced zone loads and healthy battery states.',
        solarFactor: 1.0,
        zone1Multiplier: 1.0,
        zone2Multiplier: 1.0,
        zone3Multiplier: 1.0,
        zone4Multiplier: 1.0,
        battery1Soc: 95.0,
        battery2Soc: 70.0,
        battery3Soc: 45.0,
      },
      {
        name: 'Cloudy Weather',
        description: 'Overcast skies reducing solar output to 25%; batteries provide partial buffer.',
        solarFactor: 0.25,
        zone1Multiplier: 1.0,
        zone2Multiplier: 1.0,
        zone3Multiplier: 1.0,
        zone4Multiplier: 1.0,
        battery1Soc: 65.0,
        battery2Soc: 40.0,
        battery3Soc: 25.0,
      },
      {
        name: 'High Consumption',
        description: 'Extreme HVAC and appliance peak demands exceeding instantaneous generation.',
        solarFactor: 0.9,
        zone1Multiplier: 1.35,
        zone2Multiplier: 1.40,
        zone3Multiplier: 1.50,
        zone4Multiplier: 1.45,
        battery1Soc: 90.0,
        battery2Soc: 75.0,
        battery3Soc: 50.0,
      },
      {
        name: 'Energy Surplus',
        description: 'Peak midsummer solar generation exceeding consumption; full battery charging and maximum export.',
        solarFactor: 1.75,
        zone1Multiplier: 0.75,
        zone2Multiplier: 0.70,
        zone3Multiplier: 0.65,
        zone4Multiplier: 0.60,
        battery1Soc: 98.0,
        battery2Soc: 95.0,
        battery3Soc: 88.0,
      },
      {
        name: 'Battery 1 Failure',
        description: 'Primary 20 kWh battery offline; load redistributes across auxiliary batteries 2 & 3.',
        solarFactor: 0.85,
        zone1Multiplier: 1.0,
        zone2Multiplier: 1.0,
        zone3Multiplier: 1.0,
        zone4Multiplier: 1.0,
        battery1Soc: 0.0,
        battery2Soc: 75.0,
        battery3Soc: 50.0,
      },
      {
        name: 'Battery 2 Failure',
        description: 'Secondary 15 kWh battery offline; battery 1 handles bulk cycling with battery 3 support.',
        solarFactor: 0.85,
        zone1Multiplier: 1.0,
        zone2Multiplier: 1.0,
        zone3Multiplier: 1.0,
        zone4Multiplier: 1.0,
        battery1Soc: 92.0,
        battery2Soc: 0.0,
        battery3Soc: 60.0,
      },
      {
        name: 'Battery 3 Failure',
        description: 'Auxiliary 10 kWh battery unavailable; primary batteries 1 & 2 handle storage needs.',
        solarFactor: 0.85,
        zone1Multiplier: 1.0,
        zone2Multiplier: 1.0,
        zone3Multiplier: 1.0,
        zone4Multiplier: 1.0,
        battery1Soc: 90.0,
        battery2Soc: 70.0,
        battery3Soc: 0.0,
      },
      {
        name: 'Critical Energy Situation',
        description: 'Near-zero solar, drained batteries, requires strict load shedding of Zones 4, 3, and 2.',
        solarFactor: 0.05,
        zone1Multiplier: 1.1,
        zone2Multiplier: 1.2,
        zone3Multiplier: 1.3,
        zone4Multiplier: 1.1,
        battery1Soc: 22.0,
        battery2Soc: 20.0,
        battery3Soc: 20.0,
      },
      {
        name: 'Nighttime Consumption',
        description: 'Zero solar production (sunset); residential activities powered by stored battery reserves.',
        solarFactor: 0.0,
        zone1Multiplier: 0.9,
        zone2Multiplier: 0.85,
        zone3Multiplier: 1.2,
        zone4Multiplier: 0.6,
        battery1Soc: 85.0,
        battery2Soc: 65.0,
        battery3Soc: 40.0,
      },
      {
        name: 'Appliance Efficiency Degradation',
        description: 'Aged appliances consuming 15-25% more power due to wear and lack of maintenance.',
        solarFactor: 1.0,
        zone1Multiplier: 1.15,
        zone2Multiplier: 1.22,
        zone3Multiplier: 1.30,
        zone4Multiplier: 1.35,
        battery1Soc: 75.0,
        battery2Soc: 55.0,
        battery3Soc: 35.0,
      },
    ];

    for (const sc of scenarios) {
      await prisma.simulationScenario.create({ data: sc });
    }
  }

  // 6. STEG Official Tariffs
  const tariffCount = await prisma.tariffVersion.count();
  if (tariffCount === 0) {
    const stegTariff = await prisma.tariffVersion.create({
      data: {
        name: 'Grille Tarifaire STEG Officielle Basse Tension (2024-2025)',
        version: 'STEG-BT-2024.1',
        effectiveFrom: new Date('2022-05-01'),
        customerCategory: 'RESIDENTIAL',
        powerFeePerKva: 0.700, // 700 millimes per kVA / month
        isActive: true,
      }
    });

    // Brackets for STEG Residential Basse Tension:
    // 0-50 kWh: 62 millimes (0.062 TND)
    // 51-100 kWh: 96 millimes (0.096 TND)
    // 101-200 kWh: 176 millimes (0.176 TND)
    // 201-300 kWh: 218 millimes (0.218 TND)
    // 301-500 kWh: 341 millimes (0.341 TND)
    // >500 kWh: 414 millimes (0.414 TND)
    const brackets = [
      { minKwh: 0, maxKwh: 50, pricePerKwhTnd: 0.062, vatRate: 0.07 },
      { minKwh: 51, maxKwh: 100, pricePerKwhTnd: 0.096, vatRate: 0.07 },
      { minKwh: 101, maxKwh: 200, pricePerKwhTnd: 0.176, vatRate: 0.07 },
      { minKwh: 201, maxKwh: 300, pricePerKwhTnd: 0.218, vatRate: 0.07 },
      { minKwh: 301, maxKwh: 500, pricePerKwhTnd: 0.341, vatRate: 0.13 },
      { minKwh: 501, maxKwh: 99999, pricePerKwhTnd: 0.414, vatRate: 0.13 },
    ];

    for (const b of brackets) {
      await prisma.tariffBracket.create({
        data: {
          tariffVersionId: stegTariff.id,
          ...b,
        }
      });
    }

    // Previous version for version comparison
    const stegTariffOld = await prisma.tariffVersion.create({
      data: {
        name: 'Ancienne Grille STEG Basse Tension (Avant Mai 2022)',
        version: 'STEG-BT-2019.2',
        effectiveFrom: new Date('2019-06-01'),
        effectiveTo: new Date('2022-04-30'),
        customerCategory: 'RESIDENTIAL',
        powerFeePerKva: 0.600,
        isActive: false,
      }
    });

    const oldBrackets = [
      { minKwh: 0, maxKwh: 50, pricePerKwhTnd: 0.055, vatRate: 0.07 },
      { minKwh: 51, maxKwh: 100, pricePerKwhTnd: 0.085, vatRate: 0.07 },
      { minKwh: 101, maxKwh: 200, pricePerKwhTnd: 0.155, vatRate: 0.07 },
      { minKwh: 201, maxKwh: 300, pricePerKwhTnd: 0.195, vatRate: 0.07 },
      { minKwh: 301, maxKwh: 500, pricePerKwhTnd: 0.295, vatRate: 0.13 },
      { minKwh: 501, maxKwh: 99999, pricePerKwhTnd: 0.360, vatRate: 0.13 },
    ];

    for (const ob of oldBrackets) {
      await prisma.tariffBracket.create({
        data: {
          tariffVersionId: stegTariffOld.id,
          ...ob,
        }
      });
    }
  }

  // 7. Initial Historical Energy Readings (Past 30 days)
  const readingsCount = await prisma.energyReading.count();
  if (readingsCount === 0) {
    console.log('Generating 30-day realistic historical dataset...');
    const now = new Date();
    const readings = [];
    const transactions = [];

    for (let day = 29; day >= 0; day--) {
      for (let hour = 0; hour < 24; hour++) {
        const time = new Date(now.getTime() - (day * 24 + (23 - hour)) * 3600 * 1000);
        
        // Solar profile: 0 outside 06:00 - 18:00, sinusoidal peak at 12:30 ~ 13:00
        let solarKw = 0;
        if (hour >= 6 && hour <= 18) {
          const solarProgress = (hour - 6) / 12; // 0 to 1
          const peakSolar = 14.5 + Math.sin(day * 0.5) * 2.5; // slight day variation
          solarKw = Math.max(0, peakSolar * Math.sin(solarProgress * Math.PI));
          // add slight realistic noise
          solarKw *= 0.9 + Math.random() * 0.2;
        }

        // Consumption profile: base 5 kW + morning peak (07-09) + evening peak (18-22)
        let baseConsumption = 6.0;
        if (hour >= 7 && hour <= 9) baseConsumption += 4.5;
        if (hour >= 12 && hour <= 14) baseConsumption += 3.0;
        if (hour >= 18 && hour <= 22) baseConsumption += 7.5;
        baseConsumption *= 0.85 + Math.random() * 0.3;

        const balance = solarKw - baseConsumption;
        let batteryPower = 0;
        let gridImport = 0;
        let gridExport = 0;
        let state = 'BALANCED';

        if (balance > 1.0) {
          state = 'SURPLUS';
          // Charge battery up to 6 kW
          batteryPower = Math.min(balance, 6.0);
          const remainingSurplus = balance - batteryPower;
          if (remainingSurplus > 0.5) {
            gridExport = remainingSurplus;
          }
        } else if (balance < -0.5) {
          state = 'DEFICIT';
          // Discharge battery up to 5 kW
          batteryPower = -Math.min(Math.abs(balance), 5.0);
          const remainingDeficit = Math.abs(balance) - Math.abs(batteryPower);
          if (remainingDeficit > 0) {
            gridImport = remainingDeficit;
          }
        }

        readings.push({
          timestamp: time,
          solarProduction: parseFloat(solarKw.toFixed(2)),
          totalConsumption: parseFloat(baseConsumption.toFixed(2)),
          batteryPower: parseFloat(batteryPower.toFixed(2)),
          gridImport: parseFloat(gridImport.toFixed(2)),
          gridExport: parseFloat(gridExport.toFixed(2)),
          netBalance: parseFloat(balance.toFixed(2)),
          state,
          intervalType: 'HOURLY',
        });

        // If exported, generate trading transaction record
        if (gridExport > 1.0 && (hour === 12 || hour === 14)) {
          transactions.push({
            timestamp: time,
            energyKwh: parseFloat((gridExport * 1.0).toFixed(2)),
            pricePerKwh: 0.250,
            totalAmountTnd: parseFloat((gridExport * 0.250).toFixed(3)),
            type: 'EXPORT',
            status: 'COMPLETED',
          });
        }
      }
    }

    // Insert in chunks
    for (let i = 0; i < readings.length; i += 100) {
      await prisma.energyReading.createMany({
        data: readings.slice(i, i + 100),
      });
    }

    if (transactions.length > 0) {
      await prisma.energyTransaction.createMany({
        data: transactions.slice(0, 50),
      });
    }
  }

  // 8. Initial Decisions Log
  const decisionCount = await prisma.distributionDecision.count();
  if (decisionCount === 0) {
    const decisions = [
      {
        timestamp: new Date(Date.now() - 3600000 * 3),
        situation: 'SURPLUS',
        reason: 'Solar production reached 14.8 kW exceeding total load of 8.2 kW',
        action: 'Routed 4.5 kW to Battery 1 & 2 charging. Exported 2.1 kW surplus to grid.',
        affectedEntity: 'Battery 1, Battery 2, Grid',
        mode: 'AUTOMATIC',
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 8),
        situation: 'DEFICIT',
        reason: 'Evening demand peak (19.4 kW) with zero solar production',
        action: 'Discharged Battery 1 at 5.2 kW and Battery 2 at 3.8 kW. Maintained full supply across all zones.',
        affectedEntity: 'Battery 1, Battery 2, All Zones',
        mode: 'AUTOMATIC',
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 24),
        situation: 'DEFICIT',
        reason: 'Low solar radiation combined with high water heating & HVAC operation',
        action: 'Activated Eco reduction: throttled Zone 4 auxiliary EV charger by 40% before any shedding.',
        affectedEntity: 'Zone 4 (Low Priority)',
        mode: 'ECO',
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 48),
        situation: 'CRITICAL',
        reason: 'Simulated battery reserve near minimum limit (21%) with persistent grid disruption',
        action: 'Preemptively disconnected Zone 4 (Low Priority) to preserve 100% integrity of Zone 1 Critical medical & server loads.',
        affectedEntity: 'Zone 4 (Low Priority)',
        mode: 'AUTOMATIC',
      },
    ];

    for (const d of decisions) {
      await prisma.distributionDecision.create({ data: d });
    }
  }

  // 9. Initial Notifications
  const notifCount = await prisma.notification.count();
  if (notifCount === 0) {
    const notifications = [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        severity: 'INFORMATION',
        title: 'Solar Generation Peak Detected',
        description: 'Solar arrays reached 15.2 kW. Battery 1 charging at 95% efficiency.',
        entityType: 'Solar',
        isRead: false,
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        severity: 'WARNING',
        title: 'Appliance Aging Alert: Inverter Office AC',
        description: 'Zone 2 Office AC is drawing +15% above nominal baseline. Routine coil cleaning recommended.',
        entityType: 'Zone',
        entityId: '2',
        isRead: false,
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
        severity: 'CRITICAL',
        title: 'Low Reserve Pre-Warning: Battery 3',
        description: 'Battery 3 state of charge reached 45%. Discharge throttled in accordance with priority policy.',
        entityType: 'Battery',
        entityId: '3',
        isRead: false,
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 360),
        severity: 'INFORMATION',
        title: 'Energy Export Milestone',
        description: 'Successfully exported 18.5 kWh to the grid today. Estimated revenue: +4.625 TND.',
        entityType: 'Trading',
        isRead: true,
      },
    ];

    for (const n of notifications) {
      await prisma.notification.create({ data: n });
    }
  }

  console.log('✅ Database initialization and seed check completed.');
}
