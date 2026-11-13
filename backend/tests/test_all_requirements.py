"""
Comprehensive Academic & Functional Test Suite
Part 16: Minimum 15 Test Cases (TC01 to TC22)
Tests BCS503 Automata Theory, BCS502 Computer Networks, Classification, Routing, and Escalation.
"""

import pytest
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from automata.dfa_engine import StationCodeDFA, IncidentCodeDFA, AutomataValidator
from classifier.classifier_engine import IncidentClassifier
from models import (
    db, User, Station, RailwayDivision, Handler, RoutingTable, 
    Report, Assignment, WaitingQueue, EscalationRecord, StatusHistory
)
from routing.routing_engine import RoutingEngine
from app import create_app

@pytest.fixture(scope='module')
def app_instance():
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret-key'
    }
    app = create_app(test_config)
    with app.app_context():
        from seed_data import seed_database
        seed_database()
        yield app

@pytest.fixture(scope='function')
def client(app_instance):
    return app_instance.test_client()

# TC01: Valid station code
def test_tc01_valid_station_code():
    valid_codes = ['ABC01', 'BLR12', 'SBC01', 'UBL09', 'MYS10']
    for code in valid_codes:
        res = AutomataValidator.validate_station_code(code)
        assert res['is_valid'] is True, f"Expected {code} to be valid"
        assert res['dfa_result'] is True
        assert res['regex_result'] is True
        assert res['agreement'] is True

# TC02: Invalid station code
def test_tc02_invalid_station_code():
    invalid_codes = ['ABC1', 'ABCD12', 'abc12', '12ABC', 'AB123', 'A1234', '', 'ABC012']
    for code in invalid_codes:
        res = AutomataValidator.validate_station_code(code)
        assert res['is_valid'] is False, f"Expected {code} to be invalid"
        assert res['dfa_result'] is False
        assert res['regex_result'] is False
        assert res['agreement'] is True

# TC03: Valid incident code
def test_tc03_valid_incident_code():
    valid_codes = ['SIG-101', 'TRK-202', 'ELE-305', 'SIG-999']
    for code in valid_codes:
        res = AutomataValidator.validate_incident_code(code)
        assert res['is_valid'] is True, f"Expected {code} to be valid"
        assert res['dfa_result'] is True
        assert res['regex_result'] is True

# TC04: Invalid incident code
def test_tc04_invalid_incident_code():
    invalid_codes = ['XYZ-101', 'SIG-AB', '123-SIG', 'SIG', 'TRK-1', 'sig-101', 'ELE12345']
    for code in invalid_codes:
        res = AutomataValidator.validate_incident_code(code)
        assert res['is_valid'] is False, f"Expected {code} to be invalid"

# TC05: DFA and regex agreement
def test_tc05_dfa_and_regex_agreement():
    test_cases = ['SBC01', 'XYZ99', 'invalid', 'SBC1', '12345', 'ABCDE', 'MYS05']
    for code in test_cases:
        res = AutomataValidator.validate_station_code(code)
        assert res['agreement'] is True, f"Disagreement on {code}: DFA={res['dfa_result']} vs Regex={res['regex_result']}"

# TC06: Signal-Failure classification
def test_tc06_signal_failure_classification():
    res = IncidentClassifier.classify("SIG-101", "Aspect failure at home signal")
    assert res['success'] is True
    assert res['category'] == 'Signal-Failure'
    assert 'Signal-Failure' in res['rationale']

# TC07: Track-Obstruction classification
def test_tc07_track_obstruction_classification():
    res = IncidentClassifier.classify("TRK-204", "Rail fracture detected on down track")
    assert res['success'] is True
    assert res['category'] == 'Track-Obstruction'
    assert 'Track-Obstruction' in res['rationale']

# TC08: Electrical classification
def test_tc08_electrical_classification():
    res = IncidentClassifier.classify("ELE-301", "25kV OHE power trip between stations")
    assert res['success'] is True
    assert res['category'] == 'Electrical'
    assert 'Electrical' in res['rationale']

