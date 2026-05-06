import { useCallback, useEffect, useRef, useState } from 'react';
import { he } from '../i18n/he';
import type { PdaMachine } from '../types/machine';
import { runPda, type PdaConfig } from '../logic/pda';

interface Props {
  machine: PdaMachine;
  onHighlightState: (id: string | null) => void;
  onHighlightTransition: (id: string | null, drawMs?: number) => void;
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

export default function PdaTestPanel({ machine, onHighlightState, onHighlightTransition }: Props) {
  const [word, setWord] = useState('');
  const [steps, setSteps] = useState<PdaConfig[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [stuck, setStuck] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(700);
  const [runAccepted, setRunAccepted] = useState(false);
  const [runStuck, setRunStuck] = useState(false);
  // displayedStepIndex drives the tape/stack/state-label UI and lags behind
  // stepIndex by SWEEP_MS so the display only updates when the sweep arrives.
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const displayTimeoutRef = useRef<number | null>(null);
  const isSteppingBackRef = useRef(false);
  const speedMsRef = useRef(700);
  useEffect(() => { speedMsRef.current = speedMs; }, [speedMs]);

  const sweepDrawMs = Math.max(Math.min(Math.round(speedMs * 0.65), 600), 100);
  const SWEEP_MS = sweepDrawMs;

  const hasStart = machine.states.some((s) => s.isStart);
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];          // drives transition highlight
  const displayedStep = steps[displayedStepIndex]; // drives tape / stack / label
  const hasSteps = steps.length > 0;
  const atEnd = hasSteps && stepIndex >= totalSteps - 1;
  const atStart = stepIndex <= 0;

  const stopHighlight = useCallback(() => {
    if (displayTimeoutRef.current) {
      window.clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }
    onHighlightState(null);
    onHighlightTransition(null);
  }, [onHighlightState, onHighlightTransition]);

  useEffect(() => {
    if (!currentStep) { stopHighlight(); setDisplayedStepIndex(0); return; }

    const isBack = isSteppingBackRef.current;
    isSteppingBackRef.current = false;

    onHighlightState(null);
    onHighlightTransition(currentStep.transitionId, sweepDrawMs);

    // Skip delay when stepping back or when playback is faster than the sweep
    const delay =
      !isBack && currentStep.transitionId && speedMsRef.current >= SWEEP_MS
        ? SWEEP_MS
        : 0;

    displayTimeoutRef.current = window.setTimeout(() => {
      displayTimeoutRef.current = null;
      onHighlightState(currentStep.stateId);
      setDisplayedStepIndex(stepIndex);
    }, delay);

    return () => {
      if (displayTimeoutRef.current) {
        window.clearTimeout(displayTimeoutRef.current);
        displayTimeoutRef.current = null;
      }
    };
  }, [stepIndex, steps, currentStep, onHighlightState, onHighlightTransition, stopHighlight]);

  const showResult = useCallback((resAccepted: boolean, resStuck: boolean) => {
    setAccepted(resAccepted);
    setStuck(resStuck);
  }, []);

  const start = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (displayTimeoutRef.current) window.clearTimeout(displayTimeoutRef.current);
    const result = runPda(machine, word);
    setSteps(result.steps);
    setStepIndex(0);
    setDisplayedStepIndex(0);
    setAccepted(null);
    setStuck(false);
    setRunAccepted(result.accepted);
    setRunStuck(result.stuck);
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
    // Show result after the display delay so it appears together with the
    // stack/tape update rather than before the sweep completes.
    if (next >= totalSteps - 1) {
      timerRef.current = window.setTimeout(
        () => showResult(runAccepted, runStuck),
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
        showResult(runAccepted, runStuck);
      } else {
        setStepIndex((i) => i + 1);
      }
    }, speedMs);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [playing, stepIndex, totalSteps, speedMs, stopHighlight, showResult, runAccepted, runStuck]);

  useEffect(() => () => stopHighlight(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStateLabel = displayedStep
    ? (machine.states.find((s) => s.id === displayedStep.stateId)?.label ?? displayedStep.stateId)
    : '';

  return (
    <section className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-2.5">
        <h3 className="text-sm font-bold text-white">{he.machines.pda.test.title}</h3>
      </div>

      <div className="bg-white p-3 space-y-2.5">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
          {he.test.inputLabel}
          <input
            dir="ltr"
            value={word}
            onChange={(e) => { setWord(e.target.value); reset(); }}
            placeholder={he.test.inputPlaceholder}
            className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-violet-400 bg-gray-50 focus:bg-white transition-colors"
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
              className="flex-1 px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold rounded-full hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-150 active:scale-95"
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
            <button
              onClick={stepForward}
              disabled={playing || atEnd}
              title="צעד קדימה"
              className="w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50 text-gray-600 disabled:opacity-30 flex items-center justify-center transition-all"
            >
              <ChevronRight />
            </button>

            <span className="text-xs font-mono text-gray-500 tabular-nums flex items-center gap-0.5">
              <span>שלב</span>
              <span dir="ltr"> {stepIndex + 1} / {totalSteps}</span>
            </span>

            <button
              onClick={stepBack}
              disabled={playing || atStart}
              title="צעד אחורה"
              className="w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50 text-gray-600 disabled:opacity-30 flex items-center justify-center transition-all"
            >
              <ChevronLeft />
            </button>

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
                className="flex-1 px-2 py-1.5 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 border-2 border-violet-200 hover:bg-violet-200 disabled:opacity-30 transition-all"
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
              className="flex-1 accent-violet-500"
              dir="ltr"
            />
            <span title="איטי" className="text-base leading-none select-none">🐢</span>
          </div>
        </div>

        {/* Word tape */}
        {hasSteps && (
          <div dir="ltr" className="animate-fade-up font-mono text-base bg-gray-50 border-2 border-gray-200 rounded-xl p-2.5 break-all">
            <div className="text-[10px] text-gray-400 mb-1 font-sans">{he.test.tape}</div>
            {word.split('').map((ch, i) => (
              <span
                key={i}
                className={
                  i < (displayedStep?.inputIndex ?? 0)
                    ? 'text-emerald-600'
                    : i === (displayedStep?.inputIndex ?? 0)
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

        {/* Stack display */}
        {hasSteps && displayedStep && (
          <div dir="ltr" className="animate-fade-up bg-gray-50 border-2 border-gray-200 rounded-xl p-2.5">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[10px] text-gray-400 font-sans">{he.test.stack}</div>
              <div className="text-[10px] text-violet-500 font-mono">
                [{displayedStep.stack.join(',')}] · {displayedStep.stack.length}
              </div>
            </div>
            {displayedStep.stack.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '32px',
                    lineHeight: '32px',
                    borderLeft: '2px solid #d1d5db',
                    borderRight: '2px solid #d1d5db',
                    borderBottom: '2px solid #d1d5db',
                    borderBottomLeftRadius: '6px',
                    borderBottomRightRadius: '6px',
                    color: '#9ca3af',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                  }}
                >
                  ∅
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', maxHeight: '11rem', overflowY: 'auto' }}>
                <table style={{ display: 'inline-table', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          width: '40px',
                          height: '8px',
                          borderLeft: '2px dashed #d1d5db',
                          borderRight: '2px dashed #d1d5db',
                          padding: 0,
                        }}
                      />
                    </tr>
                    {displayedStep.stack.slice().reverse().map((c, i) => {
                      const stackPos = displayedStep.stack.length - 1 - i;
                      const isTop = i === 0;
                      return (
                        <tr key={`s${displayedStepIndex}-p${stackPos}`}>
                          <td
                            style={{
                              width: '40px',
                              height: '28px',
                              textAlign: 'center',
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              padding: 0,
                              borderLeft: `2px solid ${isTop ? '#a78bfa' : '#d1d5db'}`,
                              borderRight: `2px solid ${isTop ? '#a78bfa' : '#d1d5db'}`,
                              borderBottom: `2px solid ${isTop ? '#a78bfa' : '#d1d5db'}`,
                              background: isTop ? '#ede9fe' : '#ffffff',
                              color: isTop ? '#5b21b6' : '#4b5563',
                              fontWeight: isTop ? 700 : 400,
                            }}
                          >
                            {c}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td
                        style={{
                          width: '40px',
                          height: '4px',
                          borderLeft: '2px solid #d1d5db',
                          borderRight: '2px solid #d1d5db',
                          borderBottom: '2px solid #d1d5db',
                          borderBottomLeftRadius: '6px',
                          borderBottomRightRadius: '6px',
                          padding: 0,
                        }}
                      />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Current state display */}
        {hasSteps && currentStateLabel && (
          <div className="flex items-center gap-2 text-xs bg-violet-50 border border-violet-200 rounded-xl px-3 py-1.5">
            <span className="text-violet-500 font-medium">{he.test.currentState}:</span>
            <span className="font-bold text-violet-800">{currentStateLabel}</span>
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
            {stuck ? he.machines.pda.test.stuck : accepted ? he.test.accepted : he.test.rejected}
          </div>
        )}
      </div>
    </section>
  );
}
