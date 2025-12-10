import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, ChevronDown, Save, Send, FileText, Download, Eye, LayoutTemplate, BookmarkPlus } from 'lucide-react';
import { TemplateSearchModal } from './estimate/TemplateSearchModal';
import { SaveAsTemplateModal } from './estimate/SaveAsTemplateModal';
import SignatureCanvas from 'react-signature-canvas';
import { EstimateLineItem } from '@/hooks/useEstimates';
import { useJobs } from '@/hooks/useJobs';
import { useContractorProfile } from '@/hooks/useContractorProfile';
import { useEstimateMacros } from '@/hooks/useEstimateMacros';
import { useEstimateTemplates, TRADES } from '@/hooks/useEstimateTemplates';
// Jobs are selected from existing jobs list
import EstimateAssistant from './EstimateAssistant';
import ScopeOfWorkSection from './estimate/ScopeOfWorkSection';
import TermsConditionsSection from './estimate/TermsConditionsSection';
import FinancialSummarySection from './estimate/FinancialSummarySection';
import LineItemsSection from './estimate/LineItemsSection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOpportunities } from '@/hooks/useOpportunities';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
const tradeTypes = [
  'General Remodel',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Painting',
  'HVAC',
  'Flooring',
  'Landscaping',
  'Other',
];

const categories = [
  'Materials',
  'Labor',
  'Equipment',
  'Subcontractor',
  'Overhead',
  'Contingency',
  'Fees',
];

const estimateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email('Invalid email').optional().or(z.literal('')),
  client_address: z.string().optional(),
  site_address: z.string().optional(),
  trade_type: z.string().optional(),
  project_description: z.string().optional(),
  assumptions_and_exclusions: z.string().optional(),
  valid_until: z.string().optional(),
  profit_markup_percentage: z.number().min(0).max(100),
  tax_and_fees: z.number().min(0),
});

type EstimateFormData = z.infer<typeof estimateSchema>;

