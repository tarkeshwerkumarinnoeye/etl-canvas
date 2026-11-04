import { useEffect, useRef, useState } from 'react';
import { pipelineService } from '../services/pipelineService';

interface UseAutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export function useAutoSave(
  pipelineId: string | null,
  nodes: any[],
  edges: any[],
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const { debounceMs = 2000, enabled = true } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSaveRef = useRef<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (!pipelineId || !enabled) {
      setSaveStatus('idle');
      return;
    }

    // Debounce: wait after last change
    clearTimeout(timeoutRef.current);
    setSaveStatus('saving');
    setIsSaving(true);

    timeoutRef.current = setTimeout(async () => {
      const currentState = JSON.stringify({ nodes, edges });
      
      // Only save if changed
      if (currentState !== lastSaveRef.current) {
        try {
          await pipelineService.update(pipelineId, { nodes, edges });
          lastSaveRef.current = currentState;
          setLastSaved(new Date());
          setSaveStatus('saved');
          setError(null);
          console.log('✓ Auto-saved pipeline');
        } catch (err) {
          console.error('✗ Auto-save failed:', err);
          setError(err instanceof Error ? err.message : 'Save failed');
          setSaveStatus('error');
        } finally {
          setIsSaving(false);
        }
      } else {
        setSaveStatus('idle');
        setIsSaving(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutRef.current);
  }, [pipelineId, nodes, edges, debounceMs, enabled]);

  return { isSaving, lastSaved, error, saveStatus };
}
