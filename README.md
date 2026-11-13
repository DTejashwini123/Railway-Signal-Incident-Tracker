# P15 – Railway Signal Incident Tracker
### Academic Integration: BCS503 (Automata Theory & Computability) & BCS502 (Computer Networks)
### South Western Railway (SWR) Central Interlocking Operations & Dispatch Model

---

## 1. Executive Summary & Architecture

The **Railway Signal Incident Tracker** is an enterprise-grade railway operations command-and-control web application designed to bridge theoretical computer science principles with real-world infrastructure engineering. Built strictly to satisfy college problem statement **P15**, it integrates:

1. **BCS503 – Automata Theory and Computability**: Deterministic Finite Automaton (DFA) state-transition engines, formal 5-tuple machine execution, and regular expression verification for structured identifiers.
2. **BCS502 – Computer Networks**: Multi-division network topology (30 stations across Bangalore, Hubli, and Mysore divisions), SQLite explicit routing and dispatch tables, handler capacity/availability constraints, deterministic priority queuing, and automated Tier-2 Zonal Headquarters escalations.

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Recharts, Lucide React, Axios.
- **Backend**: Python 3.12, Flask REST API, SQLite 3, SQLAlchemy ORM, Flask-CORS, Werkzeug security.
- **Testing**: Pytest automated backend test suite (22 comprehensive test cases, 100% pass rate).

---

## 2. Academic Modules

### 2.1 BCS503 – Automata Theory & Computability
- **Station Code Format**: Exactly `[A-Z]{3}[0-9]{2}` (e.g., `SBC01`, `BLR12` valid; `ABC1`, `ABCD12`, `abc12` rejected).
- **Incident Code Format**: Enforces prefixes `SIG` (Signal-Failure), `TRK` (Track-Obstruction), `ELE` (Electrical) with configured suffix format `-[0-9]{3}` (e.g., `SIG-101`, `TRK-202`, `ELE-305`).
- **Formal 5-Tuple DFA Machine**:
  $$M = (Q, \Sigma, \delta, q_0, F)$$
  - States $Q = \{q_0, q_1, q_2, q_3, q_4, q_5, q_{dead}\}$
  - Alphabet $\Sigma = [A-Z] \cup [0-9]$
  - Initial State $q_0 = \text{'q0'}$
  - Final Accepting States $F = \{\text{'q5'}\}$
  - Transition Function $\delta$:
    - $\delta(q_0, [A-Z]) = q_1$, else $q_{dead}$
    - $\delta(q_1, [A-Z]) = q_2$, else $q_{dead}$
    - $\delta(q_2, [A-Z]) = q_3$, else $q_{dead}$
    - $\delta(q_3, [0-9]) = q_4$, else $q_{dead}$
    - $\delta(q_4, [0-9]) = q_5$, else $q_{dead}$ (Accepting final state)
    - $\delta(q_5, \text{any}) = q_{dead}$ (Enforces exact length = 5)
    - $\delta(q_{dead}, \text{any}) = q_{dead}$ (Trap / Rejection state)
- **Dual-Engine Agreement**: Every submitted code is verified concurrently by the DFA simulation trace and the compiled regular expression `^[A-Z]{3}[0-9]{2}$`. Disagreements trigger an anomaly halt.

### 2.2 BCS502 – Computer Networks
- **Railway Network Topology**: Exactly 30 stations divided evenly (10 stations each) across 3 railway divisions:
  - **Bangalore Division (SBC)**: `SBC01` to `SBC10` (Bangalore City, Cantonment, Yesvantpur, etc.)
  - **Hubli Division (UBL)**: `UBL01` to `UBL10` (Hubli Jn, Dharwad, Gadag, etc.)
  - **Mysore Division (MYS)**: `MYS01` to `MYS10` (Mysore City Central, Naganahalli, Mandya, etc.)
- **SQLite Explicit Routing Table**: Every routing decision queries the database table `routing_table` mapping:
  `Division + Incident Prefix + Category` $\to$ `Branch + Department + Depot + Primary Handler + Backup Handler + Escalation Destination`.
