import { useState, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save, PackagePlus, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createManualEntryAdapter, type CatalogProduct } from "@/lib/catalog/sourceAdapters";

const productSchema = z.object({
  retailer: z.string().min(1, "Retailer is required"),
  source_product_id: z.string().max(200).optional().or(z.literal("")),
  sku: z.string().max(100).optional().or(z.literal("")),
  upc: z.string().max(50).optional().or(z.literal("")),
  brand: z.string().max(200).optional().or(z.literal("")),
  model: z.string().max(200).optional().or(z.literal("")),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional().or(z.literal("")),
  category: z.string().max(200).optional().or(z.literal("")),
  subcategory: z.string().max(200).optional().or(z.literal("")),
  material_type: z.string().max(200).optional().or(z.literal("")),
  trade: z.string().max(200).optional().or(z.literal("")),
  unit_of_measure: z.string().max(50).optional().or(z.literal("")),
  package_size: z.string().max(100).optional().or(z.literal("")),
  dimensions: z.string().max(200).optional().or(z.literal("")),
  thickness: z.string().max(100).optional().or(z.literal("")),
  length_value: z.string().optional().or(z.literal("")),
  width_value: z.string().optional().or(z.literal("")),
  height_value: z.string().optional().or(z.literal("")),
  size_text: z.string().max(200).optional().or(z.literal("")),
  color: z.string().max(100).optional().or(z.literal("")),
  finish: z.string().max(100).optional().or(z.literal("")),
  material: z.string().max(200).optional().or(z.literal("")),
  price: z.string().optional().or(z.literal("")),
  inventory_status: z.string().max(50).optional().or(z.literal("")),
  product_url: z.string().url("Must be a valid URL").max(2000).optional().or(z.literal("")),
  image_url: z.string().url("Must be a valid URL").max(2000).optional().or(z.literal("")),
});

type ProductFormValues = z.infer<typeof productSchema>;

const RETAILERS = [
  { value: "lowes", label: "Lowe's" },
  { value: "home_depot", label: "Home Depot" },
];

const TRADES = [
  "framing", "drywall", "electrical", "plumbing", "hvac", "roofing",
  "concrete", "insulation", "painting", "flooring", "siding", "landscaping",
  "demolition", "finish carpentry", "general",
];

const INVENTORY_STATUSES = [
  { value: "in_stock", label: "In Stock" },
  { value: "limited", label: "Limited" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "discontinued", label: "Discontinued" },
];

const FIELD_GROUPS: { title: string; fields: { name: keyof ProductFormValues; label: string; type?: string; placeholder?: string; fullWidth?: boolean }[] }[] = [
  {
    title: "Product Identity",
    fields: [
      { name: "retailer", label: "Retailer *", placeholder: "Select retailer" },
      { name: "source_product_id", label: "Source Product ID", placeholder: "e.g. lowes-lumber-001" },
      { name: "sku", label: "SKU", placeholder: "Store SKU" },
      { name: "upc", label: "UPC", placeholder: "12-digit barcode" },
      { name: "brand", label: "Brand", placeholder: "e.g. Owens Corning" },
      { name: "model", label: "Model", placeholder: "e.g. OC-R19-BF" },
      { name: "title", label: "Title *", placeholder: "Full product title", fullWidth: true },
      { name: "description", label: "Description", placeholder: "Product description", type: "textarea", fullWidth: true },
    ],
  },
  {
    title: "Classification",
    fields: [
      { name: "category", label: "Category", placeholder: "e.g. lumber, electrical, plumbing" },
      { name: "subcategory", label: "Subcategory", placeholder: "e.g. dimensional lumber, wire" },
      { name: "material_type", label: "Material Type", placeholder: "e.g. copper, fiberglass, PVC" },
      { name: "trade", label: "Trade", placeholder: "Select trade" },
    ],
  },
  {
    title: "Size & Dimensions",
    fields: [
      { name: "unit_of_measure", label: "Unit of Measure", placeholder: "e.g. each, roll, box" },
      { name: "package_size", label: "Package Size", placeholder: "e.g. 100-Pack" },
      { name: "size_text", label: "Size Text", placeholder: 'e.g. 2" x 4" x 8\'' },
      { name: "dimensions", label: "Dimensions", placeholder: "e.g. 4x8" },
      { name: "thickness", label: "Thickness", placeholder: 'e.g. 5/8"' },
      { name: "length_value", label: "Length", placeholder: "Numeric" },
      { name: "width_value", label: "Width", placeholder: "Numeric" },
      { name: "height_value", label: "Height", placeholder: "Numeric" },
    ],
  },
  {
    title: "Appearance",
    fields: [
      { name: "color", label: "Color", placeholder: "e.g. Charcoal, White" },
      { name: "finish", label: "Finish", placeholder: "e.g. Eggshell, Satin" },
      { name: "material", label: "Material", placeholder: "e.g. pressure treated pine" },
    ],
  },
  {
    title: "Pricing & Availability",
    fields: [
      { name: "price", label: "Price ($)", placeholder: "e.g. 14.98" },
      { name: "inventory_status", label: "Inventory Status", placeholder: "Select status" },
    ],
  },
  {
    title: "Links",
    fields: [
      { name: "product_url", label: "Product URL", placeholder: "https://...", fullWidth: true },
      { name: "image_url", label: "Image URL", placeholder: "https://...", fullWidth: true },
    ],
  },
];

