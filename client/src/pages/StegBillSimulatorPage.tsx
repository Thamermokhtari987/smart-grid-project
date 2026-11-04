import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Calculator,
  Download,
  RotateCcw,
  Save,
  ShieldCheck,
  AlertCircle,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { api } from '../services/api';
import { StegBillResult } from '../types';
import { useSystem } from '../context/SystemContext';

export const StegBillSimulatorPage: React.FC = () => {
  const { kpis } = useSystem();

  // Inputs
  const [customerType, setCustomerType] = useState<'RESIDENTIAL' | 'NON_RESIDENTIAL'>('RESIDENTIAL');
  const [contractedPowerKva, setContractedPowerKva] = useState<number>(4.0);
  const [billingPeriodMonths, setBillingPeriodMonths] = useState<number>(2); // Standard STEG bimestrielle
  const [consumptionSource, setConsumptionSource] = useState<'MANUAL' | 'SIMULATED' | 'NET_SOLAR'>('NET_SOLAR');
  const [manualKwh, setManualKwh] = useState<number>(680);

  // Result
  const [billResult, setBillResult] = useState<StegBillResult | null>(null);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [selectedTariffId, setSelectedTariffId] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchTariffs = async () => {
    try {
      const res = await api.getStegTariffs();
      setTariffs(res);
      if (res.length > 0) setSelectedTariffId(res[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTariffs();
  }, []);

  const getEffectiveKwh = () => {
    if (consumptionSource === 'MANUAL') return manualKwh;
    if (consumptionSource === 'SIMULATED') return 850; // typical 2-month gross load
    // NET_SOLAR: gross load minus solar self-consumption
    return 320; // 320 kWh net from grid after solar
  };

  const handleCalculate = async (saveRecord = false) => {
    setIsCalculating(true);
    setSaveSuccess(false);
    try {
      const totalCons = getEffectiveKwh();
      const solarDeduction = consumptionSource === 'NET_SOLAR' ? 530 : 0;
      const exported = consumptionSource === 'NET_SOLAR' ? 95 : 0;

      const res = await api.calculateStegBill({
        customerType,
        contractedPowerKva,
        billingPeriodMonths,
        totalConsumptionKwh: totalCons + solarDeduction,
        solarSelfConsumedKwh: solarDeduction,
        solarExportedKwh: exported,
        exportTariffTnd: 0.250,
        saveRecord,
        tariffVersionId: selectedTariffId || undefined,
      });

      setBillResult(res);
      if (saveRecord) setSaveSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    handleCalculate(false);
  }, [customerType, contractedPowerKva, billingPeriodMonths, consumptionSource, manualKwh, selectedTariffId]);

  const handleReset = () => {
    setCustomerType('RESIDENTIAL');
    setContractedPowerKva(4.0);
    setBillingPeriodMonths(2);
    setConsumptionSource('NET_SOLAR');
    setManualKwh(680);
    setSaveSuccess(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-[#101B2D] to-slate-900 border border-blue-900/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-cyan-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">STEG Electricity Bill Simulator</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Calculations based on official Tunisian STEG Low Voltage Basse Tension Tariffs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-cyan-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Official Reference: steg.com.tn/fr/node/12034</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-500" />
                Customer Subscription &amp; Period
              </h3>
              <span className="text-[10px] uppercase font-bold text-slate-400">Configurable</span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Tariff Version Selector */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Active STEG Tariff Schedule
                </label>
                <select
                  value={selectedTariffId}
                  onChange={(e) => setSelectedTariffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {tariffs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.version})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Customer Category
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="RESIDENTIAL">Domestic / Residential</option>
                    <option value="NON_RESIDENTIAL">Non-Residential / Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Contracted Power (kVA)
                  </label>
                  <select
                    value={contractedPowerKva}
                    onChange={(e) => setContractedPowerKva(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value={1}>1 kVA (Social)</option>
                    <option value={2}>2 kVA</option>
                    <option value={4}>4 kVA (Standard)</option>
                    <option value={6}>6 kVA (Comfort)</option>
                    <option value={10}>10 kVA (Heavy)</option>
                    <option value={15}>15 kVA (Commercial)</option>
                  </select>
                </div>
              </div>

              {/* Billing Period */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Billing Period
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingPeriodMonths(1)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      billingPeriodMonths === 1
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    1 Month (Monthly)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriodMonths(2)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      billingPeriodMonths === 2
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    2 Months (STEG Bimestrielle)
                  </button>
                </div>
              </div>

              {/* Consumption Source */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Electricity Consumption Input Source
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="radio"
                      name="consSource"
                      checked={consumptionSource === 'NET_SOLAR'}
                      onChange={() => setConsumptionSource('NET_SOLAR')}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Net Grid Import after Solar Self-Consumption</p>
                      <p className="text-[11px] text-slate-400">Total home consumption minus on-site PV production</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="radio"
                      name="consSource"
                      checked={consumptionSource === 'SIMULATED'}
                      onChange={() => setConsumptionSource('SIMULATED')}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Simulated Gross Multi-Zone Telemetry</p>
                      <p className="text-[11px] text-slate-400">Raw aggregated microgrid demand without solar offset</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="radio"
                      name="consSource"
                      checked={consumptionSource === 'MANUAL'}
                      onChange={() => setConsumptionSource('MANUAL')}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Manual Meter Entry</p>
                      <p className="text-[11px] text-slate-400">Custom user-defined index or benchmark kWh</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Manual Input Slider if selected */}
              {consumptionSource === 'MANUAL' && (
                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
                  <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>Manual Energy Consumed:</span>
                    <strong className="text-blue-600 dark:text-cyan-400">{manualKwh} kWh</strong>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="2000"
                    step="10"
                    value={manualKwh}
                    onChange={(e) => setManualKwh(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCalculate(true)}
                  disabled={isCalculating}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saveSuccess ? 'Saved to Invoices!' : 'Save Simulation'}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Reset to default STEG parameters"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed STEG Invoice Document */}
        <div className="lg:col-span-7 space-y-6">
          {billResult && (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 print:border-none print:shadow-none">
              {/* STEG Official Invoice Header */}
              <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center font-extrabold text-slate-900 text-xs">
                      STEG
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                        Société Tunisienne de l'Électricité et du Gaz
                      </h2>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        Direction Distribution • Facture Basse Tension (BT)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    SIMULÉE
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Période: {billResult.billingPeriodMonths} Mois
                  </p>
                </div>
              </div>

              {/* Subscriber Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <div>
                  <span className="text-slate-400">Catégorie Client</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{billResult.customerType}</p>
                </div>
                <div>
                  <span className="text-slate-400">Puissance Souscrite</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{billResult.contractedPowerKva} kVA</p>
                </div>
                <div>
                  <span className="text-slate-400">Énergie Facturée</span>
                  <p className="font-bold text-blue-600 dark:text-cyan-400 mt-0.5">{billResult.netBilledGridKwh} kWh</p>
                </div>
                <div>
                  <span className="text-slate-400">Moyenne Mensuelle</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{billResult.averageMonthlyKwh} kWh/mois</p>
                </div>
              </div>

              {/* Bracket Breakdown Table (Prorated) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Décompte par Tranches de Consommation STEG
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Tranche</th>
                        <th className="py-2.5 px-3">kWh Consommés</th>
                        <th className="py-2.5 px-3">Tarif HT (TND)</th>
                        <th className="py-2.5 px-3">Montant HT</th>
                        <th className="py-2.5 px-3">TVA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {billResult.bracketBreakdown
                        .filter(b => b.consumedKwhInBracket > 0)
                        .map((b, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {b.bracketName}
                            </td>
                            <td className="py-2.5 px-3 font-mono">{b.consumedKwhInBracket} kWh</td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">{b.rateTnd.toFixed(3)}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {b.amountHtTnd.toFixed(3)} TND
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {(b.vatRate * 100).toFixed(0)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Financial Line Items */}
              <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Coût Énergie Consommée (HT)</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    {billResult.energyCostHtTnd.toFixed(3)} TND
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>
                    Redevance de Puissance ({billResult.contractedPowerKva} kVA × {billResult.billingPeriodMonths} mois)
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    {billResult.fixedPowerFeeHtTnd.toFixed(3)} TND
                  </span>
                </div>

                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1">
                  <span>TOTAL HORS TAXES (HT)</span>
                  <span className="font-mono text-sm">{billResult.totalHtTnd.toFixed(3)} TND</span>
                </div>

                <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>TVA Globale (7% / 13% Énergie + 19% Redevance Fixe)</span>
                  <span className="font-mono">{billResult.totalVatTnd.toFixed(3)} TND</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Contribution Collectivités Locales (0.005 TND / kWh)</span>
                  <span className="font-mono">{billResult.municipalTaxClTnd.toFixed(3)} TND</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Fonds de Transition Énergétique (FTE)</span>
                  <span className="font-mono">{billResult.energyTransitionFundFteTnd.toFixed(3)} TND</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Redevance Radio-Télévision Tunisienne (RTT) &amp; Timbre</span>
                  <span className="font-mono">{(billResult.rttTaxTnd + billResult.stampDutyTnd).toFixed(3)} TND</span>
                </div>

                {/* Total TTC Final Banner */}
                <div className="p-4 rounded-2xl bg-slate-900 dark:bg-black text-white flex items-center justify-between mt-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Montant Net TTC Facture STEG
                    </span>
                    <p className="text-2xl font-extrabold text-cyan-400 font-mono mt-0.5">
                      {billResult.totalTtcTnd.toFixed(3)} TND
                    </p>
                  </div>

                  {billResult.solarExportRevenueTnd > 0 && (
                    <div className="text-right border-l border-slate-800 pl-4">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold">
                        Crédit Solaire Vendu
                      </span>
                      <p className="text-sm font-extrabold text-emerald-400 font-mono">
                        -{billResult.solarExportRevenueTnd.toFixed(3)} TND
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-slate-400 italic text-center leading-relaxed">
                {billResult.disclaimer}
              </p>

              {/* Print / Download Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer / Télécharger Facture PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
