import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBPayments } from "@/hooks/useQuickBooksQuery";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export function QBPayments() {
  const { data: payments, isLoading, error } = useQBPayments();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Payments Received</h3>
        <p className="text-sm text-muted-foreground">Customer payments from your connected accounting</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Failed to load payments.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments && payments.length > 0 ? payments.map((p: any) => (
                    <TableRow key={p.Id}>
                      <TableCell>{fmtDate(p.TxnDate)}</TableCell>
                      <TableCell>{p.CustomerRef?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.PaymentMethodRef?.name || "Other"}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{fmt(parseFloat(p.TotalAmt || "0"))}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No payments found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y">
              {payments && payments.length > 0 ? payments.map((p: any) => (
                <div key={p.Id} className="p-3 min-h-[56px]">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{p.CustomerRef?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(p.TxnDate)} · {p.PaymentMethodRef?.name || "Other"}</p>
                    </div>
                    <p className="font-semibold text-sm tabular-nums flex-shrink-0 text-green-600">{fmt(parseFloat(p.TotalAmt || "0"))}</p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-muted-foreground text-sm">No payments found</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
