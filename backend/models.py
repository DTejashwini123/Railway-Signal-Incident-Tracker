from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# 1. Users
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # 'Station Master', 'Handler', 'Administrator'
    full_name = db.Column(db.String(120), nullable=False)
    division = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'full_name': self.full_name,
            'division': self.division,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# 2. Stations (BCS502: exactly 30 stations, 10 per division, code format [A-Z]{3}[0-9]{2})
class Station(db.Model):
    __tablename__ = 'stations'
    
    id = db.Column(db.Integer, primary_key=True)
    station_code = db.Column(db.String(10), unique=True, nullable=False)
    station_name = db.Column(db.String(120), nullable=False)
    division_code = db.Column(db.String(10), nullable=False)
    is_demo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'station_code': self.station_code,
            'station_name': self.station_name,
            'division_code': self.division_code,
            'is_demo': self.is_demo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# 3. Railway Divisions (BCS502: exactly 3 divisions)
class RailwayDivision(db.Model):
    __tablename__ = 'railway_divisions'
    
    id = db.Column(db.Integer, primary_key=True)
    division_code = db.Column(db.String(10), unique=True, nullable=False)
    division_name = db.Column(db.String(120), nullable=False)
    headquarters = db.Column(db.String(120), nullable=False)
    is_demo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'division_code': self.division_code,
            'division_name': self.division_name,
            'headquarters': self.headquarters,
            'is_demo': self.is_demo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# 4. Incident Categories (Part 4: exactly 5 categories)
class IncidentCategory(db.Model):
    __tablename__ = 'incident_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), unique=True, nullable=False)
    code_prefix = db.Column(db.String(20), nullable=True)
    description = db.Column(db.String(255), nullable=False)
    severity_default = db.Column(db.String(20), default='MEDIUM')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code_prefix': self.code_prefix,
            'description': self.description,
            'severity_default': self.severity_default
        }

# 5. Handlers (Part 8: at least 10 handlers with availability and capacity)
class Handler(db.Model):
    __tablename__ = 'handlers'
    
    id = db.Column(db.Integer, primary_key=True)
    handler_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    division = db.Column(db.String(20), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    availability_status = db.Column(db.String(30), default='AVAILABLE')  # AVAILABLE, UNAVAILABLE, ON_LEAVE, BUSY
    max_capacity = db.Column(db.Integer, nullable=False, default=5)
    current_workload = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'handler_id': self.handler_id,
            'name': self.name,
            'department': self.department,
            'division': self.division,
            'specialization': self.specialization,
            'availability_status': self.availability_status,
            'max_capacity': self.max_capacity,
            'current_workload': self.current_workload,
            'is_active': self.is_active,
            'utilization_rate': round((self.current_workload / self.max_capacity * 100) if self.max_capacity > 0 else 0, 1)
        }

# 6. Routing Table (BCS502: explicit routing table stored in SQLite)
class RoutingTable(db.Model):
    __tablename__ = 'routing_table'
    
    id = db.Column(db.Integer, primary_key=True)
    station_code = db.Column(db.String(10), nullable=True)  # Specific or wildcard for division
    station_name = db.Column(db.String(120), nullable=True)
    division = db.Column(db.String(10), nullable=False)
    incident_prefix = db.Column(db.String(20), nullable=False)
    incident_category = db.Column(db.String(60), nullable=False)
    branch = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    depot_authority = db.Column(db.String(120), nullable=False)
    primary_handler_id = db.Column(db.String(50), db.ForeignKey('handlers.handler_id'), nullable=True)
    backup_handler_id = db.Column(db.String(50), db.ForeignKey('handlers.handler_id'), nullable=True)
    priority_rule = db.Column(db.String(100), nullable=False, default='Standard FIFO by severity')
    escalation_destination = db.Column(db.String(120), nullable=False, default='Zonal HQ SWR Operations Cell')

    def to_dict(self):
        return {
            'id': self.id,
            'station_code': self.station_code,
            'station_name': self.station_name,
            'division': self.division,
            'incident_prefix': self.incident_prefix,
            'incident_category': self.incident_category,
            'branch': self.branch,
            'department': self.department,
            'depot_authority': self.depot_authority,
            'primary_handler_id': self.primary_handler_id,
            'backup_handler_id': self.backup_handler_id,
            'priority_rule': self.priority_rule,
            'escalation_destination': self.escalation_destination
        }

