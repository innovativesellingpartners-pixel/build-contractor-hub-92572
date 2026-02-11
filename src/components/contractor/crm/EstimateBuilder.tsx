import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Save, Send } from 'lucide-react';
import { Estimate, EstimateLineItem, useEstimates } from '@/hooks/useEstimates';
import { useAuth } from '@/contexts/AuthContext';
import { useContractorProfile } from '@/hooks/useContractorProfile';
import { toast } from 'sonner';
import ProjectInfoStep from './estimate/BuilderSteps/ProjectInfoStep';
import LineItemsStep from './estimate/BuilderSteps/LineItemsStep';
import ScopeTermsStep from './estimate/BuilderSteps/ScopeTermsStep';
import ReviewStep from './estimate/BuilderSteps/ReviewStep';
import { useEstimateAutoSave } from '@/hooks/useEstimateAutoSave';
import { AutoSaveStatus } from './estimate/AutoSaveStatus';
import { DraftRestorePrompt } from './estimate/DraftRestorePrompt';
import { useBlocker } from 'react-router-dom';

export interface EstimateBuilderData {
  // Project Info
  title: string;
  project_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  site_address: string;
  prepared_by: string;
  referred_by: string;
  trade_type: string;
  gc_contact_id: string;
  
  // Line Items
  line_items: EstimateLineItem[];
  
  // Scope
  scope_objective: string;
  scope_key_deliverables: string[];
  scope_exclusions: string[];
  scope_timeline: string;
  
  // Financial
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  permit_fee: number;
  grand_total: number;
  required_deposit_percent: number;
  required_deposit: number;
  balance_due: number;
  
  // Terms
  terms_validity: string;
  terms_payment_schedule: string;
  terms_change_orders: string;
  terms_insurance: string;
  terms_warranty_years: number;
  
  // Warranty
  warranty_id: string | null;
  warranty_text: string;
  warranty_duration_years: number;
  warranty_duration_months: number;
}

interface EstimateBuilderProps {
  initialData?: any;
  onSave: (data: any, isDraft: boolean) => Promise<void>;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, name: 'Project Info', description: 'Client & project details' },
  { id: 2, name: 'Line Items', description: 'Services & pricing' },
  { id: 3, name: 'Scope & Terms', description: 'Deliverables & conditions' },
  { id: 4, name: 'Review', description: 'Preview & send' },
];

