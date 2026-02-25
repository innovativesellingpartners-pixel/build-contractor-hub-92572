import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, ShoppingCart, Activity, ClipboardList, Briefcase, UserCheck } from 'lucide-react';
import ActivitySummaryWidget from '@/components/contractor/crm/sections/ActivitySummaryWidget';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_stats').single();

      if (error) {
        console.error('Admin stats error:', error);
        return {
          totalUsers: 0,
          totalCourses: 0,
          totalServices: 0,
          totalRoles: 0,
          totalLeads: 0,
          totalJobs: 0,
          totalCustomers: 0,
        };
      }

      return {
        totalUsers: data?.total_users ?? 0,
        totalCourses: data?.total_courses ?? 0,
        totalServices: data?.total_services ?? 0,
        totalRoles: data?.total_roles ?? 0,
        totalLeads: data?.total_leads ?? 0,
        totalJobs: data?.total_jobs ?? 0,
        totalCustomers: data?.total_customers ?? 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, to: '/admin/users' },
    { title: 'Total Leads', value: stats?.totalLeads || 0, icon: ClipboardList, to: '/admin/leads' },
    { title: 'Total Jobs', value: stats?.totalJobs || 0, icon: Briefcase, to: '/admin/jobs' },
    { title: 'Total Customers', value: stats?.totalCustomers || 0, icon: UserCheck, to: '/admin/customers' },
    { title: 'Training Courses', value: stats?.totalCourses || 0, icon: BookOpen, to: '/admin/training' },
    { title: 'Marketplace Services', value: stats?.totalServices || 0, icon: ShoppingCart, to: '/admin/marketplace' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
        <p className="text-muted-foreground">Overview of your ConstructeAM platform</p>
      </div>

      <ActivitySummaryWidget />

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link to="/admin/users" className="p-3 border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium text-sm">Manage Users</div>
              <div className="text-xs text-muted-foreground">View and edit users</div>
            </Link>
            <Link to="/admin/leads" className="p-3 border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium text-sm">View Leads</div>
              <div className="text-xs text-muted-foreground">All contractor leads</div>
            </Link>
            <Link to="/admin/marketplace" className="p-3 border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium text-sm">Marketplace</div>
              <div className="text-xs text-muted-foreground">Manage services</div>
            </Link>
            <Link to="/admin/support" className="p-3 border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium text-sm">Support Tickets</div>
              <div className="text-xs text-muted-foreground">View open tickets</div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.to}>
            <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Activity tracking coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};