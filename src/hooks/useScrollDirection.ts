import { useState, useEffect, useRef, RefObject } from 'react';

export function useScrollDirection(scrollRef: RefObject<HTMLElement | null>, threshold = 10) {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const currentScrollTop = el.scrollTop;
      const diff = currentScrollTop - lastScrollTop.current;

      if (Math.abs(diff) > threshold) {
        setIsScrollingDown(diff > 0);
        lastScrollTop.current = currentScrollTop;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef, threshold]);

  return isScrollingDown;
}
