"""
Demonstration Database Initialization Script (Part 6, 8, 14, 18)
Initializes:
- 3 Railway Divisions
- Exactly 30 Stations (10 per division) with format [A-Z]{3}[0-9]{2}
- Exactly 5 Incident Categories
- 12 Demonstration Handlers across the 3 divisions
- Explicit Routing Table entries for SQLite dispatch
- Configurable Classification Rules
- Demo Users (Station Master, Handler, Administrator)
- Pre-populated realistic reports across all 4 statuses (Pending, Assigned, In Progress, Resolved)
- Critical Escalation records to Zonal Headquarters
"""

from datetime import datetime, timedelta
from models import (
    db, User, Station, RailwayDivision, IncidentCategory, 
    Handler, RoutingTable, Report, Assignment, WaitingQueue, 
    StatusHistory, ClassificationRule, EscalationRecord, RoutingLog, ValidationLog
)

def seed_database():
    print("Beginning database seeding...")
    
    # Clean tables
    db.drop_all()
    db.create_all()

    # 1. SEED RAILWAY DIVISIONS (Exactly 3)
    divisions_data = [
        {'code': 'SBC', 'name': 'Bangalore Division', 'hq': 'Krantivira Sangolli Rayanna (SBC) Division HQ'},
        {'code': 'UBL', 'name': 'Hubli Division', 'hq': 'Hubli Central Zonal Division HQ'},
        {'code': 'MYS', 'name': 'Mysore Division', 'hq': 'Mysore Heritage Rail Division HQ'}
    ]
    for d in divisions_data:
        div = RailwayDivision(
            division_code=d['code'],
            division_name=d['name'],
            headquarters=d['hq'],
            is_demo=True
        )
        db.session.add(div)

    # 2. SEED STATIONS (Exactly 30 stations, 10 per division, code [A-Z]{3}[0-9]{2})
    stations_data = [
        # Bangalore Division (SBC) - 10 Stations
        ('SBC01', 'Bangalore City Junction', 'SBC'),
        ('SBC02', 'Bangalore Cantonment', 'SBC'),
        ('SBC03', 'Yesvantpur Junction', 'SBC'),
        ('SBC04', 'K.R. Puram Terminal', 'SBC'),
        ('SBC05', 'Whitefield Industrial Depot', 'SBC'),
        ('SBC06', 'Yelahanka Junction', 'SBC'),
        ('SBC07', 'Banaswadi Station', 'SBC'),
        ('SBC08', 'Carmelaram Junction', 'SBC'),
        ('SBC09', 'Channasandra Loop', 'SBC'),
        ('SBC10', 'Baiyyappanahalli Yard', 'SBC'),

        # Hubli Division (UBL) - 10 Stations
        ('UBL01', 'Siddharoodha Swamiji Hubli Jn', 'UBL'),
        ('UBL02', 'Dharwad Junction', 'UBL'),
        ('UBL03', 'Gadag Junction', 'UBL'),
        ('UBL04', 'Koppal Waypoint', 'UBL'),
        ('UBL05', 'Hosapete Junction', 'UBL'),
        ('UBL06', 'Ballari Junction', 'UBL'),
        ('UBL07', 'Bagalkot Terminal', 'UBL'),
        ('UBL08', 'Vijayapura Main', 'UBL'),
        ('UBL09', 'Londa Junction', 'UBL'),
        ('UBL10', 'Alnavar Interlock Yard', 'UBL'),

        # Mysore Division (MYS) - 10 Stations
        ('MYS01', 'Mysore City Central', 'MYS'),
        ('MYS02', 'Naganahalli Station', 'MYS'),
        ('MYS03', 'Pandavapura Station', 'MYS'),
        ('MYS04', 'Mandya Regional Terminal', 'MYS'),
        ('MYS05', 'Maddur Crossing', 'MYS'),
        ('MYS06', 'Channapatna Craft Point', 'MYS'),
        ('MYS07', 'Ramanagaram Silk City', 'MYS'),
        ('MYS08', 'Bidadi Industrial Point', 'MYS'),
        ('MYS09', 'Hassan Junction', 'MYS'),
        ('MYS10', 'Arsikere Junction Yard', 'MYS')
    ]
    for code, name, div_code in stations_data:
        st = Station(
            station_code=code,
            station_name=name,
            division_code=div_code,
            is_demo=True
        )
        db.session.add(st)

    # 3. SEED INCIDENT CATEGORIES (Exactly 5 categories)
    categories_data = [
        ('Signal-Failure', 'SIG', 'Railway signal interlocking, aspect failure, point machine disconnect, track circuit drop', 'CRITICAL'),
        ('Track-Obstruction', 'TRK', 'Physical obstruction, rail fracture, weld failure, debris, boulder or fallen trees on tracks', 'CRITICAL'),
        ('Electrical', 'ELE', 'Overhead Equipment (OHE) trip, pantograph entanglement, power substation failure, relay glitch', 'HIGH'),
        ('Minor-Delay', 'DLY', 'Operational delays, platform wait, caution order, speed restriction, timetable adjustments', 'LOW'),
        ('Test-Entry', 'TST', 'Scheduled safety simulation, mock drill, diagnostic telemetry test, training drill', 'LOW')
    ]
    for name, prefix, desc, sev in categories_data:
        cat = IncidentCategory(
            name=name,
            code_prefix=prefix,
            description=desc,
            severity_default=sev
        )
        db.session.add(cat)

    # 4. SEED DEMO USERS
    users_data = [
        ('station_master', 'Station@123', 'Station Master', 'SM Rajesh Kumar', 'SBC'),
        ('sm_ubl', 'Station@123', 'Station Master', 'SM Anand Patil', 'UBL'),
        ('sm_mys', 'Station@123', 'Station Master', 'SM Suresh Rao', 'MYS'),
        ('handler_sig1', 'Handler@123', 'Handler', 'Engr. Deepa Murthy', 'SBC'),
        ('handler_trk1', 'Handler@123', 'Handler', 'Engr. Vikram Naik', 'SBC'),
        ('handler_ele1', 'Handler@123', 'Handler', 'Engr. Praveen Joshi', 'UBL'),
        ('admin', 'Admin@123', 'Administrator', 'Chief Rail Operations Director (Admin)', 'ALL')
    ]
    for uname, pwd, role, fname, div in users_data:
        u = User(username=uname, role=role, full_name=fname, division=div)
        u.set_password(pwd)
        db.session.add(u)

    # 5. SEED HANDLERS (At least 10 handlers across the 3 divisions with availability and capacity)
    handlers_data = [
        # Bangalore Division (SBC) Handlers
        ('H-SBC-SIG-01', 'Engr. Deepa Murthy', 'Signal & Telecommunication', 'SBC', 'Electronic Interlocking & Signals', 'AVAILABLE', 4, 1),
        ('H-SBC-SIG-02', 'Engr. Ramesh Babu', 'Signal & Telecommunication', 'SBC', 'Axle Counter & Track Circuits', 'AVAILABLE', 5, 0),
        ('H-SBC-TRK-01', 'Engr. Vikram Naik', 'Civil & Permanent Way', 'SBC', 'Track Maintenance & Rail Fractures', 'AVAILABLE', 4, 1),
        ('H-SBC-ELE-01', 'Engr. Kavita Rao', 'Electrical Traction (OHE)', 'SBC', 'Overhead 25kV Traction Power', 'AVAILABLE', 3, 0),
        
        # Hubli Division (UBL) Handlers
        ('H-UBL-SIG-01', 'Engr. Sunil Kulkarni', 'Signal & Telecommunication', 'UBL', 'Relay Interlocking & Point Motors', 'AVAILABLE', 4, 1),
        ('H-UBL-TRK-01', 'Engr. Basavaraj Patil', 'Civil & Permanent Way', 'UBL', 'Deep Screening & Track Realignment', 'UNAVAILABLE', 3, 3), # Full & unavailable
        ('H-UBL-TRK-02', 'Engr. Manjunath G', 'Civil & Permanent Way', 'UBL', 'Emergency Track Repair Unit', 'AVAILABLE', 5, 0), # Backup
        ('H-UBL-ELE-01', 'Engr. Praveen Joshi', 'Electrical Traction (OHE)', 'UBL', 'Substation & SCADA Monitoring', 'AVAILABLE', 4, 0),
        
        # Mysore Division (MYS) Handlers
        ('H-MYS-SIG-01', 'Engr. Harish Gowda', 'Signal & Telecommunication', 'MYS', 'Automatic Block Signaling', 'AVAILABLE', 4, 0),
        ('H-MYS-TRK-01', 'Engr. Chethan Kumar', 'Civil & Permanent Way', 'MYS', 'Ghat Section & Ballast Inspection', 'AVAILABLE', 4, 0),
        ('H-MYS-ELE-01', 'Engr. Shilpa Swamy', 'Electrical Traction (OHE)', 'MYS', 'Traction Distribution & Wiring', 'AVAILABLE', 3, 0),
        ('H-MYS-OPS-01', 'Supervisor Mohan Das', 'Operating & Safety Cell', 'MYS', 'Punctuality & Operations Traffic', 'AVAILABLE', 6, 0)
    ]
    for hid, hname, dept, div, spec, status, max_c, curr_w in handlers_data:
        h = Handler(
            handler_id=hid,
            name=hname,
            department=dept,
            division=div,
            specialization=spec,
            availability_status=status,
            max_capacity=max_c,
            current_workload=curr_w,
            is_active=True
        )
        db.session.add(h)

    # 6. SEED EXPLICIT ROUTING TABLE (BCS502 Computer Networks)
    routing_entries = [
        # Bangalore Division Routes
        {
            'division': 'SBC', 'prefix': 'SIG', 'cat': 'Signal-Failure',
            'branch': 'Signal & Telecommunication (S&T)', 'dept': 'Signal Incident Response Team',
            'depot': 'SBC City Central S&T Depot',
            'pri_id': 'H-SBC-SIG-01', 'bkp_id': 'H-SBC-SIG-02',
            'pri_rule': 'Critical Interlocking First, then FIFO',
            'esc_dest': 'Zonal HQ SWR Operations Cell (Hubli)'
        },
        {
            'division': 'SBC', 'prefix': 'TRK', 'cat': 'Track-Obstruction',
            'branch': 'Engineering (Civil / P-Way)', 'dept': 'Permanent Way Rapid Response',
            'depot': 'Yesvantpur Track Marshalling Yard',
            'pri_id': 'H-SBC-TRK-01', 'bkp_id': 'H-SBC-SIG-02',
            'pri_rule': 'Emergency Track Hazard Priority Protocol',
            'esc_dest': 'Zonal HQ SWR Safety Directorate'
        },
        {
            'division': 'SBC', 'prefix': 'ELE', 'cat': 'Electrical',
            'branch': 'Electrical (Traction Distribution)', 'dept': 'OHE Breakdown Squad',
            'depot': 'Baiyyappanahalli Traction Substation',
            'pri_id': 'H-SBC-ELE-01', 'bkp_id': 'H-SBC-SIG-01',
            'pri_rule': 'Traction Power Continuity Protocol',
            'esc_dest': 'Zonal HQ Chief Electrical Engineer Cell'
        },
        {
            'division': 'SBC', 'prefix': 'DLY', 'cat': 'Minor-Delay',
            'branch': 'Operating Branch', 'dept': 'Traffic Regulation Control',
            'depot': 'SBC Divisional Control Office',
            'pri_id': 'H-SBC-SIG-01', 'bkp_id': 'H-SBC-SIG-02',
            'pri_rule': 'Dynamic Punctuality Queue',
            'esc_dest': 'Divisional Railway Manager (SBC)'
        },
        {
            'division': 'SBC', 'prefix': 'TST', 'cat': 'Test-Entry',
            'branch': 'Safety & Audit', 'dept': 'Simulation & Diagnostics',
            'depot': 'SBC Quality & Audit Cell',
            'pri_id': 'H-SBC-SIG-02', 'bkp_id': 'H-SBC-SIG-01',
            'pri_rule': 'Audit Verification Logging',
            'esc_dest': 'Divisional Safety Officer'
        },

        # Hubli Division Routes
        {
            'division': 'UBL', 'prefix': 'SIG', 'cat': 'Signal-Failure',
            'branch': 'Signal & Telecommunication', 'dept': 'Hubli Divisional Interlock Squad',
            'depot': 'UBL Central Signal Workshop',
            'pri_id': 'H-UBL-SIG-01', 'bkp_id': 'H-UBL-ELE-01',
            'pri_rule': 'Mainline Point Failure Priority',
            'esc_dest': 'Zonal HQ SWR Operations Cell (Hubli)'
        },
        {
            'division': 'UBL', 'prefix': 'TRK', 'cat': 'Track-Obstruction',
            'branch': 'Engineering (P-Way)', 'dept': 'Hubli Division Track Rapid Action Force',
            'depot': 'Gadag Engineering Depot',
            'pri_id': 'H-UBL-TRK-01', 'bkp_id': 'H-UBL-TRK-02', # Demonstrates backup fallback when primary is unavailable
            'pri_rule': 'Track Obstruction Emergency Clear Protocol',
            'esc_dest': 'Zonal HQ Chief Track Engineer'
        },
        {
            'division': 'UBL', 'prefix': 'ELE', 'cat': 'Electrical',
            'branch': 'Electrical Traction', 'dept': 'Hubli Power Supply Cell',
            'depot': 'Dharwad Traction Substation',
            'pri_id': 'H-UBL-ELE-01', 'bkp_id': 'H-UBL-SIG-01',
            'pri_rule': 'SCADA Power Interruption Protocol',
            'esc_dest': 'Zonal HQ Electrical Directorate'
        },
        {
            'division': 'UBL', 'prefix': 'DLY', 'cat': 'Minor-Delay',
            'branch': 'Operating Branch', 'dept': 'Hubli Train Control Room',
            'depot': 'UBL Central Control Tower',
            'pri_id': 'H-UBL-SIG-01', 'bkp_id': 'H-UBL-ELE-01',
            'pri_rule': 'Standard Timetable Adjustments',
            'esc_dest': 'Divisional Operating Cell'
        },
        {
            'division': 'UBL', 'prefix': 'TST', 'cat': 'Test-Entry',
            'branch': 'Safety & Audit', 'dept': 'Hubli Rail Inspection Desk',
            'depot': 'UBL Inspection Depot',
            'pri_id': 'H-UBL-ELE-01', 'bkp_id': 'H-UBL-SIG-01',
            'pri_rule': 'Non-disruptive Audit Log',
            'esc_dest': 'Divisional Safety Cell'
        },

        # Mysore Division Routes
        {
            'division': 'MYS', 'prefix': 'SIG', 'cat': 'Signal-Failure',
            'branch': 'Signal & Telecommunication', 'dept': 'Mysore Signal Maintenance Unit',
            'depot': 'MYS Central Depot',
            'pri_id': 'H-MYS-SIG-01', 'bkp_id': 'H-MYS-OPS-01',
            'pri_rule': 'Signal Aspect Red Alert Priority',
            'esc_dest': 'Zonal HQ SWR Operations Cell'
        },
        {
            'division': 'MYS', 'prefix': 'TRK', 'cat': 'Track-Obstruction',
            'branch': 'Civil Engineering', 'dept': 'Mysore P-Way Gang 4',
            'depot': 'Mandya P-Way Yard',
            'pri_id': 'H-MYS-TRK-01', 'bkp_id': 'H-MYS-OPS-01',
            'pri_rule': 'Ghat Track Clearance Priority',
            'esc_dest': 'Zonal HQ Chief Safety Officer'
        },
        {
            'division': 'MYS', 'prefix': 'ELE', 'cat': 'Electrical',
            'branch': 'Electrical (TRD)', 'dept': 'Mysore OHE Emergency Unit',
            'depot': 'MYS OHE Maintenance Tower Car Depot',
            'pri_id': 'H-MYS-ELE-01', 'bkp_id': 'H-MYS-OPS-01',
            'pri_rule': 'TRD Power Trip Response',
            'esc_dest': 'Zonal HQ Chief Electrical Engineer'
        },
        {
            'division': 'MYS', 'prefix': 'DLY', 'cat': 'Minor-Delay',
            'branch': 'Operating Branch', 'dept': 'Mysore Section Control',
            'depot': 'MYS Divisional Train Control',
            'pri_id': 'H-MYS-OPS-01', 'bkp_id': 'H-MYS-SIG-01',
            'pri_rule': 'Train Movement Regulation',
            'esc_dest': 'Sr. Divisional Operations Manager (MYS)'
        },
        {
            'division': 'MYS', 'prefix': 'TST', 'cat': 'Test-Entry',
            'branch': 'Safety Directorate', 'dept': 'Drill Coordination Cell',
            'depot': 'MYS Safety Training Yard',
            'pri_id': 'H-MYS-OPS-01', 'bkp_id': 'H-MYS-SIG-01',
            'pri_rule': 'Drill Log Validation',
            'esc_dest': 'Divisional Safety Cell'
        }
    ]

    for rent in routing_entries:
        rt = RoutingTable(
            division=rent['division'],
            incident_prefix=rent['prefix'],
            incident_category=rent['cat'],
            branch=rent['branch'],
            department=rent['dept'],
            depot_authority=rent['depot'],
            primary_handler_id=rent['pri_id'],
            backup_handler_id=rent['bkp_id'],
            priority_rule=rent['pri_rule'],
            escalation_destination=rent['esc_dest']
        )
        db.session.add(rt)

    # 7. SEED CLASSIFICATION RULES (Configurable rules)
    rules_data = [
        ('Rule-Test-Override', 'KEYWORD_DESCRIPTION', 'drill', 'Test-Entry', 1, 'Mark safety drills as Test-Entry to prevent real-world crew dispatch'),
        ('Rule-Test-Simulation', 'KEYWORD_DESCRIPTION', 'simulation', 'Test-Entry', 1, 'Mark simulations as Test-Entry'),
        ('Rule-Prefix-SIG', 'CODE_PREFIX', 'SIG', 'Signal-Failure', 2, 'Maps SIG prefix to Signal-Failure'),
        ('Rule-Prefix-TRK', 'CODE_PREFIX', 'TRK', 'Track-Obstruction', 2, 'Maps TRK prefix to Track-Obstruction'),
        ('Rule-Prefix-ELE', 'CODE_PREFIX', 'ELE', 'Electrical', 2, 'Maps ELE prefix to Electrical'),
        ('Rule-Delay-Wait', 'KEYWORD_DESCRIPTION', 'delay', 'Minor-Delay', 3, 'Operational schedule delay detected from description')
    ]
    for rname, ptype, pval, tcat, pri, rdesc in rules_data:
        cr = ClassificationRule(
            rule_name=rname,
            pattern_type=ptype,
            pattern_value=pval,
            target_category=tcat,
            priority_order=pri,
            description=rdesc
        )
        db.session.add(cr)

    # 8. SEED REALISTIC DEMO REPORTS (All 4 statuses: Pending, Assigned, In Progress, Resolved)
    now = datetime.utcnow()
    
    # Report 1: CRITICAL Signal-Failure (In Progress) with Mandatory Zonal HQ Escalation!
    rep1 = Report(
        report_id="REP-SBC-20261101100001",
        reporter_name="SM Rajesh Kumar",
        station_code="SBC01",
        station_name="Bangalore City Junction",
        division="SBC",
        contact_info="rajesh.kumar@swr.rail.gov.in / +91-9876543210",
        incident_code="SIG-101",
        incident_description="Electronic interlocking failure at Up Main crossover. Signal 12-A stuck at Danger aspect.",
        urgency_level="CRITICAL",
        additional_remarks="High traffic mainline affected; emergency caution order initiated.",
        validation_status="VALID",
        dfa_result=True,
        regex_result=True,
        validation_reason="Station 'SBC01' and Incident 'SIG-101' verified by DFA & Regex.",
        category="Signal-Failure",
        priority="CRITICAL",
        status="In Progress",
        assigned_handler_id="H-SBC-SIG-01",
        escalation_status="ESCALATED_ZONAL_HQ",
        created_at=now - timedelta(hours=4),
        updated_at=now - timedelta(hours=1)
    )
    db.session.add(rep1)
    
    # Escalation record for Rep 1
    esc1 = EscalationRecord(
        report_id=rep1.report_id,
        division="SBC",
        escalated_to="Zonal HQ SWR Operations Cell (Hubli)",
        reason="Mandatory Automatic Escalation: Report flagged with CRITICAL priority in category 'Signal-Failure' at SBC01.",
        timestamp=now - timedelta(hours=4),
        status="ESCALATED_ACTIVE"
    )
    db.session.add(esc1)

    # Assignment for Rep 1
    asgn1 = Assignment(
        report_id=rep1.report_id,
        handler_id="H-SBC-SIG-01",
        assignment_type="PRIMARY",
        status="ACTIVE",
        rationale="Assigned to Primary Handler Engr. Deepa Murthy. Availability: AVAILABLE."
    )
    db.session.add(asgn1)

    # Status history for Rep 1
    sh1_1 = StatusHistory(report_id=rep1.report_id, old_status="Pending", new_status="Assigned", updated_by="System Dispatch Engine", remarks="Auto-dispatched via routing table to primary handler.", timestamp=now - timedelta(hours=4))
    sh1_2 = StatusHistory(report_id=rep1.report_id, old_status="Assigned", new_status="In Progress", updated_by="H-SBC-SIG-01", remarks="Technician reached relay room at SBC01. Point motor circuit inspection underway.", timestamp=now - timedelta(hours=3))
    db.session.add_all([sh1_1, sh1_2])

    # Report 2: Track-Obstruction (Assigned)
    rep2 = Report(
        report_id="REP-SBC-20261101100002",
        reporter_name="SM Rajesh Kumar",
        station_code="SBC03",
        station_name="Yesvantpur Junction",
        division="SBC",
        contact_info="rajesh.kumar@swr.rail.gov.in",
        incident_code="TRK-202",
        incident_description="Ballast displacement and fallen tree branch near Track 2 curve.",
        urgency_level="HIGH",
        additional_remarks="Down trains slowed to 15 km/h caution speed.",
        validation_status="VALID",
        dfa_result=True,
        regex_result=True,
        validation_reason="Station 'SBC03' and Incident 'TRK-202' verified by DFA & Regex.",
        category="Track-Obstruction",
        priority="HIGH",
        status="Assigned",
        assigned_handler_id="H-SBC-TRK-01",
        escalation_status="NONE",
        created_at=now - timedelta(hours=2),
        updated_at=now - timedelta(hours=2)
    )
    db.session.add(rep2)
    asgn2 = Assignment(
        report_id=rep2.report_id,
        handler_id="H-SBC-TRK-01",
        assignment_type="PRIMARY",
        status="ACTIVE",
        rationale="Assigned to Primary Handler Engr. Vikram Naik. Availability: AVAILABLE."
    )
    db.session.add(asgn2)

    # Report 3: Resolved Electrical Report
    rep3 = Report(
        report_id="REP-UBL-20261101100003",
        reporter_name="SM Anand Patil",
        station_code="UBL01",
        station_name="Siddharoodha Swamiji Hubli Jn",
        division="UBL",
        contact_info="anand.patil@swr.rail.gov.in",
        incident_code="ELE-303",
        incident_description="Traction feeder insulator flashover detected at Sectioning Post.",
        urgency_level="MEDIUM",
        additional_remarks="Power restored via alternate feeder.",
        validation_status="VALID",
        dfa_result=True,
        regex_result=True,
        validation_reason="Station 'UBL01' and Incident 'ELE-303' verified by DFA & Regex.",
        category="Electrical",
        priority="MEDIUM",
        status="Resolved",
        assigned_handler_id="H-UBL-ELE-01",
        escalation_status="NONE",
        resolution_remarks="Insulator string replaced. Megger test recorded at 500 Mega-ohms. Feeder re-energized successfully.",
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(hours=6)
    )
    db.session.add(rep3)
    sh3 = StatusHistory(report_id=rep3.report_id, old_status="In Progress", new_status="Resolved", updated_by="H-UBL-ELE-01", remarks="Work completed and safety certificate issued.", timestamp=now - timedelta(hours=6))
    db.session.add(sh3)

    # Report 4: Pending Waiting Queue Report (Minor-Delay)
    rep4 = Report(
        report_id="REP-MYS-20261101100004",
        reporter_name="SM Suresh Rao",
        station_code="MYS04",
        station_name="Mandya Regional Terminal",
        division="MYS",
        contact_info="suresh.rao@swr.rail.gov.in",
        incident_code="SIG-104",
        incident_description="Train 16536 delayed by 20 minutes due to platform line occupancy and minor gate signal wait.",
        urgency_level="LOW",
        additional_remarks="No track defect observed. Schedule adjustment required.",
        validation_status="VALID",
        dfa_result=True,
        regex_result=True,
        validation_reason="Station 'MYS04' and Incident 'SIG-104' verified by DFA & Regex.",
        category="Minor-Delay",
        priority="LOW",
        status="Pending",
        assigned_handler_id=None,
        escalation_status="NONE",
        created_at=now - timedelta(minutes=45),
        updated_at=now - timedelta(minutes=45)
    )
    db.session.add(rep4)
    wq4 = WaitingQueue(
        report_id=rep4.report_id,
        priority="LOW",
        queue_position=1,
        status="WAITING",
        reason="Awaiting operator review for routine schedule delay."
    )
    db.session.add(wq4)

    # Report 5: Test-Entry (Resolved)
    rep5 = Report(
        report_id="REP-SBC-20261101100005",
        reporter_name="System Auditor",
        station_code="SBC05",
        station_name="Whitefield Industrial Depot",
        division="SBC",
        contact_info="audit@swr.rail.gov.in",
        incident_code="SIG-105",
        incident_description="Scheduled diagnostic simulation and fire alarm drill for interlock cabin.",
        urgency_level="LOW",
        additional_remarks="Quarterly safety inspection drill.",
        validation_status="VALID",
        dfa_result=True,
        regex_result=True,
        validation_reason="Station 'SBC05' and Incident 'SIG-105' verified by DFA & Regex.",
        category="Test-Entry",
        priority="LOW",
        status="Resolved",
        assigned_handler_id="H-SBC-SIG-02",
        escalation_status="NONE",
        resolution_remarks="Drill concluded successfully. All telemetry signals logged correctly.",
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(days=2)
    )
    db.session.add(rep5)

    db.session.commit()
    print("Database seeding completed successfully.")

if __name__ == '__main__':
    from app import app
    with app.app_context():
        seed_database()