interface EstimateFormProps {
  onSubmit: (data: any, isDraft: boolean) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function EstimateForm({ onSubmit, onCancel, initialData }: EstimateFormProps) {
  // Calculate default valid_until date (30 days from now)
  const getDefaultValidUntil = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([
    {
      category: 'Materials',
      item_description: '',
      quantity: 0,
      unit_type: '',
      unit_cost: 0,
      line_total: 0,
      included: true,
    },
  ]);

  const [tradeSpecific, setTradeSpecific] = useState<any>({});
  const [projectInfoOpen, setProjectInfoOpen] = useState(true);
  const [lineItemsOpen, setLineItemsOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [tradeSpecificOpen, setTradeSpecificOpen] = useState(false);

  // Scope of work state
  const [scopeObjective, setScopeObjective] = useState('');
  const [scopeKeyDeliverables, setScopeKeyDeliverables] = useState<string[]>([]);
  const [scopeExclusions, setScopeExclusions] = useState<string[]>([]);
  const [scopeTimeline, setScopeTimeline] = useState('');

  // Terms state
  const [validityDays, setValidityDays] = useState(30);
  const [paymentScheduleText, setPaymentScheduleText] = useState('');
  const [changeOrderText, setChangeOrderText] = useState('');
  const [insuranceText, setInsuranceText] = useState('');
  const [warrantyYears, setWarrantyYears] = useState(2);
  const [warrantyText, setWarrantyText] = useState('');

  // Financial state
  const [salesTaxRatePercent, setSalesTaxRatePercent] = useState(6.0);
  const [permitFeeSurcharge, setPermitFeeSurcharge] = useState(0);
  const [requiredDepositPercent, setRequiredDepositPercent] = useState(30.0);

  // Referred By
  const [referredBy, setReferredBy] = useState('');
  const [referredByOther, setReferredByOther] = useState('');
  
  // Same as customer checkbox
  const [sameAsCustomer, setSameAsCustomer] = useState(false);

  const referralOptions = [
    'Google',
    'Social Media',
    'CT1',
    'Friend',
    'Former Customer',
    'Family Member',
    'Other',
  ];

  // Signature printed names and acceptance dates
  const [contractorPrintedName, setContractorPrintedName] = useState('');
  const [clientPrintedName, setClientPrintedName] = useState('');
  const [contractorAcceptanceDate, setContractorAcceptanceDate] = useState('');
  const [clientAcceptanceDate, setClientAcceptanceDate] = useState('');

  // Jobs
  const { jobs } = useJobs();
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(undefined);

  // Contractor profile for defaults
  const { profile, getEstimateDefaults, getBusinessInfo } = useContractorProfile();

  // Estimate macros
  const { macroGroups, textMacros } = useEstimateMacros();

  // Estimate templates
  const { templates } = useEstimateTemplates();
  const [templateSearchOpen, setTemplateSearchOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateComboOpen, setTemplateComboOpen] = useState(false);

  // Opportunities for job location
  const { opportunities } = useOpportunities();
  const [sameAsJobLocation, setSameAsJobLocation] = useState(false);

  // Template modals (legacy)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  const contractorSigRef = useRef<SignatureCanvas>(null);
  const clientSigRef = useRef<SignatureCanvas>(null);

  // Handler for adding template line items
  const handleAddTemplateItems = (templateLineItems: EstimateLineItem[]) => {
    setLineItems([...lineItems, ...templateLineItems]);
  };
  // Load profile defaults on mount
  useEffect(() => {
    if (profile && !initialData) {
      const defaults = getEstimateDefaults();
      setSalesTaxRatePercent(defaults.salesTaxRate);
      setRequiredDepositPercent(defaults.depositPercent);
      setWarrantyYears(defaults.warrantyYears);
    }
  }, [profile]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      title: '',
      client_name: '',
      client_email: '',
      client_address: '',
      site_address: '',
      trade_type: '',
      project_description: '',
      assumptions_and_exclusions: '',
      valid_until: getDefaultValidUntil(),
      profit_markup_percentage: 15,
      tax_and_fees: 0,
    },
  });

  const tradeType = watch('trade_type');
  const profitMarkupPercentage = watch('profit_markup_percentage');
  const taxAndFees = watch('tax_and_fees');

  const tradeOptions = useMemo(() => {
    const base = [...tradeTypes];
    if (initialData?.trade_type && !base.includes(initialData.trade_type)) {
      return [initialData.trade_type, ...base];
    }
    return base;
  }, [initialData]);

