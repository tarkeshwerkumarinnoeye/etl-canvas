import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  type Connection,
  type ReactFlowInstance,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PipelineNodeComponent } from './components/PipelineNode';
import { AnimatedEdge, AnimatedEdgeFast, AnimatedEdgeSlow } from './components/AnimatedEdge';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Info, X } from 'lucide-react';
import type { SidebarItem } from './types';

const nodeTypes = {
  pipeline: PipelineNodeComponent,
};

const edgeTypes = {
  animated: AnimatedEdge,
  animatedFast: AnimatedEdgeFast,
  animatedSlow: AnimatedEdgeSlow,
};

let id = 0;
const getId = () => `node_${id++}`;

// Example pipeline data
function createExamplePipeline() {
  const nodes = [
    {
      id: '1',
      type: 'pipeline',
      position: { x: 50, y: 150 },
      data: { label: 'PostgreSQL', type: 'source-database', category: 'source', icon: 'database', description: 'Primary DB' },
    },
    {
      id: '2',
      type: 'pipeline',
      position: { x: 50, y: 350 },
      data: { label: 'REST API', type: 'source-api', category: 'source', icon: 'globe', description: 'External API' },
    },
    {
      id: '3',
      type: 'pipeline',
      position: { x: 50, y: 550 },
      data: { label: 'Kafka Stream', type: 'source-stream', category: 'source', icon: 'radio', description: 'Event Stream' },
    },
    {
      id: '4',
      type: 'pipeline',
      position: { x: 320, y: 200 },
      data: { label: 'Data Queue', type: 'queue', category: 'infrastructure', icon: 'inbox', description: 'SQS Queue' },
    },
    {
      id: '5',
      type: 'pipeline',
      position: { x: 320, y: 450 },
      data: { label: 'Transform', type: 'transform', category: 'processing', icon: 'git-branch', description: 'ETL Process' },
    },
    {
      id: '6',
      type: 'pipeline',
      position: { x: 580, y: 150 },
      data: { label: 'Filter', type: 'filter', category: 'processing', icon: 'filter', description: 'Data Quality' },
    },
    {
      id: '7',
      type: 'pipeline',
      position: { x: 580, y: 350 },
      data: { label: 'ML Model', type: 'ml-model', category: 'processing', icon: 'brain', description: 'Classification' },
    },
    {
      id: '8',
      type: 'pipeline',
      position: { x: 580, y: 550 },
      data: { label: 'Aggregate', type: 'aggregate', category: 'processing', icon: 'layers', description: 'Rollup Data' },
    },
    {
      id: '9',
      type: 'pipeline',
      position: { x: 850, y: 200 },
      data: { label: 'Redis Cache', type: 'cache', category: 'infrastructure', icon: 'zap', description: 'Hot Cache' },
    },
    {
      id: '10',
      type: 'pipeline',
      position: { x: 850, y: 450 },
      data: { label: 'Data Lake', type: 'sink-datalake', category: 'sink', icon: 'cloud', description: 'S3 Storage' },
    },
    {
      id: '11',
      type: 'pipeline',
      position: { x: 1100, y: 150 },
      data: { label: 'Dashboard', type: 'sink-dashboard', category: 'sink', icon: 'bar-chart', description: 'Analytics' },
    },
    {
      id: '12',
      type: 'pipeline',
      position: { x: 1100, y: 350 },
      data: { label: 'Alerts', type: 'sink-alert', category: 'sink', icon: 'bell', description: 'PagerDuty' },
    },
    {
      id: '13',
      type: 'pipeline',
      position: { x: 1100, y: 550 },
      data: { label: 'Analytics DB', type: 'sink-database', category: 'sink', icon: 'hard-drive', description: 'ClickHouse' },
    },
  ];

  const edges = [
    { id: 'e1-4', source: '1', target: '4', type: 'animated' },
    { id: 'e2-5', source: '2', target: '5', type: 'animatedFast' },
    { id: 'e3-5', source: '3', target: '5', type: 'animatedSlow' },
    { id: 'e4-6', source: '4', target: '6', type: 'animated' },
    { id: 'e5-7', source: '5', target: '7', type: 'animated' },
    { id: 'e5-8', source: '5', target: '8', type: 'animatedFast' },
    { id: 'e6-9', source: '6', target: '9', type: 'animated' },
    { id: 'e7-10', source: '7', target: '10', type: 'animatedSlow' },
    { id: 'e8-10', source: '8', target: '10', type: 'animated' },
    { id: 'e9-11', source: '9', target: '11', type: 'animatedFast' },
    { id: 'e10-12', source: '10', target: '12', type: 'animated' },
    { id: 'e10-13', source: '10', target: '13', type: 'animated' },
  ];

  return { nodes, edges };
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds: Edge[]) => addEdge({
        ...params,
        type: 'animated',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      } as Edge, eds));
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const itemData = event.dataTransfer.getData('application/reactflow');
      if (!itemData || !reactFlowInstance) return;

      const item: SidebarItem = JSON.parse(itemData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type: 'pipeline',
        position,
        data: {
          label: item.label,
          type: item.type,
          category: item.category,
          icon: item.icon,
          description: item.description,
        },
      };

      setNodes((nds: Node[]) => [...nds, newNode as Node]);
    },
    [reactFlowInstance, setNodes],
  );

  const onDragStart = useCallback((event: React.DragEvent, item: SidebarItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleToggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipeline-design.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.nodes && data.edges) {
            setNodes(data.nodes);
            setEdges(data.edges);
          }
        } catch {
          alert('Invalid pipeline file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges]);

  const handleReset = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  const handleLoadExample = useCallback(() => {
    const example = createExamplePipeline();
    setNodes(example.nodes as any);
    setEdges(example.edges as any);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.1 });
    }, 100);
  }, [setNodes, setEdges, reactFlowInstance]);

  const handleDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setNodes, setEdges]);

  const handleReverseEdge = useCallback(() => {
    setEdges((eds) => eds.map((e) => {
      if (e.selected) {
        return {
          ...e,
          source: e.target,
          target: e.source,
          sourceHandle: e.targetHandle,
          targetHandle: e.sourceHandle,
        };
      }
      return e;
    }));
  }, [setEdges]);

  // Keyboard shortcut: R to reverse selected edge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        // Don't trigger if typing in an input
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
          return;
        }
        handleReverseEdge();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReverseEdge]);

  const hasSelection = useMemo(() => {
    return nodes.some(n => n.selected) || edges.some(e => e.selected);
  }, [nodes, edges]);

  const hasEdgeSelected = useMemo(() => {
    return edges.some(e => e.selected);
  }, [edges]);

  // Control animation visibility and highlight selected edges
  const displayEdges = useMemo(() => {
    return edges.map(e => {
      const isSelected = e.selected;
      const baseEdge = {
        ...e,
        style: {
          ...e.style,
          strokeWidth: isSelected ? 4 : 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSelected ? '#ef4444' : (e.markerEnd as any)?.color || '#6366f1',
        },
      };

      if (!isAnimating) {
        return {
          ...baseEdge,
          type: 'default',
          style: {
            ...baseEdge.style,
            stroke: isSelected ? '#ef4444' : '#4b5563',
          },
        } as Edge;
      }
      return baseEdge as Edge;
    });
  }, [edges, isAnimating]);

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-950 overflow-hidden">
      <Toolbar
        isAnimating={isAnimating}
        onToggleAnimation={handleToggleAnimation}
        onClear={handleClear}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        onLoadExample={handleLoadExample}
        onDeleteSelected={handleDeleteSelected}
        onReverseEdge={handleReverseEdge}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        hasSelection={hasSelection}
        hasEdgeSelected={hasEdgeSelected}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onDragStart={onDragStart} />
        
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance: ReactFlowInstance) => setReactFlowInstance(instance)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              type: 'animated',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
            }}
            className="bg-gray-950"
            selectNodesOnDrag={false}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#1f2937"
            />
            <Controls
              className="!bg-gray-900 !border-gray-700 !rounded-xl !shadow-xl overflow-hidden"
              style={{ 
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            />
            <MiniMap
              className="!bg-gray-900 !border-gray-700 !rounded-xl"
              style={{ 
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '12px',
              }}
              nodeColor={(node) => {
                const data = node.data as any;
                switch (data?.category) {
                  case 'source': return '#3b82f6';
                  case 'processing': return '#a855f7';
                  case 'sink': return '#10b981';
                  case 'infrastructure': return '#f59e0b';
                  default: return '#6366f1';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.7)"
            />
            {/* SVG Defs for gradients */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <radialGradient id="glowGradient">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </ReactFlow>

          {/* Info toggle button - always visible */}
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className="absolute bottom-4 left-4 w-10 h-10 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all duration-200 shadow-lg hover:shadow-indigo-500/20 z-50"
            title={showInfoPanel ? "Hide help" : "Show help"}
          >
            {showInfoPanel ? <X size={18} /> : <Info size={18} />}
          </button>

          {/* Floating info panel - only shows when toggled */}
          {showInfoPanel && (
            <div className="absolute bottom-16 left-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-3 text-xs text-gray-400 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="font-semibold text-gray-300 mb-2 text-[11px] uppercase tracking-wider">Node Types</div>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Source</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Infrastructure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Sink</span>
                </div>
              </div>
              <div className="font-semibold text-gray-300 mb-2 text-[11px] uppercase tracking-wider border-t border-gray-700/50 pt-2">Flow Speeds</div>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-indigo-500 rounded" />
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-emerald-500 rounded" />
                  <span>Fast</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-amber-500 rounded" />
                  <span>Slow / Batch</span>
                </div>
              </div>
              <div className="font-semibold text-gray-300 mb-1.5 text-[11px] uppercase tracking-wider border-t border-gray-700/50 pt-2">Shortcuts</div>
              <div className="space-y-1 text-[10px]">
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300 font-mono">Del</kbd> Remove selected node/edge</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300 font-mono">R</kbd> Reverse edge direction</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300 font-mono">Click</kbd> Select edge to delete</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300 font-mono">Scroll</kbd> Zoom</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300 font-mono">Drag</kbd> Connect from any side</div>
              </div>
            </div>
          )}

          {/* Instructions overlay when empty */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="text-7xl animate-bounce">🔧</div>
                  <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-bold text-gray-400">
                    Design Your Data Pipeline
                  </div>
                  <div className="text-sm text-gray-500 max-w-md">
                    Drag components from the sidebar onto the canvas, then connect them by dragging from output to input handles.
                  </div>
                  <div className="text-xs text-gray-600 mt-3">
                    💡 Click <span className="text-indigo-400 font-medium">"Load Example"</span> above to see a sample ETL pipeline with animated data flow
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
