"""
Part 4: Exactly Five Incident Categories & Classification Engine
1. Signal-Failure
2. Track-Obstruction
3. Electrical
4. Minor-Delay
5. Test-Entry

Deterministic Priority Hierarchy:
Rule 1 (Highest): Test / Simulation Override (Prevents false emergency dispatch during drills)
Rule 2: Hardware / Safety Prefix Mapping (SIG -> Signal-Failure, TRK -> Track-Obstruction, ELE -> Electrical)
Rule 3: Operational Delay Analysis (Keywords: delay, late, schedule, wait -> Minor-Delay)
Rule 4: Unknown Code Handling: REJECT unknown codes (Never silently default to a valid category)
"""

import re
from typing import Dict, Any, List, Optional

class IncidentClassifier:
    
    ALLOWED_CATEGORIES = [
        'Signal-Failure',
        'Track-Obstruction',
        'Electrical',
        'Minor-Delay',
        'Test-Entry'
    ]

    PREFIX_TO_CATEGORY = {
        'SIG': 'Signal-Failure',
        'TRK': 'Track-Obstruction',
        'ELE': 'Electrical'
    }

    # Delay indicators
    DELAY_KEYWORDS = [
        'delay', 'late', 'schedule', 'behind schedule', 'waiting for clearance',
        'crossing wait', 'speed restriction', 'caution order', 'train delayed'
    ]

    # Test / Simulation indicators
    TEST_KEYWORDS = [
        'test', 'drill', 'simulation', 'mock', 'routine check', 'audit',
        'training', 'practice', 'scheduled test', 'trial run'
    ]

    @classmethod
    def classify(
        cls, 
        incident_code: str, 
        description: str = "", 
        custom_rules: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Classifies an incident using incident code, description analysis, and configurable priority rules.
        Detects conflicting patterns and applies documented deterministic priority rules.
        Rejects unknown or unsupported codes.
        """
        code = (incident_code or "").strip().upper()
        desc = (description or "").strip().lower()

        # Extract prefix from code
        prefix_match = re.match(r'^([A-Z]{3})', code)
        prefix = prefix_match.group(1) if prefix_match else ""

        matches: List[Dict[str, str]] = []
        conflicts_detected = False

        # 1. Check custom configurable rules from database if provided
        if custom_rules:
            # Sort by priority_order ASC
            sorted_rules = sorted(custom_rules, key=lambda r: r.get('priority_order', 100))
            for rule in sorted_rules:
                p_type = rule.get('pattern_type')
                p_val = rule.get('pattern_value', '').lower()
                tgt = rule.get('target_category')
                
                if p_type == 'CODE_PREFIX' and prefix == p_val.upper():
                    matches.append({'source': f"Custom Rule: {rule.get('rule_name')}", 'category': tgt})
                elif p_type == 'KEYWORD_DESCRIPTION' and p_val in desc:
                    matches.append({'source': f"Custom Rule: {rule.get('rule_name')}", 'category': tgt})

        # 2. Check Standard Prefix Matches
        if prefix in cls.PREFIX_TO_CATEGORY:
            matches.append({
                'source': f"Code Prefix '{prefix}'",
                'category': cls.PREFIX_TO_CATEGORY[prefix]
            })

        # 3. Check Test / Simulation Keywords
        has_test_keyword = any(kw in desc for kw in cls.TEST_KEYWORDS) or code.startswith('TST')
        if has_test_keyword:
            matches.append({
                'source': "Description Analysis (Test/Drill Pattern)",
                'category': 'Test-Entry'
            })

        # 4. Check Minor-Delay Keywords
        has_delay_keyword = any(kw in desc for kw in cls.DELAY_KEYWORDS) or code.startswith('DLY')
        if has_delay_keyword:
            matches.append({
                'source': "Description Analysis (Delay/Schedule Pattern)",
                'category': 'Minor-Delay'
            })

        # Check for multiple differing matches (Conflict Detection)
        distinct_categories = list({m['category'] for m in matches if m['category'] in cls.ALLOWED_CATEGORIES})
        
        if len(distinct_categories) > 1:
            conflicts_detected = True

        # DETERMINISTIC PRIORITY RESOLUTION
        # Priority Order:
        # 1. Test-Entry (If flagged as a simulation/drill, override hardware alerts to avoid false emergency dispatches)
        # 2. Hardware / Track Safety (Signal-Failure, Track-Obstruction, Electrical take priority over general delay symptoms)
        # 3. Minor-Delay (If no hardware failure code exists, but delay keywords match)

        selected_category = None
        rationale = ""

        if 'Test-Entry' in distinct_categories:
            selected_category = 'Test-Entry'
            rationale = "Deterministic Priority Rule 1 applied: Test/Drill override. Marked as Test-Entry to prevent real-world emergency dispatch during diagnostic exercise."
            if conflicts_detected:
                rationale += f" Resolved conflict between {distinct_categories}."
        
        elif any(c in distinct_categories for c in ['Signal-Failure', 'Track-Obstruction', 'Electrical']):
            # Hardware prefix takes precedence over secondary delay symptoms
            for hw_cat in ['Signal-Failure', 'Track-Obstruction', 'Electrical']:
                if hw_cat in distinct_categories:
                    selected_category = hw_cat
                    break
            
            if conflicts_detected:
                rationale = (
                    f"Deterministic Priority Rule 2 applied: Hardware safety classification '{selected_category}' "
                    f"takes precedence over operational symptom (Minor-Delay). Both safety fault and delay observed."
                )
            else:
                rationale = f"Classified as '{selected_category}' based on verified incident prefix '{prefix}'."

        elif 'Minor-Delay' in distinct_categories:
            selected_category = 'Minor-Delay'
            rationale = "Deterministic Priority Rule 3 applied: Operational delay identified from report description."

        else:
            # UNKNOWN / UNMAPPED CODE HANDLING
            # Requirement: "Reject unknown or unmapped codes. Never silently assign an unknown code to a valid category."
            return {
                'success': False,
                'category': None,
                'conflict_detected': False,
                'matches': matches,
                'error': f"Unknown or unmapped incident code '{code}'. Prefix '{prefix}' does not match supported categories (SIG, TRK, ELE). Classification rejected.",
                'rationale': "Unknown code rejected: The system refuses to silently assign an unsupported code to a valid category."
            }

        return {
            'success': True,
            'category': selected_category,
            'conflict_detected': conflicts_detected,
            'conflicting_categories': distinct_categories if conflicts_detected else [],
            'matches': matches,
            'rationale': rationale,
            'prefix': prefix
        }
