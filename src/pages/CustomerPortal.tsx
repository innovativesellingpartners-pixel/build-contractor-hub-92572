import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Home, FileText, Camera, MessageSquare, CreditCard,
  Send, Upload, CheckCircle2, Clock, AlertCircle, Loader2,
  Building2, MapPin, Phone, Mail, Calendar, ChevronRight,
  CalendarDays, MapPinned, Wrench, Flag, CircleDot,
  ArrowLeft, LayoutDashboard, Plus, Pencil, DollarSign
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FinixPaymentForm } from '@/components/payments/FinixPaymentForm';
import { cn } from '@/lib/utils';
import ct1Logo from '@/assets/ct1-powered-by-logo.png';
import { AddEditEventDialog, DeleteEventButton, EmailScheduleDialog } from '@/components/portal/PortalScheduleManager';

interface PortalData {
  id: string;
  token: string;
  job_id: string;
  customer_id: string | null;
  contractor_id: string;
  is_active: boolean;
}

export default function CustomerPortal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Check if current viewer is the contractor (owner)
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-portal'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });


  const { data: portalData, isLoading, error } = useQuery({
    queryKey: ['portal', token],
    queryFn: async () => {
      if (!token) throw new Error('No token');

      const { data: portalToken, error: tokenError } = await supabase
        .from('customer_portal_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (tokenError || !portalToken) throw new Error('Invalid or expired portal link');

      if (portalToken.expires_at && new Date(portalToken.expires_at) < new Date()) {
        throw new Error('This portal link has expired');
      }

      await supabase
        .from('customer_portal_tokens')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', portalToken.id);

      const { data: job } = await supabase
        .from('jobs')
        .select('id, job_number, name, description, job_status, contract_value, total_contract_value, payments_collected, expenses_total, start_date, end_date, address, city, state, trade_type, user_id')
        .eq('id', portalToken.job_id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, contact_name, phone, business_email, logo_url, brand_primary_color, finix_merchant_id, zelle_email, zelle_phone, ach_instructions, accepted_payment_methods')
        .eq('id', portalToken.contractor_id)
        .single();

      let customer = null;
      if (portalToken.customer_id) {
        const { data: cust } = await supabase
          .from('customers')
          .select('name, email, phone')
          .eq('id', portalToken.customer_id)
          .single();
        customer = cust;
      }

      return {
        portalToken: portalToken as PortalData,
        job: job!,
        contractor: profile!,
        customer,
      };
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Portal Unavailable</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'This portal link is invalid or has expired.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { portalToken, job, contractor, customer } = portalData;
  const isContractor = !!(currentUser && portalToken.contractor_id === currentUser.id);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Contractor-only navigation bar */}
      {isContractor && (
        <div className="bg-primary text-primary-foreground sticky top-0 z-[60]">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Job
            </Button>
            <span className="text-xs font-medium opacity-75 hidden sm:inline">Contractor Preview</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              onClick={() => navigate('/')}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Header with branding */}
      <header className={cn("bg-card border-b sticky z-50 shadow-sm", isContractor ? "top-[40px]" : "top-0")}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {contractor.logo_url ? (
              <img src={contractor.logo_url} alt="" className="h-11 w-11 rounded-xl object-cover border shadow-sm" />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-primary/10 border flex items-center justify-center shadow-sm">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-base sm:text-lg truncate">
                {contractor.company_name || 'Your Contractor'}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {job.name || job.description || `Job ${job.job_number || ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-0.5 overflow-x-auto pb-0 -mb-px scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap border-b-2',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {activeTab === 'overview' && <OverviewTab job={job} contractor={contractor} />}
        {activeTab === 'schedule' && <ScheduleTab jobId={job.id} isContractor={isContractor} contractorId={portalToken.contractor_id} portalTokenId={portalToken.id} />}
        {activeTab === 'documents' && <DocumentsTab jobId={job.id} />}
        {activeTab === 'photos' && <PhotosTab jobId={job.id} portalTokenId={portalToken.id} customerName={customer?.name} />}
        {activeTab === 'messages' && (
          <MessagesTab
            portalTokenId={portalToken.id}
            jobId={job.id}
            customerName={customer?.name || 'Customer'}
            contractorName={contractor.company_name || 'Contractor'}
            isContractor={isContractor}
          />
        )}
        {activeTab === 'payments' && <PaymentsTab jobId={job.id} job={job} />}
      </main>

      <footer className="border-t bg-card mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
            <span>Customer Portal - {contractor.company_name}</span>
            <div className="flex gap-4">
              {contractor.phone && (
                <a href={`tel:${contractor.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Phone className="h-3 w-3" /> {contractor.phone}
                </a>
              )}
              {contractor.business_email && (
                <a href={`mailto:${contractor.business_email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Mail className="h-3 w-3" /> Email
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <img src={ct1Logo} alt="CT1" className="h-6 w-auto" />
            <span className="text-xs font-semibold tracking-wide text-muted-foreground">POWERED BY CT1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==================== SCHEDULE TAB ====================
function ScheduleTab({ jobId, isContractor = false, contractorId, portalTokenId }: { jobId: string; isContractor?: boolean; contractorId?: string; portalTokenId?: string }) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [clickedDate, setClickedDate] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: events, isLoading } = useQuery({
    queryKey: ['portal-calendar-events', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_calendar_events')
        .select('*')
        .eq('job_id', jobId)
        .order('event_date', { ascending: true });
      return data || [];
    },
  });

  const eventTypeConfig: Record<string, { icon: typeof Flag; color: string; label: string }> = {
    milestone: { icon: Flag, color: 'bg-primary/10 text-primary border-primary/20', label: 'Milestone' },
    inspection: { icon: CheckCircle2, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Inspection' },
    delivery: { icon: MapPinned, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Delivery' },
    work: { icon: Wrench, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Work Day' },
    meeting: { icon: Building2, color: 'bg-violet-500/10 text-violet-600 border-violet-500/20', label: 'Meeting' },
    other: { icon: CircleDot, color: 'bg-muted text-muted-foreground border-border', label: 'Other' },
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    scheduled: { color: 'bg-blue-500/10 text-blue-600', label: 'Scheduled' },
    in_progress: { color: 'bg-amber-500/10 text-amber-600', label: 'In Progress' },
    completed: { color: 'bg-emerald-500/10 text-emerald-600', label: 'Completed' },
    cancelled: { color: 'bg-destructive/10 text-destructive', label: 'Cancelled' },
    postponed: { color: 'bg-muted text-muted-foreground', label: 'Postponed' },
  };

  // Group events by month
  const now = new Date();
  const upcomingEvents = events?.filter(e => new Date(e.event_date) >= new Date(now.toDateString())) || [];
  const pastEvents = events?.filter(e => new Date(e.event_date) < new Date(now.toDateString())) || [];

  // Calendar grid for selected month
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const eventsThisMonth = events?.filter(e => {
    const d = new Date(e.event_date);
    return d.getMonth() === month && d.getFullYear() === year;
  }) || [];

  const eventsByDay: Record<number, typeof eventsThisMonth> = {};
  eventsThisMonth.forEach(e => {
    const day = new Date(e.event_date).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  const prevMonth = () => setSelectedMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedMonth(new Date(year, month + 1, 1));

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const renderEventCard = (event: any) => {
    const typeConf = eventTypeConfig[event.event_type] || eventTypeConfig.other;
    const statConf = statusConfig[event.status] || statusConfig.scheduled;
    const TypeIcon = typeConf.icon;

    return (
      <div key={event.id} className={cn('rounded-xl border p-4 space-y-2 transition-colors', typeConf.color)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-background/80 border flex items-center justify-center shrink-0">
              <TypeIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{event.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.event_date + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                </span>
                {!event.is_all_day && event.start_time && (
                  <span className="text-xs text-muted-foreground">
                    • {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                  </span>
                )}
                {event.is_all_day && (
                  <span className="text-xs text-muted-foreground">• All Day</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge className={cn('text-[10px]', statConf.color)}>{statConf.label}</Badge>
            {isContractor && contractorId && (
              <>
                <AddEditEventDialog
                  jobId={jobId}
                  contractorId={contractorId}
                  event={event}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <DeleteEventButton eventId={event.id} jobId={jobId} />
              </>
            )}
          </div>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground pl-[46px] leading-relaxed">{event.description}</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mini Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Project Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              {isContractor && contractorId && (
                <>
                  <EmailScheduleDialog jobId={jobId} contractorId={contractorId} events={events || []} portalTokenId={portalTokenId} />
                  <AddEditEventDialog
                    jobId={jobId}
                    contractorId={contractorId}
                    trigger={
                      <Button size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Add Event
                      </Button>
                    }
                  />
                </>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="bg-background min-h-[80px] sm:min-h-[100px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const dayEvents = eventsByDay[day] || [];
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <div
                  key={day}
                  onClick={() => {
                    if (isContractor && contractorId) {
                      setClickedDate(dateStr);
                      setShowAddDialog(true);
                    }
                  }}
                  className={cn(
                    'bg-background min-h-[80px] sm:min-h-[100px] flex flex-col p-1 relative transition-colors',
                    isToday && 'ring-2 ring-primary ring-inset',
                    isContractor && contractorId && 'cursor-pointer hover:bg-muted/50'
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium mb-0.5',
                    isToday ? 'text-primary font-bold' : 'text-foreground'
                  )}>{day}</span>
                  <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium',
                          e.event_type === 'milestone' ? 'bg-primary/15 text-primary' :
                          e.event_type === 'inspection' ? 'bg-amber-500/15 text-amber-600' :
                          e.event_type === 'delivery' ? 'bg-emerald-500/15 text-emerald-600' :
                          e.event_type === 'work' ? 'bg-blue-500/15 text-blue-600' :
                          e.event_type === 'meeting' ? 'bg-violet-500/15 text-violet-600' :
                          'bg-muted text-muted-foreground'
                        )}
                        title={e.title}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
            {Object.entries(eventTypeConfig).map(([key, conf]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn('h-2 w-2 rounded-full',
                  key === 'milestone' ? 'bg-primary' :
                  key === 'inspection' ? 'bg-amber-500' :
                  key === 'delivery' ? 'bg-emerald-500' :
                  key === 'work' ? 'bg-blue-500' :
                  key === 'meeting' ? 'bg-violet-500' :
                  'bg-muted-foreground'
                )} />
                <span className="text-[11px] text-muted-foreground">{conf.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Upcoming Events
          {upcomingEvents.length > 0 && (
            <Badge variant="secondary" className="text-xs">{upcomingEvents.length}</Badge>
          )}
        </h3>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map(renderEventCard)}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming events scheduled</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Your contractor will add schedule items here</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Past Events
          </h3>
          <div className="space-y-2 opacity-70">
            {pastEvents.map(renderEventCard)}
          </div>
        </div>
      )}

      {/* Controlled Add Event Dialog for clicking on calendar days */}
      {isContractor && contractorId && clickedDate && (
        <AddEditEventDialog
          jobId={jobId}
          contractorId={contractorId}
          defaultDate={clickedDate}
          open={showAddDialog}
          onOpenChange={(v) => {
            setShowAddDialog(v);
            if (!v) setClickedDate(null);
          }}
        />
      )}
    </div>
  );
}


function OverviewTab({ job, contractor }: { job: any; contractor: any }) {
  const statusConfig: Record<string, { color: string; label: string; icon: typeof CheckCircle2 }> = {
    not_started: { color: 'bg-muted text-muted-foreground', label: 'Not Started', icon: Clock },
    scheduled: { color: 'bg-blue-500/10 text-blue-600', label: 'Scheduled', icon: Calendar },
    in_progress: { color: 'bg-amber-500/10 text-amber-600', label: 'In Progress', icon: Clock },
    on_hold: { color: 'bg-muted text-muted-foreground', label: 'On Hold', icon: AlertCircle },
    completed: { color: 'bg-emerald-500/10 text-emerald-600', label: 'Completed', icon: CheckCircle2 },
    cancelled: { color: 'bg-destructive/10 text-destructive', label: 'Cancelled', icon: AlertCircle },
  };

  const status = statusConfig[job.job_status || 'not_started'] || statusConfig.not_started;
  const StatusIcon = status.icon;
  const totalValue = job.total_contract_value || job.contract_value || 0;
  const paid = job.payments_collected || 0;
  const remaining = Math.max(0, totalValue - paid);
  const paymentProgress = totalValue > 0 ? (paid / totalValue) * 100 : 0;

  const { data: tasks } = useQuery({
    queryKey: ['portal-tasks', job.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, description, status, scheduled_start, scheduled_end')
        .eq('job_id', job.id)
        .order('scheduled_start', { ascending: true });
      return data || [];
    },
  });

  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Hero project card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold truncate">{job.name || job.description || `Job ${job.job_number}`}</h2>
              {job.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{job.address}{job.city ? `, ${job.city}` : ''}{job.state ? `, ${job.state}` : ''}</span>
                </p>
              )}
            </div>
            <Badge className={cn('text-xs shrink-0 gap-1', status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          {/* Key dates inline */}
          {(job.start_date || job.end_date) && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              {job.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-medium">{format(new Date(job.start_date), 'MMM d, yyyy')}</span>
                </div>
              )}
              {job.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Est. Completion:</span>
                  <span className="font-medium">{format(new Date(job.end_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress cards - side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Job Progress</p>
            <span className="text-lg font-bold">{Math.round(taskProgress)}%</span>
          </div>
          <Progress value={taskProgress} className="h-2.5" />
          <p className="text-xs text-muted-foreground">{completedTasks} of {totalTasks} tasks complete</p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payments</p>
            <span className="text-lg font-bold">{Math.round(paymentProgress)}%</span>
          </div>
          <Progress value={paymentProgress} className="h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${paid.toLocaleString()} paid</span>
            <span>${remaining.toLocaleString()} remaining</span>
          </div>
        </div>
      </div>

      {/* Contractor contact card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-muted/40 border-b">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Your Contractor
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            {contractor.logo_url ? (
              <img src={contractor.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover border" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{contractor.company_name}</p>
              {contractor.contact_name && <p className="text-xs text-muted-foreground">{contractor.contact_name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contractor.phone && (
              <a href={`tel:${contractor.phone}`} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Phone className="h-4 w-4 text-primary" />
                <span>{contractor.phone}</span>
              </a>
            )}
            {contractor.business_email && (
              <a href={`mailto:${contractor.business_email}`} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Mail className="h-4 w-4 text-primary" />
                <span className="truncate">{contractor.business_email}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Task checklist */}
      {tasks && tasks.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
            <p className="text-sm font-semibold">Task Progress</p>
            <Badge variant="outline" className="text-xs">{completedTasks}/{totalTasks}</Badge>
          </div>
          <div className="divide-y">
            {tasks.slice(0, 8).map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : task.status === 'in_progress' ? (
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <span className={cn('text-sm flex-1', task.status === 'completed' && 'line-through text-muted-foreground')}>
                  {task.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== DOCUMENTS TAB ====================
function DocumentsTab({ jobId }: { jobId: string }) {
  const { data: estimates } = useQuery({
    queryKey: ['portal-estimates', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('estimates')
        .select('id, estimate_number, title, total_amount, grand_total, status, public_token, created_at')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ['portal-invoices', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount_due, amount_paid, status, public_token, created_at, due_date')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: changeOrders } = useQuery({
    queryKey: ['portal-change-orders', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('change_orders')
        .select('id, change_order_number, description, additional_cost, status, public_token, created_at')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" /> Estimates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {estimates && estimates.length > 0 ? (
            <div className="space-y-3">
              {estimates.map((est) => (
                <a
                  key={est.id}
                  href={est.public_token ? `/estimate/${est.public_token}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{est.title || est.estimate_number}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(est.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">${(est.grand_total || est.total_amount || 0).toLocaleString()}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No estimates yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <a
                  key={inv.id}
                  href={inv.public_token ? `/invoice/${inv.public_token}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">${(inv.amount_due || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">${(inv.amount_paid || 0).toLocaleString()} paid</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          )}
        </CardContent>
      </Card>

      {changeOrders && changeOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" /> Change Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {changeOrders.map((co) => (
                <a
                  key={co.id}
                  href={co.public_token ? `/change-order/${co.public_token}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{co.description}</p>
                    <p className="text-xs text-muted-foreground">{co.change_order_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">+${(co.additional_cost || 0).toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">{co.status}</Badge>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== PHOTOS TAB ====================
function PhotosTab({ jobId, portalTokenId, customerName }: { jobId: string; portalTokenId: string; customerName?: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const { data: jobPhotos } = useQuery({
    queryKey: ['portal-job-photos', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_photos')
        .select('id, photo_url, caption, created_at')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: customerPhotos } = useQuery({
    queryKey: ['portal-customer-photos', portalTokenId],
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_photo_uploads')
        .select('*')
        .eq('portal_token_id', portalTokenId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const fileName = `portal/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('job-photos')
          .getPublicUrl(fileName);

        await supabase.from('portal_photo_uploads').insert({
          portal_token_id: portalTokenId,
          job_id: jobId,
          photo_url: publicUrl,
          uploaded_by_name: customerName || 'Customer',
        });
      }
      toast.success('Photos uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['portal-customer-photos'] });
    } catch {
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const allPhotos = [
    ...(jobPhotos || []).map(p => ({ ...p, source: 'contractor' as const })),
    ...(customerPhotos || []).map(p => ({ ...p, source: 'customer' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{allPhotos.length} Photos</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            Upload Photos
          </Button>
        </div>
      </div>

      {allPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {allPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setViewingPhoto(photo.photo_url)}
            >
              <img src={photo.photo_url} alt={photo.caption || ''} className="w-full h-full object-cover" loading="lazy" />
              {photo.source === 'customer' && (
                <Badge className="absolute top-1 right-1 text-[10px]">Customer</Badge>
              )}
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-background/80 p-1.5">
                  <p className="text-[10px] truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No photos yet. Upload photos to share with your contractor.
          </CardContent>
        </Card>
      )}

      {viewingPhoto && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4" onClick={() => setViewingPhoto(null)}>
          <img src={viewingPhoto} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}

// ==================== MESSAGES TAB ====================

// Consistent color palette for participant bubbles (light, pastel HSL)
const PARTICIPANT_COLORS = [
  { bg: 'hsl(220 80% 92%)', text: 'hsl(220 50% 25%)', name: 'hsl(220 50% 40%)', time: 'hsl(220 30% 55%)' },  // blue
  { bg: 'hsl(264 60% 92%)', text: 'hsl(264 40% 25%)', name: 'hsl(264 40% 40%)', time: 'hsl(264 30% 55%)' },  // purple
  { bg: 'hsl(150 50% 90%)', text: 'hsl(150 40% 20%)', name: 'hsl(150 40% 35%)', time: 'hsl(150 30% 50%)' },  // green
  { bg: 'hsl(30 70% 90%)',  text: 'hsl(30 50% 22%)',  name: 'hsl(30 50% 38%)',  time: 'hsl(30 30% 50%)' },   // orange
  { bg: 'hsl(340 60% 92%)', text: 'hsl(340 40% 25%)', name: 'hsl(340 40% 40%)', time: 'hsl(340 30% 55%)' },  // pink
  { bg: 'hsl(190 60% 90%)', text: 'hsl(190 40% 20%)', name: 'hsl(190 40% 35%)', time: 'hsl(190 30% 50%)' },  // teal
];

function getParticipantColor(senderName: string, senderType: string, participantMap: Map<string, number>) {
  const key = `${senderType}:${senderName}`;
  if (!participantMap.has(key)) {
    // Contractor always gets index 0 (blue), others get sequential
    if (senderType === 'contractor') {
      participantMap.set(key, 0);
    } else {
      const usedIndices = new Set(participantMap.values());
      let idx = 1; // start customers at 1
      while (usedIndices.has(idx) && idx < PARTICIPANT_COLORS.length) idx++;
      participantMap.set(key, idx % PARTICIPANT_COLORS.length);
    }
  }
  return PARTICIPANT_COLORS[participantMap.get(key)! % PARTICIPANT_COLORS.length];
}

function MessagesTab({ portalTokenId, jobId, customerName, contractorName, isContractor }: {
  portalTokenId: string;
  jobId: string;
  customerName: string;
  contractorName: string;
  isContractor: boolean;
}) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For non-contractors, allow setting display name
  const storageKey = `portal-display-name-${portalTokenId}`;
  const [displayName, setDisplayName] = useState(() => {
    if (isContractor) return contractorName;
    return localStorage.getItem(storageKey) || customerName;
  });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);

  // Stable map for color assignment
  const participantMapRef = useRef(new Map<string, number>());

  const { data: messages } = useQuery({
    queryKey: ['portal-messages', portalTokenId],
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('portal_token_id', portalTokenId)
        .order('created_at', { ascending: true });
      return data || [];
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`portal-messages-${portalTokenId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'portal_messages',
        filter: `portal_token_id=eq.${portalTokenId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['portal-messages', portalTokenId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [portalTokenId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const senderType = isContractor ? 'contractor' : 'customer';
      const senderName = isContractor ? contractorName : displayName;

      const { error } = await supabase.from('portal_messages').insert({
        portal_token_id: portalTokenId,
        job_id: jobId,
        sender_type: senderType,
        sender_name: senderName,
        message: newMessage.trim(),
      });
      if (error) throw error;
      const sentMessage = newMessage.trim();
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['portal-messages', portalTokenId] });

      // Notify contractor via SMS (fire-and-forget, don't block UI)
      if (!isContractor) {
        supabase.functions.invoke('notify-portal-message', {
          body: {
            portal_token_id: portalTokenId,
            message: sentMessage,
            sender_name: senderName,
          },
        }).catch((err) => console.error('Failed to notify contractor:', err));
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setDisplayName(trimmed);
      localStorage.setItem(storageKey, trimmed);
    }
    setEditingName(false);
  };

  // Determine if this message is "mine"
  const isMyMessage = (msg: { sender_type: string; sender_name: string | null }) => {
    if (isContractor) return msg.sender_type === 'contractor';
    return msg.sender_type === 'customer' && msg.sender_name === displayName;
  };

  // Fetch participants
  const { data: participants } = useQuery({
    queryKey: ['portal-participants', portalTokenId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('portal_participants')
        .select('*')
        .eq('portal_token_id', portalTokenId)
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      {/* Participants bar */}
      {participants && participants.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2 px-1 overflow-x-auto pb-1">
          <span className="text-[10px] text-muted-foreground shrink-0">In chat:</span>
          {participants.map((p: any) => (
            <Badge key={p.id} variant="secondary" className="text-[10px] shrink-0 gap-1">
              <div className={`h-2 w-2 rounded-full ${p.role === 'contractor' ? 'bg-primary' : 'bg-emerald-500'}`} />
              {p.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Display name bar for non-contractors */}
      {!isContractor && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-xs text-muted-foreground">Sending as:</span>
          {editingName ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-7 text-xs w-40"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
              />
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleSaveName}>Save</Button>
            </div>
          ) : (
            <button
              onClick={() => { setNameInput(displayName); setEditingName(true); }}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              {displayName} <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1 mb-4 px-1">
        {messages && messages.length > 0 ? (
          messages.map((msg, idx) => {
            const mine = isMyMessage(msg);
            const colors = getParticipantColor(msg.sender_name || 'Unknown', msg.sender_type, participantMapRef.current);
            const senderLabel = msg.sender_name || (msg.sender_type === 'contractor' ? contractorName : 'Customer');
            const initials = senderLabel.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

            // Show sender name if different from previous message's sender
            const prevMsg = messages[idx - 1];
            const showName = !prevMsg || prevMsg.sender_name !== msg.sender_name || prevMsg.sender_type !== msg.sender_type;

            return (
              <div key={msg.id}>
                {/* Sender name label for group chat clarity */}
                {showName && !mine && (
                  <p className="text-[10px] font-semibold ml-10 mt-2 mb-0.5" style={{ color: colors.name }}>
                    {senderLabel}
                  </p>
                )}
                <div className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                  {/* Avatar for others (left side) */}
                  {!mine && showName && (
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: colors.bg, color: colors.name, border: `1.5px solid ${colors.name}` }}
                    >
                      {initials}
                    </div>
                  )}
                  {!mine && !showName && <div className="w-7 shrink-0" />}

                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                      mine ? 'rounded-br-sm' : 'rounded-bl-sm'
                    )}
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-[10px] mt-0.5 text-right" style={{ color: colors.time }}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t pt-3">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="min-h-[44px] max-h-[120px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="icon" className="shrink-0 h-11 w-11">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ==================== PAYMENTS TAB ====================
function PaymentsTab({ jobId, job }: { jobId: string; job: any }) {
  const [paymentMode, setPaymentMode] = useState<'menu' | 'deposit' | 'custom' | 'remaining' | null>('menu');
  const [customAmount, setCustomAmount] = useState('');
  const [showFinixForm, setShowFinixForm] = useState(false);
  const [paymentNote, setPaymentNote] = useState('');
  const queryClient = useQueryClient();

  const totalValue = job.total_contract_value || job.contract_value || 0;
  const paid = job.payments_collected || 0;
  const remaining = Math.max(0, totalValue - paid);

  // Fetch the linked estimate for deposit info
  const { data: estimate } = useQuery({
    queryKey: ['portal-job-estimate', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('estimates')
        .select('id, public_token, required_deposit, required_deposit_percent, payment_amount, payment_status, estimate_number, total_amount, client_email')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch contractor profile with Finix info
  const { data: contractor } = useQuery({
    queryKey: ['portal-contractor-payment', job.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('finix_merchant_id, company_name, zelle_email, zelle_phone, ach_instructions, accepted_payment_methods, brand_primary_color')
        .eq('id', job.user_id)
        .single();
      return data;
    },
    enabled: !!job.user_id,
  });

  const { data: invoices } = useQuery({
    queryKey: ['portal-payment-invoices', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount_due, amount_paid, balance_due, status, public_token, due_date')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['portal-payments', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('id, amount, fee_amount, status, payment_method, created_at, notes')
        .eq('job_id', jobId)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const unpaidInvoices = invoices?.filter(i => (i.balance_due || (i.amount_due || 0) - (i.amount_paid || 0)) > 0) || [];

  // Calculate deposit info
  const depositAmount = estimate?.required_deposit || 
    (estimate?.required_deposit_percent && estimate?.total_amount 
      ? (estimate.required_deposit_percent / 100) * estimate.total_amount 
      : 0);
  const depositPaid = estimate?.payment_amount || 0;
  const depositRemaining = Math.max(0, depositAmount - depositPaid);
  const depositFullyPaid = depositAmount > 0 && depositRemaining <= 0;

  const hasFinix = !!contractor?.finix_merchant_id;
  const customerEmail = estimate?.client_email || '';

  const getPaymentAmount = (): number => {
    if (paymentMode === 'deposit') return depositRemaining;
    if (paymentMode === 'remaining') return remaining;
    if (paymentMode === 'custom') return parseFloat(customAmount) || 0;
    return 0;
  };

  const getPaymentIntent = (): 'deposit' | 'full' | 'remaining' => {
    if (paymentMode === 'deposit') return 'deposit';
    if (paymentMode === 'remaining') return 'remaining';
    return 'full';
  };

  const handlePaymentSuccess = () => {
    setShowFinixForm(false);
    setPaymentMode('menu');
    setCustomAmount('');
    queryClient.invalidateQueries({ queryKey: ['portal-payments', jobId] });
    queryClient.invalidateQueries({ queryKey: ['portal-job-estimate', jobId] });
    queryClient.invalidateQueries({ queryKey: ['portal', undefined] });
  };

  return (
    <div className="space-y-5">
      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card shadow-sm p-4 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Contract</p>
          <p className="text-lg sm:text-xl font-bold mt-1">${totalValue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card shadow-sm p-4 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Paid</p>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1">${paid.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card shadow-sm p-4 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
          <p className="text-lg sm:text-xl font-bold text-destructive mt-1">${remaining.toLocaleString()}</p>
        </div>
      </div>

      {/* Make a Payment Section */}
      {remaining > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Make a Payment</span>
          </div>

          {paymentMode === 'menu' && !showFinixForm && (
            <div className="p-4 space-y-2">
              {/* Deposit option */}
              {depositAmount > 0 && !depositFullyPaid && (
                <button
                  onClick={() => setPaymentMode('deposit')}
                  className="w-full flex items-center justify-between p-3.5 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pay Deposit</p>
                      <p className="text-xs text-muted-foreground">
                        ${depositRemaining.toLocaleString()} required deposit
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              )}

              {depositFullyPaid && depositAmount > 0 && (
                <div className="flex items-center gap-3 p-3.5 rounded-lg border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Deposit Paid</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">${depositAmount.toLocaleString()} received</p>
                  </div>
                </div>
              )}

              {/* Custom Amount */}
              <button
                onClick={() => setPaymentMode('custom')}
                className="w-full flex items-center justify-between p-3.5 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Custom Payment</p>
                    <p className="text-xs text-muted-foreground">Enter a specific amount</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              {/* Pay Remainder */}
              <button
                onClick={() => setPaymentMode('remaining')}
                className="w-full flex items-center justify-between p-3.5 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pay Remaining Balance</p>
                    <p className="text-xs text-muted-foreground">${remaining.toLocaleString()} outstanding</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>
          )}

          {/* Payment confirmation before card form */}
          {paymentMode && paymentMode !== 'menu' && !showFinixForm && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setPaymentMode('menu'); setCustomAmount(''); }} className="gap-1 h-8">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
              </div>

              <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
                <h3 className="font-semibold text-sm">
                  {paymentMode === 'deposit' && 'Pay Deposit'}
                  {paymentMode === 'custom' && 'Custom Payment'}
                  {paymentMode === 'remaining' && 'Pay Remaining Balance'}
                </h3>

                {paymentMode === 'custom' ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        max={remaining}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-7 h-10 text-lg font-semibold"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Max: ${remaining.toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">${getPaymentAmount().toLocaleString()}</span>
                  </div>
                )}

                {/* Note field */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Note (optional)</Label>
                  <Input
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g., Final payment for phase 1"
                    className="h-9"
                  />
                </div>
              </div>

              {hasFinix && estimate?.public_token ? (
                <Button
                  className="w-full gap-2"
                  size="lg"
                  disabled={paymentMode === 'custom' && (!customAmount || parseFloat(customAmount) <= 0 || parseFloat(customAmount) > remaining)}
                  onClick={() => setShowFinixForm(true)}
                >
                  <CreditCard className="h-4 w-4" />
                  Continue to Payment — ${getPaymentAmount().toLocaleString()}
                </Button>
              ) : (
                <div className="text-center p-4 rounded-lg bg-muted/30 border">
                  <p className="text-sm text-muted-foreground">
                    Online payments are not enabled for this job. Please contact your contractor to arrange payment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Finix Card Form */}
          {showFinixForm && estimate?.public_token && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setShowFinixForm(false)} className="gap-1 h-8">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <span className="text-sm font-medium">
                  Paying ${getPaymentAmount().toLocaleString()}
                </span>
              </div>
              <FinixPaymentForm
                entityType="estimate"
                entityId={estimate.id}
                publicToken={estimate.public_token}
                paymentIntent={getPaymentIntent()}
                customerEmail={customerEmail}
                amount={getPaymentAmount()}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowFinixForm(false)}
                primaryColor={contractor?.brand_primary_color || undefined}
              />
            </div>
          )}
        </div>
      )}

      {/* Remaining is 0 - fully paid */}
      {remaining <= 0 && totalValue > 0 && (
        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 p-5 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">Fully Paid</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">All payments have been received. Thank you!</p>
          </div>
        </div>
      )}

      {/* Outstanding Invoices */}
      {unpaidInvoices.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b">
            <p className="text-sm font-semibold">Outstanding Invoices</p>
          </div>
          <div className="divide-y">
            {unpaidInvoices.map((inv) => {
              const balance = inv.balance_due || (inv.amount_due || 0) - (inv.amount_paid || 0);
              return (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    {inv.due_date && (
                      <p className="text-xs text-muted-foreground">Due: {format(new Date(inv.due_date), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">${balance.toLocaleString()}</span>
                    {inv.public_token && (
                      <Button size="sm" asChild>
                        <a href={`/invoice/${inv.public_token}`} target="_blank" rel="noopener noreferrer">Pay</a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-muted/40 border-b">
          <p className="text-sm font-semibold">Payment History</p>
        </div>
        {payments && payments.length > 0 ? (
          <div className="divide-y">
            {payments.map((pmt) => (
              <div key={pmt.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{pmt.notes || 'Payment'}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(pmt.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-emerald-600">${(pmt.amount || 0).toLocaleString()}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-muted-foreground text-center">No payments recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
