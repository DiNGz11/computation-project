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
import DfaTestPanel from '../components/DfaTestPanel';
import StateEditPanel from '../components/StateEditPanel';
import StateNode, { type StateNodeData } from '../components/nodes/StateNode';
import TransitionEdge, { type TransitionEdgeData } from '../components/edges/TransitionEdge';
import { useMachineStore } from '../store/machineStore';
import { validateDfa } from '../logic/dfa';
import { he } from '../i18n/he';

const nodeTypes = { state: StateNode };
const edgeTypes = { transition: TransitionEdge };

export default function DfaPage() {
  return (
    <ReactFlowProvider>
      <DfaPageInner />
    </ReactFlowProvider>
  );
}

interface Highlight {
  stateIds: string[];
  transitionId: string | null;
}

function DfaPageInner() {
  const machine = useMachineStore((s) => s.dfa);
  const addState = useMachineStore((s) => s.addState);
  const updateState = useMachineStore((s) => s.updateState);
  const deleteState = useMachineStore((s) => s.deleteState);
  const setStart = useMachineStore((s) => s.setStart);
  const toggleAccepting = useMachineStore((s) => s.toggleAccepting);
  const clear = useMachineStore((s) => s.clear);
  const addDfaTransition = useMachineStore((s) => s.addDfaTransition);
  const updateDfaTransition = useMachineStore((s) => s.updateDfaTransition);
  const deleteTransition = useMachineStore((s) => s.deleteTransition);

  const [highlight, setHighlight] = useState<Highlight>({
    stateIds: [], transitionId: null,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pendingTransitionSource, setPendingTransitionSource] = useState<string | null>(null);
  const [newEdgeId, setNewEdgeId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((msg: string) => {
    if (errorTimer.current) clearTimeout(errorTimer.current);
    setErrorMsg(msg);
    errorTimer.current = setTimeout(() => setErrorMsg(null), 3500);
  }, []);

  // Escape cancels pending-transition mode and deselects
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

  const onHighlightStates = useCallback(
    (ids: string[] | null) => setHighlight((prev) => ({ ...prev, stateIds: ids ?? [] })),
    [],
  );
  const onHighlightTransition = useCallback(
    (id: string | null) => setHighlight((prev) => ({ ...prev, transitionId: id })),
    [],
  );

  const handleRename = useCallback(
    (id: string, label: string) => updateState('dfa', id, { label }),
    [updateState],
  );
  const handleSetStart = useCallback((id: string) => setStart('dfa', id), [setStart]);
  const handleToggleAccepting = useCallback(
    (id: string) => toggleAccepting('dfa', id),
    [toggleAccepting],
  );
  const handleDeleteState = useCallback(
    (id: string) => {
      deleteState('dfa', id);
      setSelectedNodeId(null);
    },
    [deleteState],
  );
  const handleAddTransition = useCallback((id: string) => {
    setPendingTransitionSource(id);
  }, []);
  const handleUpdateLetters = useCallback(
    (id: string, letters: string[]) => {
      updateDfaTransition(id, { letters });
      setNewEdgeId((prev) => (prev === id ? null : prev));
    },
    [updateDfaTransition],
  );
  const handleDeleteTransition = useCallback(
    (id: string) => deleteTransition('dfa', id),
    [deleteTransition],
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
          highlighted: highlight.stateIds.includes(s.id),
          isTransitionSource: pendingTransitionSource === s.id,
          onRename: handleRename,
          onSetStart: handleSetStart,
          onToggleAccepting: handleToggleAccepting,
          onDelete: handleDeleteState,
          onAddTransition: handleAddTransition,
        } satisfies StateNodeData,
      })),
    [
      machine.states, highlight.stateIds, pendingTransitionSource,
      handleRename, handleSetStart, handleToggleAccepting, handleDeleteState, handleAddTransition,
    ],
  );

  const edges: Edge[] = useMemo(() => {
    // Pre-build a set of all existing "from:to" pairs to detect bidirectional transitions
    const pairSet = new Set(machine.transitions.map((t) => `${t.from}:${t.to}`));
    return machine.transitions.map((t) => {
      const isHighlighted = t.id === highlight.transitionId;
      const hasReverse = pairSet.has(`${t.to}:${t.from}`);
      return {
        id: t.id,
        source: t.from,
        target: t.to,
        type: 'transition',
        data: {
          letters: t.letters,
          highlighted: isHighlighted,
          hasReverse,
          newlyCreated: t.id === newEdgeId,
          onUpdateLetters: handleUpdateLetters,
          onDelete: handleDeleteTransition,
        } satisfies TransitionEdgeData,
      };
    });
  }, [machine.transitions, highlight, newEdgeId, handleUpdateLetters, handleDeleteTransition]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateState('dfa', change.id, { x: change.position.x, y: change.position.y });
        }
        if (change.type === 'remove') {
          deleteState('dfa', change.id);
          setSelectedNodeId(null);
        }
      }
    },
    [updateState, deleteState],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === 'remove') deleteTransition('dfa', change.id);
      }
    },
    [deleteTransition],
  );

  const transitionExists = useCallback(
    (from: string, to: string) => machine.transitions.some((t) => t.from === from && t.to === to),
    [machine.transitions],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      if (transitionExists(conn.source, conn.target)) {
        showError(he.errors.duplicateTransition);
        return;
      }
      const id = addDfaTransition(conn.source, conn.target, []);
      setNewEdgeId(id);
    },
    [addDfaTransition, transitionExists, showError],
  );

  // Click on node: create transition (pending mode) or select
  const onNodeClick = useCallback(
    (_evt: React.MouseEvent, node: Node) => {
      if (pendingTransitionSource !== null) {
        if (transitionExists(pendingTransitionSource, node.id)) {
          showError(he.errors.duplicateTransition);
        } else {
          const id = addDfaTransition(pendingTransitionSource, node.id, []);
          setNewEdgeId(id);
        }
        setPendingTransitionSource(null);
      } else {
        setSelectedNodeId(node.id);
      }
    },
    [pendingTransitionSource, addDfaTransition, transitionExists, showError],
  );

  // Click on pane: deselect and cancel pending
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
    addState('dfa', x, y);
  };

  const alerts = useMemo(() => validateDfa(machine), [machine]);

  const selectedState = selectedNodeId
    ? machine.states.find((s) => s.id === selectedNodeId) ?? null
    : null;

  return (
    <div className="h-full flex flex-col">
      <Toolbar onAddState={handleAddState} onClear={() => clear('dfa')} />
      <div className="flex-1 min-h-0 flex">

        {/* Canvas — fills the main area */}
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

          {/* Floating state-edit panel — overlaid on the canvas, logical-start (right in RTL) */}
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

        {/* Sidebar — test panel + alerts only */}
        <aside className="w-72 flex-shrink-0 bg-gray-50 border-s border-gray-200 p-3 space-y-3 overflow-y-auto">
          <DfaTestPanel machine={machine} onHighlightStates={onHighlightStates} onHighlightTransition={onHighlightTransition} />
          <AlertsPanel alerts={alerts} strings={he.machines.dfa.alerts} />
        </aside>
      </div>
    </div>
  );
}
