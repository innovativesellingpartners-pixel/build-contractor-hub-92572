import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationAutocomplete, AddressData } from '@/components/ui/location-autocomplete';
import { Plus, Bot, FileText, MapPin, DollarSign, X, Layers, Save } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { JobAIAssistant } from './JobAIAssistant';
import { JobMeetingsSection, MeetingFormData } from './JobMeetingsSection';
import { AIScopeNotes } from './AIScopeNotes';
import { VoiceInputField } from '@/components/ui/voice-input-field';
import { VoiceTextareaField } from '@/components/ui/voice-textarea-field';
import { useEstimateTemplates, EstimateTemplate } from '@/hooks/useEstimateTemplates';
import { useEstimates } from '@/hooks/useEstimates';
import { toast } from 'sonner';
import { useFormDraft } from '@/hooks/useFormDraft';

const JOB_DEFAULTS = {
  name: '',
  description: '',
  status: 'scheduled' as Job['status'],
  start_date: '',
  end_date: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  total_cost: '0',
  notes: '',
};

interface AddJobDialogProps {
  onAdd: (jobData: Omit<Job, 'id' | 'user_id' | 'job_number' | 'created_at' | 'updated_at'>, meetings?: MeetingFormData[]) => Promise<any>;
  onJobCreated?: (job: Job) => void;
}

