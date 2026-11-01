import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'magenta' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'sm',
  dot = false,
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    magenta: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30',
    purple: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700',
  };

  const dotColors = {
    cyan: 'bg-cyan-400',
    magenta: 'bg-fuchsia-400',
    purple: 'bg-violet-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 rounded-md gap-1.5',
    md: 'text-xs px-3 py-1 rounded-lg gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center border font-medium ${sizeStyles[size]} ${variantStyles[variant]} select-none whitespace-nowrap`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`} />}
      {children}
    </span>
  );
};
