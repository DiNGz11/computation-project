import { useState } from 'react';
import { he } from '../i18n/he';
import type { TmDirection, TmTransition } from '../types/machine';

interface Props {
  transition: TmTransition;
  onSave: (patch: Partial<TmTransition>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TmTransitionModal({ transition, onSave, onDelete, onClose }: Props) {
  const [read, setRead] = useState(transition.read);
  const [write, setWrite] = useState(transition.write);
  const [direction, setDirection] = useState<TmDirection>(transition.direction);

  const save = () => {
    onSave({ read: read.trim(), write: write.trim(), direction });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-80 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900">עריכת מעבר</h3>
        <Field label={he.transition.tmRead} value={read} onChange={setRead} />
        <Field label={he.transition.tmWrite} value={write} onChange={setWrite} />
        <div>
          <span className="text-xs font-medium text-gray-700">{he.transition.tmDirection}</span>
          <div className="mt-1 grid grid-cols-3 gap-1" dir="ltr">
            {(['L', 'S', 'R'] as TmDirection[]).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`px-2 py-1.5 text-sm rounded border ${
                  direction === d ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {d === 'L' ? '◀ ' + he.transition.tmLeft : d === 'R' ? he.transition.tmRight + ' ▶' : he.transition.tmStay}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={save} className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700">
            {he.buttons.save}
          </button>
          <button onClick={() => { onDelete(); onClose(); }} className="px-3 py-1.5 bg-white text-red-700 text-sm font-medium rounded border border-red-300 hover:bg-red-50">
            {he.state.delete}
          </button>
          <button onClick={onClose} className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50">
            {he.buttons.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-700">{label}</span>
      <input
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono outline-none focus:border-purple-500"
      />
    </label>
  );
}
