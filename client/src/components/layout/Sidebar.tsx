import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Layers,
  Cpu,
  BatteryCharging,
  GitFork,
  Coins,
  FlaskConical,
  BarChart3,
  Receipt,
  PiggyBank,
  Bell,
  Leaf,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { t, isRtl } = useLanguage();

  const navItems = [
    { labelKey: 'nav_overview', path: '/', icon: LayoutDashboard },
    { labelKey: 'nav_monitoring', path: '/monitoring', icon: Activity },
    { labelKey: 'nav_zones', path: '/zones', icon: Layers },
    { labelKey: 'nav_appliances', path: '/appliances', icon: Cpu },
    { labelKey: 'nav_batteries', path: '/batteries', icon: BatteryCharging },
    { labelKey: 'nav_distribution', path: '/distribution', icon: GitFork, badge: 'Core' },
    { labelKey: 'nav_trading', path: '/trading', icon: Coins },
    { labelKey: 'nav_simulation', path: '/simulation', icon: FlaskConical },
    { labelKey: 'nav_analytics', path: '/analytics', icon: BarChart3 },
    { labelKey: 'nav_steg', path: '/steg', icon: Receipt },
    { labelKey: 'nav_savings', path: '/savings', icon: PiggyBank },
    { labelKey: 'nav_alerts', path: '/alerts', icon: Bell },
    { labelKey: 'nav_carbon', path: '/carbon', icon: Leaf },
    { labelKey: 'nav_reports', path: '/reports', icon: FileSpreadsheet },
    { labelKey: 'nav_settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 z-30 h-screen transition-all duration-300 ease-in-out flex flex-col bg-[#101B2D] border-slate-800 text-slate-300 ${
        isRtl ? 'right-0 border-l' : 'left-0 border-r'
      } ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-glow-blue flex-shrink-0">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-white text-base leading-none">
                {t('platform_name')}<span className="text-cyan-400">.TN</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1">
                {t('platform_subtitle')}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Développer' : 'Réduire'}
        >
          {isRtl ? (
            collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80">
        {!collapsed ? (
          <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>Simulation STEG</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                BT 2024-2025
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
        )}
      </div>
    </aside>
  );
};
