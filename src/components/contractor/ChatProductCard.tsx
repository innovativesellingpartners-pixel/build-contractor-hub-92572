import { useState } from "react";
import { ExternalLink, Package, Store, Clock, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddProductToRecordDialog } from "./AddProductToRecordDialog";

export interface ProductResult {
  retailer?: string;
  brand: string | null;
  model: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  trade?: string | null;
  price: number | null;
  unit_of_measure?: string | null;
  size_text?: string | null;
  material?: string | null;
  inventory_status: string | null;
  product_url: string | null;
  image_url: string | null;
  last_synced_at: string | null;
  spec_attributes?: Record<string, any> | null;
}

interface ChatProductCardProps {
  products: ProductResult[];
  filtersApplied?: Record<string, any>;
}

const RETAILER_LABELS: Record<string, string> = {
  lowes: "Lowe's",
  home_depot: "Home Depot",
  homedepot: "Home Depot",
};

function getRetailerLabel(retailer?: string) {
  if (!retailer) return "Retailer";
  return RETAILER_LABELS[retailer.toLowerCase()] || retailer;
}

function StockBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="secondary" className="text-[10px]">Unknown</Badge>;
  const s = status.toLowerCase();
  if (s.includes("in_stock") || s.includes("in stock"))
    return <Badge className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-primary-foreground">In Stock</Badge>;
  if (s.includes("limited"))
    return <Badge className="text-[10px] bg-amber-600 hover:bg-amber-700 text-primary-foreground">Limited</Badge>;
  if (s.includes("out"))
    return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
  return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
}

function formatSyncTime(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SingleProductCard({ product }: { product: ProductResult }) {
  const [qty, setQty] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-lg p-2.5 space-y-1.5 shadow-sm">
      {/* Row 1: Brand + Retailer + Price */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {product.retailer && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-primary/30 text-primary"
              >
                <Store className="h-2.5 w-2.5 mr-0.5" />
                {getRetailerLabel(product.retailer)}
              </Badge>
            )}
            {product.brand && (
              <span className="text-[10px] font-bold text-foreground uppercase tracking-wide">
                {product.brand}
              </span>
            )}
          </div>
          <p className="text-xs font-medium leading-tight text-foreground line-clamp-2">
            {product.title}
          </p>
        </div>
        {product.price != null && (
          <div className="text-right shrink-0">
            <span className="text-sm font-bold text-primary whitespace-nowrap">
              ${product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            {product.unit_of_measure && (
              <p className="text-[9px] text-muted-foreground">/{product.unit_of_measure}</p>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Detail chips */}
      <div className="flex flex-wrap items-center gap-1">
        <StockBadge status={product.inventory_status} />
        {product.category && (
          <Badge variant="outline" className="text-[10px] capitalize">
            {product.category}
          </Badge>
        )}
        {product.subcategory && product.subcategory !== product.category && (
          <Badge variant="outline" className="text-[10px] capitalize">
            {product.subcategory}
          </Badge>
        )}
        {product.size_text && (
          <Badge variant="secondary" className="text-[10px]">
            {product.size_text}
          </Badge>
        )}
        {product.material && (
          <Badge variant="secondary" className="text-[10px] capitalize">
            {product.material}
          </Badge>
        )}
      </div>

      {/* Row 3: Sync time */}
      {product.last_synced_at && (
        <p className="text-[9px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-2 w-2" />
          Last synced {formatSyncTime(product.last_synced_at)}
        </p>
      )}

      {/* Row 4: Quantity + Add to Job/Estimate */}
      <div className="flex items-center gap-1.5 mt-1">
        <div className="flex items-center border border-border rounded-md h-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-6 w-8 text-center text-[10px] border-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0"
            onClick={() => setQty((q) => q + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Button
          variant="default"
          size="sm"
          className="flex-1 h-6 text-[10px]"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add to Job / Estimate
        </Button>
      </div>

      {/* Row 5: Retailer link */}
      {product.product_url && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-6 text-[10px] mt-0.5"
          onClick={() => window.open(product.product_url!, "_blank")}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View on {getRetailerLabel(product.retailer)}
        </Button>
      )}

      <AddProductToRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={product}
        quantity={qty}
      />
    </div>
  );
}

export function ChatProductCard({ products }: ChatProductCardProps) {
  if (!products || products.length === 0) return null;

  const latestSync = products
    .map((p) => p.last_synced_at)
    .filter(Boolean)
    .sort()
    .pop();

  return (
    <div className="mt-2 space-y-2 w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""} found
          </span>
        </div>
        {latestSync && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span className="text-[9px]">Catalog synced {formatSyncTime(latestSync)}</span>
          </div>
        )}
      </div>

      {/* Product cards */}
      {products.map((product, idx) => (
        <SingleProductCard key={idx} product={product} />
      ))}
    </div>
  );
}
