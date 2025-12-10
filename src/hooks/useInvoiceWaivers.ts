import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SelectedWaiver } from '@/components/contractor/crm/WaiverSelection';

export interface InvoiceWaiver {
  id: string;
  invoice_id: string;
  gc_id: string | null;
  waiver_type: 'conditional_progress' | 'unconditional_progress' | 'conditional_final' | 'unconditional_final';
  amount: number;
  billing_period_start: string | null;
  billing_period_end: string | null;
  retainage: number;
  pdf_url: string | null;
  created_at: string;
  created_by: string;
  html?: string;
}

export function useInvoiceWaivers() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateWaivers = async (
    invoiceId: string,
    gcId: string,
    waivers: SelectedWaiver[]
  ): Promise<InvoiceWaiver[]> => {
    if (waivers.length === 0) return [];

    setIsGenerating(true);
    const generatedWaivers: InvoiceWaiver[] = [];

    try {
      for (const waiver of waivers) {
        console.log(`Generating waiver: ${waiver.type} for invoice ${invoiceId}`);
        
        const { data, error } = await supabase.functions.invoke('generate-waiver-pdf', {
          body: {
            invoiceId,
            waiverType: waiver.type,
            gcId,
            amount: waiver.amount,
            billingPeriodStart: waiver.billingPeriodStart,
            billingPeriodEnd: waiver.billingPeriodEnd,
            retainage: waiver.retainage,
          },
        });

        if (error) {
          console.error(`Failed to generate ${waiver.type} waiver:`, error);
          throw new Error(`Failed to generate ${waiver.type} waiver: ${error.message}`);
        }

        if (data?.waiver) {
          generatedWaivers.push(data.waiver);
        }
      }

      console.log(`Generated ${generatedWaivers.length} waivers successfully`);
      return generatedWaivers;
    } catch (error: any) {
      console.error('Error generating waivers:', error);
      toast.error(error.message || 'Failed to generate waivers');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchInvoiceWaivers = async (invoiceId: string): Promise<InvoiceWaiver[]> => {
    try {
      const { data, error } = await supabase
        .from('invoice_waivers')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as InvoiceWaiver[]) || [];
    } catch (error: any) {
      console.error('Error fetching invoice waivers:', error);
      return [];
    }
  };

  const downloadWaiverAsHtml = (waiver: InvoiceWaiver) => {
    if (!waiver.html && !waiver.pdf_url) {
      toast.error('Waiver document not available');
      return;
    }

    if (waiver.pdf_url) {
      window.open(waiver.pdf_url, '_blank');
      return;
    }

    // Create download from HTML
    const blob = new Blob([waiver.html || ''], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waiver_${waiver.waiver_type}_${waiver.id.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printWaiver = (waiver: InvoiceWaiver) => {
    if (!waiver.html) {
      toast.error('Waiver document not available for printing');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(waiver.html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return {
    isGenerating,
    generateWaivers,
    fetchInvoiceWaivers,
    downloadWaiverAsHtml,
    printWaiver,
  };
}