export default function EstimateBuilder({ initialData, onSave, onCancel }: EstimateBuilderProps) {
  const { user } = useAuth();
  const { profile, getEstimateDefaults } = useContractorProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const initialDataAppliedRef = useRef(false);
  const hasUserEditedRef = useRef(false);
  
  // Auto-save hook
  const {
    status: autoSaveStatus,
    lastSavedAt,
    hasDraft,
    draftInfo,
    isRestorePromptVisible,
    restoreDraft,
    discardDraft,
    triggerSave,
    flushSave,
    clearDraft,
  } = useEstimateAutoSave({
    estimateId: initialData?.id,
    enabled: !!initialData?.id, // Only enable auto-save for existing estimates
  });
  
  // Initialize form data
  const [formData, setFormData] = useState<EstimateBuilderData>(() => {
    const defaults = profile ? getEstimateDefaults() : { salesTaxRate: 6, depositPercent: 30, warrantyYears: 2 };
    
    return {
      title: initialData?.title || initialData?.project_name || '',
      project_name: initialData?.project_name || initialData?.title || '',
      client_name: initialData?.client_name || '',
      client_email: initialData?.client_email || '',
      client_phone: initialData?.client_phone || '',
      client_address: initialData?.client_address || '',
      site_address: initialData?.site_address || '',
      prepared_by: initialData?.prepared_by || user?.user_metadata?.full_name || '',
      referred_by: initialData?.referred_by || '',
      trade_type: initialData?.trade_type || '',
      gc_contact_id: initialData?.gc_contact_id || '',
      
      line_items: initialData?.line_items?.length > 0 
        ? normalizeLineItems(initialData.line_items) 
        : [createEmptyLineItem()],
      
      scope_objective: initialData?.scope_objective || '',
      scope_key_deliverables: initialData?.scope_key_deliverables || [],
      scope_exclusions: initialData?.scope_exclusions || [],
      scope_timeline: initialData?.scope_timeline || '',
      
      subtotal: initialData?.subtotal || 0,
      tax_rate: initialData?.tax_rate || initialData?.sales_tax_rate_percent || defaults.salesTaxRate,
      tax_amount: initialData?.tax_amount || 0,
      permit_fee: initialData?.permit_fee || 0,
      grand_total: initialData?.grand_total || initialData?.total_amount || 0,
      required_deposit_percent: initialData?.required_deposit_percent || defaults.depositPercent,
      required_deposit: initialData?.required_deposit || 0,
      balance_due: initialData?.balance_due || 0,
      
      terms_validity: initialData?.terms_validity || 'This estimate is valid for 30 days from the date of issue.',
      terms_payment_schedule: initialData?.terms_payment_schedule || '30% deposit required to begin work, 40% upon completion of rough work, 30% upon final completion.',
      terms_change_orders: initialData?.terms_change_orders || 'Any changes to the scope of work must be documented in writing and may result in additional charges.',
      terms_insurance: initialData?.terms_insurance || 'Contractor carries general liability insurance. Certificate of insurance available upon request.',
      terms_warranty_years: initialData?.terms_warranty_years || defaults.warrantyYears,
      
      // Warranty fields
      warranty_id: initialData?.warranty_id || null,
      warranty_text: initialData?.warranty_text || '',
      warranty_duration_years: initialData?.warranty_duration_years || defaults.warrantyYears,
      warranty_duration_months: initialData?.warranty_duration_months || 0,
    };
  });

  // Handle draft restoration
  const handleRestoreDraft = useCallback(() => {
    if (draftInfo?.payload) {
      setFormData(draftInfo.payload);
      setDraftRestored(true);
      hasUserEditedRef.current = true;
      toast.success('Draft restored');
    }
    restoreDraft();
  }, [draftInfo, restoreDraft]);

  const handleDiscardDraft = useCallback(async () => {
    setIsDiscarding(true);
    try {
      await discardDraft();
      toast.info('Draft discarded');
    } finally {
      setIsDiscarding(false);
    }
  }, [discardDraft]);

  // Recalculate financials whenever line items or rates change
  useEffect(() => {
    const subtotal = formData.line_items
      .filter(item => item.included !== false)
      .reduce((sum, item) => {
        const qty = item.quantity || 0;
        const price = item.unit_cost || item.unitPrice || 0;
        return sum + (qty * price);
      }, 0);
    
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const grandTotal = subtotal + taxAmount + formData.permit_fee;
    const requiredDeposit = grandTotal * (formData.required_deposit_percent / 100);
    const balanceDue = grandTotal - requiredDeposit;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      required_deposit: requiredDeposit,
      balance_due: balanceDue,
    }));
  }, [formData.line_items, formData.tax_rate, formData.permit_fee, formData.required_deposit_percent]);

  // Trigger auto-save on form data changes
  useEffect(() => {
    // Skip the initial render to avoid saving unchanged data
    if (!initialDataAppliedRef.current) {
      initialDataAppliedRef.current = true;
      return;
    }

    // Only auto-save after the user actually edits something
    if (!hasUserEditedRef.current) return;

    // Only trigger auto-save for existing estimates
    if (initialData?.id && !isRestorePromptVisible) {
      triggerSave(formData);
    }
  }, [formData, initialData?.id, triggerSave, isRestorePromptVisible]);

  const updateFormData = (updates: Partial<EstimateBuilderData>) => {
    hasUserEditedRef.current = true;
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.title || formData.project_name) && !!formData.client_name;
      case 2:
        return formData.line_items.length > 0;
      case 3:
        return true; // Optional step
      case 4:
        return true;
      default:
        return true;
    }
  };

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const getValidationErrors = (): string[] => {
    switch (currentStep) {
      case 1:
        const errors: string[] = [];
        if (!formData.title && !formData.project_name) errors.push('Project title is required');
        if (!formData.client_name) errors.push('Client name is required');
        return errors;
      case 2:
        const hasValidItem = formData.line_items.some(item => item.description?.trim());
        if (!hasValidItem) return ['At least one line item with a description is required'];
        return [];
      default:
        return [];
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      const errors = getValidationErrors();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors([]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await onSave(buildEstimatePayload(), true);
      // Clear the auto-save draft after successful manual save
      if (initialData?.id) {
        await clearDraft();
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEstimate = async () => {
    if (!formData.client_email) {
      toast.error('Client email is required to send the estimate');
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(buildEstimatePayload(), false);
      // Clear the auto-save draft after successful save
      if (initialData?.id) {
        await clearDraft();
      }
    } catch (error) {
      console.error('Failed to send estimate:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel with flush save
  const handleCancel = async () => {
    if (initialData?.id) {
      await flushSave();
    }
    onCancel();
  };

  const buildEstimatePayload = (): Estimate => {
    return {
      ...initialData,
      title: formData.title || formData.project_name,
      project_name: formData.project_name || formData.title,
      client_name: formData.client_name,
      client_email: formData.client_email,
      client_phone: formData.client_phone,
      client_address: formData.client_address,
      site_address: formData.site_address,
      prepared_by: formData.prepared_by,
      referred_by: formData.referred_by,
      trade_type: formData.trade_type,
      
      line_items: formData.line_items,
      
      scope_objective: formData.scope_objective,
      scope_key_deliverables: formData.scope_key_deliverables,
      scope_exclusions: formData.scope_exclusions,
      scope_timeline: formData.scope_timeline,
      
      subtotal: formData.subtotal,
      tax_rate: formData.tax_rate,
      sales_tax_rate_percent: formData.tax_rate,
      tax_amount: formData.tax_amount,
      permit_fee: formData.permit_fee,
      grand_total: formData.grand_total,
      total_amount: formData.grand_total,
      required_deposit_percent: formData.required_deposit_percent,
      required_deposit: formData.required_deposit,
      balance_due: formData.balance_due,
      
      terms_validity: formData.terms_validity,
      terms_payment_schedule: formData.terms_payment_schedule,
      terms_change_orders: formData.terms_change_orders,
      terms_insurance: formData.terms_insurance,
      terms_warranty_years: formData.terms_warranty_years,
      
      // Warranty fields
      warranty_id: formData.warranty_id,
      warranty_text: formData.warranty_text,
      warranty_duration_years: formData.warranty_duration_years,
      warranty_duration_months: formData.warranty_duration_months,
      
      status: 'draft',
      date_issued: new Date().toISOString(),
    };
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with Progress */}
      <div className="flex-shrink-0 border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <div>
              <h2 className="text-lg font-semibold">
                {initialData?.id ? 'Edit Estimate' : 'New Estimate'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Auto-save status */}
            {initialData?.id && (
              <AutoSaveStatus status={autoSaveStatus} lastSavedAt={lastSavedAt} />
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                    {step.id}
                  </span>
                )}
                <span className="hidden sm:inline">{step.name}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <Progress value={progress} className="mt-4 h-1" />
      </div>

      {/* Draft Restore Prompt */}
      {isRestorePromptVisible && draftInfo && (
        <div className="px-6 pt-4">
          <DraftRestorePrompt
            draftUpdatedAt={draftInfo.updatedAt}
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
            isDiscarding={isDiscarding}
          />
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="px-6 pt-3">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3">
            {validationErrors.map((err, i) => (
              <p key={i} className="text-sm text-destructive flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
                {err}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-auto p-6">
        {currentStep === 1 && (
          <ProjectInfoStep
            data={formData}
            onChange={updateFormData}
          />
        )}
        {currentStep === 2 && (
          <LineItemsStep
            data={formData}
            onChange={updateFormData}
          />
        )}
        {currentStep === 3 && (
          <ScopeTermsStep
            data={formData}
            onChange={updateFormData}
          />
        )}
        {currentStep === 4 && (
          <ReviewStep
            data={formData}
            onChange={updateFormData}
          />
        )}
      </div>

      {/* Footer Navigation - elevated z-index and extra margin to stay above bottom nav */}
      <div className="flex-shrink-0 border-t bg-card px-6 py-4 mb-20 md:mb-0 relative z-50">
        <div className="flex items-center justify-between max-w-full">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2 sm:gap-3 ml-2">
            {/* Running Total - hide on very small screens */}
            <div className="hidden md:block text-right mr-2">
              <p className="text-xs text-muted-foreground">Estimate Total</p>
              <p className="text-lg font-semibold text-primary">
                ${formData.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="shrink-0">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2 flex-wrap justify-end">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="shrink-0"
                >
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save Draft</span>
                </Button>
                <Button
                  onClick={handleSendEstimate}
                  disabled={isSaving || !formData.client_email}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Send to Client</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function normalizeLineItems(items: any[]): EstimateLineItem[] {
  return items.map((item: any, index: number) => ({
    id: item.id || `item-${index}`,
    itemNumber: item.itemNumber || item.item_number || `${index + 1}`,
    category: item.category || 'Materials',
    description: item.description || item.item_description || '',
    item_description: item.item_description || item.description || '',
    quantity: item.quantity ?? 1,
    unit: item.unit || item.unit_type || 'EA',
    unit_type: item.unit_type || item.unit || 'EA',
    unitPrice: item.unitPrice ?? item.unit_cost ?? 0,
    unit_cost: item.unit_cost ?? item.unitPrice ?? 0,
    totalPrice: item.totalPrice ?? item.line_total ?? ((item.quantity ?? 1) * (item.unitPrice ?? item.unit_cost ?? 0)),
    line_total: item.line_total ?? item.totalPrice ?? ((item.quantity ?? 1) * (item.unit_cost ?? item.unitPrice ?? 0)),
    included: item.included !== false,
  }));
}

function createEmptyLineItem(): EstimateLineItem {
  return {
    id: `item-${Date.now()}`,
    itemNumber: '1',
    category: 'Materials',
    description: '',
    item_description: '',
    quantity: 1,
    unit: 'EA',
    unit_type: 'EA',
    unitPrice: 0,
    unit_cost: 0,
    totalPrice: 0,
    line_total: 0,
    included: true,
  };
}
