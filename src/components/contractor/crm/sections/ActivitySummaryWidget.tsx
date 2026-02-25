import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useEstimates } from '@/hooks/useEstimates';
import { useJobs } from '@/hooks/useJobs';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { subDays, subMonths, isAfter, isBefore } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  FileText, 
  Briefcase, 
  Receipt, 
  DollarSign, 
  Users,
  BarChart3,
  CheckCircle
} from 'lucide-react';

// Exclusive access - only this user can see the widget
const SITE_OWNER_ID = '7ffdd1df-2232-4454-9335-ba6c20dc22b1';

type Section = 'dashboard' | 'leads' | 'jobs' | 'customers' | 'calls' | 'emails' | 'estimates' | 'reporting' | 'accounting' | 'more' | 'calendar' | 'invoices';

type TimeRange = '7d' | '30d' | '90d';

interface ActivitySummaryWidgetProps {
  onSectionChange?: (section: Section) => void;
}

interface MetricCardProps {
  label: string;
  currentValue: number;
  previousValue: number;
  icon: React.ReactNode;
  isCurrency?: boolean;
  onClick?: () => void;
}

const ChangeIndicator = ({ current, previous }: { current: number; previous: number }) => {
  if (previous === 0 && current === 0) {
    return <span className="text-muted-foreground text-xs flex items-center gap-1"><Minus className="h-3 w-3" /> --</span>;
  }
  if (previous === 0) {
    return (
      <span className="text-green-500 text-xs flex items-center gap-1">
        <TrendingUp className="h-3 w-3" /> New
      </span>
    );
  }
  
  const change = ((current - previous) / previous) * 100;
  
  if (change > 0) {
    return (
      <span className="text-green-500 text-xs flex items-center gap-1">
        <TrendingUp className="h-3 w-3" /> +{change.toFixed(0)}%
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="text-red-500 text-xs flex items-center gap-1">
        <TrendingDown className="h-3 w-3" /> {change.toFixed(0)}%
      </span>
    );
  }
  return <span className="text-muted-foreground text-xs flex items-center gap-1"><Minus className="h-3 w-3" /> 0%</span>;
};

