import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  useEdges,
  useNodes,
  useReactFlow,
  Position,
  type EdgeProps,
} from '@xyflow/react';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { he } from '../../i18n/he';

export interface TransitionEdgeData {
  letters?: string[];          // DFA
  pdaRules?: string[];          // PDA: one formatted string per rule, stacked
  tmSummary?: string;           // TM: "a→b, R" style
  highlighted?: boolean;
  hasReverse?: boolean;         // true when a transition in the opposite direction also exists
  newlyCreated?: boolean;       // auto-open the label editor on first mount
  onUpdateLetters?: (id: string, letters: string[]) => void;
  onClickEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  pdaEditor?: ReactNode;        // when set on a PDA edge, rendered in place of the label
}

// Source starts flush with the circle edge; target is pushed out to leave room for the arrowhead.
const SOURCE_RADIUS = 40;
const TARGET_RADIUS = 46;

// Perpendicular offset (at control point) for bidirectional parallel edges.
const PARALLEL_OFFSET = 48;

export default function TransitionEdge(props: EdgeProps) {
  const {
    id, source, target,
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    selected, data,
  } = props;
  const d = data as unknown as TransitionEdgeData | undefined;

  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const allEdges = useEdges();
  const allNodes = useNodes();
  const { flowToScreenPosition } = useReactFlow();

  const [editing, setEditing] = useState(() => !!(d?.newlyCreated && d?.letters !== undefined));
  const [draft, setDraft] = useState((d?.letters ?? []).join(','));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setDraft((d?.letters ?? []).join(',')); }, [d?.letters]);

  const isDfa = d?.letters !== undefined;
  const isPda = Array.isArray(d?.pdaRules);

  const commit = () => {
    setEditing(false);
    if (!isDfa) return;
    const letters = draft
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    d?.onUpdateLetters?.(id, letters);
  };

  const isSelfLoop = source === target;

  // ── Floating edge: perimeter-to-perimeter connection ──
  let effSx = sourceX, effSy = sourceY, effTx = targetX, effTy = targetY;
  let effSp = sourcePosition, effTp = targetPosition;
  let nx = 0, ny = 0; // unit direction vector (source → target)

  if (!isSelfLoop && sourceNode && targetNode) {
    const scx = sourceNode.internals.positionAbsolute.x + 40;
    const scy = sourceNode.internals.positionAbsolute.y + 40;
    const tcx = targetNode.internals.positionAbsolute.x + 40;
    const tcy = targetNode.internals.positionAbsolute.y + 40;
    const dx = tcx - scx;
    const dy = tcy - scy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      nx = dx / dist;
      ny = dy / dist;
      effSx = scx + nx * SOURCE_RADIUS;
      effSy = scy + ny * SOURCE_RADIUS;
      effTx = tcx - nx * TARGET_RADIUS;
      effTy = tcy - ny * TARGET_RADIUS;

      const angle = Math.atan2(dy, dx);
      if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
        effSp = Position.Right;  effTp = Position.Left;
      } else if (angle > Math.PI / 4 && angle <= (3 * Math.PI) / 4) {
        effSp = Position.Bottom; effTp = Position.Top;
      } else if (angle > (3 * Math.PI) / 4 || angle <= -(3 * Math.PI) / 4) {
        effSp = Position.Left;   effTp = Position.Right;
      } else {
        effSp = Position.Top;    effTp = Position.Bottom;
      }
    }
  }

  // ── Path calculation ──
  let edgePath: string;
  let edgeLabelX: number;
  let edgeLabelY: number;

  if (isSelfLoop && sourceNode) {
    const cx = sourceNode.internals.positionAbsolute.x + 40;
    const cy = sourceNode.internals.positionAbsolute.y + 40;

    // Count how many non-self-loop edges connected to this state point into each quadrant
    const sectorCounts = { top: 0, right: 0, bottom: 0, left: 0 };
    for (const edge of allEdges) {
      if (edge.id === id || edge.source === edge.target) continue;
      if (edge.source !== source && edge.target !== source) continue;
      const otherId = edge.source === source ? edge.target : edge.source;
      const otherNode = allNodes.find((n) => n.id === otherId);
      if (!otherNode) continue;
      const ox = otherNode.position.x + 40;
      const oy = otherNode.position.y + 40;
      const angle = Math.atan2(oy - cy, ox - cx);
      if (angle > -Math.PI / 4 && angle <= Math.PI / 4) sectorCounts.right++;
      else if (angle > Math.PI / 4 && angle <= (3 * Math.PI) / 4) sectorCounts.bottom++;
      else if (angle > -(3 * Math.PI) / 4 && angle <= -Math.PI / 4) sectorCounts.top++;
      else sectorCounts.left++;
    }

    // Pick the least-occupied side; prefer top, then right, then left, then bottom
    type Side = 'top' | 'right' | 'left' | 'bottom';
    const PRIORITY: Side[] = ['top', 'right', 'left', 'bottom'];
    const side = PRIORITY.reduce((best, s) =>
      sectorCounts[s] < sectorCounts[best] ? s : best,
    );

    const BUMP = 64;
    const SPREAD = 52; // perpendicular control-point spread
    const TANG = 8;    // tangent offset at connection points
    const LABEL_OFF = 46;

    if (side === 'top') {
      const ey = cy - 40;
      edgePath = `M ${cx - TANG} ${ey} C ${cx - SPREAD} ${ey - BUMP} ${cx + SPREAD} ${ey - BUMP} ${cx + TANG} ${ey}`;
      edgeLabelX = cx;
      edgeLabelY = ey - LABEL_OFF;
    } else if (side === 'bottom') {
      const ey = cy + 40;
      edgePath = `M ${cx - TANG} ${ey} C ${cx - SPREAD} ${ey + BUMP} ${cx + SPREAD} ${ey + BUMP} ${cx + TANG} ${ey}`;
      edgeLabelX = cx;
      edgeLabelY = ey + LABEL_OFF;
    } else if (side === 'right') {
      const ex = cx + 40;
      edgePath = `M ${ex} ${cy - TANG} C ${ex + BUMP} ${cy - SPREAD} ${ex + BUMP} ${cy + SPREAD} ${ex} ${cy + TANG}`;
      edgeLabelX = ex + LABEL_OFF;
      edgeLabelY = cy;
    } else {
      const ex = cx - 40;
      edgePath = `M ${ex} ${cy - TANG} C ${ex - BUMP} ${cy - SPREAD} ${ex - BUMP} ${cy + SPREAD} ${ex} ${cy + TANG}`;
      edgeLabelX = ex - LABEL_OFF;
      edgeLabelY = cy;
    }
  } else if (d?.hasReverse) {
    // Bidirectional pair: arc to one side using a quadratic bezier.
    // Perpendicular vector (rotated 90° CCW from direction): (-ny, nx)
    const px = -ny;
    const py = nx;
    // Shift endpoints sideways so the two arrows leave/arrive at distinct
    // points on each circle instead of overlapping at the same spot.
    const ENDPOINT_SHIFT = 12;
    const sx = effSx + px * ENDPOINT_SHIFT;
    const sy = effSy + py * ENDPOINT_SHIFT;
    const tx = effTx + px * ENDPOINT_SHIFT;
    const ty = effTy + py * ENDPOINT_SHIFT;
    const ctrlX = (sx + tx) / 2 + px * PARALLEL_OFFSET;
    const ctrlY = (sy + ty) / 2 + py * PARALLEL_OFFSET;
    edgePath = `M ${sx} ${sy} Q ${ctrlX} ${ctrlY} ${tx} ${ty}`;
    // Point on quadratic bezier at t=0.5: 0.25*P0 + 0.5*P1 + 0.25*P2
    edgeLabelX = 0.25 * sx + 0.5 * ctrlX + 0.25 * tx;
    edgeLabelY = 0.25 * sy + 0.5 * ctrlY + 0.25 * ty;
  } else {
    [edgePath, edgeLabelX, edgeLabelY] = getBezierPath({
      sourceX: effSx, sourceY: effSy, sourcePosition: effSp,
      targetX: effTx, targetY: effTy, targetPosition: effTp,
    });
  }

  const stroke = d?.highlighted ? '#d97706' : selected ? '#7c3aed' : '#4b5563';
  const strokeWidth = d?.highlighted ? 3 : 2;
  const markerId = `arrowhead-${id}`;

  const labelText = isDfa
    ? (d?.letters ?? []).join(', ')
    : (d?.tmSummary ?? '');

  return (
    <>
      {/* Per-edge arrowhead marker — color syncs with stroke */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerUnits="userSpaceOnUse"
          markerWidth="10"
          markerHeight="10"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{ stroke, strokeWidth }}
      />

      {isPda && d?.pdaEditor && (() => {
        const screen = flowToScreenPosition({ x: edgeLabelX, y: edgeLabelY });
        // Bubble sits above the transition label with a gap for the tail,
        // and a small downward triangle at the bottom that points to the label.
        const TAIL_GAP = 14;
        return createPortal(
          <div
            style={{
              position: 'fixed',
              left: screen.x,
              top: screen.y - TAIL_GAP,
              transform: 'translate(-50%, -100%)',
              zIndex: 9999,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
            dir="ltr"
          >
            <div className="relative">
              {d.pdaEditor}
              {/* Bubble tail: white fill matches popover body, V-stroke uses violet-300 for visibility */}
              <svg
                width="34"
                height="20"
                viewBox="0 0 34 20"
                className="absolute left-1/2 -translate-x-1/2"
                style={{ top: '100%', marginTop: '-2px', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.08))' }}
              >
                <polygon points="2,0 17,18 32,0" fill="white" />
                <polyline
                  points="2,0 17,18 32,0"
                  fill="none"
                  stroke="rgb(196 181 253)"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>,
          document.body,
        );
      })()}

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${edgeLabelX}px, ${edgeLabelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          dir="ltr"
        >
          {isPda && d?.pdaEditor ? (
            <span className="invisible">·</span>
          ) : editing && isDfa ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => {
                  // Strip non-letter/digit/comma chars, then cap each segment to 1 char
                  const raw = e.target.value.replace(/[^a-zA-Zא-ת0-9,]/g, '');
                  const parts = raw.split(',').map((p) => p.slice(0, 1));
                  setDraft(parts.join(','));
                }}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') {
                    setEditing(false);
                    setDraft((d?.letters ?? []).join(','));
                  }
                }}
                className="px-2 py-0.5 text-xs bg-white border border-purple-500 rounded-xl outline-none w-20 text-center"
                placeholder="a,b,c"
              />
              <button
                title={he.transition.deleteTransition}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setEditing(false); d?.onDelete?.(id); }}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 text-sm font-bold leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isDfa) setEditing(true);
                else d?.onClickEdit?.(id);
              }}
              className={`px-2.5 py-0.5 text-xs rounded-full border bg-white shadow-sm font-medium ${
                d?.highlighted
                  ? 'border-amber-400 text-amber-700 bg-amber-50'
                  : selected
                    ? 'border-purple-400 text-purple-700'
                    : 'border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-700'
              }`}
            >
              {isPda
                ? (d!.pdaRules!.length === 0
                    ? '?'
                    : d!.pdaRules!.map((r, i) => (
                        <div key={i} className="leading-tight font-mono">{r}</div>
                      )))
                : (labelText || '?')}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
