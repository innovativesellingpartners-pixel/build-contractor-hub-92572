import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle,
  Loader2, Package, Trash2, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createCsvAdapter, createSampleDataAdapter, type CatalogProduct } from "@/lib/catalog/sourceAdapters";
import { SAMPLE_PRODUCTS } from "@/lib/catalog/sampleProducts";

const PRODUCT_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "retailer", label: "Retailer", required: true },
  { key: "source_product_id", label: "Source Product ID" },
  { key: "sku", label: "SKU" },
  { key: "upc", label: "UPC" },
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "subcategory", label: "Subcategory" },
  { key: "material_type", label: "Material Type" },
  { key: "trade", label: "Trade" },
  { key: "unit_of_measure", label: "Unit of Measure" },
  { key: "package_size", label: "Package Size" },
  { key: "dimensions", label: "Dimensions" },
  { key: "thickness", label: "Thickness" },
  { key: "length_value", label: "Length Value" },
  { key: "width_value", label: "Width Value" },
  { key: "height_value", label: "Height Value" },
  { key: "size_text", label: "Size Text" },
  { key: "color", label: "Color" },
  { key: "finish", label: "Finish" },
  { key: "material", label: "Material" },
  { key: "price", label: "Price" },
  { key: "currency", label: "Currency" },
  { key: "inventory_status", label: "Inventory Status" },
  { key: "product_url", label: "Product URL" },
  { key: "image_url", label: "Image URL" },
];

const SAMPLE_CSV_HEADER = "retailer,source_product_id,sku,upc,brand,model,title,description,category,subcategory,material_type,trade,unit_of_measure,package_size,dimensions,thickness,length_value,width_value,height_value,size_text,color,finish,material,price,currency,inventory_status,product_url,image_url";
const SAMPLE_CSV_ROW1 = 'lowes,lowes-lumber-001,1234567,012345678901,Top Choice,2x4-8-PT,"Top Choice 2x4x8 Pressure Treated Lumber","#2 Prime pressure treated dimensional lumber",lumber,dimensional lumber,wood,framing,piece,,2x4x8,,8,4,2,2" x 4" x 8\',,pressure treated,pressure treated pine,5.98,USD,in_stock,https://www.lowes.com/pd/example,https://images.lowes.com/example.jpg';
const SAMPLE_CSV_ROW2 = 'home_depot,hd-wire-001,5521344,,Southwire,55213443,"Southwire 250ft 12/2 Romex NM-B Wire","Solid copper NM-B residential wire",electrical,wire,copper,electrical,250ft roll,,,,,,12/2 NM-B,,,copper,89.97,USD,in_stock,https://www.homedepot.com/p/example,https://images.homedepot.com/example.jpg';

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

