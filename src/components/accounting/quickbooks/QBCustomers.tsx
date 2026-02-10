import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBCustomers } from "@/hooks/useQuickBooksQuery";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

export function QBCustomers() {
  const { data: customers, isLoading, error } = useQBCustomers();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Customers</h3>
        <p className="text-sm text-muted-foreground">Customer accounts from your connected accounting</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">We're having trouble syncing your customer data. Please try reconnecting or click Sync to retry.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers && customers.length > 0 ? customers.map((c: any) => (
                    <TableRow key={c.Id}>
                      <TableCell className="font-medium">{c.DisplayName}</TableCell>
                      <TableCell className="truncate max-w-[180px]">{c.PrimaryEmailAddr?.Address || "—"}</TableCell>
                      <TableCell>{c.PrimaryPhone?.FreeFormNumber || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{fmt(parseFloat(c.Balance || "0"))}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No customers found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y">
              {customers && customers.length > 0 ? customers.map((c: any) => (
                <div key={c.Id} className="p-3 min-h-[56px]">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{c.DisplayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.PrimaryEmailAddr?.Address || c.PrimaryPhone?.FreeFormNumber || "—"}</p>
                    </div>
                    <p className="font-semibold text-sm tabular-nums flex-shrink-0">{fmt(parseFloat(c.Balance || "0"))}</p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-muted-foreground text-sm">No customers found</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
