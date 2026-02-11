/**
 * CustomReportBuilder — User-created reports with data source selection,
 * column/metric configuration, and save/load from localStorage.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportEmptyState } from "./ReportEmptyState";
import { ReportDateRangePicker, DateRange } from "./ReportDateRangePicker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Save, Trash2, Play, FileText } from "lucide-react";
import { toast } from "sonner";

interface SavedReport {
  id: string;
  name: string;
  dataSource: string;
  columns: string[];
  dateRange: DateRange;
}

const DATA_SOURCES: Record<string, { label: string; table: string; columns: { key: string; label: string }[] }> = {
  estimates: {
    label: "Estimates",
    table: "estimates",
    columns: [
      { key: "title", label: "Title" },
      { key: "client_name", label: "Client" },
      { key: "status", label: "Status" },
      { key: "total_amount", label: "Total Amount" },
      { key: "created_at", label: "Created" },
      { key: "trade_type", label: "Trade" },
    ],
  },
  jobs: {
    label: "Jobs",
    table: "jobs",
    columns: [
      { key: "name", label: "Name" },
      { key: "job_status", label: "Status" },
      { key: "budget_amount", label: "Budget" },
      { key: "actual_cost", label: "Actual Cost" },
      { key: "created_at", label: "Created" },
      { key: "trade_type", label: "Trade" },
    ],
  },
  invoices: {
    label: "Invoices",
    table: "invoices",
    columns: [
      { key: "invoice_number", label: "Invoice #" },
      { key: "amount_due", label: "Amount Due" },
      { key: "amount_paid", label: "Amount Paid" },
      { key: "status", label: "Status" },
      { key: "due_date", label: "Due Date" },
      { key: "created_at", label: "Created" },
    ],
  },
  customers: {
    label: "Customers",
    table: "customers",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "company", label: "Company" },
      { key: "lifetime_value", label: "Lifetime Value" },
      { key: "created_at", label: "Created" },
    ],
  },
  payments: {
    label: "Payments",
    table: "payments",
    columns: [
      { key: "amount", label: "Amount" },
      { key: "payment_date", label: "Date" },
      { key: "payment_method", label: "Method" },
      { key: "status", label: "Status" },
    ],
  },
  expenses: {
    label: "Expenses",
    table: "expenses",
    columns: [
      { key: "amount", label: "Amount" },
      { key: "category", label: "Category" },
      { key: "date", label: "Date" },
      { key: "description", label: "Description" },
    ],
  },
};

const STORAGE_KEY = "myct1-custom-reports";

function loadSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSavedReports(reports: SavedReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function CustomReportBuilder() {
  const { user } = useAuth();
  const [savedReports, setSavedReports] = useState<SavedReport[]>(loadSavedReports);
  const [reportName, setReportName] = useState("");
  const [dataSource, setDataSource] = useState("estimates");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["title", "status", "total_amount", "created_at"]);
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all_time" });
  const [runReport, setRunReport] = useState(false);
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);

  const source = DATA_SOURCES[dataSource];

  // Run the custom query
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["custom-report", user?.id, dataSource, selectedColumns, dateRange, runReport],
    queryFn: async () => {
      if (!user?.id) return [];
      const selectCols = selectedColumns.join(", ");
      let q = supabase.from(source.table as any).select(selectCols).eq(source.table === "payments" || source.table === "expenses" ? "contractor_id" : "user_id", user.id);
      const dateCol = source.table === "payments" ? "payment_date" : source.table === "expenses" ? "date" : "created_at";
      if (dateRange.start) q = q.gte(dateCol, dateRange.start);
      if (dateRange.end) q = q.lte(dateCol, dateRange.end);
      q = q.order(dateCol, { ascending: false }).limit(200);
      const { data, error } = await q;
      if (error) { console.error("Custom report error:", error); return []; }
      return data || [];
    },
    enabled: !!user?.id && runReport,
  });

  const handleToggleColumn = (col: string) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
    setRunReport(false);
  };

  const handleRun = () => setRunReport(true);

  const handleSave = () => {
    if (!reportName.trim()) { toast.error("Enter a report name"); return; }
    const report: SavedReport = {
      id: Date.now().toString(),
      name: reportName,
      dataSource,
      columns: selectedColumns,
      dateRange,
    };
    const updated = [...savedReports, report];
    setSavedReports(updated);
    saveSavedReports(updated);
    toast.success("Report saved");
    setReportName("");
  };

  const handleLoad = (report: SavedReport) => {
    setDataSource(report.dataSource);
    setSelectedColumns(report.columns);
    setDateRange(report.dateRange);
    setActiveReport(report);
    setRunReport(true);
  };

  const handleDelete = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    saveSavedReports(updated);
    toast.success("Report deleted");
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const headers = selectedColumns.map(c => source.columns.find(sc => sc.key === c)?.label || c);
    const rows = reportData.map((row: any) => selectedColumns.map(c => String(row[c] ?? "")));
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportName || "custom-report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return "—";
    if (key.includes("amount") || key.includes("cost") || key.includes("value") || key === "amount") {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(Number(value));
    }
    if (key.includes("date") || key === "created_at") {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Custom Reports</h2>
          <p className="text-sm text-muted-foreground">Build and save your own reports</p>
        </div>
        <ReportDateRangePicker value={dateRange} onChange={(dr) => { setDateRange(dr); setRunReport(false); }} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Builder panel */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Report Builder</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Data Source</Label>
              <Select value={dataSource} onValueChange={(v) => { setDataSource(v); setSelectedColumns(DATA_SOURCES[v].columns.slice(0, 4).map(c => c.key)); setRunReport(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {Object.entries(DATA_SOURCES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Columns</Label>
              <div className="space-y-2 mt-2">
                {source.columns.map((col) => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedColumns.includes(col.key)}
                      onCheckedChange={() => handleToggleColumn(col.key)}
                    />
                    <span className="text-sm">{col.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRun} size="sm" className="flex-1"><Play className="h-3.5 w-3.5 mr-1" /> Run</Button>
              <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={!reportData?.length}>CSV</Button>
            </div>

            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs">Save Report</Label>
              <Input placeholder="Report name..." value={reportName} onChange={(e) => setReportName(e.target.value)} className="text-sm" />
              <Button onClick={handleSave} variant="outline" size="sm" className="w-full"><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
            </div>
          </CardContent>
        </Card>

        {/* Results panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Saved reports */}
          {savedReports.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Saved Reports</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {savedReports.map((r) => (
                    <div key={r.id} className="flex items-center gap-1">
                      <Button variant={activeReport?.id === r.id ? "default" : "outline"} size="sm" onClick={() => handleLoad(r)}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> {r.name}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="px-1.5"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report output */}
          {reportLoading ? (
            <Skeleton className="h-64" />
          ) : runReport && reportData && reportData.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectedColumns.map((col) => (
                          <TableHead key={col}>{source.columns.find(c => c.key === col)?.label || col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.slice(0, 100).map((row: any, i: number) => (
                        <TableRow key={i}>
                          {selectedColumns.map((col) => (
                            <TableCell key={col} className="tabular-nums">{formatValue(col, row[col])}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {reportData.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Showing 100 of {reportData.length} results</p>
                )}
              </CardContent>
            </Card>
          ) : runReport ? (
            <ReportEmptyState title="No results" description="Try different filters or date range." />
          ) : (
            <ReportEmptyState title="Build your report" description="Select a data source, choose columns, and click Run to generate your custom report." />
          )}
        </div>
      </div>
    </div>
  );
}
