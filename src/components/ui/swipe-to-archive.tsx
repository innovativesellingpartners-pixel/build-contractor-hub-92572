import { useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Archive } from 'lucide-react';

interface SwipeToArchiveProps {
  children: ReactNode;
  onArchive: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function SwipeToArchive({ 
  children, 
  onArchive, 
  threshold = 100,
  className,
  disabled = false
}: SwipeToArchiveProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow right swipe (positive direction)
    if (diff > 0) {
      // Add resistance after threshold
      const resistance = diff > threshold ? 0.3 : 1;
      const cappedDiff = diff > threshold 
        ? threshold + (diff - threshold) * resistance 
        : diff;
      setTranslateX(cappedDiff);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsSwiping(false);
    
    if (translateX >= threshold) {
      // Trigger archive
      setTranslateX(0);
      onArchive();
    } else {
      // Reset position
      setTranslateX(0);
    }
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsSwiping(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSwiping) return;
      currentX.current = e.clientX;
      const diff = currentX.current - startX.current;
      
      if (diff > 0) {
        const resistance = diff > threshold ? 0.3 : 1;
        const cappedDiff = diff > threshold 
          ? threshold + (diff - threshold) * resistance 
          : diff;
        setTranslateX(cappedDiff);
      }
    };

    const handleMouseUp = () => {
      setIsSwiping(false);
      if (translateX >= threshold) {
        setTranslateX(0);
        onArchive();
      } else {
        setTranslateX(0);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const progress = Math.min(translateX / threshold, 1);
  const showArchiveIndicator = translateX > 20;

  return (
    <div className={cn('relative overflow-hidden', className)} ref={containerRef}>
      {/* Archive indicator background */}
      <div 
        className={cn(
          'absolute inset-y-0 left-0 flex items-center justify-start pl-4 transition-all duration-200',
          showArchiveIndicator ? 'bg-orange-500' : 'bg-orange-400'
        )}
        style={{ 
          width: `${translateX}px`,
          opacity: Math.min(progress * 1.5, 1)
        }}
      >
        <Archive 
          className={cn(
            'h-5 w-5 text-white transition-transform',
            progress >= 1 && 'scale-125'
          )} 
        />
        {progress >= 0.5 && (
          <span className="ml-2 text-white text-sm font-medium">Archive</span>
        )}
      </div>

      {/* Swipeable content */}
      <div
        className={cn(
          'relative bg-background transition-transform',
          !isSwiping && 'duration-200'
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
}
