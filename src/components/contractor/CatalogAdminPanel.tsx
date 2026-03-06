import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Plus, ShieldCheck, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const SAMPLE_PRODUCTS = [
  { retailer: 'lowes', source_product_id: 'lowes-drywall-001', brand: 'USG', model: 'Sheetrock', title: 'USG Sheetrock 5/8 in. x 4 ft. x 8 ft. Firecode Type X Drywall', category: 'drywall', subcategory: 'drywall sheets', trade: 'drywall', price: 14.98, unit_of_measure: 'sheet', size_text: '5/8" x 4\' x 8\'', material: 'gypsum', inventory_status: 'in_stock', product_url: 'https://www.lowes.com/pd/Sheetrock-Firecode-X-5-8-in-x-4-ft-x-8-ft', source_type: 'manual' },
  { retailer: 'lowes', source_product_id: 'lowes-lumber-001', brand: 'Top Choice', model: '2x4-8-PT', title: 'Top Choice 2-in x 4-in x 8-ft #2 Prime Pressure Treated Lumber', category: 'lumber', subcategory: 'dimensional lumber', trade: 'framing', price: 5.98, unit_of_measure: 'piece', size_text: '2" x 4" x 8\'', material: 'pressure treated pine', inventory_status: 'in_stock', product_url: 'https://www.lowes.com/pd/Top-Choice-2-in-x-4-in-x-8-ft-Pressure-Treated', source_type: 'manual' },
  { retailer: 'home_depot', source_product_id: 'hd-lumber-001', brand: 'WeatherShield', model: '2x4-8-PT', title: 'WeatherShield 2 in. x 4 in. x 8 ft. #2 Ground Contact Pressure-Treated Lumber', category: 'lumber', subcategory: 'dimensional lumber', trade: 'framing', price: 6.27, unit_of_measure: 'piece', size_text: '2" x 4" x 8\'', material: 'pressure treated pine', inventory_status: 'in_stock', product_url: 'https://www.homedepot.com/p/2-in-x-4-in-x-8-ft-2-Ground-Contact-Pressure-Treated-Lumber', source_type: 'manual' },
  { retailer: 'lowes', source_product_id: 'lowes-pipe-001', brand: 'Mueller Streamline', model: 'MH04010', title: 'Mueller Streamline 1/2-in x 10-ft Type M Copper Pipe', category: 'plumbing', subcategory: 'copper pipe', trade: 'plumbing', price: 12.48, unit_of_measure: '10ft', size_text: '1/2" x 10\'', material: 'copper type M', inventory_status: 'in_stock', product_url: 'https://www.lowes.com/pd/Mueller-Streamline-1-2-in-x-10-ft-Copper-Type-M-Pipe', source_type: 'manual' },
  { retailer: 'home_depot', source_product_id: 'hd-conduit-001', brand: 'Southwire', model: '55213443', title: 'Southwire 250 ft. 12/2 Solid Romex SIMpull CU NM-B W/G Wire', category: 'electrical', subcategory: 'wire', trade: 'electrical', price: 89.97, unit_of_measure: '250ft roll', size_text: '12/2 NM-B', material: 'copper', inventory_status: 'in_stock', product_url: 'https://www.homedepot.com/p/Southwire-250-ft-12-2-Solid-Romex', source_type: 'manual' },
  { retailer: 'lowes', source_product_id: 'lowes-insulation-001', brand: 'Owens Corning', model: 'R-30', title: 'Owens Corning R-30 Kraft Faced Fiberglass Insulation Batt 15 in. x 25 ft.', category: 'insulation', subcategory: 'batt insulation', trade: 'insulation', price: 42.98, unit_of_measure: 'roll', size_text: 'R-30, 15" x 25\'', material: 'fiberglass', inventory_status: 'in_stock', product_url: 'https://www.lowes.com/pd/Owens-Corning-R-30-Kraft-Faced-Fiberglass', source_type: 'manual' },
  { retailer: 'lowes', source_product_id: 'lowes-osb-001', brand: 'LP', model: '710598', title: 'LP 7/16-in x 4-ft x 8-ft OSB Sheathing', category: 'lumber', subcategory: 'sheet goods', trade: 'framing', price: 11.98, unit_of_measure: 'sheet', size_text: '7/16" x 4\' x 8\'', material: 'OSB', inventory_status: 'in_stock', product_url: 'https://www.lowes.com/pd/LP-7-16-OSB-Sheathing', source_type: 'manual' },
  { retailer: 'home_depot', source_product_id: 'hd-plywood-001', brand: 'Handprint', model: '166063', title: 'Handprint 23/32 in. x 4 ft. x 8 ft. BC Sanded Pine Plywood', category: 'lumber', subcategory: 'sheet goods', trade: 'framing', price: 44.97, unit_of_measure: 'sheet', size_text: '23/32" x 4\' x 8\'', material: 'pine plywood', inventory_status: 'in_stock', product_url: 'https://www.homedepot.com/p/23-32-in-x-4-ft-x-8-ft-BC-Sanded-Pine-Plywood', source_type: 'manual' },
  { retailer: 'lowes', source_product_id: 'lowes-furnace-001', brand: 'Goodman', model: 'GMVM970803BN', title: 'Goodman 80,000 BTU 97% AFUE Multi-Position Gas Furnace', category: 'hvac', subcategory: 'furnaces', trade: 'hvac', price: 1899.00, unit_of_measure: 'unit', size_text: '80K BTU', material: 'steel', inventory_status: 'in_stock', product_url: 'https://www.lowes.com/pd/Goodman-80000-BTU-Gas-Furnace', source_type: 'manual', spec_attributes: { efficiency_afue: 97, btu_input: 80000, fuel_type: 'natural_gas' } },
  { retailer: 'lowes', source_product_id: 'lowes-concrete-001', brand: 'Quikrete', model: '110110', title: 'Quikrete 80-lb High Strength Concrete Mix', category: 'concrete', subcategory: 'concrete mix', trade: 'concrete', price: 6.78, unit_of_measure: '80lb bag', size_text: '80 lb', material: 'concrete', inventory_status: 'in_stock', product_url: 'https://www.lowes.com/pd/QUIKRETE-80-lb-High-Strength-Concrete-Mix', source_type: 'manual' },
  { retailer: 'home_depot', source_product_id: 'hd-shingles-001', brand: 'GAF', model: 'Timberline HDZ', title: 'GAF Timberline HDZ Charcoal Algae Resistant Laminated Architectural Shingles (33.33 sq. ft.)', category: 'roofing', subcategory: 'shingles', trade: 'roofing', price: 34.98, unit_of_measure: 'bundle', size_text: '33.33 sq ft', material: 'asphalt architectural', inventory_status: 'in_stock', product_url: 'https://www.homedepot.com/p/GAF-Timberline-HDZ-Charcoal', source_type: 'manual' },
  { retailer: 'lowes', source_product_id: 'lowes-paint-001', brand: 'Sherwin-Williams', model: 'DERA50WH', title: 'HGTV HOME by Sherwin-Williams Semi-Gloss Ultra White Interior Paint (1-Gallon)', category: 'paint', subcategory: 'interior paint', trade: 'painting', price: 38.98, unit_of_measure: 'gallon', size_text: '1 Gallon', material: 'latex acrylic', inventory_status: 'in_stock', product_url: 'https://www.lowes.com/pd/HGTV-HOME-Sherwin-Williams-Semi-Gloss-White', source_type: 'manual' },
];

