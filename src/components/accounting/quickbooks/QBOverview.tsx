import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, Users, Store } from "lucide-react";
import { useQBProfitAndLoss, useQBCustomers, useQBVendors } from "@/hooks/useQuickBooksQuery";
import { InteractiveMetricCard } from "@/components/reporting/drilldown/InteractiveMetricCard";
import { useDrillDown } from "@/components/reporting/drilldown/DrillDownProvider";

function getDateRange() {
  const now = new Date();
  const start = `${now.getFullYear()}-01-01`;
  const end = now.toISOString().split("T")[0];
  return { start, end };
}

function extractTotal(rows: any[], groupName: string): number {
  const group = rows.find((r: any) => r.group === groupName || r.Summary?.ColData?.[0]?.value === groupName);
  if (group?.Summary?.ColData?.[1]?.value) return parseFloat(group.Summary.ColData[1].value) || 0;
  return 0;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

export function QBOverview() {
  const dateRange = getDateRange();
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Metric cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        <InteractiveMetricCard
          title="Revenue YTD"
          value={fmt(income)}
          subtitle="Total income this year"
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
          variant="success"
          onClick={() => navigateToReport("pnl")}
        />
        <InteractiveMetricCard
          title="Expenses YTD"
          value={fmt(expenses)}
          subtitle="Total expenses this year"
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          variant="danger"
          onClick={() => navigateToReport("expenses")}
        />
        <InteractiveMetricCard
          title="Net Income YTD"
          value={fmt(netIncome)}
          subtitle="Income minus expenses"
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
