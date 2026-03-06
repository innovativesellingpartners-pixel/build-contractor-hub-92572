/**
 * Catalog Source Adapters
 * 
 * Pluggable ingestion layer for the retailer product catalog.
 * The search/query side (searchProducts edge function, AI chat tool) is intentionally
 * decoupled — it always reads from `retailer_catalog` regardless of how data got there.
 *
 * === SUPPORTED SOURCE TYPES ===
 * 
 * csv_import     — Admin CSV upload (MVP, active)
 * manual_entry   — Admin single-product form (MVP, active)
 * sample_data    — Built-in test data seeder (MVP, active)
 * future_api     — Reserved for official retailer API connectors
 * future_feed    — Reserved for approved supplier catalog feeds
 *
 * === ADDING A NEW SOURCE ===
 *
 * 1. Create a class implementing CatalogSourceAdapter
 * 2. Register it in CATALOG_ADAPTERS below
 * 3. The adapter's ingest() method should return rows ready for upsert
 * 4. All rows MUST include `source_type` and `source_name`
 *
 * === FUTURE CONNECTOR HOOKS ===
 *
 * Lowe's API Connector:
 *   - Would implement CatalogSourceAdapter with source_type = "lowes_api"
 *   - Auth via OAuth2 client credentials stored in Supabase secrets
 *   - Scheduled sync via pg_cron or external trigger calling an edge function
 *   - Endpoint: supabase/functions/catalog-sync-lowes/index.ts
 *
 * Home Depot API Connector:
 *   - Would implement CatalogSourceAdapter with source_type = "homedepot_api"
 *   - Auth via affiliate/partner API key stored in Supabase secrets
 *   - Endpoint: supabase/functions/catalog-sync-homedepot/index.ts
 *
 * Generic Supplier Feed (CSV/JSON/XML):
 *   - Would implement CatalogSourceAdapter with source_type = "supplier_feed"
 *   - Accepts a URL or file upload, maps fields via config
 *   - Could be triggered manually or on a schedule
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CatalogSourceType =
  | "csv_import"
  | "manual_entry"
  | "sample_data"
  | "future_api"
  | "future_feed";

export interface CatalogProduct {
  retailer: string;
  source_product_id?: string;
  sku?: string;
  upc?: string;
  brand?: string;
  model?: string;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string;
  material_type?: string;
  trade?: string;
  unit_of_measure?: string;
  package_size?: string;
  dimensions?: string;
  thickness?: string;
  length_value?: number;
  width_value?: number;
  height_value?: number;
  size_text?: string;
  color?: string;
  finish?: string;
  material?: string;
  price?: number;
  currency?: string;
  inventory_status?: string;
  product_url?: string;
  image_url?: string;
  [key: string]: any;
}

export interface IngestResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export interface CatalogSourceAdapter {
  readonly sourceType: CatalogSourceType;
  readonly sourceName: string;

  /**
   * Transform raw input into catalog rows and upsert them.
   * Each adapter owns its own transformation logic.
   */
  ingest(products: CatalogProduct[]): Promise<IngestResult>;
}

// ─── Shared upsert logic ─────────────────────────────────────────────────────

const BATCH_SIZE = 20;

async function batchUpsert(
  rows: Record<string, any>[],
  sourceType: CatalogSourceType,
  sourceName: string
): Promise<IngestResult> {
  const now = new Date().toISOString();
  const result: IngestResult = { total: rows.length, inserted: 0, updated: 0, skipped: 0, errors: [] };

  const tagged = rows.map((r) => ({
    ...r,
    source_type: sourceType,
    source_name: sourceName,
    last_synced_at: now,
  }));

  for (let i = 0; i < tagged.length; i += BATCH_SIZE) {
    const batch = tagged.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("retailer_catalog")
      .upsert(batch as any, { onConflict: "retailer,source_product_id" });

    if (error) {
      console.error(`Batch upsert error (rows ${i}-${i + batch.length}):`, error);
      batch.forEach((_, idx) =>
        result.errors.push({ row: i + idx, message: error.message })
      );
    } else {
      result.inserted += batch.length; // Supabase upsert doesn't distinguish insert/update counts
    }
  }

  return result;
}

