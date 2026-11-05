import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Pipeline } from '../types/supabase';

export function useRealtimePipeline(pipelineId: string | null) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pipelineId) {
      setPipeline(null);
      setLoading(false);
      return;
    }

    // Initial load
    const loadPipeline = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('pipelines')
          .select('*')
          .eq('id', pipelineId)
          .single();

        if (fetchError) throw fetchError;
        setPipeline(data);
        setError(null);
      } catch (err) {
        console.error('Error loading pipeline:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pipeline');
      } finally {
        setLoading(false);
      }
    };

    loadPipeline();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`pipeline:${pipelineId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipelines',
          filter: `id=eq.${pipelineId}`,
        },
        (payload) => {
          console.log('🔄 Real-time update:', payload.eventType);
          if (payload.eventType === 'DELETE') {
            setPipeline(null);
          } else {
            setPipeline(payload.new as Pipeline);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pipelineId]);

  return { pipeline, loading, error };
}

// Hook to subscribe to all user's pipelines
export function useRealtimePipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPipelines = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPipelines([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('pipelines')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setPipelines(data || []);
      } catch (err) {
        console.error('Error loading pipelines:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPipelines();

    // Subscribe to changes
    const channel = supabase
      .channel('pipelines-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipelines',
        },
        async () => {
          console.log('🔄 Pipelines list updated');
          await loadPipelines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { pipelines, loading };
}
