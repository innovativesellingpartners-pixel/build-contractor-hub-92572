/**
 * VendorDetailPanel — Shows vendor analysis with spend breakdown and transactions.
 */

import { useDrillDown } from "../DrillDownProvider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Store, DollarSign, TrendingUp } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

interface Props {
  data: {
    name?: string;
    DisplayName?: string;
    Balance?: string;
    Id?: string;
    totalSpend?: number;
    transactionCount?: number;
    breakdown?: { category: string; amount: number }[];
  };
}

export function VendorDetailPanel({ data }: Props) {
  const name = data.DisplayName || data.name || "Vendor";
  const balance = parseFloat(data.Balance || "0");
  const totalSpend = data.totalSpend || balance;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{name}</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Total Spend</p>
          <p className="text-base font-bold tabular-nums">{fmt(totalSpend)}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className={`text-base font-bold tabular-nums ${balance > 0 ? "text-red-600" : ""}`}>{fmt(balance)}</p>
        </div>
      </div>

      {data.transactionCount && (
        <div className="text-sm text-muted-foreground">
          {data.transactionCount} transactions
          {totalSpend > 0 && data.transactionCount > 0 && (
            <span> · Avg: {fmt(totalSpend / data.transactionCount)}</span>
          )}
        </div>
      )}

      <Separator />

      {data.breakdown && data.breakdown.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Spend Breakdown</h4>
          {data.breakdown.map((item) => (
            <div key={item.category} className="flex justify-between text-sm">
              <span>{item.category}</span>
              <span className="font-medium tabular-nums">{fmt(item.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {data.Id && (
        <div className="text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">QB Synced</Badge>
        </div>
      )}
    </div>
  );
}
