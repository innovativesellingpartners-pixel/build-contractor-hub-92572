import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NewLandingPage } from '@/components/NewLandingPage';

export const HomeRedirect = () => {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect logged-in users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show landing page for non-logged-in users
  return <NewLandingPage />;
};