  // Load initialData when it changes (for editing existing estimates)
  useEffect(() => {
    if (initialData) {
      // Reset form fields with proper typing
      const formData = {
        title: initialData.title || '',
        client_name: initialData.client_name || '',
        client_email: initialData.client_email || '',
        client_address: initialData.client_address || '',
        site_address: initialData.site_address || '',
        trade_type: initialData.trade_type || '',
        project_description: initialData.project_description || '',
        assumptions_and_exclusions: initialData.assumptions_and_exclusions || '',
        valid_until: initialData.valid_until || getDefaultValidUntil(),
        profit_markup_percentage: initialData.cost_summary?.profit_markup_percentage || 15,
        tax_and_fees: initialData.cost_summary?.tax_and_fees || 0,
      };
      
      reset(formData);
      
      // Explicitly set trade_type to ensure Select component updates
      if (initialData.trade_type) {
        setValue('trade_type', initialData.trade_type, { shouldValidate: true });
      }

      // Set the selected job if present
      if (initialData.job_id) {
        setSelectedJobId(initialData.job_id);
      }

      // Load line items
      if (initialData.line_items && initialData.line_items.length > 0) {
        setLineItems(initialData.line_items);
      } else {
        // Reset to default empty line item if no line items exist
        setLineItems([{
          category: 'Materials',
          item_description: '',
          quantity: 0,
          unit_type: '',
          unit_cost: 0,
          line_total: 0,
          included: true,
        }]);
      }

      // Load trade-specific data
      if (initialData.trade_specific) {
        setTradeSpecific(initialData.trade_specific);
      } else {
        setTradeSpecific({});
      }

      // Load scope of work
      setScopeObjective(initialData.scope_objective || '');
      setScopeKeyDeliverables(initialData.scope_key_deliverables || []);
      setScopeExclusions(initialData.scope_exclusions || []);
      setScopeTimeline(initialData.scope_timeline || '');

      // Load financial settings
      setSalesTaxRatePercent(initialData.sales_tax_rate_percent || initialData.tax_rate || 6.0);
      setPermitFeeSurcharge(initialData.permit_fee || 0);
      setRequiredDepositPercent(initialData.required_deposit_percent || 30.0);

      // Load terms
      setValidityDays(30);
      setPaymentScheduleText(initialData.terms_payment_schedule || '');
      setChangeOrderText(initialData.terms_change_orders || '');
      setInsuranceText(initialData.terms_insurance || '');
      setWarrantyYears(initialData.terms_warranty_years || 2);

      // Load referred by
      const savedReferredBy = initialData.referred_by || '';
      if (savedReferredBy && !referralOptions.includes(savedReferredBy)) {
        setReferredBy('Other');
        setReferredByOther(savedReferredBy);
      } else {
        setReferredBy(savedReferredBy);
        setReferredByOther('');
      }

      // Load signature printed names and dates
      setContractorPrintedName(initialData.contractor_printed_name || '');
      setClientPrintedName(initialData.client_printed_name || '');
      setContractorAcceptanceDate(initialData.contractor_acceptance_date || '');
      setClientAcceptanceDate(initialData.client_acceptance_date || '');

      // Load signatures if they exist
      if (initialData.contractor_signature && contractorSigRef.current) {
        contractorSigRef.current.fromDataURL(initialData.contractor_signature);
      }
      if (initialData.client_signature && clientSigRef.current) {
        clientSigRef.current.fromDataURL(initialData.client_signature);
      }
    } else {
      // Reset to defaults for new estimate
      reset({
        title: '',
        client_name: '',
        client_email: '',
        client_address: '',
        site_address: '',
        trade_type: '',
        project_description: '',
        assumptions_and_exclusions: '',
        valid_until: getDefaultValidUntil(),
        profit_markup_percentage: 15,
        tax_and_fees: 0,
      });
      setLineItems([{
        category: 'Materials',
        item_description: '',
        quantity: 0,
        unit_type: '',
        unit_cost: 0,
        line_total: 0,
        included: true,
      }]);
      setTradeSpecific({});
      setScopeObjective('');
      setScopeKeyDeliverables([]);
      setScopeExclusions([]);
      setScopeTimeline('');
      setReferredBy('');
      setContractorPrintedName('');
      setClientPrintedName('');
      setContractorAcceptanceDate('');
      setClientAcceptanceDate('');
      contractorSigRef.current?.clear();
      clientSigRef.current?.clear();
    }
  }, [initialData, reset]);

