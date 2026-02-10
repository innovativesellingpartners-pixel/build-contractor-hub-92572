import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, Users, Store } from "lucide-react";
import { useQBProfitAndLoss, useQBCustomers, useQBVendors } from "@/hooks/useQuickBooksQuery";

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue YTD</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-green-600">{fmt(income)}</div>
            <p className="text-xs text-muted-foreground">Total income this year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses YTD</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-red-600">{fmt(expenses)}</div>
            <p className="text-xs text-muted-foreground">Total expenses this year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income YTD</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmt(netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Income minus expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{customers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{vendors?.length || 0} vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Top customers & vendors */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers && customers.length > 0 ? (
              <div className="space-y-2">
                {customers.slice(0, 5).map((c: any) => (
                  <div key={c.Id} className="flex justify-between items-center text-sm min-h-[40px]">
                    <span className="truncate mr-3">{c.DisplayName}</span>
                    <span className="tabular-nums font-medium flex-shrink-0">
                      {fmt(parseFloat(c.Balance || "0"))}
                    </span>
                  </div>
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
              <div className="space-y-2">
                {vendors.slice(0, 5).map((v: any) => (
                  <div key={v.Id} className="flex justify-between items-center text-sm min-h-[40px]">
                    <span className="truncate mr-3">{v.DisplayName}</span>
                    <span className="tabular-nums font-medium flex-shrink-0">
                      {fmt(parseFloat(v.Balance || "0"))}
                    </span>
                  </div>
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
