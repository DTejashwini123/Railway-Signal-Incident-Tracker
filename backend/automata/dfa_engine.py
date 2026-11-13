"""
BCS503 – Automata Theory and Computability
Module: Deterministic Finite Automaton (DFA) & Regular Expression Validation Engine
"""

import re
from typing import Dict, List, Tuple, Any

class StationCodeDFA:
    """
    Formal 5-tuple Definition: M = (Q, Sigma, delta, q0, F)
    - Q: {q0, q1, q2, q3, q4, q5, q_dead}
    - Sigma: {A-Z, 0-9}
    - delta: Transition function Q x Sigma -> Q
    - q0: Initial state 'q0'
    - F: Final accepting state set {'q5'}
    """
    
    STATES = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q_dead']
    INITIAL_STATE = 'q0'
    FINAL_STATES = {'q5'}
    
    STATE_DESCRIPTIONS = {
        'q0': 'Initial Start State (Awaiting 1st uppercase letter)',
        'q1': 'State 1: Received 1st uppercase letter [A-Z]',
        'q2': 'State 2: Received 2nd uppercase letter [A-Z]',
        'q3': 'State 3: Received 3rd uppercase letter [A-Z] (Letters complete)',
        'q4': 'State 4: Received 1st numeric digit [0-9]',
        'q5': 'State 5: [ACCEPTING] Received 2nd numeric digit [0-9] (Valid Code)',
        'q_dead': 'Dead / Trap Rejection State (Syntax Violation)'
    }

    @staticmethod
    def get_formal_spec() -> Dict[str, Any]:
        """Returns the complete formal mathematical definition of the Station Code DFA."""
        return {
            'name': 'Station Code Deterministic Finite Automaton (BCS503)',
            'language': 'L = { w in Sigma* | w is 3 uppercase alphabetic characters followed by 2 numeric digits }',
            'pattern': '[A-Z]{3}[0-9]{2}',
            'Q_states': StationCodeDFA.STATES,
            'sigma_alphabet': 'Uppercase English Letters [A-Z] U Decimal Digits [0-9]',
            'q0_initial': StationCodeDFA.INITIAL_STATE,
            'F_accepting': list(StationCodeDFA.FINAL_STATES),
            'dead_state': 'q_dead',
            'state_descriptions': StationCodeDFA.STATE_DESCRIPTIONS,
            'transitions': [
                {'from': 'q0', 'char_class': '[A-Z]', 'to': 'q1', 'description': 'First uppercase letter'},
                {'from': 'q0', 'char_class': 'Other', 'to': 'q_dead', 'description': 'Invalid starting character'},
                {'from': 'q1', 'char_class': '[A-Z]', 'to': 'q2', 'description': 'Second uppercase letter'},
                {'from': 'q1', 'char_class': 'Other', 'to': 'q_dead', 'description': 'Expected letter'},
                {'from': 'q2', 'char_class': '[A-Z]', 'to': 'q3', 'description': 'Third uppercase letter'},
                {'from': 'q2', 'char_class': 'Other', 'to': 'q_dead', 'description': 'Expected letter'},
                {'from': 'q3', 'char_class': '[0-9]', 'to': 'q4', 'description': 'First digit'},
                {'from': 'q3', 'char_class': 'Other', 'to': 'q_dead', 'description': 'Expected digit'},
                {'from': 'q4', 'char_class': '[0-9]', 'to': 'q5', 'description': 'Second digit (Accepting)'},
                {'from': 'q4', 'char_class': 'Other', 'to': 'q_dead', 'description': 'Expected digit'},
                {'from': 'q5', 'char_class': 'Any', 'to': 'q_dead', 'description': 'Exceeded maximum length (5 chars)'},
                {'from': 'q_dead', 'char_class': 'Any', 'to': 'q_dead', 'description': 'Trap loop'}
            ]
        }

    @staticmethod
    def transition(current_state: str, char: str) -> Tuple[str, str]:
        """Transition function delta(q, c) -> (next_state, explanation)"""
        if current_state == 'q0':
            if 'A' <= char <= 'Z':
                return 'q1', f"Valid 1st uppercase character '{char}' -> Transition to q1"
            return 'q_dead', f"Invalid char '{char}' at pos 1: Expected uppercase [A-Z] -> Trap state q_dead"
            
        elif current_state == 'q1':
            if 'A' <= char <= 'Z':
                return 'q2', f"Valid 2nd uppercase character '{char}' -> Transition to q2"
            return 'q_dead', f"Invalid char '{char}' at pos 2: Expected uppercase [A-Z] -> Trap state q_dead"
            
        elif current_state == 'q2':
            if 'A' <= char <= 'Z':
                return 'q3', f"Valid 3rd uppercase character '{char}' -> Transition to q3"
            return 'q_dead', f"Invalid char '{char}' at pos 3: Expected uppercase [A-Z] -> Trap state q_dead"
            
        elif current_state == 'q3':
            if '0' <= char <= '9':
                return 'q4', f"Valid 1st digit '{char}' -> Transition to q4"
            return 'q_dead', f"Invalid char '{char}' at pos 4: Expected digit [0-9] -> Trap state q_dead"
            
        elif current_state == 'q4':
            if '0' <= char <= '9':
                return 'q5', f"Valid 2nd digit '{char}' -> Transition to accepting final state q5"
            return 'q_dead', f"Invalid char '{char}' at pos 5: Expected digit [0-9] -> Trap state q_dead"
            
        elif current_state == 'q5':
            return 'q_dead', f"Unexpected trailing character '{char}' after accepting state -> Trap state q_dead"
            
        else:  # q_dead
            return 'q_dead', f"Character '{char}' processed in trap state q_dead -> Remains in q_dead"

    @classmethod
    def simulate(cls, code: str) -> Dict[str, Any]:
        """
        Simulates the DFA on the input string step-by-step.
        Returns execution trace, final state, and acceptance status.
        """
        if not code or not isinstance(code, str):
            return {
                'accepted': False,
                'final_state': 'q0',
                'reason': 'Input is empty or missing.',
                'steps': [{
                    'step': 0,
                    'char': None,
                    'from_state': None,
                    'to_state': 'q0',
                    'explanation': 'Input is empty. DFA remains in initial state q0 (non-accepting).'
                }]
            }

        current_state = cls.INITIAL_STATE
        steps = [{
            'step': 0,
            'char': None,
            'from_state': None,
            'to_state': current_state,
            'explanation': f"Start at initial state {current_state}: {cls.STATE_DESCRIPTIONS[current_state]}"
        }]

        for idx, char in enumerate(code, start=1):
            next_state, explanation = cls.transition(current_state, char)
            steps.append({
                'step': idx,
                'char': char,
                'position': idx,
                'from_state': current_state,
                'to_state': next_state,
                'explanation': explanation
            })
            current_state = next_state

        is_accepted = current_state in cls.FINAL_STATES

        if is_accepted:
            reason = f"Accepted by DFA: Input '{code}' successfully transitioned to final state q5."
        elif current_state == 'q_dead':
            reason = f"Rejected by DFA: Input '{code}' transitioned to trap/dead state q_dead due to format mismatch."
        else:
            reason = f"Rejected by DFA: Incomplete input '{code}'. Execution terminated at non-accepting state {current_state} (expected 5 characters: 3 letters + 2 digits)."

        return {
            'accepted': is_accepted,
            'final_state': current_state,
            'reason': reason,
            'steps': steps
        }