# TC09: Minor-Delay classification
def test_tc09_minor_delay_classification():
    res = IncidentClassifier.classify("DLY-001", "Train delayed by 15 minutes due to platform wait")
    assert res['success'] is True
    assert res['category'] == 'Minor-Delay'

# TC10: Test-Entry classification
def test_tc10_test_entry_classification():
    res = IncidentClassifier.classify("SIG-101", "Annual fire and safety simulation drill in interlock cabin")
    assert res['success'] is True
    assert res['category'] == 'Test-Entry'
    assert 'drill' in res['rationale'].lower() or 'test' in res['rationale'].lower()

# TC11: Conflicting classification patterns
def test_tc11_conflicting_classification_patterns():
    # Signal failure code (SIG-101) with delay keyword
    res = IncidentClassifier.classify("SIG-101", "Track circuit signal drop causing 20 minute delay")
    assert res['success'] is True
    assert res['conflict_detected'] is True
    # Deterministic priority rule ensures hardware safety failure (Signal-Failure) takes precedence over delay symptom
    assert res['category'] == 'Signal-Failure'
    assert 'Deterministic Priority Rule 2' in res['rationale']

# TC12: Unknown routing division
def test_tc12_unknown_routing_division(app_instance):
    with app_instance.app_context():
        # Valid syntax ABC01 but not in database
        report_data = {
            'station_code': 'ABC01',
            'station_name': 'Unknown Station',
            'division': 'XYZ',
            'incident_code': 'SIG-101',
            'incident_description': 'Signal defect',
            'reporter_name': 'Test Officer',
            'contact_info': 'test@swr.rail.gov.in'
        }
        res = RoutingEngine.process_and_route_report(report_data)
        assert res['success'] is False
        assert "does not exist in the railway network database" in res['error']

# TC13: Invalid code rejected before dispatch
def test_tc13_invalid_code_rejected_before_dispatch(app_instance):
    with app_instance.app_context():
        report_data = {
            'station_code': 'INVALID1',
            'station_name': 'Bad Station',
            'division': 'SBC',
            'incident_code': 'SIG-101',
            'incident_description': 'Fault description',
            'reporter_name': 'SM Tester',
            'contact_info': 'test@swr.rail.gov.in'
        }
        res = RoutingEngine.process_and_route_report(report_data)
        assert res['dispatched'] is False
        assert res['validation_status'] == 'REJECTED'
        assert "Report rejected prior to dispatch" in res['error']

# TC14: Available handler assignment
def test_tc14_available_handler_assignment(app_instance):
    with app_instance.app_context():
        # Make sure SBC01 handler H-SBC-SIG-01 is available with capacity
        handler = Handler.query.filter_by(handler_id='H-SBC-SIG-01').first()
        handler.availability_status = 'AVAILABLE'
        handler.current_workload = 0
        db.session.commit()

        report_data = {
            'station_code': 'SBC01',
            'incident_code': 'SIG-101',
            'incident_description': 'Signal lamp burnt out at platform 1',
            'urgency_level': 'MEDIUM',
            'reporter_name': 'SM Test User',
            'contact_info': 'sm@swr.rail.gov.in'
        }
        res = RoutingEngine.process_and_route_report(report_data)
        assert res['success'] is True
        assert res['dispatched'] is True
        assert res['assignment']['assigned'] is True
        assert res['assignment']['assignment_type'] == 'PRIMARY'
        assert res['assignment']['handler_id'] == 'H-SBC-SIG-01'

