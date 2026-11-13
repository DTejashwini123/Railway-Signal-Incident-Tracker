import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Users, 
  ShieldAlert, 
  Clock, 
  ListOrdered, 
  RotateCcw, 
  FileText, 
  Edit, 
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Handler, RoutingEntry, WaitingQueueItem, EscalationRecord, RoutingLog, Station } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ReportDetailsModal } from '../components/ReportDetailsModal';

export const RoutingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'routing-table' | 'handlers' | 'queue' | 'escalations' | 'logs'>('routing-table');
  const [routingTable, setRoutingTable] = useState<RoutingEntry[]>([]);
  const [handlers, setHandlers] = useState<Handler[]>([]);
  const [queue, setQueue] = useState<WaitingQueueItem[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [logs, setLogs] = useState<RoutingLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reassignment Modal state
  const [reassignModalReportId, setReassignModalReportId] = useState<string | null>(null);
  const [reassignTargetHandler, setReassignTargetHandler] = useState<string>('');
  const [reassignRationale, setReassignRationale] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Inspect Modal
  const [selectedReportDetails, setSelectedReportDetails] = useState<any>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [rt, hList, qList, escList, logList] = await Promise.all([
        api.getRoutingTable(),
        api.getHandlers(),
        api.getWaitingQueue(),
        api.getEscalations(),
        api.getRoutingLogs(),
      ]);
      setRoutingTable(rt);
      setHandlers(hList);
      setQueue(qList);
      setEscalations(escList);
      setLogs(logList);
      if (hList.length > 0) {
        setReassignTargetHandler(hList[0].handler_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalReportId || !reassignTargetHandler) return;

    setIsReassigning(true);
    try {
      await api.reassignReport(reassignModalReportId, {
        handler_id: reassignTargetHandler,
        rationale: reassignRationale || 'Administrative operational workload adjustment.',
      });
      setReassignModalReportId(null);
      setReassignRationale('');
      fetchAllData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Reassignment failed.');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleInspect = async (reportId: string) => {
    try {
      const details = await api.getReportDetails(reportId);
      setSelectedReportDetails(details);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Network className="w-4 h-4 text-blue-400" />
            <span>Part 12 • BCS502 Network Dispatch Command</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Routing & Dispatch Control Panel
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Explicit SQLite routing table management, handler fleet availability, deterministic waiting queues & Zonal HQ escalations.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 self-start sm:self-auto transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Network Table</span>
        </button>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-slate-400">Explicit Routes</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{routingTable.length} Routes</div>
          <div className="text-[11px] text-slate-500 mt-0.5">SBC, UBL, MYS Mappings</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-emerald-400">Active Handlers</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{handlers.length} Fleet</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across 3 Divisions</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-amber-400">Waiting Queue</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{queue.length} Pending</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Deterministic Priority Sort</div>
        </div>
        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30">
          <div className="text-xs text-red-400">Zonal HQ Escalations</div>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">{escalations.length} Active</div>
          <div className="text-[11px] text-red-300/70 mt-0.5">Tier 2 Rail Bhavan</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 text-xs font-medium space-x-1">
        <button
          onClick={() => setActiveTab('routing-table')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'routing-table'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Explicit Routing Table ({routingTable.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('handlers')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'handlers'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Handler Fleet & Workloads ({handlers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'queue'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Deterministic Priority Queue ({queue.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'escalations'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Tier 2 Zonal Escalations ({escalations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Routing Decision Logs</span>
        </button>
      </div>

      {/* Tab 1: Explicit Routing Table */}
      {activeTab === 'routing-table' && (
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">SQLite Network Routing Dispatch Registry</div>
              <div className="text-xs text-slate-400">
                Maps Division + Incident Prefix + Category → Primary & Backup Handlers & Escalation Destination
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
              BCS502 Deterministic Lookup
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Prefix</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Branch & Department</th>
                  <th className="py-3 px-4">Depot / Authority</th>
                  <th className="py-3 px-4">Primary Handler</th>
                  <th className="py-3 px-4">Backup Handler</th>
                  <th className="py-3 px-4">Escalation Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {routingTable.map((rt) => (
                  <tr key={rt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{rt.division}</td>
                    <td className="py-3 px-4 font-mono text-amber-300 font-semibold">{rt.incident_prefix}</td>
                    <td className="py-3 px-4">
                      <StatusBadge type="category" value={rt.incident_category} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{rt.branch}</div>
                      <div className="text-[11px] text-slate-400">{rt.department}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{rt.depot_authority}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-medium">
                      {rt.primary_handler_id || 'Not Configured'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {rt.backup_handler_id || 'None'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {rt.escalation_destination}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Handler Fleet */}
      {activeTab === 'handlers' && (
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">Demonstration Handler Fleet (12 Active Handlers)</div>
              <div className="text-xs text-slate-400">
                Enforcing strict availability checks and maximum capacity bounds across 3 divisions.
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Handler ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Department & Specialization</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4">Workload / Capacity</th>
                  <th className="py-3 px-4">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {handlers.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{h.handler_id}</td>
                    <td className="py-3 px-4 text-white font-semibold">{h.name}</td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{h.department}</div>
                      <div className="text-[11px] text-slate-400">{h.specialization}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">{h.division}</td>
                    <td className="py-3 px-4">
                      <StatusBadge type="availability" value={h.availability_status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200 font-medium">
                      {h.current_workload} / {h.max_capacity}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              h.current_workload >= h.max_capacity
                                ? 'bg-red-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, h.utilization_rate)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {h.utilization_rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Deterministic Priority Queue */}
      {activeTab === 'queue' && (
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">Deterministic Priority Waiting Queue</div>
              <div className="text-xs text-slate-400">
                Ordered by strict priority: CRITICAL (1) → HIGH (2) → MEDIUM (3) → LOW (4), tie-breaker: FIFO entry timestamp.
              </div>
            </div>
            <button
              onClick={fetchAllData}
              className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition-colors"
            >
              Reorder Queue
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Queue Pos</th>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Entered At</th>
                  <th className="py-3 px-4">Reason for Queueing</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {queue.length > 0 ? (
                  queue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        #{item.queue_position}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {item.report_id}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge type="priority" value={item.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(item.entered_at).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-md">
                        {item.reason}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspect(item.report_id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => setReassignModalReportId(item.report_id)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold"
                          >
                            Reassign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      No reports currently waiting in queue. Handlers have available capacity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Tier 2 Zonal Escalations (Part 7) */}
      {activeTab === 'escalations' && (
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
              <div>
                <div className="text-sm font-bold text-white">Zonal Headquarters Mandatory Escalation Records</div>
                <div className="text-xs text-slate-400">
                  Tier 2 Emergency Protocol invoked automatically for all CRITICAL category incidents.
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Escalation Destination</th>
                  <th className="py-3 px-4">Mandatory Reason</th>
                  <th className="py-3 px-4">Escalation Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {escalations.length > 0 ? (
                  escalations.map((esc) => (
                    <tr key={esc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-red-400">{esc.report_id}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{esc.division}</td>
                      <td className="py-3 px-4 text-white font-medium">{esc.escalated_to}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-md">{esc.reason}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {new Date(esc.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleInspect(esc.report_id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded text-[11px] font-semibold border border-slate-700"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      No active Zonal HQ escalations recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Routing Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="text-sm font-bold text-white">Routing Decision Audit Logs</div>
            <span className="text-xs text-slate-400 font-mono">Last {logs.length} Operations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Full Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{log.report_id}</td>
                    <td className="py-3 px-4 font-mono text-xs text-emerald-400">{log.action}</td>
                    <td className="py-3 px-4 font-semibold text-white">{log.decision}</td>
                    <td className="py-3 px-4 text-slate-300 text-xs max-w-lg">{log.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModalReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
            <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="font-bold text-sm text-white">Manual Handler Reassignment</div>
              <button
                onClick={() => setReassignModalReportId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Report ID</label>
                <div className="p-2 bg-slate-900 rounded font-mono font-bold text-blue-400 border border-slate-800">
                  {reassignModalReportId}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Select Target Handler</label>
                <select
                  value={reassignTargetHandler}
                  onChange={(e) => setReassignTargetHandler(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none"
                >
                  {handlers.map((h) => (
                    <option
                      key={h.handler_id}
                      value={h.handler_id}
                      disabled={h.current_workload >= h.max_capacity}
                    >
                      {h.name} ({h.handler_id}) • {h.division} • Workload: {h.current_workload}/{h.max_capacity} {h.current_workload >= h.max_capacity ? '(FULL)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Administrative Rationale</label>
                <textarea
                  rows={3}
                  value={reassignRationale}
                  onChange={(e) => setReassignRationale(e.target.value)}
                  placeholder="Explain why this incident is being manually reassigned to another handler..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalReportId(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50"
                >
                  {isReassigning ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {selectedReportDetails && (
        <ReportDetailsModal
          reportDetails={selectedReportDetails}
          onClose={() => setSelectedReportDetails(null)}
        />
      )}

    </div>
  );
};
