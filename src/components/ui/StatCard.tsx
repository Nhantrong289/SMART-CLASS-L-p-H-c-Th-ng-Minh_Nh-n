import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accent?: 'cyan' | 'magenta' | 'purple' | 'amber' | 'emerald';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  accent = 'cyan',
}) => {
  const accentClasses = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
    },
    magenta: {
      border: 'hover:border-fuchsia-500/40',
      iconBg: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(217,70,239,0.15)]',
    },
    purple: {
      border: 'hover:border-violet-500/40',
      iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(139,92,246,0.15)]',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
    },
  };

  const currentAccent = accentClasses[accent];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-[#0b1026]/75 backdrop-blur-md border border-white/10 p-5 transition-all duration-300 ${currentAccent.border} ${currentAccent.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-bold text-white tracking-tight tabular-nums font-mono">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-medium flex items-center ${
                  trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          {subtext && <p className="mt-1.5 text-xs text-slate-400">{subtext}</p>}
        </div>

        <div className={`p-3 rounded-xl ${currentAccent.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