- **12-Step Network Routing Algorithm**:
  1. Accept report payload.
  2. Perform DFA and regular expression syntax validation.
  3. **Reject invalid reports before dispatch** (never dispatched to field).
  4. Extract routing key only from validated report.
  5. Identify station and division.
  6. Identify incident category.
  7. Query SQLite `routing_table`.
  8. Identify responsible handler.
  9. Check handler availability status (`AVAILABLE`).
  10. Check handler capacity (`current_workload < max_capacity`).
  11. If primary handler is eligible $\to$ assign and increment workload.
  12. If primary is unavailable/full $\to$ check backup handler. If both are saturated $\to$ enqueue into deterministic Waiting Queue with priority ordering.
- **Mandatory Tier 2 Zonal Headquarters Escalation**:
  Every incident flagged with `CRITICAL` urgency automatically triggers an emergency escalation record in `escalation_records` directed to **Zonal Headquarters (Hubli Operations Cell / Rail Bhavan)**.

### 2.3 Exactly Five Incident Categories (Part 4)
The classification engine enforces only these 5 predefined categories:
1. `Signal-Failure` (Mapped from `SIG` prefix: aspect drop, interlocking glitch)
2. `Track-Obstruction` (Mapped from `TRK` prefix: rail fractures, debris, weld breach)
3. `Electrical` (Mapped from `ELE` prefix: 25kV OHE catenary trip, traction substation)
4. `Minor-Delay` (Identified from operational delay keywords: platform wait, crossing wait)
5. `Test-Entry` (Identified from diagnostic keywords: mock drill, simulation, telemetry test)

**Deterministic Priority Rules for Conflicts**:
- *Rule 1 (Override)*: Test / Drill keywords classify as `Test-Entry` to prevent real-world crew dispatch during simulation drills.
- *Rule 2 (Safety Hierarchy)*: Hardware fault prefixes (`Signal-Failure`, `Track-Obstruction`, `Electrical`) take absolute precedence over secondary delay symptoms.
- *Rule 3 (Rejection of Unknown Codes)*: Unknown or unsupported incident codes are **rejected** with an explicit error and are never silently assigned to valid categories.

---

## 3. Database Schema (14 SQLite Tables)

The database `railway_tracker.db` is managed via SQLAlchemy with 14 persistent relational tables:
1. `users`: Credentials with Werkzeug password hashing, roles, and division assignments.
2. `stations`: 30 demonstration railway stations mapped to divisions.
3. `railway_divisions`: 3 divisions (Bangalore `SBC`, Hubli `UBL`, Mysore `MYS`).
4. `incident_categories`: 5 predefined categories with severity defaults.
5. `handlers`: Field engineering staff with department, specialization, availability, and capacity.
6. `routing_table`: Explicit dispatch table linking division and category to handler teams.
7. `reports`: Core incident reports with DFA/Regex results, classification, and status.
8. `assignments`: Primary, backup, and reassigned handler allocations.
9. `waiting_queue`: Deterministic priority queue when handlers are saturated.
10. `status_history`: Complete audit lifecycle (`Pending` $\to$ `Assigned` $\to$ `In Progress` $\to$ `Resolved`).
11. `classification_rules`: Configurable classification patterns and priority ranks.
12. `escalation_records`: Tier-2 emergency records escalated to Zonal HQ.
13. `routing_logs`: Chronological log of dispatch and routing rationale.
14. `validation_logs`: DFA and Regex mathematical verification logs.

---

## 4. User Roles & Demonstration Credentials

