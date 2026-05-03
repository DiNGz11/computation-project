import { useState } from 'react';
import { he } from '../i18n/he';
import type { PdaRule, PdaTransition } from '../types/machine';

interface Props {
  transition: PdaTransition;
  onSave: (rules: PdaRule[]) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function PdaTransitionModal({ transition, onSave, onDelete, onClose }: Props) {
  const [rules, setRules] = useState<PdaRule[]>(transition.rules);

  const save = () => {
    const trimmed = rules.map((r) => ({
      read: r.read.trim(),
      pop: r.pop.trim(),
      pushMode: r.pushMode ?? 'push',
      push: (r.pushMode ?? 'push') === 'pop' ? '' : r.push.trim(),
    }));
    if (trimmed.length === 0) {
      onDelete();
    } else {
      onSave(trimmed);
    }
    onClose();
  };

  const addRule = () =>
    setRules((rs) => [...rs, { read: '', pop: '', pushMode: 'push', push: '' }]);
  const removeRule = (i: number) => setRules((rs) => rs.filter((_, idx) => idx !== i));
  const updateRule = (i: number, patch: Partial<PdaRule>) =>
    setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div
        className="rounded-2xl overflow-hidden shadow-xl border border-violet-100 w-[30rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide">{he.transition.editTitle}</h3>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-base leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="bg-white p-4 space-y-2">
          {/* Column headers */}
          <div className="flex items-center gap-1 pb-1">
            <span className="flex-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {he.transition.pdaRead}
            </span>
            <span className="w-3" />
            <span className="flex-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {he.transition.pdaPop}
            </span>
            <span className="w-3" />
            <span className="flex-[2] text-xs font-medium text-gray-500 uppercase tracking-wide">
              {he.transition.pdaStackOp}
            </span>
            <span className="w-6" />
          </div>

          {/* Rule rows */}
          <div className="space-y-1.5">
            {rules.map((rule, i) => {
              const mode = rule.pushMode ?? 'push';
              return (
                <div key={i} className="flex items-center gap-1">
                  {/* read */}
                  <input
                    dir="ltr"
                    value={rule.read}
                    onChange={(e) => updateRule(i, { read: e.target.value })}
                    placeholder="⊢"
                    className="flex-1 min-w-0 px-1.5 py-1 border-2 border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-violet-400 bg-gray-50 focus:bg-white transition-colors"
                  />
                  <span className="text-gray-400 font-mono text-sm w-3 text-center flex-shrink-0">,</span>
                  {/* pop */}
                  <input
                    dir="ltr"
                    value={rule.pop}
                    onChange={(e) => updateRule(i, { pop: e.target.value })}
                    placeholder="⊢"
                    className="flex-1 min-w-0 px-1.5 py-1 border-2 border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-violet-400 bg-gray-50 focus:bg-white transition-colors"
                  />
                  <span className="text-gray-400 font-mono text-sm w-3 text-center flex-shrink-0">/</span>
                  {/* push mode toggle + optional letters */}
                  <div className="flex-[2] min-w-0 flex items-center gap-1">
                    <div className="flex rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => updateRule(i, { pushMode: 'push' })}
                        className={`px-2 py-1 transition-colors ${
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
                        className={`px-2 py-1 border-l border-gray-200 transition-colors ${
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
                        onChange={(e) => updateRule(i, { push: e.target.value })}
                        placeholder="⊢"
                        className="flex-1 min-w-0 px-1.5 py-1 border-2 border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-violet-400 bg-gray-50 focus:bg-white transition-colors"
                      />
                    )}
                  </div>
                  {/* delete row */}
                  <button
                    aria-label={he.transition.removeRule}
                    onClick={() => removeRule(i)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 text-sm font-bold leading-none flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add rule */}
          <button
            onClick={addRule}
            className="w-full px-3 py-1.5 border-2 border-dashed border-violet-200 text-violet-600 text-sm font-medium rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-all"
          >
            + {he.transition.addRule}
          </button>

          {/* Footer */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 shadow-sm transition-all active:scale-95"
            >
              {he.buttons.save}
            </button>
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="px-3 py-2 bg-white text-rose-600 text-sm font-medium rounded-xl border-2 border-rose-200 hover:bg-rose-50 hover:border-rose-400 transition-all"
            >
              {he.state.delete}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-white text-gray-600 text-sm font-medium rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              {he.buttons.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
