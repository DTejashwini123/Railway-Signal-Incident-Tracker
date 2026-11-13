import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus, 
  Files, 
  Wrench, 
  Network, 
  BarChart3, 
  Cpu, 
  CheckCircle2, 
  LogOut,
  Radio,
  TrainTrack
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based navigation rules
  const role = user?.role || 'Administrator';

  const navItems = [
    {
      to: '/',
      label: 'Overview',
      icon: LayoutDashboard,
      roles: ['Station Master', 'Handler', 'Administrator'],
    },
    {
      to: '/submit',
      label: 'Submit Report',
      icon: FilePlus,
      roles: ['Station Master', 'Administrator'],
    },
    {
      to: '/my-reports',
      label: 'My Reports',
      icon: Files,
      roles: ['Station Master', 'Handler', 'Administrator'],
    },
    {
      to: '/handler',
      label: 'Handler Dashboard',
      icon: Wrench,
      roles: ['Handler', 'Administrator'],
    },
    {
      to: '/routing',
      label: 'Routing Management',
      icon: Network,
      roles: ['Administrator'],
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      roles: ['Administrator', 'Station Master', 'Handler'],
    },
    {
      to: '/dfa-simulator',
      label: 'DFA Simulator',
      icon: Cpu,
      roles: ['Station Master', 'Handler', 'Administrator'],
    },
    {
      to: '/test-cases',
      label: 'Test Cases',
      icon: CheckCircle2,
      roles: ['Station Master', 'Handler', 'Administrator'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <TrainTrack className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>SWR TRACKER</span>
              <span className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/30">P15</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">BCS503 • BCS502</div>
          </div>
        </div>

        {/* Live System Signal Status */}
        <div className="mx-4 mt-3 mb-2 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Control Room Live</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400 font-semibold">ONLINE</span>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher & User Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="mb-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
            Quick Role Switcher
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => switchDemoRole('Station Master')}
              className={`text-[10px] py-1 px-1.5 rounded font-medium border text-center transition-all ${
                role === 'Station Master'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              SM
            </button>
            <button
              onClick={() => switchDemoRole('Handler')}
              className={`text-[10px] py-1 px-1.5 rounded font-medium border text-center transition-all ${
                role === 'Handler'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Handler
            </button>
            <button
              onClick={() => switchDemoRole('Administrator')}
              className={`text-[10px] py-1 px-1.5 rounded font-medium border text-center transition-all ${
                role === 'Administrator'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Current user badge */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div className="truncate pr-2">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</div>
            <div className="text-[11px] text-blue-400 font-mono">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
