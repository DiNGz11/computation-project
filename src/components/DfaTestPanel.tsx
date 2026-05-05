import { useCallback, useEffect, useRef, useState } from 'react';
import { he } from '../i18n/he';
import type { DfaMachine } from '../types/machine';
import { runDfa, type DfaStep } from '../logic/dfa';

interface Props {
  machine: DfaMachine;
  onHighlightStates: (ids: string[] | null) => void;
  onHighlightTransition: (id: string | null) => void;
}

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 2l4 5-4 5" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2L5 7l4 5" />
  </svg>
);

export default function DfaTestPanel({ machine, onHighlightStates, onHighlightTransition }: Props) {
  const [word, setWord] = useState('');
  const [steps, setSteps] = useState<DfaStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [stuck, setStuck] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(700);
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const displayTimeoutRef = useRef<number | null>(null);
  const isSteppingBackRef = useRef(false);
  const speedMsRef = useRef(700);
  useEffect(() => { speedMsRef.current = speedMs; }, [speedMs]);

  const SWEEP_MS = 600;

  const hasStart = machine.states.some((s) => s.isStart);
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];           // drives transition highlight
  const displayedStep = steps[displayedStepIndex]; // drives tape / state label

  const stopHighlight = useCallback(() => {
    if (displayTimeoutRef.current) {
      window.clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }
    onHighlightStates(null);
    onHighlightTransition(null);
  }, [onHighlightStates, onHighlightTransition]);

  useEffect(() => {
    if (!currentStep) { stopHighlight(); setDisplayedStepIndex(0); return; }

    const isBack = isSteppingBackRef.current;
    isSteppingBackRef.current = false;

    onHighlightStates(null);
    onHighlightTransition(currentStep.transitionId);

    const delay =
      !isBack && currentStep.transitionId && speedMsRef.current >= SWEEP_MS
        ? SWEEP_MS
        : 0;

    displayTimeoutRef.current = window.setTimeout(() => {
      displayTimeoutRef.current = null;
      onHighlightStates(currentStep.stateIds);
      setDisplayedStepIndex(stepIndex);
    }, delay);

    return () => {
      if (displayTimeoutRef.current) {
        window.clearTimeout(displayTimeoutRef.current);
        displayTimeoutRef.current = null;
      }
    };
  }, [stepIndex, steps, currentStep, onHighlightStates, onHighlightTransition, stopHighlight]);

  const showResult = useCallback((stepList: DfaStep[], idx: number) => {
    const last = stepList[idx];
    if (!last) return;
    if (last.stuck) {
      setStuck(true);
      setAccepted(false);
    } else {
      const acc = last.stateIds.some(
        (id) => machine.states.find((s) => s.id === id)?.isAccepting,
      ) ?? false;
      setAccepted(acc);
    }
  }, [machine.states]);

  const start = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (displayTimeoutRef.current) window.clearTimeout(displayTimeoutRef.current);
    const result = runDfa(machine, word);
    setSteps(result.steps);
    setStepIndex(0);
    setDisplayedStepIndex(0);
    setAccepted(null);
    setStuck(false);
    setPlaying(true);
  };

  const reset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (displayTimeoutRef.current) window.clearTimeout(displayTimeoutRef.current);
    setPlaying(false);
    setSteps([]);
    setStepIndex(0);
    setDisplayedStepIndex(0);
    setAccepted(null);
    setStuck(false);
    stopHighlight();
  };

  const pause = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPlaying(false);
  };

  const resume = () => setPlaying(true);

  const stepForward = () => {
    if (playing || stepIndex >= totalSteps - 1) return;
    const next = stepIndex + 1;
    setStepIndex(next);
    if (next >= totalSteps - 1) {
      timerRef.current = window.setTimeout(
        () => showResult(steps, totalSteps - 1),
        speedMsRef.current >= SWEEP_MS ? SWEEP_MS : 0,
      );
    }
  };

  const stepBack = () => {
    if (playing || stepIndex <= 0) return;
    isSteppingBackRef.current = true;
    setAccepted(null);
    setStuck(false);
    setStepIndex((i) => i - 1);
  };

  useEffect(() => {
    if (!playing) return;
    timerRef.current = window.setTimeout(() => {
      if (stepIndex >= totalSteps - 1) {
        setPlaying(false);
        stopHighlight();
        showResult(steps, totalSteps - 1);
      } else {
        setStepIndex((i) => i + 1);
      }
    }, speedMs);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [playing, stepIndex, totalSteps, speedMs, steps, stopHighlight, showResult]);

  useEffect(() => () => stopHighlight(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasSteps = steps.length > 0;
  const atEnd = hasSteps && stepIndex >= totalSteps - 1;
  const atStart = stepIndex <= 0;

  const displayedStateLabels = displayedStep?.stateIds
    .map((id) => machine.states.find((s) => s.id === id)?.label ?? id)
    .join(', ') ?? '';

  return (
    <section className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5">
        <h3 className="text-sm font-bold text-white">{he.machines.dfa.test.title}</h3>
      </div>

      <div className="bg-white p-3 space-y-2.5">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
          {he.test.inputLabel}
          <input
            dir="ltr"
            value={word}
            onChange={(e) => { setWord(e.target.value); reset(); }}
            placeholder={he.test.inputPlaceholder}
            className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-sky-400 bg-gray-50 focus:bg-white transition-colors"
          />
        </label>

        {!hasStart ? (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {he.test.noStart}
          </p>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={start}
              disabled={playing}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold rounded-full hover:from-sky-600 hover:to-indigo-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-150 active:scale-95"
            >
              {he.test.run}
            </button>
            <button
              onClick={reset}
              className="px-3 py-2 bg-white text-gray-600 text-sm font-medium rounded-full border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 active:scale-95"
            >
              {he.test.reset}
            </button>
          </div>
        )}

        {/* Step-by-step controls */}
        {hasSteps && (
          <div className="flex items-center gap-1">
            {/* Forward (logical-start in RTL = DOM-first) */}
            <button
              onClick={stepForward}
              disabled={playing || atEnd}
              title="צעד קדימה"
              className="w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 disabled:opacity-30 flex items-center justify-center transition-all"
            >
              <ChevronRight />
            </button>

            {/* Step counter — force LTR on numbers so bidi doesn't flip cur/total */}
            <span className="text-xs font-mono text-gray-500 tabular-nums flex items-center gap-0.5">
              <span>שלב</span>
              <span dir="ltr"> {stepIndex + 1} / {totalSteps}</span>
            </span>

            {/* Backward */}
            <button
              onClick={stepBack}
              disabled={playing || atStart}
              title="צעד אחורה"
              className="w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 disabled:opacity-30 flex items-center justify-center transition-all"
            >
              <ChevronLeft />
            </button>

            {/* Pause / Resume */}
            {playing ? (
              <button
                onClick={pause}
                className="flex-1 px-2 py-1.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border-2 border-amber-200 hover:bg-amber-200 transition-all"
              >
                {he.test.pause}
              </button>
            ) : (
              <button
                onClick={resume}
                disabled={atEnd}
                className="flex-1 px-2 py-1.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-200 disabled:opacity-30 transition-all"
              >
                {he.test.resume}
              </button>
            )}
          </div>
        )}

        {/* Speed bar */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-500">{he.test.speed}</span>
          <div dir="ltr" className="flex items-center gap-2">
            <span title="מהיר" className="text-base leading-none select-none">🐇</span>
            <input
              type="range"
              min="200" max="1500" step="100"
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="flex-1 accent-indigo-500"
              dir="ltr"
            />
            <span title="איטי" className="text-base leading-none select-none">🐢</span>
          </div>
        </div>

        {/* Word tape */}
        {hasSteps && (
          <div dir="ltr" className="animate-fade-up font-mono text-base bg-gray-50 border-2 border-gray-200 rounded-xl p-2.5 break-all">
            {word.split('').map((ch, i) => (
              <span
                key={i}
                className={
                  i < (displayedStep?.letterIndex ?? 0)
                    ? 'text-emerald-600'
                    : i === (displayedStep?.letterIndex ?? 0)
                      ? 'bg-amber-300 px-0.5 rounded-md'
                      : 'text-gray-400'
                }
              >
                {ch}
              </span>
            ))}
            {word.length === 0 && <span className="text-gray-400">ε</span>}
          </div>
        )}

        {/* Current state display */}
        {hasSteps && displayedStateLabels && (
          <div className="flex items-center gap-2 text-xs bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5">
            <span className="text-indigo-500 font-medium">{he.test.currentState}:</span>
            <span className="font-bold text-indigo-800">{displayedStateLabels}</span>
          </div>
        )}

        {/* Result badge */}
        {accepted !== null && (
          <div
            className={`animate-fade-up text-center text-sm font-bold py-2.5 px-3 rounded-xl ${
              stuck
                ? 'bg-amber-100 text-amber-800 border-2 border-amber-200'
                : accepted
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'
                  : 'bg-rose-100   text-rose-800   border-2 border-rose-200'
            }`}
          >
            {stuck ? he.machines.dfa.test.stuck : accepted ? he.test.accepted : he.test.rejected}
          </div>
        )}
      </div>
    </section>
  );
}