export function CatalogAdminPanel() {
  const { toast } = useToast();
  const [sampleLoading, setSampleLoading] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['catalog-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retailer_catalog')
        .select('retailer, category');
      if (error) throw error;
      const total = data?.length || 0;
      const byRetailer: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      for (const row of data || []) {
        byRetailer[row.retailer] = (byRetailer[row.retailer] || 0) + 1;
        byCategory[row.category] = (byCategory[row.category] || 0) + 1;
      }
      return { total, byRetailer, byCategory };
    },
  });

  const insertSamples = async () => {
    setSampleLoading(true);
    try {
      const { error } = await supabase
        .from('retailer_catalog' as any)
        .upsert(SAMPLE_PRODUCTS as any, { onConflict: 'retailer,source_product_id' });
      if (error) throw error;
      refetchStats();
      toast({ title: "Sample catalog loaded", description: `${SAMPLE_PRODUCTS.length} products inserted across multiple trades.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Retailer Product Catalog
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Products:</span>
            <Badge variant="secondary">{stats?.total ?? '...'}</Badge>
          </div>
          {stats?.byRetailer && Object.keys(stats.byRetailer).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.byRetailer).map(([r, c]) => (
                <Badge key={r} variant="outline" className="text-xs capitalize">
                  {r === 'home_depot' ? 'Home Depot' : r === 'lowes' ? "Lowe's" : r}: {c}
                </Badge>
              ))}
            </div>
          )}
          {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.byCategory).map(([cat, c]) => (
                <Badge key={cat} variant="outline" className="text-xs capitalize">
                  {cat}: {c}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={insertSamples} disabled={sampleLoading} variant="outline" className="w-full">
            {sampleLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Load Sample Catalog
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>{SAMPLE_PRODUCTS.length} products across lumber, drywall, plumbing, electrical, HVAC, insulation, concrete, roofing, paint</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
