import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Plus, Tag } from 'lucide-react';
import { useEstimateTemplates, TRADES, Trade, EstimateTemplate } from '@/hooks/useEstimateTemplates';
import { EstimateLineItem } from '@/hooks/useEstimates';

interface TemplateSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (lineItems: EstimateLineItem[]) => void;
}

export function TemplateSearchModal({ open, onOpenChange, onSelectTemplate }: TemplateSearchModalProps) {
  const { templates, isLoading, filterTemplates } = useEstimateTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<Trade | 'all'>('all');
  const [visibility, setVisibility] = useState<'all' | 'private' | 'account'>('all');

  const filteredTemplates = useMemo(() => {
    return filterTemplates(
      selectedTrade === 'all' ? undefined : selectedTrade,
      searchQuery,
      visibility
    );
  }, [templates, selectedTrade, searchQuery, visibility, filterTemplates]);

  const handleAddTemplate = (template: EstimateTemplate) => {
    onSelectTemplate(template.line_items);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Add Template to Estimate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedTrade} onValueChange={(v) => setSelectedTrade(v as Trade | 'all')}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Trades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                {TRADES.map(trade => (
                  <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as 'all' | 'private' | 'account')}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="private">My Templates</SelectItem>
                <SelectItem value="account">Shared</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredTemplates.length > 0 ? (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold truncate">{template.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{template.trade}</p>
                        </div>
                        <Button size="sm" onClick={() => handleAddTemplate(template)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {template.line_items?.length || 0} items
                        </Badge>
                        {template.visibility === 'account' && (
                          <Badge variant="secondary" className="text-xs">Shared</Badge>
                        )}
                        {template.tags?.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedTrade !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Save your first template from an estimate'}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
