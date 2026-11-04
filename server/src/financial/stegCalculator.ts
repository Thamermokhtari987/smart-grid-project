import { prisma } from '../db.js';

export interface StegCalculationInput {
  customerType: 'RESIDENTIAL' | 'NON_RESIDENTIAL';
  contractedPowerKva: number; // e.g. 1, 2, 4, 6, 10
  billingPeriodMonths: number; // 1 or 2
  totalConsumptionKwh: number;
  solarSelfConsumedKwh?: number; // energy produced & consumed locally
  solarExportedKwh?: number;     // energy sold to the grid
  exportTariffTnd?: number;      // e.g. 0.250 TND / kWh
  tariffVersionId?: string;      // optional custom tariff version ID
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
  municipalTaxClTnd: number;       // Contribution Collectivités Locales
  energyTransitionFundFteTnd: number; // FTE
  rttTaxTnd: number;              // Radio Télévision Tunisienne
  stampDutyTnd: number;           // Timbre fiscal
  totalTaxesAndFeesTnd: number;
  totalTtcTnd: number;
  solarExportRevenueTnd: number;
  netPayableAfterSolarTnd: number;
  isSimulated: boolean;
  tariffVersionName: string;
  disclaimer: string;
}

export interface SolarSavingsComparison {
  scenarioGridOnly: {
    billedKwh: number;
    totalBillTtcTnd: number;
    annualBillTtcTnd: number;
  };
  scenarioWithSolar: {
    billedKwh: number;
    totalBillTtcTnd: number;
    annualBillTtcTnd: number;
    solarExportRevenueTnd: number;
    annualExportRevenueTnd: number;
    netAnnualCostTnd: number;
  };
  monthlySavingsTnd: number;
  annualSavingsTnd: number;
  billReductionPercent: number;
  estimatedSystemCostTnd: number;
  paybackPeriodYears: number;
}

