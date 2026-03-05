import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationAutocomplete, AddressData } from '@/components/ui/location-autocomplete';
import { User, MapPin, Mail, Phone, Building2, Save, X, StickyNote } from 'lucide-react';
import { Customer, useCustomers } from '@/hooks/useCustomers';

interface EditCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCustomerDialog({ customer, open, onOpenChange }: EditCustomerDialogProps) {
  const { updateCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    customer_type: 'residential' as 'residential' | 'commercial',
    notes: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        customer_type: customer.customer_type || 'residential',
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setIsSubmitting(true);
    try {
      await updateCustomer(customer.id, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip_code: formData.zip_code || undefined,
        customer_type: formData.customer_type,
        notes: formData.notes || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full rounded-none border-0 overflow-hidden flex flex-col fixed inset-0 translate-x-0 translate-y-0 top-0 left-0 p-0">
        {/* Sticky header */}
        <div className="flex-shrink-0 bg-card border-b px-4 py-3 md:px-6 md:py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg md:text-xl font-bold">Edit Customer</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">Update customer information</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="gap-1.5">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button type="submit" form="edit-customer-form" size="sm" disabled={isSubmitting} className="gap-1.5">
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        <form id="edit-customer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-5">
            
            {/* Contact Information Card */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Contact Information</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Full Name *</Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Smith"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Customer Type</Label>
                    <SearchableSelect
                      value={formData.customer_type}
                      onValueChange={(value) => setFormData({ ...formData, customer_type: value as 'residential' | 'commercial' })}
                      placeholder="Select type"
                      searchPlaceholder="Search..."
                      options={[
                        { value: 'residential', label: 'Residential' },
                        { value: 'commercial', label: 'Commercial' },
                      ]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="h-9 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="h-9 pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company name (optional)"
                      className="h-9 pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Address</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Street Address</Label>
                  <LocationAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({ ...formData, address: value })}
                    onAddressSelect={(data) => {
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
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-3 space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">City</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-9" />
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">State</Label>
                    <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} maxLength={2} className="h-9" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Zip</Label>
                    <Input value={formData.zip_code} onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })} className="h-9" />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                <StickyNote className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Notes</span>
              </div>
              <div className="p-4">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional notes about this customer..."
                  className="resize-none"
                />
              </div>
            </div>

            {/* Bottom save bar for mobile */}
            <div className="flex justify-end gap-2 pt-2 pb-4 md:hidden">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 gap-1.5">
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
