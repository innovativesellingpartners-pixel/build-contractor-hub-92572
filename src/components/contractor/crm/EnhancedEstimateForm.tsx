import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Copy, X, Eye } from "lucide-react";
import { Estimate, EstimateLineItem } from "@/hooks/useEstimates";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const estimateSchema = z.object({
  // Header
  project_name: z.string().min(1, "Project name is required"),
  prepared_by: z.string().optional(),
  referred_by: z.string().optional(),
  
  // Client
  client_name: z.string().min(1, "Client name is required"),
  client_phone: z.string().optional(),
  client_email: z.string().email().optional().or(z.literal("")),
  project_address: z.string().optional(),
  
  // Scope
  scope_objective: z.string().optional(),
  scope_timeline: z.string().optional(),
  
  // Financial
  tax_rate: z.number().min(0).max(100).default(0),
  permit_fee: z.number().min(0).default(0),
  
  // Terms
  terms_validity: z.string().optional(),
  terms_payment_schedule: z.string().optional(),
  terms_change_orders: z.string().optional(),
  terms_insurance: z.string().optional(),
  terms_warranty_years: z.number().min(0).default(2),
  
  // Signature
  contractor_printed_name: z.string().optional(),
});

type EstimateFormData = z.infer<typeof estimateSchema>;

interface EnhancedEstimateFormProps {
  onSubmit: (data: Estimate, sendImmediately?: boolean) => Promise<void>;
  onCancel: () => void;
  initialData?: Estimate;
}

