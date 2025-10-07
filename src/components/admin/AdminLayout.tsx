import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Home } from 'lucide-react';

export const AdminLayout = () => {
  const { signOut } = useAuth();
  const { isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">ConstructeAM Admin</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              asChild
              className="flex items-center gap-2"
            >
              <Link to="/dashboard">
                <Home className="h-4 w-4" />
                Back to Contractor Hub
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};