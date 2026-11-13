import axios from 'axios';
import { simulateStationCodeDFA, simulateIncidentCodeDFA } from './dfaSimulator';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // If opened directly on Flask server (port 5000) or Vite server (port 3000)
    if (window.location.port === '5000' || window.location.port === '3000') {
      return '/api';
    }
    // If opened on another Vite dev port (e.g. 5173), target Flask directly
    return 'http://127.0.0.1:5000/api';
  }
  return '/api';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Automatic Network Fallback Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || config._retryCount) {
      return Promise.reject(error);
    }
    config._retryCount = 1;

    // If network error occurred, switch host between /api and http://127.0.0.1:5000/api
    if (error.code === 'ERR_NETWORK' || !error.response) {
      const current = config.baseURL || '';
      const fallback = current.startsWith('http') ? '/api' : 'http://127.0.0.1:5000/api';
      console.warn(`[API] Connection to ${current} failed, retrying on ${fallback}`);
      config.baseURL = fallback;
      return apiClient(config);
    }
    return Promise.reject(error);
  }
);

// Fallback Default Stations & Divisions across 3 Divisions (BCS502)
export const DEFAULT_STATIONS = [
  // Bangalore Division (SBC)
  { id: 1, station_code: 'SBC01', station_name: 'Bangalore City Junction', division_code: 'SBC', is_demo: true },
  { id: 2, station_code: 'SBC02', station_name: 'Bangalore Cantonment', division_code: 'SBC', is_demo: true },
  { id: 3, station_code: 'SBC03', station_name: 'Yesvantpur Junction', division_code: 'SBC', is_demo: true },
  { id: 4, station_code: 'SBC04', station_name: 'K.R. Puram Terminal', division_code: 'SBC', is_demo: true },
  { id: 5, station_code: 'SBC05', station_name: 'Whitefield Industrial Depot', division_code: 'SBC', is_demo: true },
  { id: 6, station_code: 'SBC06', station_name: 'Yelahanka Junction', division_code: 'SBC', is_demo: true },
  { id: 7, station_code: 'SBC07', station_name: 'Banaswadi Station', division_code: 'SBC', is_demo: true },
  { id: 8, station_code: 'SBC08', station_name: 'Carmelaram Junction', division_code: 'SBC', is_demo: true },
  { id: 9, station_code: 'SBC09', station_name: 'Channasandra Loop', division_code: 'SBC', is_demo: true },
  { id: 10, station_code: 'SBC10', station_name: 'Baiyyappanahalli Yard', division_code: 'SBC', is_demo: true },

  // Hubli Division (UBL)
  { id: 11, station_code: 'UBL01', station_name: 'Siddharoodha Swamiji Hubli Jn', division_code: 'UBL', is_demo: true },
  { id: 12, station_code: 'UBL02', station_name: 'Dharwad Junction', division_code: 'UBL', is_demo: true },
  { id: 13, station_code: 'UBL03', station_name: 'Gadag Junction', division_code: 'UBL', is_demo: true },
  { id: 14, station_code: 'UBL04', station_name: 'Koppal Waypoint', division_code: 'UBL', is_demo: true },
  { id: 15, station_code: 'UBL05', station_name: 'Hosapete Junction', division_code: 'UBL', is_demo: true },
  { id: 16, station_code: 'UBL06', station_name: 'Ballari Junction', division_code: 'UBL', is_demo: true },
  { id: 17, station_code: 'UBL07', station_name: 'Bagalkot Terminal', division_code: 'UBL', is_demo: true },
  { id: 18, station_code: 'UBL08', station_name: 'Vijayapura Main', division_code: 'UBL', is_demo: true },
  { id: 19, station_code: 'UBL09', station_name: 'Londa Junction', division_code: 'UBL', is_demo: true },
  { id: 20, station_code: 'UBL10', station_name: 'Alnavar Interlock Yard', division_code: 'UBL', is_demo: true },

  // Mysore Division (MYS)
  { id: 21, station_code: 'MYS01', station_name: 'Mysore City Central', division_code: 'MYS', is_demo: true },
  { id: 22, station_code: 'MYS02', station_name: 'Naganahalli Station', division_code: 'MYS', is_demo: true },
  { id: 23, station_code: 'MYS03', station_name: 'Pandavapura Station', division_code: 'MYS', is_demo: true },
  { id: 24, station_code: 'MYS04', station_name: 'Mandya Regional Terminal', division_code: 'MYS', is_demo: true },
  { id: 25, station_code: 'MYS05', station_name: 'Maddur Crossing', division_code: 'MYS', is_demo: true },
  { id: 26, station_code: 'MYS06', station_name: 'Channapatna Craft Point', division_code: 'MYS', is_demo: true },
  { id: 27, station_code: 'MYS07', station_name: 'Ramanagaram Silk City', division_code: 'MYS', is_demo: true },
  { id: 28, station_code: 'MYS08', station_name: 'Bidadi Industrial Point', division_code: 'MYS', is_demo: true },
  { id: 29, station_code: 'MYS09', station_name: 'Hassan Junction', division_code: 'MYS', is_demo: true },
  { id: 30, station_code: 'MYS10', station_name: 'Arsikere Junction Yard', division_code: 'MYS', is_demo: true },
];

