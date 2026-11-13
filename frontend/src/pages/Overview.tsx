import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  ShieldAlert, 
  TrainTrack, 
  Activity, 
  ArrowRight,
  Radio,
  FilePlus,
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ReportDetailsModal } from '../components/ReportDetailsModal';

export const Overview: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [anData, repData, escData] = await Promise.all([
        api.getAnalytics(),
        api.getReports({ limit: '6' }),
        api.getEscalations()
      ]);
      setAnalytics(anData);
      setRecentReports(repData.slice(0, 6));
      setEscalations(escData.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReport = async (reportId: string) => {
    try {
      const details = await api.getReportDetails(reportId);
      setSelectedReport(details);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Control Room Status & Quick Actions */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
              Railway Central Interlock Operations (South Western Railway)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Signal & Incident Tracking Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Integrated Automata Theory (BCS503) formal DFA validation & Computer Networks (BCS502) 3-tier routing topology across Bangalore, Hubli, and Mysore divisions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/submit"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            <FilePlus className="w-4 h-4" />
            <span>Submit Incident</span>
          </Link>
          <Link
            to="/dfa-simulator"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold text-xs border border-slate-700 transition-all"
          >
            <Cpu className="w-4 h-4" />
            <span>DFA Simulator</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Reports</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {analytics?.total_reports ?? '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Logged in SQLite</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            {analytics?.pending ?? '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting dispatch</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-blue-400 text-xs font-medium">
            <span>Assigned</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-2">
            {analytics?.assigned ?? '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">In handler queue</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-indigo-400 text-xs font-medium">
            <span>In Progress</span>
            <TrainTrack className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-2">
            {analytics?.in_progress ?? '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Field squad on site</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Resolved</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {analytics?.resolved ?? '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{analytics?.resolution_rate}% success rate</div>
        </div>

        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 shadow-sm">
          <div className="flex items-center justify-between text-red-400 text-xs font-medium">
            <span>Zonal HQ Escalations</span>
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-2">
            {analytics?.escalated ?? '--'}
          </div>
          <div className="text-[11px] text-red-300/70 mt-1">Tier 2 emergency</div>
        </div>
      </div>

      {/* 3 Division Network Snapshot (BCS502) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-blue-400">SBC DIVISION</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">10 STATIONS</span>
          </div>
          <div className="text-sm font-semibold text-white mt-1">Bangalore Division</div>
          <div className="text-xs text-slate-400 mt-0.5">Codes: SBC01 to SBC10</div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">HQ: Bangalore City</span>
            <span className="text-emerald-400 font-mono font-medium">Active (4 Handlers)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-blue-400">UBL DIVISION</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">10 STATIONS</span>
          </div>
          <div className="text-sm font-semibold text-white mt-1">Hubli Division</div>
          <div className="text-xs text-slate-400 mt-0.5">Codes: UBL01 to UBL10</div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">HQ: Hubli Central</span>
            <span className="text-emerald-400 font-mono font-medium">Active (4 Handlers)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-blue-400">MYS DIVISION</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">10 STATIONS</span>
          </div>
          <div className="text-sm font-semibold text-white mt-1">Mysore Division</div>
          <div className="text-xs text-slate-400 mt-0.5">Codes: MYS01 to MYS10</div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">HQ: Mysore City</span>
            <span className="text-emerald-400 font-mono font-medium">Active (4 Handlers)</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Active Escalations + Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Active Critical Zonal Escalations (Part 7) */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="font-bold text-sm text-white">Critical Zonal Escalations</span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                Tier 2
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Mandatory automatic escalation to Zonal HQ SWR Operations Cell for all CRITICAL category reports.
            </p>

            <div className="space-y-3">
              {escalations.length > 0 ? (
                escalations.map((esc) => (
                  <div
                    key={esc.id}
                    onClick={() => handleOpenReport(esc.report_id)}
                    className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 hover:border-red-400 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-red-300">{esc.report_id}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(esc.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {esc.reason}
                    </div>
                    <div className="text-[11px] text-red-400/90 mt-1.5 flex items-center gap-1 font-mono">
                      <span>HQ Target:</span>
                      <span className="truncate">{esc.escalated_to}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No active critical escalations.
                </div>
              )}
            </div>
          </div>

          <Link
            to="/routing"
            className="mt-4 pt-3 border-t border-slate-800 text-xs text-blue-400 hover:text-blue-300 flex items-center justify-between font-semibold"
          >
            <span>View Routing Control Panel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Right: Recent Reports Feed */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-sm text-white">Live Operations Incident Feed</div>
              <div className="text-xs text-slate-400">Validated reports flowing through the 12-step routing engine</div>
            </div>
            <Link
              to="/my-reports"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-blue-400">{rep.report_id}</td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-medium">{rep.station_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{rep.station_code} • {rep.division}</div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge type="category" value={rep.category} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge type="priority" value={rep.priority} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge type="status" value={rep.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenReport(rep.report_id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] border border-slate-700 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Report Modal */}
      {selectedReport && (
        <ReportDetailsModal
          reportDetails={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};
