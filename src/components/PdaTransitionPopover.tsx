import { useEffect, useRef, useState } from 'react';
import { he } from '../i18n/he';
import type { PdaRule, PdaTransition } from '../types/machine';

interface Props {
  transition: PdaTransition;
  onSave: (rules: PdaRule[]) => void;
  onDelete: () => void;
  onClose: () => void;
}

const ALLOWED = /[^a-zA-Zא-ת0-9]/g;
const filterSingle = (v: string) => v.replace(ALLOWED, '').slice(0, 1);
const filterMulti = (v: string) => v.replace(ALLOWED, '');

export default function PdaTransitionPopover({ transition, onSave, onDelete, onClose }: Props) {
  const [rules, setRules] = useState<PdaRule[]>(
    transition.rules.length > 0
      ? transition.rules
      : [{ read: '', pop: '', pushMode: 'push', push: '' }],
  );
  const cardRef = useRef<HTMLDivElement>(null);

  const commit = (next: PdaRule[]) => {
    setRules(next);
    const trimmed = next.map((r) => ({
      read: r.read.trim(),
      pop: r.pop.trim(),
      pushMode: r.pushMode ?? 'push',
      push: (r.pushMode ?? 'push') === 'pop' ? '' : r.push.trim(),
    }));
    if (trimmed.length === 0) onDelete();
    else onSave(trimmed);
  };

  const updateRule = (i: number, patch: Partial<PdaRule>) =>
    commit(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRule = () =>
    commit([...rules, { read: '', pop: '', pushMode: 'push', push: '' }]);
  const removeRule = (i: number) => commit(rules.filter((_, idx) => idx !== i));

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={cardRef}
      className="animate-panel-in rounded-2xl overflow-hidden shadow-xl border border-violet-100 bg-white w-[24rem]"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 flex items-center justify-between">
        <h3 className="text-xs font-bold text-white tracking-wide">{he.transition.editTitle}</h3>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-sm leading-none transition-colors"
        >
          ×
        </button>
      </div>

      <div className="p-3 space-y-2">
        <div dir="ltr" className="flex items-center gap-1 pb-1 px-0.5">
          <span className="flex-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">
            {he.transition.pdaRead}
          </span>
          <span className="w-2" />
          <span className="flex-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">
            {he.transition.pdaPop}
          </span>
          <span className="w-2" />
          <span className="flex-[2] text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">
            {he.transition.pdaStackOp}
          </span>
          <span className="w-5" />
        </div>

        <div className="space-y-1.5">
          {rules.map((rule, i) => {
            const mode = rule.pushMode ?? 'push';
            return (
              <div key={i} dir="ltr" className="flex items-center gap-1">
                <input
                  dir="ltr"
                  value={rule.read}
                  onChange={(e) => updateRule(i, { read: filterSingle(e.target.value) })}
                  placeholder="⊥"
                  className="flex-1 min-w-0 px-1.5 py-1 border-2 border-gray-200 rounded-lg text-sm font-mono text-center outline-none focus:border-violet-400 bg-gray-50 focus:bg-white transition-colors"
                />
                <span className="text-gray-400 font-mono text-sm w-2 text-center flex-shrink-0">,</span>
                <input
                  dir="ltr"
                  value={rule.pop}
                  onChange={(e) => updateRule(i, { pop: filterSingle(e.target.value) })}
                  placeholder="⊥"
                  className="flex-1 min-w-0 px-1.5 py-1 border-2 border-gray-200 rounded-lg text-sm font-mono text-center outline-none focus:border-violet-400 bg-gray-50 focus:bg-white transition-colors"
                />
                <span className="text-gray-400 font-mono text-sm w-2 text-center flex-shrink-0">/</span>
                <div className="flex-[2] min-w-0 flex items-center gap-1">
                  <div className="flex rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => updateRule(i, { pushMode: 'push' })}
                      className={`px-1.5 py-1 transition-colors ${
                        mode === 'push'
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      PUSH
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRule(i, { pushMode: 'pop', push: '' })}
                      className={`px-1.5 py-1 border-l border-gray-200 transition-colors ${
                        mode === 'pop'
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      POP
                    </button>
                  </div>
                  {mode === 'push' && (
                    <input
                      dir="ltr"
                      value={rule.push}
                      onChange={(e) => updateRule(i, { push: filterMulti(e.target.value) })}
                      placeholder="⊥"
                      className="flex-1 min-w-0 px-1.5 py-1 border-2 border-gray-200 rounded-lg text-sm font-mono text-center outline-none focus:border-violet-400 bg-gray-50 focus:bg-white transition-colors"
                    />
                  )}
                </div>
                <button
                  aria-label={he.transition.removeRule}
                  onClick={() => removeRule(i)}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 text-xs font-bold leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={addRule}
          className="w-full px-3 py-1 border-2 border-dashed border-violet-200 text-violet-600 text-xs font-medium rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-all"
        >
          + {he.transition.addRule}
        </button>

        <div className="flex justify-end pt-1">
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="px-3 py-1 bg-white text-rose-600 text-xs font-medium rounded-lg border-2 border-rose-200 hover:bg-rose-50 hover:border-rose-400 transition-all"
          >
            {he.transition.deleteTransition}
          </button>
        </div>
      </div>
    </div>
  );
}
