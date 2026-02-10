import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBExpenses } from "@/hooks/useQuickBooksQuery";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export function QBExpenses() {
  const { data: expenses, isLoading, error } = useQBExpenses();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Expenses & Purchases</h3>
        <p className="text-sm text-muted-foreground">Vendor expenses from your connected accounting</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Failed to load expenses.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Memo</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses && expenses.length > 0 ? expenses.map((e: any) => (
                    <TableRow key={e.Id}>
                      <TableCell>{fmtDate(e.TxnDate)}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{e.EntityRef?.name || "Unknown"}</TableCell>
                      <TableCell className="truncate max-w-[120px]">
                        {e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "—"}
                      </TableCell>
                      <TableCell className="truncate max-w-[150px]">{e.PrivateNote || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-red-600">{fmt(parseFloat(e.TotalAmt || "0"))}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y">
              {expenses && expenses.length > 0 ? expenses.map((e: any) => (
                <div key={e.Id} className="p-3 min-h-[56px]">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{e.EntityRef?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(e.TxnDate)} · {e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "—"}
                      </p>
                    </div>
                    <p className="font-semibold text-sm tabular-nums flex-shrink-0 text-red-600">{fmt(parseFloat(e.TotalAmt || "0"))}</p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-muted-foreground text-sm">No expenses found</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
