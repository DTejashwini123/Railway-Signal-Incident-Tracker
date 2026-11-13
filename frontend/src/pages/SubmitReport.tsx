import React, { useState, useEffect } from 'react';
import { 
  FilePlus, 
  Cpu, 
  CheckCircle, 
  AlertCircle, 
  Network, 
  ShieldAlert, 
  ArrowRight,
  Info
} from 'lucide-react';
import { api, DEFAULT_STATIONS, DEFAULT_DIVISIONS } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Station, RailwayDivision } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const SubmitReport: React.FC = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>(DEFAULT_STATIONS as any);
  const [divisions, setDivisions] = useState<RailwayDivision[]>(DEFAULT_DIVISIONS as any);

  // Form fields
  const [reporterName, setReporterName] = useState(user?.full_name || 'SM Rajesh Kumar');
  const [stationCode, setStationCode] = useState('SBC01');
  const [stationName, setStationName] = useState('Bangalore City Junction');
  const [division, setDivision] = useState('SBC');
  const [contactInfo, setContactInfo] = useState('sm.sbc@swr.rail.gov.in / 080-22201234');
  const [incidentCode, setIncidentCode] = useState('SIG-101');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [remarks, setRemarks] = useState('');

  // Live validation states
  const [stationVal, setStationVal] = useState<any>(null);
  const [incidentVal, setIncidentVal] = useState<any>(null);
  const [classification, setClassification] = useState<any>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load stations & divisions
  useEffect(() => {
    const loadNetwork = async () => {
      try {
        const [stList, divList] = await Promise.all([
          api.getStations(),
          api.getDivisions()
        ]);
        setStations(stList);
        setDivisions(divList);
      } catch (err) {
        console.error('Failed to load railway network data', err);
      }
    };
    loadNetwork();
  }, []);

  // Update station name & division when station code changes
  const handleStationCodeSelect = (code: string) => {
    setStationCode(code);
    const found = stations.find((s) => s.station_code === code);
    if (found) {
      setStationName(found.station_name);
      setDivision(found.division_code);
    }
  };

  // Live Automata Validation on Station Code (BCS503)
  useEffect(() => {
    if (!stationCode.trim()) {
      setStationVal(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.validateStation(stationCode.trim().toUpperCase());
        setStationVal(res);
      } catch (e) {
        console.error(e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [stationCode]);

  // Live Automata Validation on Incident Code (BCS503)
  useEffect(() => {
    if (!incidentCode.trim()) {
      setIncidentVal(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.validateIncident(incidentCode.trim().toUpperCase());
        setIncidentVal(res);
      } catch (e) {
        console.error(e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [incidentCode]);

  // Live Classification Preview (Part 4)
  useEffect(() => {
    if (!incidentCode.trim() && !description.trim()) {
      setClassification(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.testClassification(incidentCode.trim().toUpperCase(), description);
        setClassification(res);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [incidentCode, description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmissionResult(null);

    // Basic required validation
    if (!reporterName.trim() || !stationCode.trim() || !incidentCode.trim() || !description.trim()) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        reporter_name: reporterName,
        station_code: stationCode.trim().toUpperCase(),
        station_name: stationName,
        division,
        contact_info: contactInfo,
        incident_code: incidentCode.trim().toUpperCase(),
        incident_description: description,
        urgency_level: urgency,
        additional_remarks: remarks
      };

      const res = await api.submitReport(payload);
      setSubmissionResult(res);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Report submission rejected. Check validation criteria.');
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmissionResult(null);
    setDescription('');
    setRemarks('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
          <FilePlus className="w-4 h-4 text-blue-400" />
          <span>Part 9 • Structured Incident Intake</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Submit Railway Signal Incident Report
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Mandatory identifier syntax verification using Deterministic Finite Automata (BCS503) & automated dispatch routing (BCS502).
        </p>
      </div>

      {/* Confirmation Modal / Banner if submitted */}
      {submissionResult && (
        <div className="p-6 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span>Incident Dispatched Successfully</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {submissionResult.report_id}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Persistent SQLite record created with full audit logging.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Classification Category:</div>
              <div className="font-bold text-white mt-1">
                <StatusBadge type="category" value={submissionResult.category} size="sm" />
              </div>
              <div className="text-slate-500 mt-1">Priority: {submissionResult.priority}</div>
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Routing Assignment:</div>
              {submissionResult.assignment?.assigned ? (
                <div className="mt-1">
                  <div className="font-bold text-emerald-400">
                    {submissionResult.assignment.handler_name}
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    ID: {submissionResult.assignment.handler_id} ({submissionResult.assignment.assignment_type})
                  </div>
                </div>
              ) : (
                <div className="mt-1 font-bold text-amber-400">
                  Enqueued in Priority Waiting Queue
                </div>
              )}
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Escalation Status:</div>
              {submissionResult.escalation?.escalated ? (
                <div className="mt-1 text-red-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                  <span>Tier 2: Escalated to Zonal HQ</span>
                </div>
              ) : (
                <div className="mt-1 text-slate-400">Tier 1 Division Standard</div>
              )}
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-xs">
            <div className="font-semibold text-slate-300 mb-1">Routing Decision Trace:</div>
            <ul className="space-y-1 text-slate-400 font-mono text-[11px]">
              {submissionResult.explanation?.map((exp: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleResetForm}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Submit Another Incident
          </button>
        </div>
      )}

      {/* Main Two-Column Layout: Form & Live Automata/Routing Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-sm">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reporter Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reporter Name *
              </label>
              <input
                type="text"
                required
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Station Master Name"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Information *
              </label>
              <input
                type="text"
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Official Email / Railway Intercom / Mobile"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Station Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Station Code (DFA Verified) *
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={stationCode}
                onChange={(e) => handleStationCodeSelect(e.target.value.toUpperCase())}
                placeholder="E.g., SBC01"
                className="w-full px-3 py-2 font-mono font-bold bg-slate-900 border border-slate-700 rounded-lg text-xs text-blue-300 placeholder:text-slate-600 uppercase focus:outline-none focus:border-blue-500"
              />
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Format: [A-Z]{'{3}'}[0-9]{'{2}'}</div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Or Select from 30 Demonstration Stations
              </label>
              <select
                value={stationCode}
                onChange={(e) => handleStationCodeSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <optgroup label="Bangalore Division (SBC)">
                  {stations.filter(s => s.division_code === 'SBC').map(s => (
                    <option key={s.station_code} value={s.station_code}>
                      {s.station_code} - {s.station_name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Hubli Division (UBL)">
                  {stations.filter(s => s.division_code === 'UBL').map(s => (
                    <option key={s.station_code} value={s.station_code}>
                      {s.station_code} - {s.station_name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Mysore Division (MYS)">
                  {stations.filter(s => s.division_code === 'MYS').map(s => (
                    <option key={s.station_code} value={s.station_code}>
                      {s.station_code} - {s.station_name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Station Name (Auto-populated)
              </label>
              <input
                type="text"
                readOnly
                value={stationName}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Railway Division (Auto-mapped)
              </label>
              <input
                type="text"
                readOnly
                value={`${division} DIVISION`}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-blue-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Incident Code & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Incident Code (SIG, TRK, ELE) *
              </label>
              <input
                type="text"
                required
                value={incidentCode}
                onChange={(e) => setIncidentCode(e.target.value.toUpperCase())}
                placeholder="E.g., SIG-101 or TRK-202"
                className="w-full px-3 py-2 font-mono font-bold bg-slate-900 border border-slate-700 rounded-lg text-xs text-amber-300 placeholder:text-slate-600 uppercase focus:outline-none focus:border-blue-500"
              />
              <div className="text-[10px] text-slate-500 mt-0.5">
                Configured: Prefix (SIG/TRK/ELE) + '-' + 3 digits
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Urgency Level *
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="CRITICAL">CRITICAL (Mandatory Zonal HQ Escalation)</option>
                <option value="HIGH">HIGH (Immediate Squad Dispatch)</option>
                <option value="MEDIUM">MEDIUM (Standard Maintenance Response)</option>
                <option value="LOW">LOW (Routine / Non-disruptive)</option>
              </select>
            </div>
          </div>

          {/* Incident Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Incident Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact operational failure symptoms. (E.g.: Point 14-B normal detection lost during route setting. Signal 8-A displaying Red aspect to approaching train 12658.)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Additional Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Track section, line number, weather conditions or caution order details"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              * Identifiers are evaluated live by DFA simulator prior to transmission.
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Validating & Routing...' : 'Dispatch Report to Routing Engine'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right Col: Live Automata & Routing Engine Telemetry */}
        <div className="space-y-4">
          
          {/* Station Code DFA Live Monitor */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Station DFA Telemetry</span>
              </div>
              {stationVal ? (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  stationVal.is_valid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {stationVal.is_valid ? 'DFA ACCEPTED' : 'DFA REJECTED'}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Awaiting input</span>
              )}
            </div>

            {stationVal && (
              <div className="text-xs space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>DFA Final State:</span>
                  <span className="font-mono font-bold text-white">{stationVal.dfa_final_state}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Regex Agreement:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {stationVal.agreement ? 'Dual Engine Agreed' : 'Mismatch'}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono">
                  {stationVal.validation_reason}
                </div>
              </div>
            )}
          </div>

          {/* Incident Code Live Monitor */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Incident Code Automata</span>
              </div>
              {incidentVal ? (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  incidentVal.is_valid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {incidentVal.is_valid ? 'VALID PREFIX' : 'INVALID PREFIX'}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Awaiting input</span>
              )}
            </div>

            {incidentVal && (
              <div className="text-xs space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Detected Prefix:</span>
                  <span className="font-mono font-bold text-amber-300">{incidentVal.prefix || 'None'}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono">
                  {incidentVal.validation_reason}
                </div>
              </div>
            )}
          </div>

          {/* Live Classification Engine Preview (Part 4) */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Network className="w-4 h-4 text-emerald-400" />
                <span>Classification Preview</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">5 Predefined Cats</span>
            </div>

            {classification?.success ? (
              <div className="text-xs space-y-2 pt-1">
                <div>
                  <span className="text-slate-400">Target Category:</span>
                  <div className="mt-1">
                    <StatusBadge type="category" value={classification.category} />
                  </div>
                </div>
                {classification.conflict_detected && (
                  <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px]">
                    Conflict detected. Deterministic priority rule resolved category to safety hardware failure.
                  </div>
                )}
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  {classification.rationale}
                </div>
              </div>
            ) : classification?.error ? (
              <div className="p-2 rounded bg-red-950/30 border border-red-500/30 text-red-300 text-[11px]">
                {classification.error}
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Type incident code and description for real-time classification preview.
              </div>
            )}
          </div>

          {/* Critical Escalation Tier 2 Warning */}
          {urgency === 'CRITICAL' && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/50 space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Tier 2 Zonal Escalation Alert</span>
              </div>
              <p className="text-[11px] text-red-200/90 leading-tight">
                CRITICAL priority reports trigger an immediate second-tier escalation record to Zonal Headquarters (SWR Operations Cell) alongside division dispatch.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
