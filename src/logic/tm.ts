import type { Alert, TmMachine } from '../types/machine';
import { he } from '../i18n/he';

export const TM_BLANK = '_';

export interface TmConfig {
  stateId: string;
  tape: string[];
  head: number;
  matchedLetter: string | null;
}

export interface TmRunResult {
  steps: TmConfig[];
  accepted: boolean;
  stuck: boolean;
  halted: boolean;
}

const readTape = (tape: string[], head: number) =>
  head >= 0 && head < tape.length ? tape[head] : TM_BLANK;

export function runTm(m: TmMachine, word: string, maxSteps = 5000): TmRunResult {
  const start = m.states.find((s) => s.isStart);
  if (!start) return { steps: [], accepted: false, stuck: true, halted: false };

  const tape = word.split('');
  if (tape.length === 0) tape.push(TM_BLANK);

  let cur: TmConfig = {
    stateId: start.id,
    tape: [...tape],
    head: 0,
    matchedLetter: null,
  };
  const steps: TmConfig[] = [cur];

  for (let step = 0; step < maxSteps; step++) {
    const sym = readTape(cur.tape, cur.head);
    const applicable = m.transitions
      .filter((t) => t.from === cur.stateId && t.read === sym)
      .sort((a, b) => a.id.localeCompare(b.id));

    if (applicable.length === 0) {
      const finalState = m.states.find((s) => s.id === cur.stateId);
      return {
        steps,
        accepted: !!finalState?.isAccepting,
        stuck: !finalState?.isAccepting,
        halted: true,
      };
    }

    const t = applicable[0];
    const newTape = [...cur.tape];
    while (cur.head >= newTape.length) newTape.push(TM_BLANK);
    if (cur.head < 0) {
      newTape.unshift(TM_BLANK);
      cur = { ...cur, head: 0 };
    }
    newTape[cur.head] = t.write || sym;

    let newHead = cur.head;
    if (t.direction === 'L') newHead--;
    else if (t.direction === 'R') newHead++;

    if (newHead < 0) {
      newTape.unshift(TM_BLANK);
      newHead = 0;
    }
    if (newHead >= newTape.length) newTape.push(TM_BLANK);

    cur = {
      stateId: t.to,
      tape: newTape,
      head: newHead,
      matchedLetter: sym,
    };
    steps.push(cur);
  }

  return { steps, accepted: false, stuck: true, halted: false };
}

export function validateTm(m: TmMachine): Alert[] {
  const alerts: Alert[] = [];
  let id = 0;
  const next = (level: Alert['level'], msg: string): Alert => ({
    id: `tm-${id++}`,
    level,
    message: msg,
  });

  const str = he.machines.tm.alerts;

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
