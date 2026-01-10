import { Estimate, EstimateLineItem } from '@/hooks/useEstimates';
import { formatCurrency } from '../types';
import { 
  PDFSectionHeader, 
  PDFContentSection,
  PDFSummaryBox,
  PDFSummaryRow
} from '../PDFStyles';

interface PDFTotalsSectionProps {
  estimate: Estimate;
  currency?: string;
  locale?: string;
}

export function PDFTotalsSection({ estimate, currency = 'USD', locale = 'en-US' }: PDFTotalsSectionProps) {
  const format = (val: number | null | undefined) => formatCurrency(val, currency, locale);
  
  const lineItems = (estimate.line_items || []).filter((item: any) => item?.included !== false);
  
  // Calculate subtotal from line items if not provided
  const calculatedSubtotal = lineItems.reduce((sum: number, item: EstimateLineItem) => {
    const qty = item.quantity || 1;
    const unitPrice = item.unitPrice || item.unit_cost || 0;
    return sum + (item.line_total ?? item.totalPrice ?? (qty * unitPrice));
  }, 0);
  
  const costSummary = estimate.cost_summary || {};
  const subtotal = costSummary.subtotal || estimate.subtotal || calculatedSubtotal;
  const taxAmount = costSummary.tax_and_fees || estimate.tax_amount || 0;
  const taxRate = (estimate as any).sales_tax_rate_percent || estimate.tax_rate || 0;
  const permitFee = estimate.permit_fee || 0;
  const profitMarkup = costSummary.profit_markup_amount || 0;
  const profitMarkupPercent = costSummary.profit_markup_percentage || 0;
  const grandTotal = estimate.grand_total || estimate.total_amount || (subtotal + taxAmount + permitFee);
  const requiredDeposit = estimate.required_deposit || 0;
  const depositPercent = (estimate as any).required_deposit_percent || 0;
  const balanceDue = estimate.balance_due || (grandTotal - (estimate.payment_amount || 0));
  const amountPaid = estimate.payment_amount || 0;

  // Calculate deposit tax - proportional tax on the deposit amount
  const depositTaxAmount = requiredDeposit > 0 && grandTotal > 0 
    ? (taxAmount * (requiredDeposit / grandTotal)) 
    : 0;
  
  // Amount due now is the deposit plus proportional tax
  const amountDueNow = requiredDeposit > 0 
    ? requiredDeposit + depositTaxAmount 
    : grandTotal;
  
  // Remaining balance after deposit
  const remainingBalance = grandTotal - requiredDeposit;

  return (
    <>
      <PDFSectionHeader>Estimate Summary</PDFSectionHeader>
      <PDFContentSection>
        <div className="flex justify-between gap-8">
          {/* Project Total Info (left side) */}
          <div className="flex-1">
            <div className="bg-[#f5f3ef] p-4 rounded mb-4">
              <div className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Project Total
              </div>
              <div className="text-lg font-semibold text-[#161e2c]">
                {format(grandTotal)}
              </div>
            </div>
            
            {requiredDeposit > 0 && (
              <div className="text-sm text-[#666666] space-y-1">
                <div className="flex justify-between">
                  <span>Deposit ({depositPercent || Math.round((requiredDeposit / grandTotal) * 100)}%):</span>
                  <span>{format(requiredDeposit)}</span>
                </div>
                {depositTaxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax on Deposit:</span>
                    <span>{format(depositTaxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#e5e5e5]">
                  <span>Balance Due at Completion:</span>
                  <span className="font-medium">{format(remainingBalance)}</span>
                </div>
              </div>
            )}
            
            {amountPaid > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">
                  Amount Paid
                </div>
                <div className="text-xl font-bold text-green-700">
                  {format(amountPaid)}
                </div>
              </div>
            )}
          </div>

          {/* Summary Box - Amount Due Now (right side) */}
          <PDFSummaryBox className="w-[280px]">
            {requiredDeposit > 0 ? (
              <>
                <PDFSummaryRow label="Deposit Required" value={format(requiredDeposit)} />
                {depositTaxAmount > 0 && (
                  <PDFSummaryRow 
                    label={`Sales Tax${taxRate ? ` (${taxRate}%)` : ''}`} 
                    value={format(depositTaxAmount)} 
                  />
                )}
                <PDFSummaryRow 
                  label="AMOUNT DUE NOW" 
                  value={format(amountDueNow)} 
                  isTotal 
                />
              </>
            ) : (
              <>
                <PDFSummaryRow label="Subtotal" value={format(subtotal)} />
                
                {profitMarkup > 0 && (
                  <PDFSummaryRow 
                    label={`Profit/Markup${profitMarkupPercent ? ` (${profitMarkupPercent}%)` : ''}`} 
                    value={format(profitMarkup)} 
                  />
                )}
                
                {(taxAmount > 0 || taxRate > 0) && (
                  <PDFSummaryRow 
                    label={`Sales Tax${taxRate ? ` (${taxRate}%)` : ''}`} 
                    value={format(taxAmount)} 
                  />
                )}
                
                {permitFee > 0 && (
                  <PDFSummaryRow label="Permit Fee" value={format(permitFee)} />
                )}
                
                <PDFSummaryRow 
                  label="TOTAL DUE" 
                  value={format(grandTotal)} 
                  isTotal 
                />
              </>
            )}
            
            {amountPaid > 0 && balanceDue !== grandTotal && (
              <PDFSummaryRow 
                label="Balance Due" 
                value={format(balanceDue)} 
                isBold 
              />
            )}
          </PDFSummaryBox>
        </div>
      </PDFContentSection>
    </>
  );
}