// ─── CSV Import Adapter ──────────────────────────────────────────────────────

class CsvImportAdapter implements CatalogSourceAdapter {
  readonly sourceType: CatalogSourceType = "csv_import";
  sourceName: string;

  constructor(fileName: string) {
    this.sourceName = fileName;
  }

  async ingest(products: CatalogProduct[]): Promise<IngestResult> {
    return batchUpsert(products, this.sourceType, this.sourceName);
  }
}

// ─── Manual Entry Adapter ────────────────────────────────────────────────────

class ManualEntryAdapter implements CatalogSourceAdapter {
  readonly sourceType: CatalogSourceType = "manual_entry";
  readonly sourceName = "admin_form";

  async ingest(products: CatalogProduct[]): Promise<IngestResult> {
    return batchUpsert(products, this.sourceType, this.sourceName);
  }
}

// ─── Sample Data Adapter ─────────────────────────────────────────────────────

class SampleDataAdapter implements CatalogSourceAdapter {
  readonly sourceType: CatalogSourceType = "sample_data";
  readonly sourceName = "admin_sample_insert";

  async ingest(products: CatalogProduct[]): Promise<IngestResult> {
    return batchUpsert(products, this.sourceType, this.sourceName);
  }
}

// ─── Future API Adapter (placeholder) ────────────────────────────────────────
//
// To implement a retailer API connector:
//
//   class LowesApiAdapter implements CatalogSourceAdapter {
//     readonly sourceType: CatalogSourceType = "future_api";
//     readonly sourceName = "lowes_product_api";
//
//     async ingest(products: CatalogProduct[]): Promise<IngestResult> {
//       // 1. Authenticate with Lowe's API using secrets from Supabase vault
//       // 2. Fetch product data by category/pagination
//       // 3. Map Lowe's response fields → CatalogProduct
//       // 4. return batchUpsert(mapped, this.sourceType, this.sourceName);
//     }
//   }
//
//   class HomeDepotApiAdapter implements CatalogSourceAdapter {
//     readonly sourceType: CatalogSourceType = "future_api";
//     readonly sourceName = "homedepot_product_api";
//
//     async ingest(products: CatalogProduct[]): Promise<IngestResult> {
//       // 1. Authenticate with Home Depot Affiliate API
//       // 2. Fetch products with pagination
//       // 3. Map HD response fields → CatalogProduct
//       // 4. return batchUpsert(mapped, this.sourceType, this.sourceName);
//     }
//   }

// ─── Future Feed Adapter (placeholder) ───────────────────────────────────────
//
// To implement a supplier catalog feed:
//
//   class SupplierFeedAdapter implements CatalogSourceAdapter {
//     readonly sourceType: CatalogSourceType = "future_feed";
//     sourceName: string;
//
//     constructor(feedName: string) {
//       this.sourceName = feedName;
//     }
//
//     async ingest(products: CatalogProduct[]): Promise<IngestResult> {
//       // 1. Download feed file from configured URL
//       // 2. Parse CSV/JSON/XML format
//       // 3. Map supplier fields → CatalogProduct using field config
//       // 4. return batchUpsert(mapped, this.sourceType, this.sourceName);
//     }
//   }

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createCsvAdapter(fileName: string): CatalogSourceAdapter {
  return new CsvImportAdapter(fileName);
}

export function createManualEntryAdapter(): CatalogSourceAdapter {
  return new ManualEntryAdapter();
}

export function createSampleDataAdapter(): CatalogSourceAdapter {
  return new SampleDataAdapter();
}

// Future: export function createLowesApiAdapter() { ... }
// Future: export function createHomeDepotApiAdapter() { ... }
// Future: export function createSupplierFeedAdapter(feedName: string) { ... }
