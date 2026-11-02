import { Play, Pause, Trash2, Download, Upload, RotateCcw, Sparkles } from 'lucide-react';

interface ToolbarProps {
  isAnimating: boolean;
  onToggleAnimation: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onLoadExample: () => void;
  nodeCount: number;
  edgeCount: number;
}

export function Toolbar({
  isAnimating,
  onToggleAnimation,
  onClear,
  onExport,
  onImport,
  onReset,
  onLoadExample,
  nodeCount,
  edgeCount,
}: ToolbarProps) {
  return (
    <div className="h-14 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 flex items-center px-4 gap-2">
      <div className="flex items-center gap-2 mr-4">
        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Pipeline Designer</h1>
          <p className="text-[10px] text-gray-400">{nodeCount} nodes · {edgeCount} connections</p>
        </div>
      </div>

      <div className="h-6 w-px bg-gray-700 mx-2" />

      <button
        onClick={onToggleAnimation}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isAnimating
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
        }`}
      >
        {isAnimating ? <Pause size={14} /> : <Play size={14} />}
        {isAnimating ? 'Pause Flow' : 'Start Flow'}
      </button>

      <button
        onClick={onLoadExample}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          bg-indigo-500/20 text-indigo-400 border border-indigo-500/30
          hover:bg-indigo-500/30 transition-all"
      >
        <Sparkles size={14} />
        Load Example
      </button>

      <div className="h-6 w-px bg-gray-700 mx-2" />

      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-all"
      >
        <Download size={14} />
        Export
      </button>

      <button
        onClick={onImport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-all"
      >
        <Upload size={14} />
        Import
      </button>

      <div className="flex-1" />

      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-all"
      >
        <RotateCcw size={14} />
        Reset View
      </button>

      <button
        onClick={onClear}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
      >
        <Trash2 size={14} />
        Clear All
      </button>
    </div>
  );
}
