import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({ 
  pullDistance, 
  isRefreshing, 
  threshold = 80 
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const opacity = pullDistance > 10 ? Math.min(progress * 1.5, 1) : 0;
  const scale = 0.5 + (progress * 0.5);
  const rotation = isRefreshing ? 0 : progress * 180;

  if (pullDistance <= 5 && !isRefreshing) return null;

  return (
    <div 
      className="absolute left-0 right-0 flex justify-center z-10 pointer-events-none"
      style={{ 
        top: `${Math.max(pullDistance - 40, 8)}px`,
        opacity,
        transition: isRefreshing ? 'none' : 'opacity 0.1s ease-out'
      }}
    >
      <div 
        className={cn(
          "bg-primary text-primary-foreground rounded-full p-2 shadow-lg",
          isRefreshing && "animate-spin"
        )}
        style={{ 
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <RefreshCw className="w-5 h-5" />
      </div>
    </div>
  );
}