export const DEFAULT_DIVISIONS = [
  { id: 1, division_code: 'SBC', division_name: 'Bangalore Division', headquarters: 'Bangalore City', is_demo: true },
  { id: 2, division_code: 'UBL', division_name: 'Hubli Division', headquarters: 'Hubli Central', is_demo: true },
  { id: 3, division_code: 'MYS', division_name: 'Mysore Division', headquarters: 'Mysore Junction', is_demo: true },
];

export const api = {
  // Auth
  login: async (credentials: { username: string; password: string }) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async (username: string) => {
    const res = await apiClient.get(`/auth/me?username=${username}`);
    return res.data;
  },

  // Automata (BCS503)
  validateStation: async (stationCode: string) => {
    try {
      const res = await apiClient.post('/automata/validate-station', { station_code: stationCode });
      return res.data;
    } catch (err) {
      // Immediate local simulation fallback
      return simulateStationCodeDFA(stationCode);
    }
  },
  validateIncident: async (incidentCode: string) => {
    try {
      const res = await apiClient.post('/automata/validate-incident', { incident_code: incidentCode });
      return res.data;
    } catch (err) {
      return simulateIncidentCodeDFA(incidentCode);
    }
  },
  getDFASpec: async () => {
    try {
      const res = await apiClient.get('/automata/dfa-spec');
      return res.data;
    } catch (err) {
      return {
        name: 'Station Code Deterministic Finite Automaton (BCS503)',
        language: 'L = { w in Sigma* | w is 3 uppercase alphabetic characters followed by 2 numeric digits }',
        pattern: '[A-Z]{3}[0-9]{2}',
        Q_states: ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q_dead'],
        sigma_alphabet: 'Uppercase English Letters [A-Z] U Decimal Digits [0-9]',
        q0_initial: 'q0',
        F_accepting: ['q5'],
        dead_state: 'q_dead',
      };
    }
  },

  // Classification
  testClassification: async (incidentCode: string, description: string) => {
    try {
      const res = await apiClient.post('/classification/test', {
        incident_code: incidentCode,
        description,
      });
      return res.data;
    } catch (err) {
      const code = (incidentCode || '').toUpperCase();
      let cat = 'Minor-Delay';
      let rationale = 'Identified via operational heuristic.';
      if (code.startsWith('SIG')) {
        cat = 'Signal-Failure';
        rationale = "Prefix 'SIG' mapped to Signal-Failure.";
      } else if (code.startsWith('TRK')) {
        cat = 'Track-Obstruction';
        rationale = "Prefix 'TRK' mapped to Track-Obstruction.";
      } else if (code.startsWith('ELE')) {
        cat = 'Electrical';
        rationale = "Prefix 'ELE' mapped to Electrical.";
      } else if (description.toLowerCase().includes('drill') || description.toLowerCase().includes('test')) {
        cat = 'Test-Entry';
        rationale = 'Rule 1 Test/Drill override.';
      }
      return {
        success: true,
        category: cat,
        conflict_detected: false,
        rationale,
      };
    }
  },
  getClassificationRules: async () => {
    const res = await apiClient.get('/classification/rules');
    return res.data;
  },

  // Computer Networks - Stations & Divisions (BCS502)
  getStations: async () => {
    try {
      const res = await apiClient.get('/network/stations');
      return res.data?.length ? res.data : DEFAULT_STATIONS;
    } catch (err) {
      return DEFAULT_STATIONS;
    }
  },
  getDivisions: async () => {
    try {
      const res = await apiClient.get('/network/divisions');
      return res.data?.length ? res.data : DEFAULT_DIVISIONS;
    } catch (err) {
      return DEFAULT_DIVISIONS;
    }
  },

  // Routing Table & Operations
  getRoutingTable: async () => {
    const res = await apiClient.get('/routing/table');
    return res.data;
  },
  getWaitingQueue: async () => {
    const res = await apiClient.get('/routing/queue');
    return res.data;
  },
  getEscalations: async () => {
    const res = await apiClient.get('/routing/escalations');
    return res.data;
  },
  getRoutingLogs: async () => {
    const res = await apiClient.get('/routing/logs');
    return res.data;
  },

  // Handlers
  getHandlers: async () => {
    const res = await apiClient.get('/handlers');
    return res.data;
  },
  updateHandler: async (handlerId: string, data: any) => {
    const res = await apiClient.put(`/handlers/${handlerId}`, data);
    return res.data;
  },

  // Reports
  getReports: async (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams(filters);
    const res = await apiClient.get(`/reports?${params.toString()}`);
    return res.data;
  },
  getReportDetails: async (reportId: string) => {
    const res = await apiClient.get(`/reports/${reportId}`);
    return res.data;
  },
  submitReport: async (reportData: any) => {
    const res = await apiClient.post('/reports', reportData);
    return res.data;
  },
  updateReportStatus: async (reportId: string, statusData: { status: string; remarks: string; updated_by: string }) => {
    const res = await apiClient.post(`/reports/${reportId}/status`, statusData);
    return res.data;
  },
  reassignReport: async (reportId: string, data: { handler_id: string; rationale: string }) => {
    const res = await apiClient.post(`/reports/${reportId}/reassign`, data);
    return res.data;
  },

  // Analytics
  getAnalytics: async () => {
    const res = await apiClient.get('/analytics');
    return res.data;
  },

  // Testing Suite
  getTestResults: async () => {
    const res = await apiClient.get('/tests/results');
    return res.data;
  },
  resetDemoData: async () => {
    const res = await apiClient.post('/system/reset-demo');
    return res.data;
  },
};
