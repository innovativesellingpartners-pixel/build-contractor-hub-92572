/**
 * QBVendors — Vendor spend tracking with metric cards and search.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQBVendors } from "@/hooks/useQuickBooksQuery";
import { Store, DollarSign, TrendingDown, UserCheck } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

export function QBVendors() {
  const { data: vendors, isLoading, error } = useQBVendors();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!vendors) return [];
    let result = vendors as any[];
    if (statusFilter === "active") result = result.filter((v: any) => v.Active);
    if (statusFilter === "inactive") result = result.filter((v: any) => !v.Active);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((v: any) =>
        (v.DisplayName || "").toLowerCase().includes(term) ||
        (v.PrimaryEmailAddr?.Address || "").toLowerCase().includes(term)
      );
    }
    return result;
  }, [vendors, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    if (!vendors) return { total: 0, active: 0, totalBalance: 0, avgBalance: 0 };
    const all = vendors as any[];
    const active = all.filter((v: any) => v.Active !== false).length;
    const totalBalance = all.reduce((s: number, v: any) => s + parseFloat(v.Balance || "0"), 0);
    const avgBalance = all.length > 0 ? totalBalance / all.length : 0;
    return { total: all.length, active, totalBalance, avgBalance };
  }, [vendors]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Vendors</h3>
        <p className="text-sm text-muted-foreground">Vendor accounts from your connected accounting</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">We're having trouble syncing your vendor data. Please try reconnecting or click Sync to retry.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-3 md:gap-4 grid-cols-2 xl:grid-cols-4 min-w-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
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
                <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold tabular-nums">{fmt(metrics.totalBalance)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Balance</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
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
            <Input placeholder="Search vendor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:max-w-xs" />
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
                    {filtered.length > 0 ? filtered.map((v: any) => (
                      <TableRow key={v.Id}>
                        <TableCell className="font-medium">{v.DisplayName}</TableCell>
                        <TableCell className="truncate max-w-[180px]">{v.PrimaryEmailAddr?.Address || "—"}</TableCell>
                        <TableCell>{v.PrimaryPhone?.FreeFormNumber || "—"}</TableCell>
                        <TableCell><Badge variant={v.Active !== false ? "default" : "secondary"}>{v.Active !== false ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fmt(parseFloat(v.Balance || "0"))}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No vendors found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {filtered.length > 0 ? filtered.map((v: any) => (
                  <div key={v.Id} className="p-3 min-h-[56px]">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{v.DisplayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.PrimaryEmailAddr?.Address || v.PrimaryPhone?.FreeFormNumber || "—"}</p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums flex-shrink-0">{fmt(parseFloat(v.Balance || "0"))}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">No vendors found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