export function EnhancedEstimateForm({ onSubmit, onCancel, initialData }: EnhancedEstimateFormProps) {
  const [activeTab, setActiveTab] = useState("header");
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState("");
  const [newExclusion, setNewExclusion] = useState("");

  const form = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      project_name: "",
      prepared_by: "",
      referred_by: "",
      client_name: "",
      client_phone: "",
      client_email: "",
      project_address: "",
      scope_objective: "",
      scope_timeline: "",
      tax_rate: 0,
      permit_fee: 0,
      terms_validity: "This estimate is valid for 30 days from the date of issue.",
      terms_payment_schedule: "30% deposit required to begin work, 40% upon completion of rough work, 30% upon final completion.",
      terms_change_orders: "Any changes to the scope of work must be documented in writing and may result in additional charges.",
      terms_insurance: "Contractor carries general liability insurance. Certificate of insurance available upon request.",
      terms_warranty_years: 2,
      contractor_printed_name: "",
    },
  });

  // Load initial data
  useEffect(() => {
    if (initialData) {
      form.reset({
        project_name: initialData.project_name || initialData.title || "",
        prepared_by: initialData.prepared_by || "",
        referred_by: initialData.referred_by || "",
        client_name: initialData.client_name || "",
        client_phone: initialData.client_phone || "",
        client_email: initialData.client_email || "",
        project_address: initialData.project_address || initialData.site_address || "",
        scope_objective: initialData.scope_objective || "",
        scope_timeline: initialData.scope_timeline || "",
        tax_rate: initialData.tax_rate || 0,
        permit_fee: initialData.permit_fee || 0,
        terms_validity: initialData.terms_validity || form.getValues("terms_validity"),
        terms_payment_schedule: initialData.terms_payment_schedule || form.getValues("terms_payment_schedule"),
        terms_change_orders: initialData.terms_change_orders || form.getValues("terms_change_orders"),
        terms_insurance: initialData.terms_insurance || form.getValues("terms_insurance"),
        terms_warranty_years: initialData.terms_warranty_years || 2,
        contractor_printed_name: initialData.contractor_printed_name || "",
      });

      if (initialData.line_items) {
        setLineItems(initialData.line_items as EstimateLineItem[]);
      }
      if (initialData.scope_key_deliverables) {
        setDeliverables(initialData.scope_key_deliverables);
      }
      if (initialData.scope_exclusions) {
        setExclusions(initialData.scope_exclusions);
      }
    }
  }, [initialData]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        itemNumber: `${lineItems.length + 1}`,
        description: "",
        quantity: 1,
        unit: "EA",
        unitPrice: 0,
        totalPrice: 0,
        included: true,
      },
    ]);
  };

  const updateLineItem = (index: number, field: keyof EstimateLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate total price
    if (field === "quantity" || field === "unitPrice") {
      const qty = field === "quantity" ? value : updated[index].quantity;
      const price = field === "unitPrice" ? value : updated[index].unitPrice || 0;
      updated[index].totalPrice = qty * price;
    }
    
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const duplicateLineItem = (index: number) => {
    const item = { ...lineItems[index], itemNumber: `${lineItems.length + 1}` };
    setLineItems([...lineItems, item]);
  };

  const calculateFinancials = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const taxRate = form.getValues("tax_rate") || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const permitFee = form.getValues("permit_fee") || 0;
    const grandTotal = subtotal + taxAmount + permitFee;
    const requiredDeposit = grandTotal * 0.3;
    const balanceDue = grandTotal - requiredDeposit;

    return { subtotal, taxAmount, grandTotal, requiredDeposit, balanceDue };
  };

  const handlePreviewPDF = async () => {
    if (!initialData?.id) {
      toast.error('Please save the estimate first before viewing PDF');
      return;
    }

    try {
      toast.loading('Generating preview...', { id: 'pdf-preview' });
      
      const { data, error } = await supabase.functions.invoke('generate-estimate-pdf', {
        body: {
          estimateId: initialData.id,
          includePaymentLink: true,
        },
      });

      if (error) throw error;

      if (data?.pdfBase64) {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success('PDF opened for review', { id: 'pdf-preview' });
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message, { id: 'pdf-preview' });
    }
  };


  const handleSubmit = async (sendImmediately = false) => {
    const formData = form.getValues();
    const financials = calculateFinancials();

    const estimateData: Estimate = {
      ...initialData,
      title: formData.project_name,
      project_name: formData.project_name,
      prepared_by: formData.prepared_by,
      referred_by: formData.referred_by,
      client_name: formData.client_name,
      client_phone: formData.client_phone,
      client_email: formData.client_email,
      project_address: formData.project_address,
      site_address: formData.project_address,
      scope_objective: formData.scope_objective,
      scope_key_deliverables: deliverables,
      scope_exclusions: exclusions,
      scope_timeline: formData.scope_timeline,
      line_items: lineItems,
      subtotal: financials.subtotal,
      tax_rate: formData.tax_rate,
      tax_amount: financials.taxAmount,
      permit_fee: formData.permit_fee,
      grand_total: financials.grandTotal,
      total_amount: financials.grandTotal,
      required_deposit: financials.requiredDeposit,
      balance_due: financials.balanceDue,
      terms_validity: formData.terms_validity,
      terms_payment_schedule: formData.terms_payment_schedule,
      terms_change_orders: formData.terms_change_orders,
      terms_insurance: formData.terms_insurance,
      terms_warranty_years: formData.terms_warranty_years,
      contractor_printed_name: formData.contractor_printed_name,
      status: sendImmediately ? "sent" : "draft",
      date_issued: new Date().toISOString(),
    };

    await onSubmit(estimateData, sendImmediately);
  };

  const { subtotal, taxAmount, grandTotal, requiredDeposit, balanceDue } = calculateFinancials();

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="scope">Scope</TabsTrigger>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
            </TabsList>

            <TabsContent value="header" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project & Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Name *</Label>
                      <Input {...form.register("project_name")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Prepared By</Label>
                      <Input {...form.register("prepared_by")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Name *</Label>
                      <Input {...form.register("client_name")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Phone</Label>
                      <Input {...form.register("client_phone")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Email</Label>
                      <Input type="email" {...form.register("client_email")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Referred By</Label>
                      <Input {...form.register("referred_by")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Project Address</Label>
                    <Textarea {...form.register("project_address")} rows={2} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scope" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scope of Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Objective</Label>
                    <Textarea {...form.register("scope_objective")} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label>Key Deliverables</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newDeliverable}
                        onChange={(e) => setNewDeliverable(e.target.value)}
                        placeholder="Add a deliverable"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newDeliverable.trim()) {
                              setDeliverables([...deliverables, newDeliverable.trim()]);
                              setNewDeliverable("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newDeliverable.trim()) {
                            setDeliverables([...deliverables, newDeliverable.trim()]);
                            setNewDeliverable("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <ul className="space-y-2 mt-2">
                      {deliverables.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="flex-1">{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeliverables(deliverables.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <Label>Exclusions</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newExclusion}
                        onChange={(e) => setNewExclusion(e.target.value)}
                        placeholder="Add an exclusion"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newExclusion.trim()) {
                              setExclusions([...exclusions, newExclusion.trim()]);
                              setNewExclusion("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newExclusion.trim()) {
                            setExclusions([...exclusions, newExclusion.trim()]);
                            setNewExclusion("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <ul className="space-y-2 mt-2">
                      {exclusions.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="flex-1">{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setExclusions(exclusions.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <Label>Timeline</Label>
                    <Textarea {...form.register("scope_timeline")} rows={2} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Line Items</CardTitle>
                    <Button type="button" onClick={addLineItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lineItems.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Item #{item.itemNumber}</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateLineItem(index)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                              value={item.description || ""}
                              onChange={(e) => updateLineItem(index, "description", e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Input
                              value={item.unit || ""}
                              onChange={(e) => updateLineItem(index, "unit", e.target.value)}
                              placeholder="EA, SF, LF, etc."
                            />
                          </div>
                          <div>
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice || 0}
                              onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <Input value={`$${(item.totalPrice || 0).toFixed(2)}`} disabled />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register("tax_rate", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Permit/Fee Surcharge</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register("permit_fee", { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 bg-muted p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Permit Fee:</span>
                      <span className="font-semibold">${form.watch("permit_fee")?.toFixed(2) || "0.00"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Grand Total:</span>
                      <span>${grandTotal.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-primary">
                      <span>Required Deposit (30%):</span>
                      <span className="font-semibold">${requiredDeposit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balance Due:</span>
                      <span className="font-semibold">${balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Validity</Label>
                    <Textarea {...form.register("terms_validity")} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Schedule</Label>
                    <Textarea {...form.register("terms_payment_schedule")} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Change Orders</Label>
                    <Textarea {...form.register("terms_change_orders")} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance</Label>
                    <Textarea {...form.register("terms_insurance")} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Warranty Years</Label>
                    <Input type="number" {...form.register("terms_warranty_years", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contractor Printed Name</Label>
                    <Input {...form.register("contractor_printed_name")} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <div className="border-t p-4 bg-background">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Grand Total: </span>
            <span className="font-bold text-lg">${grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {initialData?.id && (
              <Button variant="outline" onClick={handlePreviewPDF}>
                <Eye className="h-4 w-4 mr-2" />
                Review PDF
              </Button>
            )}
            <Button variant="outline" onClick={() => handleSubmit(false)}>
              Save Draft
            </Button>
            <Button onClick={() => handleSubmit(true)}>
              Save & Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
