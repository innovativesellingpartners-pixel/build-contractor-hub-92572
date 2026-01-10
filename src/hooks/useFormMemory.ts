import { useState, useEffect, useCallback } from 'react';

interface FormMemoryEntry {
  value: string;
  count: number;
  lastUsed: number;
}

interface FormMemoryStore {
  [fieldKey: string]: FormMemoryEntry[];
}

const STORAGE_KEY = 'ct1_form_memory';
const MAX_ENTRIES_PER_FIELD = 10;
const MEMORY_EXPIRY_DAYS = 90;

function getStorageKey(formId: string): string {
  return `${STORAGE_KEY}_${formId}`;
}

function loadMemory(formId: string): FormMemoryStore {
  try {
    const stored = localStorage.getItem(getStorageKey(formId));
    if (!stored) return {};
    
    const memory: FormMemoryStore = JSON.parse(stored);
    const now = Date.now();
    const expiryMs = MEMORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    // Clean up expired entries
    Object.keys(memory).forEach(fieldKey => {
      memory[fieldKey] = memory[fieldKey].filter(
        entry => now - entry.lastUsed < expiryMs
      );
    });
    
    return memory;
  } catch (error) {
    console.error('Error loading form memory:', error);
    return {};
  }
}

function saveMemory(formId: string, memory: FormMemoryStore): void {
  try {
    localStorage.setItem(getStorageKey(formId), JSON.stringify(memory));
  } catch (error) {
    console.error('Error saving form memory:', error);
  }
}

export function useFormMemory(formId: string) {
  const [memory, setMemory] = useState<FormMemoryStore>(() => loadMemory(formId));

  // Save memory whenever it changes
  useEffect(() => {
    saveMemory(formId, memory);
  }, [formId, memory]);

  // Record a value for a field
  const recordValue = useCallback((fieldKey: string, value: string) => {
    if (!value || value.trim().length === 0) return;
    
    const trimmedValue = value.trim();
    
    setMemory(prev => {
      const fieldEntries = [...(prev[fieldKey] || [])];
      const existingIndex = fieldEntries.findIndex(
        e => e.value.toLowerCase() === trimmedValue.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        // Update existing entry
        fieldEntries[existingIndex] = {
          ...fieldEntries[existingIndex],
          count: fieldEntries[existingIndex].count + 1,
          lastUsed: Date.now(),
        };
      } else {
        // Add new entry
        fieldEntries.push({
          value: trimmedValue,
          count: 1,
          lastUsed: Date.now(),
        });
      }
      
      // Sort by frequency and recency, keep top entries
      fieldEntries.sort((a, b) => {
        // Weighted score: frequency + recency bonus
        const scoreA = a.count + (Date.now() - a.lastUsed < 7 * 24 * 60 * 60 * 1000 ? 2 : 0);
        const scoreB = b.count + (Date.now() - b.lastUsed < 7 * 24 * 60 * 60 * 1000 ? 2 : 0);
        return scoreB - scoreA;
      });
      
      return {
        ...prev,
        [fieldKey]: fieldEntries.slice(0, MAX_ENTRIES_PER_FIELD),
      };
    });
  }, []);

  // Record multiple values at once (e.g., on form submit)
  const recordValues = useCallback((values: Record<string, string>) => {
    Object.entries(values).forEach(([fieldKey, value]) => {
      recordValue(fieldKey, value);
    });
  }, [recordValue]);

  // Get suggestions for a field, optionally filtered by current input
  const getSuggestions = useCallback((fieldKey: string, currentInput?: string): string[] => {
    const entries = memory[fieldKey] || [];
    let suggestions = entries.map(e => e.value);
    
    if (currentInput && currentInput.trim().length > 0) {
      const lowerInput = currentInput.toLowerCase();
      suggestions = suggestions.filter(s => 
        s.toLowerCase().includes(lowerInput) || 
        s.toLowerCase().startsWith(lowerInput)
      );
    }
    
    return suggestions;
  }, [memory]);

  // Get the most recently used value for a field
  const getLastUsed = useCallback((fieldKey: string): string | null => {
    const entries = memory[fieldKey] || [];
    if (entries.length === 0) return null;
    
    // Find entry with most recent lastUsed
    const sorted = [...entries].sort((a, b) => b.lastUsed - a.lastUsed);
    return sorted[0]?.value || null;
  }, [memory]);

  // Get the most frequently used value for a field
  const getMostFrequent = useCallback((fieldKey: string): string | null => {
    const entries = memory[fieldKey] || [];
    if (entries.length === 0) return null;
    
    const sorted = [...entries].sort((a, b) => b.count - a.count);
    return sorted[0]?.value || null;
  }, [memory]);

  // Clear memory for a specific field or all fields
  const clearMemory = useCallback((fieldKey?: string) => {
    if (fieldKey) {
      setMemory(prev => {
        const newMemory = { ...prev };
        delete newMemory[fieldKey];
        return newMemory;
      });
    } else {
      setMemory({});
    }
  }, []);

  return {
    recordValue,
    recordValues,
    getSuggestions,
    getLastUsed,
    getMostFrequent,
    clearMemory,
  };
}
