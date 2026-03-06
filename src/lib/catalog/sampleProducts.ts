/**
 * Expanded sample product dataset for testing the AI chat and catalog search.
 * 100+ realistic products across Lowe's and Home Depot covering all major construction trades.
 *
 * This data is ingested via SampleDataAdapter and can be replaced entirely
 * once live API or feed connectors are ready.
 */

import type { CatalogProduct } from "./sourceAdapters";

export const SAMPLE_PRODUCTS: CatalogProduct[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DRYWALL
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-drywall-001",brand:"Gold Bond",model:"GB-58-4x8",title:'Gold Bond 5/8" x 4\' x 8\' Fire-Rated Drywall',category:"drywall",subcategory:"fire-rated drywall",material_type:"gypsum",trade:"drywall",size_text:'5/8" x 4\' x 8\'',thickness:'5/8"',price:14.28,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/gold-bond-drywall" },
  { retailer:"home_depot",source_product_id:"hd-drywall-001",brand:"USG Sheetrock",model:"USG-58-4x8",title:'USG Sheetrock 5/8" x 4\' x 8\' Firecode Drywall',category:"drywall",subcategory:"fire-rated drywall",material_type:"gypsum",trade:"drywall",size_text:'5/8" x 4\' x 8\'',thickness:'5/8"',price:14.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/usg-drywall" },
  { retailer:"lowes",source_product_id:"lowes-drywall-002",brand:"Gold Bond",model:"GB-12-4x8",title:'Gold Bond 1/2" x 4\' x 8\' Standard Drywall',category:"drywall",subcategory:"standard drywall",material_type:"gypsum",trade:"drywall",size_text:'1/2" x 4\' x 8\'',thickness:'1/2"',price:10.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/gold-bond-half" },
  { retailer:"home_depot",source_product_id:"hd-drywall-002",brand:"USG Sheetrock",model:"USG-12-4x12",title:'USG Sheetrock 1/2" x 4\' x 12\' Drywall',category:"drywall",subcategory:"standard drywall",material_type:"gypsum",trade:"drywall",size_text:'1/2" x 4\' x 12\'',thickness:'1/2"',price:15.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/usg-12ft" },
  { retailer:"lowes",source_product_id:"lowes-drywall-003",brand:"Gold Bond",model:"GB-MR-12-4x8",title:'Gold Bond 1/2" x 4\' x 8\' Moisture-Resistant Drywall',category:"drywall",subcategory:"moisture resistant drywall",material_type:"gypsum",trade:"drywall",size_text:'1/2" x 4\' x 8\'',thickness:'1/2"',price:16.28,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/gold-bond-mr" },

  // ═══════════════════════════════════════════════════════════════════════════
  // FRAMING LUMBER
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-lumber-2x4",brand:"Top Choice",model:"TC-2x4-8",title:"Top Choice 2x4x8 Kiln-Dried Whitewood Stud",category:"lumber",subcategory:"dimensional lumber",material_type:"wood",trade:"framing",size_text:'2" x 4" x 8\'',price:3.58,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/top-choice-2x4" },
  { retailer:"home_depot",source_product_id:"hd-lumber-2x4",brand:"WeatherShield",model:"WS-2x4-8",title:"WeatherShield 2 in. x 4 in. x 8 ft. #2 SPF Stud",category:"lumber",subcategory:"dimensional lumber",material_type:"wood",trade:"framing",size_text:'2" x 4" x 8\'',price:3.82,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/2x4-stud" },
  { retailer:"lowes",source_product_id:"lowes-lumber-2x6",brand:"Top Choice",model:"TC-2x6-8",title:"Top Choice 2x6x8 Kiln-Dried Whitewood",category:"lumber",subcategory:"dimensional lumber",material_type:"wood",trade:"framing",size_text:'2" x 6" x 8\'',price:6.28,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/top-choice-2x6" },
  { retailer:"home_depot",source_product_id:"hd-lumber-2x6",brand:"WeatherShield",model:"WS-2x6-8",title:"WeatherShield 2x6x8 #2 Prime SPF Lumber",category:"lumber",subcategory:"dimensional lumber",material_type:"wood",trade:"framing",size_text:'2" x 6" x 8\'',price:6.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/2x6-lumber" },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRESSURE TREATED LUMBER
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-pt-2x4",brand:"Severe Weather",model:"SW-2x4-8-PT",title:"Severe Weather 2x4x8 #2 Pressure Treated Lumber",category:"lumber",subcategory:"pressure treated lumber",material_type:"pressure treated wood",trade:"framing",size_text:'2" x 4" x 8\'',material:"pressure treated pine",price:5.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/severe-weather-pt" },
  { retailer:"home_depot",source_product_id:"hd-pt-2x4",brand:"WeatherShield",model:"WS-2x4-8-PT",title:"WeatherShield 2x4x8 #2 Pressure Treated Lumber",category:"lumber",subcategory:"pressure treated lumber",material_type:"pressure treated wood",trade:"framing",size_text:'2" x 4" x 8\'',material:"pressure treated pine",price:6.28,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/pt-2x4" },
  { retailer:"lowes",source_product_id:"lowes-pt-2x6",brand:"Severe Weather",model:"SW-2x6-8-PT",title:"Severe Weather 2x6x8 #2 Pressure Treated Lumber",category:"lumber",subcategory:"pressure treated lumber",material_type:"pressure treated wood",trade:"framing",size_text:'2" x 6" x 8\'',material:"pressure treated pine",price:9.78,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/severe-weather-pt-2x6" },
  { retailer:"home_depot",source_product_id:"hd-pt-4x4",brand:"WeatherShield",model:"WS-4x4-8-PT",title:"WeatherShield 4x4x8 #2 Pressure Treated Timber",category:"lumber",subcategory:"pressure treated lumber",material_type:"pressure treated wood",trade:"framing",size_text:'4" x 4" x 8\'',material:"pressure treated pine",price:12.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/pt-4x4" },

  // ═══════════════════════════════════════════════════════════════════════════
  // PLYWOOD
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-plywood-001",brand:"LP",model:"LP-CDX-34",title:'LP 3/4" x 4\' x 8\' CDX Plywood Sheathing',category:"lumber",subcategory:"plywood",material_type:"plywood",trade:"framing",size_text:'3/4" x 4\' x 8\'',thickness:'3/4"',price:42.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/lp-plywood" },
  { retailer:"home_depot",source_product_id:"hd-plywood-001",brand:"Weyerhaeuser",model:"WE-CDX-34",title:'Weyerhaeuser 23/32 in. x 4 ft. x 8 ft. CDX Pine Plywood',category:"lumber",subcategory:"plywood",material_type:"plywood",trade:"framing",size_text:'23/32" x 4\' x 8\'',thickness:'23/32"',price:44.58,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/cdx-plywood" },
  { retailer:"lowes",source_product_id:"lowes-plywood-002",brand:"LP",model:"LP-CDX-12",title:'LP 1/2" x 4\' x 8\' CDX Plywood',category:"lumber",subcategory:"plywood",material_type:"plywood",trade:"framing",size_text:'1/2" x 4\' x 8\'',thickness:'1/2"',price:32.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/lp-plywood-half" },

  // ═══════════════════════════════════════════════════════════════════════════
  // OSB
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-osb-001",brand:"LP",model:"LP-OSB-716",title:'LP 7/16" x 4\' x 8\' OSB Sheathing',category:"lumber",subcategory:"OSB",material_type:"OSB",trade:"framing",size_text:'7/16" x 4\' x 8\'',thickness:'7/16"',price:12.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/lp-osb" },
  { retailer:"home_depot",source_product_id:"hd-osb-001",brand:"Norbord",model:"NB-OSB-716",title:'Norbord 7/16 in. x 4 ft. x 8 ft. OSB Sheathing',category:"lumber",subcategory:"OSB",material_type:"OSB",trade:"framing",size_text:'7/16" x 4\' x 8\'',thickness:'7/16"',price:13.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/osb-sheathing" },
  { retailer:"lowes",source_product_id:"lowes-osb-002",brand:"LP",model:"LP-OSB-34",title:'LP 3/4" x 4\' x 8\' Tongue & Groove OSB Subfloor',category:"lumber",subcategory:"OSB",material_type:"OSB",trade:"framing",size_text:'3/4" x 4\' x 8\'',thickness:'3/4"',price:28.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/lp-osb-subfloor" },

  // ═══════════════════════════════════════════════════════════════════════════
  // INSULATION
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-insul-001",brand:"Owens Corning",model:"OC-R19-BF",title:"Owens Corning R-19 Kraft Faced Fiberglass Batt Insulation 6.25 in x 15 in x 93 in",category:"insulation",subcategory:"batt insulation",material_type:"fiberglass",trade:"insulation",size_text:'6.25" x 15" x 93"',price:49.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/oc-r19" },
  { retailer:"home_depot",source_product_id:"hd-insul-001",brand:"Owens Corning",model:"OC-R13-BF",title:"Owens Corning R-13 Pink EcoTouch Kraft Faced Batt 3.5 in x 15 in x 93 in",category:"insulation",subcategory:"batt insulation",material_type:"fiberglass",trade:"insulation",size_text:'3.5" x 15" x 93"',price:39.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/oc-r13" },
  { retailer:"lowes",source_product_id:"lowes-insul-002",brand:"Owens Corning",model:"OC-R38-BF",title:"Owens Corning R-38 Kraft Faced Fiberglass Batt Insulation 12 in x 16 in x 48 in",category:"insulation",subcategory:"batt insulation",material_type:"fiberglass",trade:"insulation",size_text:'12" x 16" x 48"',price:58.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/oc-r38" },
  { retailer:"home_depot",source_product_id:"hd-insul-002",brand:"Owens Corning",model:"OC-R30-UF",title:"Owens Corning R-30 Unfaced Fiberglass Batt Insulation 10 in x 15 in x 25 ft",category:"insulation",subcategory:"batt insulation",material_type:"fiberglass",trade:"insulation",size_text:'10" x 15" x 25\'',price:64.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/oc-r30" },
  { retailer:"home_depot",source_product_id:"hd-insul-003",brand:"Owens Corning",model:"OC-ATTICAT",title:"Owens Corning AttiCat Expanding Blown-In Insulation 30 lb Bag",category:"insulation",subcategory:"blown-in insulation",material_type:"fiberglass",trade:"insulation",size_text:"30 lb bag",price:35.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/oc-atticat" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ROOFING SHINGLES
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-shingle-001",brand:"Owens Corning",model:"OC-DUR-CH",title:"Owens Corning Duration Charcoal Architectural Shingles",category:"roofing",subcategory:"shingles",material_type:"asphalt",trade:"roofing",size_text:"33.3 sq ft per bundle",color:"Charcoal",price:34.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/oc-duration" },
  { retailer:"home_depot",source_product_id:"hd-shingle-001",brand:"GAF",model:"GAF-TIM-CH",title:"GAF Timberline HDZ Charcoal Architectural Shingles",category:"roofing",subcategory:"shingles",material_type:"asphalt",trade:"roofing",size_text:"33.3 sq ft per bundle",color:"Charcoal",price:33.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/gaf-timberline" },
  { retailer:"lowes",source_product_id:"lowes-shingle-002",brand:"Owens Corning",model:"OC-DUR-DW",title:"Owens Corning Duration Driftwood Architectural Shingles",category:"roofing",subcategory:"shingles",material_type:"asphalt",trade:"roofing",size_text:"33.3 sq ft per bundle",color:"Driftwood",price:34.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/oc-duration-dw" },
  { retailer:"home_depot",source_product_id:"hd-shingle-002",brand:"GAF",model:"GAF-TIM-WG",title:"GAF Timberline HDZ Weathered Wood Architectural Shingles",category:"roofing",subcategory:"shingles",material_type:"asphalt",trade:"roofing",size_text:"33.3 sq ft per bundle",color:"Weathered Wood",price:33.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/gaf-weathered" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ROOFING UNDERLAYMENT
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-underlay-001",brand:"GAF",model:"GAF-FG-SYNTH",title:"GAF FeltBuster 10 sq. Synthetic Roofing Underlayment",category:"roofing",subcategory:"underlayment",material_type:"synthetic",trade:"roofing",size_text:"4' x 250'",price:89.00,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/gaf-feltbuster" },
  { retailer:"home_depot",source_product_id:"hd-underlay-001",brand:"Owens Corning",model:"OC-DECK-DEF",title:"Owens Corning Deck Defense Synthetic Underlayment",category:"roofing",subcategory:"underlayment",material_type:"synthetic",trade:"roofing",size_text:"4' x 250'",price:94.00,inventory_status:"limited",product_url:"https://www.homedepot.com/p/oc-deck-defense" },
  { retailer:"lowes",source_product_id:"lowes-underlay-002",brand:"GAF",model:"GAF-IS-SS",title:"GAF WeatherWatch Ice & Water Shield Self-Adhered Underlayment",category:"roofing",subcategory:"underlayment",material_type:"self-adhered membrane",trade:"roofing",size_text:"3' x 67'",price:129.00,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/gaf-weatherwatch" },

  // ═══════════════════════════════════════════════════════════════════════════
  // SIDING
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-siding-001",brand:"James Hardie",model:"JH-PLANK-8",title:'James Hardie HardiePlank 8.25" x 144" Cedarmill Fiber Cement Lap Siding',category:"siding",subcategory:"fiber cement siding",material_type:"fiber cement",trade:"siding",size_text:'8.25" x 12\'',color:"Primed",price:11.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/hardie-plank" },
  { retailer:"home_depot",source_product_id:"hd-siding-001",brand:"LP SmartSide",model:"LP-SS-8-16",title:'LP SmartSide 8" x 16 ft. Primed Engineered Wood Lap Siding',category:"siding",subcategory:"engineered wood siding",material_type:"engineered wood",trade:"siding",size_text:'8" x 16\'',color:"Primed",price:14.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/lp-smartside" },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOUSE WRAP
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-hwrap-001",brand:"Tyvek",model:"TV-HW-9x150",title:"Tyvek HomeWrap 9 ft. x 150 ft. House Wrap",category:"building materials",subcategory:"house wrap",material_type:"polyethylene",trade:"framing",size_text:"9' x 150'",price:179.00,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/tyvek-homewrap" },
  { retailer:"home_depot",source_product_id:"hd-hwrap-001",brand:"Tyvek",model:"TV-HW-3x165",title:"Tyvek HomeWrap 3 ft. x 165 ft. House Wrap",category:"building materials",subcategory:"house wrap",material_type:"polyethylene",trade:"framing",size_text:"3' x 165'",price:79.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/tyvek-3x165" },

  // ═══════════════════════════════════════════════════════════════════════════
  // COPPER PIPE & FITTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-copper-001",brand:"Mueller",model:"MU-34-10-M",title:'Mueller 3/4 in. x 10 ft. Type M Copper Pipe',category:"plumbing",subcategory:"copper pipe",material_type:"copper",trade:"plumbing",size_text:'3/4" x 10\'',material:"copper",price:32.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/mueller-copper" },
  { retailer:"home_depot",source_product_id:"hd-copper-001",brand:"Cerro",model:"CE-34-10-M",title:'Cerro 3/4 in. x 10 ft. Type M Hard Copper Pipe',category:"plumbing",subcategory:"copper pipe",material_type:"copper",trade:"plumbing",size_text:'3/4" x 10\'',material:"copper",price:34.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/cerro-copper" },
  { retailer:"lowes",source_product_id:"lowes-copper-002",brand:"Mueller",model:"MU-12-ELB-90",title:'Mueller 1/2 in. 90° Copper Elbow Fitting',category:"plumbing",subcategory:"copper fittings",material_type:"copper",trade:"plumbing",size_text:'1/2"',material:"copper",price:1.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/mueller-elbow" },
  { retailer:"home_depot",source_product_id:"hd-copper-002",brand:"Everbilt",model:"EB-34-TEE",title:'Everbilt 3/4 in. Copper Tee Fitting',category:"plumbing",subcategory:"copper fittings",material_type:"copper",trade:"plumbing",size_text:'3/4"',material:"copper",price:3.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/everbilt-tee" },
  { retailer:"lowes",source_product_id:"lowes-copper-003",brand:"Mueller",model:"MU-12-CPL",title:'Mueller 1/2 in. Copper Coupling with Stop',category:"plumbing",subcategory:"copper fittings",material_type:"copper",trade:"plumbing",size_text:'1/2"',material:"copper",price:1.28,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/mueller-coupling" },

  // ═══════════════════════════════════════════════════════════════════════════
  // PVC PIPE & FITTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-pvc-001",brand:"Charlotte Pipe",model:"CP-2-10-S40",title:"Charlotte Pipe 2 in. x 10 ft. PVC Schedule 40 DWV Pipe",category:"plumbing",subcategory:"PVC pipe",material_type:"PVC",trade:"plumbing",size_text:'2" x 10\'',price:8.78,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/charlotte-pvc" },
  { retailer:"home_depot",source_product_id:"hd-pvc-001",brand:"Charlotte Pipe",model:"CP-4-TEE",title:"Charlotte Pipe 4 in. PVC DWV Sanitary Tee",category:"plumbing",subcategory:"PVC fittings",material_type:"PVC",trade:"plumbing",size_text:'4"',price:6.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/charlotte-tee" },
  { retailer:"lowes",source_product_id:"lowes-pvc-002",brand:"Charlotte Pipe",model:"CP-3-10-S40",title:"Charlotte Pipe 3 in. x 10 ft. PVC Schedule 40 DWV Pipe",category:"plumbing",subcategory:"PVC pipe",material_type:"PVC",trade:"plumbing",size_text:'3" x 10\'',price:13.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/charlotte-pvc-3" },
  { retailer:"home_depot",source_product_id:"hd-pvc-002",brand:"Charlotte Pipe",model:"CP-2-90ELB",title:"Charlotte Pipe 2 in. PVC DWV 90° Elbow",category:"plumbing",subcategory:"PVC fittings",material_type:"PVC",trade:"plumbing",size_text:'2"',price:2.28,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/charlotte-elbow" },

  // ═══════════════════════════════════════════════════════════════════════════
  // PEX PIPE & FITTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-pex-001",brand:"SharkBite",model:"SB-PEX-34-100-R",title:'SharkBite 3/4 in. x 100 ft. Red PEX-B Pipe',category:"plumbing",subcategory:"PEX pipe",material_type:"PEX-B",trade:"plumbing",size_text:'3/4" x 100\'',color:"Red",price:54.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/sharkbite-pex-red" },
  { retailer:"home_depot",source_product_id:"hd-pex-001",brand:"SharkBite",model:"SB-PEX-12-100-B",title:'SharkBite 1/2 in. x 100 ft. Blue PEX-B Pipe',category:"plumbing",subcategory:"PEX pipe",material_type:"PEX-B",trade:"plumbing",size_text:'1/2" x 100\'',color:"Blue",price:34.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/sharkbite-pex-blue" },
  { retailer:"lowes",source_product_id:"lowes-pex-002",brand:"SharkBite",model:"SB-PEX-TEE-34",title:'SharkBite 3/4 in. Push-to-Connect Brass Tee',category:"plumbing",subcategory:"PEX fittings",material_type:"brass",trade:"plumbing",size_text:'3/4"',material:"brass",price:12.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/sharkbite-tee" },
  { retailer:"home_depot",source_product_id:"hd-pex-002",brand:"SharkBite",model:"SB-PEX-ELB-12",title:'SharkBite 1/2 in. Push-to-Connect Brass 90° Elbow',category:"plumbing",subcategory:"PEX fittings",material_type:"brass",trade:"plumbing",size_text:'1/2"',material:"brass",price:8.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/sharkbite-elbow" },
  { retailer:"lowes",source_product_id:"lowes-pex-003",brand:"SharkBite",model:"SB-PEX-CPL-12",title:'SharkBite 1/2 in. Push-to-Connect Brass Coupling',category:"plumbing",subcategory:"PEX fittings",material_type:"brass",trade:"plumbing",size_text:'1/2"',material:"brass",price:6.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/sharkbite-coupling" },

  // ═══════════════════════════════════════════════════════════════════════════
  // WATER HEATERS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-wh-001",brand:"A.O. Smith",model:"AOS-40G-NG",title:"A.O. Smith 40 Gal. Tall Natural Gas Water Heater",category:"plumbing",subcategory:"water heaters",material_type:"steel tank",trade:"plumbing",size_text:"40 Gallon",price:549.00,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/ao-smith-40g" },
  { retailer:"home_depot",source_product_id:"hd-wh-001",brand:"Rheem",model:"RH-50G-ELEC",title:"Rheem Performance 50 Gal. Tall Electric Water Heater",category:"plumbing",subcategory:"water heaters",material_type:"steel tank",trade:"plumbing",size_text:"50 Gallon",price:579.00,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/rheem-50g" },

  // ═══════════════════════════════════════════════════════════════════════════
  // HVAC FILTERS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-filter-001",brand:"Filtrete",model:"FT-1900-20x25",title:"Filtrete 20x25x1 MPR 1900 Premium Allergen Healthy Living Filter",category:"hvac",subcategory:"HVAC filters",material_type:"synthetic fiber",trade:"hvac",size_text:'20" x 25" x 1"',price:24.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/filtrete-1900" },
  { retailer:"home_depot",source_product_id:"hd-filter-001",brand:"Honeywell",model:"HW-FPR10-20x25",title:"Honeywell 20x25x1 FPR 10 Elite Allergen Pleated Air Filter",category:"hvac",subcategory:"HVAC filters",material_type:"synthetic fiber",trade:"hvac",size_text:'20" x 25" x 1"',price:18.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/honeywell-elite" },
  { retailer:"lowes",source_product_id:"lowes-filter-002",brand:"Filtrete",model:"FT-1000-16x25",title:"Filtrete 16x25x1 MPR 1000 Micro Allergen Defense Filter",category:"hvac",subcategory:"HVAC filters",material_type:"synthetic fiber",trade:"hvac",size_text:'16" x 25" x 1"',price:14.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/filtrete-1000" },

  // ═══════════════════════════════════════════════════════════════════════════
  // FLEX DUCT
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-flexduct-001",brand:"Master Flow",model:"MF-FLEX-6-25",title:"Master Flow 6 in. x 25 ft. Insulated Flexible Duct",category:"hvac",subcategory:"flex duct",material_type:"aluminum/fiberglass",trade:"hvac",size_text:'6" x 25\'',price:24.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/masterflow-flex" },
  { retailer:"home_depot",source_product_id:"hd-flexduct-001",brand:"Master Flow",model:"MF-FLEX-8-25",title:"Master Flow 8 in. x 25 ft. Insulated Flexible Duct",category:"hvac",subcategory:"flex duct",material_type:"aluminum/fiberglass",trade:"hvac",size_text:'8" x 25\'',price:34.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/masterflow-flex-8" },

  // ═══════════════════════════════════════════════════════════════════════════
  // RIGID DUCT FITTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-duct-001",brand:"Master Flow",model:"MF-6X4-RED",title:"Master Flow 6 in. x 4 in. Galvanized Steel Round Reducer",category:"hvac",subcategory:"duct fittings",material_type:"galvanized steel",trade:"hvac",size_text:'6" to 4" reducer',price:5.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/masterflow-reducer" },
  { retailer:"home_depot",source_product_id:"hd-duct-001",brand:"Master Flow",model:"MF-6-90-ELB",title:"Master Flow 6 in. 90° Galvanized Steel Round Elbow",category:"hvac",subcategory:"duct fittings",material_type:"galvanized steel",trade:"hvac",size_text:'6" 90° elbow',price:7.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/masterflow-elbow" },
  { retailer:"lowes",source_product_id:"lowes-duct-002",brand:"Master Flow",model:"MF-6-TEE",title:"Master Flow 6 in. Galvanized Steel Tee",category:"hvac",subcategory:"duct fittings",material_type:"galvanized steel",trade:"hvac",size_text:'6" tee',price:9.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/masterflow-tee" },

  // ═══════════════════════════════════════════════════════════════════════════
  // THERMOSTATS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-therm-001",brand:"Honeywell",model:"HW-T6-PRO",title:"Honeywell Home T6 Pro Programmable Thermostat",category:"hvac",subcategory:"thermostats",material_type:"electronic",trade:"hvac",price:69.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/honeywell-t6" },
  { retailer:"home_depot",source_product_id:"hd-therm-001",brand:"Google Nest",model:"NEST-LEARN-3",title:"Google Nest Learning Thermostat 3rd Gen",category:"hvac",subcategory:"thermostats",material_type:"electronic",trade:"hvac",price:249.00,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/nest-learning" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ELECTRICAL WIRE / NM-B / MC CABLE
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-wire-001",brand:"Southwire",model:"SW-122-250",title:"Southwire 250 ft. 12/2 Romex NM-B Wire",category:"electrical",subcategory:"NM-B wire",material_type:"copper",trade:"electrical",size_text:"12/2 NM-B 250ft",price:89.97,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/southwire-romex" },
  { retailer:"home_depot",source_product_id:"hd-wire-001",brand:"Southwire",model:"SW-142-250",title:"Southwire 250 ft. 14/2 Romex NM-B Wire",category:"electrical",subcategory:"NM-B wire",material_type:"copper",trade:"electrical",size_text:"14/2 NM-B 250ft",price:64.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/southwire-14-2" },
  { retailer:"lowes",source_product_id:"lowes-wire-002",brand:"Southwire",model:"SW-123-250",title:"Southwire 250 ft. 12/3 Romex NM-B Wire with Ground",category:"electrical",subcategory:"NM-B wire",material_type:"copper",trade:"electrical",size_text:"12/3 NM-B 250ft",price:134.97,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/southwire-12-3" },
  { retailer:"home_depot",source_product_id:"hd-wire-002",brand:"Southwire",model:"SW-62-250",title:"Southwire 250 ft. 6/2 NM-B Wire",category:"electrical",subcategory:"NM-B wire",material_type:"copper",trade:"electrical",size_text:"6/2 NM-B 250ft",price:324.00,inventory_status:"limited",product_url:"https://www.homedepot.com/p/southwire-6-2" },
  { retailer:"lowes",source_product_id:"lowes-mc-001",brand:"Southwire",model:"SW-MC-122-250",title:"Southwire 250 ft. 12/2 MC Lite Metal Clad Cable",category:"electrical",subcategory:"MC cable",material_type:"aluminum/copper",trade:"electrical",size_text:"12/2 MC 250ft",price:169.00,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/southwire-mc" },
  { retailer:"home_depot",source_product_id:"hd-mc-001",brand:"AFC Cable Systems",model:"AFC-MC-122-250",title:"AFC Cable 250 ft. 12/2 MC Lite Cable",category:"electrical",subcategory:"MC cable",material_type:"aluminum/copper",trade:"electrical",size_text:"12/2 MC 250ft",price:159.00,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/afc-mc" },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDUIT
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-conduit-001",brand:"Southwire",model:"SW-EMT-34-10",title:"Southwire 3/4 in. x 10 ft. EMT Conduit",category:"electrical",subcategory:"conduit",material_type:"galvanized steel",trade:"electrical",size_text:'3/4" x 10\'',price:7.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/southwire-emt" },
  { retailer:"home_depot",source_product_id:"hd-conduit-001",brand:"Allied Tube",model:"AT-EMT-12-10",title:"Allied Tube 1/2 in. x 10 ft. EMT Conduit",category:"electrical",subcategory:"conduit",material_type:"galvanized steel",trade:"electrical",size_text:'1/2" x 10\'',price:5.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/allied-emt" },
  { retailer:"lowes",source_product_id:"lowes-conduit-002",brand:"Cantex",model:"CX-PVC-34-10",title:"Cantex 3/4 in. x 10 ft. PVC Schedule 40 Conduit",category:"electrical",subcategory:"conduit",material_type:"PVC",trade:"electrical",size_text:'3/4" x 10\'',price:3.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/cantex-pvc-conduit" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ELECTRICAL BOXES
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-ebox-001",brand:"Carlon",model:"CA-B118A",title:"Carlon 1-Gang 18 cu. in. New Work Electrical Box",category:"electrical",subcategory:"electrical boxes",material_type:"PVC",trade:"electrical",size_text:"1-Gang",price:0.58,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/carlon-box" },
  { retailer:"home_depot",source_product_id:"hd-ebox-001",brand:"Carlon",model:"CA-B232A",title:"Carlon 2-Gang 32 cu. in. New Work Electrical Box",category:"electrical",subcategory:"electrical boxes",material_type:"PVC",trade:"electrical",size_text:"2-Gang",price:1.18,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/carlon-2gang" },

  // ═══════════════════════════════════════════════════════════════════════════
  // BREAKERS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-breaker-001",brand:"Square D",model:"SD-HOM120",title:"Square D Homeline 20 Amp Single-Pole Circuit Breaker",category:"electrical",subcategory:"breakers",trade:"electrical",size_text:"20 Amp",price:7.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/squared-breaker" },
  { retailer:"home_depot",source_product_id:"hd-breaker-001",brand:"Eaton",model:"EA-BR120",title:"Eaton BR 20 Amp Single-Pole Circuit Breaker",category:"electrical",subcategory:"breakers",trade:"electrical",size_text:"20 Amp",price:6.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/eaton-breaker" },
  { retailer:"lowes",source_product_id:"lowes-breaker-002",brand:"Square D",model:"SD-HOM230",title:"Square D Homeline 30 Amp Double-Pole Circuit Breaker",category:"electrical",subcategory:"breakers",trade:"electrical",size_text:"30 Amp 2-Pole",price:12.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/squared-30a" },
  { retailer:"home_depot",source_product_id:"hd-breaker-002",brand:"Eaton",model:"EA-BR250",title:"Eaton BR 50 Amp Double-Pole Circuit Breaker",category:"electrical",subcategory:"breakers",trade:"electrical",size_text:"50 Amp 2-Pole",price:14.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/eaton-50a" },

  // ═══════════════════════════════════════════════════════════════════════════
  // SWITCHES & OUTLETS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-switch-001",brand:"Leviton",model:"LV-1451-2W",title:"Leviton 15 Amp Single-Pole Toggle Switch White",category:"electrical",subcategory:"switches",trade:"electrical",color:"White",price:0.68,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/leviton-switch" },
  { retailer:"home_depot",source_product_id:"hd-switch-001",brand:"Leviton",model:"LV-DECORA-15A",title:"Leviton Decora 15 Amp 3-Way Rocker Switch White",category:"electrical",subcategory:"switches",trade:"electrical",color:"White",price:3.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/leviton-decora" },
  { retailer:"lowes",source_product_id:"lowes-outlet-001",brand:"Leviton",model:"LV-T5325-W",title:"Leviton 15 Amp Tamper-Resistant Duplex Outlet White",category:"electrical",subcategory:"outlets",trade:"electrical",color:"White",price:0.88,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/leviton-outlet" },
  { retailer:"home_depot",source_product_id:"hd-outlet-001",brand:"Leviton",model:"LV-GFCI-15A",title:"Leviton 15 Amp SmartlockPro GFCI Outlet White",category:"electrical",subcategory:"outlets",trade:"electrical",color:"White",price:16.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/leviton-gfci" },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONCRETE MIX & MORTAR
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-concrete-001",brand:"Quikrete",model:"QK-5000-80",title:"Quikrete 5000 80 lb. High Early Strength Concrete Mix",category:"concrete",subcategory:"concrete mix",material_type:"concrete",trade:"concrete",size_text:"80 lb",price:6.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/quikrete-5000" },
  { retailer:"home_depot",source_product_id:"hd-concrete-001",brand:"Quikrete",model:"QK-STD-80",title:"Quikrete 80 lb. Concrete Mix",category:"concrete",subcategory:"concrete mix",material_type:"concrete",trade:"concrete",size_text:"80 lb",price:5.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/quikrete-80" },
  { retailer:"lowes",source_product_id:"lowes-mortar-001",brand:"Quikrete",model:"QK-MORT-S-80",title:"Quikrete 80 lb. Type S Mason Mix Mortar",category:"concrete",subcategory:"mortar",material_type:"morite",trade:"concrete",size_text:"80 lb",price:10.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/quikrete-mortar" },
  { retailer:"home_depot",source_product_id:"hd-mortar-001",brand:"Sakrete",model:"SK-MORT-N-80",title:"Sakrete 80 lb. Type N Mortar Mix",category:"concrete",subcategory:"mortar",material_type:"mortar",trade:"concrete",size_text:"80 lb",price:9.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/sakrete-mortar" },

  // ═══════════════════════════════════════════════════════════════════════════
  // REBAR
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-rebar-001",brand:"Grip-Rite",model:"GR-RB4-10",title:"Grip-Rite #4 x 10 ft. Rebar",category:"concrete",subcategory:"rebar",material_type:"steel",trade:"concrete",size_text:'#4 x 10\'',price:7.28,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/griprite-rebar" },
  { retailer:"home_depot",source_product_id:"hd-rebar-001",brand:"Grip-Rite",model:"GR-RB3-10",title:"Grip-Rite #3 x 10 ft. Rebar",category:"concrete",subcategory:"rebar",material_type:"steel",trade:"concrete",size_text:'#3 x 10\'',price:5.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/griprite-rebar-3" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANCHORS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"home_depot",source_product_id:"hd-anchor-001",brand:"Red Head",model:"RH-WA-38",title:"Red Head 3/8 in. x 3 in. Wedge Anchor (15-Pack)",category:"concrete",subcategory:"anchors",material_type:"zinc steel",trade:"concrete",size_text:'3/8" x 3"',price:18.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/redhead-anchor" },
  { retailer:"lowes",source_product_id:"lowes-anchor-001",brand:"Tapcon",model:"TP-14-134-75",title:"Tapcon 1/4 in. x 1-3/4 in. Concrete Anchors (75-Pack)",category:"concrete",subcategory:"anchors",material_type:"steel",trade:"concrete",size_text:'1/4" x 1-3/4" (75-Pack)',price:29.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/tapcon-75" },
  { retailer:"home_depot",source_product_id:"hd-anchor-002",brand:"Simpson Strong-Tie",model:"SST-WA-12-6",title:"Simpson Strong-Tie 1/2 in. x 6 in. Wedge Anchor (10-Pack)",category:"concrete",subcategory:"anchors",material_type:"zinc steel",trade:"concrete",size_text:'1/2" x 6" (10-Pack)',price:24.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/simpson-wedge" },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASTENERS / SCREWS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-screw-001",brand:"GRK",model:"GRK-R4-3-100",title:'GRK R4 #9 x 3 in. Multi-Purpose Screw (100-Pack)',category:"fasteners",subcategory:"screws",material_type:"steel",trade:"framing",size_text:'#9 x 3" (100-Pack)',price:24.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/grk-r4" },
  { retailer:"home_depot",source_product_id:"hd-screw-001",brand:"GRK",model:"GRK-RSS-3-50",title:'GRK RSS 5/16 x 3-1/8 in. Structural Screw (50-Pack)',category:"fasteners",subcategory:"screws",material_type:"steel",trade:"framing",size_text:'5/16 x 3-1/8" (50-Pack)',price:29.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/grk-rss" },
  { retailer:"lowes",source_product_id:"lowes-screw-002",brand:"Grip-Rite",model:"GR-DECK-3-5LB",title:'Grip-Rite #8 x 3 in. Star Drive Deck Screw (5 lb. Box)',category:"fasteners",subcategory:"screws",material_type:"coated steel",trade:"framing",size_text:'#8 x 3" (5 lb)',price:32.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/griprite-deck" },

  // ═══════════════════════════════════════════════════════════════════════════
  // NAILS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-nail-001",brand:"Grip-Rite",model:"GR-16D-5LB",title:'Grip-Rite 16d 3-1/2 in. Bright Sinker Nails 5 lb. Box',category:"fasteners",subcategory:"nails",material_type:"steel",trade:"framing",size_text:'16d 3-1/2" (5 lb)',price:12.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/griprite-16d" },
  { retailer:"home_depot",source_product_id:"hd-nail-001",brand:"Grip-Rite",model:"GR-8D-1LB",title:'Grip-Rite 8d 2-1/2 in. Bright Common Nails 1 lb. Box',category:"fasteners",subcategory:"nails",material_type:"steel",trade:"framing",size_text:'8d 2-1/2" (1 lb)',price:4.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/griprite-8d" },
  { retailer:"home_depot",source_product_id:"hd-nail-002",brand:"Hitachi",model:"HT-COIL-RF",title:"Hitachi 1-1/4 in. x 0.120 in. Coil Roofing Nails (7200-Count)",category:"fasteners",subcategory:"nails",material_type:"galvanized steel",trade:"roofing",size_text:'1-1/4" coil (7200)',price:79.97,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/hitachi-coil-roof" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADHESIVES
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-adhesive-001",brand:"Henry",model:"HE-356-GAL",title:"Henry 356 MultiPro Premium Multipurpose Flooring Adhesive 1 Gal",category:"flooring",subcategory:"flooring adhesive",material_type:"adhesive",trade:"flooring",size_text:"1 Gallon",price:29.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/henry-356" },
  { retailer:"home_depot",source_product_id:"hd-adhesive-001",brand:"Loctite",model:"LOC-PL-PRE-28",title:"Loctite PL Premium 28 oz. Polyurethane Construction Adhesive",category:"building materials",subcategory:"construction adhesive",material_type:"polyurethane",trade:"framing",size_text:"28 oz",price:9.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/loctite-pl-premium" },

  // ═══════════════════════════════════════════════════════════════════════════
  // THINSET & GROUT
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-thinset-001",brand:"Mapei",model:"MAP-KF-50",title:"Mapei Keraflex 50 lb. Large Format Tile Mortar Gray",category:"flooring",subcategory:"thinset",material_type:"modified thinset",trade:"tile",size_text:"50 lb",color:"Gray",price:24.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/mapei-keraflex" },
  { retailer:"home_depot",source_product_id:"hd-thinset-001",brand:"Custom Building Products",model:"CBP-VB-50",title:"Custom Building Products VersaBond 50 lb. Modified Thinset Gray",category:"flooring",subcategory:"thinset",material_type:"modified thinset",trade:"tile",size_text:"50 lb",color:"Gray",price:17.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/versabond" },
  { retailer:"lowes",source_product_id:"lowes-grout-001",brand:"Mapei",model:"MAP-KG-25",title:"Mapei Keracolor U 25 lb. Unsanded Grout Alabaster",category:"flooring",subcategory:"grout",material_type:"unsanded grout",trade:"tile",size_text:"25 lb",color:"Alabaster",price:19.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/mapei-keracolor" },
  { retailer:"home_depot",source_product_id:"hd-grout-001",brand:"Custom Building Products",model:"CBP-PF-25",title:"Custom Building Products Polyblend Plus 25 lb. Sanded Grout Delorean Gray",category:"flooring",subcategory:"grout",material_type:"sanded grout",trade:"tile",size_text:"25 lb",color:"Delorean Gray",price:18.48,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/polyblend-plus" },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMER
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-primer-001",brand:"Zinsser",model:"ZI-BIN-GAL",title:"Zinsser B-I-N Shellac-Based Primer 1 Gal",category:"paint",subcategory:"primer",material_type:"shellac",trade:"painting",size_text:"1 Gallon",price:44.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/zinsser-bin" },
  { retailer:"home_depot",source_product_id:"hd-primer-001",brand:"KILZ",model:"KZ-ORIG-GAL",title:"KILZ Original Interior Oil-Based Primer 1 Gal",category:"paint",subcategory:"primer",material_type:"oil-based",trade:"painting",size_text:"1 Gallon",price:22.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/kilz-original" },
  { retailer:"lowes",source_product_id:"lowes-primer-002",brand:"Zinsser",model:"ZI-123-GAL",title:"Zinsser Bulls Eye 1-2-3 Water-Based Primer 1 Gal",category:"paint",subcategory:"primer",material_type:"water-based",trade:"painting",size_text:"1 Gallon",price:24.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/zinsser-123" },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAINT
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-paint-001",brand:"Valspar",model:"VA-SIG-EGG-GAL",title:"Valspar Signature Ultra White Eggshell Interior Paint 1 Gal",category:"paint",subcategory:"interior paint",material_type:"latex",trade:"painting",size_text:"1 Gallon",color:"Ultra White",finish:"Eggshell",price:39.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/valspar-sig" },
  { retailer:"home_depot",source_product_id:"hd-paint-001",brand:"Behr",model:"BE-PREM-EGG-GAL",title:"Behr Premium Plus Ultra White Eggshell Interior Paint 1 Gal",category:"paint",subcategory:"interior paint",material_type:"latex",trade:"painting",size_text:"1 Gallon",color:"Ultra White",finish:"Eggshell",price:34.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/behr-premium" },
  { retailer:"lowes",source_product_id:"lowes-paint-002",brand:"Sherwin-Williams",model:"SW-EXT-SAT-GAL",title:"HGTV Home by Sherwin-Williams Everlast Exterior Satin Paint 1 Gal",category:"paint",subcategory:"exterior paint",material_type:"acrylic latex",trade:"painting",size_text:"1 Gallon",color:"Extra White",finish:"Satin",price:54.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/sw-everlast" },
  { retailer:"home_depot",source_product_id:"hd-paint-002",brand:"Behr",model:"BE-DYN-FLAT-5G",title:"Behr Dynasty Flat Interior Paint & Primer Ultra White 5 Gal",category:"paint",subcategory:"interior paint",material_type:"latex",trade:"painting",size_text:"5 Gallon",color:"Ultra White",finish:"Flat",price:264.00,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/behr-dynasty-5g" },

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOORING UNDERLAYMENT & SUBFLOOR
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-flr-under-001",brand:"Roberts",model:"RB-70-025-100",title:"Roberts 100 sq. ft. Quiet Cushion Premium Flooring Underlayment",category:"flooring",subcategory:"flooring underlayment",material_type:"foam",trade:"flooring",size_text:"100 sq ft roll",price:29.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/roberts-underlayment" },
  { retailer:"home_depot",source_product_id:"hd-flr-under-001",brand:"TrafficMaster",model:"TM-UNDER-100",title:"TrafficMaster 100 sq. ft. 3 mm Foam Underlayment Roll",category:"flooring",subcategory:"flooring underlayment",material_type:"foam",trade:"flooring",size_text:"100 sq ft roll",price:19.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/trafficmaster-under" },
  { retailer:"lowes",source_product_id:"lowes-subfloor-001",brand:"AdvanTech",model:"AT-SUB-34",title:'AdvanTech 3/4" x 4\' x 8\' Tongue & Groove Subfloor Panel',category:"lumber",subcategory:"subfloor panels",material_type:"OSB",trade:"framing",size_text:'3/4" x 4\' x 8\'',thickness:'3/4"',price:38.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/advantech-subfloor" },

  // ═══════════════════════════════════════════════════════════════════════════
  // CAULK & SEALANTS
  // ═══════════════════════════════════════════════════════════════════════════
  { retailer:"lowes",source_product_id:"lowes-caulk-001",brand:"DAP",model:"DAP-ALEX-PLUS-10",title:"DAP Alex Plus 10.1 oz. White Acrylic Latex Caulk",category:"building materials",subcategory:"caulk",material_type:"acrylic latex",trade:"painting",size_text:"10.1 oz",color:"White",price:3.98,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/dap-alex-plus" },
  { retailer:"home_depot",source_product_id:"hd-caulk-001",brand:"GE",model:"GE-SIL2-KITCH",title:"GE Silicone II 10.1 oz. Kitchen & Bath Caulk Clear",category:"building materials",subcategory:"sealants",material_type:"silicone",trade:"plumbing",size_text:"10.1 oz",color:"Clear",price:7.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/ge-silicone-ii" },
  { retailer:"lowes",source_product_id:"lowes-seal-001",brand:"OSI",model:"OSI-QUAD-10",title:"OSI QUAD 10 oz. Advanced Formula Window & Door Sealant",category:"building materials",subcategory:"sealants",material_type:"elastomeric",trade:"siding",size_text:"10 oz",price:7.48,inventory_status:"in_stock",product_url:"https://www.lowes.com/pd/osi-quad" },
  { retailer:"home_depot",source_product_id:"hd-seal-001",brand:"Loctite",model:"LOC-PL-SEAL-10",title:"Loctite PL S30 10 oz. Polyurethane Roof & Flashing Sealant Black",category:"building materials",subcategory:"sealants",material_type:"polyurethane",trade:"roofing",size_text:"10 oz",color:"Black",price:8.98,inventory_status:"in_stock",product_url:"https://www.homedepot.com/p/loctite-roof-seal" },
];