const MetricCard = ({ label, currentValue, previousValue, icon, isCurrency = false, onClick }: MetricCardProps) => {
  const formatValue = (val: number) => {
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    return val.toString();
  };

  return (
    <div
      className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-700/50 transition-colors cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-amber-400">{icon}</div>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-white">{formatValue(currentValue)}</p>
          <p className="text-xs text-slate-500">vs {formatValue(previousValue)} prev</p>
        </div>
        <ChangeIndicator current={currentValue} previous={previousValue} />
      </div>
    </div>
  );
};

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export default function ActivitySummaryWidget({ onSectionChange }: ActivitySummaryWidgetProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<TimeRange>('7d');
  
  // Wait for auth to complete before checking visibility
  if (authLoading) return null;
  
  // Owner-only visibility check - return null for all other users
  if (!user || user.id !== SITE_OWNER_ID) return null;
  
  const { leads, loading: leadsLoading } = useLeads();
  const { estimates, isLoading: estimatesLoading } = useEstimates();
  const { jobs, loading: jobsLoading } = useJobs();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { payments, isLoading: paymentsLoading } = usePayments();
  
  const isLoading = leadsLoading || estimatesLoading || jobsLoading || invoicesLoading || paymentsLoading;
  
  // Date boundaries based on selected range
  const today = new Date();
  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const periodStart = rangeDays <= 90 ? subDays(today, rangeDays) : subMonths(today, 3);
  const previousPeriodStart = rangeDays <= 90 ? subDays(today, rangeDays * 2) : subMonths(today, 6);
  
  // Helper functions
  const inCurrentPeriod = (dateStr: string | null | undefined) => 
    dateStr && isAfter(new Date(dateStr), periodStart);
  
  const inPreviousPeriod = (dateStr: string | null | undefined) => 
    dateStr && 
    isAfter(new Date(dateStr), previousPeriodStart) && 
    isBefore(new Date(dateStr), periodStart);
  
  // Calculate metrics
  const currentLeads = leads?.filter(l => inCurrentPeriod(l.created_at)).length || 0;
  const previousLeads = leads?.filter(l => inPreviousPeriod(l.created_at)).length || 0;
  
  const currentEstimates = estimates?.filter(e => inCurrentPeriod(e.created_at)).length || 0;
  const previousEstimates = estimates?.filter(e => inPreviousPeriod(e.created_at)).length || 0;
  
  const currentWon = estimates?.filter(e => inCurrentPeriod(e.signed_at)).length || 0;
  const previousWon = estimates?.filter(e => inPreviousPeriod(e.signed_at)).length || 0;
  
  const currentJobs = jobs?.filter(j => inCurrentPeriod(j.created_at)).length || 0;
  const previousJobs = jobs?.filter(j => inPreviousPeriod(j.created_at)).length || 0;
  
  const currentInvoices = invoices?.filter(i => inCurrentPeriod(i.created_at)).length || 0;
  const previousInvoices = invoices?.filter(i => inPreviousPeriod(i.created_at)).length || 0;
  
  const currentRevenue = payments
    ?.filter(p => p.status === 'succeeded' && inCurrentPeriod(p.paid_at))
    .reduce((sum, p) => sum + ((p.amount || 0) - (p.fee_amount || 0)), 0) || 0;
  const previousRevenue = payments
    ?.filter(p => p.status === 'succeeded' && inPreviousPeriod(p.paid_at))
    .reduce((sum, p) => sum + ((p.amount || 0) - (p.fee_amount || 0)), 0) || 0;

  const rangeLabel = range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days';

  // Navigation handler — works in both admin and contractor contexts
  const handleNavigate = (path: string) => {
    // Check if we're in admin context
    const isAdmin = window.location.pathname.startsWith('/admin');
    if (isAdmin) {
      navigate(`/admin/${path}`);
    } else if (onSectionChange) {
      onSectionChange(path as Section);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-amber-500/30 border-2">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-64 bg-slate-700" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 bg-slate-700/50 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-amber-500/30 border-2">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            Last {rangeLabel} vs Previous {rangeLabel}
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-normal">
              Admin Only
            </span>
          </CardTitle>
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="ghost"
                size="sm"
                onClick={() => setRange(opt.value)}
                className={`text-xs h-7 px-3 ${
                  range === opt.value
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard 
            label="New Leads" 
            currentValue={currentLeads} 
            previousValue={previousLeads}
            icon={<Users className="h-4 w-4" />}
            onClick={() => handleNavigate('leads')}
          />
          <MetricCard 
            label="Estimates" 
            currentValue={currentEstimates} 
            previousValue={previousEstimates}
            icon={<FileText className="h-4 w-4" />}
            onClick={() => handleNavigate('estimates')}
          />
          <MetricCard 
            label="Won" 
            currentValue={currentWon} 
            previousValue={previousWon}
            icon={<CheckCircle className="h-4 w-4" />}
            onClick={() => handleNavigate('estimates')}
          />
          <MetricCard 
            label="Jobs Started" 
            currentValue={currentJobs} 
            previousValue={previousJobs}
            icon={<Briefcase className="h-4 w-4" />}
            onClick={() => handleNavigate('jobs')}
          />
          <MetricCard 
            label="Invoices" 
            currentValue={currentInvoices} 
            previousValue={previousInvoices}
            icon={<Receipt className="h-4 w-4" />}
            onClick={() => handleNavigate('invoices')}
          />
          <MetricCard 
            label="Revenue" 
            currentValue={currentRevenue} 
            previousValue={previousRevenue}
            icon={<DollarSign className="h-4 w-4" />}
            isCurrency
            onClick={() => handleNavigate('invoices')}
          />
        </div>
      </CardContent>
    </Card>
  );
}
