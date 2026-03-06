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
  Loader2, Package, Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createCsvAdapter, createSampleDataAdapter, type CatalogProduct } from "@/lib/catalog/sourceAdapters";

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

const SAMPLE_PRODUCTS = [
  // DRYWALL
  { retailer:"lowes",source_product_id:"lowes-drywall-001",brand:"Gold Bond",model:"GB-58-4x8",title:'Gold Bond 5/8" x 4\' x 8\' Fire-Rated Drywall',category:"drywall",subcategory:"fire-rated drywall",material_type:"gypsum",trade:"drywall",size_text:'5/8" x 4\' x 8\'',price:14.28,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/gold-bond-drywall" },
  { retailer:"home_depot",source_product_id:"hd-drywall-001",brand:"USG Sheetrock",model:"USG-58-4x8",title:'USG Sheetrock 5/8" x 4\' x 8\' Firecode Drywall',category:"drywall",subcategory:"fire-rated drywall",material_type:"gypsum",trade:"drywall",size_text:'5/8" x 4\' x 8\'',price:14.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/usg-drywall" },
  { retailer:"lowes",source_product_id:"lowes-drywall-002",brand:"Gold Bond",model:"GB-12-4x8",title:'Gold Bond 1/2" x 4\' x 8\' Standard Drywall',category:"drywall",subcategory:"standard drywall",material_type:"gypsum",trade:"drywall",size_text:'1/2" x 4\' x 8\'',price:10.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/gold-bond-half" },
  // STUDS & DIMENSIONAL LUMBER
  { retailer:"lowes",source_product_id:"lowes-lumber-2x4",brand:"Top Choice",model:"TC-2x4-8",title:"Top Choice 2x4x8 Kiln-Dried Whitewood Stud",category:"lumber",subcategory:"dimensional lumber",material_type:"wood",trade:"framing",size_text:'2" x 4" x 8\'',price:3.58,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/top-choice-2x4" },
  { retailer:"home_depot",source_product_id:"hd-lumber-2x4",brand:"WeatherShield",model:"WS-2x4-8",title:"WeatherShield 2 in. x 4 in. x 8 ft. #2 SPF Stud",category:"lumber",subcategory:"dimensional lumber",material_type:"wood",trade:"framing",size_text:'2" x 4" x 8\'',price:3.82,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/2x4-stud" },
  // PRESSURE TREATED LUMBER
  { retailer:"lowes",source_product_id:"lowes-pt-2x4",brand:"Severe Weather",model:"SW-2x4-8-PT",title:"Severe Weather 2x4x8 #2 Pressure Treated Lumber",category:"lumber",subcategory:"pressure treated lumber",material_type:"pressure treated wood",trade:"framing",size_text:'2" x 4" x 8\'',price:5.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/severe-weather-pt" },
  { retailer:"home_depot",source_product_id:"hd-pt-2x4",brand:"WeatherShield",model:"WS-2x4-8-PT",title:"WeatherShield 2x4x8 #2 Pressure Treated Lumber",category:"lumber",subcategory:"pressure treated lumber",material_type:"pressure treated wood",trade:"framing",size_text:'2" x 4" x 8\'',price:6.28,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/pt-2x4" },
  { retailer:"lowes",source_product_id:"lowes-pt-2x6",brand:"Severe Weather",model:"SW-2x6-8-PT",title:"Severe Weather 2x6x8 #2 Pressure Treated Lumber",category:"lumber",subcategory:"pressure treated lumber",material_type:"pressure treated wood",trade:"framing",size_text:'2" x 6" x 8\'',price:9.78,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/severe-weather-pt-2x6" },
  // PLYWOOD
  { retailer:"lowes",source_product_id:"lowes-plywood-001",brand:"LP",model:"LP-CDX-34",title:'LP 3/4" x 4\' x 8\' CDX Plywood Sheathing',category:"lumber",subcategory:"plywood",material_type:"plywood",trade:"framing",size_text:'3/4" x 4\' x 8\'',price:42.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/lp-plywood" },
  { retailer:"home_depot",source_product_id:"hd-plywood-001",brand:"Weyerhaeuser",model:"WE-CDX-34",title:'Weyerhaeuser 23/32 in. x 4 ft. x 8 ft. CDX Pine Plywood',category:"lumber",subcategory:"plywood",material_type:"plywood",trade:"framing",size_text:'23/32" x 4\' x 8\'',price:44.58,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/cdx-plywood" },
  // OSB
  { retailer:"lowes",source_product_id:"lowes-osb-001",brand:"LP",model:"LP-OSB-716",title:'LP 7/16" x 4\' x 8\' OSB Sheathing',category:"lumber",subcategory:"OSB",material_type:"OSB",trade:"framing",size_text:'7/16" x 4\' x 8\'',price:12.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/lp-osb" },
  { retailer:"home_depot",source_product_id:"hd-osb-001",brand:"Norbord",model:"NB-OSB-716",title:'Norbord 7/16 in. x 4 ft. x 8 ft. OSB Sheathing',category:"lumber",subcategory:"OSB",material_type:"OSB",trade:"framing",size_text:'7/16" x 4\' x 8\'',price:13.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/osb-sheathing" },
  // INSULATION
  { retailer:"lowes",source_product_id:"lowes-insul-001",brand:"Owens Corning",model:"OC-R19-BF",title:"Owens Corning R-19 Kraft Faced Fiberglass Batt Insulation 6.25 in x 15 in x 93 in",category:"insulation",subcategory:"batt insulation",material_type:"fiberglass",trade:"insulation",size_text:'6.25" x 15" x 93"',price:49.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/oc-r19" },
  { retailer:"home_depot",source_product_id:"hd-insul-001",brand:"Owens Corning",model:"OC-R13-BF",title:"Owens Corning R-13 Pink EcoTouch Kraft Faced Batt 3.5 in x 15 in x 93 in",category:"insulation",subcategory:"batt insulation",material_type:"fiberglass",trade:"insulation",size_text:'3.5" x 15" x 93"',price:39.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/oc-r13" },
  // COPPER PIPE
  { retailer:"lowes",source_product_id:"lowes-copper-001",brand:"Mueller",model:"MU-34-10-M",title:'Mueller 3/4 in. x 10 ft. Type M Copper Pipe',category:"plumbing",subcategory:"copper pipe",material_type:"copper",trade:"plumbing",size_text:'3/4" x 10\'',price:32.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/mueller-copper" },
  { retailer:"home_depot",source_product_id:"hd-copper-001",brand:"Cerro",model:"CE-34-10-M",title:'Cerro 3/4 in. x 10 ft. Type M Hard Copper Pipe',category:"plumbing",subcategory:"copper pipe",material_type:"copper",trade:"plumbing",size_text:'3/4" x 10\'',price:34.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/cerro-copper" },
  { retailer:"lowes",source_product_id:"lowes-copper-002",brand:"Mueller",model:"MU-12-ELB-90",title:'Mueller 1/2 in. 90° Copper Elbow Fitting',category:"plumbing",subcategory:"copper fittings",material_type:"copper",trade:"plumbing",size_text:'1/2"',price:1.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/mueller-elbow" },
  // PVC PIPE & FITTINGS
  { retailer:"lowes",source_product_id:"lowes-pvc-001",brand:"Charlotte Pipe",model:"CP-2-10-S40",title:"Charlotte Pipe 2 in. x 10 ft. PVC Schedule 40 DWV Pipe",category:"plumbing",subcategory:"PVC pipe",material_type:"PVC",trade:"plumbing",size_text:'2" x 10\'',price:8.78,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/charlotte-pvc" },
  { retailer:"home_depot",source_product_id:"hd-pvc-001",brand:"Charlotte Pipe",model:"CP-4-TEE",title:"Charlotte Pipe 4 in. PVC DWV Sanitary Tee",category:"plumbing",subcategory:"PVC fittings",material_type:"PVC",trade:"plumbing",size_text:'4"',price:6.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/charlotte-tee" },
  // CONDUIT
  { retailer:"lowes",source_product_id:"lowes-conduit-001",brand:"Southwire",model:"SW-EMT-34-10",title:"Southwire 3/4 in. x 10 ft. EMT Conduit",category:"electrical",subcategory:"conduit",material_type:"galvanized steel",trade:"electrical",size_text:'3/4" x 10\'',price:7.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/southwire-emt" },
  { retailer:"home_depot",source_product_id:"hd-conduit-001",brand:"Allied Tube",model:"AT-EMT-12-10",title:"Allied Tube 1/2 in. x 10 ft. EMT Conduit",category:"electrical",subcategory:"conduit",material_type:"galvanized steel",trade:"electrical",size_text:'1/2" x 10\'',price:5.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/allied-emt" },
  // ELECTRICAL BOXES
  { retailer:"lowes",source_product_id:"lowes-ebox-001",brand:"Carlon",model:"CA-B118A",title:"Carlon 1-Gang 18 cu. in. New Work Electrical Box",category:"electrical",subcategory:"electrical boxes",material_type:"PVC",trade:"electrical",size_text:"1-Gang",price:0.58,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/carlon-box" },
  { retailer:"home_depot",source_product_id:"hd-ebox-001",brand:"Carlon",model:"CA-B232A",title:"Carlon 2-Gang 32 cu. in. New Work Electrical Box",category:"electrical",subcategory:"electrical boxes",material_type:"PVC",trade:"electrical",size_text:"2-Gang",price:1.18,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/carlon-2gang" },
  // BREAKERS
  { retailer:"lowes",source_product_id:"lowes-breaker-001",brand:"Square D",model:"SD-HOM120",title:"Square D Homeline 20 Amp Single-Pole Circuit Breaker",category:"electrical",subcategory:"breakers",material_type:"",trade:"electrical",size_text:"20 Amp",price:7.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/squared-breaker" },
  { retailer:"home_depot",source_product_id:"hd-breaker-001",brand:"Eaton",model:"EA-BR120",title:"Eaton BR 20 Amp Single-Pole Circuit Breaker",category:"electrical",subcategory:"breakers",material_type:"",trade:"electrical",size_text:"20 Amp",price:6.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/eaton-breaker" },
  // WIRE
  { retailer:"lowes",source_product_id:"lowes-wire-001",brand:"Southwire",model:"SW-122-250",title:"Southwire 250 ft. 12/2 Romex NM-B Wire",category:"electrical",subcategory:"wire",material_type:"copper",trade:"electrical",size_text:"12/2 NM-B 250ft",price:89.97,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/southwire-romex" },
  { retailer:"home_depot",source_product_id:"hd-wire-001",brand:"Southwire",model:"SW-142-250",title:"Southwire 250 ft. 14/2 Romex NM-B Wire",category:"electrical",subcategory:"wire",material_type:"copper",trade:"electrical",size_text:"14/2 NM-B 250ft",price:64.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/southwire-14-2" },
  // ROOFING SHINGLES
  { retailer:"lowes",source_product_id:"lowes-shingle-001",brand:"Owens Corning",model:"OC-DUR-CH",title:"Owens Corning Duration Charcoal Architectural Shingles",category:"roofing",subcategory:"shingles",material_type:"asphalt",trade:"roofing",size_text:"33.3 sq ft per bundle",price:34.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/oc-duration" },
  { retailer:"home_depot",source_product_id:"hd-shingle-001",brand:"GAF",model:"GAF-TIM-CH",title:"GAF Timberline HDZ Charcoal Architectural Shingles",category:"roofing",subcategory:"shingles",material_type:"asphalt",trade:"roofing",size_text:"33.3 sq ft per bundle",price:33.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/gaf-timberline" },
  // UNDERLAYMENT
  { retailer:"lowes",source_product_id:"lowes-underlay-001",brand:"GAF",model:"GAF-FG-SYNTH",title:"GAF FeltBuster 10 sq. Synthetic Roofing Underlayment",category:"roofing",subcategory:"underlayment",material_type:"synthetic",trade:"roofing",size_text:"4\' x 250\'",price:89.00,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/gaf-feltbuster" },
  { retailer:"home_depot",source_product_id:"hd-underlay-001",brand:"Owens Corning",model:"OC-DECK-DEF",title:"Owens Corning Deck Defense Synthetic Underlayment",category:"roofing",subcategory:"underlayment",material_type:"synthetic",trade:"roofing",size_text:"4\' x 250\'",price:94.00,inventory_status:"limited",product_url:"https://www.homedepot.com/p/oc-deck-defense" },
  // CONCRETE
  { retailer:"lowes",source_product_id:"lowes-concrete-001",brand:"Quikrete",model:"QK-5000-80",title:"Quikrete 5000 80 lb. High Early Strength Concrete Mix",category:"concrete",subcategory:"concrete mix",material_type:"concrete",trade:"concrete",size_text:"80 lb",price:6.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/quikrete-5000" },
  { retailer:"home_depot",source_product_id:"hd-concrete-001",brand:"Quikrete",model:"QK-STD-80",title:"Quikrete 80 lb. Concrete Mix",category:"concrete",subcategory:"concrete mix",material_type:"concrete",trade:"concrete",size_text:"80 lb",price:5.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/quikrete-80" },
  // REBAR
  { retailer:"lowes",source_product_id:"lowes-rebar-001",brand:"Grip-Rite",model:"GR-RB4-10",title:"Grip-Rite #4 x 10 ft. Rebar",category:"concrete",subcategory:"rebar",material_type:"steel",trade:"concrete",size_text:'#4 x 10\'',price:7.28,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/griprite-rebar" },
  // ANCHORS
  { retailer:"home_depot",source_product_id:"hd-anchor-001",brand:"Red Head",model:"RH-WA-38",title:"Red Head 3/8 in. x 3 in. Wedge Anchor (15-Pack)",category:"concrete",subcategory:"anchors",material_type:"zinc steel",trade:"concrete",size_text:'3/8" x 3"',price:18.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/redhead-anchor" },
  // FLOORING ADHESIVE
  { retailer:"lowes",source_product_id:"lowes-adhesive-001",brand:"Henry",model:"HE-356-GAL",title:"Henry 356 MultiPro Premium Multipurpose Flooring Adhesive 1 Gal",category:"flooring",subcategory:"flooring adhesive",material_type:"adhesive",trade:"flooring",size_text:"1 Gallon",price:29.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/henry-356" },
  // PRIMER
  { retailer:"lowes",source_product_id:"lowes-primer-001",brand:"Zinsser",model:"ZI-BIN-GAL",title:"Zinsser B-I-N Shellac-Based Primer 1 Gal",category:"paint",subcategory:"primer",material_type:"shellac",trade:"painting",size_text:"1 Gallon",price:44.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/zinsser-bin" },
  { retailer:"home_depot",source_product_id:"hd-primer-001",brand:"KILZ",model:"KZ-ORIG-GAL",title:"KILZ Original Interior Oil-Based Primer 1 Gal",category:"paint",subcategory:"primer",material_type:"oil-based",trade:"painting",size_text:"1 Gallon",price:22.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/kilz-original" },
  // PAINT
  { retailer:"lowes",source_product_id:"lowes-paint-001",brand:"Valspar",model:"VA-SIG-EGG-GAL",title:"Valspar Signature Ultra White Eggshell Interior Paint 1 Gal",category:"paint",subcategory:"interior paint",material_type:"latex",trade:"painting",size_text:"1 Gallon",color:"Ultra White",price:39.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/valspar-sig" },
  { retailer:"home_depot",source_product_id:"hd-paint-001",brand:"Behr",model:"BE-PREM-EGG-GAL",title:"Behr Premium Plus Ultra White Eggshell Interior Paint 1 Gal",category:"paint",subcategory:"interior paint",material_type:"latex",trade:"painting",size_text:"1 Gallon",color:"Ultra White",price:34.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/behr-premium" },
  // FASTENERS / SCREWS
  { retailer:"lowes",source_product_id:"lowes-screw-001",brand:"GRK",model:"GRK-R4-3-100",title:'GRK R4 #9 x 3 in. Multi-Purpose Screw (100-Pack)',category:"fasteners",subcategory:"screws",material_type:"steel",trade:"framing",size_text:'#9 x 3" (100-Pack)',price:24.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/grk-r4" },
  { retailer:"home_depot",source_product_id:"hd-screw-001",brand:"GRK",model:"GRK-RSS-3-50",title:'GRK RSS 5/16 x 3-1/8 in. Structural Screw (50-Pack)',category:"fasteners",subcategory:"screws",material_type:"steel",trade:"framing",size_text:'5/16 x 3-1/8" (50-Pack)',price:29.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/grk-rss" },
  // NAILS
  { retailer:"lowes",source_product_id:"lowes-nail-001",brand:"Grip-Rite",model:"GR-16D-5LB",title:"Grip-Rite 16d 3-1/2 in. Bright Sinker Nails 5 lb. Box",category:"fasteners",subcategory:"nails",material_type:"steel",trade:"framing",size_text:"16d 3-1/2\" (5 lb)",price:12.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/griprite-16d" },
  { retailer:"home_depot",source_product_id:"hd-nail-001",brand:"Grip-Rite",model:"GR-8D-1LB",title:"Grip-Rite 8d 2-1/2 in. Bright Common Nails 1 lb. Box",category:"fasteners",subcategory:"nails",material_type:"steel",trade:"framing",size_text:'8d 2-1/2" (1 lb)',price:4.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/griprite-8d" },
  // HVAC FILTERS
  { retailer:"lowes",source_product_id:"lowes-filter-001",brand:"Filtrete",model:"FT-1900-20x25",title:"Filtrete 20x25x1 MPR 1900 Premium Allergen Healthy Living Filter",category:"hvac",subcategory:"HVAC filters",material_type:"synthetic fiber",trade:"hvac",size_text:"20\" x 25\" x 1\"",price:24.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/filtrete-1900" },
  { retailer:"home_depot",source_product_id:"hd-filter-001",brand:"Honeywell",model:"HW-FPR10-20x25",title:"Honeywell 20x25x1 FPR 10 Elite Allergen Pleated Air Filter",category:"hvac",subcategory:"HVAC filters",material_type:"synthetic fiber",trade:"hvac",size_text:"20\" x 25\" x 1\"",price:18.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/honeywell-elite" },
  // DUCT FITTINGS
  { retailer:"lowes",source_product_id:"lowes-duct-001",brand:"Master Flow",model:"MF-6X4-RED",title:"Master Flow 6 in. x 4 in. Galvanized Steel Round Reducer",category:"hvac",subcategory:"duct fittings",material_type:"galvanized steel",trade:"hvac",size_text:'6" to 4" reducer',price:5.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/masterflow-reducer" },
  { retailer:"home_depot",source_product_id:"hd-duct-001",brand:"Master Flow",model:"MF-6-90-ELB",title:"Master Flow 6 in. 90° Galvanized Steel Round Elbow",category:"hvac",subcategory:"duct fittings",material_type:"galvanized steel",trade:"hvac",size_text:'6" 90° elbow',price:7.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/masterflow-elbow" },
];

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
      const now = new Date().toISOString();
      const rows = SAMPLE_PRODUCTS.map((p) => ({
        ...p,
        source_type: "sample_data",
        source_name: "admin_sample_insert",
        last_synced_at: now,
      }));

      const BATCH = 20;
      let inserted = 0;
      let errors = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { error } = await supabase
          .from("retailer_catalog")
          .upsert(batch as any, { onConflict: "retailer,source_product_id" });
        if (error) {
          console.error("Sample insert error:", error);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }
      }

      toast({
        title: "Sample data inserted",
        description: `${inserted} products added across Lowe's and Home Depot. ${errors > 0 ? `${errors} errors.` : "Ready to test in AI chat!"}`,
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
    const mappedRows: Record<string, any>[] = [];
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const obj: Record<string, any> = {
        source_type: "csv_import",
        source_name: file?.name || "unknown.csv",
        last_synced_at: new Date().toISOString(),
      };

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
      mappedRows.push(obj);
    }

    // Batch upsert in chunks of 100
    const BATCH = 100;
    for (let i = 0; i < mappedRows.length; i += BATCH) {
      const batch = mappedRows.slice(i, i + BATCH);
      try {
        if (upsertMode) {
          // Need source_product_id for upsert
          const withId = batch.filter((r) => r.source_product_id);
          const withoutId = batch.filter((r) => !r.source_product_id);

          if (withId.length > 0) {
            const { error } = await supabase
              .from("retailer_catalog" as any)
              .upsert(withId as any, { onConflict: "retailer,source_product_id" });
            if (error) throw error;
            result.updated += withId.length;
          }
          if (withoutId.length > 0) {
            const { error } = await supabase
              .from("retailer_catalog" as any)
              .insert(withoutId as any);
            if (error) throw error;
            result.inserted += withoutId.length;
          }
        } else {
          const { error } = await supabase
            .from("retailer_catalog" as any)
            .insert(batch as any);
          if (error) throw error;
          result.inserted += batch.length;
        }
      } catch (err: any) {
        const startRow = i + 2;
        const endRow = Math.min(i + BATCH, mappedRows.length) + 1;
        result.errors.push({ row: startRow, message: `Batch ${startRow}-${endRow}: ${err.message}` });
        result.skipped += batch.length;
      }
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
        <CardContent>
          <Button onClick={handleInsertSamples} disabled={insertingSamples}>
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
