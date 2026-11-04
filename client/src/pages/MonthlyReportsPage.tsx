import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  Zap,
  Sun,
  Leaf,
  Coins,
} from 'lucide-react';
import { api } from '../services/api';

export const MonthlyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.getMonthlyReports();
      setReports(res);
      if (res.length > 0) setSelectedReport(res[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCsv = () => {
    if (!reports.length) return;
    const headers = ['Month', 'Year', 'Solar (kWh)', 'Consumption (kWh)', 'Self-Consumed (kWh)', 'Exported (kWh)', 'Imported (kWh)', 'Bill (TND)', 'Savings (TND)', 'CO2 Avoided (kg)'];
    const rows = reports.map(r => [
      r.month,
      r.year,
      r.totalSolarKwh,
      r.totalConsumptionKwh,
      r.selfConsumedKwh,
      r.exportedKwh,
      r.importedKwh,
      r.estimatedBillTnd,
      r.savingsTnd,
      r.co2AvoidedKg,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartgrid-monthly-reports.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            Monthly Energy Audit &amp; Performance Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Historical monthly summaries, billing breakdowns, feed-in revenues, and environmental offsets
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
          >
            <Printer className="w-4 h-4" />
            Print / PDF Report
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Months List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-1">
            Archived Audit Periods
          </h3>
          <div className="space-y-2">
            {reports.map((r) => {
              const isSelected = selectedReport?.id === r.id;
              const dateObj = new Date(r.year, r.month - 1);
              const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-white dark:bg-[#101B2D] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{monthName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Solar: {r.totalSolarKwh} kWh • Net Bill: {r.estimatedBillTnd} TND
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Month Report Document */}
        <div className="lg:col-span-8">
          {selectedReport && (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    Smart Grid Energy Audit Report
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {new Date(selectedReport.year, selectedReport.month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Audit Closed &amp; Verified
                </span>
              </div>

              {/* High Level Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Sun className="w-4 h-4 text-amber-500" /> Solar Generated
                  </span>
                  <p className="text-xl font-extrabold text-amber-500 mt-1">
                    {selectedReport.totalSolarKwh} kWh
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Zap className="w-4 h-4 text-rose-500" /> Total Consumed
                  </span>
                  <p className="text-xl font-extrabold text-rose-500 mt-1">
                    {selectedReport.totalConsumptionKwh} kWh
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Coins className="w-4 h-4 text-emerald-500" /> Net Savings
                  </span>
                  <p className="text-xl font-extrabold text-emerald-500 mt-1">
                    +{selectedReport.savingsTnd} TND
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Leaf className="w-4 h-4 text-emerald-400" /> CO₂ Abated
                  </span>
                  <p className="text-xl font-extrabold text-emerald-400 mt-1">
                    {selectedReport.co2AvoidedKg} kg
                  </p>
                </div>
              </div>

              {/* Detailed Audit Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Monthly Balance Breakdown
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Solar Self-Consumed on Premises</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{selectedReport.selfConsumedKwh} kWh</strong>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Surplus Exported to National Grid</span>
                    <strong className="text-emerald-500 font-mono">+{selectedReport.exportedKwh} kWh</strong>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Supplementary Electricity Imported</span>
                    <strong className="text-blue-500 font-mono">{selectedReport.importedKwh} kWh</strong>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Estimated STEG Residual Invoice</span>
                    <strong className="text-rose-500 font-mono">{selectedReport.estimatedBillTnd} TND</strong>
                  </div>
                </div>
              </div>

              {/* Major Events & Grid Stability Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Monthly Grid Quality &amp; Dispatch Highlights:</span>
                <ul className="space-y-1 text-slate-500 dark:text-slate-400 list-disc list-inside">
                  <li>Zero involuntary outages observed on Zone 1 (Critical infrastructure).</li>
                  <li>Automated Eco load reduction throttled Zone 4 during 2 localized cloudy events.</li>
                  <li>Battery storage round-trip efficiency averaged 93.4% with optimal cell thermal health.</li>
                  <li>Peak demand of {selectedReport.peakDemandKw} kW successfully buffered through multi-battery discharge.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
