// Types for comprehensive PDF generation
import { Estimate, EstimateLineItem } from '@/hooks/useEstimates';

export interface ContractorProfile {
  company_name?: string;
  contact_name?: string;
  logo_url?: string;
  phone?: string;
  business_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  business_email?: string;
  website_url?: string;
  license_number?: string;
  brand_color?: string;
  brand_font?: string;
  brand_primary_color?: string;
  brand_secondary_color?: string;
  brand_accent_color?: string;
}

export interface EstimatePDFData {
  estimate: Estimate;
  contractor: ContractorProfile;
  locale?: string;
  currency?: string;
}

export interface LineItemGroup {
  name: string;
  items: EstimateLineItem[];
  subtotal: number;
}

export interface PDFSection {
  id: string;
  type: 'header' | 'parties' | 'scope' | 'lineItems' | 'totals' | 'schedule' | 'paymentSchedule' | 'terms' | 'acceptance' | 'attachments' | 'warranty' | 'insurance' | 'custom' | 'catchAll';
  title?: string;
  data?: any;
  isEmpty?: boolean;
}

export interface ScheduleMilestone {
  name: string;
  date?: string;
  description?: string;
}

export interface PaymentMilestone {
  name: string;
  percent?: number;
  amount?: number;
  dueTrigger?: string;
  dueDate?: string;
  notes?: string;
}

// Utility functions for PDF
export function formatCurrency(value: number | null | undefined, currency = 'USD', locale = 'en-US'): string {
  const num = Number(value || 0);
  return num.toLocaleString(locale, { style: 'currency', currency });
}

export function formatDate(dateStr: string | null | undefined, locale = 'en-US'): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string | null | undefined, locale = 'en-US'): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Extract all fields from estimate that weren't rendered in standard sections
export function getUnmappedFields(estimate: Estimate, renderedFields: Set<string>): Record<string, any> {
  const unmapped: Record<string, any> = {};
  
  const extractFields = (obj: any, prefix = ''): void => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      // Skip already rendered, null/undefined, or system fields
      if (renderedFields.has(path) || value == null || 
          ['id', 'user_id', 'created_at', 'updated_at', 'public_token'].includes(key)) {
        continue;
      }
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        extractFields(value, path);
      } else if (value !== '' && value !== 0 && (!Array.isArray(value) || value.length > 0)) {
        unmapped[path] = value;
      }
    }
  };
  
  extractFields(estimate);
  return unmapped;
}
