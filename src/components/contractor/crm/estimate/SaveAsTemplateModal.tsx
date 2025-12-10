import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save } from 'lucide-react';
import { useEstimateTemplates, TRADES, Trade } from '@/hooks/useEstimateTemplates';
import { EstimateLineItem } from '@/hooks/useEstimates';

interface SaveAsTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lineItems: EstimateLineItem[];
  defaultName?: string;
  defaultTrade?: string;
}

export function SaveAsTemplateModal({ 
  open, 
  onOpenChange, 
  lineItems,
  defaultName = '',
  defaultTrade = 'General Contracting'
}: SaveAsTemplateModalProps) {
  const { createTemplate } = useEstimateTemplates();
  const [name, setName] = useState(defaultName);
  const [trade, setTrade] = useState<Trade>(defaultTrade as Trade);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [scopeSummary, setScopeSummary] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'account'>('private');

  const handleSave = async () => {
    if (!name.trim()) return;

    await createTemplate.mutateAsync({
      name: name.trim(),
      trade,
      description: description.trim() || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      scope_summary: scopeSummary.trim() || undefined,
      visibility,
      line_items: lineItems,
    });

    // Reset and close
    setName('');
    setDescription('');
    setTags('');
    setScopeSummary('');
    setVisibility('private');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Standard Kitchen Remodel"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-trade">Trade *</Label>
            <Select value={trade} onValueChange={(v) => setTrade(v as Trade)}>
              <SelectTrigger>
                <SelectValue placeholder="Select trade" />
              </SelectTrigger>
              <SelectContent>
                {TRADES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Brief description of what this template includes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-tags">Tags (comma separated)</Label>
            <Input
              id="template-tags"
              placeholder="e.g., kitchen, cabinets, countertops"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-scope">Scope Summary</Label>
            <Textarea
              id="template-scope"
              placeholder="Plain language summary of the work scope..."
              value={scopeSummary}
              onChange={(e) => setScopeSummary(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as 'private' | 'account')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal cursor-pointer">
                  My Templates (only you can see)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="account" id="account" />
                <Label htmlFor="account" className="font-normal cursor-pointer">
                  Shared (visible to all users)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="text-sm text-muted-foreground">
            This template will include {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''} from the current estimate.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || createTemplate.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createTemplate.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
