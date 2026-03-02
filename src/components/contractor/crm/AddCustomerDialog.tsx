import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationAutocomplete, AddressData } from '@/components/ui/location-autocomplete';
import { Customer, useCustomers } from '@/hooks/useCustomers';
import { VoiceInputField } from '@/components/ui/voice-input-field';
import { VoiceTextareaField } from '@/components/ui/voice-textarea-field';
import { Save } from 'lucide-react';
import { useFormDraftRHF } from '@/hooks/useFormDraft';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  customer_type: z.enum(['residential', 'commercial']),
  referral_source: z.string().optional(),
  referral_source_other: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const CUSTOMER_DEFAULTS: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  customer_type: 'residential',
  referral_source: '',
  referral_source_other: '',
  notes: '',
};

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated?: (customer: Customer) => void;
}

export default function AddCustomerDialog({ open, onOpenChange, onCustomerCreated }: AddCustomerDialogProps) {
  const { addCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const { savedValues, clearDraft, saveDraft, hasDraft } = useFormDraftRHF('add-customer', CUSTOMER_DEFAULTS);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: savedValues || CUSTOMER_DEFAULTS,
  });

  // Watch form values and save draft
  const watchedValues = form.watch();
  useEffect(() => {
    saveDraft(watchedValues);
  }, [watchedValues, saveDraft]);

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      // Ensure required fields are present
      const customerData = {
        name: data.name,
        customer_type: data.customer_type,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        zip_code: data.zip_code || undefined,
        referral_source: data.referral_source || undefined,
        referral_source_other: data.referral_source_other || undefined,
        notes: data.notes || undefined,
      };
      const newCustomer = await addCustomer(customerData);
      form.reset(CUSTOMER_DEFAULTS);
      clearDraft();
      setShowOtherInput(false);
      
      // Navigate to the newly created customer
      if (newCustomer && onCustomerCreated) {
        onCustomerCreated(newCustomer);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Enter customer information to add them to your database
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <VoiceInputField 
                        {...field} 
                        placeholder="John Doe"
                        onVoiceInput={(text) => form.setValue('name', text)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select type"
                        searchPlaceholder="Search type..."
                        options={[
                          { value: 'residential', label: 'Residential' },
                          { value: 'commercial', label: 'Commercial' },
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <VoiceInputField 
                        {...field} 
                        type="email" 
                        placeholder="john@example.com"
                        onVoiceInput={(text) => form.setValue('email', text)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <VoiceInputField 
                        {...field} 
                        placeholder="(555) 123-4567"
                        onVoiceInput={(text) => form.setValue('phone', text)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referral_source"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Referred By / How did you hear about us?</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setShowOtherInput(value === 'Other');
                          if (value !== 'Other') {
                            form.setValue('referral_source_other', '');
                          }
                        }}
                        placeholder="Select source"
                        searchPlaceholder="Search sources..."
                        options={[
                          { value: 'Google', label: 'Google' },
                          { value: 'Facebook', label: 'Facebook' },
                          { value: 'Social Media', label: 'Social Media' },
                          { value: 'CT1', label: 'CT1' },
                          { value: 'Friend', label: 'Friend' },
                          { value: 'Former Customer', label: 'Former Customer' },
                          { value: 'Family Member', label: 'Family Member' },
                          { value: 'Other', label: 'Other' },
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showOtherInput && (
                <FormField
                  control={form.control}
                  name="referral_source_other"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Please specify</FormLabel>
                      <FormControl>
                        <VoiceInputField 
                          {...field} 
                          placeholder="Enter custom referral source"
                          onVoiceInput={(text) => form.setValue('referral_source_other', text)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <LocationAutocomplete
                        value={field.value || ''}
                        onChange={field.onChange}
                        onAddressSelect={(data: AddressData) => {
                          form.setValue('address', data.address1);
                          form.setValue('city', data.city);
                          form.setValue('state', data.state);
                          form.setValue('zip_code', data.postalCode);
                        }}
                        placeholder="Start typing an address..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <VoiceInputField 
                        {...field} 
                        placeholder="New York"
                        onVoiceInput={(text) => form.setValue('city', text)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <VoiceInputField 
                        {...field} 
                        placeholder="NY"
                        onVoiceInput={(text) => form.setValue('state', text)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code</FormLabel>
                    <FormControl>
                      <VoiceInputField 
                        {...field} 
                        placeholder="10001"
                        onVoiceInput={(text) => form.setValue('zip_code', text)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <VoiceTextareaField 
                      {...field} 
                      rows={3} 
                      placeholder="Any additional notes..."
                      onVoiceInput={(text) => form.setValue('notes', text)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Customer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
