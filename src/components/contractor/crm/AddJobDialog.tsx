import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationAutocomplete, AddressData } from '@/components/ui/location-autocomplete';
import { Plus, Bot, FileText, MapPin, DollarSign } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { JobAIAssistant } from './JobAIAssistant';
import { JobMeetingsSection, MeetingFormData } from './JobMeetingsSection';
import { AIScopeNotes } from './AIScopeNotes';

interface AddJobDialogProps {
  onAdd: (jobData: Omit<Job, 'id' | 'user_id' | 'job_number' | 'created_at' | 'updated_at'>, meetings?: MeetingFormData[]) => Promise<any>;
}

export function AddJobDialog({ onAdd }: AddJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({
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
  });
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
      await onAdd({
        ...formData,
        total_cost: parseFloat(formData.total_cost),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      }, meetings);
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
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <FileText className="h-4 w-4" />
                  Basic Information
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Job Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Smith Kitchen Renovation"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                
                <div className="grid grid-cols-6 gap-4">
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      maxLength={2}
                      placeholder="CA"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="zip_code">Zip Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
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
