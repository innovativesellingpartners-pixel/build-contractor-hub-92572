import { useState } from 'react';
import { Lead, useLeads } from '@/hooks/useLeads';
import { useEstimates } from '@/hooks/useEstimates';
import { useCustomers } from '@/hooks/useCustomers';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Briefcase, ArrowRight, Phone, Plus, Pencil, Navigation, CalendarPlus, Copy } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { ScheduleMeetingDialog } from '../ScheduleMeetingDialog';
import { useQueryClient } from '@tanstack/react-query';
import { AIScopeNotes } from '../AIScopeNotes';
import {
  BlueBackground,
  SectionHeader,
  InfoCard,
  InfoRow,
  ActionButton,
  DetailHeader,
  StatusBadge,
  ActionButtonRow,
} from './ProvenJobsTheme';

interface LeadDetailViewBlueProps {
  lead: Lead;
  onConvertToCustomer: () => void;
  onClose: () => void;
  onSectionChange?: (section: string) => void;
  onEdit?: () => void;
  onEditLead?: (lead: Lead) => void;
}

export function LeadDetailViewBlue({ lead, onConvertToCustomer, onClose, onSectionChange, onEdit, onEditLead }: LeadDetailViewBlueProps) {
  const queryClient = useQueryClient();
  const { estimates, createEstimateAsync } = useEstimates();
  const { customers } = useCustomers();
  const { jobs, refreshJobs } = useJobs();
  const { refreshLeads, sources, updateLead, duplicateLead } = useLeads();
  const { user } = useAuth();
  const [isConverting, setIsConverting] = useState(false);
  const [isCreatingEstimate, setIsCreatingEstimate] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [leadNotes, setLeadNotes] = useState(lead.notes || '');
  const [isDuplicating, setIsDuplicating] = useState(false);

  const { isRefreshing, pullDistance, handlers, containerRef } = usePullToRefresh({
    onRefresh: async () => {
      await Promise.all([
        refreshLeads(), 
        refreshJobs(),
        queryClient.invalidateQueries({ queryKey: ['estimates'] })
      ]);
      toast.success('Refreshed!');
    },
    threshold: 80,
  });

  const leadEstimates = estimates?.filter(e => e.lead_id === lead.id) || [];
  const linkedCustomer = lead.customer_id ? customers?.find(c => c.id === lead.customer_id) : null;
  const linkedJob = lead.converted_to_job_id ? jobs?.find(j => j.id === lead.converted_to_job_id) : null;

  // Convert lead directly to job (creates customer + job)
  const handleConvertToJob = async () => {
    if (!user) return;
    
    setIsConverting(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-lead-to-job', {
        body: { 
          leadId: lead.id,
          jobName: `Job for ${lead.name}`
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.alreadyConverted) {
        toast.info('Lead was already converted to a job');
      } else {
        toast.success('Lead converted to job successfully!');
      }
      
      const jobId = data?.jobId;
      if (onSectionChange && jobId) {
        onSectionChange(`job:${jobId}`);
      } else if (onSectionChange) {
        onSectionChange('jobs');
      }
    } catch (error: any) {
      toast.error('Failed to convert lead: ' + error.message);
    } finally {
      setIsConverting(false);
    }
  };

  // Create estimate for this lead and navigate to it
  const handleCreateEstimate = async () => {
    if (!user) return;
    
    setIsCreatingEstimate(true);
    try {
      const fullAddress = [lead.address, lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ');
      
      // Get referred_by value from lead's source
      let referredBy: string | undefined;
      if (lead.source_id) {
        const sourceRecord = sources.find(s => s.id === lead.source_id);
        if (sourceRecord?.name === 'Other' && lead.source_other) {
          referredBy = lead.source_other;
        } else if (sourceRecord?.name) {
          referredBy = sourceRecord.name;
        }
      }
      
      const estimateData = {
        title: `Estimate for ${lead.name}`,
        lead_id: lead.id,
        client_name: lead.name,
        client_email: lead.email || undefined,
        client_phone: lead.phone || undefined,
        client_address: fullAddress || undefined,
        site_address: fullAddress || undefined,
        project_name: lead.project_type || `Project for ${lead.name}`,
        status: 'draft' as const,
        total_amount: lead.value || 0,
        referred_by: referredBy,
        // Transfer walkthrough notes from lead
        description: leadNotes || lead.notes || undefined,
      };

      const newEstimate = await createEstimateAsync(estimateData);
      toast.success('Estimate created!');
      
      // Navigate directly to the newly created estimate
      if (onSectionChange && newEstimate?.id) {
        onSectionChange(`estimate:${newEstimate.id}`);
      } else if (onSectionChange) {
        onSectionChange('estimates');
      }
    } catch (error: any) {
      toast.error('Failed to create estimate: ' + error.message);
    } finally {
      setIsCreatingEstimate(false);
    }
  };

  // Duplicate lead and open edit dialog
  const handleDuplicateLead = async () => {
    setIsDuplicating(true);
    try {
      const duplicatedLead = await duplicateLead(lead);
      if (duplicatedLead && onEditLead) {
        // Open edit dialog with the duplicated lead
        onEditLead(duplicatedLead);
      }
    } catch (error) {
      // Error already handled in hook
    } finally {
      setIsDuplicating(false);
    }
  };

  const getFullAddress = () => {
    return [lead.address, lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ');
  };

  const handleStartTravel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const address = getFullAddress();
    if (!address) {
      toast.error('No address available for navigation');
      return;
    }
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    const mapsUrl = isIOS 
      ? `https://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    
    // Create a temporary anchor element to open in new tab without affecting current view
    const link = document.createElement('a');
    link.href = mapsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isConverted = !!lead.converted_to_job_id;

  return (
    <BlueBackground className="min-h-full flex flex-col relative overflow-hidden">
      {/* Header - Fixed */}
      <DetailHeader
        title={lead.name}
        subtitle={lead.company || undefined}
        onBack={onClose}
        onDashboard={onSectionChange ? () => { onSectionChange('dashboard'); onClose(); } : undefined}
        rightContent={<StatusBadge status={lead.status} />}
      />

      {/* Action Buttons - Fixed */}
      <ActionButtonRow>
        {onEdit && (
          <ActionButton 
            variant="secondary" 
            onClick={onEdit}
            className="flex items-center justify-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            EDIT
          </ActionButton>
        )}
        <ActionButton 
          variant="secondary" 
          onClick={handleDuplicateLead}
          disabled={isDuplicating}
          className="flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          {isDuplicating ? 'DUPLICATING...' : 'DUPLICATE'}
        </ActionButton>
        {!isConverted && (
          <ActionButton 
            variant="primary" 
            onClick={handleConvertToJob} 
            disabled={isConverting}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            {isConverting ? 'CONVERTING...' : 'CONVERT TO JOB'}
          </ActionButton>
        )}
        {!isConverted && (
          <ActionButton 
            variant="secondary" 
            onClick={handleCreateEstimate}
            disabled={isCreatingEstimate}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {isCreatingEstimate ? 'CREATING...' : 'CREATE ESTIMATE'}
          </ActionButton>
        )}
      </ActionButtonRow>

      {/* Sales Flow Progress - Fixed */}
      <div className="bg-white px-4 py-3 border-b border-sky-100 flex-shrink-0">
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="px-3 py-1 bg-sky-500 text-white rounded-full font-semibold">Lead</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className={`px-3 py-1 rounded-full font-semibold ${linkedJob ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            Job
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className={`px-3 py-1 rounded-full font-semibold ${linkedCustomer ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            Customer
          </span>
        </div>
        <p className="text-center text-xs text-slate-500 mt-1">
          Converting creates both Job and Customer automatically
        </p>
      </div>

      {/* Scrollable Content - extra bottom padding to clear nav bar */}
      <div 
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="flex-1 min-h-0 overflow-y-auto pb-32"
        {...handlers}
      >
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
        <div 
          className="space-y-0"
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: isRefreshing ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          {/* Converted Status */}
          {isConverted && linkedJob && (
          <>
            <SectionHeader>CONVERTED TO</SectionHeader>
            <InfoCard className="rounded-none">
              <div 
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-sky-50"
                onClick={() => onSectionChange?.('jobs')}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{linkedJob.name}</p>
                    <p className="text-xs text-slate-500">{linkedJob.job_number}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              {linkedCustomer && (
                <div 
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-sky-50 border-t border-sky-50"
                  onClick={() => onSectionChange?.('customers')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center text-xs font-semibold text-sky-600">
                      {linkedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{linkedCustomer.name}</p>
                      <p className="text-xs text-slate-500">Customer</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </InfoCard>
          </>
        )}

        {/* Lead Information */}
        <SectionHeader>LEAD INFORMATION</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow label="Name" value={lead.name} />
          <InfoRow label="Status" value={<StatusBadge status={lead.status} />} />
          {lead.company && <InfoRow label="Company" value={lead.company} />}
          {lead.project_type && <InfoRow label="Project Type" value={lead.project_type} />}
          {lead.value && (
            <InfoRow 
              label="Estimated Value" 
              value={`$${lead.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
            />
          )}
        </InfoCard>

        {/* Contact Information */}
        <SectionHeader>CONTACT INFORMATION</SectionHeader>
        <InfoCard className="rounded-none">
          {lead.email && (
            <InfoRow 
              label="Email" 
              value={
                <a href={`mailto:${lead.email}`} className="text-sky-600 underline">
                  {lead.email}
                </a>
              } 
            />
          )}
          {lead.phone && (
            <InfoRow 
              label="Phone" 
              value={
                <a href={`tel:${lead.phone}`} className="text-sky-600 underline">
                  {lead.phone}
                </a>
              } 
            />
          )}
          {getFullAddress() && <InfoRow label="Address" value={getFullAddress()} />}
        </InfoCard>

        {/* Quick Contact Buttons */}
        {(lead.email || lead.phone || getFullAddress()) && (
          <div className="flex gap-2 px-4 py-3 bg-white border-b border-sky-100">
            {lead.phone && (
              <a 
                href={`tel:${lead.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-lg font-semibold"
              >
                <Phone className="w-4 h-4" />
                CALL
              </a>
            )}
            <button 
              onClick={() => setShowScheduleDialog(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white py-3 rounded-lg font-semibold"
            >
              <CalendarPlus className="w-4 h-4" />
              SCHEDULE
            </button>
            {getFullAddress() && (
              <button 
                onClick={handleStartTravel}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-lg font-semibold"
              >
                <Navigation className="w-4 h-4" />
                START TRAVEL
              </button>
            )}
          </div>
        )}

        {/* Estimates */}
        <SectionHeader>ESTIMATES ({leadEstimates.length})</SectionHeader>
        <InfoCard className="rounded-none">
          {leadEstimates.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground text-sm mb-3">No estimates yet</p>
              <ActionButton variant="secondary" onClick={handleCreateEstimate} disabled={isCreatingEstimate}>
                {isCreatingEstimate ? 'Creating...' : 'Create Estimate'}
              </ActionButton>
            </div>
          ) : (
            <>
              {leadEstimates.map((estimate) => (
                <div
                  key={estimate.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-sky-50 last:border-b-0 cursor-pointer hover:bg-sky-50"
                  onClick={() => onSectionChange?.(`estimate:${estimate.id}`)}
                >
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{estimate.title}</p>
                    <p className="text-xs text-slate-500">
                      ${estimate.total_amount?.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={estimate.status} />
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
              {/* Always show Create Estimate button even if estimates exist */}
              <div className="p-4 border-t border-sky-100">
                <ActionButton 
                  variant="secondary" 
                  onClick={handleCreateEstimate} 
                  disabled={isCreatingEstimate}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isCreatingEstimate ? 'Creating...' : 'Create Another Estimate'}
                </ActionButton>
              </div>
            </>
          )}
        </InfoCard>

        {/* Timeline */}
        <SectionHeader>TIMELINE</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow 
            label="Created" 
            value={format(new Date(lead.created_at), 'MMM d, yyyy')} 
          />
          {lead.last_contact_date && (
            <InfoRow 
              label="Last Contact" 
              value={format(new Date(lead.last_contact_date), 'MMM d, yyyy')} 
            />
          )}
          {lead.converted_at && (
            <InfoRow 
              label="Converted" 
              value={format(new Date(lead.converted_at), 'MMM d, yyyy')} 
            />
          )}
        </InfoCard>

        {/* Walkthrough Notes / Recording */}
        <SectionHeader>WALKTHROUGH NOTES</SectionHeader>
        <InfoCard className="rounded-none">
          <div className="p-4">
            <AIScopeNotes
              notes={leadNotes}
              onNotesChange={async (newNotes) => {
                setLeadNotes(newNotes);
                // Auto-save notes to lead
                try {
                  await updateLead(lead.id, { notes: newNotes });
                } catch (error) {
                  console.error('Failed to save notes:', error);
                }
              }}
              placeholder="Record a walk-around or type notes about this lead..."
              label="Site Notes"
            />
          </div>
        </InfoCard>
        </div>
      </div>

      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSuccess={() => toast.success('Site visit scheduled!')}
        initialDate={undefined}
        leadData={{
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          zip_code: lead.zip_code,
          company: lead.company,
          project_type: lead.project_type,
        }}
      />
    </BlueBackground>
  );
}
