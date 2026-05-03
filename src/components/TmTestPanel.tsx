import { useEffect, useRef, useState } from 'react';
import { he } from '../i18n/he';
import type { TmMachine } from '../types/machine';
import { runTm, type TmConfig, TM_BLANK } from '../logic/tm';

interface Props {
  machine: TmMachine;
  onHighlightState: (id: string | null) => void;
}

export default function TmTestPanel({ machine, onHighlightState }: Props) {
  const [word, setWord] = useState('');
  const [steps, setSteps] = useState<TmConfig[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [stuck, setStuck] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(500);
  const timerRef = useRef<number | null>(null);

  const total = steps.length;
  const current = steps[stepIndex];

  useEffect(() => onHighlightState(current?.stateId ?? null), [current, onHighlightState]);

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= total - 1) { setPlaying(false); return; }
    timerRef.current = window.setTimeout(() => setStepIndex((i) => i + 1), speedMs);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [playing, stepIndex, total, speedMs]);

  const start = () => {
    const result = runTm(machine, word);
    setSteps(result.steps);
    setStepIndex(0);
    setAccepted(result.accepted);
    setStuck(result.stuck);
    setPlaying(true);
  };
  const reset = () => { setPlaying(false); setSteps([]); setStepIndex(0); setAccepted(null); setStuck(false); onHighlightState(null); };

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">{he.machines.tm.test.title}</h3>
      <label className="block text-xs text-gray-600">
        {he.test.inputLabel}
        <input dir="ltr" value={word} onChange={(e) => setWord(e.target.value)} placeholder={he.test.inputPlaceholder}
          className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono outline-none focus:border-purple-500" />
      </label>
      <div className="flex gap-2">
        <button onClick={start} disabled={playing} className="flex-1 px-2 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50">{he.test.run}</button>
        <button onClick={reset} className="px-2 py-1.5 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50">{he.test.reset}</button>
      </div>
      <label className="block text-xs text-gray-600">{he.test.speed}
        <input dir="ltr" type="range" min="100" max="1500" step="100" value={speedMs} onChange={(e) => setSpeedMs(Number(e.target.value))} className="w-full" />
      </label>

      {current && (
        <div dir="ltr" className="font-mono text-xs bg-gray-50 border rounded p-2">
          <div className="text-gray-500 mb-0.5">{he.test.tape}:</div>
          <div className="flex gap-0 overflow-x-auto">
            {current.tape.map((c, i) => (
              <span key={i} className={`min-w-[1.5em] text-center border-x border-gray-200 px-0.5 ${i === current.head ? 'bg-amber-300 font-bold' : 'bg-white'}`}>
                {c === TM_BLANK ? '␣' : c}
              </span>
            ))}
          </div>
        </div>
      )}

      {accepted !== null && stepIndex === total - 1 && !playing && (
        <div className={`text-center text-sm font-semibold p-2 rounded ${stuck ? 'bg-red-100 text-red-800' : accepted ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {stuck ? he.machines.tm.test.stuck : accepted ? he.test.accepted : he.test.rejected}
        </div>
      )}
    </section>
  );
}
