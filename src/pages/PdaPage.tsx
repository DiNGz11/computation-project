import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
import PdaTestPanel from '../components/PdaTestPanel';
import PdaTransitionPopover from '../components/PdaTransitionPopover';
import StateEditPanel from '../components/StateEditPanel';
import StateNode, { type StateNodeData } from '../components/nodes/StateNode';
import TransitionEdge, { type TransitionEdgeData } from '../components/edges/TransitionEdge';
import { useMachineStore } from '../store/machineStore';
import { validatePda } from '../logic/pda';
import { he } from '../i18n/he';

const nodeTypes = { state: StateNode };
const edgeTypes = { transition: TransitionEdge };

export default function PdaPage() {
  return (
    <ReactFlowProvider>
      <PdaPageInner />
    </ReactFlowProvider>
  );
}

function summarizePda(t: { read: string; pop: string; pushMode?: 'push' | 'pop'; push: string }) {
  const r = t.read || '⊥';
  const p = t.pop || '⊥';
  const action =
    (t.pushMode ?? 'push') === 'pop'
      ? 'POP'
      : `PUSH ${t.push || '⊥'}`;
  return `${r}, ${p} / ${action}`;
}

function PdaPageInner() {
  const machine = useMachineStore((s) => s.pda);
  const addState = useMachineStore((s) => s.addState);
  const updateState = useMachineStore((s) => s.updateState);
  const deleteState = useMachineStore((s) => s.deleteState);
  const setStart = useMachineStore((s) => s.setStart);
  const toggleAccepting = useMachineStore((s) => s.toggleAccepting);
  const clear = useMachineStore((s) => s.clear);
  const addPdaTransition = useMachineStore((s) => s.addPdaTransition);
  const setPdaRules = useMachineStore((s) => s.setPdaRules);
  const deleteTransition = useMachineStore((s) => s.deleteTransition);

  const [highlightStateId, setHighlightStateId] = useState<string | null>(null);
  const [highlightTransitionId, setHighlightTransitionId] = useState<string | null>(null);
  const [highlightTransitionVersion, setHighlightTransitionVersion] = useState(0);

  const handleHighlightTransition = useCallback((id: string | null) => {
    setHighlightTransitionId(id);
    if (id !== null) setHighlightTransitionVersion((v) => v + 1);
  }, []);
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pendingTransitionSource, setPendingTransitionSource] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((msg: string) => {
    if (errorTimer.current) clearTimeout(errorTimer.current);
    setErrorMsg(msg);
    errorTimer.current = setTimeout(() => setErrorMsg(null), 3500);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingTransitionSource(null);
        setSelectedNodeId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const transitionExists = useCallback(
    (from: string, to: string) => machine.transitions.some((t) => t.from === from && t.to === to),
    [machine.transitions],
  );

  const handleRename = useCallback(
    (id: string, label: string) => updateState('pda', id, { label }),
    [updateState],
  );
  const handleSetStart = useCallback((id: string) => setStart('pda', id), [setStart]);
  const handleToggleAccepting = useCallback(
    (id: string) => toggleAccepting('pda', id),
    [toggleAccepting],
  );
  const handleDeleteState = useCallback(
    (id: string) => {
      deleteState('pda', id);
      setSelectedNodeId(null);
    },
    [deleteState],
  );
  const handleAddTransition = useCallback((id: string) => {
    setPendingTransitionSource(id);
  }, []);

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
          isTransitionSource: pendingTransitionSource === s.id,
          onRename: handleRename,
          onSetStart: handleSetStart,
          onToggleAccepting: handleToggleAccepting,
          onDelete: handleDeleteState,
          onAddTransition: handleAddTransition,
        } satisfies StateNodeData,
      })),
    [
      machine.states, highlightStateId, pendingTransitionSource,
      handleRename, handleSetStart, handleToggleAccepting, handleDeleteState, handleAddTransition,
    ],
  );

  const edges: Edge[] = useMemo(() => {
    const pairSet = new Set(machine.transitions.map((t) => `${t.from}:${t.to}`));
    return machine.transitions.map((t) => ({
      id: t.id,
      source: t.from,
      target: t.to,
      type: 'transition',
      data: {
        pdaRules: t.rules.map(summarizePda),
        hasReverse: pairSet.has(`${t.to}:${t.from}`),
        highlighted: highlightTransitionId === t.id,
        highlightVersion: highlightTransitionId === t.id ? highlightTransitionVersion : undefined,
        onClickEdit: (id: string) => setEditingTransitionId(id),
        pdaEditor:
          editingTransitionId === t.id ? (
            <PdaTransitionPopover
              transition={t}
              onSave={(rules) => setPdaRules(t.id, rules)}
              onDelete={() => deleteTransition('pda', t.id)}
              onClose={() => setEditingTransitionId(null)}
              onError={showError}
            />
          ) : undefined,
      } satisfies TransitionEdgeData,
    }));
  }, [machine.transitions, editingTransitionId, highlightTransitionId, highlightTransitionVersion, setPdaRules, deleteTransition, showError]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateState('pda', change.id, { x: change.position.x, y: change.position.y });
        }
        if (change.type === 'remove') {
          deleteState('pda', change.id);
          setSelectedNodeId(null);
        }
      }
    },
    [updateState, deleteState],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === 'remove') deleteTransition('pda', change.id);
      }
    },
    [deleteTransition],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      if (transitionExists(conn.source, conn.target)) {
        showError(he.errors.duplicateTransition);
        return;
      }
      const id = addPdaTransition(conn.source, conn.target);
      setEditingTransitionId(id);
    },
    [addPdaTransition, transitionExists, showError],
  );

  const onNodeClick = useCallback(
    (_evt: React.MouseEvent, node: Node) => {
      if (pendingTransitionSource !== null) {
        if (transitionExists(pendingTransitionSource, node.id)) {
          showError(he.errors.duplicateTransition);
        } else {
          const id = addPdaTransition(pendingTransitionSource, node.id);
          setEditingTransitionId(id);
        }
        setPendingTransitionSource(null);
      } else {
        setSelectedNodeId(node.id);
      }
    },
    [pendingTransitionSource, addPdaTransition, transitionExists, showError],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setPendingTransitionSource(null);
  }, []);

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
    addState('pda', x, y);
  };

  const alerts = useMemo(() => validatePda(machine), [machine]);

  const selectedState = selectedNodeId
    ? machine.states.find((s) => s.id === selectedNodeId) ?? null
    : null;

  return (
    <div className="h-full flex flex-col">
      <Toolbar onAddState={handleAddState} onClear={() => clear('pda')} />
      <div className="flex-1 min-h-0 flex">

        {/* Canvas */}
        <div
          className="flex-1 min-w-0 bg-white relative"
          style={pendingTransitionSource ? { cursor: 'crosshair' } : undefined}
        >
          {/* Error banner */}
          {errorMsg && (
            <div className="animate-banner-down absolute top-0 inset-x-0 z-50 bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2.5 flex items-center justify-between shadow-md">
              <span className="text-sm font-medium text-white">{errorMsg}</span>
              <button
                onClick={() => setErrorMsg(null)}
                className="w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 text-white font-bold flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {/* Pending transition banner */}
          {pendingTransitionSource !== null && (
            <div className="animate-banner-down absolute top-0 inset-x-0 z-50 bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 flex items-center justify-between shadow-md">
              <span className="text-sm font-medium text-white">{he.pendingTransition.banner}</span>
              <button
                onClick={() => setPendingTransitionSource(null)}
                className="px-3 py-1 text-xs font-semibold bg-white/20 hover:bg-white/35 text-white rounded-full transition-colors"
              >
                {he.pendingTransition.cancel}
              </button>
            </div>
          )}

          <Whiteboard
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodesDraggable={pendingTransitionSource === null}
          />

          {/* Floating state-edit panel */}
          {selectedState && (
            <div
              className="absolute z-40 w-56 pointer-events-none"
              style={{ top: '1rem', insetInlineStart: '1rem' }}
            >
              <div className="pointer-events-auto">
                <StateEditPanel
                  state={selectedState}
                  onRename={handleRename}
                  onToggleAccepting={handleToggleAccepting}
                  onSetStart={handleSetStart}
                  onDelete={handleDeleteState}
                  onClose={() => setSelectedNodeId(null)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-gray-50 border-s border-gray-200 p-3 space-y-3 overflow-y-auto">
          <PdaTestPanel
            machine={machine}
            onHighlightState={setHighlightStateId}
            onHighlightTransition={handleHighlightTransition}
          />
          <AlertsPanel alerts={alerts} strings={he.machines.pda.alerts} />
        </aside>
      </div>

    </div>
  );
}
