import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQBAgingReport } from "@/hooks/useQuickBooksQuery";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

function flattenAgingRows(rows: any[]): { name: string; values: string[] }[] {
  const result: { name: string; values: string[] }[] = [];
  function walk(items: any[]) {
    for (const row of items) {
      if (row.ColData) {
        result.push({ name: row.ColData[0]?.value || "", values: row.ColData.slice(1).map((c: any) => c.value || "0") });
      }
      if (row.Rows?.Row) walk(row.Rows.Row);
      if (row.Summary?.ColData) {
        result.push({ name: `Total: ${row.Summary.ColData[0]?.value || ""}`, values: row.Summary.ColData.slice(1).map((c: any) => c.value || "0") });
      }
    }
  }
  walk(rows);
  return result;
}

function AgingTable({ type }: { type: "AgedReceivableDetail" | "AgedPayableDetail" }) {
  const { data, isLoading, error } = useQBAgingReport(type);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (error) return <Card><CardContent className="py-8 text-center text-muted-foreground">We're having trouble syncing your aging data. Please try reconnecting or click Sync to retry.</CardContent></Card>;

  const columns = data?.raw?.Columns?.Column?.map((c: any) => c.ColTitle) || ["Name", "Current", "1-30", "31-60", "61-90", "91+", "Total"];
  const rows = flattenAgingRows(data?.rows || []);

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col: string, i: number) => (
                <TableHead key={i} className={i > 0 ? "text-right" : ""}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? rows.map((row, i) => (
              <TableRow key={i} className={row.name.startsWith("Total") ? "font-semibold bg-muted/30" : ""}>
                <TableCell className="truncate max-w-[200px]">{row.name}</TableCell>
                {row.values.map((v, vi) => (
                  <TableCell key={vi} className="text-right tabular-nums">{fmt(parseFloat(v) || 0)}</TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">No aging data</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function QBAging() {
  const [tab, setTab] = useState("ar");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Aging Reports</h3>
        <p className="text-sm text-muted-foreground">Accounts receivable and payable aging</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ar">Receivable (AR)</TabsTrigger>
          <TabsTrigger value="ap">Payable (AP)</TabsTrigger>
        </TabsList>
        <TabsContent value="ar" className="mt-4">
          <AgingTable type="AgedReceivableDetail" />
        </TabsContent>
        <TabsContent value="ap" className="mt-4">
          <AgingTable type="AgedPayableDetail" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
