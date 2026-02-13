import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, Mic, MicOff, X, Loader2, Sparkles, FileText, Briefcase, Receipt, Users, ClipboardList, DollarSign, ChevronDown, ChevronUp, Info, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchResult {
  reportType: string;
  summary: string;
  filters: any;
  results: any[];
  totalCount: number;
  limit: number;
  aiInsight?: string | null;
  openAsReport?: boolean;
}

interface CRMSearchBarProps {
  onNavigate?: (section: string, id?: string) => void;
}

const REPORT_TYPE_ICONS: Record<string, typeof Briefcase> = {
  jobs: Briefcase,
  estimates: FileText,
  invoices: Receipt,
  customers: Users,
  leads: ClipboardList,
  payments: DollarSign,
  expenses: DollarSign,
  materials: ClipboardList,
  change_orders: FileText,
  job_costs: DollarSign,
  plaid_transactions: DollarSign,
  budget_items: DollarSign,
  daily_logs: ClipboardList,
  crew: Users,
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  jobs: 'Jobs',
  estimates: 'Estimates',
  invoices: 'Invoices',
  customers: 'Customers',
  leads: 'Leads',
  payments: 'Payments',
  expenses: 'Expenses',
  materials: 'Materials',
  change_orders: 'Change Orders',
  job_costs: 'Job Costs',
  plaid_transactions: 'Bank Transactions',
  budget_items: 'Budget Items',
  daily_logs: 'Daily Logs',
  crew: 'Crew Members',
};

