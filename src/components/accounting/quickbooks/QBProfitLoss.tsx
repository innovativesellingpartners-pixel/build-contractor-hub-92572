import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBProfitAndLoss } from "@/hooks/useQuickBooksQuery";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const presets: Record<string, () => { start: string; end: string; label: string }> = {
  "this-month": () => {
    const now = new Date();
    return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, end: now.toISOString().split("T")[0], label: "This Month" };
  },
  "last-month": () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: first.toISOString().split("T")[0], end: last.toISOString().split("T")[0], label: "Last Month" };
  },
  ytd: () => {
    const now = new Date();
    return { start: `${now.getFullYear()}-01-01`, end: now.toISOString().split("T")[0], label: "Year to Date" };
  },
  "last-year": () => {
    const y = new Date().getFullYear() - 1;
    return { start: `${y}-01-01`, end: `${y}-12-31`, label: "Last Year" };
  },
};

function extractTotal(rows: any[], groupName: string): number {
  const group = rows.find((r: any) => r.group === groupName || r.Summary?.ColData?.[0]?.value === groupName);
  if (group?.Summary?.ColData?.[1]?.value) return parseFloat(group.Summary.ColData[1].value) || 0;
  return 0;
}

function flattenRows(rows: any[]): { name: string; amount: number; depth: number }[] {
  const result: { name: string; amount: number; depth: number }[] = [];
  function walk(items: any[], depth: number) {
    for (const row of items) {
      if (row.ColData) {
        result.push({ name: row.ColData[0]?.value || "", amount: parseFloat(row.ColData[1]?.value || "0"), depth });
      }
      if (row.Rows?.Row) walk(row.Rows.Row, depth + 1);
      if (row.Summary?.ColData) {
        result.push({ name: `Total ${row.Summary.ColData[0]?.value || ""}`, amount: parseFloat(row.Summary.ColData[1]?.value || "0"), depth });
      }
    }
  }
  walk(rows, 0);
  return result;
}

export function QBProfitLoss() {
  const [preset, setPreset] = useState("ytd");
  const range = presets[preset]();
  const { data, isLoading, error } = useQBProfitAndLoss({ start: range.start, end: range.end });

  const income = data ? extractTotal(data.rows, "Income") : 0;
  const expenses = data ? extractTotal(data.rows, "Expenses") : 0;
  const net = income - expenses;
  const flatRows = data ? flattenRows(data.rows) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Profit & Loss</h3>
          <p className="text-sm text-muted-foreground">{range.label}</p>
        </div>
        <Select value={preset} onValueChange={setPreset}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">We're having trouble syncing your accounting data. Please try reconnecting or click Sync to retry.</CardContent></Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3 min-w-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums text-green-600">{fmt(income)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums text-red-600">{fmt(expenses)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className={`text-xl font-bold tabular-nums ${net >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(net)}</div></CardContent>
            </Card>
          </div>

          {/* Detail table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flatRows.length > 0 ? flatRows.map((row, i) => (
                    <TableRow key={i} className={row.name.startsWith("Total") ? "font-semibold bg-muted/30" : ""}>
                      <TableCell style={{ paddingLeft: `${16 + row.depth * 16}px` }}>{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(row.amount)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No data for this period</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
