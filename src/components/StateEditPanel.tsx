import { useState, useEffect } from 'react';
import { he } from '../i18n/he';
import type { MachineState } from '../types/machine';

interface Props {
  state: MachineState;
  onRename: (id: string, label: string) => void;
  onToggleAccepting: (id: string) => void;
  onSetStart: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function StateEditPanel({
  state, onRename, onToggleAccepting, onSetStart, onDelete, onClose,
}: Props) {
  const [draft, setDraft] = useState(state.label);

  useEffect(() => {
    setDraft(state.label);
  }, [state.id, state.label]);

  const applyRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== state.label) onRename(state.id, trimmed);
  };

  return (
    <div className="animate-panel-in rounded-2xl overflow-hidden shadow-xl border border-purple-100">
      {/* Coloured header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-wide">{he.editPanel.title}</h3>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-base leading-none transition-colors"
        >
          ×
        </button>
      </div>

      <div className="bg-white p-4 space-y-3">
        {/* State name */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {he.editPanel.stateName}
          </label>
          <textarea
            value={draft}
            rows={2}
            onChange={(e) => { const v = e.target.value; if (v.split('\n').length <= 2 && v.length <= 20) setDraft(v); }}
            onBlur={applyRename}
            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-colors bg-gray-50 focus:bg-white resize-none leading-snug"
            dir="rtl"
          />
        </div>

        {/* Accepting toggle */}
        <button
          onClick={() => onToggleAccepting(state.id)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all duration-150 ${
            state.isAccepting
              ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
              : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50'
          }`}
        >
          <span className={`text-sm font-medium ${state.isAccepting ? 'text-emerald-700' : 'text-gray-600'}`}>
            {he.editPanel.isAccepting}
          </span>
          <span
            dir="ltr"
            className={`inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              state.isAccepting ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                state.isAccepting ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>

        {/* Set as start */}
        {state.isStart ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border-2 border-purple-200">
            <span className="text-purple-500 text-sm">◀</span>
            <span className="text-xs font-semibold text-purple-700">{he.state.start}</span>
          </div>
        ) : (
          <button
            onClick={() => onSetStart(state.id)}
            className="w-full text-sm py-2 px-3 rounded-xl border-2 border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 font-medium transition-all duration-150"
          >
            {he.state.setStart}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(state.id)}
          className="w-full text-sm py-2 px-3 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 hover:border-rose-400 text-rose-600 font-medium transition-all duration-150 active:scale-95"
        >
          {he.editPanel.deleteState}
        </button>
      </div>
    </div>
  );
}