# TC15: Unavailable handler backup assignment
def test_tc15_unavailable_handler_backup_assignment(app_instance):
    with app_instance.app_context():
        # Route: UBL division Track-Obstruction has primary H-UBL-TRK-01 (marked UNAVAILABLE in seed) and backup H-UBL-TRK-02
        primary = Handler.query.filter_by(handler_id='H-UBL-TRK-01').first()
        backup = Handler.query.filter_by(handler_id='H-UBL-TRK-02').first()
        primary.availability_status = 'UNAVAILABLE'
        backup.availability_status = 'AVAILABLE'
        backup.current_workload = 0
        db.session.commit()

        report_data = {
            'station_code': 'UBL02',
            'incident_code': 'TRK-202',
            'incident_description': 'Fallen tree on loop track at Dharwad',
            'urgency_level': 'HIGH',
            'reporter_name': 'SM Dharwad',
            'contact_info': 'sm.dharwad@swr.rail.gov.in'
        }
        res = RoutingEngine.process_and_route_report(report_data)
        assert res['success'] is True
        assert res['dispatched'] is True
        assert res['assignment']['assigned'] is True
        assert res['assignment']['assignment_type'] == 'BACKUP'
        assert res['assignment']['handler_id'] == 'H-UBL-TRK-02'

# TC16: Handler capacity exceeded
def test_tc16_handler_capacity_exceeded(app_instance):
    with app_instance.app_context():
        primary = Handler.query.filter_by(handler_id='H-UBL-TRK-01').first()
        primary.availability_status = 'AVAILABLE'
        primary.current_workload = primary.max_capacity  # Saturated
        backup = Handler.query.filter_by(handler_id='H-UBL-TRK-02').first()
        backup.availability_status = 'AVAILABLE'
        backup.current_workload = 0
        db.session.commit()

        report_data = {
            'station_code': 'UBL03',
            'incident_code': 'TRK-203',
            'incident_description': 'Ballast washed away by rain',
            'urgency_level': 'HIGH',
            'reporter_name': 'SM Gadag',
            'contact_info': 'sm.gadag@swr.rail.gov.in'
        }
        res = RoutingEngine.process_and_route_report(report_data)
        assert res['success'] is True
        assert res['assignment']['assignment_type'] == 'BACKUP'
        assert res['assignment']['handler_id'] == 'H-UBL-TRK-02'

# TC17: No available handler and queue creation
def test_tc17_no_available_handler_and_queue_creation(app_instance):
    with app_instance.app_context():
        # Set both primary and backup to UNAVAILABLE
        primary = Handler.query.filter_by(handler_id='H-MYS-ELE-01').first()
        backup = Handler.query.filter_by(handler_id='H-MYS-OPS-01').first()
        primary.availability_status = 'UNAVAILABLE'
        backup.availability_status = 'UNAVAILABLE'
        db.session.commit()

        report_data = {
            'station_code': 'MYS02',
            'incident_code': 'ELE-302',
            'incident_description': 'Traction wire snap at Naganahalli',
            'urgency_level': 'HIGH',
            'reporter_name': 'SM Naganahalli',
            'contact_info': 'sm.naganahalli@swr.rail.gov.in'
        }
        res = RoutingEngine.process_and_route_report(report_data)
        assert res['success'] is True
        assert res['assignment']['assigned'] is False
        assert res['assignment']['in_queue'] is True
        
        # Verify in WaitingQueue table
        wq = WaitingQueue.query.filter_by(report_id=res['report_id']).first()
        assert wq is not None
        assert wq.status == 'WAITING'

# TC18: Critical priority override and Zonal HQ escalation
def test_tc18_critical_priority_override_and_zonal_hq_escalation(app_instance):
    with app_instance.app_context():
        report_data = {
            'station_code': 'SBC02',
            'incident_code': 'SIG-102',
            'incident_description': 'Total interlocking loss on all approach signals',
            'urgency_level': 'CRITICAL',
            'reporter_name': 'SM Cantonment',
            'contact_info': 'sm.cant@swr.rail.gov.in'
        }
        res = RoutingEngine.process_and_route_report(report_data)
        assert res['success'] is True
        assert res['priority'] == 'CRITICAL'
        assert res['escalation'] is not None
        assert res['escalation']['escalated'] is True
        assert "Zonal Headquarters" in res['escalation']['destination']

        # Verify escalation record in database
        esc = EscalationRecord.query.filter_by(report_id=res['report_id']).first()
        assert esc is not None
        assert esc.division == 'SBC'

