import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAuth } from '@/contexts/AuthContext';
import { DemoProvider } from '@/contexts/DemoContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export const DemoWorkspace = () => {
  const { user } = useAuth();
  const { isSuperAdmin, isAdmin, isLoading: roleLoading } = useAdminAuth();
  const { enabled: demoEnabled, isLoading: flagLoading } = useFeatureFlag('admin_demo_workspace_enabled');

  // Log access
  useEffect(() => {
    if (user?.id && (isSuperAdmin || isAdmin) && demoEnabled) {
      supabase.from('demo_access_log').insert({
        user_id: user.id,
        action: 'workspace_access',
        details: { timestamp: new Date().toISOString() },
      }).then(() => {});
    }
  }, [user?.id, isSuperAdmin, isAdmin, demoEnabled]);

  if (roleLoading || flagLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSuperAdmin && !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (!demoEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Demo Workspace is currently disabled.</p>
      </div>
    );
  }

  return (
    <DemoProvider>
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="warning" className="text-xs font-semibold px-3 py-1">
            Demo Workspace – Internal Use Only
          </Badge>
        </div>
        <Outlet />
      </div>
    </DemoProvider>
  );
};
