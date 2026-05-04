import type { Alert, PdaMachine } from '../types/machine';
import { he } from '../i18n/he';

export interface PdaConfig {
  stateId: string;
  inputIndex: number;
  stack: string[]; // top is the last element
  matchedLetter: string | null;
}

export interface PdaRunResult {
  steps: PdaConfig[];
  accepted: boolean;
  stuck: boolean;
}

/**
 * Deterministic-ish PDA runner: at each step, picks the first applicable
 * transition (sorted by id). Empty `read` means epsilon (no input consumed).
 * The `pop` field is a PRECONDITION only — the rule applies if the stack top
 * equals it (empty = any top). The action is determined by `pushMode`:
 *  - 'push': push each character of `push` (no pop)
 *  - 'pop':  pop one element off the stack (no push)
 */
export function runPda(m: PdaMachine, word: string, maxSteps = 1000): PdaRunResult {
  const start = m.states.find((s) => s.isStart);
  if (!start) return { steps: [], accepted: false, stuck: true };

  const initial: PdaConfig = {
    stateId: start.id,
    inputIndex: 0,
    stack: [],
    matchedLetter: null,
  };
  const steps: PdaConfig[] = [initial];
  let cur = initial;

  for (let step = 0; step < maxSteps; step++) {
    const remainingChar = cur.inputIndex < word.length ? word[cur.inputIndex] : null;
    const stackTop = cur.stack[cur.stack.length - 1] ?? null;

    const applicable = m.transitions
      .filter((t) => t.from === cur.stateId)
      .flatMap((t) => t.rules.map((rule, idx) => ({ t, rule, idx })))
      .filter(({ rule }) => {
        if (rule.read && rule.read !== remainingChar) return false;
        if (rule.pop && rule.pop !== stackTop) return false;
        return true;
      })
      .sort((a, b) => (a.t.id + a.idx).localeCompare(b.t.id + b.idx));

    if (applicable.length === 0) {
      const finalState = m.states.find((s) => s.id === cur.stateId);
      const reachedEnd = cur.inputIndex === word.length;
      const accepted = reachedEnd && !!finalState?.isAccepting;
      // "Stuck" means we ran out of moves mid-word. Reaching the end of the
      // word in a non-accepting state is "rejected", not stuck.
      return { steps, accepted, stuck: !reachedEnd };
    }

    const { t, rule } = applicable[0];
    const newStack = [...cur.stack];
    if ((rule.pushMode ?? 'push') === 'pop') {
      newStack.pop();
    } else if (rule.push) {
      for (const ch of rule.push) newStack.push(ch);
    }

    cur = {
      stateId: t.to,
      inputIndex: rule.read ? cur.inputIndex + 1 : cur.inputIndex,
      stack: newStack,
      matchedLetter: rule.read || null,
    };
    steps.push(cur);

    if (cur.inputIndex === word.length) {
      // try to take any epsilon-transitions to reach accepting state
      // simple heuristic: stop here, check
      const finalState = m.states.find((s) => s.id === cur.stateId);
      if (finalState?.isAccepting) {
        return { steps, accepted: true, stuck: false };
      }
    }
  }
  return { steps, accepted: false, stuck: true };
}

export function validatePda(m: PdaMachine): Alert[] {
  const alerts: Alert[] = [];
  let id = 0;
  const next = (level: Alert['level'], msg: string): Alert => ({
    id: `pa-${id++}`,
    level,
    message: msg,
  });

  const str = he.machines.pda.alerts;

  if (m.states.length === 0) {
    alerts.push(next('info', str.emptyMachine));
    return alerts;
  }
  const starts = m.states.filter((s) => s.isStart);
  if (starts.length === 0) alerts.push(next('error', str.noStart));
  else if (starts.length > 1) alerts.push(next('error', str.multipleStarts));

  if (!m.states.some((s) => s.isAccepting)) {
    alerts.push(next('warn', str.noAccepting));
  }

  return alerts;
}
