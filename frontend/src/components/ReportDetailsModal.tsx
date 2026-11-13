import React from 'react';
import { X, ShieldAlert, Cpu, Network, CheckCircle, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface ReportDetailsModalProps {
  reportDetails: any;
  onClose: () => void;
  onStatusUpdateClick?: () => void;
}

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  reportDetails,
  onClose,
  onStatusUpdateClick
}) => {
  if (!reportDetails || !reportDetails.report) return null;

  const rep = reportDetails.report;
  const handler = reportDetails.assigned_handler;
  const assignments = reportDetails.assignments || [];
  const history = reportDetails.status_history || [];
  const escalation = reportDetails.escalation;
  const logs = reportDetails.routing_logs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-blue-400">{rep.report_id}</span>
            <StatusBadge type="status" value={rep.status} />
            <StatusBadge type="priority" value={rep.priority} />
            {rep.escalation_status === 'ESCALATED_ZONAL_HQ' && (
              <StatusBadge type="escalation" value={rep.escalation_status} />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Critical Escalation Alert Banner */}
          {rep.escalation_status === 'ESCALATED_ZONAL_HQ' && (
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/50 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="font-bold text-red-300 text-sm flex items-center gap-2">
                  <span>TIER 2 ZONAL HEADQUARTERS ESCALATION ACTIVE</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-red-900/60 font-mono">AUTOMATIC ESCALATION</span>
                </div>
                <div className="text-xs text-red-200/90 mt-1">
                  {escalation?.reason || 'Critical hazard incident automatically escalated to Zonal HQ Operations Cell.'}
                </div>
                <div className="text-[11px] text-red-300/80 mt-1 font-mono">
                  Escalated To: {escalation?.escalated_to} • Timestamp: {escalation?.timestamp ? new Date(escalation.timestamp).toLocaleString('en-IN') : 'Logged'}
                </div>
              </div>
            </div>
          )}

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
            <div>
              <div className="text-xs text-slate-400 font-medium">Station & Division</div>
              <div className="text-sm font-semibold text-white mt-0.5">
                {rep.station_name} <span className="font-mono text-blue-400">({rep.station_code})</span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{rep.division} Division</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Incident Code & Category</div>
              <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-2">
                <span className="font-mono text-amber-300">{rep.incident_code}</span>
                <StatusBadge type="category" value={rep.category} size="sm" />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Urgency: {rep.urgency_level}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Reporter Name & Contact</div>
              <div className="text-sm text-slate-200 mt-0.5 font-medium">{rep.reporter_name}</div>
              <div className="text-xs text-slate-400 font-mono">{rep.contact_info}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Created Timestamp</div>
              <div className="text-sm text-slate-200 mt-0.5 font-mono">
                {rep.created_at ? new Date(rep.created_at).toLocaleString('en-IN') : 'N/A'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Incident Description
            </div>
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed">
              {rep.incident_description}
            </div>
            {rep.additional_remarks && (
              <div className="mt-2 text-xs text-slate-400 italic">
                Additional Remarks: {rep.additional_remarks}
              </div>
            )}
          </div>

          {/* BCS503 Automata Theory Validation Box */}
          <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-800/40">
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs uppercase tracking-wider mb-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Automata Theory Validation Verification (BCS503)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800">
                <div className="text-slate-400">DFA Simulation:</div>
                <div className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{rep.dfa_result ? 'Accepted (Final State q5)' : 'Rejected'}</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800">
                <div className="text-slate-400">Regular Expression:</div>
                <div className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{rep.regex_result ? 'Accepted (Regex Match)' : 'Rejected'}</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800">
                <div className="text-slate-400">Mathematical Agreement:</div>
                <div className="font-bold text-blue-300 mt-0.5">
                  {rep.dfa_result === rep.regex_result ? '100% Agreement' : 'Disagreement'}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-300 font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
              {rep.validation_reason}
            </div>
          </div>

          {/* BCS502 Routing & Dispatch Box */}
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2">
              <Network className="w-4 h-4 text-emerald-400" />
              <span>Computer Networks Routing & Dispatch (BCS502)</span>
            </div>
            {handler ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400">Assigned Handler:</div>
                  <div className="text-sm font-bold text-white mt-0.5">{handler.name}</div>
                  <div className="font-mono text-blue-400 text-[11px]">{handler.handler_id} • {handler.department}</div>
                  <div className="text-slate-400 mt-1">Specialization: {handler.specialization}</div>
                </div>
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400">Capacity & Assignment Rationale:</div>
                  <div className="text-xs font-mono text-emerald-400 mt-0.5">
                    Workload: {handler.current_workload} / {handler.max_capacity} ({handler.utilization_rate}% utilized)
                  </div>
                  <div className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {assignments.length > 0 ? assignments[0].rationale : 'Dispatched via SQLite Routing Table'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-300 bg-amber-950/30 p-2.5 rounded border border-amber-500/30">
                Waiting in Queue: No available handler had idle capacity. Positioned in priority queue.
              </div>
            )}
          </div>

          {/* Resolution Remarks (if resolved) */}
          {rep.status === 'Resolved' && (
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-emerald-400 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>Resolution Certificate & Remarks</span>
              </div>
              <div className="text-xs text-emerald-200/90 whitespace-pre-wrap bg-slate-950/50 p-2.5 rounded border border-emerald-500/20 font-mono">
                {rep.resolution_remarks || 'Inspection completed. Signal/track restored to normal operations.'}
              </div>
            </div>
          )}

          {/* Status History Timeline */}
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Status Lifecycle Audit History</span>
            </div>
            {history.length > 0 ? (
              <div className="space-y-2 border-l-2 border-slate-700 pl-4 ml-2">
                {history.map((h: any, idx: number) => (
                  <div key={idx} className="relative text-xs">
                    <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-[#0f172a]" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{h.old_status} → {h.new_status}</span>
                      <span className="text-slate-500">•</span>
                      <span className="font-mono text-slate-400">{new Date(h.timestamp).toLocaleString('en-IN')}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-blue-400">By {h.updated_by}</span>
                    </div>
                    {h.remarks && <div className="text-slate-300 mt-0.5">{h.remarks}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No previous transitions logged.</div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            SQLite Record ID: #{rep.id}
          </div>
          <div className="flex items-center gap-3">
            {onStatusUpdateClick && (
              <button
                onClick={onStatusUpdateClick}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow transition-colors"
              >
                Update Status / Remarks
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
