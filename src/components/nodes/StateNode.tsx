import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useState, useRef, useEffect } from 'react';
import { he } from '../../i18n/he';

export interface StateNodeData {
  label: string;
  isAccepting: boolean;
  isStart: boolean;
  highlighted?: boolean;
  isTransitionSource?: boolean;
  onRename?: (id: string, label: string) => void;
  onToggleAccepting?: (id: string) => void;
  onSetStart?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddTransition?: (id: string) => void;
}

export default function StateNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as StateNodeData;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(d.label);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  useEffect(() => {
    setDraft(d.label);
  }, [d.label]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== d.label) d.onRename?.(id, draft.trim());
    else setDraft(d.label);
  };

  const ringColor = d.highlighted
    ? 'ring-4 ring-amber-400'
    : d.isTransitionSource
      ? 'ring-4 ring-emerald-400'
      : selected
        ? 'ring-[3px] ring-purple-500'
        : 'ring-2 ring-gray-300';

  const bgColor =
    d.isStart && d.isAccepting ? 'bg-gradient-to-br from-purple-50 to-emerald-50'
    : d.isStart                ? 'bg-purple-50'
    : d.isAccepting            ? 'bg-emerald-50'
    :                            'bg-white';

  return (
    <div className="relative group animate-pop-in">
      {/* Start arrow: to the LEFT of the state, tip pointing RIGHT into the circle */}
      {d.isStart && (
        <div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ right: 'calc(100% + 4px)' }}
        >
          <svg width="44" height="20" viewBox="0 0 44 20">
            <line x1="2" y1="10" x2="32" y2="10" stroke="#7c3aed" strokeWidth="2" />
            <polygon points="32,4 42,10 32,16" fill="#7c3aed" />
          </svg>
        </div>
      )}

      <div
        className={`relative w-20 h-20 rounded-full ${bgColor} ${ringColor} flex items-center justify-center shadow-md cursor-grab transition-all duration-150`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        {/* Inner ring for accepting state */}
        {d.isAccepting && (
          <div className="absolute inset-2 rounded-full ring-2 ring-gray-400 pointer-events-none" />
        )}

        {editing ? (
          <textarea
            ref={inputRef}
            value={draft}
            rows={2}
            onChange={(e) => {
              const val = e.target.value;
              if (val.split('\n').length <= 2 && val.length <= 20) setDraft(val);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setEditing(false);
                setDraft(d.label);
              }
            }}
            dir="rtl"
            className="w-[60px] text-center bg-transparent border-b border-purple-500 outline-none text-[10px] font-medium resize-none leading-tight overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            dir="rtl"
            className="text-[10px] font-bold text-gray-800 select-none text-center leading-tight whitespace-pre-wrap break-words w-[60px] max-h-[26px] overflow-hidden"
          >
            {d.label}
          </span>
        )}

        {/* Handles — invisible, all four sides for free-angle connections */}
        <Handle type="source" position={Position.Top}    id="t"    className="!opacity-0 !w-1 !h-1" />
        <Handle type="target" position={Position.Top}    id="t-in" className="!opacity-0 !w-1 !h-1" />
        <Handle type="source" position={Position.Bottom} id="b"    className="!opacity-0 !w-1 !h-1" />
        <Handle type="target" position={Position.Bottom} id="b-in" className="!opacity-0 !w-1 !h-1" />
        <Handle type="source" position={Position.Left}   id="l"    className="!opacity-0 !w-1 !h-1" />
        <Handle type="target" position={Position.Left}   id="l-in" className="!opacity-0 !w-1 !h-1" />
        <Handle type="source" position={Position.Right}  id="r"    className="!opacity-0 !w-1 !h-1" />
        <Handle type="target" position={Position.Right}  id="r-in" className="!opacity-0 !w-1 !h-1" />
      </div>

      {/* + button: add a transition starting from this state */}
      <button
        className="nodrag nopan absolute w-6 h-6 rounded-full bg-purple-500 hover:bg-purple-700 text-white text-base leading-none flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{ bottom: '-28px', left: '50%', transform: 'translateX(-50%)' }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          d.onAddTransition?.(id);
        }}
        title={he.editPanel.addTransition}
      >
        +
      </button>
    </div>
  );
}
