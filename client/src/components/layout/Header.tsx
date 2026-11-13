import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Clock,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  SlidersHorizontal,
  Languages,
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { LanguageSelector } from '../ui/LanguageSelector';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ sidebarCollapsed }) => {
  const { mode, updateOperatingMode, unreadAlertsCount, recentAlerts, markAlertRead } = useSystem();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, isRtl } = useLanguage();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';

  const formattedDate = currentTime.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Africa/Tunis',
  });

  const formattedTime = currentTime.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Africa/Tunis',
  });

  const languageOptions: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇹🇳' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <header
      className={`fixed top-0 z-20 h-16 border-b transition-all duration-300 ease-in-out bg-white/80 dark:bg-[#101B2D]/90 backdrop-blur-md border-slate-200 dark:border-slate-800 ${
        isRtl
          ? sidebarCollapsed ? 'left-0 right-20' : 'left-0 right-64'
          : sidebarCollapsed ? 'left-20 right-0' : 'left-64 right-0'
      }`}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Time & Simulation Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formattedDate}</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">{formattedTime} ({t('tunis_time')})</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('system_live')}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Reusable Language Selector */}
          <LanguageSelector />

          {/* Operating Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowModeDropdown(!showModeDropdown);
                setShowLangDropdown(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors text-slate-800 dark:text-slate-200"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('mode_label')}</span>
              <span
                className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] ${
                  mode === 'AUTOMATIC'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : mode === 'ECO'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                {mode === 'AUTOMATIC' ? t('mode_automatic') : mode === 'ECO' ? t('mode_eco') : t('mode_manual')}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showModeDropdown && (
              <div
                className={`absolute mt-2 w-52 py-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 ${
                  isRtl ? 'left-0' : 'right-0'
                }`}
              >
                {(['AUTOMATIC', 'MANUAL', 'ECO'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      updateOperatingMode(m);
                      setShowModeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/50 ${
                      mode === m ? 'font-bold text-blue-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{m === 'AUTOMATIC' ? t('mode_automatic') : m === 'ECO' ? t('mode_eco') : t('mode_manual')}</span>
                    {mode === m && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowLangDropdown(false);
                setShowModeDropdown(false);
              }}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t('notifications_title')}
            >
              <Bell className="w-5 h-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className={`absolute mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 ${
                  isRtl ? 'left-0' : 'right-0'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('notifications_title')}</h4>
                    {unreadAlertsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 text-xs font-bold">
                        {unreadAlertsCount} {t('unread')}
                      </span>
                    )}
                  </div>
                  <NavLink
                    to="/alerts"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-medium"
                  >
                    {t('view_all')}
                  </NavLink>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto my-2">
                  {recentAlerts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">{t('alert_empty')}</div>
                  ) : (
                    recentAlerts.slice(0, 5).map((a) => (
                      <div
                        key={a.id}
                        className={`p-2.5 rounded-lg flex items-start gap-2.5 transition-colors ${
                          !a.isRead ? 'bg-blue-50/50 dark:bg-slate-800/50' : ''
                        }`}
                      >
                        {a.severity === 'CRITICAL' ? (
                          <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                        ) : a.severity === 'WARNING' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{a.description}</p>
                        </div>
                        {!a.isRead && (
                          <button
                            onClick={() => markAlertRead(a.id)}
                            className="text-[10px] text-blue-500 hover:underline flex-shrink-0"
                          >
                            {t('mark_read')}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Mode ${theme === 'dark' ? 'Clair' : 'Sombre'}`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Operator Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              SG
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-tight">{t('operator_profile')}</p>
              <p className="text-[10px] text-slate-500 font-mono">{t('steg_tier')}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
