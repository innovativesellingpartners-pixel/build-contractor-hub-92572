import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to handle iOS PWA back button/swipe navigation
 * Prevents the app from exiting when user swipes back on iOS
 */
export function usePWABackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if running as a standalone PWA
  const isStandalone = useCallback(() => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.location.search.includes('source=pwa')
    );
  }, []);

  useEffect(() => {
    // Only apply this logic for standalone PWA mode
    if (!isStandalone()) return;

    // Push initial state to ensure we have history to work with
    // This prevents the first back gesture from exiting the app
    const initialState = { pwa: true, path: location.pathname };
    
    // Only push if we don't already have a state
    if (!window.history.state?.pwa) {
      window.history.replaceState(initialState, '', location.pathname + location.search);
    }

    const handlePopState = (event: PopStateEvent) => {
      // If we're at the root and trying to go back, prevent exit
      if (location.pathname === '/' || location.pathname === '/dashboard') {
        // Push a new state to prevent exiting
        window.history.pushState({ pwa: true, preventExit: true }, '', location.pathname);
        return;
      }

      // If the event has our PWA state, let React Router handle it
      if (event.state?.pwa) {
        return;
      }

      // Otherwise, navigate back within the app
      event.preventDefault();
      
      // Determine where to go back to based on current location
      const pathParts = location.pathname.split('/').filter(Boolean);
      
      if (pathParts.length > 1) {
        // Go up one level in the path hierarchy
        const parentPath = '/' + pathParts.slice(0, -1).join('/');
        navigate(parentPath, { replace: true });
      } else if (location.pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
      } else if (location.pathname !== '/dashboard' && location.pathname !== '/') {
        // Go to dashboard for authenticated routes, or home for public routes
        const protectedPaths = ['/crm', '/reporting', '/accounting', '/pay-bill'];
        const isProtected = protectedPaths.some(p => location.pathname.startsWith(p));
        navigate(isProtected ? '/dashboard' : '/', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Also handle the beforeunload to try to prevent accidental exits
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show prompt if there are unsaved changes (you can customize this)
      // For now, we just ensure proper history state
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isStandalone, location.pathname, location.search, navigate]);

  // Ensure each navigation adds proper history state
  useEffect(() => {
    if (!isStandalone()) return;

    // Replace current state with PWA-aware state on each navigation
    if (!window.history.state?.pwa) {
      window.history.replaceState(
        { pwa: true, path: location.pathname },
        '',
        location.pathname + location.search
      );
    }
  }, [isStandalone, location.pathname, location.search]);
}
