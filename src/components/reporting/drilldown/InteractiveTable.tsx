/**
 * InteractiveTable — Table with clickable rows, sortable columns, sticky header, and search.
 * Polished modern SaaS design with clear visual hierarchy.
 */

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
  width?: string;
}

interface Props<T> {
  title?: string;
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  rowClickLabel?: string;
  searchPlaceholder?: string;
  searchKeys?: string[];
  maxRows?: number;
  emptyMessage?: string;
  renderRowActions?: (row: T) => React.ReactNode;
  getRowLink?: (row: T) => { label: string; onClick: () => void } | null;
}

export function InteractiveTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  onRowClick,
  rowClickLabel = "View details",
  searchPlaceholder = "Search...",
  searchKeys,
  maxRows = 50,
  emptyMessage = "No data available",
  renderRowActions,
  getRowLink,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search && searchKeys?.length) {
      const lower = search.toLowerCase();
      result = result.filter(row =>
        searchKeys.some(key => String(row[key] ?? "").toLowerCase().includes(lower))
      );
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const numA = Number(aVal);
        const numB = Number(bVal);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === "asc" ? numA - numB : numB - numA;
        }
        const strA = String(aVal);
        const strB = String(bVal);
        return sortDir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  return (
    <Card className="overflow-hidden border-border/60">
      {(title || searchKeys?.length) && (
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {title && <CardTitle className="text-sm font-semibold">{title}</CardTitle>}
            {searchKeys && searchKeys.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm h-9 bg-background"
                />
              </div>
            )}
          </div>
          {onRowClick && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Click any row for details · Click column headers to sort
            </p>
          )}
        </CardHeader>
      )}
      <CardContent className="p-0">
        {filteredData.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.sortable !== false && "cursor-pointer select-none hover:text-foreground transition-colors",
                        col.className,
                      )}
                      style={col.width ? { width: col.width } : undefined}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                    >
                      <span className="flex items-center gap-0.5">
                        {col.label}
                        {col.sortable !== false && <SortIcon colKey={col.key} />}
                      </span>
                    </TableHead>
                  ))}
                  {(renderRowActions || onRowClick) && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, maxRows).map((row, i) => (
                  <TableRow
                    key={row.id || i}
                    className={cn(
                      "border-border/30",
                      onRowClick && "cursor-pointer hover:bg-muted/40 transition-colors group"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "text-sm",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          "tabular-nums",
                          col.className,
                        )}
                      >
                        {col.render ? col.render(row) : (row[col.key] ?? "—")}
                      </TableCell>
                    ))}
                    {(renderRowActions || onRowClick) && (
                      <TableCell className="text-right pr-4">
                        {renderRowActions ? renderRowActions(row) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all inline-block" />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredData.length > maxRows && (
              <p className="text-xs text-muted-foreground text-center py-3 border-t border-border/40 bg-muted/10">
                Showing {maxRows} of {filteredData.length} results
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
