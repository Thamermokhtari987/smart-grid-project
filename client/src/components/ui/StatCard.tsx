import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  comparison?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: LucideIcon;
  iconColor?: string;
  glowColor?: 'solar' | 'battery' | 'blue' | 'green' | 'red';
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  comparison,
  trend,
  trendValue,
  icon: Icon,
  iconColor = 'text-blue-500',
  glowColor,
  subtext,
}) => {
  const getGlow = () => {
    if (glowColor === 'solar') return 'hover:border-amber-500/50 hover:shadow-glow-solar';
    if (glowColor === 'battery') return 'hover:border-purple-500/50 hover:shadow-glow-battery';
    if (glowColor === 'blue') return 'hover:border-blue-500/50 hover:shadow-glow-blue';
    if (glowColor === 'green') return 'hover:border-emerald-500/50 hover:shadow-glow-green';
    return '';
  };

  return (
    <div
      className={`relative p-5 rounded-2xl bg-white dark:bg-[#101B2D] border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 ${getGlow()}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {(comparison || trendValue || subtext) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {trendValue && (
            <div
              className={`flex items-center gap-1 font-semibold ${
                trend === 'up'
                  ? 'text-emerald-500'
                  : trend === 'down'
                  ? 'text-rose-500'
                  : 'text-slate-400'
              }`}
            >
              {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trendValue}</span>
            </div>
          )}
          {comparison && (
            <span className="text-slate-500 dark:text-slate-400">{comparison}</span>
          )}
          {subtext && !comparison && (
            <span className="text-slate-400 text-[11px] truncate">{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
};