# 7. Reports
class Report(db.Model):
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(40), unique=True, nullable=False)
    reporter_name = db.Column(db.String(120), nullable=False)
    station_code = db.Column(db.String(10), nullable=False)
    station_name = db.Column(db.String(120), nullable=False)
    division = db.Column(db.String(20), nullable=False)
    contact_info = db.Column(db.String(100), nullable=False)
    incident_code = db.Column(db.String(30), nullable=False)
    incident_description = db.Column(db.Text, nullable=False)
    urgency_level = db.Column(db.String(20), nullable=False, default='MEDIUM')
    additional_remarks = db.Column(db.Text, nullable=True)
    
    # Validation outcomes (DFA + Regex)
    validation_status = db.Column(db.String(30), nullable=False)  # 'VALID' or 'REJECTED'
    dfa_result = db.Column(db.Boolean, nullable=False)
    regex_result = db.Column(db.Boolean, nullable=False)
    validation_reason = db.Column(db.String(255), nullable=False)
    
    # Classification & Routing outcomes
    category = db.Column(db.String(60), nullable=False)  # 1 of 5 categories
    priority = db.Column(db.String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    status = db.Column(db.String(30), nullable=False, default='Pending')  # Pending, Assigned, In Progress, Resolved
    assigned_handler_id = db.Column(db.String(50), nullable=True)
    escalation_status = db.Column(db.String(50), nullable=False, default='NONE') # NONE, ESCALATED_ZONAL_HQ
    resolution_remarks = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'reporter_name': self.reporter_name,
            'station_code': self.station_code,
            'station_name': self.station_name,
            'division': self.division,
            'contact_info': self.contact_info,
            'incident_code': self.incident_code,
            'incident_description': self.incident_description,
            'urgency_level': self.urgency_level,
            'additional_remarks': self.additional_remarks,
            'validation_status': self.validation_status,
            'dfa_result': self.dfa_result,
            'regex_result': self.regex_result,
            'validation_reason': self.validation_reason,
            'category': self.category,
            'priority': self.priority,
            'status': self.status,
            'assigned_handler_id': self.assigned_handler_id,
            'escalation_status': self.escalation_status,
            'resolution_remarks': self.resolution_remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# 8. Assignments
class Assignment(db.Model):
    __tablename__ = 'assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(40), nullable=False)
    handler_id = db.Column(db.String(50), nullable=False)
    assignment_type = db.Column(db.String(30), nullable=False)  # 'PRIMARY', 'BACKUP', 'REASSIGNED'
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(30), default='ACTIVE')  # ACTIVE, COMPLETED, REASSIGNED
    rationale = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'handler_id': self.handler_id,
            'assignment_type': self.assignment_type,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'status': self.status,
            'rationale': self.rationale
        }

# 9. Waiting Queue (Part 8: deterministic priority queue)
class WaitingQueue(db.Model):
    __tablename__ = 'waiting_queue'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(40), unique=True, nullable=False)
    priority = db.Column(db.String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    queue_position = db.Column(db.Integer, nullable=False, default=1)
    entered_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(30), default='WAITING')  # WAITING, DISPATCHED, CANCELLED
    reason = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'priority': self.priority,
            'queue_position': self.queue_position,
            'entered_at': self.entered_at.isoformat() if self.entered_at else None,
            'status': self.status,
            'reason': self.reason
        }

# 10. Status History
class StatusHistory(db.Model):
    __tablename__ = 'status_history'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(40), nullable=False)
    old_status = db.Column(db.String(30), nullable=False)
    new_status = db.Column(db.String(30), nullable=False)
    updated_by = db.Column(db.String(80), nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'updated_by': self.updated_by,
            'remarks': self.remarks,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

# 11. Classification Rules (Part 4)
class ClassificationRule(db.Model):
    __tablename__ = 'classification_rules'
    
    id = db.Column(db.Integer, primary_key=True)
    rule_name = db.Column(db.String(100), nullable=False)
    pattern_type = db.Column(db.String(30), nullable=False)  # 'CODE_PREFIX', 'KEYWORD_DESCRIPTION', 'OVERRIDE'
    pattern_value = db.Column(db.String(100), nullable=False)
    target_category = db.Column(db.String(60), nullable=False)
    priority_order = db.Column(db.Integer, nullable=False, default=10) # Lower number = higher priority
    description = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'rule_name': self.rule_name,
            'pattern_type': self.pattern_type,
            'pattern_value': self.pattern_value,
            'target_category': self.target_category,
            'priority_order': self.priority_order,
            'description': self.description
        }

# 12. Escalation Records (Part 7: Mandatory Zonal Headquarters escalation)
class EscalationRecord(db.Model):
    __tablename__ = 'escalation_records'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(40), nullable=False)
    division = db.Column(db.String(20), nullable=False)
    escalated_to = db.Column(db.String(120), nullable=False, default='Zonal Headquarters Operations Cell')
    reason = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(40), default='ESCALATED_ACTIVE')

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'division': self.division,
            'escalated_to': self.escalated_to,
            'reason': self.reason,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'status': self.status
        }

# 13. Routing Logs (BCS502)
class RoutingLog(db.Model):
    __tablename__ = 'routing_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(40), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    decision = db.Column(db.String(100), nullable=False)
    explanation = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'action': self.action,
            'decision': self.decision,
            'explanation': self.explanation,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

# 14. Validation Logs (BCS503)
class ValidationLog(db.Model):
    __tablename__ = 'validation_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    identifier_type = db.Column(db.String(50), nullable=False)  # 'STATION_CODE' or 'INCIDENT_CODE'
    identifier_value = db.Column(db.String(50), nullable=False)
    dfa_result = db.Column(db.Boolean, nullable=False)
    regex_result = db.Column(db.Boolean, nullable=False)
    agreed = db.Column(db.Boolean, nullable=False)
    details = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'identifier_type': self.identifier_type,
            'identifier_value': self.identifier_value,
            'dfa_result': self.dfa_result,
            'regex_result': self.regex_result,
            'agreed': self.agreed,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
