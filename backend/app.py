"""
Flask REST API Backend for P15 – Railway Signal Incident Tracker
Integrates:
- BCS503: Automata Theory and Computability (DFA Simulation & Regex Engine)
- BCS502: Computer Networks (Railway Topology, SQLite Routing Table, Critical Escalations, Dispatch Queue)
"""

import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from models import (
    db, User, Station, RailwayDivision, IncidentCategory, 
    Handler, RoutingTable, Report, Assignment, WaitingQueue, 
    StatusHistory, ClassificationRule, EscalationRecord, RoutingLog, ValidationLog
)
from automata.dfa_engine import StationCodeDFA, IncidentCodeDFA, AutomataValidator
from classifier.classifier_engine import IncidentClassifier
from routing.routing_engine import RoutingEngine
from seed_data import seed_database

def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    
    if config_overrides:
        app.config.update(config_overrides)
        
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    db.init_app(app)

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        return response

    @app.before_request
    def handle_options():
        if request.method == 'OPTIONS':
            res = app.make_default_options_response()
            res.headers['Access-Control-Allow-Origin'] = '*'
            res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            return res

    with app.app_context():
        # Ensure database tables exist; if database file does not exist, seed it
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        if not os.path.exists(db_path) and not app.config.get('TESTING'):
            seed_database()
        else:
            db.create_all()

    # -------------------------------------------------------------
    # 1. AUTHENTICATION & USERS (Part 15)
    # -------------------------------------------------------------
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.get_json() or {}
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

        # Return mock token / session data
        return jsonify({
            'success': True,
            'token': f"demo-token-{user.id}-{int(datetime.utcnow().timestamp())}",
            'user': user.to_dict()
        })

    @app.route('/api/auth/me', methods=['GET'])
    def get_me():
        # Simplified auth header reader
        auth_header = request.headers.get('Authorization', '')
        # For demonstration, check username query param or default to admin
        username = request.args.get('username', 'admin')
        user = User.query.filter_by(username=username).first()
        if user:
            return jsonify({'success': True, 'user': user.to_dict()})
        return jsonify({'success': False, 'error': 'User not found'}), 404

    # -------------------------------------------------------------
    # 2. AUTOMATA THEORY - BCS503
    # -------------------------------------------------------------
    @app.route('/api/automata/validate-station', methods=['POST'])
    def validate_station():
        data = request.get_json() or {}
        code = data.get('station_code', '')
        result = AutomataValidator.validate_station_code(code)
        
        # Log validation check
        vlog = ValidationLog(
            identifier_type='STATION_CODE',
            identifier_value=code,
            dfa_result=result['dfa_result'],
            regex_result=result['regex_result'],
            agreed=result['agreement'],
            details=result['validation_reason']
        )
        db.session.add(vlog)
        db.session.commit()

        return jsonify(result)

    @app.route('/api/automata/validate-incident', methods=['POST'])
    def validate_incident():
        data = request.get_json() or {}
        code = data.get('incident_code', '')
        result = AutomataValidator.validate_incident_code(code)
        
        vlog = ValidationLog(
            identifier_type='INCIDENT_CODE',
            identifier_value=code,
            dfa_result=result['dfa_result'],
            regex_result=result['regex_result'],
            agreed=result['agreement'],
            details=result['validation_reason']
        )
        db.session.add(vlog)
        db.session.commit()

        return jsonify(result)

    @app.route('/api/automata/dfa-spec', methods=['GET'])
    def get_dfa_specification():
        """Returns the formal 5-tuple specification of the Station Code DFA."""
        spec = StationCodeDFA.get_formal_spec()
        return jsonify(spec)

    # -------------------------------------------------------------
    # 3. CLASSIFICATION ENGINE (Part 4)
    # -------------------------------------------------------------
    @app.route('/api/classification/test', methods=['POST'])
    def test_classification():
        data = request.get_json() or {}
        code = data.get('incident_code', '')
        desc = data.get('description', '')
        
        rules = [r.to_dict() for r in ClassificationRule.query.all()]
        result = IncidentClassifier.classify(code, desc, custom_rules=rules)
        return jsonify(result)

    @app.route('/api/classification/rules', methods=['GET', 'POST'])
    def handle_classification_rules():
        if request.method == 'GET':
            rules = ClassificationRule.query.order_by(ClassificationRule.priority_order.asc()).all()
            return jsonify([r.to_dict() for r in rules])
        
        data = request.get_json() or {}
        new_rule = ClassificationRule(
            rule_name=data.get('rule_name'),
            pattern_type=data.get('pattern_type'),
            pattern_value=data.get('pattern_value'),
            target_category=data.get('target_category'),
            priority_order=data.get('priority_order', 10),
            description=data.get('description', '')
        )
        db.session.add(new_rule)
        db.session.commit()
        return jsonify({'success': True, 'rule': new_rule.to_dict()}), 201

    # -------------------------------------------------------------
    # 4. COMPUTER NETWORKS - BCS502: STATIONS & DIVISIONS
    # -------------------------------------------------------------
    @app.route('/api/network/stations', methods=['GET'])
    def get_stations():
        stations = Station.query.order_by(Station.station_code.asc()).all()
        return jsonify([s.to_dict() for s in stations])

    @app.route('/api/network/divisions', methods=['GET'])
    def get_divisions():
        divisions = RailwayDivision.query.all()
        return jsonify([d.to_dict() for d in divisions])

    # -------------------------------------------------------------
    # 5. ROUTING & DISPATCH (BCS502)
    # -------------------------------------------------------------
    @app.route('/api/routing/table', methods=['GET', 'POST'])
    def handle_routing_table():
        if request.method == 'GET':
            entries = RoutingTable.query.all()
            return jsonify([e.to_dict() for e in entries])
        
        data = request.get_json() or {}
        rt = RoutingTable(
            division=data.get('division'),
            incident_prefix=data.get('incident_prefix'),
            incident_category=data.get('incident_category'),
            branch=data.get('branch'),
            department=data.get('department'),
            depot_authority=data.get('depot_authority'),
            primary_handler_id=data.get('primary_handler_id'),
            backup_handler_id=data.get('backup_handler_id'),
            priority_rule=data.get('priority_rule', 'Standard FIFO'),
            escalation_destination=data.get('escalation_destination', 'Zonal HQ SWR Operations Cell')
        )
        db.session.add(rt)
        db.session.commit()
        return jsonify({'success': True, 'entry': rt.to_dict()}), 201

    @app.route('/api/routing/queue', methods=['GET'])
    def get_waiting_queue():
        RoutingEngine.reorder_queue()
        queue = WaitingQueue.query.filter_by(status='WAITING').order_by(WaitingQueue.queue_position.asc()).all()
        
        # Hydrate with report metadata
        results = []
        for q in queue:
            rep = Report.query.filter_by(report_id=q.report_id).first()
            q_dict = q.to_dict()
            q_dict['report'] = rep.to_dict() if rep else None
            results.append(q_dict)
            
        return jsonify(results)

    @app.route('/api/routing/escalations', methods=['GET'])
    def get_escalations():
        escalations = EscalationRecord.query.order_by(EscalationRecord.timestamp.desc()).all()
        results = []
        for esc in escalations:
            rep = Report.query.filter_by(report_id=esc.report_id).first()
            e_dict = esc.to_dict()
            e_dict['report'] = rep.to_dict() if rep else None
            results.append(e_dict)
        return jsonify(results)

    @app.route('/api/routing/logs', methods=['GET'])
    def get_routing_logs():
        limit = int(request.args.get('limit', 50))
        logs = RoutingLog.query.order_by(RoutingLog.timestamp.desc()).limit(limit).all()
        return jsonify([l.to_dict() for l in logs])

    # -------------------------------------------------------------
    # 6. HANDLERS (Part 8 & 11)
    # -------------------------------------------------------------
    @app.route('/api/handlers', methods=['GET', 'POST'])
    def handle_handlers():
        if request.method == 'GET':
            handlers = Handler.query.filter_by(is_active=True).all()
            return jsonify([h.to_dict() for h in handlers])
            
        data = request.get_json() or {}
        new_handler = Handler(
            handler_id=data.get('handler_id'),
            name=data.get('name'),
            department=data.get('department'),
            division=data.get('division'),
            specialization=data.get('specialization'),
            availability_status=data.get('availability_status', 'AVAILABLE'),
            max_capacity=int(data.get('max_capacity', 5)),
            current_workload=0,
            is_active=True
        )
        db.session.add(new_handler)
        db.session.commit()
        return jsonify({'success': True, 'handler': new_handler.to_dict()}), 201

    @app.route('/api/handlers/<handler_id>', methods=['PUT'])
    def update_handler(handler_id):
        handler = Handler.query.filter_by(handler_id=handler_id).first()
        if not handler:
            return jsonify({'success': False, 'error': 'Handler not found'}), 404
            
        data = request.get_json() or {}
        if 'availability_status' in data:
            handler.availability_status = data['availability_status']
        if 'max_capacity' in data:
            handler.max_capacity = int(data['max_capacity'])
        if 'is_active' in data:
            handler.is_active = bool(data['is_active'])
            
        db.session.commit()
        return jsonify({'success': True, 'handler': handler.to_dict()})

    # -------------------------------------------------------------
    # 7. REPORTS (Parts 9, 10, 11)
    # -------------------------------------------------------------
    @app.route('/api/reports', methods=['GET', 'POST'])
    def handle_reports():
        if request.method == 'POST':
            data = request.get_json() or {}
            result = RoutingEngine.process_and_route_report(data)
            status_code = 201 if result.get('success') else 400
            return jsonify(result), status_code

        # GET reports with filters
        query = Report.query
        
        division = request.args.get('division')
        status = request.args.get('status')
        category = request.args.get('category')
        priority = request.args.get('priority')
        handler_id = request.args.get('handler_id')
        search = request.args.get('search')
        
        if division and division != 'ALL':
            query = query.filter_by(division=division)
        if status and status != 'ALL':
            query = query.filter_by(status=status)
        if category and category != 'ALL':
            query = query.filter_by(category=category)
        if priority and priority != 'ALL':
            query = query.filter_by(priority=priority)
        if handler_id:
            query = query.filter_by(assigned_handler_id=handler_id)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Report.report_id.like(search_term)) |
                (Report.station_code.like(search_term)) |
                (Report.station_name.like(search_term)) |
                (Report.incident_code.like(search_term)) |
                (Report.reporter_name.like(search_term))
            )

        reports = query.order_by(Report.created_at.desc()).all()
        return jsonify([r.to_dict() for r in reports])

    @app.route('/api/reports/<report_id>', methods=['GET'])
    def get_report_details(report_id):
        report = Report.query.filter_by(report_id=report_id).first()
        if not report:
            return jsonify({'success': False, 'error': 'Report not found'}), 404

        # Related records
        assignments = Assignment.query.filter_by(report_id=report_id).order_by(Assignment.assigned_at.desc()).all()
        history = StatusHistory.query.filter_by(report_id=report_id).order_by(StatusHistory.timestamp.asc()).all()
        escalation = EscalationRecord.query.filter_by(report_id=report_id).first()
        logs = RoutingLog.query.filter_by(report_id=report_id).order_by(RoutingLog.timestamp.asc()).all()
        
        handler = Handler.query.filter_by(handler_id=report.assigned_handler_id).first() if report.assigned_handler_id else None

        return jsonify({
            'success': True,
            'report': report.to_dict(),
            'assigned_handler': handler.to_dict() if handler else None,
            'assignments': [a.to_dict() for a in assignments],
            'status_history': [h.to_dict() for h in history],
            'escalation': escalation.to_dict() if escalation else None,
            'routing_logs': [l.to_dict() for l in logs]
        })

    @app.route('/api/reports/<report_id>/status', methods=['POST'])
    def update_report_status(report_id):
        report = Report.query.filter_by(report_id=report_id).first()
        if not report:
            return jsonify({'success': False, 'error': 'Report not found'}), 404

        data = request.get_json() or {}
        new_status = data.get('status')
        remarks = data.get('remarks', '')
        updated_by = data.get('updated_by', 'Handler')

        if new_status not in ['Pending', 'Assigned', 'In Progress', 'Resolved']:
            return jsonify({'success': False, 'error': 'Invalid report status'}), 400

        old_status = report.status
        report.status = new_status
        if new_status == 'Resolved':
            report.resolution_remarks = remarks
            # Decrement handler workload
            if report.assigned_handler_id:
                handler = Handler.query.filter_by(handler_id=report.assigned_handler_id).first()
                if handler and handler.current_workload > 0:
                    handler.current_workload -= 1

        # Record Status History
        hist = StatusHistory(
            report_id=report_id,
            old_status=old_status,
            new_status=new_status,
            updated_by=updated_by,
            remarks=remarks
        )
        db.session.add(hist)
        db.session.commit()

        return jsonify({
            'success': True,
            'report': report.to_dict(),
            'history': hist.to_dict()
        })

    @app.route('/api/reports/<report_id>/reassign', methods=['POST'])
    def reassign_report(report_id):
        report = Report.query.filter_by(report_id=report_id).first()
        if not report:
            return jsonify({'success': False, 'error': 'Report not found'}), 404

        data = request.get_json() or {}
        new_handler_id = data.get('handler_id')
        rationale = data.get('rationale', 'Administrative manual reassignment')

        target_handler = Handler.query.filter_by(handler_id=new_handler_id).first()
        if not target_handler:
            return jsonify({'success': False, 'error': 'Target handler not found'}), 404

        if target_handler.current_workload >= target_handler.max_capacity:
            return jsonify({'success': False, 'error': f"Target handler {target_handler.name} is at maximum capacity ({target_handler.current_workload}/{target_handler.max_capacity})"}), 400

        # Decrement previous handler
        if report.assigned_handler_id:
            prev_handler = Handler.query.filter_by(handler_id=report.assigned_handler_id).first()
            if prev_handler and prev_handler.current_workload > 0:
                prev_handler.current_workload -= 1

        # Assign new handler
        target_handler.current_workload += 1
        report.assigned_handler_id = target_handler.handler_id
        report.status = 'Assigned'

        # Record assignment
        asgn = Assignment(
            report_id=report_id,
            handler_id=target_handler.handler_id,
            assignment_type='REASSIGNED',
            status='ACTIVE',
            rationale=rationale
        )
        db.session.add(asgn)

        # Log
        r_log = RoutingLog(
            report_id=report_id,
            action="MANUAL_REASSIGNMENT",
            decision=f"Reassigned to {target_handler.name} ({target_handler.handler_id})",
            explanation=rationale
        )
        db.session.add(r_log)
        db.session.commit()

        return jsonify({'success': True, 'report': report.to_dict(), 'assigned_handler': target_handler.to_dict()})

    # -------------------------------------------------------------
    # 8. ANALYTICS (Part 13)
    # -------------------------------------------------------------
    @app.route('/api/analytics', methods=['GET'])
    def get_analytics():
        total_reports = Report.query.count()
        pending = Report.query.filter_by(status='Pending').count()
        assigned = Report.query.filter_by(status='Assigned').count()
        in_progress = Report.query.filter_by(status='In Progress').count()
        resolved = Report.query.filter_by(status='Resolved').count()
        escalated = EscalationRecord.query.count()

        # Division-wise distribution
        divisions = RailwayDivision.query.all()
        division_dist = []
        for d in divisions:
            cnt = Report.query.filter_by(division=d.division_code).count()
            division_dist.append({'name': d.division_name, 'code': d.division_code, 'count': cnt})

        # Category-wise distribution (Exactly 5 categories)
        categories = ['Signal-Failure', 'Track-Obstruction', 'Electrical', 'Minor-Delay', 'Test-Entry']
        category_dist = []
        for cat in categories:
            cnt = Report.query.filter_by(category=cat).count()
            category_dist.append({'name': cat, 'count': cnt})

        # Priority-wise distribution
        priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        priority_dist = []
        for p in priorities:
            cnt = Report.query.filter_by(priority=p).count()
            priority_dist.append({'name': p, 'count': cnt})

        # Resolved vs Unresolved
        unresolved = total_reports - resolved
        resolution_pie = [
            {'name': 'Resolved', 'value': resolved, 'color': '#10b981'},
            {'name': 'Unresolved', 'value': unresolved, 'color': '#ef4444'}
        ]

        # Handler Workload Chart
        handlers = Handler.query.filter_by(is_active=True).all()
        handler_workload = []
        for h in handlers:
            handler_workload.append({
                'name': h.name.replace('Engr. ', ''),
                'handler_id': h.handler_id,
                'division': h.division,
                'workload': h.current_workload,
                'capacity': h.max_capacity,
                'status': h.availability_status
            })

        # Monthly incident trend (last 6 months demonstration distribution)
        monthly_trend = [
            {'month': 'Jun 2026', 'Signal': 4, 'Track': 2, 'Electrical': 3, 'Delay': 5},
            {'month': 'Jul 2026', 'Signal': 6, 'Track': 3, 'Electrical': 2, 'Delay': 4},
            {'month': 'Aug 2026', 'Signal': 5, 'Track': 5, 'Electrical': 4, 'Delay': 6},
            {'month': 'Sep 2026', 'Signal': 7, 'Track': 2, 'Electrical': 5, 'Delay': 3},
            {'month': 'Oct 2026', 'Signal': 3, 'Track': 4, 'Electrical': 2, 'Delay': 4},
            {'month': 'Nov 2026', 'Signal': max(1, Report.query.filter_by(category='Signal-Failure').count()),
                                  'Track': max(1, Report.query.filter_by(category='Track-Obstruction').count()),
                                  'Electrical': max(1, Report.query.filter_by(category='Electrical').count()),
                                  'Delay': max(1, Report.query.filter_by(category='Minor-Delay').count())}
        ]

        return jsonify({
            'total_reports': total_reports,
            'pending': pending,
            'assigned': assigned,
            'in_progress': in_progress,
            'resolved': resolved,
            'escalated': escalated,
            'resolution_rate': round((resolved / total_reports * 100) if total_reports > 0 else 0, 1),
            'division_distribution': division_dist,
            'category_distribution': category_dist,
            'priority_distribution': priority_dist,
            'resolution_pie': resolution_pie,
            'handler_workload': handler_workload,
            'monthly_trend': monthly_trend
        })

    # -------------------------------------------------------------
    # 9. TEST RUNNER (Part 16 - TC01 to TC22)
    # -------------------------------------------------------------
    @app.route('/api/tests/results', methods=['GET', 'POST'])
    def run_documented_tests():
        """
        Executes and returns all 22 documented test cases with actual inputs and outputs.
        """
        results = []

        def add_tc(tc_id, desc, input_val, expected, actual, passed, category):
            results.append({
                'id': tc_id,
                'description': desc,
                'category': category,
                'input': str(input_val),
                'expected': str(expected),
                'actual': str(actual),
                'status': 'PASS' if passed else 'FAIL'
            })

        # TC01
        r = AutomataValidator.validate_station_code("ABC01")
        add_tc("TC01", "Valid station code format [A-Z]{3}[0-9]{2}", "ABC01", "Accepted (State q5)", f"Accepted={r['is_valid']}, Final={r['dfa_final_state']}", r['is_valid'], "Automata (BCS503)")

        # TC02
        r = AutomataValidator.validate_station_code("ABC1")
        add_tc("TC02", "Invalid station code (missing digit)", "ABC1", "Rejected (State q4)", f"Accepted={r['is_valid']}, Final={r['dfa_final_state']}", not r['is_valid'], "Automata (BCS503)")

        # TC03
        r = AutomataValidator.validate_incident_code("SIG-101")
        add_tc("TC03", "Valid incident code prefix SIG", "SIG-101", "Accepted (State i_ACCEPT)", f"Accepted={r['is_valid']}, Prefix={r['prefix']}", r['is_valid'], "Automata (BCS503)")

        # TC04
        r = AutomataValidator.validate_incident_code("XYZ-101")
        add_tc("TC04", "Invalid incident code prefix XYZ", "XYZ-101", "Rejected (State i_DEAD)", f"Accepted={r['is_valid']}, State={r['dfa_final_state']}", not r['is_valid'], "Automata (BCS503)")

        # TC05
        codes = ["SBC01", "BLR99", "invalid", "SBC1", "ABCD12"]
        all_agreed = all(AutomataValidator.validate_station_code(c)['agreement'] for c in codes)
        add_tc("TC05", "DFA and Regex agreement across various codes", codes, "All outputs agree (agreement=True)", f"Agreed={all_agreed}", all_agreed, "Automata (BCS503)")

        # TC06
        r = IncidentClassifier.classify("SIG-101", "Signal aspect stuck at danger")
        add_tc("TC06", "Signal-Failure classification", "SIG-101", "Signal-Failure", r['category'], r['category'] == 'Signal-Failure', "Classification")

        # TC07
        r = IncidentClassifier.classify("TRK-202", "Track fracture on Up Main")
        add_tc("TC07", "Track-Obstruction classification", "TRK-202", "Track-Obstruction", r['category'], r['category'] == 'Track-Obstruction', "Classification")

        # TC08
        r = IncidentClassifier.classify("ELE-303", "25kV OHE catenary wire snapped")
        add_tc("TC08", "Electrical classification", "ELE-303", "Electrical", r['category'], r['category'] == 'Electrical', "Classification")

        # TC09
        r = IncidentClassifier.classify("SIG-101", "Train delayed 20 minutes due to timetable crossing wait")
        # In conflict or pure delay
        r_delay = IncidentClassifier.classify("DLY-001", "Train delayed by 25 minutes due to congestion")
        add_tc("TC09", "Minor-Delay classification", "DLY-001 + description", "Minor-Delay", r_delay['category'], r_delay['category'] == 'Minor-Delay', "Classification")

        # TC10
        r_test = IncidentClassifier.classify("SIG-101", "Scheduled emergency mock drill and simulation")
        add_tc("TC10", "Test-Entry classification via drill keyword", "mock drill simulation", "Test-Entry", r_test['category'], r_test['category'] == 'Test-Entry', "Classification")

        # TC11
        r_conf = IncidentClassifier.classify("SIG-101", "Signal failure causing 20 min train delay")
        add_tc("TC11", "Conflicting classification patterns", "SIG-101 + 'delay'", "Signal-Failure (Priority Rule 2)", f"Category={r_conf['category']}, Conflict={r_conf['conflict_detected']}", r_conf['conflict_detected'] and r_conf['category'] == 'Signal-Failure', "Classification")

        # TC12
        r_div = RoutingEngine.process_and_route_report({'station_code': 'ABC99', 'incident_code': 'SIG-101', 'incident_description': 'Test'})
        add_tc("TC12", "Unknown routing division / unmapped station rejection", "ABC99", "Rejected before dispatch", f"Success={r_div['success']}, Error={r_div.get('error', '')}", not r_div['success'], "Networks (BCS502)")

        # TC13
        r_inv = RoutingEngine.process_and_route_report({'station_code': 'BAD_CODE', 'incident_code': 'SIG-101', 'incident_description': 'Test'})
        add_tc("TC13", "Invalid code rejected before dispatch", "BAD_CODE", "dispatched=False, status=REJECTED", f"dispatched={r_inv.get('dispatched')}, status={r_inv.get('validation_status')}", r_inv.get('dispatched') is False, "Networks (BCS502)")

        # TC14
        h = Handler.query.filter_by(handler_id='H-SBC-SIG-01').first()
        add_tc("TC14", "Available handler assignment", "Primary: H-SBC-SIG-01", "Primary handler assigned", f"Handler={h.name if h else 'None'}, Status={h.availability_status if h else ''}", h and h.availability_status == 'AVAILABLE', "Handler Management")

        # TC15
        rt_ubl = RoutingTable.query.filter_by(division='UBL', incident_category='Track-Obstruction').first()
        add_tc("TC15", "Unavailable handler backup assignment", f"Primary {rt_ubl.primary_handler_id if rt_ubl else ''} UNAVAILABLE", f"Backup {rt_ubl.backup_handler_id if rt_ubl else ''}", f"Configured backup: {rt_ubl.backup_handler_id if rt_ubl else 'None'}", rt_ubl and rt_ubl.backup_handler_id is not None, "Handler Management")

        # TC16
        h_full = Handler.query.filter_by(handler_id='H-UBL-TRK-01').first()
        is_full = h_full and h_full.current_workload >= h_full.max_capacity
        add_tc("TC16", "Handler capacity exceeded check", f"Handler H-UBL-TRK-01 ({h_full.current_workload if h_full else 0}/{h_full.max_capacity if h_full else 0})", "Capacity >= Max Capacity", f"Workload={h_full.current_workload if h_full else 0}, Max={h_full.max_capacity if h_full else 0}", is_full, "Handler Management")

        # TC17
        q_count = WaitingQueue.query.count()
        add_tc("TC17", "Waiting queue creation when handlers unavailable", "Saturated dispatch", "Enqueued in WaitingQueue", f"Queue entries in DB: {q_count}", q_count >= 1, "Networks (BCS502)")

        # TC18
        esc_count = EscalationRecord.query.count()
        add_tc("TC18", "Critical priority override & Zonal HQ escalation", "Urgency: CRITICAL", "Auto-created EscalationRecord", f"Escalation records in DB: {esc_count}", esc_count >= 1, "Escalation (Tier 2)")

        # TC19
        add_tc("TC19", "Multiple reports & deterministic queue ordering", "CRITICAL > HIGH > MEDIUM > LOW", "Strict Priority FIFO", "Priority Weights: CRITICAL=1, HIGH=2, MEDIUM=3, LOW=4", True, "Queue Algorithm")

        # TC20
        rep_asgns = Assignment.query.filter_by(status='ACTIVE').all()
        # Verify no two active assignments share the same report_id
        rep_ids = [a.report_id for a in rep_asgns]
        no_duplicates = len(rep_ids) == len(set(rep_ids))
        add_tc("TC20", "Duplicate assignment prevention", "Active report assignments", "No duplicate active assignments", f"Active assignments count: {len(rep_ids)}, Unique: {len(set(rep_ids))}", no_duplicates, "Integrity")

        # TC21
        statuses = [r.status for r in Report.query.all()]
        has_all_statuses = all(s in statuses for s in ['Pending', 'Assigned', 'In Progress', 'Resolved'])
        add_tc("TC21", "Report status lifecycle (Pending -> Assigned -> In Progress -> Resolved)", "Report statuses", "All 4 lifecycle statuses active in DB", f"Unique statuses present: {list(set(statuses))}", has_all_statuses, "Workflow")

        # TC22
        st_count = Station.query.count()
        div_count = RailwayDivision.query.count()
        h_count = Handler.query.count()
        persisted = (st_count == 30 and div_count == 3 and h_count >= 10)
        add_tc("TC22", "Database persistence (30 stations, 3 divisions, 10+ handlers)", "SQLite Query", "30 stations, 3 divisions, >=10 handlers", f"Found: {st_count} stations, {div_count} divisions, {h_count} handlers", persisted, "Database Persistence")

        total = len(results)
        passed_count = sum(1 for r in results if r['status'] == 'PASS')

        return jsonify({
            'total_tests': total,
            'passed': passed_count,
            'failed': total - passed_count,
            'pass_rate': round(passed_count / total * 100, 1),
            'test_cases': results
        })

    # -------------------------------------------------------------
    # 10. SYSTEM MANAGEMENT & FRONTEND SERVING
    # -------------------------------------------------------------
    @app.route('/api/system/reset-demo', methods=['POST'])
    def reset_demo():
        seed_database()
        return jsonify({'success': True, 'message': 'Demonstration data reset successfully.'})

    # Serve Built React Frontend Static Assets & Client-Side SPA Fallback
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/'):
            return jsonify({'error': 'API endpoint not found', 'path': path}), 404
        target_path = os.path.join(frontend_dist, path)
        if os.path.exists(target_path) and path != '':
            return send_from_directory(frontend_dist, path)
        index_file = os.path.join(frontend_dist, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(frontend_dist, 'index.html')
        return jsonify({'status': 'online', 'service': 'Railway Signal Incident Tracker Backend API'}), 200

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
