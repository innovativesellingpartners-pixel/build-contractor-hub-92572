import { useState, useMemo } from 'react';
import { ArrowLeft, Download, ArrowUpDown, Sparkles, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AIReportData {
  reportType: string;
  summary: string;
  results: any[];
  totalCount: number;
  limit: number;
  aiInsight?: string | null;
  filters?: any;
}

interface AIReportViewProps {
  onBack: () => void;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  jobs: 'Jobs',
  estimates: 'Estimates',
  invoices: 'Invoices',
  customers: 'Customers',
  leads: 'Leads',
  payments: 'Payments',
  expenses: 'Expenses',
  all_expenses: 'All Expenses',
  materials: 'Materials',
  change_orders: 'Change Orders',
  job_costs: 'Job Costs',
  plaid_transactions: 'Bank Transactions',
  budget_items: 'Budget Items',
  daily_logs: 'Daily Logs',
  crew: 'Crew Members',
};

// Columns config per report type
const COLUMN_CONFIGS: Record<string, { key: string; label: string; type?: 'currency' | 'date' | 'nested' | 'badge'; nestedKey?: string }[]> = {
  expenses: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'category', label: 'Category', type: 'badge' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'jobs', label: 'Job', type: 'nested', nestedKey: 'name' },
    { key: 'notes', label: 'Notes' },
  ],
  all_expenses: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'source', label: 'Source', type: 'badge' },
    { key: 'category', label: 'Category', type: 'badge' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'jobs', label: 'Job', type: 'nested', nestedKey: 'name' },
    { key: 'notes', label: 'Notes' },
  ],
  jobs: [
    { key: 'job_number', label: 'Job #' },
    { key: 'name', label: 'Name' },
    { key: 'job_status', label: 'Status', type: 'badge' },
    { key: 'contract_value', label: 'Contract Value', type: 'currency' },
    { key: 'customers', label: 'Customer', type: 'nested', nestedKey: 'name' },
    { key: 'start_date', label: 'Start', type: 'date' },
  ],
  estimates: [
    { key: 'estimate_number', label: 'Est #' },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'total_amount', label: 'Amount', type: 'currency' },
    { key: 'client_name', label: 'Client' },
    { key: 'created_at', label: 'Created', type: 'date' },
  ],
  invoices: [
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'amount_due', label: 'Due', type: 'currency' },
    { key: 'amount_paid', label: 'Paid', type: 'currency' },
    { key: 'due_date', label: 'Due Date', type: 'date' },
    { key: 'customers', label: 'Customer', type: 'nested', nestedKey: 'name' },
  ],
  customers: [
    { key: 'customer_number', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' },
    { key: 'lifetime_value', label: 'LTV', type: 'currency' },
  ],
  leads: [
    { key: 'lead_number', label: 'Lead #' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'source', label: 'Source' },
    { key: 'estimated_value', label: 'Value', type: 'currency' },
    { key: 'created_at', label: 'Created', type: 'date' },
  ],
  payments: [
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'payment_method', label: 'Method' },
    { key: 'jobs', label: 'Job', type: 'nested', nestedKey: 'name' },
    { key: 'customers', label: 'Customer', type: 'nested', nestedKey: 'name' },
    { key: 'created_at', label: 'Date', type: 'date' },
  ],
  materials: [
    { key: 'description', label: 'Description' },
    { key: 'quantity_ordered', label: 'Qty Ordered' },
    { key: 'quantity_used', label: 'Qty Used' },
    { key: 'cost_per_unit', label: 'Unit Cost', type: 'currency' },
    { key: 'total_cost', label: 'Total', type: 'currency' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'jobs', label: 'Job', type: 'nested', nestedKey: 'name' },
  ],
  change_orders: [
    { key: 'change_order_number', label: 'CO #' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'additional_cost', label: 'Cost', type: 'currency' },
    { key: 'jobs', label: 'Job', type: 'nested', nestedKey: 'name' },
    { key: 'date_requested', label: 'Requested', type: 'date' },
  ],
  job_costs: [
    { key: 'category', label: 'Category', type: 'badge' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'cost_date', label: 'Date', type: 'date' },
    { key: 'jobs', label: 'Job', type: 'nested', nestedKey: 'name' },
  ],
  plaid_transactions: [
    { key: 'transaction_date', label: 'Date', type: 'date' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category', type: 'badge' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'jobs', label: 'Job', type: 'nested', nestedKey: 'name' },
  ],
  budget_items: [
    { key: 'item_code', label: 'Code' },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category', type: 'badge' },
    { key: 'budgeted_amount', label: 'Budgeted', type: 'currency' },
    { key: 'actual_amount', label: 'Actual', type: 'currency' },
    { key: 'variance_amount', label: 'Variance', type: 'currency' },
    { key: 'jobs', label: 'Job', type: 'nested', nestedKey: 'name' },
  ],
  daily_logs: [
    { key: 'log_date', label: 'Date', type: 'date' },
    { key: 'work_completed', label: 'Work Completed' },
    { key: 'weather', label: 'Weather' },
    { key: 'crew_count', label: 'Crew' },
    { key: 'hours_worked', label: 'Hours' },
    { key: 'jobs', label: 'Job', type: 'nested', nestedKey: 'name' },
  ],
  crew: [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role', type: 'badge' },
    { key: 'skills_trades', label: 'Skills' },
    { key: 'created_at', label: 'Added', type: 'date' },
  ],
};

