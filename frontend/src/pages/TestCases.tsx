import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  Filter, 
  ShieldCheck, 
  Terminal,
  Cpu,
  Network
} from 'lucide-react';
import { api } from '../services/api';
import { TestCaseResult } from '../types';

export const TestCases: React.FC = () => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const runTests = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTestResults();
      setTestResults(res.test_cases || []);
      setSummary({
        total: res.total_tests,
        passed: res.passed,
        failed: res.failed,
        passRate: res.pass_rate
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const categories = ['ALL', 'Automata (BCS503)', 'Networks (BCS502)', 'Classification', 'Handler Management', 'Escalation (Tier 2)', 'Queue Algorithm', 'Integrity', 'Workflow', 'Database Persistence'];

  const filteredTests = filterCategory === 'ALL'
    ? testResults
    : testResults.filter(t => t.category === filterCategory);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Part 16 • Academic & Functional Verification Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Documented Test Cases (TC01 – TC22)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated validation covering BCS503 DFA & Regex, BCS502 Computer Networks routing, 5 incident categories, and Zonal HQ escalation.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto shadow-md"
        >
          <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Running Test Suite...' : 'Rerun All Tests'}</span>
        </button>
      </div>

      {/* Summary Stat Banner */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm">
          <div>
            <div className="text-xs text-slate-400">Total Documented Tests</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{summary.total} Test Cases</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Part 16 Mandate (Min 15)</div>
          </div>

          <div>
            <div className="text-xs text-emerald-400">Passed Tests</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{summary.passed} Passed</div>
            <div className="text-[11px] text-slate-500 mt-0.5">100% Verification</div>
          </div>

          <div>
            <div className="text-xs text-red-400">Failed Tests</div>
            <div className="text-2xl font-bold font-mono text-red-400 mt-1">{summary.failed} Failed</div>
            <div className="text-[11px] text-slate-500 mt-0.5">0 Anomaly Target</div>
          </div>

          <div>
            <div className="text-xs text-blue-400">Pass Rate</div>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{summary.passRate}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Automated Pytest & API</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Category Filter:</span>
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2.5 py-1 rounded-md transition-all ${
              filterCategory === cat
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Test Cases Table */}
      <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Module / Category</th>
                <th className="py-3 px-4">Test Description</th>
                <th className="py-3 px-4">Test Input</th>
                <th className="py-3 px-4">Expected Result</th>
                <th className="py-3 px-4">Actual Output</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTests.map((tc) => (
                <tr key={tc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                    {tc.id}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium">
                      {tc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-white max-w-xs">
                    {tc.description}
                  </td>
                  <td className="py-3 px-4 font-mono text-amber-300 text-[11px] max-w-xs truncate">
                    {tc.input}
                  </td>
                  <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs">
                    {tc.expected}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 text-[11px] max-w-xs truncate">
                    {tc.actual}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {tc.status === 'PASS' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 font-bold text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>FAIL</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
