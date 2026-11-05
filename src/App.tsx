import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { PipelineList } from './components/PipelineList';
import PipelineEditor from './components/PipelineEditor';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setCurrentPipelineId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!session) {
    return <Auth />;
  }

  // No pipeline selected - show list
  if (!currentPipelineId) {
    return <PipelineList onSelect={setCurrentPipelineId} />;
  }

  // Pipeline selected - show editor
  return (
    <PipelineEditor
      pipelineId={currentPipelineId}
      onBack={() => setCurrentPipelineId(null)}
    />
  );
}
