import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { VoiceAISettings } from './VoiceAISettings';
import { PaymentProviderSettings } from './PaymentProviderSettings';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'voice-ai') setActiveTab('voice-ai');
    if (tab === 'payments') setActiveTab('payments');
  }, [searchParams]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['adminUser', userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      if (error) throw error;
      
      const users = data.users as any[];
      const foundUser = users.find((u: any) => u.id === userId);
      if (!foundUser) throw new Error('User not found');
      
      return foundUser;
    },
    enabled: !!userId,
  });

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{user.profile?.contact_name || 'No Name'}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="voice-ai">Voice AI</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-base">{user.profile?.company_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{user.profile?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CT1 Number</p>
                  <p className="text-base">{user.profile?.ct1_contractor_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subscription Tier</p>
                  <p className="text-base">{user.profile?.subscription_tier || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="text-base capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-base">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <PaymentProviderSettings contractorId={userId!} />
            </TabsContent>

            <TabsContent value="voice-ai" className="mt-6">
              <VoiceAISettings contractorId={userId!} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