interface ImportSummary {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// Sample products are now imported from @/lib/catalog/sampleProducts

export default function AdminCatalogImport() {
  const { toast } = useToast();

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});

  // Options
  const [upsertMode, setUpsertMode] = useState(true);

  // Progress
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [insertingSamples, setInsertingSamples] = useState(false);
  const [reseedingSamples, setReseedingSamples] = useState(false);

  // Step tracking
  const step = useMemo(() => {
    if (summary) return "done";
    if (importing) return "importing";
    if (csvRows.length > 0) return "preview";
    return "upload";
  }, [summary, importing, csvRows.length]);

  const handleInsertSamples = useCallback(async () => {
    setInsertingSamples(true);
    try {
      const adapter = createSampleDataAdapter();
      const result = await adapter.ingest(SAMPLE_PRODUCTS as CatalogProduct[]);

      toast({
        title: "Sample data inserted",
        description: `${result.inserted} products added across Lowe's and Home Depot. ${result.errors.length > 0 ? `${result.errors.length} errors.` : "Ready to test in AI chat!"}`,
      });
    } catch (err) {
      console.error("Sample insert failed:", err);
      toast({ title: "Error", description: "Failed to insert sample data", variant: "destructive" });
    } finally {
      setInsertingSamples(false);
    }
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please select a .csv file", variant: "destructive" });
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 20MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        toast({ title: "Empty file", description: "No data found in CSV", variant: "destructive" });
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);
      setFile(f);
      setSummary(null);

      // Auto-map columns by exact or close match
      const autoMap: Record<string, string> = {};
      const fieldKeys = PRODUCT_FIELDS.map((pf) => pf.key);
      for (const h of headers) {
        const normalized = h.toLowerCase().replace(/[\s\-]/g, "_");
        if (fieldKeys.includes(normalized)) {
          autoMap[h] = normalized;
        }
      }
      setColumnMap(autoMap);
    };
    reader.readAsText(f);
  }, [toast]);

  const mappedFieldCount = Object.values(columnMap).filter((v) => v && v !== "__skip__").length;
  const hasRequiredFields = useMemo(() => {
    const mapped = new Set(Object.values(columnMap));
    return mapped.has("retailer") && mapped.has("title");
  }, [columnMap]);

  const handleImport = useCallback(async () => {
    if (!hasRequiredFields) {
      toast({ title: "Missing required fields", description: "Retailer and Title must be mapped.", variant: "destructive" });
      return;
    }

    setImporting(true);
    setSummary(null);

    const result: ImportSummary = { total: csvRows.length, inserted: 0, updated: 0, skipped: 0, errors: [] };

    // Build mapped rows
    const mappedRows: CatalogProduct[] = [];
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const obj: Record<string, any> = {};

      let valid = true;
      for (let j = 0; j < csvHeaders.length; j++) {
        const csvCol = csvHeaders[j];
        const targetField = columnMap[csvCol];
        if (!targetField || targetField === "__skip__") continue;

        let val: any = row[j] ?? "";
        if (val === "") val = null;

        // Type coercion for numeric fields
        if (["price", "length_value", "width_value", "height_value"].includes(targetField) && val !== null) {
          const num = parseFloat(val);
          if (isNaN(num)) {
            result.errors.push({ row: i + 2, message: `Invalid number for ${targetField}: "${val}"` });
            valid = false;
            break;
          }
          val = num;
        }

        obj[targetField] = val;
      }

      if (!valid) { result.skipped++; continue; }
      if (!obj.retailer || !obj.title) {
        result.errors.push({ row: i + 2, message: "Missing retailer or title" });
        result.skipped++;
        continue;
      }
      mappedRows.push(obj as CatalogProduct);
    }

    // Use the CSV adapter for ingestion
    try {
      const adapter = createCsvAdapter(file?.name || "unknown.csv");
      const adapterResult = await adapter.ingest(mappedRows);
      result.inserted = adapterResult.inserted;
      result.errors.push(...adapterResult.errors);
    } catch (err: any) {
      result.errors.push({ row: 0, message: err.message });
    }

    setSummary(result);
    setImporting(false);
    toast({
      title: "Import complete",
      description: `${result.inserted + result.updated} products saved, ${result.skipped} skipped, ${result.errors.length} error(s).`,
    });
  }, [csvHeaders, csvRows, columnMap, file, upsertMode, hasRequiredFields, toast]);

  const downloadTemplate = useCallback(() => {
    const content = [SAMPLE_CSV_HEADER, SAMPLE_CSV_ROW1, SAMPLE_CSV_ROW2].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_catalog_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMap({});
    setSummary(null);
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Product Catalog Import
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload CSV files to populate the retailer product catalog for Lowe's, Home Depot, and other retailers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Quick Sample Data Insert */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Quick Start: Sample Product Data
          </CardTitle>
          <CardDescription>
            Insert {SAMPLE_PRODUCTS.length} realistic sample products across Lowe's and Home Depot covering drywall, lumber, plywood, OSB, electrical, plumbing, roofing, concrete, paint, fasteners, HVAC, and more. Perfect for testing the AI chat before live imports are ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button onClick={handleInsertSamples} disabled={insertingSamples || reseedingSamples}>
            {insertingSamples ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Inserting…
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Insert Sample Product Data
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReseedSamples} disabled={insertingSamples || reseedingSamples}>
            {reseedingSamples ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reseeding…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh / Reseed Sample Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Step 1: Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {step === "upload" ? "Step 1: Select CSV File" : file?.name || "File loaded"}
          </CardTitle>
          {step !== "upload" && (
            <CardDescription>
              {csvRows.length} rows, {csvHeaders.length} columns detected
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {step === "upload" ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Drag a CSV file here or click to browse
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="max-w-xs mx-auto"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{csvRows.length} rows</Badge>
              <Badge variant="outline">{csvHeaders.length} columns</Badge>
              <Badge variant="outline">{mappedFieldCount} mapped</Badge>
              <Button variant="ghost" size="sm" onClick={reset} className="ml-auto">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Column Mapping */}
      {step !== "upload" && !summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Step 2: Map Columns</CardTitle>
            <CardDescription>
              Match your CSV columns to product fields. Retailer and Title are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {csvHeaders.map((header) => (
                <div key={header} className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">{header}</Label>
                  <Select
                    value={columnMap[header] || "__skip__"}
                    onValueChange={(val) =>
                      setColumnMap((prev) => ({ ...prev, [header]: val }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">-- Skip --</SelectItem>
                      {PRODUCT_FIELDS.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}{f.required ? " *" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && csvRows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Step 3: Preview (first 5 rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-10">#</TableHead>
                    {csvHeaders.map((h) => {
                      const mapped = columnMap[h];
                      return (
                        <TableHead key={h} className="text-xs whitespace-nowrap">
                          {mapped && mapped !== "__skip__" ? (
                            <span className="text-primary font-semibold">{mapped}</span>
                          ) : (
                            <span className="text-muted-foreground line-through">{h}</span>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvRows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-xs max-w-[200px] truncate">
                          {cell || <span className="text-muted-foreground/50">-</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Import options */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Switch checked={upsertMode} onCheckedChange={setUpsertMode} id="upsert-mode" />
                <Label htmlFor="upsert-mode" className="text-sm">
                  Upsert mode (update existing rows by retailer + source_product_id)
                </Label>
              </div>
              <Button
                onClick={handleImport}
                disabled={!hasRequiredFields || importing}
                className="min-w-[140px]"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {csvRows.length} Rows
                  </>
                )}
              </Button>
            </div>
            {!hasRequiredFields && (
              <p className="text-xs text-destructive mt-2">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Map at least "Retailer" and "Title" columns before importing.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Summary */}
      {summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {summary.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              Import Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{summary.total}</p>
                <p className="text-xs text-muted-foreground">Total Rows</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{summary.inserted}</p>
                <p className="text-xs text-muted-foreground">Inserted</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.updated}</p>
                <p className="text-xs text-muted-foreground">Updated</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{summary.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{summary.errors.length}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>

            {summary.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Errors:</p>
                <ScrollArea className="max-h-[200px]">
                  {summary.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs py-1">
                      <XCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                      <span>
                        <strong>Row {err.row}:</strong> {err.message}
                      </span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}

            <Button variant="outline" onClick={reset}>
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
