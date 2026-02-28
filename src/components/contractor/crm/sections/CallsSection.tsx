import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Copy, AlertCircle, Loader2, ChevronDown, Plus, Link2, X, Trash2, LayoutDashboard, PhoneCall, Settings, TrendingUp, Calendar, Users, ArrowRight } from 'lucide-react';
import { usePhoneNumber, useProvisionPhoneNumber, useDeletePhoneNumber } from '@/hooks/usePhoneNumbers';
import { useUserTier } from '@/hooks/useUserTier';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useCallSessions, CallSession } from '@/hooks/useCallSessions';
import { CallLogItem } from '../CallLogItem';
import { PredictiveSearch } from '../PredictiveSearch';
import { useJobs } from '@/hooks/useJobs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { CrmNavHeader } from '../CrmNavHeader';
import { ForgeCallCenter } from '../../forge/ForgeCallCenter';
import { ForgeSettings } from '../../forge/ForgeSettings';

type ForgeTab = 'dashboard' | 'call-center' | 'settings';

interface CallsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function CallsSection({ onSectionChange }: CallsSectionProps) {
  const { data: phoneNumber, isLoading: phoneLoading } = usePhoneNumber();
  const { subscription, hasFullAccess, isLoading: tierLoading } = useUserTier();
  const provisionMutation = useProvisionPhoneNumber();
  const deleteMutation = useDeletePhoneNumber();
  const { user } = useAuth();
  const { isAdmin } = useAdminAuth();
  const queryClient = useQueryClient();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [manualSid, setManualSid] = useState('');
  const { callSessions, isLoading: isLoadingCalls, updateCallSession } = useCallSessions();
  const { jobs } = useJobs();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<ForgeTab>('dashboard');
  const [isAiActive, setIsAiActive] = useState(false);
  const [stats, setStats] = useState({ callsToday: 0, appointmentsBooked: 0, leadsCaptured: 0, bookingRate: 0 });
  
