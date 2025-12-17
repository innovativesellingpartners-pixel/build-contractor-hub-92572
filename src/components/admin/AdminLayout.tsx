import { Outlet, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

export const AdminLayout = () => {
  const { signOut } = useAuth();
  const { isAdmin, isLoading } = useAdminAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="border-b bg-card px-3 sm:px-6 py-3 sm:py-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-1">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />
                </SheetContent>
              </Sheet>
            )}
            <img src={ct1Logo} alt="CT1 Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
            <h1 className="text-lg sm:text-2xl font-bold text-primary">CT1 Admin</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="outline" 
              asChild
              size={isMobile ? "icon" : "default"}
              className="flex items-center gap-2"
            >
              <Link to="/dashboard">
                <Home className="h-4 w-4" />
                {!isMobile && <span>Back to Contractor Hub</span>}
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={signOut}
              size={isMobile ? "icon" : "default"}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {!isMobile && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Desktop sidebar */}
        {!isMobile && <AdminSidebar />}
        <main className="flex-1 p-3 sm:p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};