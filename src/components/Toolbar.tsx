import { he } from '../i18n/he';

interface Props {
  onAddState: () => void;
  onClear: () => void;
  hint?: string;
}

export default function Toolbar({ onAddState, onClear, hint }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-purple-100 flex-shrink-0 shadow-sm">
      <button
        onClick={onAddState}
        className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-full hover:from-purple-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-150 active:scale-95"
      >
        + {he.toolbar.addState}
      </button>
      <button
        onClick={() => {
          if (confirm('לנקות את כל המכונה?')) onClear();
        }}
        className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-full border border-gray-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 shadow-sm transition-all duration-150 active:scale-95"
      >
        {he.toolbar.clearAll}
      </button>
      <span className="text-xs text-gray-400 mr-auto truncate max-w-xs">
        {hint ?? he.toolbar.helpHint}
      </span>
    </div>
  );
}
