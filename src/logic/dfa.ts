import type { Alert, DfaMachine, MachineState } from '../types/machine';
import { he } from '../i18n/he';

export interface DfaStep {
  stateIds: string[];        // all active states at this point (NFA: can be multiple)
  letterIndex: number;
  matchedLetter: string | null;
  stuck: boolean;
}

export interface DfaRunResult {
  steps: DfaStep[];
  accepted: boolean;
  stuck: boolean;
}

const findStart = (m: DfaMachine): MachineState | undefined =>
  m.states.find((s) => s.isStart);

const findById = (m: DfaMachine, id: string): MachineState | undefined =>
  m.states.find((s) => s.id === id);

/**
 * Picks the first transition matching the letter.
 * If multiple match (NFA), we still pick deterministically by id order so
 * step-through animation is stable. The alerts panel will warn the user.
 */
export function nextState(m: DfaMachine, fromId: string, letter: string): string | null {
  const candidates = m.transitions
    .filter((t) => t.from === fromId && t.letters.includes(letter))
    .sort((a, b) => a.id.localeCompare(b.id));
  return candidates[0]?.to ?? null;
}

export function runDfa(m: DfaMachine, word: string): DfaRunResult {
  const start = findStart(m);
  if (!start) return { steps: [], accepted: false, stuck: true };

  const steps: DfaStep[] = [{
    stateIds: [start.id],
    letterIndex: 0,
    matchedLetter: null,
    stuck: false,
  }];
  let currentStates = new Set<string>([start.id]);

  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    const nextStates = new Set<string>();
    for (const stateId of currentStates) {
      m.transitions
        .filter((t) => t.from === stateId && t.letters.includes(letter))
        .forEach((t) => nextStates.add(t.to));
    }
    // All branches died — stuck
    if (nextStates.size === 0) {
      steps.push({ stateIds: [...currentStates], letterIndex: i, matchedLetter: letter, stuck: true });
      return { steps, accepted: false, stuck: true };
    }
    currentStates = nextStates;
    steps.push({
      stateIds: [...currentStates],
      letterIndex: i + 1,
      matchedLetter: letter,
      stuck: false,
    });
  }

  const accepted = [...currentStates].some(
    (id) => m.states.find((s) => s.id === id)?.isAccepting ?? false,
  );
  return { steps, accepted, stuck: false };
}

/**
 * Collects the implicit alphabet from all transition letters.
 */
export function alphabetOf(m: DfaMachine): string[] {
  const set = new Set<string>();
  for (const t of m.transitions) for (const l of t.letters) set.add(l);
  return [...set].sort();
}

export function validateDfa(m: DfaMachine): Alert[] {
  const alerts: Alert[] = [];
  let id = 0;
  const next = (level: Alert['level'], msg: string, details?: string[]): Alert => ({
    id: `a-${id++}`,
    level,
    message: msg,
    details,
  });

  const str = he.machines.dfa.alerts;

  if (m.states.length === 0) {
    alerts.push(next('info', str.emptyMachine));
    return alerts;
  }

  const starts = m.states.filter((s) => s.isStart);
  if (starts.length === 0) alerts.push(next('error', str.noStart));
  else if (starts.length > 1) alerts.push(next('error', str.multipleStarts));

  const accepting = m.states.filter((s) => s.isAccepting);
  if (accepting.length === 0) alerts.push(next('warn', str.noAccepting));

  // non-determinism — collect all cases into one grouped alert
  const seen = new Map<string, number>();
  for (const t of m.transitions) {
    for (const letter of t.letters) {
      const key = `${t.from}|${letter}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
  }
  const ndDetails: string[] = [];
  for (const [key, count] of seen) {
    if (count > 1) {
      const [from, letter] = key.split('|');
      const stateLabel = m.states.find((s) => s.id === from)?.label ?? from;
      ndDetails.push(str.nonDeterministicDetail(stateLabel, letter));
    }
  }
  if (ndDetails.length > 0) {
    alerts.push(next('warn', str.nonDeterministicSummary, ndDetails));
  }

  // completeness — collect all missing transitions into one grouped alert
  const alphabet = alphabetOf(m);
  const incDetails: string[] = [];
  if (alphabet.length > 0) {
    for (const s of m.states) {
      const fromLetters = new Set(
        m.transitions.filter((t) => t.from === s.id).flatMap((t) => t.letters),
      );
      for (const letter of alphabet) {
        if (!fromLetters.has(letter)) {
          incDetails.push(str.incompleteDetail(s.label, letter));
        }
      }
    }
  }
  if (incDetails.length > 0) {
    alerts.push(next('warn', str.incompleteSummary, incDetails));
  }

  // unreachable states
  if (starts.length === 1) {
    const reachable = new Set<string>([starts[0].id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of m.transitions) {
        if (reachable.has(t.from) && !reachable.has(t.to)) {
          reachable.add(t.to);
          changed = true;
        }
      }
    }
    for (const s of m.states) {
      if (!reachable.has(s.id)) {
        alerts.push(next('warn', str.unreachable(s.label)));
      }
    }
  }

  return alerts;
}
