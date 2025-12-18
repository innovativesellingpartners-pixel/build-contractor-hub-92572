import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { FileText, Search, X, Filter, Download, Send, Eye, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { InvoiceDetailView } from './InvoiceDetailView';
import { PredictiveSearch } from '../PredictiveSearch';

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
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'viewed': return 'bg-purple-100 text-purple-700';
      case 'partial': return 'bg-amber-100 text-amber-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'void': return 'bg-gray-100 text-gray-500';
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
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Invoices Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No invoices match your search criteria'
                : 'Invoices will appear here when created from estimates'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Invoice info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {invoice.invoice_number || 'No Number'}
                        </span>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {invoice.notes || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                        {invoice.due_date && ` • Due: ${format(new Date(invoice.due_date), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-primary">
                      {formatCurrency(invoice.amount_due)}
                    </p>
                    {invoice.amount_paid > 0 && (
                      <p className="text-xs text-green-600">
                        Paid: {formatCurrency(invoice.amount_paid)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
