import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { useEstimates } from '@/hooks/useEstimates';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Mail, MapPin, Briefcase, Home, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
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
  const { estimates } = useEstimates();
  const { jobs } = useJobs();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [convertingCustomer, setConvertingCustomer] = useState<any>(null);

  const handleConvertToJob = async () => {
    if (!convertingCustomer) return;

    try {
      toast.loading('Creating job from customer...', { id: 'convert-customer' });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find linked estimate for this customer to get pricing
      const linkedEstimate = estimates?.find(e => e.customer_id === convertingCustomer.id);

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
          contract_value: linkedEstimate?.grand_total || linkedEstimate?.total_amount || 0,
          original_estimate_id: linkedEstimate?.id || null,
        }])
        .select()
        .single();

      if (jobError) throw jobError;

      // Update the estimate to link to this job
      if (linkedEstimate) {
        await supabase
          .from('estimates')
          .update({ job_id: newJob.id, status: 'sold' })
          .eq('id', linkedEstimate.id);
      }

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

  // Get linked data for each customer
  const getCustomerData = (customer: any) => {
    const linkedEstimate = estimates?.find(e => e.customer_id === customer.id);
    const linkedJobs = jobs?.filter(j => j.customer_id === customer.id) || [];
    return { linkedEstimate, linkedJobs };
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

        {/* Sales Flow Indicator */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
              <Badge variant="outline">Lead</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline">Estimate</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="default" className="bg-primary">Customer</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline">Job</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline">PSFU</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => {
            const { linkedEstimate, linkedJobs } = getCustomerData(customer);
            
            return (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">{customer.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
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

                  {/* Linked Records */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {linkedEstimate && (
                      <Badge 
                        variant="outline" 
                        className="gap-1 cursor-pointer hover:bg-muted"
                        onClick={() => onSectionChange?.('estimates')}
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <FileText className="h-3 w-3" />
                        Estimate
                      </Badge>
                    )}
                    {linkedJobs.length > 0 && (
                      <Badge 
                        variant="outline" 
                        className="gap-1 cursor-pointer hover:bg-muted border-green-600 text-green-600"
                        onClick={() => onSectionChange?.('jobs')}
                      >
                        <Briefcase className="h-3 w-3" />
                        {linkedJobs.length} Job{linkedJobs.length > 1 ? 's' : ''}
                        <ArrowRight className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>

                  <div className="pt-2">
                    {linkedJobs.length === 0 ? (
                      <Button 
                        size="sm" 
                        onClick={() => setConvertingCustomer(customer)}
                        className="w-full"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span className="text-xs sm:text-sm">Convert to Job</span>
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setConvertingCustomer(customer)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="text-xs sm:text-sm">Add Another Job</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              This will create a new job for {convertingCustomer?.name}. 
              {estimates?.find(e => e.customer_id === convertingCustomer?.id) && (
                <> The linked estimate will be marked as sold.</>
              )}
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
