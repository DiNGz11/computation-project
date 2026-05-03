import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onPaneClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: React.MouseEventHandler;
}

export default function Whiteboard({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  edgeTypes,
  onNodeClick,
  onPaneClick,
  onDoubleClick,
}: Props) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onDoubleClick={onDoubleClick}
      proOptions={{ hideAttribution: true }}
      fitView
      defaultEdgeOptions={{ type: 'transition' }}
    >
      <Background gap={24} color="#e5e7eb" />
      <Controls position="bottom-right" />
      <MiniMap pannable zoomable position="top-left" />
    </ReactFlow>
  );
}
