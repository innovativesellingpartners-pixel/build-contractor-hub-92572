import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { useEstimates } from '@/hooks/useEstimates';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Mail, Briefcase, Home, FileText, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AddCustomerDialog from '../AddCustomerDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HorizontalRowCard, RowAvatar, RowContent, RowTitleLine, RowMetaLine, RowBadgeGroup, RowActions } from './HorizontalRowCard';
import { CustomerDetailViewBlue } from './CustomerDetailViewBlue';

interface CustomersSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function CustomersSection({ onSectionChange }: CustomersSectionProps) {
  const { customers, loading } = useCustomers();
  const { estimates } = useEstimates();
  const { jobs } = useJobs();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [convertingCustomer, setConvertingCustomer] = useState<any>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const handleOpenDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setDetailViewOpen(true);
  };

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

        {/* Horizontal List */}
        <div className="space-y-3">
          {customers.map((customer) => {
            const { linkedEstimate, linkedJobs } = getCustomerData(customer);
            
            return (
              <HorizontalRowCard key={customer.id} onClick={() => handleOpenDetail(customer)}>
                {/* Avatar */}
                <RowAvatar initials={customer.name.charAt(0).toUpperCase()} />

                {/* Info */}
                <RowContent>
                  <RowTitleLine>
                    <h3 className="font-semibold text-sm sm:text-base truncate max-w-[200px]">
                      {customer.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {customer.customer_type}
                    </Badge>
                  </RowTitleLine>
                  
                  <RowMetaLine>
                    {customer.phone && <span className="truncate max-w-[120px]">{customer.phone}</span>}
                    {customer.email && <span className="truncate max-w-[180px] hidden sm:inline">{customer.email}</span>}
                  </RowMetaLine>

                  {/* Linked Records */}
                  <RowBadgeGroup>
                    {linkedEstimate && (
                      <Badge 
                        variant="outline" 
                        className="text-xs gap-1 cursor-pointer hover:bg-muted"
                        onClick={() => onSectionChange?.('estimates')}
                      >
                        <FileText className="h-2.5 w-2.5" />
                        Estimate
                      </Badge>
                    )}
                    {linkedJobs.length > 0 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs gap-1 cursor-pointer hover:bg-muted border-green-600 text-green-600"
                        onClick={() => onSectionChange?.('jobs')}
                      >
                        <Briefcase className="h-2.5 w-2.5" />
                        {linkedJobs.length} Job{linkedJobs.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </RowBadgeGroup>
                </RowContent>

                {/* Actions */}
                <RowActions>
                  {customer.phone && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild onClick={(e) => e.stopPropagation()}>
                      <a href={`tel:${customer.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {customer.email && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild onClick={(e) => e.stopPropagation()}>
                      <a href={`mailto:${customer.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setConvertingCustomer(customer); }}
                    className="hidden sm:flex"
                  >
                    <Briefcase className="h-4 w-4 mr-1" />
                    {linkedJobs.length === 0 ? 'Create Job' : 'Add Job'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); setConvertingCustomer(customer); }}
                    className="sm:hidden h-8 w-8"
                  >
                    <Briefcase className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                </RowActions>
              </HorizontalRowCard>
            );
          })}

          {customers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No customers yet. Add your first customer to get started.
            </div>
          )}
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

      {/* Customer Detail View Dialog */}
      <Dialog open={detailViewOpen} onOpenChange={setDetailViewOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] p-0 overflow-hidden">
          {selectedCustomer && (
            <CustomerDetailViewBlue
              customer={selectedCustomer}
              onClose={() => setDetailViewOpen(false)}
              onSectionChange={onSectionChange}
              onCreateJob={() => setConvertingCustomer(selectedCustomer)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