export class StegCalculator {
  /**
   * Calculate detailed STEG bill for a given consumption
   */
  public static async calculateBill(input: StegCalculationInput): Promise<StegBillResult> {
    const months = Math.max(1, input.billingPeriodMonths || 2);
    const powerKva = input.contractedPowerKva || 4.0;
    const grossKwh = input.totalConsumptionKwh;
    const solarSelfConsumed = input.solarSelfConsumedKwh || 0;
    const netGridKwh = Math.max(0, grossKwh - solarSelfConsumed);
    const avgMonthlyKwh = netGridKwh / months;

    // Fetch active tariff from DB
    let tariff = null;
    if (input.tariffVersionId) {
      tariff = await prisma.tariffVersion.findUnique({
        where: { id: input.tariffVersionId },
        include: { brackets: { orderBy: { minKwh: 'asc' } } }
      });
    }
    if (!tariff) {
      tariff = await prisma.tariffVersion.findFirst({
        where: { isActive: true },
        include: { brackets: { orderBy: { minKwh: 'asc' } } }
      });
    }

    const tariffName = tariff?.name || 'Grille STEG Basse Tension Résidentielle 2024-2025';
    const powerFeeRate = tariff?.powerFeePerKva ?? 0.700; // 0.700 TND / kVA / month

    // Official STEG default brackets if DB brackets not found
    const dbBrackets = tariff?.brackets && tariff.brackets.length > 0 ? tariff.brackets : [
      { minKwh: 0, maxKwh: 50, pricePerKwhTnd: 0.062, vatRate: 0.07 },
      { minKwh: 51, maxKwh: 100, pricePerKwhTnd: 0.096, vatRate: 0.07 },
      { minKwh: 101, maxKwh: 200, pricePerKwhTnd: 0.176, vatRate: 0.07 },
      { minKwh: 201, maxKwh: 300, pricePerKwhTnd: 0.218, vatRate: 0.07 },
      { minKwh: 301, maxKwh: 500, pricePerKwhTnd: 0.341, vatRate: 0.13 },
      { minKwh: 501, maxKwh: 99999, pricePerKwhTnd: 0.414, vatRate: 0.13 },
    ];

    // Compute bracket allocation: thresholds are prorated by number of months
    const bracketBreakdown: StegBracketLine[] = [];
    let remainingKwh = netGridKwh;
    let totalEnergyHt = 0;
    let totalEnergyVat = 0;

    for (let i = 0; i < dbBrackets.length; i++) {
      const b = dbBrackets[i];
      const scaledMin = i === 0 ? 0 : (b.minKwh - 1) * months;
      const scaledMax = b.maxKwh > 50000 ? Infinity : b.maxKwh * months;
      const bracketCapacity = scaledMax - scaledMin;

      let kwhInThisBracket = 0;
      if (remainingKwh > 0) {
        kwhInThisBracket = Math.min(remainingKwh, bracketCapacity);
        remainingKwh -= kwhInThisBracket;
      }

      const amountHt = parseFloat((kwhInThisBracket * b.pricePerKwhTnd).toFixed(3));
      // VAT rule: 7% if avg monthly consumption <= 300 kWh, 13% for the portion above 300 kWh
      const vatRate = avgMonthlyKwh > 300 && b.minKwh > 300 ? 0.13 : b.vatRate;
      const vatAmount = parseFloat((amountHt * vatRate).toFixed(3));

      totalEnergyHt += amountHt;
      totalEnergyVat += vatAmount;

      bracketBreakdown.push({
        bracketName: b.maxKwh > 50000 ? `> ${500 * months} kWh` : `${scaledMin + (i === 0 ? 0 : 1)} - ${scaledMax} kWh`,
        minKwh: scaledMin,
        maxKwh: scaledMax,
        consumedKwhInBracket: parseFloat(kwhInThisBracket.toFixed(2)),
        rateTnd: b.pricePerKwhTnd,
        amountHtTnd: amountHt,
        vatRate: vatRate,
        vatAmountTnd: vatAmount,
      });
    }

    // Fixed charges
    // Redevance de puissance: power (kVA) * rate * months
    const fixedPowerFeeHt = parseFloat((powerKva * powerFeeRate * months).toFixed(3));
    const fixedPowerFeeVat = parseFloat((fixedPowerFeeHt * 0.19).toFixed(3)); // 19% VAT on fixed redevance
    const totalHt = parseFloat((totalEnergyHt + fixedPowerFeeHt).toFixed(3));
    const totalVat = parseFloat((totalEnergyVat + fixedPowerFeeVat).toFixed(3));

    // Taxes & contributions
    // Contribution Collectivités Locales: 0.005 TND per kWh
    const municipalTaxCl = parseFloat((netGridKwh * 0.005).toFixed(3));
    // Fonds de Transition Énergétique (FTE)
    const fteTax = 1.250 * (months === 2 ? 1.0 : 0.5);
    // Radio Télévision Tunisienne (RTT)
    const rttTax = 0.500;
    // Timbre fiscal
    const stampDuty = 1.000;

    const totalTaxesAndFees = parseFloat((totalVat + municipalTaxCl + fteTax + rttTax + stampDuty).toFixed(3));
    const totalTtc = parseFloat((totalHt + totalTaxesAndFees).toFixed(3));

    // Export revenue
    const exportTariff = input.exportTariffTnd ?? 0.250;
    const solarExportRevenue = parseFloat(((input.solarExportedKwh || 0) * exportTariff).toFixed(3));
    const netPayable = parseFloat(Math.max(0, totalTtc - solarExportRevenue).toFixed(3));

    return {
      customerType: input.customerType,
      contractedPowerKva: powerKva,
      billingPeriodMonths: months,
      totalGrossKwh: parseFloat(grossKwh.toFixed(2)),
      solarSelfConsumedKwh: parseFloat(solarSelfConsumed.toFixed(2)),
      netBilledGridKwh: parseFloat(netGridKwh.toFixed(2)),
      averageMonthlyKwh: parseFloat(avgMonthlyKwh.toFixed(2)),
      bracketBreakdown,
      energyCostHtTnd: parseFloat(totalEnergyHt.toFixed(3)),
      fixedPowerFeeHtTnd: fixedPowerFeeHt,
      fixedPowerFeeVatTnd: fixedPowerFeeVat,
      totalHtTnd: totalHt,
      energyVatTnd: parseFloat(totalEnergyVat.toFixed(3)),
      totalVatTnd: totalVat,
      municipalTaxClTnd: municipalTaxCl,
      energyTransitionFundFteTnd: parseFloat(fteTax.toFixed(3)),
      rttTaxTnd: rttTax,
      stampDutyTnd: stampDuty,
      totalTaxesAndFeesTnd: totalTaxesAndFees,
      totalTtcTnd: totalTtc,
      solarExportRevenueTnd: solarExportRevenue,
      netPayableAfterSolarTnd: netPayable,
      isSimulated: true,
      tariffVersionName: tariffName,
      disclaimer: 'Ce calcul constitue une estimation rigoureuse basée sur la grille tarifaire STEG Basse Tension officielle (Réf: steg.com.tn/fr/node/12034). Il ne saurait remplacer une facture STEG émise formellement.',
    };
  }

