import { ExternalLink, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ProductResult {
  brand: string | null;
  model: string | null;
  title: string;
  price: number | null;
  inventory_status: string | null;
  product_url: string | null;
  image_url: string | null;
  efficiency_afue: number | null;
  btu_input: number | null;
  fuel_type: string | null;
  last_synced_at: string | null;
}

interface ChatProductCardProps {
  products: ProductResult[];
  filtersApplied?: Record<string, any>;
}

export function ChatProductCard({ products, filtersApplied }: ChatProductCardProps) {
  if (!products || products.length === 0) return null;

  const getStockBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary" className="text-[10px]">Unknown</Badge>;
    const s = status.toLowerCase();
    if (s.includes('in_stock') || s.includes('in stock')) return <Badge className="text-[10px] bg-green-600">In Stock</Badge>;
    if (s.includes('limited')) return <Badge className="text-[10px] bg-yellow-600">Limited</Badge>;
    if (s.includes('out')) return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
  };

  const lastSync = products[0]?.last_synced_at 
    ? new Date(products[0].last_synced_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="mt-2 space-y-2 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </span>
        </div>
        {lastSync && (
          <span className="text-[9px] text-muted-foreground">
            Synced: {lastSync}
          </span>
        )}
      </div>

      {products.map((product, idx) => (
        <div key={idx} className="bg-background/50 border border-border/50 rounded-lg p-2 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {product.brand && (
                <span className="text-[10px] font-bold text-primary uppercase">{product.brand}</span>
              )}
              <p className="text-xs font-medium leading-tight line-clamp-2">{product.title}</p>
              {product.model && (
                <p className="text-[10px] text-muted-foreground">Model: {product.model}</p>
              )}
            </div>
            {product.price != null && (
              <span className="text-sm font-bold text-primary whitespace-nowrap">
                ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {getStockBadge(product.inventory_status)}
            {product.efficiency_afue && (
              <Badge variant="outline" className="text-[10px]">{product.efficiency_afue}% AFUE</Badge>
            )}
            {product.btu_input && (
              <Badge variant="outline" className="text-[10px]">{(product.btu_input / 1000).toFixed(0)}K BTU</Badge>
            )}
            {product.fuel_type && (
              <Badge variant="outline" className="text-[10px] capitalize">{product.fuel_type.replace('_', ' ')}</Badge>
            )}
          </div>

          {product.product_url && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-6 text-[10px] mt-1"
              onClick={() => window.open(product.product_url!, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View on Lowe's
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
