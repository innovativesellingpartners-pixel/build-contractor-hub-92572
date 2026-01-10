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
  // Signature fields
  signature_data?: string | null;
  signed_at?: string | null;
  signer_name?: string | null;
  signer_title?: string | null;
}

export interface WaiverSignatureData {
  signatureData?: string;
  signerName?: string;
  signerTitle?: string;
}

export function useInvoiceWaivers() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const generateWaivers = async (
    invoiceId: string,
    gcId: string,
    waivers: SelectedWaiver[],
    signatureInfo?: WaiverSignatureData
  ): Promise<InvoiceWaiver[]> => {
    if (waivers.length === 0) return [];

    setIsGenerating(true);
    const generatedWaivers: InvoiceWaiver[] = [];

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

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
            signatureData: signatureInfo?.signatureData,
            signerName: signatureInfo?.signerName,
            signerTitle: signatureInfo?.signerTitle,
          },
          headers: {
            Authorization: `Bearer ${token}`,
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

  const sendInvoiceWithWaivers = async (
    invoiceId: string,
    recipientEmail: string,
    recipientName?: string,
    includeWaivers: boolean = false,
    attachmentMode: 'combined' | 'separate' = 'combined'
  ) => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId,
          recipientEmail,
          recipientName,
          includeWaivers,
          waiverAttachmentMode: attachmentMode,
        },
      });

      if (error) throw error;

      const waiverCount = data?.waiversIncluded || 0;
      if (includeWaivers && waiverCount > 0) {
        toast.success(`Invoice sent with ${waiverCount} waiver${waiverCount > 1 ? 's' : ''} to ${recipientEmail}`);
      } else {
        toast.success(`Invoice sent to ${recipientEmail}`);
      }

      return data;
    } catch (error: any) {
      console.error('Error sending invoice with waivers:', error);
      toast.error(error.message || 'Failed to send invoice');
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const updateWaiverSignature = async (
    waiverId: string,
    signatureData: string,
    signerName: string,
    signerTitle?: string
  ) => {
    try {
      const { error } = await supabase
        .from('invoice_waivers')
        .update({
          signature_data: signatureData,
          signer_name: signerName,
          signer_title: signerTitle,
          signed_at: new Date().toISOString(),
        })
        .eq('id', waiverId);

      if (error) throw error;
      toast.success('Waiver signed successfully');
    } catch (error: any) {
      console.error('Error updating waiver signature:', error);
      toast.error('Failed to save signature');
      throw error;
    }
  };

  return {
    isGenerating,
    isSending,
    generateWaivers,
    fetchInvoiceWaivers,
    downloadWaiverAsHtml,
    printWaiver,
    sendInvoiceWithWaivers,
    updateWaiverSignature,
  };
}