class IncidentCodeDFA:
    """
    DFA for Incident Code validation.
    Enforces specified prefixes: SIG, TRK, ELE.
    Configured suffix format: Hyphen '-' followed by 3 numeric digits [0-9]{3}.
    Total length: 7 characters (e.g. SIG-101, TRK-202, ELE-305).
    """

    STATES = [
        'i0',           # Initial
        'i_S', 'i_SI',  # SIG branch
        'i_T', 'i_TR',  # TRK branch
        'i_E', 'i_EL',  # ELE branch
        'i_PRE_OK',     # Prefix accepted (SIG, TRK, or ELE)
        'i_HYPHEN',     # Hyphen '-' received
        'i_D1',         # 1st digit received
        'i_D2',         # 2nd digit received
        'i_ACCEPT',     # 3rd digit received (Accepting)
        'i_DEAD'        # Trap / Rejection
    ]
    INITIAL_STATE = 'i0'
    FINAL_STATES = {'i_ACCEPT'}

    @classmethod
    def simulate(cls, code: str) -> Dict[str, Any]:
        if not code or not isinstance(code, str):
            return {
                'accepted': False,
                'final_state': 'i0',
                'prefix': None,
                'reason': 'Incident code is empty or missing.',
                'steps': []
            }

        current = cls.INITIAL_STATE
        steps = [{
            'step': 0,
            'char': None,
            'from_state': None,
            'to_state': current,
            'explanation': 'Start at initial state i0 (awaiting prefix S, T, or E).'
        }]
        detected_prefix = None

        for idx, char in enumerate(code, start=1):
            prev = current
            
            if current == 'i0':
                if char == 'S':
                    current = 'i_S'
                    exp = "Prefix branch: 'S' recognized -> Transition to i_S"
                elif char == 'T':
                    current = 'i_T'
                    exp = "Prefix branch: 'T' recognized -> Transition to i_T"
                elif char == 'E':
                    current = 'i_E'
                    exp = "Prefix branch: 'E' recognized -> Transition to i_E"
                else:
                    current = 'i_DEAD'
                    exp = f"Invalid start char '{char}'. Allowed prefixes: SIG, TRK, ELE -> i_DEAD"
                    
            elif current == 'i_S':
                if char == 'I':
                    current = 'i_SI'
                    exp = "'I' received after 'S' -> Transition to i_SI"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected 'I' after 'S', got '{char}' -> i_DEAD"

            elif current == 'i_SI':
                if char == 'G':
                    current = 'i_PRE_OK'
                    detected_prefix = 'SIG'
                    exp = "Prefix 'SIG' (Signal-Failure) validated -> Transition to i_PRE_OK"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected 'G' after 'SI', got '{char}' -> i_DEAD"

            elif current == 'i_T':
                if char == 'R':
                    current = 'i_TR'
                    exp = "'R' received after 'T' -> Transition to i_TR"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected 'R' after 'T', got '{char}' -> i_DEAD"

            elif current == 'i_TR':
                if char == 'K':
                    current = 'i_PRE_OK'
                    detected_prefix = 'TRK'
                    exp = "Prefix 'TRK' (Track-Obstruction) validated -> Transition to i_PRE_OK"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected 'K' after 'TR', got '{char}' -> i_DEAD"

            elif current == 'i_E':
                if char == 'L':
                    current = 'i_EL'
                    exp = "'L' received after 'E' -> Transition to i_EL"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected 'L' after 'E', got '{char}' -> i_DEAD"

            elif current == 'i_EL':
                if char == 'E':
                    current = 'i_PRE_OK'
                    detected_prefix = 'ELE'
                    exp = "Prefix 'ELE' (Electrical) validated -> Transition to i_PRE_OK"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected 'E' after 'EL', got '{char}' -> i_DEAD"

            elif current == 'i_PRE_OK':
                if char == '-':
                    current = 'i_HYPHEN'
                    exp = "Delimiter '-' received -> Transition to i_HYPHEN"
                elif '0' <= char <= '9':
                    # Allow without hyphen as well (e.g. SIG101)
                    current = 'i_D1'
                    exp = f"1st numeric digit '{char}' received (no hyphen) -> Transition to i_D1"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected '-' or digit after prefix, got '{char}' -> i_DEAD"

            elif current == 'i_HYPHEN':
                if '0' <= char <= '9':
                    current = 'i_D1'
                    exp = f"1st numeric digit '{char}' received -> Transition to i_D1"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected digit [0-9] after hyphen, got '{char}' -> i_DEAD"

            elif current == 'i_D1':
                if '0' <= char <= '9':
                    current = 'i_D2'
                    exp = f"2nd numeric digit '{char}' received -> Transition to i_D2"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected digit [0-9], got '{char}' -> i_DEAD"

            elif current == 'i_D2':
                if '0' <= char <= '9':
                    current = 'i_ACCEPT'
                    exp = f"3rd numeric digit '{char}' received -> Final accepting state i_ACCEPT"
                else:
                    current = 'i_DEAD'
                    exp = f"Expected digit [0-9], got '{char}' -> i_DEAD"

            elif current == 'i_ACCEPT':
                current = 'i_DEAD'
                exp = f"Unexpected extra char '{char}' after complete code -> i_DEAD"

            else:  # i_DEAD
                exp = f"Character '{char}' processed in dead state -> Remains i_DEAD"

            steps.append({
                'step': idx,
                'char': char,
                'position': idx,
                'from_state': prev,
                'to_state': current,
                'explanation': exp
            })

        is_accepted = current in cls.FINAL_STATES
        if is_accepted:
            reason = f"Accepted: Valid incident code '{code}' with prefix '{detected_prefix}' and valid numeric suffix."
        elif current == 'i_DEAD':
            reason = f"Rejected: Malformed incident code '{code}'. Prefix must be SIG, TRK, or ELE followed by -[0-9]{{3}}."
        else:
            reason = f"Rejected: Incomplete incident code '{code}'. Stopped at state '{current}'."

        return {
            'accepted': is_accepted,
            'final_state': current,
            'prefix': detected_prefix,
            'reason': reason,
            'steps': steps
        }


