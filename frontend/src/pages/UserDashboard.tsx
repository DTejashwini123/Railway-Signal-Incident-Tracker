import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Files, 
  CheckCircle, 
  Clock, 
  Activity, 
  ShieldAlert, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Report } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ReportDetailsModal } from '../components/ReportDetailsModal';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState(user?.division || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReportDetails, setSelectedReportDetails] = useState<any>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (divisionFilter !== 'ALL') filters.division = divisionFilter;
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (categoryFilter !== 'ALL') filters.category = categoryFilter;
      if (priorityFilter !== 'ALL') filters.priority = priorityFilter;
      if (searchTerm.trim()) filters.search = searchTerm.trim();

      const data = await api.getReports(filters);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [divisionFilter, statusFilter, categoryFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleInspectReport = async (reportId: string) => {
    try {
      const details = await api.getReportDetails(reportId);
      setSelectedReportDetails(details);
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalCount = reports.length;
  const pendingCount = reports.filter(r => r.status === 'Pending').length;
  const assignedCount = reports.filter(r => r.status === 'Assigned').length;
  const inProgressCount = reports.filter(r => r.status === 'In Progress').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Files className="w-4 h-4 text-blue-400" />
            <span>Part 10 • Station Master Operations Console</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Incident Tracking & Status Registry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Query reports across division stations with real-time lifecycle tracking & status audit trail.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 self-start sm:self-auto transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-slate-400">Total Filtered</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{totalCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-amber-400">Pending</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{pendingCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-blue-400">Assigned</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">{assignedCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-indigo-400">In Progress</div>
          <div className="text-xl font-bold font-mono text-indigo-400 mt-1">{inProgressCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-emerald-400">Resolved</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Report ID (e.g. REP-SBC-...), Station Code, Incident Code, Reporter..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1 text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Division Filter */}
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Divisions</option>
            <option value="SBC">Bangalore (SBC)</option>
            <option value="UBL">Hubli (UBL)</option>
            <option value="MYS">Mysore (MYS)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All 5 Categories</option>
            <option value="Signal-Failure">Signal-Failure</option>
            <option value="Track-Obstruction">Track-Obstruction</option>
            <option value="Electrical">Electrical</option>
            <option value="Minor-Delay">Minor-Delay</option>
            <option value="Test-Entry">Test-Entry</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {(divisionFilter !== 'ALL' || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setDivisionFilter('ALL');
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setPriorityFilter('ALL');
                setSearchTerm('');
              }}
              className="text-xs text-blue-400 hover:underline ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Station & Div</th>
                <th className="py-3 px-4">Incident Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Handler</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.length > 0 ? (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      <div>{rep.report_id}</div>
                      {rep.escalation_status === 'ESCALATED_ZONAL_HQ' && (
                        <span className="text-[10px] text-red-400 font-bold block mt-0.5">
                          Tier 2 HQ Escalated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{rep.station_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{rep.station_code} • {rep.division}</div>
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
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {rep.assigned_handler_id || (
                        <span className="text-amber-400/90 italic text-[11px]">In Waiting Queue</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {rep.created_at ? new Date(rep.created_at).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      }) : '--'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleInspectReport(rep.report_id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white font-semibold text-[11px] border border-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    {isLoading ? 'Loading incident records...' : 'No incident reports found matching current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      {selectedReportDetails && (
        <ReportDetailsModal
          reportDetails={selectedReportDetails}
          onClose={() => setSelectedReportDetails(null)}
        />
      )}
    </div>
  );
};