type ColumnDef = { key: string; label: string; type?: 'currency' | 'date' | 'nested' | 'badge'; nestedKey?: string };

export default function AIReportView({ onBack }: AIReportViewProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Load report data from sessionStorage
  const reportData = useMemo<AIReportData | null>(() => {
    try {
      const raw = sessionStorage.getItem('ai-report-data');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const effectiveColumns = useMemo<ColumnDef[]>(() => {
    if (!reportData) return [];
    const columns = COLUMN_CONFIGS[reportData.reportType] || [];
    if (columns.length > 0) return columns;
    if (reportData.results.length === 0) return [];
    const keys = Object.keys(reportData.results[0]).filter(k => k !== 'id');
    return keys.slice(0, 8).map(k => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
  }, [reportData]);

  const sortedResults = useMemo(() => {
    if (!reportData) return [];
    if (!sortKey) return reportData.results;
    return [...reportData.results].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [reportData?.results, sortKey, sortDir]);

  // Compute totals for currency columns
  const totals = useMemo(() => {
    if (!reportData) return {};
    const t: Record<string, number> = {};
    effectiveColumns.forEach(col => {
      if (col.type === 'currency') {
        t[col.key] = reportData.results.reduce((sum, item) => sum + (Number(item[col.key]) || 0), 0);
      }
    });
    return t;
  }, [reportData?.results, effectiveColumns]);

  const hasTotals = Object.keys(totals).length > 0;

  if (!reportData) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">No report data available. Run a search first.</p>
      </div>
    );
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val == null) return '—';
    return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderCellValue = (item: any, col: ColumnDef) => {
    const val = item[col.key];
    if (col.type === 'currency') return formatCurrency(val);
    if (col.type === 'date') return formatDate(val);
    if (col.type === 'nested') {
      if (val && typeof val === 'object') return val[col.nestedKey || 'name'] || '—';
      return '—';
    }
    if (col.type === 'badge' && val) {
      return <Badge variant="outline" className="text-xs font-normal">{String(val)}</Badge>;
    }
    if (Array.isArray(val)) return val.join(', ') || '—';
    if (val == null) return '—';
    const str = String(val);
    return str.length > 60 ? str.slice(0, 57) + '…' : str;
  };

  const exportCSV = () => {
    if (!reportData.results.length) return;
    const headers = effectiveColumns.map(c => c.label);
    const rows = reportData.results.map(item =>
      effectiveColumns.map(col => {
        const val = item[col.key];
        if (col.type === 'nested' && val && typeof val === 'object') return val[col.nestedKey || 'name'] || '';
        if (Array.isArray(val)) return val.join('; ');
        return val ?? '';
      })
    );
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{reportData.summary}</h1>
            <p className="text-sm text-muted-foreground">
              {reportData.totalCount} {REPORT_TYPE_LABELS[reportData.reportType] || reportData.reportType}
              {reportData.totalCount > reportData.limit && ` (showing ${reportData.limit})`}
              {' · '}Generated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {REPORT_TYPE_LABELS[reportData.reportType] || reportData.reportType}
          </Badge>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* AI Insight */}
      {reportData.aiInsight && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm space-y-1.5 prose prose-sm max-w-none">
              {reportData.aiInsight.split('\n').map((line, i) => {
                if (!line.trim()) return null;
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                  return <p key={i} className="ml-3 text-xs text-muted-foreground">• {line.trim().replace(/^[-*]\s*/, '')}</p>;
                }
                if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                  return <p key={i} className="font-semibold text-sm">{line.trim().replace(/\*\*/g, '')}</p>;
                }
                return <p key={i}>{line}</p>;
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Totals Summary */}
      {hasTotals && (
        <div className="flex gap-4 flex-wrap">
          {effectiveColumns.filter(c => c.type === 'currency').map(col => (
            <Card key={col.key} className="px-4 py-2.5">
              <p className="text-xs text-muted-foreground">{col.label} Total</p>
              <p className="text-lg font-semibold">{formatCurrency(totals[col.key])}</p>
            </Card>
          ))}
          <Card className="px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Records</p>
            <p className="text-lg font-semibold">{reportData.results.length}</p>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card className="overflow-hidden">
        <ScrollArea className="max-h-[calc(100vh-320px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                {effectiveColumns.map(col => (
                  <TableHead key={col.key}>
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      <ArrowUpDown className={cn(
                        "h-3 w-3",
                        sortKey === col.key ? "text-primary" : "text-muted-foreground/50"
                      )} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={effectiveColumns.length + 1} className="text-center py-12 text-muted-foreground">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedResults.map((item, i) => (
                  <TableRow key={item.id || i}>
                    <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                    {effectiveColumns.map(col => (
                      <TableCell key={col.key} className="text-sm">
                        {renderCellValue(item, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}
