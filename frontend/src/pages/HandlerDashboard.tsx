import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit3, 
  User, 
  TrendingUp, 
  ShieldAlert,
  Settings,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Handler, Report } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ReportDetailsModal } from '../components/ReportDetailsModal';
import { StatusUpdateModal } from '../components/StatusUpdateModal';

export const HandlerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [handlers, setHandlers] = useState<Handler[]>([]);
  const [selectedHandlerId, setSelectedHandlerId] = useState<string>('H-SBC-SIG-01');
  const [activeHandler, setActiveHandler] = useState<Handler | null>(null);
  const [assignedReports, setAssignedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [inspectReport, setInspectReport] = useState<any>(null);
  const [updatingReport, setUpdatingReport] = useState<any>(null);

  // Capacity / Availability edit state
  const [editAvailability, setEditAvailability] = useState<string>('AVAILABLE');
  const [editCapacity, setEditCapacity] = useState<number>(5);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState<boolean>(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);

  const fetchHandlerData = async () => {
    setIsLoading(true);
    try {
      const hList = await api.getHandlers();
      setHandlers(hList);

      const targetId = selectedHandlerId || hList[0]?.handler_id;
      const current = hList.find((h: Handler) => h.handler_id === targetId) || hList[0];
      if (current) {
        setActiveHandler(current);
        setSelectedHandlerId(current.handler_id);
        setEditAvailability(current.availability_status);
        setEditCapacity(current.max_capacity);

        // Fetch reports assigned to this handler
        const reps = await api.getReports({ handler_id: current.handler_id });
        setAssignedReports(reps);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHandlerData();
  }, [selectedHandlerId]);

  const handleHandlerChange = (id: string) => {
    setSelectedHandlerId(id);
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHandler) return;

    setIsUpdatingSettings(true);
    setSettingsSavedMsg(null);
    try {
      const res = await api.updateHandler(activeHandler.handler_id, {
        availability_status: editAvailability,
        max_capacity: editCapacity,
      });
      if (res.success) {
        setActiveHandler(res.handler);
        setSettingsSavedMsg('Handler profile updated successfully.');
        setTimeout(() => setSettingsSavedMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update handler settings.');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleOpenDetails = async (reportId: string) => {
    try {
      const details = await api.getReportDetails(reportId);
      setInspectReport(details);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Handler Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4 text-blue-400" />
            <span>Part 11 • Dedicated Field & Engineering Console</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Handler Queue & Workload Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time assignment queue, capacity tracking, and SQLite status progression (Pending → Assigned → In Progress → Resolved).
          </p>
        </div>

        {/* Handler Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Switch Handler:</span>
          <select
            value={selectedHandlerId}
            onChange={(e) => handleHandlerChange(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-blue-500"
          >
            {handlers.map((h) => (
              <option key={h.handler_id} value={h.handler_id}>
                {h.name} ({h.handler_id}) • {h.division}
              </option>
            ))}
          </select>
          <button
            onClick={fetchHandlerData}
            title="Refresh"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Handler Profile & Live Capacity Card */}
      {activeHandler && (
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
          
          {/* Handler Info */}
          <div className="space-y-1.5 md:border-r border-slate-800 md:pr-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{activeHandler.name}</span>
              <StatusBadge type="availability" value={activeHandler.availability_status} size="sm" />
            </div>
            <div className="text-xs font-mono text-blue-400 font-medium">{activeHandler.handler_id}</div>
            <div className="text-xs text-slate-300">{activeHandler.department}</div>
            <div className="text-xs text-slate-400">
              Specialization: <span className="text-slate-300">{activeHandler.specialization}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Division: <span className="text-white font-semibold">{activeHandler.division}</span>
            </div>
          </div>

          {/* Workload & Capacity Progress Bar */}
          <div className="space-y-2 md:border-r border-slate-800 md:pr-6 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Assigned Workload</span>
              <span className="font-mono font-bold text-white">
                {activeHandler.current_workload} / {activeHandler.max_capacity} Slots
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  activeHandler.current_workload >= activeHandler.max_capacity
                    ? 'bg-red-500'
                    : activeHandler.current_workload >= activeHandler.max_capacity * 0.75
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, activeHandler.utilization_rate)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{activeHandler.utilization_rate}% Utilized</span>
              <span>
                {activeHandler.max_capacity - activeHandler.current_workload} Free Slots
              </span>
            </div>
          </div>

          {/* Availability & Capacity Quick Settings Form */}
          <form onSubmit={handleUpdateSettings} className="space-y-2.5 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>Update Availability & Max Capacity</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                <select
                  value={editAvailability}
                  onChange={(e) => setEditAvailability(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                  <option value="BUSY">BUSY</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Max Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {settingsSavedMsg ? (
                <span className="text-[11px] text-emerald-400 font-medium">{settingsSavedMsg}</span>
              ) : (
                <span className="text-[10px] text-slate-500">Affects routing dispatch table</span>
              )}
              <button
                type="submit"
                disabled={isUpdatingSettings}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {isUpdatingSettings ? 'Saving...' : 'Apply'}
              </button>
            </div>
          </form>

        </div>
      )}

      {/* Assigned Incidents Table */}
      <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="font-bold text-sm text-white">
            Assigned Queue for {activeHandler?.name} ({assignedReports.length} Active Tasks)
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {assignedReports.filter(r => r.status === 'Resolved').length} Resolved • {assignedReports.filter(r => r.status !== 'Resolved').length} Open
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Station & Line</th>
                <th className="py-3 px-4">Incident Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assignedReports.length > 0 ? (
                assignedReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      <div>{rep.report_id}</div>
                      {rep.escalation_status === 'ESCALATED_ZONAL_HQ' && (
                        <span className="text-[10px] text-red-400 font-bold block mt-0.5">
                          Zonal HQ Escalation
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{rep.station_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{rep.station_code}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-300 font-semibold">
                      {rep.incident_code}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge type="category" value={rep.category} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge type="priority" value={rep.priority} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge type="status" value={rep.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {rep.created_at ? new Date(rep.created_at).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      }) : '--'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(rep.report_id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium border border-slate-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setUpdatingReport(rep)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Status</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    {isLoading ? 'Loading assigned incidents...' : 'No incident reports currently assigned to this handler.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectReport && (
        <ReportDetailsModal
          reportDetails={inspectReport}
          onClose={() => setInspectReport(null)}
          onStatusUpdateClick={() => {
            setUpdatingReport(inspectReport.report);
            setInspectReport(null);
          }}
        />
      )}

      {/* Status Update Modal */}
      {updatingReport && (
        <StatusUpdateModal
          report={updatingReport}
          onClose={() => setUpdatingReport(null)}
          onSuccess={() => {
            fetchHandlerData();
          }}
        />
      )}

    </div>
  );
};
