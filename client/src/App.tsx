import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { SystemProvider } from './context/SystemContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

import { OverviewPage } from './pages/OverviewPage';
import { EnergyMonitoringPage } from './pages/EnergyMonitoringPage';
import { ZonesPage } from './pages/ZonesPage';
import { AppliancePage } from './pages/AppliancePage';
import { BatteryPage } from './pages/BatteryPage';
import { SmartDistributionPage } from './pages/SmartDistributionPage';
import { EnergyTradingPage } from './pages/EnergyTradingPage';
import { SimulationCenterPage } from './pages/SimulationCenterPage';
import { AnalyticsReportsPage } from './pages/AnalyticsReportsPage';
import { StegBillSimulatorPage } from './pages/StegBillSimulatorPage';
import { SolarSavingsPage } from './pages/SolarSavingsPage';
import { AlertsPage } from './pages/AlertsPage';
import { CarbonFootprintPage } from './pages/CarbonFootprintPage';
import { MonthlyReportsPage } from './pages/MonthlyReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage, clearAuth } from './pages/AuthPage';

function ProtectedClientRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    const token = localStorage.getItem('smartgrid_token');
    if (!token) {
      setStatus('unauthorized');
      return;
    }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired');
        const data = await response.json();
        if (data.user?.role !== 'CLIENT') throw new Error('Client access required');
        setStatus('authorized');
      })
      .catch(() => {
        clearAuth();
        setStatus('unauthorized');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#09111F]">
        <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      </div>
    );
  }
  if (status === 'unauthorized') return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isRtl } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B111E] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Top Navigation */}
      <Header sidebarCollapsed={sidebarCollapsed} />

      {/* Main Page Content */}
      <main
        className={`transition-all duration-300 ease-in-out pt-20 px-6 sm:px-8 pb-12 ${
          isRtl
            ? sidebarCollapsed ? 'mr-20 ml-0' : 'mr-64 ml-0'
            : sidebarCollapsed ? 'ml-20 mr-0' : 'ml-64 mr-0'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/monitoring" element={<EnergyMonitoringPage />} />
            <Route path="/zones" element={<ZonesPage />} />
            <Route path="/appliances" element={<AppliancePage />} />
            <Route path="/batteries" element={<BatteryPage />} />
            <Route path="/distribution" element={<SmartDistributionPage />} />
            <Route path="/trading" element={<EnergyTradingPage />} />
            <Route path="/simulation" element={<SimulationCenterPage />} />
            <Route path="/analytics" element={<AnalyticsReportsPage />} />
            <Route path="/steg" element={<StegBillSimulatorPage />} />
            <Route path="/savings" element={<SolarSavingsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/carbon" element={<CarbonFootprintPage />} />
            <Route path="/reports" element={<MonthlyReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SystemProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedClientRoute>
                    <MainLayout />
                  </ProtectedClientRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </SystemProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
