import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import Whiteboard from '../components/Whiteboard';
import Toolbar from '../components/Toolbar';
import AlertsPanel from '../components/AlertsPanel';
import TmTestPanel from '../components/TmTestPanel';
import TmTransitionModal from '../components/TmTransitionModal';
import StateNode, { type StateNodeData } from '../components/nodes/StateNode';
import TransitionEdge, { type TransitionEdgeData } from '../components/edges/TransitionEdge';
import { useMachineStore } from '../store/machineStore';
import { validateTm } from '../logic/tm';
import { he } from '../i18n/he';

const nodeTypes = { state: StateNode };
const edgeTypes = { transition: TransitionEdge };

export default function TmPage() {
  return (
    <ReactFlowProvider>
      <TmPageInner />
    </ReactFlowProvider>
  );
}

function summarizeTm(t: { read: string; write: string; direction: string }) {
  const r = t.read || 'ε';
  const w = t.write || 'ε';
  const arrow = t.direction === 'L' ? '◀' : t.direction === 'R' ? '▶' : '•';
  return `${r}→${w}, ${arrow}`;
}

function TmPageInner() {
  const machine = useMachineStore((s) => s.tm);
  const addState = useMachineStore((s) => s.addState);
  const updateState = useMachineStore((s) => s.updateState);
  const deleteState = useMachineStore((s) => s.deleteState);
  const setStart = useMachineStore((s) => s.setStart);
  const toggleAccepting = useMachineStore((s) => s.toggleAccepting);
  const clear = useMachineStore((s) => s.clear);
  const addTmTransition = useMachineStore((s) => s.addTmTransition);
  const updateTmTransition = useMachineStore((s) => s.updateTmTransition);
  const deleteTransition = useMachineStore((s) => s.deleteTransition);

  const [highlightStateId, setHighlightStateId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = useMemo(
    () => machine.transitions.find((t) => t.id === editingId) ?? null,
    [machine.transitions, editingId],
  );

  const nodes: Node[] = useMemo(
    () =>
      machine.states.map((s) => ({
        id: s.id,
        type: 'state',
        position: { x: s.x, y: s.y },
        data: {
          label: s.label,
          isAccepting: s.isAccepting,
          isStart: s.isStart,
          highlighted: highlightStateId === s.id,
          onRename: (id, label) => updateState('tm', id, { label }),
          onSetStart: (id) => setStart('tm', id),
          onToggleAccepting: (id) => toggleAccepting('tm', id),
          onDelete: (id) => deleteState('tm', id),
        } satisfies StateNodeData,
      })),
    [machine.states, highlightStateId, updateState, setStart, toggleAccepting, deleteState],
  );

  const edges: Edge[] = useMemo(
    () =>
      machine.transitions.map((t) => ({
        id: t.id,
        source: t.from,
        target: t.to,
        type: 'transition',
        data: {
          tmSummary: summarizeTm(t),
          onClickEdit: (id) => setEditingId(id),
        } satisfies TransitionEdgeData,
      })),
    [machine.transitions],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateState('tm', change.id, { x: change.position.x, y: change.position.y });
        }
        if (change.type === 'remove') deleteState('tm', change.id);
      }
    },
    [updateState, deleteState],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === 'remove') deleteTransition('tm', change.id);
      }
    },
    [deleteTransition],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      const id = addTmTransition(conn.source, conn.target);
      setEditingId(id);
    },
    [addTmTransition],
  );

  const handleAddState = () => {
    const states = machine.states;
    let x: number, y: number;
    if (states.length === 0) {
      x = 300; y = 200;
    } else {
      const base = states[states.length - 1];
      const angle = Math.random() * Math.PI * 2;
      const dist = 140 + Math.random() * 60;
      x = base.x + Math.cos(angle) * dist;
      y = base.y + Math.sin(angle) * dist;
    }
    addState('tm', x, y);
  };
  const alerts = useMemo(() => validateTm(machine), [machine]);

  return (
    <div className="h-full flex flex-col">
      <Toolbar onAddState={handleAddState} onClear={() => clear('tm')} />
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 bg-white">
          <Whiteboard
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
          />
        </div>
        <aside className="w-80 flex-shrink-0 bg-gray-50 border-s border-gray-200 p-3 space-y-3 overflow-y-auto">
          <TmTestPanel machine={machine} onHighlightState={setHighlightStateId} />
          <AlertsPanel alerts={alerts} strings={he.machines.tm.alerts} />
        </aside>
      </div>

      {editing && (
        <TmTransitionModal
          transition={editing}
          onSave={(patch) => updateTmTransition(editing.id, patch)}
          onDelete={() => deleteTransition('tm', editing.id)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
