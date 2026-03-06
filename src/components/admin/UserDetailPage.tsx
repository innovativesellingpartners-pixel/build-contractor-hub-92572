import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, User, CreditCard, Phone as PhoneIcon, Bot, Shield } from 'lucide-react';
import { VoiceAISettings } from './VoiceAISettings';
import { PaymentProviderSettings } from './PaymentProviderSettings';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProfileEditContent } from '@/components/contractor/ProfileEditContent';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  // Admin-editable fields
  const [subscriptionTier, setSubscriptionTier] = useState('');
  const [pocketbotAccess, setPocketbotAccess] = useState('none');
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'voice-ai') setActiveTab('voice-ai');
    if (tab === 'payments') setActiveTab('payments');
    if (tab === 'admin') setActiveTab('admin');
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

  // Load admin fields when user data arrives
  useEffect(() => {
    if (user) {
      setSubscriptionTier(user.profile?.subscription_tier || 'launch');
      setPocketbotAccess(
        user.profile?.pocketbot_access_type || 
        (user.profile?.pocketbot_full_access ? 'free_full' : 'none')
      );
      setUserRole(user.role || 'user');
    }
  }, [user]);

  const saveAdminSettingsMutation = useMutation({
    mutationFn: async () => {
      // Update profile fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: subscriptionTier,
          pocketbot_access_type: pocketbotAccess,
          pocketbot_full_access: pocketbotAccess !== 'none',
        })
        .eq('user_id', userId!);
      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase.functions.invoke('admin-update-role', {
        body: { userId: userId!, newRole: userRole },
      });
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      toast.success('Admin settings saved');
      queryClient.invalidateQueries({ queryKey: ['adminUser', userId] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save settings');
    },
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>

      {/* User Summary Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">{user.profile?.contact_name || user.profile?.company_name || 'No Name'}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user.contractor?.contractor_number && (
                  <Badge variant="outline" className="font-mono">#{user.contractor.contractor_number}</Badge>
                )}
                {user.profile?.subscription_tier && (
                  <Badge variant="secondary">{user.profile.subscription_tier}</Badge>
                )}
                <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'outline'} className="capitalize">
                  {user.role}
                </Badge>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground space-y-1">
              <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
              <p>Last Login: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</p>
              {user.profile?.updated_at && (
                <p>Last Edited: {new Date(user.profile.updated_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <Edit className="h-3.5 w-3.5" />
            Profile & Branding
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Admin Settings
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="voice-ai" className="flex items-center gap-1.5">
            <PhoneIcon className="h-3.5 w-3.5" />
            Voice AI
          </TabsTrigger>
        </TabsList>

        {/* Full Profile Editor Tab */}
        <TabsContent value="profile" className="mt-6">
          <ProfileEditContent targetUserId={userId!} />
        </TabsContent>

        {/* Admin Settings Tab */}
        <TabsContent value="admin" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage subscription, role, and feature access for this user
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Role
                </Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Subscription Tier */}
              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Select value={subscriptionTier} onValueChange={setSubscriptionTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free (Full Access)</SelectItem>
                    <SelectItem value="launch">Launch</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="accel">Accel</SelectItem>
                    <SelectItem value="bot_user">Bot User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Pocket Agent Access */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Pocket Agent Access
                </Label>
                <p className="text-xs text-muted-foreground">
                  Set the AI chat assistant access level for this user
                </p>
                <Select value={pocketbotAccess} onValueChange={setPocketbotAccess}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Access (Limited Free Prompts)</SelectItem>
                    <SelectItem value="free_full">Free Full Access</SelectItem>
                    <SelectItem value="paid">Paid Full Access ($20/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button 
                onClick={() => saveAdminSettingsMutation.mutate()} 
                disabled={saveAdminSettingsMutation.isPending}
                className="w-full"
              >
                {saveAdminSettingsMutation.isPending ? 'Saving...' : 'Save Admin Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentProviderSettings contractorId={userId!} />
        </TabsContent>

        <TabsContent value="voice-ai" className="mt-6">
          <VoiceAISettings contractorId={userId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
