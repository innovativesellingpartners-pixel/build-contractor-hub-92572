/**
 * QBCustomers — Customer analytics with metric cards and search.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQBCustomers } from "@/hooks/useQuickBooksQuery";
import { Users, DollarSign, TrendingUp, UserCheck } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

export function QBCustomers() {
  const { data: customers, isLoading, error } = useQBCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!customers) return [];
    let result = customers as any[];

    if (statusFilter === "active") result = result.filter((c: any) => c.Active);
    if (statusFilter === "inactive") result = result.filter((c: any) => !c.Active);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c: any) =>
        (c.DisplayName || "").toLowerCase().includes(term) ||
        (c.PrimaryEmailAddr?.Address || "").toLowerCase().includes(term)
      );
    }
    return result;
  }, [customers, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    if (!customers) return { total: 0, active: 0, totalBalance: 0, avgBalance: 0 };
    const all = customers as any[];
    const active = all.filter((c: any) => c.Active !== false).length;
    const totalBalance = all.reduce((s: number, c: any) => s + parseFloat(c.Balance || "0"), 0);
    const avgBalance = all.length > 0 ? totalBalance / all.length : 0;
    return { total: all.length, active, totalBalance, avgBalance };
  }, [customers]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Customers</h3>
        <p className="text-sm text-muted-foreground">Customer analytics from your connected accounting</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">We're having trouble syncing your customer data. Please try reconnecting or click Sync to retry.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-3 md:gap-4 grid-cols-2 xl:grid-cols-4 min-w-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums">{metrics.total}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums text-green-600">{metrics.active}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums">{fmt(metrics.totalBalance)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums">{fmt(metrics.avgBalance)}</div></CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Search name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:max-w-xs" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? filtered.map((c: any) => (
                      <TableRow key={c.Id}>
                        <TableCell className="font-medium">{c.DisplayName}</TableCell>
                        <TableCell className="truncate max-w-[180px]">{c.PrimaryEmailAddr?.Address || "—"}</TableCell>
                        <TableCell>{c.PrimaryPhone?.FreeFormNumber || "—"}</TableCell>
                        <TableCell><Badge variant={c.Active !== false ? "default" : "secondary"}>{c.Active !== false ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fmt(parseFloat(c.Balance || "0"))}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No customers found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {filtered.length > 0 ? filtered.map((c: any) => (
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
        </>
      )}
    </div>
  );
}
