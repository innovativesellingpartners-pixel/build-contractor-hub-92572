import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  dashboardOrder: 'ct1_dashboard_tile_order',
  dashboardHidden: 'ct1_dashboard_hidden_tiles',
  bottomNavOrder: 'ct1_bottomnav_order',
  menuOrder: 'ct1_menu_order',
} as const;

type StorageKey = keyof typeof STORAGE_KEYS;

export function useLayoutPreferences<T extends string>(
  key: StorageKey,
  defaultOrder: T[]
): {
  order: T[];
  setOrder: (newOrder: T[]) => void;
  resetToDefault: () => void;
} {
  const storageKey = STORAGE_KEYS[key];

  const [order, setOrderState] = useState<T[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as T[];
        // Validate that all default items exist (handles new items added after save)
        const allDefaultsPresent = defaultOrder.every(item => parsed.includes(item));
        const noExtraItems = parsed.every(item => defaultOrder.includes(item));
        if (allDefaultsPresent && noExtraItems) {
          return parsed;
        }
        // Merge: keep saved order for existing items, append new ones
        const merged = parsed.filter(item => defaultOrder.includes(item));
        defaultOrder.forEach(item => {
          if (!merged.includes(item)) {
            merged.push(item);
          }
        });
        // Persist merged result so new items are saved
        localStorage.setItem(storageKey, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.error('Failed to load layout preferences:', e);
    }
    return defaultOrder;
  });

  const setOrder = useCallback((newOrder: T[]) => {
    setOrderState(newOrder);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
    } catch (e) {
      console.error('Failed to save layout preferences:', e);
    }
  }, [storageKey]);

  const resetToDefault = useCallback(() => {
    setOrderState(defaultOrder);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error('Failed to reset layout preferences:', e);
    }
  }, [storageKey, defaultOrder]);

  return { order, setOrder, resetToDefault };
}

// Helper to reorder array after drag
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const [removed] = newArray.splice(from, 1);
  newArray.splice(to, 0, removed);
  return newArray;
}
