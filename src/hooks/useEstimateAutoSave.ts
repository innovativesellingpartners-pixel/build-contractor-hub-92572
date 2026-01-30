import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EstimateBuilderData } from '@/components/contractor/crm/EstimateBuilder';

const DEBOUNCE_MS = 800;
const PERIODIC_SAVE_MS = 10000; // 10 seconds
const NAV_BLOCK_TIMEOUT_MS = 2000;

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface DraftInfo {
  draftId: string;
  version: number;
  updatedAt: string;
  payload: EstimateBuilderData;
}

interface UseEstimateAutoSaveOptions {
  estimateId: string | undefined;
  enabled?: boolean;
}

interface UseEstimateAutoSaveReturn {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  hasDraft: boolean;
  draftInfo: DraftInfo | null;
  isRestorePromptVisible: boolean;
  restoreDraft: () => void;
  discardDraft: () => Promise<void>;
  triggerSave: (data: EstimateBuilderData) => void;
  flushSave: () => Promise<void>;
  clearDraft: () => Promise<void>;
}

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getLocalStorageKey(estimateId: string, userId: string): string {
  return `estimate_draft_fallback_${estimateId}_${userId}`;
}

export function useEstimateAutoSave({
  estimateId,
  enabled = true,
}: UseEstimateAutoSaveOptions): UseEstimateAutoSaveReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftInfo, setDraftInfo] = useState<DraftInfo | null>(null);
  const [isRestorePromptVisible, setIsRestorePromptVisible] = useState(false);
  
  const currentDataRef = useRef<EstimateBuilderData | null>(null);
  const lastSavedDataRef = useRef<EstimateBuilderData | null>(null);
  const currentVersionRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const periodicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  // Check for existing draft on mount
  useEffect(() => {
    if (!estimateId || !user?.id || !enabled) return;

    const checkForDraft = async () => {
      try {
        // First check server for draft
        const { data, error } = await supabase.functions.invoke('estimate-draft', {
          method: 'GET',
          body: null,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Use query params approach for GET
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-draft?estimateId=${estimateId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const serverDraft = await response.json();
          setDraftInfo({
            draftId: serverDraft.draftId,
            version: serverDraft.version,
            updatedAt: serverDraft.updatedAt,
            payload: serverDraft.payload,
          });
          currentVersionRef.current = serverDraft.version;
          setIsRestorePromptVisible(true);
          return;
        }

        // If no server draft, check local storage fallback
        const localKey = getLocalStorageKey(estimateId, user.id);
        const localData = localStorage.getItem(localKey);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            setDraftInfo({
              draftId: 'local',
              version: 0,
              updatedAt: parsed.timestamp,
              payload: parsed.payload,
            });
            setIsRestorePromptVisible(true);
          } catch (e) {
            localStorage.removeItem(localKey);
          }
        }
      } catch (error) {
        console.error('Error checking for draft:', error);
      }
    };

    checkForDraft();
  }, [estimateId, user?.id, enabled]);

  // Save function
  const saveDraft = useCallback(async (data: EstimateBuilderData): Promise<boolean> => {
    if (!estimateId || !user?.id || isSavingRef.current) {
      pendingSaveRef.current = true;
      return false;
    }

    // Check if data has actually changed
    if (lastSavedDataRef.current && deepEqual(data, lastSavedDataRef.current)) {
      return true;
    }

    isSavingRef.current = true;
    setStatus('saving');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-draft?estimateId=${estimateId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload: data,
            version: currentVersionRef.current,
            updatedAtClient: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        currentVersionRef.current = result.version;
        lastSavedDataRef.current = data;
        setLastSavedAt(new Date(result.updatedAt));
        setStatus('saved');

        // Clear local fallback on successful save
        const localKey = getLocalStorageKey(estimateId, user.id);
        localStorage.removeItem(localKey);

        return true;
      } else if (response.status === 409) {
        // Version conflict - fetch latest and retry
        console.warn('Version conflict, will retry');
        const conflict = await response.json();
        currentVersionRef.current = conflict.serverVersion;
        // Retry save
        return saveDraft(data);
      } else {
        throw new Error(`Save failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Draft save error:', error);
      setStatus('offline');

      // Save to local storage as fallback
      const localKey = getLocalStorageKey(estimateId, user.id);
      localStorage.setItem(localKey, JSON.stringify({
        payload: data,
        timestamp: new Date().toISOString(),
      }));

      return false;
    } finally {
      isSavingRef.current = false;

      // Check if there's a pending save
      if (pendingSaveRef.current && currentDataRef.current) {
        pendingSaveRef.current = false;
        saveDraft(currentDataRef.current);
      }
    }
  }, [estimateId, user?.id]);

  // Debounced save trigger
  const triggerSave = useCallback((data: EstimateBuilderData) => {
    currentDataRef.current = data;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveDraft(data);
    }, DEBOUNCE_MS);
  }, [saveDraft]);

  // Flush save (immediate)
  const flushSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (currentDataRef.current && !deepEqual(currentDataRef.current, lastSavedDataRef.current)) {
      await saveDraft(currentDataRef.current);
    }
  }, [saveDraft]);

  // Periodic save
  useEffect(() => {
    if (!enabled || !estimateId) return;

    periodicTimerRef.current = setInterval(() => {
      if (currentDataRef.current && !deepEqual(currentDataRef.current, lastSavedDataRef.current)) {
        saveDraft(currentDataRef.current);
      }
    }, PERIODIC_SAVE_MS);

    return () => {
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
      }
    };
  }, [enabled, estimateId, saveDraft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
      }
    };
  }, []);

  // Handle beforeunload
  useEffect(() => {
    if (!enabled || !estimateId || !user?.id) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentDataRef.current && !deepEqual(currentDataRef.current, lastSavedDataRef.current)) {
        // Try to save with sendBeacon
        const localKey = getLocalStorageKey(estimateId, user.id);
        localStorage.setItem(localKey, JSON.stringify({
          payload: currentDataRef.current,
          timestamp: new Date().toISOString(),
        }));

        // Also try sendBeacon for server save
        try {
          const session = localStorage.getItem('supabase.auth.token');
          if (session) {
            navigator.sendBeacon(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-draft?estimateId=${estimateId}`,
              JSON.stringify({
                payload: currentDataRef.current,
                version: currentVersionRef.current,
                updatedAtClient: new Date().toISOString(),
              })
            );
          }
        } catch (error) {
          console.error('sendBeacon failed:', error);
        }

        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, estimateId, user?.id]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    setIsRestorePromptVisible(false);
  }, []);

  // Discard draft
  const discardDraft = useCallback(async () => {
    if (!estimateId || !user?.id) return;

    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-draft?estimateId=${estimateId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error deleting draft:', error);
    }

    // Clear local fallback
    const localKey = getLocalStorageKey(estimateId, user.id);
    localStorage.removeItem(localKey);

    setDraftInfo(null);
    setIsRestorePromptVisible(false);
    currentVersionRef.current = 0;
  }, [estimateId, user?.id]);

  // Clear draft (after successful save to main estimate)
  const clearDraft = useCallback(async () => {
    await discardDraft();
    lastSavedDataRef.current = null;
    currentDataRef.current = null;
  }, [discardDraft]);

  return {
    status,
    lastSavedAt,
    hasDraft: !!draftInfo,
    draftInfo,
    isRestorePromptVisible,
    restoreDraft,
    discardDraft,
    triggerSave,
    flushSave,
    clearDraft,
  };
}