export function AddJobDialog({ onAdd, onJobCreated }: AddJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const { templates } = useEstimateTemplates();
  const { createEstimateAsync } = useEstimates();
  const [selectedTemplate, setSelectedTemplate] = useState<EstimateTemplate | null>(null);
  const [formData, setFormData, clearDraft, hasDraft] = useFormDraft('add-job', JOB_DEFAULTS);
  const [meetings, setMeetings] = useState<MeetingFormData[]>([]);

  const handleAddMeeting = (meeting: MeetingFormData) => {
    setMeetings(prev => [...prev, meeting]);
  };

  const handleRemoveMeeting = (index: number) => {
    setMeetings(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMeeting = (index: number, meeting: MeetingFormData) => {
    setMeetings(prev => prev.map((m, i) => i === index ? meeting : m));
  };

  const handleAIExtract = (details: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...details,
    }));
  };

  const handleAINext = () => {
    setActiveTab('manual');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newJob = await onAdd({
        ...formData,
        total_cost: parseFloat(formData.total_cost),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      }, meetings);

      // If a template was selected, create an estimate from it
      if (selectedTemplate && newJob?.id) {
        try {
          await createEstimateAsync({
            title: `${selectedTemplate.name} - ${newJob.name || 'New Estimate'}`,
            status: 'draft',
            total_amount: selectedTemplate.line_items?.reduce((s, i) => s + (i.totalPrice || 0), 0) || 0,
            line_items: selectedTemplate.line_items,
            job_id: newJob.id,
            site_address: newJob.address || '',
            project_address: [newJob.address, newJob.city, newJob.state, newJob.zip_code].filter(Boolean).join(', '),
          });
          toast.success('Job created with estimate from template');
        } catch (err) {
          console.error('Error creating estimate from template:', err);
          toast.error('Job created but failed to create estimate from template');
        }
      }

      setOpen(false);
      setFormData({
        name: '',
        description: '',
        status: 'scheduled',
        start_date: '',
        end_date: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        total_cost: '0',
        notes: '',
      });
      setMeetings([]);
      setSelectedTemplate(null);
      if (newJob && onJobCreated) {
        onJobCreated(newJob);
      }
    } catch (error) {
      console.error('Error adding job:', error);
    }
  };

  const jobLocation = [formData.address, formData.city, formData.state, formData.zip_code].filter(Boolean).join(', ');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[calc(100vh-5rem)] top-[45%] sm:top-[50%] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Job</DialogTitle>
          <DialogDescription>Use AI to quickly extract details or fill them in manually</DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="flex-1 overflow-y-auto mt-4 space-y-4 pb-20">
            <JobAIAssistant onJobDetailsExtracted={handleAIExtract} onNext={handleAINext} />
            
            {/* Preview of extracted data */}
            {(formData.name || formData.description) && (
              <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                <h4 className="font-semibold text-sm">Extracted Details:</h4>
                {formData.name && <p className="text-sm"><span className="font-medium">Job Name:</span> {formData.name}</p>}
                {formData.description && <p className="text-sm"><span className="font-medium">Description:</span> {formData.description}</p>}
                {formData.address && <p className="text-sm"><span className="font-medium">Address:</span> {formData.address}, {formData.city} {formData.state} {formData.zip_code}</p>}
                {formData.total_cost !== '0' && <p className="text-sm"><span className="font-medium">Budget:</span> ${parseFloat(formData.total_cost).toLocaleString()}</p>}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manual" className="flex-1 overflow-y-auto mt-4 pb-20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Selector */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Layers className="h-4 w-4" />
                  Start from Template (Optional)
                </div>
                {selectedTemplate ? (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedTemplate.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedTemplate.trade} · {selectedTemplate.line_items?.length || 0} line items</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"
                      onClick={() => setSelectedTemplate(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <SearchableSelect
                    value=""
                    onValueChange={(value) => {
                      const tmpl = templates?.find(t => t.id === value);
                      if (tmpl) {
                        setSelectedTemplate(tmpl);
                        if (!formData.name && tmpl.name) {
                          setFormData(prev => ({ ...prev, name: tmpl.name }));
                        }
                      }
                    }}
                    placeholder="Select a template to pre-fill estimate..."
                    searchPlaceholder="Search templates..."
                    options={(templates || []).map(t => ({
                      value: t.id,
                      label: `${t.name} (${t.trade} · ${t.line_items?.length || 0} items)`,
                    }))}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Selecting a template will automatically create an estimate with its line items when the job is created.
                </p>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <FileText className="h-4 w-4" />
                  Basic Information
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Title *</Label>
                  <VoiceInputField
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onVoiceInput={(text) => setFormData({ ...formData, name: text })}
                    placeholder="e.g., Smith Kitchen Renovation"
                  />
                  <p className="text-xs text-muted-foreground">Used as the subject line for meeting emails</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <VoiceTextareaField
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    onVoiceInput={(text) => setFormData({ ...formData, description: text })}
                    rows={3}
                    placeholder="Brief description of the work to be done"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <SearchableSelect
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as Job['status'] })}
                      placeholder="Select status"
                      searchPlaceholder="Search status..."
                      options={[
                        { value: 'scheduled', label: 'Scheduled' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'on_hold', label: 'On Hold' },
                        { value: 'cancelled', label: 'Cancelled' },
                      ]}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
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
                
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
                  <div className="space-y-2 col-span-2 sm:col-span-3">
                    <Label htmlFor="city">City</Label>
                    <VoiceInputField
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      onVoiceInput={(text) => setFormData({ ...formData, city: text })}
                      placeholder="San Francisco"
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
                  <div className="space-y-2 col-span-1 sm:col-span-2">
                    <Label htmlFor="zip_code">Zip Code</Label>
                    <VoiceInputField
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      onVoiceInput={(text) => setFormData({ ...formData, zip_code: text })}
                      placeholder="94105"
                    />
                  </div>
                </div>
              </div>

              {/* Financial */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <DollarSign className="h-4 w-4" />
                  Financial
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_cost">Estimated Budget</Label>
                    <Input
                      id="total_cost"
                      type="number"
                      step="0.01"
                      value={formData.total_cost}
                      onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Target Completion</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Meetings & Site Visits */}
              <JobMeetingsSection
                meetings={meetings}
                onAddMeeting={handleAddMeeting}
                onRemoveMeeting={handleRemoveMeeting}
                onUpdateMeeting={handleUpdateMeeting}
                jobLocation={jobLocation}
              />

              {/* AI Scope Notes */}
              <AIScopeNotes
                notes={formData.notes}
                onNotesChange={(notes) => setFormData({ ...formData, notes })}
                label="Job Notes"
                placeholder="Record your walk-around or type notes about site conditions and scope"
              />

              <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background py-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Job</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