  // Auto-calculate line totals and cost summary
  const calculateTotals = () => {
    const materialsTotal = lineItems
      .filter(item => item.category === 'Materials' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const laborTotal = lineItems
      .filter(item => item.category === 'Labor' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const equipmentTotal = lineItems
      .filter(item => item.category === 'Equipment' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const subcontractorTotal = lineItems
      .filter(item => item.category === 'Subcontractor' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const overheadTotal = lineItems
      .filter(item => item.category === 'Overhead' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const contingencyTotal = lineItems
      .filter(item => item.category === 'Contingency' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);

    const subtotal = materialsTotal + laborTotal + equipmentTotal + 
                     subcontractorTotal + overheadTotal + contingencyTotal;
    
    const profitMarkupAmount = subtotal * (profitMarkupPercentage / 100);
    const grandTotal = subtotal + profitMarkupAmount + taxAndFees;

    return {
      materialsTotal,
      laborTotal,
      equipmentTotal,
      subcontractorTotal,
      overheadTotal,
      contingencyTotal,
      subtotal,
      profitMarkupAmount,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        category: 'Materials',
        item_description: '',
        quantity: 0,
        unit_type: '',
        unit_cost: 0,
        line_total: 0,
        included: true,
      },
    ]);
  };

  const updateLineItem = (index: number, field: keyof EstimateLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_cost') {
      updated[index].line_total = updated[index].quantity * updated[index].unit_cost;
    }
    
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const duplicateLineItem = (index: number) => {
    const itemToDuplicate = { ...lineItems[index] };
    setLineItems([...lineItems, itemToDuplicate]);
  };

  const handleAssistantData = (extractedData: any) => {
    console.log('Extracted data:', extractedData);

    // Populate basic fields
    if (extractedData.title) setValue('title', extractedData.title);
    if (extractedData.client_name) setValue('client_name', extractedData.client_name);
    if (extractedData.client_email) setValue('client_email', extractedData.client_email);
    if (extractedData.client_address) setValue('client_address', extractedData.client_address);
    if (extractedData.site_address) setValue('site_address', extractedData.site_address);
    if (extractedData.project_description) setValue('project_description', extractedData.project_description);
    if (extractedData.trade_type) setValue('trade_type', extractedData.trade_type);
    if (extractedData.assumptions_and_exclusions) setValue('assumptions_and_exclusions', extractedData.assumptions_and_exclusions);

    // Add line items
    if (extractedData.line_items && Array.isArray(extractedData.line_items)) {
      const newItems = extractedData.line_items.map((item: any) => ({
        category: item.category || 'Materials',
        item_description: item.item_description || item.description || '',
        quantity: item.quantity || 0,
        unit_type: item.unit_type || item.unit || '',
        unit_cost: item.unit_cost || item.material_cost || 0,
        line_total: (item.quantity || 0) * (item.unit_cost || item.material_cost || 0),
        included: true,
      }));
      setLineItems([...lineItems, ...newItems]);
    }
  };

  const handlePDFAction = async (mode: 'download' | 'preview') => {
    if (!initialData?.id) {
      toast.error('Please save the estimate first before viewing PDF');
      return;
    }

    try {
      toast.loading(mode === 'preview' ? 'Generating preview...' : 'Generating PDF...', { id: 'pdf-gen' });
      
      const { data, error } = await supabase.functions.invoke('generate-estimate-pdf', {
        body: {
          estimateId: initialData.id,
          includePaymentLink: true,
        },
      });

      if (error) throw error;

      if (data?.pdfBase64) {
        // Convert base64 to blob
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        
        if (mode === 'preview') {
          // Open PDF in new tab for preview
          window.open(url, '_blank');
          toast.success('PDF opened for review', { id: 'pdf-gen' });
        } else {
          // Download the PDF
          const link = document.createElement('a');
          link.href = url;
          const filename = `Estimate_${initialData.estimate_number || initialData.id}_${initialData.client_name?.replace(/\s+/g, '_')}.pdf`;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('PDF downloaded successfully', { id: 'pdf-gen' });
        }
      } else {
        throw new Error('PDF generation failed - no PDF data returned');
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message, { id: 'pdf-gen' });
    }
  };

  const handleDownloadPDF = () => handlePDFAction('download');
  const handlePreviewPDF = () => handlePDFAction('preview');

  const handleFormSubmit = (data: EstimateFormData, isDraft: boolean) => {
    // Calculate financial summary with new fields
    const salesTaxAmount = totals.subtotal * (salesTaxRatePercent / 100);
    const grandTotal = totals.subtotal + totals.profitMarkupAmount + salesTaxAmount + permitFeeSurcharge;
    const requiredDepositAmount = grandTotal * (requiredDepositPercent / 100);
    const balanceDue = grandTotal - requiredDepositAmount;

    const formData = {
      ...data,
      job_id: selectedJobId,
      line_items: lineItems,
      
      // Scope of work
      scope_objective: scopeObjective,
      scope_key_deliverables: scopeKeyDeliverables,
      scope_exclusions: scopeExclusions,
      scope_timeline: scopeTimeline,
      
      // Financial summary
      subtotal: totals.subtotal,
      sales_tax_rate_percent: salesTaxRatePercent,
      tax_rate: salesTaxRatePercent,
      tax_amount: salesTaxAmount,
      permit_fee: permitFeeSurcharge,
      grand_total: grandTotal,
      required_deposit_percent: requiredDepositPercent,
      required_deposit: requiredDepositAmount,
      balance_due: balanceDue,
      
      // Legacy cost_summary for backward compatibility
      cost_summary: {
        materials_total: totals.materialsTotal,
        labor_total: totals.laborTotal,
        equipment_total: totals.equipmentTotal,
        subcontractor_total: totals.subcontractorTotal,
        overhead_total: totals.overheadTotal,
        contingency_total: totals.contingencyTotal,
        subtotal: totals.subtotal,
        profit_markup_percentage: profitMarkupPercentage,
        profit_markup_amount: totals.profitMarkupAmount,
        tax_and_fees: salesTaxAmount + permitFeeSurcharge,
        grand_total: grandTotal,
      },
      
      // Terms
      terms_validity: `This estimate is valid for ${validityDays} days from date issued.`,
      terms_payment_schedule: paymentScheduleText,
      terms_change_orders: changeOrderText,
      terms_insurance: insuranceText,
      terms_warranty_years: warrantyYears,
      
      trade_specific: tradeSpecific,
      
      // Referred by
      referred_by: referredBy === 'Other' ? referredByOther : referredBy,
      
      // Signatures with printed names and dates
      contractor_signature: contractorSigRef.current?.toDataURL(),
      contractor_printed_name: contractorPrintedName,
      contractor_acceptance_date: contractorAcceptanceDate || (contractorSigRef.current && !contractorSigRef.current.isEmpty() ? new Date().toISOString().split('T')[0] : null),
      client_signature: clientSigRef.current?.toDataURL(),
      client_printed_name: clientPrintedName,
      client_acceptance_date: clientAcceptanceDate || (clientSigRef.current && !clientSigRef.current.isEmpty() ? new Date().toISOString().split('T')[0] : null),
      
      status: isDraft ? 'draft' : (initialData?.status || 'draft'),
      total_amount: grandTotal,
    };

    onSubmit(formData, isDraft);
  };

  // Autosave to localStorage
  useEffect(() => {
    const autoSaveData = {
      formData: watch(),
      lineItems,
      tradeSpecific,
    };
    localStorage.setItem('estimate_autosave', JSON.stringify(autoSaveData));
  }, [watch(), lineItems, tradeSpecific]);

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <form onSubmit={handleSubmit((data) => handleFormSubmit(data, false))} className="space-y-4">
          {/* AI Assistant Section */}
          <EstimateAssistant 
            onDataExtracted={handleAssistantData}
            currentFormData={watch()}
          />

          {/* Project Info Section */}
          <Collapsible open={projectInfoOpen} onOpenChange={setProjectInfoOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Project Information</CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${projectInfoOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Job selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="job">Job</Label>
                      <Select 
                        value={selectedJobId}
                        onValueChange={(id) => {
                          setSelectedJobId(id);
                          const job = jobs.find(j => j.id === id);
                          if (job) {
                            const addr = [job.address, job.city, job.state, job.zip_code]
                              .filter(Boolean)
                              .join(', ');
                            setValue('site_address', addr);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobs.map((j) => (
                            <SelectItem key={j.id} value={j.id}>
                              {j.job_number ? `${j.job_number} - ` : ''}{j.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Estimate Title *</Label>
                      <Input id="title" {...register('title')} />
                      {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="trade_type">Trade Type *</Label>
                      <Select 
                        onValueChange={(value) => setValue('trade_type', value, { shouldValidate: true })} 
                        value={watch('trade_type') || undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trade" />
                        </SelectTrigger>
                        <SelectContent>
                          {tradeOptions.map((trade) => (
                            <SelectItem key={trade} value={trade}>
                              {trade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.trade_type && <p className="text-sm text-destructive">{errors.trade_type.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Apply Template</Label>
                      <Popover open={templateComboOpen} onOpenChange={setTemplateComboOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={templateComboOpen}
                            className="w-full justify-between"
                          >
                            {selectedTemplateId
                              ? templates?.find((t) => t.id === selectedTemplateId)?.name || "Select template..."
                              : "Select template..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search templates..." />
                            <CommandList>
                              <CommandEmpty>No templates found.</CommandEmpty>
                              <CommandGroup>
                                {templates?.map((template) => (
                                  <CommandItem
                                    key={template.id}
                                    value={template.name}
                                    onSelect={() => {
                                      setSelectedTemplateId(template.id);
                                      setTemplateComboOpen(false);
                                      // Apply template line items
                                      if (template.line_items && template.line_items.length > 0) {
                                        setLineItems([...lineItems, ...template.line_items]);
                                        toast.success(`Template "${template.name}" applied with ${template.line_items.length} line items`);
                                      }
                                      // Set trade type from template if not already set
                                      if (!watch('trade_type') && template.trade) {
                                        setValue('trade_type', template.trade, { shouldValidate: true });
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTemplateId === template.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{template.name}</span>
                                      <span className="text-xs text-muted-foreground">{template.trade} • {template.line_items?.length || 0} items</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_name">Client Name *</Label>
                      <Input id="client_name" {...register('client_name')} />
                      {errors.client_name && <p className="text-sm text-destructive">{errors.client_name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_email">Client Email</Label>
                      <Input id="client_email" type="email" {...register('client_email')} />
                      {errors.client_email && <p className="text-sm text-destructive">{errors.client_email.message}</p>}
                    </div>

                    {/* Same as Job Location Checkbox */}
                    {selectedJobId && (
                      <div className="flex items-center gap-2 py-2">
                        <Checkbox 
                          id="same-as-job"
                          checked={sameAsJobLocation}
                          onCheckedChange={(checked) => {
                            setSameAsJobLocation(checked as boolean);
                            if (checked) {
                              // Get address from selected job
                              const job = jobs.find(j => j.id === selectedJobId);
                              if (job) {
                                const addr = [job.address, job.city, job.state, job.zip_code]
                                  .filter(Boolean)
                                  .join(', ');
                                setValue('client_address', addr);
                                setValue('site_address', addr);
                              }
                            } else {
                              setValue('client_address', '');
                              setValue('site_address', '');
                            }
                          }}
                        />
                        <Label htmlFor="same-as-job" className="text-sm font-medium cursor-pointer">
                          Same as job location
                        </Label>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="client_address">Client Address</Label>
                      <Input 
                        id="client_address" 
                        {...register('client_address')} 
                        disabled={sameAsJobLocation}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="site_address">Site Address</Label>
                      <Input 
                        id="site_address" 
                        {...register('site_address')} 
                        disabled={sameAsJobLocation}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valid_until">Valid Until</Label>
                      <Input id="valid_until" type="date" {...register('valid_until')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referred_by">Referred By</Label>
                      <Select
                        value={referredBy}
                        onValueChange={(value) => {
                          setReferredBy(value);
                          if (value !== 'Other') {
                            setReferredByOther('');
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select referral source" />
                        </SelectTrigger>
                        <SelectContent>
                          {referralOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {referredBy === 'Other' && (
                        <Input 
                          className="mt-2"
                          value={referredByOther}
                          onChange={(e) => setReferredByOther(e.target.value)}
                          placeholder="Please specify"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project_description">Project Description</Label>
                    <Textarea id="project_description" {...register('project_description')} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assumptions_and_exclusions">Assumptions & Exclusions</Label>
                    <Textarea id="assumptions_and_exclusions" {...register('assumptions_and_exclusions')} rows={3} />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Line Items Section */}
          <Collapsible open={lineItemsOpen} onOpenChange={setLineItemsOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Line Items</CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${lineItemsOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={item.category}
                            onValueChange={(value) => updateLineItem(index, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Description</Label>
                          <Input
                            value={item.item_description}
                            onChange={(e) => updateLineItem(index, 'item_description', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Input
                            value={item.unit_type}
                            onChange={(e) => updateLineItem(index, 'unit_type', e.target.value)}
                            placeholder="sq ft, hrs, units"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unit Cost</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => updateLineItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Line Total</Label>
                          <Input value={`$${item.line_total.toFixed(2)}`} disabled />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.included}
                            onCheckedChange={(checked) => updateLineItem(index, 'included', checked)}
                          />
                          <Label>Include</Label>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateLineItem(index)}
                        >
                          Duplicate
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addLineItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Cost Summary Section */}
          <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Cost Summary</CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Materials:</span>
                    <span className="font-semibold">${totals.materialsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labor:</span>
                    <span className="font-semibold">${totals.laborTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equipment:</span>
                    <span className="font-semibold">${totals.equipmentTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subcontractor:</span>
                    <span className="font-semibold">${totals.subcontractorTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead:</span>
                    <span className="font-semibold">${totals.overheadTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contingency:</span>
                    <span className="font-semibold">${totals.contingencyTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profit_markup_percentage">Profit Markup %</Label>
                      <Input
                        id="profit_markup_percentage"
                        type="number"
                        step="0.1"
                        {...register('profit_markup_percentage', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Profit Amount</Label>
                      <Input value={`$${totals.profitMarkupAmount.toFixed(2)}`} disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_and_fees">Tax & Fees</Label>
                    <Input
                      id="tax_and_fees"
                      type="number"
                      step="0.01"
                      {...register('tax_and_fees', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="border-t pt-3 flex justify-between text-lg">
                    <span className="font-bold">Grand Total:</span>
                    <span className="font-bold text-primary">${totals.grandTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Trade-Specific Fields */}
          {tradeType && tradeType !== 'Other' && (
            <Collapsible open={tradeSpecificOpen} onOpenChange={setTradeSpecificOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">{tradeType} Specific Fields</CardTitle>
                    <ChevronDown className={`h-5 w-5 transition-transform ${tradeSpecificOpen ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {tradeType === 'Roofing' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Roof Pitch</Label>
                          <Input
                            value={tradeSpecific.roof_pitch || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, roof_pitch: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tear-off Layers</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.tear_off_layers || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, tear_off_layers: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Shingle Type</Label>
                          <Input
                            value={tradeSpecific.shingle_type || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, shingle_type: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {tradeType === 'Painting' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Wall Area (sq ft)</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.wall_area_sqft || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, wall_area_sqft: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Coats</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.coats || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, coats: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Finish Type</Label>
                          <Input
                            value={tradeSpecific.finish_type || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, finish_type: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {tradeType === 'Electrical' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Number of Outlets</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.number_of_outlets || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, number_of_outlets: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Circuits</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.circuits || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, circuits: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox
                            checked={tradeSpecific.panel_upgrade || false}
                            onCheckedChange={(checked) => setTradeSpecific({ ...tradeSpecific, panel_upgrade: checked })}
                          />
                          <Label>Panel Upgrade</Label>
                        </div>
                      </div>
                    )}

                    {tradeType === 'Plumbing' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Fixtures Count</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.fixtures_count || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, fixtures_count: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pipe Type</Label>
                          <Input
                            value={tradeSpecific.pipe_type || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, pipe_type: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox
                            checked={tradeSpecific.under_slab_work || false}
                            onCheckedChange={(checked) => setTradeSpecific({ ...tradeSpecific, under_slab_work: checked })}
                          />
                          <Label>Under Slab Work</Label>
                        </div>
                      </div>
                    )}

                    {tradeType === 'General Remodel' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Demo Hours</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.demo_hours || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, demo_hours: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox
                            checked={tradeSpecific.structural_mods || false}
                            onCheckedChange={(checked) => setTradeSpecific({ ...tradeSpecific, structural_mods: checked })}
                          />
                          <Label>Structural Modifications</Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Finish Level</Label>
                          <Input
                            value={tradeSpecific.finish_level || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, finish_level: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Signatures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Signatures & Acceptance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contractor Signature Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-semibold text-lg">Contractor</h4>
                <div className="space-y-2">
                  <Label>Contractor Signature</Label>
                  <div className="border rounded-lg bg-white">
                    <SignatureCanvas
                      ref={contractorSigRef}
                      canvasProps={{ className: 'w-full h-32 bg-white rounded-lg' }}
                      onEnd={() => {
                        // Auto-fill acceptance date when signature is added
                        if (!contractorAcceptanceDate) {
                          setContractorAcceptanceDate(new Date().toISOString().split('T')[0]);
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      contractorSigRef.current?.clear();
                      setContractorAcceptanceDate('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractor_printed_name">Printed Name</Label>
                    <Input 
                      id="contractor_printed_name"
                      value={contractorPrintedName}
                      onChange={(e) => setContractorPrintedName(e.target.value)}
                      placeholder="Full legal name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractor_acceptance_date">Date of Acceptance</Label>
                    <Input 
                      id="contractor_acceptance_date"
                      type="date"
                      value={contractorAcceptanceDate}
                      onChange={(e) => setContractorAcceptanceDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Client Signature Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-semibold text-lg">Client</h4>
                <div className="space-y-2">
                  <Label>Client Signature</Label>
                  <div className="border rounded-lg bg-white">
                    <SignatureCanvas
                      ref={clientSigRef}
                      canvasProps={{ className: 'w-full h-32 bg-white rounded-lg' }}
                      onEnd={() => {
                        // Auto-fill acceptance date when signature is added
                        if (!clientAcceptanceDate) {
                          setClientAcceptanceDate(new Date().toISOString().split('T')[0]);
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clientSigRef.current?.clear();
                      setClientAcceptanceDate('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_printed_name">Printed Name</Label>
                    <Input 
                      id="client_printed_name"
                      value={clientPrintedName}
                      onChange={(e) => setClientPrintedName(e.target.value)}
                      placeholder="Full legal name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_acceptance_date">Date of Acceptance</Label>
                    <Input 
                      id="client_acceptance_date"
                      type="date"
                      value={clientAcceptanceDate}
                      onChange={(e) => setClientAcceptanceDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total and Actions */}
          <div className="bg-card border rounded-lg p-4 mt-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xl font-bold text-center sm:text-left">
                Grand Total: <span className="text-primary">${totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setTemplateSearchOpen(true)} className="w-full sm:w-auto">
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
                <Button type="button" variant="outline" onClick={() => setSaveTemplateOpen(true)} className="w-full sm:w-auto">
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Save as Template
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                  Cancel
                </Button>
                {initialData?.id && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviewPDF}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadPDF}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSubmit((data) => handleFormSubmit(data, true))}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Template Modals */}
      <TemplateSearchModal 
        open={templateSearchOpen}
        onOpenChange={setTemplateSearchOpen}
        onSelectTemplate={handleAddTemplateItems}
      />
      <SaveAsTemplateModal
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        lineItems={lineItems}
        defaultName={watch('title')}
        defaultTrade={watch('trade_type') || 'General Contracting'}
      />
    </ScrollArea>
  );
}

