import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, ShoppingCart, Activity, ClipboardList, Briefcase, UserCheck } from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [
        usersResult,
        coursesResult,
        servicesResult,
        profilesResult,
        leadsResult,
        jobsResult,
        customersResult,
      ] = await Promise.all([
        supabase.from('user_roles').select('id', { count: 'exact', head: true }),
        supabase.from('training_courses').select('id', { count: 'exact', head: true }),
        supabase.from('marketplace_services').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: profilesResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalServices: servicesResult.count || 0,
        totalRoles: usersResult.count || 0,
        totalLeads: leadsResult.count || 0,
        totalJobs: jobsResult.count || 0,
        totalCustomers: customersResult.count || 0,
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
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Total Leads',
      value: stats?.totalLeads || 0,
      icon: ClipboardList,
      description: 'All contractor leads',
    },
    {
      title: 'Total Jobs',
      value: stats?.totalJobs || 0,
      icon: Briefcase,
      description: 'Jobs across platform',
    },
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: UserCheck,
      description: 'Customer accounts',
    },
    {
      title: 'Training Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      description: 'Available courses',
    },
    {
      title: 'Marketplace Services',
      value: stats?.totalServices || 0,
      icon: ShoppingCart,
      description: 'Listed services',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your ConstructeAM platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Activity tracking coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Link to="/admin/users" className="p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <div className="font-medium">Manage Users</div>
                <div className="text-sm text-muted-foreground">View and edit users</div>
              </Link>
              <Link to="/admin/training" className="p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <div className="font-medium">Add Course</div>
                <div className="text-sm text-muted-foreground">Create training content</div>
              </Link>
              <Link to="/admin/marketplace" className="p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <div className="font-medium">Marketplace</div>
                <div className="text-sm text-muted-foreground">Manage services</div>
              </Link>
              <Link to="/admin/users" className="p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <div className="font-medium">Add User</div>
                <div className="text-sm text-muted-foreground">Create new contractor</div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};