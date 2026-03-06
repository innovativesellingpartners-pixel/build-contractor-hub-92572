import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, User, CreditCard, Phone as PhoneIcon, Bot, Shield, DollarSign, Zap, MessageSquare, Loader2, Check, X } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
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

  // Subscription management
  const [platformFree, setPlatformFree] = useState(false);
  const [chatAgentEnabled, setChatAgentEnabled] = useState(false);
  const [chatAgentFree, setChatAgentFree] = useState(false);
  const [forgeAiEnabled, setForgeAiEnabled] = useState(false);
  const [forgeAiFree, setForgeAiFree] = useState(false);

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

  // Fetch existing subscriptions for this user
  const { data: subscriptions } = useQuery({
    queryKey: ['adminUserSubscriptions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId!)
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
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

  // Load subscription states when subscriptions data arrives
  useEffect(() => {
    if (subscriptions) {
      const platformSub = subscriptions.find((s: any) => !s.addon_type && s.status === 'active');
      const chatSub = subscriptions.find((s: any) => s.addon_type === 'chat_agent' && s.status === 'active');
      const forgeSub = subscriptions.find((s: any) => s.addon_type === 'forge_ai' && s.status === 'active');

      if (platformSub) {
        setPlatformFree(platformSub.is_free || false);
      }
      if (chatSub) {
        setChatAgentEnabled(true);
        setChatAgentFree(chatSub.is_free || false);
      }
      if (forgeSub) {
        setForgeAiEnabled(true);
        setForgeAiFree(forgeSub.is_free || false);
      }
    }
  }, [subscriptions]);

  const saveAdminSettingsMutation = useMutation({
    mutationFn: async () => {
      // Update profile fields
      const pocketbotValue = chatAgentEnabled 
        ? (chatAgentFree ? 'free_full' : 'paid') 
        : pocketbotAccess;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: subscriptionTier,
          pocketbot_access_type: pocketbotValue,
          pocketbot_full_access: chatAgentEnabled || pocketbotValue !== 'none',
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

  // Manage subscription (create/update/cancel)
  const manageSubscriptionMutation = useMutation({
    mutationFn: async (params: { 
      tierId: string; 
      addonType?: string; 
      isFree: boolean; 
      priceCents: number; 
      action: 'activate' | 'cancel';
    }) => {
      if (params.action === 'cancel') {
        // Cancel existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('user_id', userId!)
          .eq('status', 'active')
          .eq(params.addonType ? 'addon_type' : 'tier_id', params.addonType || params.tierId);
        if (error) throw error;
        return;
      }

      if (params.isFree) {
        // Admin grants free access — just create/update subscription record
        // First cancel any existing active subscription of this type
        if (params.addonType) {
          await supabase
            .from('subscriptions')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('user_id', userId!)
            .eq('addon_type', params.addonType)
            .eq('status', 'active');
        } else {
          await supabase
            .from('subscriptions')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('user_id', userId!)
            .is('addon_type', null)
            .eq('status', 'active');
        }

        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId!,
            tier_id: params.tierId,
            billing_cycle: 'monthly',
            status: 'active',
            is_free: true,
            price_cents: 0,
            addon_type: params.addonType || null,
            started_at: new Date().toISOString(),
          });
        if (error) throw error;
      } else {
        // Paid subscription — create Clover recurring charge
        const { data, error } = await supabase.functions.invoke('clover-create-subscription', {
          body: {
            userId: userId!,
            tierId: params.tierId,
            addonType: params.addonType || null,
            priceCents: params.priceCents,
            billingCycle: 'monthly',
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }
    },
    onSuccess: () => {
      toast.success('Subscription updated');
      queryClient.invalidateQueries({ queryKey: ['adminUserSubscriptions', userId] });
      queryClient.invalidateQueries({ queryKey: ['adminUser', userId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update subscription');
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

  const platformSub = subscriptions?.find((s: any) => !s.addon_type && s.status === 'active');
  const chatSub = subscriptions?.find((s: any) => s.addon_type === 'chat_agent' && s.status === 'active');
  const forgeSub = subscriptions?.find((s: any) => s.addon_type === 'forge_ai' && s.status === 'active');

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
          <div className="space-y-6">
            {/* Role & Tier Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role & Access
                </CardTitle>
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

                <Button 
                  onClick={() => saveAdminSettingsMutation.mutate()} 
                  disabled={saveAdminSettingsMutation.isPending}
                  className="w-full"
                >
                  {saveAdminSettingsMutation.isPending ? 'Saving...' : 'Save Role Settings'}
                </Button>
              </CardContent>
            </Card>

            {/* Subscription Management Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Subscription Management
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage platform subscription and add-on services. Paid subscriptions are billed through Clover.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform Subscription */}
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Launch Platform
                      </h4>
                      <p className="text-sm text-muted-foreground">Full CRM, estimating, jobs, and accounting</p>
                    </div>
                    <div className="text-right">
                      {platformSub ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          Active {platformSub.is_free ? '(Free)' : '($250/mo)'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="platform-free"
                        checked={platformFree}
                        onCheckedChange={setPlatformFree}
                      />
                      <Label htmlFor="platform-free" className="text-sm">Grant Free Access</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        manageSubscriptionMutation.mutate({
                          tierId: 'launch',
                          isFree: platformFree,
                          priceCents: 25000,
                          action: 'activate',
                        });
                        // Also update profile tier
                        setSubscriptionTier('launch');
                        saveAdminSettingsMutation.mutate();
                      }}
                      disabled={manageSubscriptionMutation.isPending}
                    >
                      {manageSubscriptionMutation.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : null}
                      {platformSub ? 'Update' : 'Activate'} {platformFree ? '(Free)' : '($250/mo via Clover)'}
                    </Button>
                    {platformSub && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => manageSubscriptionMutation.mutate({
                          tierId: 'launch',
                          isFree: false,
                          priceCents: 0,
                          action: 'cancel',
                        })}
                        disabled={manageSubscriptionMutation.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Chat Agent Add-on */}
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        Pocket Agent (Chat AI)
                      </h4>
                      <p className="text-sm text-muted-foreground">AI chat assistant for contractors</p>
                    </div>
                    <div className="text-right">
                      {chatSub ? (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">
                          <Check className="h-3 w-3 mr-1" />
                          Active {chatSub.is_free ? '(Free)' : '($10/mo)'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="chat-free"
                        checked={chatAgentFree}
                        onCheckedChange={setChatAgentFree}
                      />
                      <Label htmlFor="chat-free" className="text-sm">Grant Free Access</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => manageSubscriptionMutation.mutate({
                        tierId: 'chat_agent',
                        addonType: 'chat_agent',
                        isFree: chatAgentFree,
                        priceCents: 1000,
                        action: 'activate',
                      })}
                      disabled={manageSubscriptionMutation.isPending}
                    >
                      {chatSub ? 'Update' : 'Activate'} {chatAgentFree ? '(Free)' : '($10/mo via Clover)'}
                    </Button>
                    {chatSub && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => manageSubscriptionMutation.mutate({
                          tierId: 'chat_agent',
                          addonType: 'chat_agent',
                          isFree: false,
                          priceCents: 0,
                          action: 'cancel',
                        })}
                        disabled={manageSubscriptionMutation.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Forge AI Add-on */}
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        Forge AI (Voice AI)
                      </h4>
                      <p className="text-sm text-muted-foreground">AI voice assistant for inbound calls</p>
                    </div>
                    <div className="text-right">
                      {forgeSub ? (
                        <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">
                          <Check className="h-3 w-3 mr-1" />
                          Active {forgeSub.is_free ? '(Free)' : '($20/mo)'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="forge-free"
                        checked={forgeAiFree}
                        onCheckedChange={setForgeAiFree}
                      />
                      <Label htmlFor="forge-free" className="text-sm">Grant Free Access</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => manageSubscriptionMutation.mutate({
                        tierId: 'forge_ai',
                        addonType: 'forge_ai',
                        isFree: forgeAiFree,
                        priceCents: 2000,
                        action: 'activate',
                      })}
                      disabled={manageSubscriptionMutation.isPending}
                    >
                      {forgeSub ? 'Update' : 'Activate'} {forgeAiFree ? '(Free)' : '($20/mo via Clover)'}
                    </Button>
                    {forgeSub && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => manageSubscriptionMutation.mutate({
                          tierId: 'forge_ai',
                          addonType: 'forge_ai',
                          isFree: false,
                          priceCents: 0,
                          action: 'cancel',
                        })}
                        disabled={manageSubscriptionMutation.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold">Monthly Billing Summary</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Launch Platform</span>
                      <span>{platformSub ? (platformSub.is_free ? 'Free' : '$250.00') : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pocket Agent</span>
                      <span>{chatSub ? (chatSub.is_free ? 'Free' : '$10.00') : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Forge AI</span>
                      <span>{forgeSub ? (forgeSub.is_free ? 'Free' : '$20.00') : '—'}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>
                        ${(
                          (platformSub && !platformSub.is_free ? 250 : 0) +
                          (chatSub && !chatSub.is_free ? 10 : 0) +
                          (forgeSub && !forgeSub.is_free ? 20 : 0)
                        ).toFixed(2)}/mo
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