export default function CRMSearchBar({ onNavigate }: CRMSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isMobile = useIsMobile();

  // Close results on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
        if (isMobile) setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setShowResults(true);

    try {
      const { data, error } = await supabase.functions.invoke('crm-ai-search', {
        body: { query: q.trim() },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      // If the AI flagged this as a full report, store data and navigate
      if (data.openAsReport && onNavigate) {
        sessionStorage.setItem('ai-report-data', JSON.stringify(data));
        onNavigate('ai-report');
        setShowResults(false);
        setQuery('');
        return;
      }

      setSearchResult(data);
    } catch (err: any) {
      console.error('Search error:', err);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') {
      setShowResults(false);
      if (isMobile) setIsExpanded(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setQuery(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-search after voice input ends if there's content
      if (query.trim()) {
        setTimeout(() => handleSearch(), 300);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable it in your browser settings.');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResult(null);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (item: any, type: string) => {
    if (!onNavigate) return;
    switch (type) {
      case 'jobs':
        onNavigate(`job:${item.id}`);
        break;
      case 'estimates':
        onNavigate(`estimate:${item.id}`);
        break;
      case 'invoices':
        onNavigate('invoices');
        break;
      case 'customers':
        onNavigate('customers');
        break;
      case 'leads':
        onNavigate('leads');
        break;
      default:
        onNavigate(type);
    }
    setShowResults(false);
    if (isMobile) setIsExpanded(false);
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val == null) return '—';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderResultRow = (item: any, type: string, index: number) => {
    switch (type) {
      case 'jobs':
        return (
          <button
            key={item.id || index}
            onClick={() => handleResultClick(item, type)}
            className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-center gap-3 border-b last:border-b-0"
          >
            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.job_number} · {item.job_status} · {formatCurrency(item.contract_value)}
              </p>
            </div>
            {item.customers?.name && (
              <Badge variant="outline" className="text-xs shrink-0">{item.customers.name}</Badge>
            )}
          </button>
        );
      case 'estimates':
        return (
          <button
            key={item.id || index}
            onClick={() => handleResultClick(item, type)}
            className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-center gap-3 border-b last:border-b-0"
          >
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.estimate_number} · {item.status} · {formatCurrency(item.total_amount)}
              </p>
            </div>
            {item.client_name && (
              <Badge variant="outline" className="text-xs shrink-0">{item.client_name}</Badge>
            )}
          </button>
        );
      case 'invoices':
        return (
          <button
            key={item.id || index}
            onClick={() => handleResultClick(item, type)}
            className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-center gap-3 border-b last:border-b-0"
          >
            <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.invoice_number}</p>
              <p className="text-xs text-muted-foreground">
                {item.status} · Due: {formatCurrency(item.amount_due)} · Paid: {formatCurrency(item.amount_paid)}
              </p>
            </div>
            {item.customers?.name && (
              <Badge variant="outline" className="text-xs shrink-0">{item.customers.name}</Badge>
            )}
          </button>
        );
      case 'customers':
        return (
          <button
            key={item.id || index}
            onClick={() => handleResultClick(item, type)}
            className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-center gap-3 border-b last:border-b-0"
          >
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.customer_number} · {item.email || item.phone || '—'} · LTV: {formatCurrency(item.lifetime_value)}
              </p>
            </div>
          </button>
        );
      case 'leads':
        return (
          <button
            key={item.id || index}
            onClick={() => handleResultClick(item, type)}
            className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-center gap-3 border-b last:border-b-0"
          >
            <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.lead_number} · {item.status} · {formatCurrency(item.estimated_value)}
              </p>
            </div>
          </button>
        );
      case 'payments':
        return (
          <div
            key={item.id || index}
            className="px-4 py-3 flex items-center gap-3 border-b last:border-b-0"
          >
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{formatCurrency(item.amount)} — {item.status}</p>
              <p className="text-xs text-muted-foreground">
                {item.payment_method} · {formatDate(item.created_at)}
                {item.jobs?.name ? ` · ${item.jobs.name}` : ''}
              </p>
            </div>
          </div>
        );
      case 'expenses':
        return (
          <div
            key={item.id || index}
            className="px-4 py-3 flex items-center gap-3 border-b last:border-b-0"
          >
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{formatCurrency(item.amount)} — {item.category}</p>
              <p className="text-xs text-muted-foreground">
                {item.description || '—'} · {formatDate(item.date)}
                {item.jobs?.name ? ` · ${item.jobs.name}` : ''}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Mobile collapsed state: just a search icon
  if (isMobile && !isExpanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => {
          setIsExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        <Sparkles className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", isMobile ? "fixed inset-x-0 top-0 z-50 bg-background p-3 border-b shadow-lg" : "w-full max-w-xl")}>
      {/* Search Input */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (searchResult) setShowResults(true); }}
            placeholder="Ask about jobs, estimates, invoices…"
            className="pl-9 pr-20 h-10 bg-muted/50 border-border/50 focus:border-primary/50 text-sm"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {query && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSearch}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", isListening && "text-destructive animate-pulse")}
                    onClick={isListening ? stopVoiceInput : startVoiceInput}
                  >
                    {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isListening ? 'Stop listening' : 'Voice search'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleSearch()}
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Mobile close */}
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => { setIsExpanded(false); setShowResults(false); }}>
            <X className="h-5 w-5" />
          </Button>
        )}

        {/* Info tooltip */}
        {!isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium mb-1">AI Search Examples:</p>
                <ul className="text-xs space-y-0.5 text-muted-foreground">
                  <li>• "What estimate needs the most attention?"</li>
                  <li>• "Which jobs are at risk of going over budget?"</li>
                  <li>• "Unpaid invoices for Acme"</li>
                  <li>• "Show all estimates under $10,000"</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute left-0 right-0 top-full mt-1 px-4">
          <div className="flex items-center gap-2 py-2 px-3 bg-destructive/10 rounded-lg text-sm text-destructive font-medium">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-4 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-4 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-4 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            Listening… speak your query
          </div>
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && (searchResult || isLoading) && (
        <Card className={cn(
          "absolute left-0 right-0 top-full mt-2 shadow-2xl border-2 z-50 overflow-hidden",
          isMobile ? "max-h-[70vh]" : "max-h-[60vh]"
        )}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Searching your CRM…</span>
            </div>
          ) : searchResult ? (
            <>
              {/* Summary Header */}
              <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = REPORT_TYPE_ICONS[searchResult.reportType] || Search;
                    return <Icon className="h-4 w-4 text-primary" />;
                  })()}
                  <div>
                    <p className="text-sm font-medium">{searchResult.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {searchResult.totalCount} {REPORT_TYPE_LABELS[searchResult.reportType] || searchResult.reportType} found
                      {searchResult.totalCount > searchResult.limit && ` (showing ${searchResult.limit})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {REPORT_TYPE_LABELS[searchResult.reportType] || searchResult.reportType}
                  </Badge>
                  {searchResult.results.length > 0 && onNavigate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 px-2"
                      onClick={() => {
                        sessionStorage.setItem('ai-report-data', JSON.stringify(searchResult));
                        onNavigate('ai-report');
                        setShowResults(false);
                      }}
                    >
                      <Maximize2 className="h-3 w-3" />
                      Full Report
                    </Button>
                  )}
                </div>
              </div>

              {/* AI Insight */}
              {searchResult.aiInsight && (
                <div className="px-4 py-3 bg-primary/5 border-b">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm text-foreground space-y-1.5 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:text-sm [&_p]:text-sm [&_strong]:font-semibold">
                      {searchResult.aiInsight.split('\n').map((line, i) => {
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
                </div>
              )}

              {/* Results List */}
              <ScrollArea className={cn(isMobile ? "max-h-[55vh]" : searchResult.aiInsight ? "max-h-[30vh]" : "max-h-[45vh]")}>
                {searchResult.results.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No results found. Try a different query.
                  </div>
                ) : (
                  searchResult.results.map((item, i) =>
                    renderResultRow(item, searchResult.reportType, i)
                  )
                )}
              </ScrollArea>
            </>
          ) : null}
        </Card>
      )}
    </div>
  );
}
