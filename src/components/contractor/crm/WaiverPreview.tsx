import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Download, Printer } from 'lucide-react';
import DOMPurify from 'dompurify';
import { SelectedWaiver, WAIVER_TYPES } from './WaiverSelection';
import { Invoice } from '@/hooks/useInvoices';
import { format } from 'date-fns';

interface WaiverPreviewProps {
  invoice: Invoice | null;
  waiver: SelectedWaiver | null;
  gcName?: string;
  gcCompany?: string;
  contractorName?: string;
  contractorAddress?: string;
  jobName?: string;
  jobAddress?: string;
  onSignatureChange?: (signatureData: string | null) => void;
  onSignerInfoChange?: (info: { name: string; title: string }) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function WaiverPreview({
  invoice,
  waiver,
  gcName = 'General Contractor',
  gcCompany,
  contractorName = 'Contractor',
  contractorAddress = '',
  jobName = 'Project',
  jobAddress = '',
  onSignatureChange,
  onSignerInfoChange,
}: WaiverPreviewProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');

  if (!invoice || !waiver) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg p-8">
        <p className="text-muted-foreground text-center">
          Select a waiver type to preview
        </p>
      </div>
    );
  }

  const waiverType = WAIVER_TYPES.find(w => w.id === waiver.type);
  const gcDisplay = gcCompany ? `${gcCompany} (${gcName})` : gcName;

  const getWaiverBody = () => {
    switch (waiver.type) {
      case 'conditional_progress':
        return `Upon receipt by the undersigned of a check from ${gcDisplay} in the sum of ${formatCurrency(waiver.amount)} payable to ${contractorName}, and when the check has been properly endorsed and has been paid by the bank upon which it is drawn, this document becomes effective to release and waive any mechanics lien, stop payment notice, or bond right the undersigned has for labor, services, equipment, or materials furnished to ${jobName} through ${waiver.billingPeriodEnd ? format(new Date(waiver.billingPeriodEnd), 'MMMM d, yyyy') : 'the date below'} only.

This waiver does not apply to retention, pending contract modifications, or items furnished after the through date above.`;

      case 'unconditional_progress':
        return `The undersigned has been paid and has received a progress payment in the sum of ${formatCurrency(waiver.amount)} for labor, services, equipment, or materials furnished to ${jobName} through ${waiver.billingPeriodEnd ? format(new Date(waiver.billingPeriodEnd), 'MMMM d, yyyy') : 'the date below'}. This document waives and releases any mechanics lien, stop payment notice, or bond right the undersigned has for work furnished through this date.

This waiver does not apply to retention or pending contract modifications.`;

      case 'conditional_final':
        return `Upon receipt by the undersigned of a check from ${gcDisplay} in the amount of ${formatCurrency(waiver.amount)} payable to ${contractorName}, and when the check has been properly endorsed and paid by the bank on which it is drawn, this document becomes effective to release and waive any mechanics lien, stop payment notice, or bond right the undersigned has for all labor, services, equipment, or materials furnished to ${jobName}.

This waiver covers the final payment only and becomes effective upon actual clearance of funds.`;

      case 'unconditional_final':
        return `The undersigned has been paid in full for all labor, services, equipment, or materials furnished to ${jobName}. This document unconditionally waives and releases all mechanics lien, stop payment notice, and bond rights for this project.`;

      default:
        return '';
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    onSignatureChange?.(null);
  };

  const handleSignatureEnd = () => {
    if (signatureRef.current) {
      const dataUrl = signatureRef.current.toDataURL();
      onSignatureChange?.(dataUrl);
    }
  };

  const handleNameChange = (name: string) => {
    setSignerName(name);
    onSignerInfoChange?.({ name, title: signerTitle });
  };

  const handleTitleChange = (title: string) => {
    setSignerTitle(title);
    onSignerInfoChange?.({ name: signerName, title });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#1e3a5f] p-4 text-center border-b-4 border-[#d4af37]">
        <h2 className="text-white font-bold text-lg uppercase tracking-wide">
          {waiverType?.label || 'Lien Waiver'}
        </h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {/* Waiver Body Text */}
        <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap text-justify">
          {getWaiverBody()}
        </div>

        {/* Invoice & Project Info */}
        <div className="bg-gray-50 border-l-4 border-[#d4af37] p-4 space-y-2">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Document Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="ml-2 font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
            </div>
            <div>
              <span className="text-gray-500">Invoice #:</span>
              <span className="ml-2 font-medium">{invoice.invoice_number || `INV-${invoice.id?.slice(0, 8)}`}</span>
            </div>
            <div>
              <span className="text-gray-500">Project:</span>
              <span className="ml-2 font-medium">{jobName}</span>
            </div>
            <div>
              <span className="text-gray-500">Invoice Amount:</span>
              <span className="ml-2 font-medium">{formatCurrency(invoice.amount_due)}</span>
            </div>
            {jobAddress && (
              <div className="col-span-2">
                <span className="text-gray-500">Project Address:</span>
                <span className="ml-2 font-medium">{jobAddress}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Waiver Amount:</span>
              <span className="ml-2 font-medium text-[#1e3a5f]">{formatCurrency(waiver.amount)}</span>
            </div>
            {waiver.retainage && waiver.retainage > 0 && (
              <div>
                <span className="text-gray-500">Retainage:</span>
                <span className="ml-2 font-medium">{formatCurrency(waiver.retainage)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contractor Info */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-700">Contractor:</p>
          <p className="text-sm">{contractorName}</p>
          {contractorAddress && <p className="text-sm text-gray-600">{contractorAddress}</p>}
        </div>

        {/* Signature Section */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold text-sm text-gray-700">Signature</h3>
          
          {/* Digital Signature Pad */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sign below (optional - for digital signature)</Label>
            <div className="border rounded-md bg-gray-50 relative">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-24 rounded-md',
                  style: { width: '100%', height: '96px' }
                }}
                onEnd={handleSignatureEnd}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1"
                onClick={clearSignature}
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Printed Name and Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Printed Name</Label>
              <Input
                value={signerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your name"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input
                value={signerTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Owner, Manager"
                className="h-9"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date Signed</Label>
            <Input
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="h-9 w-48"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-3 text-center text-xs text-gray-500 bg-gray-50">
        This lien waiver was generated via CT1 Business Suite
      </div>
    </div>
  );
}

export default WaiverPreview;
