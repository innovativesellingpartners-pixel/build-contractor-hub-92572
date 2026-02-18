/**
 * ListPanel — Renders a searchable, scrollable list of items in the drill-down panel.
 * Each item is clickable to open its detail panel.
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useDrillDown } from "../DrillDownProvider";
import { cn } from "@/lib/utils";

export interface ListPanelColumn {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface Props {
  data: {
    items: any[];
    columns: ListPanelColumn[];
    onItemClick?: (item: any) => { type: string; title: string; data: any };
    searchKeys?: string[];
    emptyMessage?: string;
  };
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  accepted: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  sold: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  contacted: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  won: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  lost: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

export function ListPanel({ data }: Props) {
  const { openPanel } = useDrillDown();
  const [search, setSearch] = useState("");
  const { items = [], columns = [], onItemClick, searchKeys = [], emptyMessage = "No items found." } = data;

  const filtered = search.trim()
    ? items.filter((item) =>
        searchKeys.some((key) =>
          String(item[key] || "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : items;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""} total</p>

      {searchKeys.length > 0 && items.length > 5 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
      ) : (
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {filtered.map((item, idx) => {
            const clickConfig = onItemClick?.(item);
            return (
              <div
                key={item.id || idx}
                className={cn(
                  "rounded-lg border border-border/60 p-3 transition-colors",
                  clickConfig && "cursor-pointer hover:bg-muted/50 active:scale-[0.99]"
                )}
                onClick={() => {
                  if (clickConfig) {
                    openPanel(clickConfig as any);
                  }
                }}
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex items-center justify-between py-0.5">
                    <span className="text-xs text-muted-foreground">{col.label}</span>
                    <span className="text-sm font-medium text-right max-w-[60%] truncate">
                      {col.render ? col.render(item) : (
                        col.key === "status" ? (
                          <Badge className={statusColors[item[col.key]] || ""} variant="outline">
                            {item[col.key] || "—"}
                          </Badge>
                        ) : col.key.includes("amount") || col.key.includes("cost") || col.key.includes("value") ? (
                          fmt(Number(item[col.key] || 0))
                        ) : col.key.includes("created_at") || col.key.includes("date") ? (
                          item[col.key] ? new Date(item[col.key]).toLocaleDateString() : "—"
                        ) : (
                          String(item[col.key] || "—")
                        )
                      )}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
