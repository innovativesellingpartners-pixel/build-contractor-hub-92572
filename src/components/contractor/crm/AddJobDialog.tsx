import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Bot, FileText, MapPin, DollarSign } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { JobAIAssistant } from './JobAIAssistant';

interface AddJobDialogProps {
  onAdd: (jobData: Omit<Job, 'id' | 'user_id' | 'job_number' | 'created_at' | 'updated_at'>) => Promise<any>;
}

export function AddJobDialog({ onAdd }: AddJobDialogProps) {
  const [open, setOpen] = useState(false);
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

  const handleAIExtract = (details: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...details,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAdd({
        ...formData,
        total_cost: parseFloat(formData.total_cost),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      });
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
    } catch (error) {
      console.error('Error adding job:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
          <DialogDescription>Use AI to quickly extract details or fill them in manually</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="ai" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="flex-1 overflow-y-auto mt-4 space-y-4">
            <JobAIAssistant onJobDetailsExtracted={handleAIExtract} />
            
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
          
          <TabsContent value="manual" className="flex-1 overflow-y-auto mt-4">
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
                    <Select value={formData.status} onValueChange={(value: Job['status']) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
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

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional information about this job"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
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
