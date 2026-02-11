/**
 * QBSalesInvoices — Sales / Invoices report with interactive drill-down.
 */

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, FileText, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { useQuickBooksQuery } from "@/hooks/useQuickBooksQuery";
import { InteractiveMetricCard } from "@/components/reporting/drilldown/InteractiveMetricCard";
import { useDrillDown } from "@/components/reporting/drilldown/DrillDownProvider";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

function useQBInvoices(enabled = true) {
  const endpoint = `query?query=${encodeURIComponent("SELECT * FROM Invoice ORDERBY TxnDate DESC MAXRESULTS 200")}&minorversion=73`;
  return useQuickBooksQuery("invoices", endpoint, {
    enabled,
    transform: (data: any) => data?.QueryResponse?.Invoice || [],
  });
}

export function QBSalesInvoices() {
  const { data: invoices, isLoading, error } = useQBInvoices();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { openPanel } = useDrillDown();

  const filtered = useMemo(() => {
    if (!invoices) return [];
    let result = invoices as any[];

    if (statusFilter !== "all") {
      result = result.filter((inv: any) => {
        const balance = parseFloat(inv.Balance || "0");
        const dueDate = inv.DueDate ? new Date(inv.DueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && balance > 0;
        if (statusFilter === "paid") return balance === 0;
        if (statusFilter === "unpaid") return balance > 0 && !isOverdue;
        if (statusFilter === "overdue") return isOverdue;
        return true;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((inv: any) =>
        (inv.CustomerRef?.name || "").toLowerCase().includes(term) ||
        (inv.DocNumber || "").toLowerCase().includes(term)
      );
    }

    return result;
  }, [invoices, statusFilter, searchTerm]);

  const metrics = useMemo(() => {
    if (!invoices) return { totalInvoiced: 0, totalPaid: 0, outstanding: 0, overdue: 0 };
    const all = invoices as any[];
    const totalInvoiced = all.reduce((s: number, i: any) => s + parseFloat(i.TotalAmt || "0"), 0);
    const outstanding = all.reduce((s: number, i: any) => s + parseFloat(i.Balance || "0"), 0);
    const totalPaid = totalInvoiced - outstanding;
    const now = new Date();
    const overdue = all
      .filter((i: any) => parseFloat(i.Balance || "0") > 0 && i.DueDate && new Date(i.DueDate) < now)
      .reduce((s: number, i: any) => s + parseFloat(i.Balance || "0"), 0);
    return { totalInvoiced, totalPaid, outstanding, overdue };
  }, [invoices]);

  function getInvoiceStatus(inv: any): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
    const balance = parseFloat(inv.Balance || "0");
    if (balance === 0) return { label: "Paid", variant: "default" };
    const dueDate = inv.DueDate ? new Date(inv.DueDate) : null;
    if (dueDate && dueDate < new Date()) return { label: "Overdue", variant: "destructive" };
    return { label: "Open", variant: "secondary" };
  }

  const handleInvoiceClick = (inv: any) => {
    openPanel({
      type: "qb-record",
      title: `Invoice #${inv.DocNumber || "—"}`,
      data: { record: inv, recordType: "qb-invoice" },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Sales & Invoices</h3>
        <p className="text-sm text-muted-foreground">Revenue tracking and accounts receivable</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">We're having trouble syncing your invoice data. Please try reconnecting or click Sync to retry.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-3 md:gap-4 grid-cols-2 xl:grid-cols-4 min-w-0">
            <InteractiveMetricCard
              title="Total Invoiced"
              value={fmt(metrics.totalInvoiced)}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              onClick={() => setStatusFilter("all")}
            />
            <InteractiveMetricCard
              title="Total Paid"
              value={fmt(metrics.totalPaid)}
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
              variant="success"
              onClick={() => setStatusFilter("paid")}
            />
            <InteractiveMetricCard
              title="Outstanding"
              value={fmt(metrics.outstanding)}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              variant="warning"
              onClick={() => setStatusFilter("unpaid")}
            />
            <InteractiveMetricCard
              title="Overdue"
              value={fmt(metrics.overdue)}
              icon={<Clock className="h-4 w-4 text-destructive" />}
              variant="danger"
              onClick={() => setStatusFilter("overdue")}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Search customer or invoice #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:max-w-xs" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? filtered.map((inv: any) => {
                      const status = getInvoiceStatus(inv);
                      return (
                        <TableRow key={inv.Id} className="cursor-pointer hover:bg-muted/50 transition-colors group" onClick={() => handleInvoiceClick(inv)}>
                          <TableCell className="font-medium">{inv.DocNumber || "—"}</TableCell>
                          <TableCell className="truncate max-w-[180px]">{inv.CustomerRef?.name || "Unknown"}</TableCell>
                          <TableCell>{fmtDate(inv.TxnDate)}</TableCell>
                          <TableCell>{fmtDate(inv.DueDate)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(parseFloat(inv.TotalAmt || "0"))}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(parseFloat(inv.Balance || "0"))}</TableCell>
                          <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                          <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No invoices found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {filtered.length > 0 ? filtered.map((inv: any) => {
                  const status = getInvoiceStatus(inv);
                  return (
                    <button key={inv.Id} className="p-3 min-h-[56px] w-full text-left hover:bg-muted/50 transition-colors" onClick={() => handleInvoiceClick(inv)}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{inv.CustomerRef?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">#{inv.DocNumber} · {fmtDate(inv.TxnDate)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-sm tabular-nums">{fmt(parseFloat(inv.TotalAmt || "0"))}</p>
                          <Badge variant={status.variant} className="text-xs mt-1">{status.label}</Badge>
                        </div>
                      </div>
                    </button>
                  );
                }) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">No invoices found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