  // Link to job dialog state
  const [linkingCall, setLinkingCall] = useState<CallSession | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [callerName, setCallerName] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const checkStatus = async () => {
      const { data: membership } = await supabase
        .from('contractor_users')
        .select('contractor_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (membership) {
        const { data: contractor } = await supabase
          .from('contractors')
          .select('voice_ai_enabled')
          .eq('id', membership.contractor_id)
          .maybeSingle();
        if (contractor?.voice_ai_enabled) setIsAiActive(true);
      }
      const { data: profile } = await supabase
        .from('contractor_ai_profiles')
        .select('ai_enabled')
        .eq('contractor_id', user.id)
        .maybeSingle();
      if (profile?.ai_enabled) setIsAiActive(true);
    };
    const loadStats = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: calls } = await supabase
        .from('calls')
        .select('id, outcome')
        .eq('contractor_id', user.id)
        .gte('created_at', todayStart.toISOString());
      if (calls) {
        const booked = calls.filter(c => c.outcome === 'booked' || c.outcome === 'appointment_booked').length;
        const leads = calls.filter(c => c.outcome === 'lead_captured' || c.outcome === 'booked').length;
        setStats({
          callsToday: calls.length,
          appointmentsBooked: booked,
          leadsCaptured: leads,
          bookingRate: calls.length > 0 ? Math.round((booked / calls.length) * 100) : 0,
        });
      }
    };
    checkStatus();
    loadStats();
  }, [user?.id]);

  const registerExistingNumber = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('phone_numbers')
        .insert({
          contractor_id: user?.id,
          twilio_phone_number: manualNumber,
          twilio_sid: manualSid,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-number', user?.id] });
      toast.success('Phone number registered successfully!');
      setShowManualEntry(false);
      setManualNumber('');
      setManualSid('');
    },
    onError: (error: any) => {
      console.error('Error registering phone number:', error);
      toast.error(error.message || 'Failed to register phone number');
    },
  });

  const hasActivePaidSubscription = hasFullAccess || 
    (subscription?.status === 'active' && 
    subscription?.tier_id !== 'trial' && 
    subscription?.tier_id !== 'bot_user');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Phone number copied to clipboard');
  };

  const handleProvision = () => {
    provisionMutation.mutate(undefined);
  };

  const handleLinkToJob = (call: CallSession) => {
    setLinkingCall(call);
    setCallerName(call.caller_name || '');
    setSelectedJobId(call.job_id || null);
  };

  const handleSaveLinkToJob = async () => {
    if (!linkingCall) return;
    
    setIsLinking(true);
    try {
      await updateCallSession(linkingCall.id, {
        job_id: selectedJobId || undefined,
        caller_name: callerName || undefined,
      });
      toast.success('Call updated successfully');
      setLinkingCall(null);
      setSelectedJobId(null);
      setCallerName('');
    } catch (error: any) {
      toast.error('Failed to update call: ' + error.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleCallSelect = (call: CallSession) => {
    // Scroll to the call and expand it - for now just show toast
    toast.info(`Viewing call from ${formatPhoneNumber(call.from_number)}`);
  };

  if (phoneLoading || tierLoading) {
    return (
      <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
          <div>
            <h1 className="text-3xl font-bold">Calls</h1>
            <p className="text-muted-foreground">Manage your call history and phone number</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        {/* Navigation Header */}
        <CrmNavHeader
          back
          dashboard
          onBack={() => onSectionChange?.('dashboard')}
          onDashboard={() => onSectionChange?.('dashboard')}
          sectionLabel="Calls"
        />
        
        {phoneNumber ? (
          <div className="space-y-4">
            {/* Forge AI Tab Navigation */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1 overflow-x-auto">
                {([
                  { key: 'dashboard' as ForgeTab, label: 'Dashboard', icon: LayoutDashboard },
                  { key: 'call-center' as ForgeTab, label: 'Call Center', icon: PhoneCall },
                  { key: 'settings' as ForgeTab, label: 'Settings', icon: Settings },
                ]).map((tab) => (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.key)}
                    className={activeTab === tab.key ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                  >
                    <tab.icon className="h-4 w-4 mr-1.5" />
                    {tab.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs px-2 py-1 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-green-500" />
                  {phoneNumber.twilio_phone_number}
                  <button onClick={() => copyToClipboard(phoneNumber.twilio_phone_number)} className="hover:text-primary">
                    <Copy className="h-3 w-3" />
                  </button>
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-1 ${isAiActive ? 'border-green-300 text-green-700' : 'text-muted-foreground'}`}
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isAiActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  {isAiActive ? 'Voice AI Active' : 'AI Inactive'}
                </Badge>
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>

            {/* Admin delete confirmation */}
            {isAdmin && showDeleteConfirm && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Delete this phone number?</span>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}
                      onClick={() => { deleteMutation.mutate({ phoneNumberId: phoneNumber.id, contractorId: phoneNumber.contractor_id }); setShowDeleteConfirm(false); }}
                    >
                      {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Welcome to Forge AI</h2>
                    <p className="text-muted-foreground text-sm">Your intelligent voice AI intake & booking platform</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: <Phone className="h-5 w-5 text-orange-500" />, value: stats.callsToday, label: 'Calls Today' },
                    { icon: <Calendar className="h-5 w-5 text-orange-500" />, value: stats.appointmentsBooked, label: 'Appointments Booked' },
                    { icon: <Users className="h-5 w-5 text-orange-500" />, value: stats.leadsCaptured, label: 'Leads Captured' },
                    { icon: <TrendingUp className="h-5 w-5 text-orange-500" />, value: `${stats.bookingRate}%`, label: 'Booking Rate' },
                  ].map((stat) => (
                    <Card key={stat.label} className="border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">{stat.icon}<span className="text-xs text-muted-foreground">—</span></div>
                        <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('call-center')} className="text-left group">
                    <Card className="h-full border hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Call Center</h3>
                          <p className="text-sm text-muted-foreground mt-1">View recordings, transcripts, and booking status</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                      </CardContent>
                    </Card>
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="text-left group">
                    <Card className="h-full border hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Voice AI Settings</h3>
                          <p className="text-sm text-muted-foreground mt-1">Configure hours, booking rules, and integrations</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                      </CardContent>
                    </Card>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'call-center' && (
              <ForgeCallCenter onBack={() => setActiveTab('dashboard')} />
            )}

            {activeTab === 'settings' && (
              <ForgeSettings onBack={() => setActiveTab('dashboard')} />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Calls</h1>
              <p className="text-muted-foreground">Manage your call history and phone number</p>
            </div>
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Get Your CT1 Phone Number
              </CardTitle>
              <CardDescription>
                {hasActivePaidSubscription
                  ? "Register your existing Twilio number or generate a new one"
                  : "Upgrade to access dedicated phone number"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasActivePaidSubscription ? (
                <>
                  {!showManualEntry ? (
                    <div className="space-y-4">
                      <div className="text-center space-y-2 py-4">
                        <Phone className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="font-semibold">No Phone Number Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Register your existing Twilio number or generate a new CT1 phone number 
                          with AI-powered call handling.
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <Button
                          onClick={() => setShowManualEntry(true)}
                          variant="default"
                          className="w-full"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Register Existing Twilio Number
                        </Button>
                        <Button
                          onClick={handleProvision}
                          disabled={provisionMutation.isPending}
                          variant="outline"
                          className="w-full"
                        >
                          {provisionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Provisioning Number...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Generate New CT1 Number
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowManualEntry(false)}
                          className="mb-4"
                        >
                          <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
                          Back
                        </Button>
                        <h3 className="font-semibold mb-2">Register Existing Twilio Number</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enter your Twilio phone number and SID to register it with CT1.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+1234567890"
                            value={manualNumber}
                            onChange={(e) => setManualNumber(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Include country code (e.g., +1 for US)
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">
                            Twilio SID
                          </label>
                          <input
                            type="text"
                            placeholder="PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            value={manualSid}
                            onChange={(e) => setManualSid(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Find this in your Twilio console under Phone Numbers
                          </p>
                        </div>
                        <Button
                          onClick={() => registerExistingNumber.mutate()}
                          disabled={!manualNumber || !manualSid || registerExistingNumber.isPending}
                          className="w-full"
                        >
                          {registerExistingNumber.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            'Register Number'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Subscription Required</AlertTitle>
                  <AlertDescription>
                    A paid subscription is required to get a dedicated phone number.{' '}
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => onSectionChange?.('account')}
                    >
                      Upgrade your account
                    </Button>
                    {' '}to unlock this feature.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          </div>
        )}
      </div>

      {/* Link to Job Dialog */}
      <Dialog open={!!linkingCall} onOpenChange={(open) => !open && setLinkingCall(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Link Call to Job
            </DialogTitle>
            <DialogDescription>
              {linkingCall && `Associate this call from ${formatPhoneNumber(linkingCall.from_number)} with a job.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Caller Name</Label>
              <Input
                placeholder="Enter caller's name..."
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Link to Job (Optional)</Label>
              <PredictiveSearch
                items={jobs}
                placeholder="Search jobs by name or number..."
                getLabel={(job) => job.name}
                getSublabel={(job) => job.job_number ? `#${job.job_number}` : undefined}
                filterFn={(job, query) => {
                  const q = query.toLowerCase();
                  return job.name.toLowerCase().includes(q) || 
                    job.job_number?.toLowerCase().includes(q) || false;
                }}
                onSelect={(job) => setSelectedJobId(job.id)}
              />
              {selectedJobId && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <span className="text-sm flex-1">
                    {jobs.find(j => j.id === selectedJobId)?.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedJobId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingCall(null)}>Cancel</Button>
            <Button onClick={handleSaveLinkToJob} disabled={isLinking}>
              {isLinking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
