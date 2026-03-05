import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Copy, AlertCircle, Loader2, ChevronDown, Plus, Link2, X, Trash2, LayoutDashboard, PhoneCall, Settings, TrendingUp, Calendar, Users, ArrowRight, Flame } from 'lucide-react';
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
import forgeLogoIcon from '@/assets/forgeailogo2.png';
import forgeLogoFull from '@/assets/forgeailogo.png';

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

    const loadDashboardData = async () => {
      const { data: membership } = await supabase
        .from('contractor_users')
        .select('contractor_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      const contractorId = membership?.contractor_id ?? user.id;

      const [contractorRes, profileRes, sessionsCountRes, callsCountRes, bookedCountRes, leadsCountRes] = await Promise.all([
        supabase
          .from('contractors')
          .select('voice_ai_enabled')
          .eq('id', contractorId)
          .maybeSingle(),
        supabase
          .from('contractor_ai_profiles')
          .select('ai_enabled')
          .eq('contractor_id', contractorId)
          .maybeSingle(),
        supabase
          .from('call_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('contractor_id', contractorId),
        supabase
          .from('calls')
          .select('id', { count: 'exact', head: true })
          .eq('contractor_id', contractorId),
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('contractor_id', contractorId),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .in('user_id', contractorId === user.id ? [user.id] : [user.id, contractorId]),
      ]);

      setIsAiActive(Boolean(contractorRes.data?.voice_ai_enabled || profileRes.data?.ai_enabled));

      const totalCalls = Math.max(sessionsCountRes.count ?? 0, callsCountRes.count ?? 0);
      const booked = bookedCountRes.count ?? 0;
      const leads = leadsCountRes.count ?? 0;

      setStats({
        callsToday: totalCalls,
        appointmentsBooked: booked,
        leadsCaptured: leads,
        bookingRate: totalCalls > 0 ? Math.round((booked / totalCalls) * 100) : 0,
      });
    };

    loadDashboardData();
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
    toast.success('Copied to clipboard');
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

  if (phoneLoading || tierLoading) {
    return (
      <div className="w-full pb-20 bg-background">
        <div className="p-4 sm:p-6 space-y-6 w-full sm:max-w-6xl sm:mx-auto">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const forgeTabItems = [
    { key: 'dashboard' as ForgeTab, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'call-center' as ForgeTab, label: 'Call Center', icon: PhoneCall },
    { key: 'settings' as ForgeTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full pb-20 bg-background">
      <div className="p-4 sm:p-6 w-full sm:max-w-6xl sm:mx-auto space-y-6">
        {/* Back Nav */}
        <CrmNavHeader
          back
          dashboard
          onBack={() => onSectionChange?.('dashboard')}
          onDashboard={() => onSectionChange?.('dashboard')}
          sectionLabel="Forge AI"
        />

        {phoneNumber ? (
          <div className="space-y-6">
            {/* ── Branded Header Bar ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} />
              
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-900 border border-white/90 flex items-center justify-center shrink-0 drop-shadow-lg"><img src={forgeLogoIcon} alt="Forge AI" className="h-7 w-7 object-contain" /></div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Forge<span className="text-orange-400">AI</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Intelligent voice AI intake & booking</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 ${
                      isAiActive 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isAiActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                    {isAiActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge className="bg-slate-700/60 text-slate-300 border-0 text-xs px-3 py-1.5 rounded-full font-mono">
                    <Phone className="h-3 w-3 mr-1.5 text-orange-400" />
                    {phoneNumber.twilio_phone_number}
                    <button onClick={() => copyToClipboard(phoneNumber.twilio_phone_number)} className="ml-1.5 hover:text-white transition-colors">
                      <Copy className="h-3 w-3" />
                    </button>
                  </Badge>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="relative flex items-center gap-1 mt-5 border-t border-slate-700/50 pt-4">
                {forgeTabItems.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Admin delete confirmation */}
            {isAdmin && showDeleteConfirm && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Delete this phone number? This cannot be undone.</span>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}
                      onClick={() => { deleteMutation.mutate({ phoneNumberId: phoneNumber.id, contractorId: phoneNumber.contractor_id }); setShowDeleteConfirm(false); }}
                    >
                      {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Delete'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* ── Dashboard Tab ── */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: Phone, value: stats.callsToday, label: 'Total Calls', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { icon: Calendar, value: stats.appointmentsBooked, label: 'Booked', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { icon: Users, value: stats.leadsCaptured, label: 'Leads', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { icon: TrendingUp, value: `${stats.bookingRate}%`, label: 'Booking Rate', color: 'text-violet-500', bg: 'bg-violet-500/10' },
                  ].map((stat) => (
                    <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${stat.bg} mb-3`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('call-center')} className="text-left group">
                    <Card className="h-full border hover:border-orange-300/50 hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                          <PhoneCall className="h-6 w-6 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold">Call Center</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">Recordings, transcripts & booking status</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </CardContent>
                    </Card>
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="text-left group">
                    <Card className="h-full border hover:border-orange-300/50 hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-500/10 flex items-center justify-center shrink-0 group-hover:bg-slate-500/20 transition-colors">
                          <Settings className="h-6 w-6 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold">Voice AI Settings</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">Hours, booking rules & integrations</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </CardContent>
                    </Card>
                  </button>
                </div>

                {/* Contractor ID for admins */}
                {isAdmin && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Contractor ID:</span>
                    <code className="bg-muted px-2 py-0.5 rounded font-mono">{phoneNumber.contractor_id}</code>
                    <button onClick={() => { navigator.clipboard.writeText(phoneNumber.contractor_id); toast.success('Contractor ID copied'); }} className="hover:text-foreground">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
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
          /* ── No Phone Number State ── */
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-center">
              <img src={forgeLogoFull} alt="Forge AI" className="h-12 mx-auto mb-4" />
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                AI-powered voice intake & appointment booking for contractors
              </p>
            </div>
            <CardContent className="p-6 space-y-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-orange-500" />
                Get Your Forge Phone Number
              </CardTitle>
              <CardDescription>
                {hasActivePaidSubscription
                  ? "Register your existing number or generate a new one to get started."
                  : "Upgrade your subscription to access Forge AI voice features."}
              </CardDescription>

              {hasActivePaidSubscription ? (
                <>
                  {!showManualEntry ? (
                    <div className="grid gap-3 pt-2">
                      <Button onClick={() => setShowManualEntry(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                        <Phone className="mr-2 h-4 w-4" />
                        Register Existing Twilio Number
                      </Button>
                      <Button onClick={handleProvision} disabled={provisionMutation.isPending} variant="outline" className="w-full">
                        {provisionMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Provisioning...</>
                        ) : (
                          <><Plus className="mr-2 h-4 w-4" />Generate New Number</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowManualEntry(false)}>
                        <ChevronDown className="mr-2 h-4 w-4 rotate-90" />Back
                      </Button>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                          <input type="tel" placeholder="+1234567890" value={manualNumber} onChange={(e) => setManualNumber(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
                          <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +1 for US)</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Twilio SID</label>
                          <input type="text" placeholder="PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={manualSid} onChange={(e) => setManualSid(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
                          <p className="text-xs text-muted-foreground mt-1">Find this in your Twilio console under Phone Numbers</p>
                        </div>
                        <Button onClick={() => registerExistingNumber.mutate()} disabled={!manualNumber || !manualSid || registerExistingNumber.isPending}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                          {registerExistingNumber.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering...</> : 'Register Number'}
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
                    <Button variant="link" className="h-auto p-0" onClick={() => onSectionChange?.('account')}>
                      Upgrade your account
                    </Button>
                    {' '}to unlock this feature.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
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
              <Input placeholder="Enter caller's name..." value={callerName} onChange={(e) => setCallerName(e.target.value)} />
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
                  return job.name.toLowerCase().includes(q) || job.job_number?.toLowerCase().includes(q) || false;
                }}
                onSelect={(job) => setSelectedJobId(job.id)}
              />
              {selectedJobId && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <span className="text-sm flex-1">{jobs.find(j => j.id === selectedJobId)?.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedJobId(null)}><X className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingCall(null)}>Cancel</Button>
            <Button onClick={handleSaveLinkToJob} disabled={isLinking} className="bg-orange-500 hover:bg-orange-600 text-white">
              {isLinking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
