import { useState, useRef, useCallback, TouchEvent } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Distance in pixels to trigger refresh
  resistance?: number; // How much resistance when pulling (higher = harder to pull)
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  handlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
  };
  containerRef: React.RefObject<HTMLDivElement>;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh when at the top of scroll container
    if (containerRef.current && containerRef.current.scrollTop <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isRefreshing]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Only allow pulling down
    if (diff > 0 && containerRef.current && containerRef.current.scrollTop <= 0) {
      // Apply resistance to make pulling feel more natural
      const distance = Math.min(diff / resistance, threshold * 1.5);
      setPullDistance(distance);
    }
  }, [isRefreshing, resistance, threshold]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold / 2); // Keep some distance while refreshing
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    isRefreshing,
    pullDistance,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    containerRef,
  };
}
