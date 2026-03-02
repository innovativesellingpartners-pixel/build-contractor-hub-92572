import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationAutocomplete, AddressData } from '@/components/ui/location-autocomplete';
import { Plus, Save } from 'lucide-react';
import { Lead, LeadSource, OTHER_SOURCE_ID } from '@/hooks/useLeads';
import { VoiceInputField } from '@/components/ui/voice-input-field';
import { useFormDraft } from '@/hooks/useFormDraft';

const LEAD_DEFAULTS = {
  name: '',
  email: '',
  phone: '',
  company: '',
  project_type: '',
  value: '',
  status: 'new' as Lead['status'],
  source_id: '',
  source_other: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  notes: '',
};

interface AddLeadDialogProps {
  onAdd: (leadData: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  sources: LeadSource[];
  onLeadCreated?: (lead: Lead) => void;
}

export function AddLeadDialog({ onAdd, sources, onLeadCreated }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData, clearDraft, hasDraft] = useFormDraft('add-lead', LEAD_DEFAULTS);

  const isOtherSource = formData.source_id === OTHER_SOURCE_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLead = await onAdd({
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined,
        source_id: formData.source_id || undefined,
        source_other: isOtherSource ? formData.source_other : undefined,
      });
      setOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        project_type: '',
        value: '',
        status: 'new',
        source_id: '',
        source_other: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        notes: '',
      });
      
      // Navigate to the newly created lead
      if (newLead && onLeadCreated) {
        onLeadCreated(newLead);
      }
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full h-full max-w-full max-h-full rounded-none border-0 overflow-hidden flex flex-col fixed inset-0 translate-x-0 translate-y-0 top-0 left-0">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>Enter the details of your new lead</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <VoiceInputField
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, name: text })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <VoiceInputField
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, email: text })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <VoiceInputField
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, phone: text })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_type">Project Type</Label>
              <VoiceInputField
                id="project_type"
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, project_type: text })}
                placeholder="e.g., Kitchen Remodel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Estimated Value</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="value"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={formData.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow empty, digits, and one decimal point
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setFormData({ ...formData, value: val });
                    }
                  }}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <SearchableSelect
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Lead['status'] })}
                placeholder="Select status"
                searchPlaceholder="Search status..."
                options={[
                  { value: 'new', label: 'New' },
                  { value: 'contacted', label: 'Contacted' },
                  { value: 'qualified', label: 'Qualified' },
                  { value: 'quoted', label: 'Quoted' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Lead Source</Label>
              <SearchableSelect
                value={formData.source_id}
                onValueChange={(value) => setFormData({ ...formData, source_id: value, source_other: value !== OTHER_SOURCE_ID ? '' : formData.source_other })}
                placeholder="Select a source"
                searchPlaceholder="Search sources..."
                options={sources.map((source) => ({
                  value: source.id,
                  label: source.name,
                }))}
              />
            </div>
            {isOtherSource && (
              <div className="space-y-2">
                <Label htmlFor="source_other">Please Specify</Label>
                <VoiceInputField
                  id="source_other"
                  value={formData.source_other}
                  onChange={(e) => setFormData({ ...formData, source_other: e.target.value })}
                  onVoiceInput={(text) => setFormData({ ...formData, source_other: text })}
                  placeholder="Where did they hear about you?"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <LocationAutocomplete
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              onAddressSelect={(data: AddressData) => {
                setFormData(prev => ({
                  ...prev,
                  address: data.address1,
                  city: data.city,
                  state: data.state,
                  zip_code: data.postalCode,
                }));
              }}
              placeholder="Start typing an address..."
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="city">City</Label>
              <VoiceInputField
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, city: text })}
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label htmlFor="state">State</Label>
              <VoiceInputField
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, state: text })}
                maxLength={2}
                placeholder="CA"
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label htmlFor="zip_code">Zip Code</Label>
              <VoiceInputField
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, zip_code: text })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Lead Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes about the project"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Lead</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}