| Role | Username | Password | Division Access | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@123` | ALL Divisions | Full routing management, reassignment, handler capacity, logs, analytics |
| **Station Master** | `station_master` | `Station@123` | SBC Division | Submit reports, view division reports, inspect DFA validation trace |
| **Signal Handler** | `handler_sig1` | `Handler@123` | SBC Division | View assigned queue, update lifecycle status, add remarks, toggle availability |

*Note: The frontend includes a convenient 1-click **Quick Role Switcher** in the sidebar and on the login page for rapid evaluation.*

---

## 5. Five Main User Interfaces + Specialized Modules

1. **Report Submission Page** (`/submit`):
   - Structured form with live inline DFA step-by-step telemetry, dual-engine Regex validation badge, live category prediction, and Tier-2 escalation warning.
2. **User Dashboard** (`/my-reports`):
   - Station Master registry with KPI cards, multi-field search bar (by Report ID, station, reporter), division filters, and comprehensive report drawer.
3. **Handler Dashboard** (`/handler`):
   - Dedicated field console with active workload visual meter, capacity setting slider, availability toggle, and lifecycle status transition modal (`Pending` $\to$ `Assigned` $\to$ `In Progress` $\to$ `Resolved`). Resolving a report automatically decrements workload in SQLite.
4. **Routing Management Dashboard** (`/routing`):
   - Admin control room managing the explicit routing table, 12-handler fleet, deterministic priority queue, and Tier-2 Zonal HQ escalation logs.
5. **Analytics Dashboard** (`/analytics`):
   - Recharts visual telemetry: division distribution, category-wise volume, priority donut, resolution rate, 6-month seasonal trend, and handler workload vs. max capacity.
6. **Visual DFA Simulator** (`/dfa-simulator`):
   - Interactive tape head, state machine diagram ($q_0 \to q_1 \to q_2 \to q_3 \to q_4 \to q_5$ / $q_{dead}$), step-by-step transition table, and 1-click academic presets.
7. **Test Cases Console** (`/test-cases`):
   - Live automated execution of all 22 test cases with individual input, expected output, actual output, and pass/fail badges.

---

## 6. Installation & Execution Guide

### Prerequisites
- Python 3.12+ installed
- Node.js v18+ and npm installed

### Step 1: Clone / Navigate to Project Directory
```powershell
cd C:\Users\tejas\.gemini\antigravity\scratch\railway-signal-tracker
```

### Step 2: Backend Setup & Seeding
```powershell
cd backend

# Activate Python Virtual Environment
.\.venv\Scripts\Activate.ps1

# (Optional: install dependencies if setting up on a new machine)
pip install -r requirements.txt

# Prime SQLite database with 30 stations, 12 handlers, routes & demo reports
python seed_data.py
```

### Step 3: Start Flask Backend Server (Port 5000)
```powershell
# From the backend directory:
python app.py
```
*The Flask API will start on `http://127.0.0.1:5000` with CORS enabled.*

### Step 4: Frontend Setup & Start (Port 3000)
In a separate terminal window:
```powershell
cd C:\Users\tejas\.gemini\antigravity\scratch\railway-signal-tracker\frontend

# Start Vite Development Server
npm run dev
```
*Open your browser and navigate to `http://localhost:3000`.*

---

## 7. Automated Testing (Part 16 - TC01 to TC22)

To run the automated backend test suite using `pytest`:
```powershell
cd C:\Users\tejas\.gemini\antigravity\scratch\railway-signal-tracker\backend
.\.venv\Scripts\pytest.exe -v
```

### Documented Test Case Results Summary

