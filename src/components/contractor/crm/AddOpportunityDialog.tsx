import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Plus } from 'lucide-react';
import { OpportunityStage, LeadSource } from '@/hooks/useOpportunities';

interface AddOpportunityDialogProps {
  onAdd: (opportunityData: any) => Promise<any>;
}

export function AddOpportunityDialog({ onAdd }: AddOpportunityDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    job_address: '',
    trade_type: '',
    lead_source: 'other' as LeadSource,
    estimated_value: '',
    estimated_close_date: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const opportunityData = {
      ...formData,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
      stage: 'qualification' as OpportunityStage,
      probability_percent: 10,
      probability_override: false,
      budget_confirmed: false,
    };

    await onAdd(opportunityData);
    setOpen(false);
    setFormData({
      title: '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      job_address: '',
      trade_type: '',
      lead_source: 'other',
      estimated_value: '',
      estimated_close_date: '',
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Opportunity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[calc(100vh-5rem)] top-[45%] sm:top-[50%] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pb-20">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Opportunity Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Kitchen Remodel - Smith Residence"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="job_address">Job Address</Label>
              <AddressAutocomplete
                value={formData.job_address}
                onChange={(value) => setFormData({ ...formData, job_address: value })}
                placeholder="Start typing an address..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade_type">Trade Type *</Label>
              <SearchableSelect
                value={formData.trade_type}
                onValueChange={(value) => setFormData({ ...formData, trade_type: value })}
                placeholder="Select trade"
                searchPlaceholder="Search trades..."
                options={[
                  { value: 'plumbing', label: 'Plumbing' },
                  { value: 'electrical', label: 'Electrical' },
                  { value: 'hvac', label: 'HVAC' },
                  { value: 'roofing', label: 'Roofing' },
                  { value: 'concrete', label: 'Concrete' },
                  { value: 'landscaping', label: 'Landscaping' },
                  { value: 'carpentry', label: 'Carpentry' },
                  { value: 'painting', label: 'Painting' },
                  { value: 'general', label: 'General Contractor' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_source">Lead Source</Label>
              <SearchableSelect
                value={formData.lead_source}
                onValueChange={(value) => setFormData({ ...formData, lead_source: value as LeadSource })}
                placeholder="Select source"
                searchPlaceholder="Search sources..."
                options={[
                  { value: 'referral', label: 'Referral' },
                  { value: 'website', label: 'Website' },
                  { value: 'ad', label: 'Advertisement' },
                  { value: 'repeat_customer', label: 'Repeat Customer' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_value">Estimated Value ($)</Label>
              <Input
                id="estimated_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                placeholder="5000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_close_date">Expected Close Date</Label>
              <Input
                id="estimated_close_date"
                type="date"
                value={formData.estimated_close_date}
                onChange={(e) => setFormData({ ...formData, estimated_close_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information about this opportunity..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Opportunity</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
