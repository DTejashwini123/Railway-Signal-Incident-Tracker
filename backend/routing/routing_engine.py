"""
BCS502 – Computer Networks
Routing, Dispatch, and Escalation Engine

Implements:
1. 12-Step Network Routing Algorithm
2. SQLite Routing Table Lookup
3. Handler Availability & Capacity Enforcement
4. Primary & Backup Handler Fallback
5. Deterministic Priority Queue
6. Automatic Critical Incident Zonal Headquarters Escalation (Mandatory Tier 2)
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from models import (
    db, Report, RoutingTable, Handler, Assignment, WaitingQueue, 
    EscalationRecord, RoutingLog, Station, RailwayDivision
)
from automata.dfa_engine import AutomataValidator
from classifier.classifier_engine import IncidentClassifier

# Priority ranking for deterministic queue sorting
PRIORITY_WEIGHTS = {
    'CRITICAL': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

class RoutingEngine:

    @classmethod
    def reorder_queue(cls):
        """
        Maintains deterministic queue ordering:
        Order by:
        1. Priority (CRITICAL=1, HIGH=2, MEDIUM=3, LOW=4)
        2. Submission / Entry Timestamp (FIFO tie-breaker)
        """
        all_waiting = WaitingQueue.query.filter_by(status='WAITING').all()
        
        # Sort in memory using deterministic tuple: (priority_weight, entered_at)
        sorted_queue = sorted(
            all_waiting, 
            key=lambda w: (PRIORITY_WEIGHTS.get(w.priority, 99), w.entered_at)
        )
        
        for idx, item in enumerate(sorted_queue, start=1):
            item.queue_position = idx
            
        db.session.commit()

    @classmethod
    def process_and_route_report(
        cls, 
        report_data: Dict[str, Any], 
        username: str = "system"
    ) -> Dict[str, Any]:
        """
        Executes the full end-to-end 12-step validation, classification, and routing workflow.
        """
        station_code = report_data.get('station_code', '').strip().upper()
        incident_code = report_data.get('incident_code', '').strip().upper()
        description = report_data.get('incident_description', '').strip()
        urgency = report_data.get('urgency_level', 'MEDIUM').strip().upper()
        reporter_name = report_data.get('reporter_name', '').strip()
        contact_info = report_data.get('contact_info', '').strip()
        additional_remarks = report_data.get('additional_remarks', '')

        # STEP 1 & 2: Accept report and validate structured identifiers (DFA + Regex)
        station_val = AutomataValidator.validate_station_code(station_code)
        incident_val = AutomataValidator.validate_incident_code(incident_code)

        # STEP 3: Reject invalid reports before dispatch (Never dispatch invalid reports!)
        is_station_valid = station_val['is_valid']
        is_incident_valid = incident_val['is_valid']

        if not (is_station_valid and is_incident_valid):
            failure_reasons = []
            if not is_station_valid:
                failure_reasons.append(f"Station Code '{station_code}': {station_val['validation_reason']}")
            if not is_incident_valid:
                failure_reasons.append(f"Incident Code '{incident_code}': {incident_val['validation_reason']}")

            combined_reason = " | ".join(failure_reasons)

            # Persist rejected report attempt for audit trail if needed, but do not dispatch
            report_id = f"REP-REJ-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
            rejected_report = Report(
                report_id=report_id,
                reporter_name=reporter_name or "Anonymous",
                station_code=station_code,
                station_name=report_data.get('station_name', 'Unknown Station'),
                division=report_data.get('division', 'Unknown Division'),
                contact_info=contact_info,
                incident_code=incident_code,
                incident_description=description,
                urgency_level=urgency,
                additional_remarks=additional_remarks,
                validation_status='REJECTED',
                dfa_result=station_val['dfa_result'] and incident_val['dfa_result'],
                regex_result=station_val['regex_result'] and incident_val['regex_result'],
                validation_reason=combined_reason,
                category='Unclassified',
                priority=urgency if urgency in PRIORITY_WEIGHTS else 'LOW',
                status='Pending',
                escalation_status='NONE'
            )
            db.session.add(rejected_report)
            db.session.commit()

            return {
                'success': False,
                'dispatched': False,
                'report_id': report_id,
                'validation_status': 'REJECTED',
                'station_validation': station_val,
                'incident_validation': incident_val,
                'error': f"Report rejected prior to dispatch: {combined_reason}"
            }

        # STEP 4: Extract routing key only from validated report
        station_record = Station.query.filter_by(station_code=station_code).first()
        if not station_record:
            return {
                'success': False,
                'dispatched': False,
                'error': f"Station code '{station_code}' has valid syntax but does not exist in the railway network database."
            }

        division_code = station_record.division_code
        station_name = station_record.station_name

        # STEP 5 & 6: Incident Classification (Part 4)
        classification = IncidentClassifier.classify(incident_code, description)
        if not classification['success']:
            return {
                'success': False,
                'dispatched': False,
                'error': classification['error'],
                'station_validation': station_val,
                'incident_validation': incident_val
            }

        category = classification['category']

        # Determine Priority: Urgency level or Critical Override
        # If urgency is CRITICAL, or if high hazard, priority becomes CRITICAL
        effective_priority = urgency if urgency in PRIORITY_WEIGHTS else 'MEDIUM'
        if category in ['Track-Obstruction', 'Signal-Failure'] and urgency == 'CRITICAL':
            effective_priority = 'CRITICAL'

        # Generate Unique Report ID
        report_id = f"REP-{division_code}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

        # Create Report Record in SQLite
        new_report = Report(
            report_id=report_id,
            reporter_name=reporter_name,
            station_code=station_code,
            station_name=station_name,
            division=division_code,
            contact_info=contact_info,
            incident_code=incident_code,
            incident_description=description,
            urgency_level=urgency,
            additional_remarks=additional_remarks,
            validation_status='VALID',
            dfa_result=True,
            regex_result=True,
            validation_reason=f"Station '{station_code}' and Incident '{incident_code}' verified by DFA & Regex.",
            category=category,
            priority=effective_priority,
            status='Pending',
            assigned_handler_id=None,
            escalation_status='NONE'
        )
        db.session.add(new_report)
        db.session.flush()

        # STEP 7: Lookup SQLite Routing Table for this station/division & category
        routing_entry = RoutingTable.query.filter_by(
            division=division_code,
            incident_category=category
        ).first()

        if not routing_entry:
            # Fallback to general category routing for division
            routing_entry = RoutingTable.query.filter_by(
                division=division_code
            ).first()

        routing_explanation = []
        assignment_result = None
        assigned_handler = None
        assignment_type = None

        if routing_entry:
            primary_id = routing_entry.primary_handler_id
            backup_id = routing_entry.backup_handler_id

            primary_handler = Handler.query.filter_by(handler_id=primary_id, is_active=True).first() if primary_id else None
            backup_handler = Handler.query.filter_by(handler_id=backup_id, is_active=True).first() if backup_id else None

            # STEP 8, 9, 10: Check Primary Handler Eligibility (Availability & Capacity)
            if primary_handler and primary_handler.availability_status == 'AVAILABLE' and primary_handler.current_workload < primary_handler.max_capacity:
                assigned_handler = primary_handler
                assignment_type = 'PRIMARY'
                routing_explanation.append(
                    f"Assigned to Primary Handler {primary_handler.name} ({primary_handler.handler_id}) "
                    f"in {primary_handler.department}. Status: AVAILABLE, "
                    f"Workload: {primary_handler.current_workload + 1}/{primary_handler.max_capacity}."
                )
            
            # STEP 11: Primary unavailable or at capacity -> Try Backup Handler
            elif backup_handler and backup_handler.availability_status == 'AVAILABLE' and backup_handler.current_workload < backup_handler.max_capacity:
                assigned_handler = backup_handler
                assignment_type = 'BACKUP'
                primary_reason = (
                    f"Primary handler {primary_id} is " + 
                    ("UNAVAILABLE" if primary_handler and primary_handler.availability_status != 'AVAILABLE' else "AT MAX CAPACITY")
                ) if primary_handler else "Primary handler not configured"
                
                routing_explanation.append(
                    f"Primary Handler unavailable ({primary_reason}). Fallback to Backup Handler "
                    f"{backup_handler.name} ({backup_handler.handler_id}) in {backup_handler.department}. "
                    f"Status: AVAILABLE, Workload: {backup_handler.current_workload + 1}/{backup_handler.max_capacity}."
                )
            else:
                # STEP 12: Neither primary nor backup available -> Route to Deterministic Waiting Queue
                reason_detail = []
                if primary_handler:
                    reason_detail.append(f"Primary {primary_id} ({primary_handler.availability_status}, {primary_handler.current_workload}/{primary_handler.max_capacity})")
                if backup_handler:
                    reason_detail.append(f"Backup {backup_id} ({backup_handler.availability_status}, {backup_handler.current_workload}/{backup_handler.max_capacity})")
                
                routing_explanation.append(
                    f"No eligible handlers available. Both primary and backup handlers are unavailable or saturated: "
                    f"{'; '.join(reason_detail)}. Enqueued in deterministic Waiting Queue."
                )

        if assigned_handler:
            # Assign report to handler
            assigned_handler.current_workload += 1
            new_report.assigned_handler_id = assigned_handler.handler_id
            new_report.status = 'Assigned'

            assignment = Assignment(
                report_id=report_id,
                handler_id=assigned_handler.handler_id,
                assignment_type=assignment_type,
                status='ACTIVE',
                rationale="; ".join(routing_explanation)
            )
            db.session.add(assignment)
            assignment_result = {
                'assigned': True,
                'handler_id': assigned_handler.handler_id,
                'handler_name': assigned_handler.name,
                'assignment_type': assignment_type,
                'workload': f"{assigned_handler.current_workload}/{assigned_handler.max_capacity}"
            }
        else:
            # Add to Waiting Queue
            queue_entry = WaitingQueue(
                report_id=report_id,
                priority=effective_priority,
                queue_position=999,  # Will be dynamically sorted
                status='WAITING',
                reason="; ".join(routing_explanation)
            )
            db.session.add(queue_entry)
            assignment_result = {
                'assigned': False,
                'in_queue': True,
                'priority': effective_priority,
                'reason': "; ".join(routing_explanation)
            }

        # PART 7: MANDATORY CRITICAL INCIDENT ZONAL HEADQUARTERS ESCALATION
        # Critical-class incidents must automatically escalate to Zonal Headquarters!
        escalation_result = None
        if effective_priority == 'CRITICAL':
            new_report.escalation_status = 'ESCALATED_ZONAL_HQ'
            
            escalation = EscalationRecord(
                report_id=report_id,
                division=division_code,
                escalated_to=f"Zonal Headquarters ({routing_entry.escalation_destination if routing_entry else 'SWR Rail Bhavan Central'})",
                reason=(
                    f"Mandatory Automatic Escalation: Report '{report_id}' flagged with CRITICAL priority "
                    f"in category '{category}' at station '{station_name}' ({station_code}). "
                    f"Second-tier emergency protocol invoked."
                ),
                status='ESCALATED_ACTIVE'
            )
            db.session.add(escalation)
            escalation_result = {
                'escalated': True,
                'destination': escalation.escalated_to,
                'reason': escalation.reason
            }
            routing_explanation.append(f"MANDATORY ESCALATION: Auto-escalated to Zonal Headquarters ({escalation.escalated_to}).")

        # Record in Routing Logs
        r_log = RoutingLog(
            report_id=report_id,
            action="DISPATCH_ROUTING",
            decision=f"Assigned ({assignment_type})" if assigned_handler else "Enqueued in Waiting Queue",
            explanation=" | ".join(routing_explanation)
        )
        db.session.add(r_log)

        db.session.commit()

        # Re-index queue after commit
        if not assigned_handler:
            cls.reorder_queue()

        return {
            'success': True,
            'dispatched': True,
            'report_id': report_id,
            'station_code': station_code,
            'station_name': station_name,
            'division': division_code,
            'category': category,
            'priority': effective_priority,
            'status': new_report.status,
            'assignment': assignment_result,
            'escalation': escalation_result,
            'explanation': routing_explanation,
            'station_validation': station_val,
            'incident_validation': incident_val,
            'classification': classification
        }
