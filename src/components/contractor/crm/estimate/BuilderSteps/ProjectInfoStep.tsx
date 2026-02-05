import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { User, Building, MapPin, Phone, Mail, Briefcase, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { EstimateBuilderData } from '../../EstimateBuilder';
import { useGCContacts, GCContact } from '@/hooks/useGCContacts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TRADE_TYPES = [
  'General Remodel',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Painting',
  'HVAC',
  'Flooring',
  'Landscaping',
  'Concrete',
  'Carpentry',
  'Drywall',
  'Windows & Doors',
  'Other',
];

const REFERRAL_SOURCES = [
  'Google',
  'Social Media',
  'CT1 Network',
  'Friend/Family',
  'Former Customer',
  'Home Advisor',
  'Angi',
  'Other',
];

interface ProjectInfoStepProps {
  data: EstimateBuilderData;
  onChange: (updates: Partial<EstimateBuilderData>) => void;
}

export default function ProjectInfoStep({ data, onChange }: ProjectInfoStepProps) {
  const { gcContacts, addGCContact } = useGCContacts();
  
  // GC selector state
  const [gcOpen, setGcOpen] = useState(false);
  const [showAddGCDialog, setShowAddGCDialog] = useState(false);
  const [newGC, setNewGC] = useState({ name: '', company: '', email: '', phone: '' });
  const [isAddingGC, setIsAddingGC] = useState(false);
  
  // Check if the current referred_by value is a custom "Other" value
  const isOtherReferral = data.referred_by && !REFERRAL_SOURCES.includes(data.referred_by) && data.referred_by !== '';
  const [showOtherInput, setShowOtherInput] = useState(isOtherReferral);
  const [otherValue, setOtherValue] = useState(isOtherReferral ? data.referred_by : '');
  const [selectedSource, setSelectedSource] = useState(isOtherReferral ? 'Other' : data.referred_by);

  // Sync state when data changes (e.g., loading existing estimate)
  useEffect(() => {
    const isOther = data.referred_by && !REFERRAL_SOURCES.includes(data.referred_by) && data.referred_by !== '';
    if (isOther) {
      setShowOtherInput(true);
      setOtherValue(data.referred_by);
      setSelectedSource('Other');
    } else {
      setShowOtherInput(false);
      setOtherValue('');
      setSelectedSource(data.referred_by);
    }
  }, [data.referred_by]);

  const handleReferralChange = (value: string) => {
    setSelectedSource(value);
    if (value === 'Other') {
      setShowOtherInput(true);
      // Don't update referred_by yet, wait for custom input
    } else {
      setShowOtherInput(false);
      setOtherValue('');
      onChange({ referred_by: value });
    }
  };

  const handleOtherInputChange = (value: string) => {
    setOtherValue(value);
    onChange({ referred_by: value });
  };

  const selectedGC = gcContacts.find(gc => gc.id === data.gc_contact_id);

  const handleAddGC = async () => {
    if (!newGC.name.trim()) {
      toast.error('GC name is required');
      return;
    }
    
    setIsAddingGC(true);
    try {
      const created = await addGCContact({
        name: newGC.name,
        company: newGC.company || undefined,
        email: newGC.email || undefined,
        phone: newGC.phone || undefined,
      });
      
      onChange({ gc_contact_id: created.id });
      setShowAddGCDialog(false);
      setNewGC({ name: '', company: '', email: '', phone: '' });
      toast.success('GC contact added!');
    } catch (error: any) {
      toast.error('Failed to add GC: ' + error.message);
    } finally {
      setIsAddingGC(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Project Details
          </CardTitle>
          <CardDescription>
            Basic information about the project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="title">Project Name / Title *</Label>
              <Input
                id="title"
                value={data.title || data.project_name}
                onChange={(e) => onChange({ title: e.target.value, project_name: e.target.value })}
                placeholder="e.g., Kitchen Remodel - Smith Residence"
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trade_type">Trade Type</Label>
              <Select
                value={data.trade_type}
                onValueChange={(value) => onChange({ trade_type: value })}
              >
                <SelectTrigger id="trade_type">
                  <SelectValue placeholder="Select trade type" />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_TYPES.map((trade) => (
                    <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prepared_by">Prepared By</Label>
              <Input
                id="prepared_by"
                value={data.prepared_by}
                onChange={(e) => onChange({ prepared_by: e.target.value })}
                placeholder="Your name"
              />
            </div>

            {/* GC Selector */}
            <div className="sm:col-span-2 space-y-2">
              <Label>General Contractor (GC)</Label>
              <div className="flex gap-2">
                <Popover open={gcOpen} onOpenChange={setGcOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={gcOpen}
                      className="flex-1 justify-between"
                    >
                      {selectedGC ? (
                        <span className="truncate">
                          {selectedGC.name}
                          {selectedGC.company && <span className="text-muted-foreground ml-1">({selectedGC.company})</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Select a GC...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search GC contacts..." />
                      <CommandList>
                        <CommandEmpty>No GC contacts found.</CommandEmpty>
                        <CommandGroup>
                          {data.gc_contact_id && (
                            <CommandItem
                              value="__clear__"
                              onSelect={() => {
                                onChange({ gc_contact_id: '' });
                                setGcOpen(false);
                              }}
                            >
                              <span className="text-muted-foreground">Clear selection</span>
                            </CommandItem>
                          )}
                          {gcContacts.map((gc) => (
                            <CommandItem
                              key={gc.id}
                              value={`${gc.name} ${gc.company || ''} ${gc.email || ''}`}
                              onSelect={() => {
                                onChange({ gc_contact_id: gc.id });
                                setGcOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.gc_contact_id === gc.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{gc.name}</span>
                                {gc.company && (
                                  <span className="text-xs text-muted-foreground">{gc.company}</span>
                                )}
                                {gc.email && (
                                  <span className="text-xs text-muted-foreground">{gc.email}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddGCDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add GC
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional - Link this estimate to a general contractor
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Client Information
          </CardTitle>
          <CardDescription>
            Contact details for the client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_name"
                  value={data.client_name}
                  onChange={(e) => onChange({ client_name: e.target.value })}
                  placeholder="John Smith"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_phone"
                  type="tel"
                  value={data.client_phone}
                  onChange={(e) => onChange({ client_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="client_email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_email"
                  type="text"
                  value={data.client_email}
                  onChange={(e) => onChange({ client_email: e.target.value })}
                  placeholder="john@email.com, jane@email.com"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Required to send the estimate. Separate multiple emails with commas.
              </p>
            </div>
            
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="client_address">Client Address</Label>
              <AddressAutocomplete
                value={data.client_address || ''}
                onChange={(value) => onChange({ client_address: value })}
                placeholder="Start typing an address..."
                showGpsButton={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Job Site Location
          </CardTitle>
          <CardDescription>
            Where the work will be performed (if different from client address)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_address">Site Address</Label>
            <AddressAutocomplete
              value={data.site_address || ''}
              onChange={(value) => onChange({ site_address: value })}
              placeholder="Leave empty if same as client address"
              showGpsButton={true}
            />
          </div>
          
          {/* Only show Referred By if not already set from lead */}
          {!data.referred_by && (
            <div className="space-y-2">
              <Label htmlFor="referred_by">Referred By</Label>
              <Select
                value={selectedSource}
                onValueChange={handleReferralChange}
              >
                <SelectTrigger id="referred_by">
                  <SelectValue placeholder="How did they find you?" />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showOtherInput && (
                <Input
                  className="mt-2"
                  value={otherValue}
                  onChange={(e) => handleOtherInputChange(e.target.value)}
                  placeholder="Please specify how they found you"
                />
              )}
            </div>
          )}
          
          {/* Show read-only display if referred_by is already set from lead */}
          {data.referred_by && (
            <div className="space-y-2">
              <Label>Referred By</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {data.referred_by}
              </div>
              <p className="text-xs text-muted-foreground">
                Inherited from lead - cannot be modified
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add GC Dialog */}
      <Dialog open={showAddGCDialog} onOpenChange={setShowAddGCDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New GC Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gc_name">Name *</Label>
              <Input
                id="gc_name"
                value={newGC.name}
                onChange={(e) => setNewGC(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gc_company">Company</Label>
              <Input
                id="gc_company"
                value={newGC.company}
                onChange={(e) => setNewGC(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gc_email">Email</Label>
              <Input
                id="gc_email"
                type="email"
                value={newGC.email}
                onChange={(e) => setNewGC(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gc_phone">Phone</Label>
              <Input
                id="gc_phone"
                type="tel"
                value={newGC.phone}
                onChange={(e) => setNewGC(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGCDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGC} disabled={isAddingGC}>
              {isAddingGC ? 'Adding...' : 'Add GC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}