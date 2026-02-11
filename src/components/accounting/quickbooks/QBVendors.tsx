/**
 * QBVendors — Vendor spend tracking with interactive drill-down.
 */

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQBVendors } from "@/hooks/useQuickBooksQuery";
import { Store, DollarSign, TrendingDown, UserCheck, ChevronRight } from "lucide-react";
import { InteractiveMetricCard } from "@/components/reporting/drilldown/InteractiveMetricCard";
import { useDrillDown } from "@/components/reporting/drilldown/DrillDownProvider";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

export function QBVendors() {
  const { data: vendors, isLoading, error } = useQBVendors();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { openPanel } = useDrillDown();

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

  const handleVendorClick = (v: any) => {
    openPanel({
      type: "qb-record",
      title: v.DisplayName,
      data: { record: v, recordType: "qb-vendor" },
    });
  };

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
            <InteractiveMetricCard
              title="Total Vendors"
              value={String(metrics.total)}
              icon={<Store className="h-4 w-4 text-muted-foreground" />}
            />
            <InteractiveMetricCard
              title="Active"
              value={String(metrics.active)}
              icon={<UserCheck className="h-4 w-4 text-green-600" />}
              variant="success"
              onClick={() => setStatusFilter("active")}
            />
            <InteractiveMetricCard
              title="Total Payable"
              value={fmt(metrics.totalBalance)}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              variant="warning"
            />
            <InteractiveMetricCard
              title="Avg Balance"
              value={fmt(metrics.avgBalance)}
              icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
            />
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
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? filtered.map((v: any) => (
                      <TableRow key={v.Id} className="cursor-pointer hover:bg-muted/50 transition-colors group" onClick={() => handleVendorClick(v)}>
                        <TableCell className="font-medium">{v.DisplayName}</TableCell>
                        <TableCell className="truncate max-w-[180px]">{v.PrimaryEmailAddr?.Address || "—"}</TableCell>
                        <TableCell>{v.PrimaryPhone?.FreeFormNumber || "—"}</TableCell>
                        <TableCell><Badge variant={v.Active !== false ? "default" : "secondary"}>{v.Active !== false ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fmt(parseFloat(v.Balance || "0"))}</TableCell>
                        <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No vendors found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {filtered.length > 0 ? filtered.map((v: any) => (
                  <button key={v.Id} className="p-3 min-h-[56px] w-full text-left hover:bg-muted/50 transition-colors" onClick={() => handleVendorClick(v)}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{v.DisplayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.PrimaryEmailAddr?.Address || v.PrimaryPhone?.FreeFormNumber || "—"}</p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums flex-shrink-0">{fmt(parseFloat(v.Balance || "0"))}</p>
                    </div>
                  </button>
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
