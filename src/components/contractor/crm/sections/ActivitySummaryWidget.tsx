import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useEstimates } from '@/hooks/useEstimates';
import { useJobs } from '@/hooks/useJobs';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { subDays, isAfter, isBefore } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

interface ActivitySummaryWidgetProps {
  onSectionChange?: (section: Section) => void;
}

interface MetricCardProps {
  label: string;
  currentValue: number;
  previousValue: number;
  icon: React.ReactNode;
  isCurrency?: boolean;
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

const MetricCard = ({ label, currentValue, previousValue, icon, isCurrency = false }: MetricCardProps) => {
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
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
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

export default function ActivitySummaryWidget({ onSectionChange }: ActivitySummaryWidgetProps) {
  const { user, loading: authLoading } = useAuth();
  
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
  
  // Date boundaries
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  const fourteenDaysAgo = subDays(today, 14);
  
  // Helper functions
  const inCurrentPeriod = (dateStr: string | null | undefined) => 
    dateStr && isAfter(new Date(dateStr), sevenDaysAgo);
  
  const inPreviousPeriod = (dateStr: string | null | undefined) => 
    dateStr && 
    isAfter(new Date(dateStr), fourteenDaysAgo) && 
    isBefore(new Date(dateStr), sevenDaysAgo);
  
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
  
  // Use amount - fee_amount for net revenue calculation
  const currentRevenue = payments
    ?.filter(p => p.status === 'succeeded' && inCurrentPeriod(p.paid_at))
    .reduce((sum, p) => sum + ((p.amount || 0) - (p.fee_amount || 0)), 0) || 0;
  const previousRevenue = payments
    ?.filter(p => p.status === 'succeeded' && inPreviousPeriod(p.paid_at))
    .reduce((sum, p) => sum + ((p.amount || 0) - (p.fee_amount || 0)), 0) || 0;

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            Last 7 Days vs Previous 7 Days
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-normal">
              Admin Only
            </span>
          </CardTitle>
          {onSectionChange && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSectionChange('reporting')}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            >
              View Reports
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard 
            label="New Leads" 
            currentValue={currentLeads} 
            previousValue={previousLeads}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard 
            label="Estimates" 
            currentValue={currentEstimates} 
            previousValue={previousEstimates}
            icon={<FileText className="h-4 w-4" />}
          />
          <MetricCard 
            label="Won" 
            currentValue={currentWon} 
            previousValue={previousWon}
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <MetricCard 
            label="Jobs Started" 
            currentValue={currentJobs} 
            previousValue={previousJobs}
            icon={<Briefcase className="h-4 w-4" />}
          />
          <MetricCard 
            label="Invoices" 
            currentValue={currentInvoices} 
            previousValue={previousInvoices}
            icon={<Receipt className="h-4 w-4" />}
          />
          <MetricCard 
            label="Revenue" 
            currentValue={currentRevenue} 
            previousValue={previousRevenue}
            icon={<DollarSign className="h-4 w-4" />}
            isCurrency
          />
        </div>
      </CardContent>
    </Card>
  );
}
