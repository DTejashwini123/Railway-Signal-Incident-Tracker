import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainTrack, Lock, User as UserIcon, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    const success = await login(username, password);
    setIsLoggingIn(false);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid credentials. Please use demo credentials listed below.');
    }
  };

  const handleQuickDemoLogin = (role: 'Station Master' | 'Handler' | 'Administrator') => {
    switchDemoRole(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 shadow-xl mb-1">
            <TrainTrack className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Railway Central Interlock
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            P15 • Signal Incident Tracking & Network Routing System
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono text-blue-300">
            BCS503 Automata Theory • BCS502 Computer Networks
          </div>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl space-y-5">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-center border-b border-slate-800 pb-3">
            Secure Control-Room Access
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In to Operations Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Login Shortcuts */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-[11px] text-slate-400 text-center font-medium">
              Quick 1-Click Role Login (Demo Accounts):
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Administrator')}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">Chief Rail Admin</span>
                  <span className="text-[11px] text-slate-400 ml-1.5 font-mono">(admin / Admin@123)</span>
                </div>
                <span className="text-[10px] text-blue-400 font-bold uppercase">All Roles</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Station Master')}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">Station Master SBC</span>
                  <span className="text-[11px] text-slate-400 ml-1.5 font-mono">(station_master / Station@123)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Station User</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Handler')}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">Signal Handler</span>
                  <span className="text-[11px] text-slate-400 ml-1.5 font-mono">(handler_sig1 / Handler@123)</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold uppercase">Field Engr</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          Academic College Capstone Project • South Western Railway Model
        </div>

      </div>
    </div>
  );
};