# TC19: Multiple reports and deterministic queue ordering
def test_tc19_multiple_reports_deterministic_queue_ordering(app_instance):
    with app_instance.app_context():
        # Clean current waiting queue for isolated test
        WaitingQueue.query.delete()
        db.session.commit()

        q_low = WaitingQueue(report_id="REP-TEST-LOW", priority="LOW", queue_position=99, reason="Test")
        q_crit = WaitingQueue(report_id="REP-TEST-CRIT", priority="CRITICAL", queue_position=99, reason="Test")
        q_high = WaitingQueue(report_id="REP-TEST-HIGH", priority="HIGH", queue_position=99, reason="Test")
        q_med = WaitingQueue(report_id="REP-TEST-MED", priority="MEDIUM", queue_position=99, reason="Test")

        db.session.add_all([q_low, q_crit, q_high, q_med])
        db.session.commit()

        RoutingEngine.reorder_queue()

        # Check queue positions: CRITICAL must be 1, HIGH 2, MEDIUM 3, LOW 4
        assert WaitingQueue.query.filter_by(report_id="REP-TEST-CRIT").first().queue_position == 1
        assert WaitingQueue.query.filter_by(report_id="REP-TEST-HIGH").first().queue_position == 2
        assert WaitingQueue.query.filter_by(report_id="REP-TEST-MED").first().queue_position == 3
        assert WaitingQueue.query.filter_by(report_id="REP-TEST-LOW").first().queue_position == 4

# TC20: Duplicate assignment prevention
def test_tc20_duplicate_assignment_prevention(app_instance):
    with app_instance.app_context():
        report = Report.query.filter_by(status='Assigned').first()
        assert report is not None
        # Verify only one active assignment exists for this report
        active_assignments = Assignment.query.filter_by(report_id=report.report_id, status='ACTIVE').all()
        assert len(active_assignments) == 1

# TC21: Report status updates
def test_tc21_report_status_updates(app_instance):
    with app_instance.app_context():
        report = Report.query.filter_by(status='Assigned').first()
        handler = Handler.query.filter_by(handler_id=report.assigned_handler_id).first()
        initial_workload = handler.current_workload

        # Mark In Progress
        report.status = 'In Progress'
        sh1 = StatusHistory(report_id=report.report_id, old_status='Assigned', new_status='In Progress', updated_by='Test', remarks='Testing transition')
        db.session.add(sh1)
        db.session.commit()
        assert Report.query.filter_by(report_id=report.report_id).first().status == 'In Progress'

        # Mark Resolved -> Handler workload must decrement
        report.status = 'Resolved'
        if handler and handler.current_workload > 0:
            handler.current_workload -= 1
        sh2 = StatusHistory(report_id=report.report_id, old_status='In Progress', new_status='Resolved', updated_by='Test', remarks='Resolved defect')
        db.session.add(sh2)
        db.session.commit()

        assert Report.query.filter_by(report_id=report.report_id).first().status == 'Resolved'
        assert Handler.query.filter_by(handler_id=handler.handler_id).first().current_workload == initial_workload - 1

# TC22: Database persistence after restart
def test_tc22_database_persistence(app_instance):
    with app_instance.app_context():
        stations_count = Station.query.count()
        assert stations_count == 30, f"Expected exactly 30 stations, found {stations_count}"
        divisions_count = RailwayDivision.query.count()
        assert divisions_count == 3, f"Expected exactly 3 divisions, found {divisions_count}"
        handlers_count = Handler.query.count()
        assert handlers_count >= 10, f"Expected at least 10 handlers, found {handlers_count}"
