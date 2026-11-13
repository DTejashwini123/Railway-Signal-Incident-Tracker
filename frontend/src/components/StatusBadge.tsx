import React from 'react';

interface StatusBadgeProps {
  type: 'status' | 'priority' | 'category' | 'availability' | 'escalation' | 'validation';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  if (type === 'status') {
    switch (value) {
      case 'Pending':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending
          </span>
        );
      case 'Assigned':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Assigned
          </span>
        );
      case 'In Progress':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Resolved
          </span>
        );
      default:
        return <span className={`rounded-full bg-slate-800 text-slate-300 ${sizeClasses}`}>{value}</span>;
    }
  }

  if (type === 'priority') {
    switch (value?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-red-500/15 border border-red-500/40 text-red-400 font-bold tracking-wide uppercase ${sizeClasses}`}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 font-semibold uppercase ${sizeClasses}`}>
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 font-medium uppercase ${sizeClasses}`}>
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-slate-700/40 border border-slate-600/40 text-slate-300 uppercase ${sizeClasses}`}>
            LOW
          </span>
        );
      default:
        return <span className={`rounded-md bg-slate-800 text-slate-300 ${sizeClasses}`}>{value}</span>;
    }
  }

  if (type === 'category') {
    switch (value) {
      case 'Signal-Failure':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded bg-rose-950/60 border border-rose-700/50 text-rose-300 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Signal-Failure
          </span>
        );
      case 'Track-Obstruction':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded bg-amber-950/60 border border-amber-700/50 text-amber-300 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Track-Obstruction
          </span>
        );
      case 'Electrical':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Electrical
          </span>
        );
      case 'Minor-Delay':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded bg-blue-950/60 border border-blue-700/50 text-blue-300 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Minor-Delay
          </span>
        );
      case 'Test-Entry':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Test-Entry
          </span>
        );
      default:
        return <span className={`rounded bg-slate-800 text-slate-300 ${sizeClasses}`}>{value}</span>;
    }
  }

  if (type === 'availability') {
    switch (value) {
      case 'AVAILABLE':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            AVAILABLE
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            UNAVAILABLE
          </span>
        );
      case 'BUSY':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            BUSY
          </span>
        );
      default:
        return <span className={`rounded-full bg-slate-800 text-slate-400 ${sizeClasses}`}>{value}</span>;
    }
  }

  if (type === 'escalation') {
    if (value === 'ESCALATED_ZONAL_HQ') {
      return (
        <span className={`inline-flex items-center gap-1 rounded bg-red-600/20 border border-red-500/50 text-red-300 font-semibold animate-pulse ${sizeClasses}`}>
          Tier 2: Zonal HQ Escalated
        </span>
      );
    }
    return <span className="text-xs text-slate-500">Standard Tier 1</span>;
  }

  if (type === 'validation') {
    return value === 'VALID' ? (
      <span className={`inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold ${sizeClasses}`}>
        DFA & Regex Valid
      </span>
    ) : (
      <span className={`inline-flex items-center gap-1 rounded bg-red-500/15 border border-red-500/30 text-red-400 font-semibold ${sizeClasses}`}>
        Syntax Rejected
      </span>
    );
  }

  return <span>{value}</span>;
};
