import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import {
  Database, Globe, FileText, Radio,
  GitBranch, Filter, Layers, Brain,
  Inbox, Zap, BarChart3, Bell,
  Cloud, HardDrive, X
} from 'lucide-react';
import type { PipelineNodeData } from '../types';

const iconMap: Record<string, any> = {
  'source-database': Database,
  'source-api': Globe,
  'source-file': FileText,
  'source-stream': Radio,
  'transform': GitBranch,
  'filter': Filter,
  'aggregate': Layers,
  'ml-model': Brain,
  'queue': Inbox,
  'cache': Zap,
  'sink-database': HardDrive,
  'sink-dashboard': BarChart3,
  'sink-alert': Bell,
  'sink-datalake': Cloud,
};

const colorMap: Record<string, string> = {
  'source': 'from-blue-500 to-cyan-500',
  'processing': 'from-purple-500 to-pink-500',
  'sink': 'from-emerald-500 to-teal-500',
  'infrastructure': 'from-amber-500 to-orange-500',
};

const borderColorMap: Record<string, string> = {
  'source': 'border-blue-400/60',
  'processing': 'border-purple-400/60',
  'sink': 'border-emerald-400/60',
  'infrastructure': 'border-amber-400/60',
};

const selectedBorderMap: Record<string, string> = {
  'source': 'border-blue-400 shadow-blue-500/40',
  'processing': 'border-purple-400 shadow-purple-500/40',
  'sink': 'border-emerald-400 shadow-emerald-500/40',
  'infrastructure': 'border-amber-400 shadow-amber-500/40',
};

const dotColorMap: Record<string, string> = {
  'source': 'bg-blue-400 shadow-blue-400/50',
  'processing': 'bg-purple-400 shadow-purple-400/50',
  'sink': 'bg-emerald-400 shadow-emerald-400/50',
  'infrastructure': 'bg-amber-400 shadow-amber-400/50',
};

export function PipelineNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as PipelineNodeData;
  const Icon = iconMap[nodeData.type] || Database;
  const gradient = colorMap[nodeData.category] || colorMap['source'];
  const borderColor = selected
    ? selectedBorderMap[nodeData.category]
    : borderColorMap[nodeData.category];
  const dotColor = dotColorMap[nodeData.category] || dotColorMap['source'];
  const { setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((ed) => ed.source !== id && ed.target !== id));
  };

  return (
    <div className={`
      relative group
      bg-gray-900/95 backdrop-blur-md
      border-2 ${borderColor}
      rounded-xl px-4 py-3
      shadow-lg shadow-black/20
      hover:scale-[1.03] transition-all duration-200
      min-w-[150px]
      ${selected ? 'shadow-xl scale-[1.02]' : ''}
    `}>
      {/* Animated border glow */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300`} />
      
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/90 
          flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          hover:bg-red-500 hover:scale-110 z-50"
      >
        <X size={10} className="text-white" />
      </button>
      
      {/* Status indicator dot */}
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${dotColor} shadow-sm animate-pulse`} />
      
      {/* Handles on all 4 sides - source and target overlap for clean look */}
      {/* Top */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className={`!w-4 !h-4 !border-2 !border-gray-900 !rounded-full hover:!scale-150 transition-transform ${dotColor}`}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className={`!w-4 !h-4 !border-2 !border-gray-900 !rounded-full hover:!scale-150 transition-transform ${dotColor}`}
      />
      
      {/* Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className={`!w-4 !h-4 !border-2 !border-gray-900 !rounded-full hover:!scale-150 transition-transform ${dotColor}`}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className={`!w-4 !h-4 !border-2 !border-gray-900 !rounded-full hover:!scale-150 transition-transform ${dotColor}`}
      />
      
      {/* Left */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className={`!w-4 !h-4 !border-2 !border-gray-900 !rounded-full hover:!scale-150 transition-transform ${dotColor}`}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className={`!w-4 !h-4 !border-2 !border-gray-900 !rounded-full hover:!scale-150 transition-transform ${dotColor}`}
      />
      
      {/* Right */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className={`!w-4 !h-4 !border-2 !border-gray-900 !rounded-full hover:!scale-150 transition-transform ${dotColor}`}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className={`!w-4 !h-4 !border-2 !border-gray-900 !rounded-full hover:!scale-150 transition-transform ${dotColor}`}
      />
      
      <div className="flex items-center gap-2.5 relative z-10">
        <div className={`
          p-1.5 rounded-lg bg-gradient-to-br ${gradient}
          shadow-inner shadow-black/20
        `}>
          <Icon className="text-white" size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-tight">
            {nodeData.label}
          </div>
          <div className="text-[10px] text-gray-400 capitalize mt-0.5">
            {nodeData.description}
          </div>
        </div>
      </div>
    </div>
  );
}
