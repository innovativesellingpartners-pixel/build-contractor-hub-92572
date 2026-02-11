import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, Users, Store, Calendar } from "lucide-react";
import { useQBProfitAndLoss, useQBCustomers, useQBVendors } from "@/hooks/useQuickBooksQuery";
import { InteractiveMetricCard } from "@/components/reporting/drilldown/InteractiveMetricCard";
import { useDrillDown } from "@/components/reporting/drilldown/DrillDownProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type DatePreset = "this-month" | "last-month" | "this-quarter" | "last-quarter" | "ytd" | "last-year" | "all-time" | "custom";

const presetLabels: Record<DatePreset, string> = {
  "this-month": "This Month",
  "last-month": "Last Month",
  "this-quarter": "This Quarter",
  "last-quarter": "Last Quarter",
  "ytd": "Year to Date",
  "last-year": "Last Year",
  "all-time": "All Time",
  "custom": "Custom",
};

function getPresetRange(preset: DatePreset): { start: string; end: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.toISOString().split("T")[0];

  switch (preset) {
    case "this-month":
      return { start: `${y}-${String(m + 1).padStart(2, "0")}-01`, end: today, label: "This Month" };
    case "last-month": {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      const lastDay = new Date(ly, lm + 1, 0).getDate();
      return { start: `${ly}-${String(lm + 1).padStart(2, "0")}-01`, end: `${ly}-${String(lm + 1).padStart(2, "0")}-${lastDay}`, label: "Last Month" };
    }
    case "this-quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return { start: `${y}-${String(qStart + 1).padStart(2, "0")}-01`, end: today, label: "This Quarter" };
    }
    case "last-quarter": {
      let qStart = Math.floor(m / 3) * 3 - 3;
      let qy = y;
      if (qStart < 0) { qStart += 12; qy -= 1; }
      const qEnd = new Date(qy, qStart + 3, 0);
      return { start: `${qy}-${String(qStart + 1).padStart(2, "0")}-01`, end: qEnd.toISOString().split("T")[0], label: "Last Quarter" };
    }
    case "ytd":
      return { start: `${y}-01-01`, end: today, label: "Year to Date" };
    case "last-year":
      return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31`, label: "Last Year" };
    case "all-time":
      return { start: "2000-01-01", end: today, label: "All Time" };
    default:
      return { start: `${y}-01-01`, end: today, label: "Year to Date" };
  }
}

function extractTotal(rows: any[], groupName: string): number {
  const group = rows.find((r: any) => r.group === groupName || r.Summary?.ColData?.[0]?.value === groupName);
  if (group?.Summary?.ColData?.[1]?.value) return parseFloat(group.Summary.ColData[1].value) || 0;
  return 0;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

export function QBOverview() {
  const [datePreset, setDatePreset] = useState<DatePreset>("ytd");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const dateRange = useMemo(() => {
    if (datePreset === "custom" && customStart && customEnd) {
      return {
        start: format(customStart, "yyyy-MM-dd"),
        end: format(customEnd, "yyyy-MM-dd"),
        label: `${format(customStart, "MMM d, yyyy")} – ${format(customEnd, "MMM d, yyyy")}`,
      };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const { data: pnl, isLoading: pnlLoading } = useQBProfitAndLoss(dateRange);
  const { data: customers, isLoading: custLoading } = useQBCustomers();
  const { data: vendors, isLoading: vendLoading } = useQBVendors();
  const { openPanel, navigateToReport } = useDrillDown();

  const income = pnl ? extractTotal(pnl.rows, "Income") : 0;
  const expenses = pnl ? extractTotal(pnl.rows, "Expenses") : 0;
  const netIncome = income - expenses;

  const loading = pnlLoading || custLoading || vendLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const periodLabel = dateRange.label;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Date range selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {(Object.keys(presetLabels) as DatePreset[]).map((key) => (
              <SelectItem key={key} value={key}>
                {presetLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {datePreset === "custom" && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("min-w-[120px] justify-start text-left font-normal", !customStart && "text-muted-foreground")}>
                  {customStart ? format(customStart, "MMM d, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <CalendarComponent mode="single" selected={customStart} onSelect={setCustomStart} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-sm">–</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("min-w-[120px] justify-start text-left font-normal", !customEnd && "text-muted-foreground")}>
                  {customEnd ? format(customEnd, "MMM d, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <CalendarComponent mode="single" selected={customEnd} onSelect={setCustomEnd} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        <InteractiveMetricCard
          title="Revenue"
          value={fmt(income)}
          subtitle={periodLabel}
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
          variant="success"
          onClick={() => navigateToReport("pnl")}
        />
        <InteractiveMetricCard
          title="Expenses"
          value={fmt(expenses)}
          subtitle={periodLabel}
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          variant="danger"
          onClick={() => navigateToReport("expenses")}
        />
        <InteractiveMetricCard
          title="Net Income"
          value={fmt(netIncome)}
          subtitle={periodLabel}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          variant={netIncome >= 0 ? "success" : "danger"}
          onClick={() => navigateToReport("pnl")}
        />
        <InteractiveMetricCard
          title="Active Customers"
          value={String(customers?.length || 0)}
          subtitle={`${vendors?.length || 0} vendors`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          onClick={() => navigateToReport("customers")}
        />
      </div>

      {/* Top customers & vendors — clickable rows */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers && customers.length > 0 ? (
              <div className="space-y-1">
                {customers.slice(0, 5).map((c: any) => (
                  <button
                    key={c.Id}
                    className="flex justify-between items-center text-sm min-h-[40px] w-full px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer text-left group"
                    onClick={() => openPanel({
                      type: "qb-record",
                      title: c.DisplayName,
                      data: { record: c, recordType: "qb-customer" },
                    })}
                  >
                    <span className="truncate mr-3">{c.DisplayName}</span>
                    <span className="tabular-nums font-medium flex-shrink-0">
                      {fmt(parseFloat(c.Balance || "0"))}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No customer data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4" /> Top Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendors && vendors.length > 0 ? (
              <div className="space-y-1">
                {vendors.slice(0, 5).map((v: any) => (
                  <button
                    key={v.Id}
                    className="flex justify-between items-center text-sm min-h-[40px] w-full px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer text-left group"
                    onClick={() => openPanel({
                      type: "qb-record",
                      title: v.DisplayName,
                      data: { record: v, recordType: "qb-vendor" },
                    })}
                  >
                    <span className="truncate mr-3">{v.DisplayName}</span>
                    <span className="tabular-nums font-medium flex-shrink-0">
                      {fmt(parseFloat(v.Balance || "0"))}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No vendor data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
