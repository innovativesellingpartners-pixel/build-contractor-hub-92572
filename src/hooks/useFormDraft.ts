import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFT_PREFIX = 'ct1-draft-';
const DEBOUNCE_MS = 1000;

/**
 * Auto-saves form data to localStorage with debounced writes.
 * Restores saved draft on mount. Clears draft on successful submit.
 * 
 * @param key - Unique key for this form (e.g. 'add-lead', 'add-job')
 * @param defaultValues - The initial/empty form values
 * @returns [formData, setFormData, clearDraft, hasDraft]
 */
export function useFormDraft<T extends Record<string, any>>(
  key: string,
  defaultValues: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void, boolean] {
  const storageKey = `${DRAFT_PREFIX}${key}`;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hasDraft, setHasDraft] = useState(false);

  const [formData, setFormData] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHasDraft(true);
        // Merge with defaults so new fields aren't missing
        return { ...defaultValues, ...parsed };
      }
    } catch {
      // ignore
    }
    return defaultValues;
  });

  // Debounced save to localStorage
  useEffect(() => {
    // Don't save if form is at defaults
    const hasData = Object.keys(defaultValues).some((k) => {
      const val = formData[k];
      const def = defaultValues[k];
      return val !== def && val !== '' && val !== undefined && val !== null;
    });

    if (!hasData) {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
        setHasDraft(true);
      } catch {
        // storage full, ignore
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [formData, storageKey, defaultValues]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setFormData(defaultValues);
    setHasDraft(false);
  }, [storageKey, defaultValues]);

  return [formData, setFormData, clearDraft, hasDraft];
}

/**
 * Version for react-hook-form: watches form values and persists them.
 * Returns restore values and clearDraft.
 */
export function useFormDraftRHF<T extends Record<string, any>>(
  key: string,
  defaultValues: T
): { savedValues: T | null; clearDraft: () => void; saveDraft: (values: T) => void; hasDraft: boolean } {
  const storageKey = `${DRAFT_PREFIX}${key}`;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const savedValues: T | null = (() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { ...defaultValues, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return null;
  })();

  // Set hasDraft on mount
  useEffect(() => {
    setHasDraft(savedValues !== null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveDraft = useCallback((values: T) => {
    const hasData = Object.keys(defaultValues).some((k) => {
      const val = values[k];
      const def = defaultValues[k];
      return val !== def && val !== '' && val !== undefined && val !== null;
    });

    if (!hasData) {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
        setHasDraft(true);
      } catch { /* ignore */ }
    }, DEBOUNCE_MS);
  }, [storageKey, defaultValues]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
  }, [storageKey]);

  return { savedValues, clearDraft, saveDraft, hasDraft };
}
