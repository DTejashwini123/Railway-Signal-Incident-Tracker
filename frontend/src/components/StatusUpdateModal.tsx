import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface StatusUpdateModalProps {
  report: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({ report, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>(report?.status || 'In Progress');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('Please provide status update remarks.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.updateReportStatus(report.report_id, {
        status,
        remarks,
        updated_by: user?.full_name || 'Handler',
      });
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update report status.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">Update Report Lifecycle</div>
            <div className="text-xs font-mono text-blue-400">{report?.report_id}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-red-950/40 border border-red-500/40 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">Current Lifecycle Status</label>
            <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-slate-300">
              {report?.status}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">New Target Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="Pending">Pending (Revert)</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress (Active Work underway)</option>
              <option value="Resolved">Resolved (Complete & Decrement Workload)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              {status === 'Resolved' ? 'Resolution Remarks / Technical Action Taken' : 'Progress / Inspection Remarks'}
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                status === 'Resolved'
                  ? 'E.g., Replaced blown fuse in Point 12-A circuit. Megger test OK. Track cleared for traffic at 14:30.'
                  : 'E.g., Dispatched technician squad to relay room. Visual inspection underway.'
              }
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {status === 'Resolved' && (
            <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px]">
              Note: Marking this incident as <strong>Resolved</strong> will automatically decrement the assigned handler&apos;s current workload in the SQLite database and restore available capacity.
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Confirm Update'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
