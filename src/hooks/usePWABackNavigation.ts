import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to prevent browser back button from exiting the app
 * Works in all mobile browsers by maintaining a proper history state
 */
export function usePWABackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Define where back button should navigate based on current route
  const getBackDestination = useCallback((currentPath: string): string | null => {
    // Protected app routes - go to dashboard
    if (currentPath.startsWith('/crm') || 
        currentPath.startsWith('/reporting') || 
        currentPath.startsWith('/accounting') ||
        currentPath.startsWith('/pay-bill') ||
        currentPath.startsWith('/dashboard/training') ||
        currentPath.startsWith('/dashboard/marketplace')) {
      return '/dashboard';
    }
    
    // Already at dashboard or home - no navigation needed
    if (currentPath === '/dashboard' || currentPath === '/') {
      return null;
    }
    
    // Admin routes - go to admin root
    if (currentPath.startsWith('/admin') && currentPath !== '/admin') {
      return '/admin';
    }
    
    // Feature/product pages - go to home
    if (currentPath.startsWith('/features/') || 
        currentPath.startsWith('/products/') ||
        currentPath.startsWith('/business-suite')) {
      return '/';
    }
    
    // Other authenticated routes - go to dashboard
    if (currentPath.startsWith('/dashboard')) {
      return '/dashboard';
    }
    
    // Public pages - go to home
    return '/';
  }, []);

  useEffect(() => {
    // Only apply on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Push an initial history state if we don't have one
    const initializeHistory = () => {
      if (!window.history.state?.ct1Initialized) {
        // Replace current state with our marker
        window.history.replaceState(
          { ct1Initialized: true, ct1Path: location.pathname },
          ''
        );
        // Push a guard state so back button triggers popstate within our app
        window.history.pushState(
          { ct1Guard: true, ct1Path: location.pathname },
          ''
        );
      }
    };

    initializeHistory();

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      
      // If we hit our guard state or went back past it
      if (!state?.ct1Guard) {
        // Determine where to go
        const destination = getBackDestination(location.pathname);
        
        if (destination) {
          // Navigate within the app
          navigate(destination, { replace: false });
        }
        
        // Re-establish the guard state to prevent exit on next back press
        window.history.pushState(
          { ct1Guard: true, ct1Path: location.pathname },
          ''
        );
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, navigate, getBackDestination]);

  // Re-establish guard when route changes
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Small delay to let React Router finish updating
    const timer = setTimeout(() => {
      const state = window.history.state;
      // Only push guard if we don't already have one for this path
      if (!state?.ct1Guard || state?.ct1Path !== location.pathname) {
        window.history.pushState(
          { ct1Guard: true, ct1Path: location.pathname },
          ''
        );
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);
}
