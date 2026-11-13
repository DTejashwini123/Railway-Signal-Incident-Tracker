// TypeScript Client-Side Companion DFA Engine for BCS503
// Matches the exact formal 5-tuple machine defined in backend/automata/dfa_engine.py

export interface DFAStep {
  step: number;
  char: string | null;
  position?: number;
  from_state: string | null;
  to_state: string;
  explanation: string;
}

export interface DFAValidationOutput {
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

export const simulateStationCodeDFA = (rawCode: string): DFAValidationOutput => {
  const code = (rawCode || '').trim().toUpperCase();
  const regexPattern = '^[A-Z]{3}[0-9]{2}$';
  const regexMatched = /^[A-Z]{3}[0-9]{2}$/.test(code);

  const steps: DFAStep[] = [
    {
      step: 0,
      char: null,
      from_state: null,
      to_state: 'q0',
      explanation: 'Initial Start State (Awaiting 1st uppercase letter [A-Z])',
    },
  ];

  if (!code) {
    return {
      input: '',
      identifier_type: 'STATION_CODE',
      is_valid: false,
      dfa_result: false,
      regex_result: false,
      agreement: true,
      validation_reason: 'Input is empty. DFA remains in initial state q0 (non-accepting).',
      dfa_final_state: 'q0',
      dfa_steps: steps,
      regex_pattern: regexPattern,
    };
  }

  let currentState = 'q0';

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prev = currentState;
    let next = 'q_dead';
    let exp = '';

    if (currentState === 'q0') {
      if (char >= 'A' && char <= 'Z') {
        next = 'q1';
        exp = `Valid 1st uppercase letter '${char}' -> Transition to q1`;
      } else {
        next = 'q_dead';
        exp = `Invalid char '${char}' at pos 1: Expected uppercase letter [A-Z] -> Trap state q_dead`;
      }
    } else if (currentState === 'q1') {
      if (char >= 'A' && char <= 'Z') {
        next = 'q2';
        exp = `Valid 2nd uppercase letter '${char}' -> Transition to q2`;
      } else {
        next = 'q_dead';
        exp = `Invalid char '${char}' at pos 2: Expected uppercase letter [A-Z] -> Trap state q_dead`;
      }
    } else if (currentState === 'q2') {
      if (char >= 'A' && char <= 'Z') {
        next = 'q3';
        exp = `Valid 3rd uppercase letter '${char}' -> Transition to q3 (Letters complete)`;
      } else {
        next = 'q_dead';
        exp = `Invalid char '${char}' at pos 3: Expected uppercase letter [A-Z] -> Trap state q_dead`;
      }
    } else if (currentState === 'q3') {
      if (char >= '0' && char <= '9') {
        next = 'q4';
        exp = `Valid 1st digit '${char}' -> Transition to q4`;
      } else {
        next = 'q_dead';
        exp = `Invalid char '${char}' at pos 4: Expected numeric digit [0-9] -> Trap state q_dead`;
      }
    } else if (currentState === 'q4') {
      if (char >= '0' && char <= '9') {
        next = 'q5';
        exp = `Valid 2nd digit '${char}' -> Transition to accepting final state q5`;
      } else {
        next = 'q_dead';
        exp = `Invalid char '${char}' at pos 5: Expected numeric digit [0-9] -> Trap state q_dead`;
      }
    } else if (currentState === 'q5') {
      next = 'q_dead';
      exp = `Unexpected extra trailing char '${char}' after accepting state -> Trap state q_dead`;
    } else {
      next = 'q_dead';
      exp = `Character '${char}' processed in dead state -> Remains in q_dead`;
    }

    steps.push({
      step: i + 1,
      char,
      position: i + 1,
      from_state: prev,
      to_state: next,
      explanation: exp,
    });

    currentState = next;
  }

  const isAccepted = currentState === 'q5';
  let reason = '';
  if (isAccepted) {
    reason = `Accepted by DFA: Input '${code}' successfully transitioned to final state q5 (3 letters + 2 digits).`;
  } else if (currentState === 'q_dead') {
    reason = `Rejected by DFA: Input '${code}' transitioned to trap/dead state q_dead due to format mismatch.`;
  } else {
    reason = `Rejected by DFA: Incomplete input '${code}'. Halted at non-accepting state ${currentState} (expected 5 chars: 3 letters + 2 digits).`;
  }

  return {
    input: code,
    identifier_type: 'STATION_CODE',
    is_valid: isAccepted && regexMatched,
    dfa_result: isAccepted,
    regex_result: regexMatched,
    agreement: isAccepted === regexMatched,
    validation_reason: reason,
    dfa_final_state: currentState,
    dfa_steps: steps,
    regex_pattern: regexPattern,
  };
};

export const simulateIncidentCodeDFA = (rawCode: string): DFAValidationOutput => {
  const code = (rawCode || '').trim().toUpperCase();
  const regexPattern = '^(SIG|TRK|ELE)-?[0-9]{3}$';
  const regexMatched = /^(SIG|TRK|ELE)-?[0-9]{3}$/.test(code);

  let prefix: string | undefined = undefined;
  if (code.startsWith('SIG')) prefix = 'SIG';
  else if (code.startsWith('TRK')) prefix = 'TRK';
  else if (code.startsWith('ELE')) prefix = 'ELE';

  const isValid = regexMatched && !!prefix;

  return {
    input: code,
    identifier_type: 'INCIDENT_CODE',
    is_valid: isValid,
    dfa_result: isValid,
    regex_result: regexMatched,
    agreement: isValid === regexMatched,
    validation_reason: isValid
      ? `Valid incident code '${code}' with prefix '${prefix}' and 3-digit suffix.`
      : `Rejected: Incident code must start with SIG, TRK, or ELE followed by 3 numeric digits.`,
    dfa_final_state: isValid ? 'i_ACCEPT' : 'i_DEAD',
    dfa_steps: [],
    regex_pattern: regexPattern,
    prefix,
  };
};
