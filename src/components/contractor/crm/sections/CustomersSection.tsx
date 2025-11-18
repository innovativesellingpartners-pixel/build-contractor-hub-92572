import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Mail, MapPin, Briefcase, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import AddCustomerDialog from '../AddCustomerDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomersSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function CustomersSection({ onSectionChange }: CustomersSectionProps) {
  const { customers, loading } = useCustomers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [convertingCustomer, setConvertingCustomer] = useState<any>(null);

  const handleConvertToJob = async () => {
    if (!convertingCustomer) return;

    try {
      toast.loading('Creating job from customer...', { id: 'convert-customer' });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a new job from the customer
      const { data: newJob, error: jobError } = await supabase
        .from('jobs')
        .insert([{
          name: `Job for ${convertingCustomer.name}`,
          user_id: user.id,
          customer_id: convertingCustomer.id,
          address: convertingCustomer.address || null,
          city: convertingCustomer.city || null,
          state: convertingCustomer.state || null,
          zip_code: convertingCustomer.zip_code || null,
          status: 'scheduled',
          notes: convertingCustomer.notes || null,
        }])
        .select()
        .single();

      if (jobError) throw jobError;

      toast.success('Job created successfully!', { id: 'convert-customer' });
      setConvertingCustomer(null);

      // Navigate to jobs section if available
      if (onSectionChange) {
        setTimeout(() => onSectionChange('jobs'), 500);
      }
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job: ' + error.message, { id: 'convert-customer' });
    }
  };

  if (loading) {
    return <div className="p-6">Loading customers...</div>;
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Customers</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onSectionChange?.('dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Contractor Hub</span>
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg truncate">{customer.name}</CardTitle>
                  {customer.company && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{customer.company}</p>
                  )}
                </div>
                <Badge variant={customer.customer_type === 'commercial' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                  {customer.customer_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
              {customer.phone && (
                <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${customer.phone}`} className="hover:underline truncate">
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:underline truncate">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-xs sm:text-sm min-w-0">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="line-clamp-2">
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.state && `, ${customer.state}`}
                  </span>
                </div>
              )}
              <div className="pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setConvertingCustomer(customer)}
                  className="w-full"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Create Job</span>
                </Button>
              </div>
            </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AddCustomerDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Convert to Job Dialog */}
      <AlertDialog open={!!convertingCustomer} onOpenChange={() => setConvertingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Job for Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new job for {convertingCustomer?.name}. You can add more details to the job later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertToJob}>
              Create Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
