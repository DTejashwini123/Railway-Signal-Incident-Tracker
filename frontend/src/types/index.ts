export interface User {
  id: number;
  username: string;
  role: 'Station Master' | 'Handler' | 'Administrator';
  full_name: string;
  division?: string;
  created_at?: string;
}

export interface Station {
  id: number;
  station_code: string;
  station_name: string;
  division_code: string;
  is_demo: boolean;
  created_at?: string;
}

export interface RailwayDivision {
  id: number;
  division_code: string;
  division_name: string;
  headquarters: string;
  is_demo: boolean;
  created_at?: string;
}

export interface IncidentCategory {
  id: number;
  name: string;
  code_prefix: string;
  description: string;
  severity_default: string;
}

export interface Handler {
  id: number;
  handler_id: string;
  name: string;
  department: string;
  division: string;
  specialization: string;
  availability_status: 'AVAILABLE' | 'UNAVAILABLE' | 'ON_LEAVE' | 'BUSY';
  max_capacity: number;
  current_workload: number;
  is_active: boolean;
  utilization_rate: number;
}

export interface RoutingEntry {
  id: number;
  station_code?: string;
  station_name?: string;
  division: string;
  incident_prefix: string;
  incident_category: string;
  branch: string;
  department: string;
  depot_authority: string;
  primary_handler_id?: string;
  backup_handler_id?: string;
  priority_rule: string;
  escalation_destination: string;
}

export interface Report {
  id: number;
  report_id: string;
  reporter_name: string;
  station_code: string;
  station_name: string;
  division: string;
  contact_info: string;
  incident_code: string;
  incident_description: string;
  urgency_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  additional_remarks?: string;
  validation_status: 'VALID' | 'REJECTED';
  dfa_result: boolean;
  regex_result: boolean;
  validation_reason: string;
  category: 'Signal-Failure' | 'Track-Obstruction' | 'Electrical' | 'Minor-Delay' | 'Test-Entry' | string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved';
  assigned_handler_id?: string;
  escalation_status: 'NONE' | 'ESCALATED_ZONAL_HQ';
  resolution_remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Assignment {
  id: number;
  report_id: string;
  handler_id: string;
  assignment_type: 'PRIMARY' | 'BACKUP' | 'REASSIGNED';
  assigned_at: string;
  status: string;
  rationale: string;
}

export interface WaitingQueueItem {
  id: number;
  report_id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  queue_position: number;
  entered_at: string;
  status: string;
  reason: string;
  report?: Report;
}

export interface StatusHistoryItem {
  id: number;
  report_id: string;
  old_status: string;
  new_status: string;
  updated_by: string;
  remarks?: string;
  timestamp: string;
}

export interface EscalationRecord {
  id: number;
  report_id: string;
  division: string;
  escalated_to: string;
  reason: string;
  timestamp: string;
  status: string;
  report?: Report;
}

export interface RoutingLog {
  id: number;
  report_id: string;
  action: string;
  decision: string;
  explanation: string;
  timestamp: string;
}

export interface DFAStep {
  step: number;
  char: string | null;
  position?: number;
  from_state: string | null;
  to_state: string;
  explanation: string;
}

export interface DFAValidationResult {
  input: string;
  identifier_type: string;
  is_valid: boolean;
  dfa_result: boolean;
  regex_result: boolean;
  agreement: boolean;
  validation_reason: string;
  dfa_final_state: string;
  dfa_steps: DFAStep[];
  regex_pattern: string;
  prefix?: string;
}

export interface TestCaseResult {
  id: string;
  description: string;
  category: string;
  input: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
}
