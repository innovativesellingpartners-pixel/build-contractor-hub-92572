import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { InvoiceDetailView } from './InvoiceDetailView';
import { PredictiveSearch } from '../PredictiveSearch';
import { CrmNavHeader } from '../CrmNavHeader';
import { HorizontalRowCard, RowAvatar, RowContent, RowTitleLine, RowMetaLine } from './HorizontalRowCard';

interface InvoicesSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function InvoicesSection({ onSectionChange }: InvoicesSectionProps) {
  const { invoices, isLoading } = useInvoices();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filter invoices based on search and status
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    return invoices.filter(invoice => {
      // Status filter
      if (statusFilter !== 'all' && invoice.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const invoiceNumber = invoice.invoice_number?.toLowerCase() || '';
        const notes = invoice.notes?.toLowerCase() || '';
        
        return invoiceNumber.includes(query) || notes.includes(query);
      }
      
      return true;
    });
  }, [invoices, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-secondary text-secondary-foreground';
      case 'sent': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'viewed': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'partial': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'paid': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'overdue': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'void': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number | null) => {
    return `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Show invoice detail view if selected
  if (selectedInvoice) {
    return (
      <InvoiceDetailView
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onSectionChange={onSectionChange}
      />
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        {/* Navigation Header */}
        <CrmNavHeader
          back
          dashboard
          onBack={() => onSectionChange?.('dashboard')}
          onDashboard={() => onSectionChange?.('dashboard')}
          sectionLabel="Invoices"
        />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Invoices
            </h1>
            <p className="text-muted-foreground text-sm">Manage and track your invoices</p>
          </div>
        </div>

        {/* Predictive Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
          <PredictiveSearch
            items={invoices || []}
            placeholder="Search invoices by number or notes..."
            getLabel={(invoice: Invoice) => invoice.invoice_number || `Invoice ${invoice.id?.slice(0, 8)}`}
            getSublabel={(invoice: Invoice) => [
              invoice.status.toUpperCase(),
              `$${(invoice.amount_due || 0).toLocaleString()}`,
              format(new Date(invoice.issue_date), 'MMM d, yyyy')
            ].join(' • ')}
            filterFn={(invoice: Invoice, query: string) => {
              const q = query.toLowerCase();
              return (
                invoice.invoice_number?.toLowerCase().includes(q) ||
                invoice.notes?.toLowerCase().includes(q) ||
                invoice.status?.toLowerCase().includes(q)
              ) || false;
            }}
            onSelect={(invoice: Invoice) => setSelectedInvoice(invoice)}
          />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold mb-1">No Invoices Found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'No invoices match your search criteria'
                : 'Invoices will appear here when created from estimates'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <HorizontalRowCard
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice)}
              >
                <RowAvatar initials="" icon={<FileText className="h-5 w-5 text-primary" />} />
                <RowContent>
                  <RowTitleLine>
                    <span className="font-semibold text-sm">
                      {invoice.invoice_number || 'No Number'}
                    </span>
                     <Badge className={`${getStatusColor(invoice.status)} text-xs`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </RowTitleLine>
                  <RowMetaLine>
                    <span className="truncate">{invoice.notes || 'No description'}</span>
                  </RowMetaLine>
                  <RowMetaLine>
                    <span>Issued: {format(new Date(invoice.issue_date), 'MMM d, yyyy')}</span>
                    {invoice.due_date && <span>Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</span>}
                  </RowMetaLine>
                </RowContent>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm text-primary tabular-nums tracking-tight">
                    {formatCurrency(invoice.amount_due)}
                  </p>
                  {invoice.amount_paid > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 tabular-nums">
                      Paid: {formatCurrency(invoice.amount_paid)}
                    </p>
                  )}
                </div>
              </HorizontalRowCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