| TC ID | Test Description | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC01** | Valid station code format | `ABC01`, `BLR12`, `SBC01` | Accepted (Final state q5) | State q5 reached, DFA & Regex match | **PASS** |
| **TC02** | Invalid station code syntax | `ABC1`, `ABCD12`, `abc12` | Rejected (State q_dead/q4) | Trapped in q_dead/incomplete | **PASS** |
| **TC03** | Valid incident code | `SIG-101`, `TRK-202`, `ELE-305` | Accepted prefix & format | Valid prefix detected | **PASS** |
| **TC04** | Invalid incident code prefix | `XYZ-101`, `123-SIG` | Rejected prefix | Trapped in i_DEAD | **PASS** |
| **TC05** | DFA and Regex agreement | Test across 10 sample codes | Agreement = True | 100% agreement between DFA and Regex | **PASS** |
| **TC06** | Signal-Failure classification | `SIG-101` + Aspect drop | Signal-Failure | Classified as Signal-Failure | **PASS** |
| **TC07** | Track-Obstruction classification| `TRK-202` + Rail fracture | Track-Obstruction | Classified as Track-Obstruction | **PASS** |
| **TC08** | Electrical classification | `ELE-303` + OHE wire snap | Electrical | Classified as Electrical | **PASS** |
| **TC09** | Minor-Delay classification | Operational crossing wait | Minor-Delay | Classified as Minor-Delay | **PASS** |
| **TC10** | Test-Entry classification | Mock safety simulation drill | Test-Entry | Override to Test-Entry | **PASS** |
| **TC11** | Conflicting classification patterns| `SIG-101` + Delay keyword | Priority Rule 2 (Hardware) | Signal-Failure (Conflict logged) | **PASS** |
| **TC12** | Unknown routing division | Station `ABC99` (unmapped) | Rejected before dispatch | Error: Station not in DB | **PASS** |
| **TC13** | Invalid code rejected pre-dispatch | `BAD_CODE` | dispatched = False | Status = REJECTED, no crew sent | **PASS** |
| **TC14** | Available handler assignment | Primary `H-SBC-SIG-01` available| Primary assigned, workload +1 | Assigned to Primary Handler | **PASS** |
| **TC15** | Unavailable handler fallback | Primary `H-UBL-TRK-01` UNAVAIL | Backup assigned (`H-UBL-TRK-02`)| Backup handler auto-assigned | **PASS** |
| **TC16** | Handler capacity exceeded | Primary at max capacity | Fallback to backup handler | Backup assigned; primary not overloaded | **PASS** |
| **TC17** | No handler available | Both handlers unavailable | Enqueued in Waiting Queue | Record inserted into waiting_queue | **PASS** |
| **TC18** | Critical Zonal HQ Escalation | Priority = CRITICAL | Mandatory Tier 2 Escalation | Auto-created in escalation_records | **PASS** |
| **TC19** | Deterministic queue ordering | Mixed priority batch | Priority sorted (1 to 4) | CRITICAL=1, HIGH=2, MEDIUM=3, LOW=4 | **PASS** |
| **TC20** | Duplicate assignment prevention | Simultaneous dispatches | Unique active assignments | No duplicate active assignment | **PASS** |
| **TC21** | Report status lifecycle | Pending $\to$ In Progress $\to$ Resolved | Workload decremented on resolve| Workload reduced by 1 upon resolution | **PASS** |
| **TC22** | Database persistence | SQLite query on restart | 30 stations, 3 divisions, 10+ handlers | Exactly 30 stations & 3 divisions | **PASS** |

---

## 8. End-to-End Workflow Demonstration

The entire operational pipeline can be observed live in the application:
1. **Station Master Login**: SM Rajesh Kumar logs in for Bangalore Division (`SBC`).
2. **Report Submission**: Enters Station `SBC01`, Incident Code `SIG-101`, Urgency `CRITICAL`.
3. **Identifier Validation**: Live DFA trace moves $q_0 \to q_1 \to q_2 \to q_3 \to q_4 \to q_5$ (Accepted). Regex validates `^[A-Z]{3}[0-9]{2}$`.
4. **Classification Engine**: Automatically identifies `Signal-Failure` with priority `CRITICAL`.
5. **SQLite Routing Lookup**: Queries `routing_table` for division `SBC` and category `Signal-Failure`.
6. **Handler Eligibility Check**: Inspects primary handler `H-SBC-SIG-01` (Deepa Murthy); verifies `AVAILABLE` and capacity ($1/4$).
7. **Dispatch & Assignment**: Assigns report, increments workload to $2/4$, records assignment rationale.
8. **Tier-2 Zonal HQ Escalation**: Detects `CRITICAL` priority and immediately creates an escalation record targeting **Zonal Headquarters (Hubli Operations Cell)**.
9. **Handler Processing**: Engr. Deepa Murthy opens `/handler`, moves report from `Assigned` to `In Progress`, and records technical field remarks.
10. **Resolution & Workload Decrement**: Handler marks incident `Resolved`. Backend updates SQLite status, records resolution certificate, and decrements handler workload back to $1/4$.
11. **User Dashboard Tracking**: Station Master observes the resolved status with timestamp and remarks.
12. **Analytics Sync**: `/analytics` instantly updates resolution rate, monthly trend, and handler utilization bars.
