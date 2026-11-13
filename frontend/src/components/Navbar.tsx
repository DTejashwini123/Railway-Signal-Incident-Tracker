import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResetDemo = async () => {
    if (window.confirm('Reset demonstration database to default initial state?')) {
      setIsResetting(true);
      try {
        await api.resetDemoData();
        window.location.reload();
      } catch (err) {
        console.error('Failed to reset demo data', err);
        alert('Database reset failed');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <header className="h-16 bg-[#0f172a] border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      {/* Left: Division & Academic Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Division:</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300">
            {user?.division === 'ALL' ? 'ALL DIVISIONS (SWR HQ)' : `${user?.division} DIVISION`}
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-4 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Academic Demonstration Network (BCS502 • BCS503)</span>
        </div>
      </div>

      {/* Right: Actions, Clock & User */}
      <div className="flex items-center gap-4">
        {/* Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          title="Reset demonstration data"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset Demo Data</span>
        </button>

        {/* Live Clock */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 font-semibold shadow-inner">
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span>{time} IST</span>
        </div>

        {/* User Role Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="text-right">
            <div className="text-xs font-semibold text-white">{user?.full_name}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