class AutomataValidator:
    """
    Dual Validation Engine (BCS503):
    Compares DFA state transition simulation against Regular Expression verification.
    Guarantees both reject/accept exactly the same set of inputs.
    """

    STATION_REGEX = re.compile(r'^[A-Z]{3}[0-9]{2}$')
    # Configurable incident code pattern: prefix SIG|TRK|ELE with optional hyphen and 3 digits
    INCIDENT_REGEX = re.compile(r'^(SIG|TRK|ELE)-?[0-9]{3}$')

    @classmethod
    def validate_station_code(cls, station_code: str) -> Dict[str, Any]:
        """Validates station code using both DFA simulation and regular expression."""
        clean_code = (station_code or "").strip()
        
        # 1. Run DFA Simulation
        dfa_result = StationCodeDFA.simulate(clean_code)
        
        # 2. Run Regular Expression Evaluation
        regex_matched = bool(cls.STATION_REGEX.match(clean_code))
        
        # 3. Check Agreement
        both_agree = (dfa_result['accepted'] == regex_matched)
        
        if not both_agree:
            validation_reason = "CRITICAL ANOMALY: DFA simulation and Regular Expression disagreement."
        elif dfa_result['accepted']:
            validation_reason = f"Valid station code '{clean_code}'. DFA and Regex both accepted (3 letters + 2 digits)."
        else:
            validation_reason = dfa_result['reason']

        return {
            'input': clean_code,
            'identifier_type': 'STATION_CODE',
            'is_valid': dfa_result['accepted'] and regex_matched,
            'dfa_result': dfa_result['accepted'],
            'regex_result': regex_matched,
            'agreement': both_agree,
            'validation_reason': validation_reason,
            'dfa_final_state': dfa_result['final_state'],
            'dfa_steps': dfa_result['steps'],
            'regex_pattern': '^[A-Z]{3}[0-9]{2}$'
        }

    @classmethod
    def validate_incident_code(cls, incident_code: str) -> Dict[str, Any]:
        """Validates incident code using both DFA simulation and regular expression."""
        clean_code = (incident_code or "").strip()
        
        # 1. Run DFA Simulation
        dfa_result = IncidentCodeDFA.simulate(clean_code)
        
        # 2. Run Regular Expression Evaluation
        regex_matched = bool(cls.INCIDENT_REGEX.match(clean_code))
        
        # 3. Check Agreement
        both_agree = (dfa_result['accepted'] == regex_matched)
        
        if not both_agree:
            validation_reason = "CRITICAL ANOMALY: Incident code DFA and Regex disagreement."
        elif dfa_result['accepted']:
            validation_reason = f"Valid incident code '{clean_code}'. DFA and Regex both accepted (Prefix: {dfa_result['prefix']})."
        else:
            validation_reason = dfa_result['reason']

        return {
            'input': clean_code,
            'identifier_type': 'INCIDENT_CODE',
            'is_valid': dfa_result['accepted'] and regex_matched,
            'dfa_result': dfa_result['accepted'],
            'regex_result': regex_matched,
            'agreement': both_agree,
            'prefix': dfa_result.get('prefix'),
            'validation_reason': validation_reason,
            'dfa_final_state': dfa_result['final_state'],
            'dfa_steps': dfa_result['steps'],
            'regex_pattern': '^(SIG|TRK|ELE)-?[0-9]{3}$'
        }
