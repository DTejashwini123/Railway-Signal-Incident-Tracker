import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Users, 
  Activity,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
const PRIORITY_COLORS: Record<string, string> = {
  'CRITICAL': '#ef4444',
  'HIGH': '#f97316',
  'MEDIUM': '#eab308',
  'LOW': '#64748b'
};

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
        <span>Loading operational telemetry and analytics from SQLite...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>Part 13 • Railway Central Operations Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Railway Incident Analytics & Resolution Metrics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time charts powered directly by backend SQLite database records with division and category distributions.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Charts</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Reports Logged</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-white mt-2">{data.total_reports}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">SQLite reports table</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Resolution Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400 mt-2">{data.resolution_rate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{data.resolved} resolved of {data.total_reports}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>Active In-Flight (Open)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-amber-400 mt-2">{data.pending + data.assigned + data.in_progress}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Pending + Assigned + Active</div>
        </div>

        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30">
          <div className="flex items-center justify-between text-xs text-red-400">
            <span>Zonal HQ Escalations</span>
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <div className="text-3xl font-mono font-bold text-red-400 mt-2">{data.escalated}</div>
          <div className="text-[11px] text-red-300/70 mt-1 font-mono">Tier 2 emergency protocol</div>
        </div>
      </div>

      {/* Row 1: Division & Exactly 5 Categories Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Division Distribution */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-sm font-bold text-white mb-1">
            Division-Wise Incident Distribution (BCS502)
          </div>
          <div className="text-xs text-slate-400 mb-4">
            Aggregated across Bangalore (SBC), Hubli (UBL), and Mysore (MYS)
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.division_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="code" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exactly 5 Incident Categories Distribution (Part 4) */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-sm font-bold text-white mb-1">
            Category-Wise Distribution (5 Predefined Categories)
          </div>
          <div className="text-xs text-slate-400 mb-4">
            Signal-Failure • Track-Obstruction • Electrical • Minor-Delay • Test-Entry
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.category_distribution} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {data.category_distribution?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Resolution Donut & Priority Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Resolved vs Unresolved Pie Chart */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-sm font-bold text-white mb-1">
            Resolved vs. Unresolved Ratio
          </div>
          <div className="text-xs text-slate-400 mb-4">
            Operations resolution performance status
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.resolution_pie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.resolution_pie?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority-Wise Distribution */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-sm font-bold text-white mb-1">
            Priority Severity Spectrum
          </div>
          <div className="text-xs text-slate-400 mb-4">
            Critical, High, Medium, Low incident volume
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.priority_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.priority_distribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 3: Monthly Incident Trend (Area Chart) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="text-sm font-bold text-white mb-1">
          Monthly Railway Incident Trend (Last 6 Months)
        </div>
        <div className="text-xs text-slate-400 mb-4">
          Category trend lines showing seasonal failure occurrences across the division network
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSig" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTrk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Signal" stroke="#ef4444" fillOpacity={1} fill="url(#colorSig)" />
              <Area type="monotone" dataKey="Track" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTrk)" />
              <Area type="monotone" dataKey="Electrical" stroke="#06b6d4" fillOpacity={1} fill="url(#colorEle)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Handler Workload vs. Max Capacity (BarChart) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="text-sm font-bold text-white mb-1">
          Handler Fleet Workload vs. Maximum Capacity
        </div>
        <div className="text-xs text-slate-400 mb-4">
          Enforcing capacity limits so no handler is saturated beyond max allocation
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.handler_workload} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="workload" name="Current Workload" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" name="Max Capacity" fill="#334155" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