const defaults: ProductFormValues = {
  retailer: "", source_product_id: "", sku: "", upc: "", brand: "", model: "",
  title: "", description: "", category: "", subcategory: "", material_type: "",
  trade: "", unit_of_measure: "", package_size: "", dimensions: "", thickness: "",
  length_value: "", width_value: "", height_value: "", size_text: "", color: "",
  finish: "", material: "", price: "", inventory_status: "", product_url: "", image_url: "",
};

export default function AdminProductForm() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults,
  });

  const onSubmit = useCallback(async (values: ProductFormValues) => {
    setSaving(true);
    try {
      const row: Record<string, any> = {
        retailer: values.retailer,
        title: values.title.trim(),
        source_type: "manual_entry",
        source_name: "admin_form",
        last_synced_at: new Date().toISOString(),
      };

      // Map optional string fields
      const strFields: (keyof ProductFormValues)[] = [
        "source_product_id", "sku", "upc", "brand", "model", "description",
        "category", "subcategory", "material_type", "trade", "unit_of_measure",
        "package_size", "dimensions", "thickness", "size_text", "color", "finish",
        "material", "inventory_status", "product_url", "image_url",
      ];
      for (const f of strFields) {
        const v = values[f]?.toString().trim();
        if (v) row[f] = v;
      }

      // Numeric fields
      if (values.price) row.price = parseFloat(values.price);
      if (values.length_value) row.length_value = parseFloat(values.length_value);
      if (values.width_value) row.width_value = parseFloat(values.width_value);
      if (values.height_value) row.height_value = parseFloat(values.height_value);

      const adapter = createManualEntryAdapter();
      const result = await adapter.ingest([row as CatalogProduct]);

      if (result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }

      toast({ title: "Product saved", description: `"${row.title}" has been added to the catalog.` });
      form.reset(defaults);
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Save failed", description: err.message || "Could not save product", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [form, toast]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PackagePlus className="h-6 w-6 text-primary" />
          Add / Edit Product
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manually add or update a single product in the contractor materials catalog.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {FIELD_GROUPS.map((group) => (
            <Card key={group.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.fields.map((field) => {
                  const colSpan = field.fullWidth ? "sm:col-span-2" : "";

                  // Special selects
                  if (field.name === "retailer") {
                    return (
                      <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name}
                        render={({ field: f }) => (
                          <FormItem className={colSpan}>
                            <FormLabel>{field.label}</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select retailer" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {RETAILERS.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }

                  if (field.name === "trade") {
                    return (
                      <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name}
                        render={({ field: f }) => (
                          <FormItem className={colSpan}>
                            <FormLabel>{field.label}</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TRADES.map((t) => (
                                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }

                  if (field.name === "inventory_status") {
                    return (
                      <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name}
                        render={({ field: f }) => (
                          <FormItem className={colSpan}>
                            <FormLabel>{field.label}</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {INVENTORY_STATUSES.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }

                  if (field.type === "textarea") {
                    return (
                      <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name}
                        render={({ field: f }) => (
                          <FormItem className={colSpan}>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              <Textarea placeholder={field.placeholder} rows={3} {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }

                  return (
                    <FormField
                      key={field.name}
                      control={form.control}
                      name={field.name}
                      render={({ field: f }) => (
                        <FormItem className={colSpan}>
                          <FormLabel>{field.label}</FormLabel>
                          <FormControl>
                            <Input placeholder={field.placeholder} {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Product
            </Button>
            <Button type="button" variant="outline" onClick={() => form.reset(defaults)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
