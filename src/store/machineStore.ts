import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DfaMachine,
  DfaTransition,
  MachineState,
  PdaMachine,
  PdaRule,
  PdaTransition,
  TmDirection,
  TmMachine,
  TmTransition,
} from '../types/machine';

const newId = () => Math.random().toString(36).slice(2, 10);

const emptyDfa = (): DfaMachine => ({ kind: 'dfa', states: [], transitions: [] });
const emptyPda = (): PdaMachine => ({ kind: 'pda', states: [], transitions: [] });
const emptyTm = (): TmMachine => ({ kind: 'tm', states: [], transitions: [] });

interface MachinesState {
  dfa: DfaMachine;
  pda: PdaMachine;
  tm: TmMachine;

  // generic state actions (apply to whichever machine is targeted)
  addState: (kind: 'dfa' | 'pda' | 'tm', x: number, y: number) => string;
  updateState: (kind: 'dfa' | 'pda' | 'tm', id: string, patch: Partial<MachineState>) => void;
  deleteState: (kind: 'dfa' | 'pda' | 'tm', id: string) => void;
  setStart: (kind: 'dfa' | 'pda' | 'tm', id: string) => void;
  toggleAccepting: (kind: 'dfa' | 'pda' | 'tm', id: string) => void;
  clear: (kind: 'dfa' | 'pda' | 'tm') => void;

  // DFA-specific
  addDfaTransition: (from: string, to: string, letters?: string[]) => string;
  updateDfaTransition: (id: string, patch: Partial<DfaTransition>) => void;
  deleteTransition: (kind: 'dfa' | 'pda' | 'tm', id: string) => void;

  // PDA
  addPdaTransition: (from: string, to: string) => string;
  setPdaRules: (id: string, rules: PdaRule[]) => void;

  // TM
  addTmTransition: (from: string, to: string) => string;
  updateTmTransition: (id: string, patch: Partial<TmTransition>) => void;
}

export const useMachineStore = create<MachinesState>()(
  persist(
    (set) => ({
      dfa: emptyDfa(),
      pda: emptyPda(),
      tm: emptyTm(),

      addState: (kind, x, y) => {
        const id = newId();
        set((s) => {
          const machine = s[kind];
          const label = `q${machine.states.length}`;
          const state: MachineState = {
            id,
            label,
            isAccepting: false,
            isStart: machine.states.length === 0,
            x,
            y,
          };
          return { ...s, [kind]: { ...machine, states: [...machine.states, state] } };
        });
        return id;
      },

      updateState: (kind, id, patch) =>
        set((s) => {
          const machine = s[kind];
          return {
            ...s,
            [kind]: {
              ...machine,
              states: machine.states.map((st) => (st.id === id ? { ...st, ...patch } : st)),
            },
          };
        }),

      deleteState: (kind, id) =>
        set((s) => {
          const machine = s[kind];
          return {
            ...s,
            [kind]: {
              ...machine,
              states: machine.states.filter((st) => st.id !== id),
              transitions: (machine.transitions as Array<{ from: string; to: string }>).filter(
                (t) => t.from !== id && t.to !== id,
              ),
            } as typeof machine,
          };
        }),

      setStart: (kind, id) =>
        set((s) => {
          const machine = s[kind];
          return {
            ...s,
            [kind]: {
              ...machine,
              states: machine.states.map((st) => ({ ...st, isStart: st.id === id })),
            },
          };
        }),

      toggleAccepting: (kind, id) =>
        set((s) => {
          const machine = s[kind];
          return {
            ...s,
            [kind]: {
              ...machine,
              states: machine.states.map((st) =>
                st.id === id ? { ...st, isAccepting: !st.isAccepting } : st,
              ),
            },
          };
        }),

      clear: (kind) =>
        set((s) => ({
          ...s,
          [kind]: kind === 'dfa' ? emptyDfa() : kind === 'pda' ? emptyPda() : emptyTm(),
        })),

      addDfaTransition: (from, to, letters = []) => {
        const id = newId();
        set((s) => ({
          ...s,
          dfa: { ...s.dfa, transitions: [...s.dfa.transitions, { id, from, to, letters }] },
        }));
        return id;
      },

      updateDfaTransition: (id, patch) =>
        set((s) => ({
          ...s,
          dfa: {
            ...s.dfa,
            transitions: s.dfa.transitions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          },
        })),

      deleteTransition: (kind, id) =>
        set((s) => {
          const machine = s[kind];
          return {
            ...s,
            [kind]: {
              ...machine,
              transitions: (machine.transitions as Array<{ id: string }>).filter((t) => t.id !== id),
            } as typeof machine,
          };
        }),

      addPdaTransition: (from, to) => {
        const id = newId();
        const t: PdaTransition = { id, from, to, rules: [{ read: '', pop: '', pushMode: 'push', push: '' }] };
        set((s) => ({ ...s, pda: { ...s.pda, transitions: [...s.pda.transitions, t] } }));
        return id;
      },

      setPdaRules: (id, rules) =>
        set((s) => ({
          ...s,
          pda: {
            ...s.pda,
            transitions: s.pda.transitions.map((t) => (t.id === id ? { ...t, rules } : t)),
          },
        })),

      addTmTransition: (from, to) => {
        const id = newId();
        const t: TmTransition = { id, from, to, read: '', write: '', direction: 'R' as TmDirection };
        set((s) => ({ ...s, tm: { ...s.tm, transitions: [...s.tm.transitions, t] } }));
        return id;
      },

      updateTmTransition: (id, patch) =>
        set((s) => ({
          ...s,
          tm: {
            ...s.tm,
            transitions: s.tm.transitions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          },
        })),
    }),
    { name: 'computation-models-v2' },
  ),
);

// Re-export so consumers don't need to import the helper:
export const machineNewId = newId;
