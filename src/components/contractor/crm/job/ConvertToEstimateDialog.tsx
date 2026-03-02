import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { FileText, LayoutTemplate, Plus } from 'lucide-react';
import { useEstimateTemplates } from '@/hooks/useEstimateTemplates';

interface ConvertToEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBlank: () => void;
  onCreateFromTemplate: (templateId: string) => void;
}

export function ConvertToEstimateDialog({
  open,
  onOpenChange,
  onCreateBlank,
  onCreateFromTemplate,
}: ConvertToEstimateDialogProps) {
  const { templates, isLoading } = useEstimateTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const templateOptions: SearchableSelectOption[] = useMemo(() => {
    if (!templates) return [];
    return templates.map((t) => ({
      value: t.id,
      label: t.name,
      description: `${t.trade} · ${t.line_items?.length || 0} items`,
    }));
  }, [templates]);

  const handleUseTemplate = () => {
    if (selectedTemplateId) {
      onCreateFromTemplate(selectedTemplateId);
      setSelectedTemplateId('');
      onOpenChange(false);
    }
  };

  const handleCreateBlank = () => {
    setSelectedTemplateId('');
    onCreateBlank();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Estimate
          </DialogTitle>
          <DialogDescription>
            Would you like to start from an estimate template or create a blank estimate?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-2 block">Choose a Template</label>
            <SearchableSelect
              options={templateOptions}
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              placeholder="Search templates..."
              searchPlaceholder="Search by name or trade..."
              emptyMessage={isLoading ? 'Loading templates...' : 'No templates found.'}
            />
          </div>

          {selectedTemplateId && (
            <Button onClick={handleUseTemplate} className="w-full">
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleCreateBlank} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Blank Estimate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
