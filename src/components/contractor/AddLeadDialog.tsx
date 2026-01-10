import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Plus } from 'lucide-react';
import { Lead, LeadSource, OTHER_SOURCE_ID } from '@/hooks/useLeads';
import { AIScopeNotes } from '@/components/contractor/crm/AIScopeNotes';

interface AddLeadDialogProps {
  onAdd: (leadData: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  sources: LeadSource[];
}

export function AddLeadDialog({ onAdd, sources }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  const isOtherSource = formData.source_id === OTHER_SOURCE_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAdd({
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
      <DialogContent className="max-w-2xl h-[calc(100vh-5rem)] top-[45%] sm:top-[50%] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>Enter the details of your new lead</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_type">Project Type</Label>
              <Input
                id="project_type"
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                placeholder="e.g., Kitchen Remodel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Estimated Value</Label>
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
              />
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
                  { value: 'won', label: 'Won' },
                  { value: 'lost', label: 'Lost' },
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
                <Input
                  id="source_other"
                  value={formData.source_other}
                  onChange={(e) => setFormData({ ...formData, source_other: e.target.value })}
                  placeholder="Where did they hear about you?"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <AddressAutocomplete
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              onAddressParsed={(parsed) => {
                setFormData(prev => ({
                  ...prev,
                  address: parsed.street,
                  city: parsed.city,
                  state: parsed.state,
                  zip_code: parsed.zipCode,
                }));
              }}
              placeholder="Start typing an address..."
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                maxLength={2}
                placeholder="CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">Zip Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </div>
          </div>
          {/* AI Scope Notes */}
          <AIScopeNotes
            notes={formData.notes}
            onNotesChange={(notes) => setFormData({ ...formData, notes })}
            label="Lead Notes"
            placeholder="Record your initial conversation or type notes about the project"
          />
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