  /**
   * Compare Grid-Only scenario vs Solar+Battery installation
   */
  public static async compareSolarSavings(
    totalMonthlyConsumptionKwh: number,
    monthlySolarProductionKwh: number,
    batteryCapacityKwh: number = 45.0,
    systemInstalledCostTnd: number = 28500.0,
    contractedPowerKva: number = 6.0
  ): Promise<SolarSavingsComparison> {
    // 1. Grid-Only Scenario: 100% of consumption drawn from grid
    const billGridOnly = await this.calculateBill({
      customerType: 'RESIDENTIAL',
      contractedPowerKva,
      billingPeriodMonths: 1,
      totalConsumptionKwh: totalMonthlyConsumptionKwh,
      solarSelfConsumedKwh: 0,
      solarExportedKwh: 0,
    });

    // 2. Solar + Storage:
    // With smart battery storage, typical self-consumption is 75-85% of solar production
    const selfConsumedKwh = Math.min(totalMonthlyConsumptionKwh, monthlySolarProductionKwh * 0.80);
    const exportedKwh = Math.max(0, monthlySolarProductionKwh - selfConsumedKwh);

    const billWithSolar = await this.calculateBill({
      customerType: 'RESIDENTIAL',
      contractedPowerKva,
      billingPeriodMonths: 1,
      totalConsumptionKwh: totalMonthlyConsumptionKwh,
      solarSelfConsumedKwh: selfConsumedKwh,
      solarExportedKwh: exportedKwh,
      exportTariffTnd: 0.250,
    });

    const monthlyGrossSavings = Math.max(0, billGridOnly.totalTtcTnd - billWithSolar.totalTtcTnd);
    const totalMonthlyNetSavings = monthlyGrossSavings + billWithSolar.solarExportRevenueTnd;
    const annualSavings = totalMonthlyNetSavings * 12;

    const billReductionPercent = billGridOnly.totalTtcTnd > 0
      ? parseFloat(((monthlyGrossSavings / billGridOnly.totalTtcTnd) * 100).toFixed(1))
      : 0;

    const paybackYears = annualSavings > 0
      ? parseFloat((systemInstalledCostTnd / annualSavings).toFixed(1))
      : 0;

    return {
      scenarioGridOnly: {
        billedKwh: billGridOnly.netBilledGridKwh,
        totalBillTtcTnd: billGridOnly.totalTtcTnd,
        annualBillTtcTnd: parseFloat((billGridOnly.totalTtcTnd * 12).toFixed(2)),
      },
      scenarioWithSolar: {
        billedKwh: billWithSolar.netBilledGridKwh,
        totalBillTtcTnd: billWithSolar.totalTtcTnd,
        annualBillTtcTnd: parseFloat((billWithSolar.totalTtcTnd * 12).toFixed(2)),
        solarExportRevenueTnd: billWithSolar.solarExportRevenueTnd,
        annualExportRevenueTnd: parseFloat((billWithSolar.solarExportRevenueTnd * 12).toFixed(2)),
        netAnnualCostTnd: parseFloat((billWithSolar.totalTtcTnd * 12 - billWithSolar.solarExportRevenueTnd * 12).toFixed(2)),
      },
      monthlySavingsTnd: parseFloat(totalMonthlyNetSavings.toFixed(2)),
      annualSavingsTnd: parseFloat(annualSavings.toFixed(2)),
      billReductionPercent,
      estimatedSystemCostTnd: systemInstalledCostTnd,
      paybackPeriodYears: paybackYears,
    };
  }
}
