import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBBalanceSheet } from "@/hooks/useQuickBooksQuery";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDrillDown } from "@/components/reporting/drilldown/DrillDownProvider";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

function flattenSection(rows: any[]): { name: string; amount: number; depth: number; isSummary: boolean }[] {
  const result: { name: string; amount: number; depth: number; isSummary: boolean }[] = [];
  function walk(items: any[], depth: number) {
    for (const row of items) {
      if (row.ColData) {
        result.push({ name: row.ColData[0]?.value || "", amount: parseFloat(row.ColData[1]?.value || "0"), depth, isSummary: false });
      }
      if (row.Rows?.Row) walk(row.Rows.Row, depth + 1);
      if (row.Summary?.ColData) {
        result.push({ name: row.Summary.ColData[0]?.value || "", amount: parseFloat(row.Summary.ColData[1]?.value || "0"), depth, isSummary: true });
      }
    }
  }
  walk(rows, 0);
  return result;
}

export function QBBalanceSheet() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const { data, isLoading, error } = useQBBalanceSheet(asOfDate);
  const { openPanel } = useDrillDown();

  const sections = data?.rows || [];

  const handleAccountClick = (name: string, amount: number, sectionName: string) => {
    openPanel({
      type: "category-breakdown",
      title: `${name} · as of ${asOfDate}`,
      data: { category: name, total: amount, period: `As of ${asOfDate}`, section: sectionName },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Balance Sheet</h3>
          <p className="text-sm text-muted-foreground">Snapshot as of {asOfDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="bs-date" className="text-sm whitespace-nowrap">As of:</Label>
          <Input id="bs-date" type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-[160px]" />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">We're having trouble syncing your balance sheet data. Please try reconnecting or click Sync to retry.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section: any, si: number) => {
                  const sectionName = section.Header?.ColData?.[0]?.value || section.group || `Section ${si + 1}`;
                  const rows = flattenSection(section.Rows?.Row || []);
                  const summaryAmt = section.Summary?.ColData?.[1]?.value;
                  return [
                    <TableRow key={`h-${si}`} className="bg-muted/50">
                      <TableCell colSpan={2} className="font-bold text-base">{sectionName}</TableCell>
                    </TableRow>,
                    ...rows.map((row, ri) => (
                      <TableRow
                        key={`r-${si}-${ri}`}
                        className={`${row.isSummary ? "font-semibold bg-muted/20" : "cursor-pointer hover:bg-muted/50 transition-colors"}`}
                        onClick={() => !row.isSummary && handleAccountClick(row.name, row.amount, sectionName)}
                      >
                        <TableCell style={{ paddingLeft: `${16 + row.depth * 16}px` }}>{row.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(row.amount)}</TableCell>
                      </TableRow>
                    )),
                    summaryAmt && (
                      <TableRow key={`s-${si}`} className="font-bold border-t-2">
                        <TableCell className="pl-4">Total {sectionName}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(parseFloat(summaryAmt))}</TableCell>
                      </TableRow>
                    ),
                  ];
                })}
                {sections.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No balance sheet data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
