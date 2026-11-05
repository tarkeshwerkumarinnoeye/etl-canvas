import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimePipelines } from '../hooks/useRealtimePipeline';
import { pipelineService } from '../services/pipelineService';
import { Plus, Search, Trash2, Clock, LogOut, Sparkles } from 'lucide-react';
import type { Pipeline } from '../types/supabase';

interface PipelineListProps {
  onSelect: (pipelineId: string) => void;
}

export function PipelineList({ onSelect }: PipelineListProps) {
  const { pipelines, loading } = useRealtimePipelines();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const filteredPipelines = pipelines.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const pipeline = await pipelineService.create(newName, [], []);
      setNewName('');
      onSelect(pipeline.id);
    } catch (err) {
      console.error('Failed to create pipeline:', err);
      alert('Failed to create pipeline');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this pipeline? This cannot be undone.')) return;
    try {
      await pipelineService.delete(id);
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete pipeline');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Pipelines</h1>
              <p className="text-sm text-gray-400">{pipelines.length} pipeline{pipelines.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Search & Create */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pipelines..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="New pipeline name..."
              className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              <Plus size={18} />
              Create
            </button>
          </div>
        </div>

        {/* Pipeline Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
            <p className="text-gray-400 mt-4">Loading pipelines...</p>
          </div>
        ) : filteredPipelines.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 border border-gray-700/50 rounded-2xl">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {search ? 'No pipelines found' : 'No pipelines yet'}
            </h3>
            <p className="text-gray-500">
              {search ? 'Try a different search term' : 'Create your first pipeline to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPipelines.map((pipeline: Pipeline) => (
              <div
                key={pipeline.id}
                onClick={() => onSelect(pipeline.id)}
                className="group bg-gray-900/80 border border-gray-700/50 rounded-xl p-5 cursor-pointer hover:border-indigo-500/50 hover:bg-gray-900 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                    {pipeline.name}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(e, pipeline.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {pipeline.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {pipeline.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>{pipeline.nodes?.length || 0} nodes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>{pipeline.edges?.length || 0} edges</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Clock size={12} />
                    <span>{formatDate(pipeline.updated_at)}</span>
                  </div>
                </div>

                {pipeline.is_public && (
                  <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs border border-emerald-500/30">
                    🌐 Public
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
