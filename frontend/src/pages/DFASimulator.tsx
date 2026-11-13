import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle, 
  XCircle, 
  Play, 
  RotateCcw, 
  ArrowRight, 
  Info,
  HelpCircle,
  Binary
} from 'lucide-react';
import { api } from '../services/api';
import { DFAValidationResult } from '../types';
import { simulateStationCodeDFA } from '../services/dfaSimulator';

export const DFASimulator: React.FC = () => {
  const [inputCode, setInputCode] = useState<string>('SBC01');
  const initialResult = simulateStationCodeDFA('SBC01');
  const [validationResult, setValidationResult] = useState<DFAValidationResult>(initialResult as any);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(initialResult.dfa_steps.length - 1);
  const [dfaSpec, setDfaSpec] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Fetch formal spec
  useEffect(() => {
    const loadSpec = async () => {
      try {
        const spec = await api.getDFASpec();
        setDfaSpec(spec);
      } catch (err) {
        console.error(err);
      }
    };
    loadSpec();
  }, []);

  // Run validation whenever inputCode changes
  const runValidation = async (code: string) => {
    // Immediate instantaneous visual update
    const local = simulateStationCodeDFA(code);
    setValidationResult(local as any);
    setActiveStepIndex(local.dfa_steps.length - 1);

    try {
      const res = await api.validateStation(code);
      if (res && res.dfa_steps) {
        setValidationResult(res);
        setActiveStepIndex(res.dfa_steps.length - 1);
      }
    } catch (err) {
      console.warn('API sync warning, using local simulation:', err);
    }
  };

  useEffect(() => {
    if (inputCode !== undefined) {
      runValidation(inputCode);
    }
  }, [inputCode]);

  // Stepper animation
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && validationResult?.dfa_steps) {
      interval = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev >= validationResult.dfa_steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isPlaying, validationResult]);

  const handlePlayAnimation = () => {
    setActiveStepIndex(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveStepIndex(validationResult?.dfa_steps?.length ? validationResult.dfa_steps.length - 1 : 0);
  };

  const currentStep = validationResult?.dfa_steps?.[activeStepIndex] || validationResult?.dfa_steps?.[0];
  const currentState = currentStep?.to_state || 'q0';

  // Preset demonstration codes
  const presets = [
    { label: 'Valid (SBC01)', code: 'SBC01', valid: true },
    { label: 'Valid (BLR12)', code: 'BLR12', valid: true },
    { label: 'Valid (ABC01)', code: 'ABC01', valid: true },
    { label: 'Invalid (ABC1 - Missing Digit)', code: 'ABC1', valid: false },
    { label: 'Invalid (ABCD12 - 4 Letters)', code: 'ABCD12', valid: false },
    { label: 'Invalid (abc12 - Lowercase)', code: 'abc12', valid: false },
    { label: 'Invalid (12ABC - Inverted)', code: '12ABC', valid: false }
  ];

  const states = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q_dead'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span>Automata Theory & Computability • BCS503</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Deterministic Finite Automaton (DFA) Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Formal 5-tuple machine $M = (Q, \Sigma, \delta, q_0, F)$ for Station Code syntax $[A-Z]^3 [0-9]^2$ with step-by-step state transition simulation.
        </p>
      </div>

      {/* Preset Test Buttons */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
        <div className="text-xs font-semibold text-slate-300">Quick Academic Presets:</div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputCode(p.code);
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                inputCode === p.code
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : p.valid
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50'
                  : 'bg-red-950/40 text-red-300 border-red-500/30 hover:bg-red-900/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Input and Tape */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Enter Station Code for Machine Simulation:
            </label>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="E.g., SBC01 or ABC1"
              className="w-full px-4 py-2.5 font-mono text-base font-bold bg-slate-900 border border-slate-700 rounded-lg text-white tracking-widest placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-4">
            <button
              onClick={handlePlayAnimation}
              disabled={isPlaying || !validationResult?.dfa_steps?.length}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>Animate Steps</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Input Tape Visualization */}
        <div className="pt-2">
          <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
            <span>Automaton Input Tape & Head Position:</span>
            <span>Tape Head at Pos: {activeStepIndex} / {inputCode.length}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {/* Start marker */}
            <div className="w-12 h-14 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center font-mono text-xs text-slate-500 shrink-0">
              <span className="text-[10px] text-slate-600">START</span>
              <span>▷</span>
            </div>

            {inputCode.split('').map((ch, idx) => {
              const isHeadHere = activeStepIndex === idx + 1;
              const isProcessed = activeStepIndex > idx + 1;
              return (
                <div
                  key={idx}
                  className={`w-12 h-14 rounded-lg flex flex-col items-center justify-center font-mono shrink-0 border transition-all ${
                    isHeadHere
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-lg ring-2 ring-blue-500'
                      : isProcessed
                      ? 'bg-slate-900 border-slate-700 text-slate-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] text-slate-400">w[{idx + 1}]</span>
                  <span className="text-lg font-bold">{ch}</span>
                </div>
              );
            })}

            {/* End marker */}
            <div className="w-12 h-14 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center font-mono text-xs text-slate-500 shrink-0">
              <span className="text-[10px] text-slate-600">END</span>
              <span>□</span>
            </div>
          </div>
        </div>

      </div>

      {/* Visual State Machine Diagram */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm text-white flex items-center gap-2">
            <Binary className="w-4 h-4 text-emerald-400" />
            <span>State Transition Diagram & Active Node</span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
            Active: {currentState}
          </span>
        </div>

        {/* State nodes graph */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
          {states.map((st) => {
            const isActive = currentState === st;
            const isAccepting = st === 'q5';
            const isDead = st === 'q_dead';

            return (
              <div
                key={st}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? isDead
                      ? 'bg-red-950/60 border-red-400 text-white shadow-lg ring-2 ring-red-500 animate-pulse'
                      : isAccepting
                      ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-500 animate-pulse'
                      : 'bg-blue-900/60 border-blue-400 text-white shadow-lg ring-2 ring-blue-500'
                    : isDead
                    ? 'bg-slate-950 border-slate-800 text-red-400/60'
                    : isAccepting
                    ? 'bg-slate-950 border-emerald-800/40 text-emerald-400/80 ring-1 ring-emerald-600/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-mono font-bold flex items-center gap-1">
                  <span>{st}</span>
                  {isAccepting && <span className="text-[10px] text-emerald-400 font-bold">(F)</span>}
                  {st === 'q0' && <span className="text-[10px] text-blue-400 font-bold">(q0)</span>}
                </div>

                <div className="text-[10px] text-center mt-1 leading-tight text-slate-400">
                  {st === 'q0' && 'Start (Init)'}
                  {st === 'q1' && '1st Letter'}
                  {st === 'q2' && '2nd Letter'}
                  {st === 'q3' && '3rd Letter'}
                  {st === 'q4' && '1st Digit'}
                  {st === 'q5' && 'Accepting (2nd Digit)'}
                  {st === 'q_dead' && 'Trap / Reject'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Step Description Card */}
        {currentStep && (
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <div className="font-semibold text-white">
                Step {currentStep.step}: Transitioned {currentStep.from_state ? `${currentStep.from_state} → ${currentStep.to_state}` : `to ${currentStep.to_state}`}
              </div>
              <div className="text-slate-300 font-mono">
                {currentStep.explanation}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dual Engine Comparison (DFA vs Regex) */}
      {validationResult && (
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-4">
          <div className="text-sm font-bold text-white flex items-center justify-between">
            <span>Dual Engine Verification Comparison (BCS503 Mandatory Check)</span>
            <span className={`text-xs px-2.5 py-1 rounded font-bold font-mono ${
              validationResult.agreement
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-red-500/20 text-red-400 border border-red-500/40'
            }`}>
              {validationResult.agreement ? 'MATHEMATICALLY AGREED' : 'DISAGREEMENT ANOMALY'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* DFA Card */}
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">DFA State Transition Result:</span>
                {validationResult.dfa_result ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>ACCEPTED (State q5)</span>
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    <span>REJECTED ({validationResult.dfa_final_state})</span>
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[11px]">
                Machine halted at state: <span className="font-mono text-white font-bold">{validationResult.dfa_final_state}</span>
              </div>
            </div>

            {/* Regex Card */}
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Equivalent Regular Expression:</span>
                {validationResult.regex_result ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>REGEX MATCH</span>
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    <span>REGEX NO MATCH</span>
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[11px] font-mono">
                Pattern: <span className="text-blue-300">{validationResult.regex_pattern}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            {validationResult.validation_reason}
          </div>
        </div>
      )}

      {/* Step-by-Step Transition Audit Table */}
      {validationResult?.dfa_steps && (
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900 border-b border-slate-800 font-bold text-sm text-white">
            Complete Step-by-Step Transition Trace Table
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Step</th>
                  <th className="py-2.5 px-4">Input Char</th>
                  <th className="py-2.5 px-4">From State</th>
                  <th className="py-2.5 px-4">To State</th>
                  <th className="py-2.5 px-4 font-sans">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {validationResult.dfa_steps.map((step, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      activeStepIndex === idx ? 'bg-blue-600/20 text-white font-bold' : 'hover:bg-slate-800/30 text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-4">{step.step}</td>
                    <td className="py-2 px-4 text-amber-300 font-bold">{step.char || '—'}</td>
                    <td className="py-2 px-4 text-slate-400">{step.from_state || '—'}</td>
                    <td className="py-2 px-4 text-emerald-400 font-bold">{step.to_state}</td>
                    <td className="py-2 px-4 font-sans text-xs">{step.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formal 5-tuple Definition Reference */}
      {dfaSpec && (
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-slate-200 uppercase tracking-wider text-xs">
            Formal Mathematical 5-Tuple Definition: M = (Q, Σ, δ, q0, F)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 font-mono text-[11px]">
            <div>• States Q = {'{q0, q1, q2, q3, q4, q5, q_dead}'}</div>
            <div>• Input Alphabet Σ = [A-Z] ∪ [0-9]</div>
            <div>• Initial State q0 = &apos;q0&apos;</div>
            <div>• Final Accepting States F = {'{\'q5\'}'}</div>
            <div className="md:col-span-2">• Language L = {'{ w ∈ Σ* | w matches [A-Z]{3}[0-9]{2} }'}</div>
          </div>
        </div>
      )}

    </div>
  );
};
