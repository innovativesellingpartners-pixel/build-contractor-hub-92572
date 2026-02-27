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
  ArrowLeft, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ct1Logo from '@/assets/ct1-powered-by-logo.png';

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

  const isContractor = !!(currentUser && portalData?.portalToken?.contractor_id === currentUser.id);

  // Fetch portalData before using it — define query below
  const portalData_query_defined_below = null; // placeholder for ordering

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
        .select('company_name, contact_name, phone, business_email, logo_url, brand_primary_color')
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {contractor.logo_url ? (
            <img src={contractor.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm sm:text-base truncate">
              {contractor.company_name || 'Your Contractor'}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {job.description || job.name || `Job ${job.job_number || ''}`}
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto pb-1 -mb-px scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2',
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'overview' && <OverviewTab job={job} contractor={contractor} />}
        {activeTab === 'schedule' && <ScheduleTab jobId={job.id} />}
        {activeTab === 'documents' && <DocumentsTab jobId={job.id} />}
        {activeTab === 'photos' && <PhotosTab jobId={job.id} portalTokenId={portalToken.id} customerName={customer?.name} />}
        {activeTab === 'messages' && (
          <MessagesTab
            portalTokenId={portalToken.id}
            jobId={job.id}
            customerName={customer?.name || 'Customer'}
            contractorName={contractor.company_name || 'Contractor'}
          />
        )}
        {activeTab === 'payments' && <PaymentsTab jobId={job.id} job={job} />}
      </main>

      <footer className="border-t bg-background mt-12">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
            <span>Customer Portal • {contractor.company_name}</span>
            <div className="flex gap-4">
              {contractor.phone && (
                <a href={`tel:${contractor.phone}`} className="flex items-center gap-1 hover:text-foreground">
                  <Phone className="h-3 w-3" /> {contractor.phone}
                </a>
              )}
              {contractor.business_email && (
                <a href={`mailto:${contractor.business_email}`} className="flex items-center gap-1 hover:text-foreground">
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
function ScheduleTab({ jobId }: { jobId: string }) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

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
          <Badge className={cn('text-[10px] shrink-0', statConf.color)}>{statConf.label}</Badge>
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
              <div key={`pad-${i}`} className="bg-background aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const dayEvents = eventsByDay[day] || [];
              return (
                <div
                  key={day}
                  className={cn(
                    'bg-background aspect-square flex flex-col items-center justify-center relative p-0.5',
                    isToday && 'ring-2 ring-primary ring-inset'
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium',
                    isToday ? 'text-primary font-bold' : 'text-foreground'
                  )}>{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((e, idx) => {
                        const conf = eventTypeConfig[e.event_type] || eventTypeConfig.other;
                        return (
                          <div
                            key={idx}
                            className={cn('h-1.5 w-1.5 rounded-full', 
                              e.event_type === 'milestone' ? 'bg-primary' :
                              e.event_type === 'inspection' ? 'bg-amber-500' :
                              e.event_type === 'delivery' ? 'bg-emerald-500' :
                              e.event_type === 'work' ? 'bg-blue-500' :
                              e.event_type === 'meeting' ? 'bg-violet-500' :
                              'bg-muted-foreground'
                            )}
                          />
                        );
                      })}
                    </div>
                  )}
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
    </div>
  );
}


function OverviewTab({ job, contractor }: { job: any; contractor: any }) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    not_started: { color: 'bg-muted text-muted-foreground', label: 'Not Started' },
    in_progress: { color: 'bg-primary/10 text-primary', label: 'In Progress' },
    on_hold: { color: 'bg-accent text-accent-foreground', label: 'On Hold' },
    completed: { color: 'bg-primary/20 text-primary', label: 'Completed' },
    cancelled: { color: 'bg-destructive/10 text-destructive', label: 'Cancelled' },
  };

  const status = statusConfig[job.job_status || 'not_started'] || statusConfig.not_started;
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
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{job.description || job.name || `Job ${job.job_number}`}</h2>
              {job.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.address}{job.city ? `, ${job.city}` : ''}{job.state ? `, ${job.state}` : ''}
                </p>
              )}
            </div>
            <Badge className={cn('text-xs', status.color)}>{status.label}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Job Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{completedTasks} of {totalTasks} tasks complete</span>
                <span className="font-medium">{Math.round(taskProgress)}%</span>
              </div>
              <Progress value={taskProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>${paid.toLocaleString()} paid</span>
                <span className="font-medium">${remaining.toLocaleString()} remaining</span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Key Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {job.start_date && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Start:</span>
              <span className="font-medium">{format(new Date(job.start_date), 'MMM d, yyyy')}</span>
            </div>
          )}
          {job.end_date && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Est. Completion:</span>
              <span className="font-medium">{format(new Date(job.end_date), 'MMM d, yyyy')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {tasks && tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.slice(0, 8).map((task) => (
              <div key={task.id} className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0">
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : task.status === 'in_progress' ? (
                  <Clock className="h-4 w-4 text-primary/70 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <span className={cn('flex-1 truncate', task.status === 'completed' && 'line-through text-muted-foreground')}>
                  {task.description}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
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
function MessagesTab({ portalTokenId, jobId, customerName, contractorName }: {
  portalTokenId: string;
  jobId: string;
  customerName: string;
  contractorName: string;
}) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const { error } = await supabase.from('portal_messages').insert({
        portal_token_id: portalTokenId,
        job_id: jobId,
        sender_type: 'customer',
        sender_name: customerName,
        message: newMessage.trim(),
      });
      if (error) throw error;
      const sentMessage = newMessage.trim();
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['portal-messages', portalTokenId] });

      // Notify contractor via SMS (fire-and-forget, don't block UI)
      supabase.functions.invoke('notify-portal-message', {
        body: {
          portal_token_id: portalTokenId,
          message: sentMessage,
          sender_name: customerName,
        },
      }).catch((err) => console.error('Failed to notify contractor:', err));
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className={cn('flex', msg.sender_type === 'customer' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                msg.sender_type === 'customer'
                  ? 'bg-[hsl(264,60%,50%)] text-white rounded-br-md'
                  : 'bg-[hsl(220,14%,92%)] text-[hsl(220,10%,20%)] rounded-bl-md'
              )}>
                <p className={cn(
                  'text-[10px] font-semibold mb-1',
                  msg.sender_type === 'customer' ? 'text-white/80' : 'text-[hsl(220,10%,40%)]'
                )}>
                  {msg.sender_type === 'customer' ? customerName : contractorName}
                </p>
                <p className="whitespace-pre-wrap">{msg.message}</p>
                <p className={cn(
                  'text-[10px] mt-1',
                  msg.sender_type === 'customer' ? 'text-white/50' : 'text-[hsl(220,10%,55%)]'
                )}>
                  {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          ))
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
  const totalValue = job.total_contract_value || job.contract_value || 0;
  const paid = job.payments_collected || 0;
  const remaining = Math.max(0, totalValue - paid);

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Contract Total</p>
            <p className="text-xl font-bold">${totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-xl font-bold text-primary">${paid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-xl font-bold text-destructive">${remaining.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {unpaidInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unpaidInvoices.map((inv) => {
              const balance = inv.balance_due || (inv.amount_due || 0) - (inv.amount_paid || 0);
              return (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border">
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
                        <a href={`/invoice/${inv.public_token}`} target="_blank" rel="noopener noreferrer">Pay Now</a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((pmt) => (
                <div key={pmt.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div>
                    <p className="font-medium">{pmt.notes || 'Payment'}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(pmt.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">${(pmt.amount || 0).toLocaleString()}</span>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
