import { useState } from 'react';
import {
  Database, Globe, FileText, Radio,
  GitBranch, Filter, Layers, Brain,
  Inbox, Zap, BarChart3, Bell,
  Cloud, HardDrive, ChevronDown, ChevronRight
} from 'lucide-react';
import type { SidebarItem } from '../types';

const sidebarItems: SidebarItem[] = [
  // Sources
  { type: 'source-database', label: 'Database', category: 'source', icon: 'database', description: 'SQL/NoSQL Source', color: 'from-blue-500 to-cyan-500' },
  { type: 'source-api', label: 'API', category: 'source', icon: 'globe', description: 'REST/GraphQL API', color: 'from-blue-500 to-cyan-500' },
  { type: 'source-file', label: 'File', category: 'source', icon: 'file', description: 'CSV/JSON/Parquet', color: 'from-blue-500 to-cyan-500' },
  { type: 'source-stream', label: 'Stream', category: 'source', icon: 'radio', description: 'Kafka/Kinesis', color: 'from-blue-500 to-cyan-500' },
  // Processing
  { type: 'transform', label: 'Transform', category: 'processing', icon: 'git-branch', description: 'Map/Convert Data', color: 'from-purple-500 to-pink-500' },
  { type: 'filter', label: 'Filter', category: 'processing', icon: 'filter', description: 'Filter Records', color: 'from-purple-500 to-pink-500' },
  { type: 'aggregate', label: 'Aggregate', category: 'processing', icon: 'layers', description: 'Group & Sum', color: 'from-purple-500 to-pink-500' },
  { type: 'ml-model', label: 'ML Model', category: 'processing', icon: 'brain', description: 'Inference/Predict', color: 'from-purple-500 to-pink-500' },
  // Infrastructure
  { type: 'queue', label: 'Queue', category: 'infrastructure', icon: 'inbox', description: 'SQS/RabbitMQ', color: 'from-amber-500 to-orange-500' },
  { type: 'cache', label: 'Cache', category: 'infrastructure', icon: 'zap', description: 'Redis/Memcached', color: 'from-amber-500 to-orange-500' },
  // Sinks
  { type: 'sink-database', label: 'DB Write', category: 'sink', icon: 'hard-drive', description: 'Write to Database', color: 'from-emerald-500 to-teal-500' },
  { type: 'sink-dashboard', label: 'Dashboard', category: 'sink', icon: 'bar-chart', description: 'Visualization', color: 'from-emerald-500 to-teal-500' },
  { type: 'sink-alert', label: 'Alert', category: 'sink', icon: 'bell', description: 'Notify/Alert', color: 'from-emerald-500 to-teal-500' },
  { type: 'sink-datalake', label: 'Data Lake', category: 'sink', icon: 'cloud', description: 'S3/GCS Storage', color: 'from-emerald-500 to-teal-500' },
];

const iconComponents: Record<string, any> = {
  database: Database,
  globe: Globe,
  file: FileText,
  radio: Radio,
  'git-branch': GitBranch,
  filter: Filter,
  layers: Layers,
  brain: Brain,
  inbox: Inbox,
  zap: Zap,
  'bar-chart': BarChart3,
  bell: Bell,
  cloud: Cloud,
  'hard-drive': HardDrive,
};

interface SidebarProps {
  onDragStart: (event: React.DragEvent, item: SidebarItem) => void;
}

export function Sidebar({ onDragStart }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    source: true,
    processing: true,
    infrastructure: true,
    sink: true,
  });

  const categories = [
    { key: 'source', label: 'Data Sources', color: 'text-blue-400' },
    { key: 'processing', label: 'Processing', color: 'text-purple-400' },
    { key: 'infrastructure', label: 'Infrastructure', color: 'text-amber-400' },
    { key: 'sink', label: 'Data Sinks', color: 'text-emerald-400' },
  ];

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-700/50">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
            <Layers size={18} className="text-indigo-400" />
          </div>
          Components
        </h2>
        <p className="text-xs text-gray-400 mt-1">Drag to canvas to add</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {categories.map(cat => (
          <div key={cat.key}>
            <button
              onClick={() => toggleCategory(cat.key)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              {expandedCategories[cat.key] ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronRight size={14} className="text-gray-400" />
              )}
              <span className={`text-xs font-semibold uppercase tracking-wider ${cat.color}`}>
                {cat.label}
              </span>
            </button>
            
            {expandedCategories[cat.key] && (
              <div className="ml-2 space-y-1 mt-1">
                {sidebarItems
                  .filter(item => item.category === cat.key)
                  .map(item => {
                    const Icon = iconComponents[item.icon];
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg
                          bg-gray-800/50 border border-gray-700/50
                          hover:border-gray-600 hover:bg-gray-800
                          cursor-grab active:cursor-grabbing
                          transition-all duration-150 group"
                      >
                        <div className={`p-1 rounded-md bg-gradient-to-br ${item.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                          <Icon size={14} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-200 truncate">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
