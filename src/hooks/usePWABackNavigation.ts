import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to handle back button/swipe navigation across all browsers
 * Works for PWA standalone mode, DuckDuckGo, Safari, Chrome, and all other browsers
 * Prevents the app from exiting when user presses back on iOS/Android
 */
export function usePWABackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const historyStack = useRef<string[]>([]);
  const isInitialized = useRef(false);

  // Check if running as a standalone PWA
  const isStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.location.search.includes('source=pwa')
    );
  };

  // Check if this is a mobile browser (where back navigation is more critical)
  const isMobileBrowser = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  useEffect(() => {
    // Initialize history tracking
    if (!isInitialized.current) {
      historyStack.current = [location.pathname];
      isInitialized.current = true;
      
      // Mark the initial state with our app marker
      window.history.replaceState(
        { ct1App: true, path: location.pathname, index: 0 },
        '',
        location.pathname + location.search
      );
    }
  }, []);

  // Track navigation changes
  useEffect(() => {
    const currentPath = location.pathname;
    const stack = historyStack.current;
    
    // Add to stack if it's a new path (not going back)
    if (stack[stack.length - 1] !== currentPath) {
      // Check if we're going back (path matches earlier in stack)
      const existingIndex = stack.lastIndexOf(currentPath);
      if (existingIndex >= 0 && existingIndex < stack.length - 1) {
        // We went back, trim the stack
        historyStack.current = stack.slice(0, existingIndex + 1);
      } else {
        // New navigation, add to stack
        historyStack.current.push(currentPath);
      }
    }

    // Ensure current state has our marker
    if (!window.history.state?.ct1App) {
      window.history.replaceState(
        { ct1App: true, path: currentPath, index: historyStack.current.length - 1 },
        '',
        location.pathname + location.search
      );
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    // Apply to all mobile browsers and PWAs
    if (!isMobileBrowser() && !isStandalone()) return;

    const handlePopState = (event: PopStateEvent) => {
      const stack = historyStack.current;
      const currentPath = location.pathname;
      
      // If this is our app's state, the browser is handling it correctly
      if (event.state?.ct1App) {
        return;
      }

      // Prevent default browser behavior
      event.preventDefault();
      event.stopPropagation();

      // Determine where to navigate
      if (stack.length > 1) {
        // Go to previous page in our internal stack
        const previousPath = stack[stack.length - 2];
        historyStack.current = stack.slice(0, -1);
        navigate(previousPath, { replace: true });
      } else {
        // At root of our app - determine where to go based on context
        if (currentPath === '/' || currentPath === '/dashboard') {
          // Already at home, push state to prevent exit
          window.history.pushState(
            { ct1App: true, path: currentPath, preventExit: true },
            '',
            currentPath
          );
        } else {
          // Navigate to appropriate home based on route type
          const protectedPaths = ['/crm', '/reporting', '/accounting', '/pay-bill', '/dashboard'];
          const isProtected = protectedPaths.some(p => currentPath.startsWith(p));
          const homePath = isProtected ? '/dashboard' : '/';
          historyStack.current = [homePath];
          navigate(homePath, { replace: true });
        }
      }
    };

    // Use capture phase to intercept before React Router
    window.addEventListener('popstate', handlePopState, true);

    return () => {
      window.removeEventListener('popstate', handlePopState, true);
    };
  }, [location.pathname, navigate]);

  // Handle hardware back button on Android via visibilitychange
  useEffect(() => {
    if (!isMobileBrowser()) return;

    let lastVisibilityTime = Date.now();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeDiff = Date.now() - lastVisibilityTime;
        // If we're coming back very quickly (< 500ms), it might be a back button
        // that caused a brief exit attempt - ensure we have valid state
        if (timeDiff < 500 && historyStack.current.length === 0) {
          historyStack.current = [location.pathname];
        }
      } else {
        lastVisibilityTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);
}
