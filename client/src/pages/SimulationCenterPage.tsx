import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Save,
  Download,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Battery,
  Sun,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { SimulationScenario } from '../types';

export const SimulationCenterPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);

  // Sliders
  const [solarFactor, setSolarFactor] = useState(1.0);
  const [zone1Kw, setZone1Kw] = useState(5.0);
  const [zone2Kw, setZone2Kw] = useState(4.0);
  const [zone3Kw, setZone3Kw] = useState(6.0);
  const [zone4Kw, setZone4Kw] = useState(3.0);
  const [b1Soc, setB1Soc] = useState(95);
  const [b2Soc, setB2Soc] = useState(70);
  const [b3Soc, setB3Soc] = useState(45);

  // Simulation run state
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const fetchScenarios = async () => {
    try {
      const res = await api.getScenarios();
      setScenarios(res);
      if (res.length > 0) {
        handleSelectScenario(res[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleSelectScenario = (sc: SimulationScenario) => {
    setSelectedScenario(sc);
    setSolarFactor(sc.solarFactor);
    setZone1Kw(5.0 * sc.zone1Multiplier);
    setZone2Kw(4.0 * sc.zone2Multiplier);
    setZone3Kw(6.0 * sc.zone3Multiplier);
    setZone4Kw(3.0 * sc.zone4Multiplier);
    setB1Soc(sc.battery1Soc);
    setB2Soc(sc.battery2Soc);
    setB3Soc(sc.battery3Soc);
  };

  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      if (selectedScenario && activeTab === 'presets') {
        const res = await api.runScenarioById(selectedScenario.id);
        setSimulationResult(res);
      } else {
        const res = await api.runSimulation({
          scenarioName: 'Custom Parameter Simulation',
          solarFactor,
          zoneOverrides: {
            zone1Kw,
            zone2Kw,
            zone3Kw,
            zone4Kw,
          },
          batteryOverrides: {
            battery1Soc: b1Soc,
            battery2Soc: b2Soc,
            battery3Soc: b3Soc,
          },
        });
        setSimulationResult({
          after: res.result,
          comparison: {
            zonesReducedOrShed: res.result.zones.filter((z: any) => z.shedStatus !== 'NORMAL'),
            financialRevenueDeltaTnd: res.result.financialRevenueTndPerHour,
          }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSimulation();
      setSolarFactor(1.0);
      setZone1Kw(5.0);
      setZone2Kw(4.0);
      setZone3Kw(6.0);
      setZone4Kw(3.0);
      setB1Soc(95);
      setB2Soc(70);
      setB3Soc(45);
      setSimulationResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJson = () => {
    if (!simulationResult) return;
    const blob = new Blob([JSON.stringify(simulationResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-result-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-[#101B2D] to-slate-900 border border-blue-900/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-cyan-400">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Interactive Simulation Center</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Stress-test microgrid stability, cloud attenuation, battery failures &amp; emergency load shedding
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Nominal
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Play className={`w-4 h-4 fill-white ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Engine...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* Laboratory Setup Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Scenarios or Custom Sliders */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'presets'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  10 Predefined Scenarios
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'custom'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Custom Sliders
                </button>
              </div>
            </div>

            {activeTab === 'presets' ? (
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {scenarios.map((sc, index) => {
                  const isSelected = selectedScenario?.id === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => handleSelectScenario(sc)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-slate-900 dark:text-white shadow-sm'
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">
                          {index + 1}. {sc.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {sc.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                        <span>Solar: {(sc.solarFactor * 100).toFixed(0)}%</span>
                        <span>•</span>
                        <span>B1: {sc.battery1Soc}%</span>
                        <span>•</span>
                        <span>B2: {sc.battery2Soc}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Solar Slider */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <Sun className="w-3.5 h-3.5" /> Solar Irradiation Factor
                    </span>
                    <span className="font-bold">{(solarFactor * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.05"
                    value={solarFactor}
                    onChange={(e) => setSolarFactor(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Zone Sliders */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Zone Power Demands (kW)
                  </span>
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-rose-500">Zone 1 (Critical)</span>
                      <span>{zone1Kw.toFixed(1)} kW</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={zone1Kw}
                      onChange={(e) => setZone1Kw(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-amber-500">Zone 2 (High)</span>
                      <span>{zone2Kw.toFixed(1)} kW</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="0.5"
                      value={zone2Kw}
                      onChange={(e) => setZone2Kw(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-blue-500">Zone 3 (Medium)</span>
                      <span>{zone3Kw.toFixed(1)} kW</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="0.5"
                      value={zone3Kw}
                      onChange={(e) => setZone3Kw(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-emerald-500">Zone 4 (Low)</span>
                      <span>{zone4Kw.toFixed(1)} kW</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="7"
                      step="0.5"
                      value={zone4Kw}
                      onChange={(e) => setZone4Kw(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                {/* Battery Sliders */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Battery Initial SOC (%)
                  </span>
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-purple-400">
                      <span>Battery 1 (20kWh)</span>
                      <span>{b1Soc}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={b1Soc}
                      onChange={(e) => setB1Soc(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-purple-400">
                      <span>Battery 2 (15kWh)</span>
                      <span>{b2Soc}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={b2Soc}
                      onChange={(e) => setB2Soc(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-purple-400">
                      <span>Battery 3 (10kWh)</span>
                      <span>{b3Soc}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={b3Soc}
                      onChange={(e) => setB3Soc(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Before vs After & Live Result Analysis */}
        <div className="lg:col-span-7 space-y-6">
          {simulationResult ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Simulation Run Outcome &amp; Diagnostics
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated steady-state power dispatch, active load adjustments, and financial revenue impact
                  </p>
                </div>
                <button
                  onClick={handleExportJson}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Export results JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Before vs After KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400">Solar Output</span>
                  <p className="text-lg font-extrabold text-amber-500 mt-1">
                    {simulationResult.after?.solarProductionKw} kW
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400">Total Supplied Load</span>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                    {simulationResult.after?.totalSuppliedLoadKw} kW
                  </p>
                  <p className="text-[10px] text-slate-400">
                    of {simulationResult.after?.totalRequestedLoadKw} kW req
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400">Grid Interaction</span>
                  <p className="text-lg font-extrabold text-blue-500 mt-1">
                    {simulationResult.after?.gridExportKw > 0
                      ? `+${simulationResult.after?.gridExportKw} kW Exp`
                      : simulationResult.after?.gridImportKw > 0
                      ? `-${simulationResult.after?.gridImportKw} kW Imp`
                      : '0 kW Isolated'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400">Financial Rate</span>
                  <p className="text-lg font-extrabold text-emerald-500 mt-1">
                    +{simulationResult.after?.financialRevenueTndPerHour} TND/h
                  </p>
                </div>
              </div>

              {/* Shedding / Load Reduction Banner */}
              {simulationResult.comparison?.zonesReducedOrShed?.length > 0 ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5" />
                    <span>Automatic Priority Shedding Action Triggered</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {simulationResult.comparison.zonesReducedOrShed.map((z: any) => (
                      <div key={z.zoneNumber} className="flex items-center justify-between">
                        <span>{z.name} (Priority {z.priorityLevel}):</span>
                        <strong className="text-rose-400">
                          {z.shedStatus === 'SHED' ? 'Fully Disconnected (0 kW)' : `Throttled by ${z.reductionPercent}%`}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All 4 zones maintained at 100% supply capacity without shedding.</span>
                </div>
              )}

              {/* Decision Logs generated by engine */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Engine Action &amp; Dispatch Sequence
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {simulationResult.after?.decisionLogs?.map((log: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                          {log.situation}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{log.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#101B2D] border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
              <FlaskConical className="w-12 h-12 text-blue-500 mx-auto opacity-40 animate-pulse" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No Active Simulation Run
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Pick a scenario from the 10 presets or configure custom sliders, then click "Run Simulation" to inspect dynamic dispatch behavior.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
