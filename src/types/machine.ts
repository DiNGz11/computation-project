export type MachineKind = 'dfa' | 'pda' | 'tm';

export interface MachineState {
  id: string;
  label: string;
  isAccepting: boolean;
  isStart: boolean;
  x: number;
  y: number;
}

export interface DfaTransition {
  id: string;
  from: string;
  to: string;
  letters: string[];
}

export interface PdaRule {
  read: string;
  pop: string;
  pushMode: 'push' | 'pop' | 'none';
  push: string;
}

export interface PdaTransition {
  id: string;
  from: string;
  to: string;
  rules: PdaRule[];
}

export type TmDirection = 'L' | 'R' | 'S';

export interface TmTransition {
  id: string;
  from: string;
  to: string;
  read: string;
  write: string;
  direction: TmDirection;
}

export type AnyTransition = DfaTransition | PdaTransition | TmTransition;

export interface DfaMachine {
  kind: 'dfa';
  states: MachineState[];
  transitions: DfaTransition[];
}

export interface PdaMachine {
  kind: 'pda';
  states: MachineState[];
  transitions: PdaTransition[];
}

export interface TmMachine {
  kind: 'tm';
  states: MachineState[];
  transitions: TmTransition[];
}

export type Machine = DfaMachine | PdaMachine | TmMachine;

export interface Alert {
  id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  details?: string[];
}
