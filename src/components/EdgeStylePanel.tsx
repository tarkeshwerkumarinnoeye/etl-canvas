import { X } from 'lucide-react';

interface EdgeStylePanelProps {
  edgeStyle: string;
  edgeColor: string;
  edgeSpeed: 'slow' | 'normal' | 'fast';
  onStyleChange: (style: string) => void;
  onColorChange: (color: string) => void;
  onSpeedChange: (speed: 'slow' | 'normal' | 'fast') => void;
  onClose: () => void;
}

const edgeStyles = [
  { id: 'animated', label: 'Animated', icon: '🌊' },
  { id: 'animated-step', label: 'Animated Step', icon: '📐' },
  { id: 'solid', label: 'Solid', icon: '━' },
  { id: 'dashed', label: 'Dashed', icon: '- -' },
  { id: 'dotted', label: 'Dotted', icon: '···' },
  { id: 'step', label: 'Step', icon: '⌐' },
  { id: 'straight', label: 'Straight', icon: '/' },
];

const edgeColors = [
  { id: '#6366f1', label: 'Indigo', name: 'indigo' },
  { id: '#8b5cf6', label: 'Purple', name: 'purple' },
  { id: '#ec4899', label: 'Pink', name: 'pink' },
  { id: '#ef4444', label: 'Red', name: 'red' },
  { id: '#f97316', label: 'Orange', name: 'orange' },
  { id: '#eab308', label: 'Yellow', name: 'yellow' },
  { id: '#22c55e', label: 'Green', name: 'green' },
  { id: '#06b6d4', label: 'Cyan', name: 'cyan' },
  { id: '#3b82f6', label: 'Blue', name: 'blue' },
  { id: '#ffffff', label: 'White', name: 'white' },
];

const speeds = [
  { id: 'slow', label: 'Slow', icon: '🐢' },
  { id: 'normal', label: 'Normal', icon: '🚶' },
  { id: 'fast', label: 'Fast', icon: '🚀' },
];

export function EdgeStylePanel({
  edgeStyle,
  edgeColor,
  edgeSpeed,
  onStyleChange,
  onColorChange,
  onSpeedChange,
  onClose,
}: EdgeStylePanelProps) {
  return (
    <div className="absolute top-20 right-4 w-72 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-800/50">
        <h3 className="text-sm font-semibold text-white">Edge Style</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Edge Type */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">
            Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {edgeStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => onStyleChange(style.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  edgeStyle === style.id
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                    : 'bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-800'
                }`}
              >
                <span className="text-base">{style.icon}</span>
                <span>{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">
            Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {edgeColors.map((color) => (
              <button
                key={color.id}
                onClick={() => onColorChange(color.id)}
                className={`w-full aspect-square rounded-lg transition-all hover:scale-110 ${
                  edgeColor === color.id
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900'
                    : ''
                }`}
                style={{ backgroundColor: color.id }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* Speed (only for animated edges) */}
        {(edgeStyle === 'animated' || edgeStyle === 'animated-step') && (
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">
              Speed
            </label>
            <div className="grid grid-cols-3 gap-2">
              {speeds.map((speed) => (
                <button
                  key={speed.id}
                  onClick={() => onSpeedChange(speed.id as 'slow' | 'normal' | 'fast')}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    edgeSpeed === speed.id
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                      : 'bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-lg">{speed.icon}</span>
                  <span>{speed.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
