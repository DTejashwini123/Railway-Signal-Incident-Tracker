import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'railway-secret-key-bcs503-bcs502-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        f"sqlite:///{os.path.join(BASE_DIR, 'railway_tracker.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Automata Theory Configuration (BCS503)
    STATION_CODE_REGEX = r'^[A-Z]{3}[0-9]{2}$'
    
    # Configurable Incident Code Format:
    # Prefix must be one of: SIG, TRK, ELE (plus DLY, TST for demonstration rules)
    # Suffix pattern: 3 digits with optional hyphen, e.g. SIG-101 or SIG101
    INCIDENT_CODE_PREFIXES = ['SIG', 'TRK', 'ELE']
    INCIDENT_CODE_CONFIGURED_REGEX = r'^(SIG|TRK|ELE)-[0-9]{3}$'
    INCIDENT_CODE_DESCRIPTION_FORMAT = "Configured format: 3 uppercase letters prefix (SIG, TRK, ELE) followed by hyphen '-' and exactly 3 digits (e.g. SIG-101, TRK-204, ELE-305)"
    
    # Computer Networks Configuration (BCS502)
    # Exactly 3 divisions with configurable prefixes
    DIVISIONS = {
        'SBC': {'name': 'Bangalore Division', 'prefix': 'SBC', 'hq': 'Bangalore City'},
        'UBL': {'name': 'Hubli Division', 'prefix': 'UBL', 'hq': 'Hubli Central'},
        'MYS': {'name': 'Mysore Division', 'prefix': 'MYS', 'hq': 'Mysore Junction'}
    }
    
    # Five Predefined Incident Categories
    CATEGORIES = [
        'Signal-Failure',
        'Track-Obstruction',
        'Electrical',
        'Minor-Delay',
        'Test-Entry'
    ]
    
    # Priority Levels
    PRIORITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    
    # Report Statuses
    REPORT_STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved']
