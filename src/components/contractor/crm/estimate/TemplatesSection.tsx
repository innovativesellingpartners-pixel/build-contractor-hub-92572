import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, Tag, Trash2, Plus, Lock, Globe, FolderOpen, Receipt, Pencil, Eye } from 'lucide-react';
import { useEstimateTemplates, TRADES, Trade, EstimateTemplate } from '@/hooks/useEstimateTemplates';
import { MobileOptimizedWrapper, MobileStack } from '../sections/MobileOptimizedWrapper';
import { HorizontalRowCard, RowAvatar, RowContent, RowTitleLine, RowMetaLine, RowActions } from '../sections/HorizontalRowCard';
import { EstimateLineItem } from '@/hooks/useEstimates';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreateTemplateDialog } from './CreateTemplateDialog';
import { EditTemplateModal } from './EditTemplateModal';
import PlumbingInvoiceCreator from '../PlumbingInvoiceCreator';

interface TemplatesSectionProps {
  onBack: () => void;
  onAddToEstimate?: (lineItems: EstimateLineItem[], estimateId?: string) => void;
}

const tradeColors: Record<string, string> = {
  'General Contracting': 'bg-slate-600',
  'Roofing (Residential)': 'bg-amber-600',
  'Roofing (Commercial)': 'bg-amber-700',
  'Plumbing (Residential)': 'bg-blue-600',
  'Plumbing (Commercial)': 'bg-blue-700',
  'HVAC': 'bg-cyan-600',
  'Electrical': 'bg-yellow-600',
  'Framing': 'bg-orange-600',
  'Drywall': 'bg-gray-500',
  'Painting': 'bg-purple-600',
  'Flooring': 'bg-amber-800',
  'Concrete': 'bg-stone-600',
  'Excavation': 'bg-yellow-800',
  'Masonry': 'bg-red-800',
  'Siding': 'bg-teal-600',
  'Windows/Doors': 'bg-sky-600',
  'Finish Carpentry': 'bg-orange-700',
  'Cabinetry': 'bg-amber-900',
  'Decks': 'bg-lime-700',
  'Landscaping': 'bg-green-600',
  'Fencing': 'bg-emerald-700',
  'Fire Protection': 'bg-red-600',
  'Low Voltage': 'bg-indigo-600',
  'Demolition': 'bg-zinc-700',
  'Environmental Remediation': 'bg-green-800',
};

export function TemplatesSection({ onBack, onAddToEstimate }: TemplatesSectionProps) {
  const { templates, isLoading, deleteTemplate, filterTemplates, updateTemplate, isSuperAdmin } = useEstimateTemplates();
  const { user } = useAuth();
  
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'private' | 'account'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<EstimateTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EstimateTemplate | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EstimateTemplate | null>(null);
  const [showPlumbingInvoiceCreator, setShowPlumbingInvoiceCreator] = useState(false);
  
  const isPlumbingTrade = selectedTrade?.toLowerCase().includes('plumbing');

  const globalSearchResults = useMemo(() => {
    if (!searchQuery || selectedTrade) return null;
    return filterTemplates(undefined, searchQuery, visibility);
  }, [templates, searchQuery, visibility, selectedTrade, filterTemplates]);

  const templateCountByTrade = useMemo(() => {
    const counts: Record<string, number> = {};
    (templates || []).forEach(t => {
      counts[t.trade] = (counts[t.trade] || 0) + 1;
    });
    return counts;
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (!selectedTrade) return [];
    return filterTemplates(selectedTrade, searchQuery, visibility);
  }, [templates, selectedTrade, searchQuery, visibility, filterTemplates]);

  const handleDeleteClick = (template: EstimateTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate.mutateAsync(templateToDelete.id);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleToggleVisibility = async (template: EstimateTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    const newVisibility = template.visibility === 'private' ? 'account' : 'private';
    updateTemplate.mutate({ id: template.id, visibility: newVisibility });
  };

  const handleBackFromTrade = () => {
    setSelectedTrade(null);
    setSearchQuery('');
    setShowPlumbingInvoiceCreator(false);
  };

  const renderTemplateRow = (template: EstimateTemplate, showTrade = false) => (
    <HorizontalRowCard key={template.id} onClick={() => setPreviewTemplate(template)}>
      <RowAvatar initials={template.name.substring(0, 2).toUpperCase()} />
      <RowContent>
        <RowTitleLine>
          <h3 className="font-semibold text-sm truncate">{template.name}</h3>
        </RowTitleLine>
        <RowMetaLine>
          {showTrade && <Badge variant="outline" className="text-xs">{template.trade}</Badge>}
          <Badge variant="outline" className="text-xs">{template.line_items?.length || 0} items</Badge>
          {template.visibility === 'account' ? (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Globe className="h-3 w-3" /> Public
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Lock className="h-3 w-3" /> Private
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{new Date(template.created_at).toLocaleDateString()}</span>
        </RowMetaLine>
        {template.tags && template.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-2 w-2 mr-1" />{tag}
              </Badge>
            ))}
          </div>
        )}
      </RowContent>
      <RowActions>
        <Button variant="ghost" size="icon" className="h-8 w-8"
          title={template.visibility === 'private' ? 'Make public' : 'Make private'}
          onClick={(e) => handleToggleVisibility(template, e)}>
          {template.visibility === 'private' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Button>
        {(template.user_id === user?.id || isSuperAdmin) && (
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); setEditingTemplate(template); }} title="Edit template">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8"
          onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template); }} title="Preview template">
          <Eye className="h-4 w-4" />
        </Button>
        {(template.user_id === user?.id || isSuperAdmin) && (
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={(e) => handleDeleteClick(template, e)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </RowActions>
    </HorizontalRowCard>
  );

  // Trade cards dashboard with global search
  if (!selectedTrade) {
    return (
      <MobileOptimizedWrapper
        title={isSuperAdmin ? 'All Templates' : 'Templates'}
        onBackClick={onBack}
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Template
          </Button>
        }
      >
        <div className="px-4 sm:px-0">
          {isSuperAdmin && <p className="text-sm text-muted-foreground mb-3">Viewing all templates across all users</p>}

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search all templates by name, trade, or tag..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as 'all' | 'private' | 'account')}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Visibility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="private">My Templates</SelectItem>
                <SelectItem value="account">Shared</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {globalSearchResults && globalSearchResults.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                {globalSearchResults.length} result{globalSearchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
              <MobileStack className="space-y-2">
                {globalSearchResults.map((template) => renderTemplateRow(template, true))}
              </MobileStack>
            </div>
          ) : globalSearchResults && globalSearchResults.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground text-center">Try adjusting your search query</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">Select a trade to view and manage templates, or search above</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TRADES.map((trade) => {
                  const count = templateCountByTrade[trade] || 0;
                  const colorClass = tradeColors[trade] || 'bg-primary';
                  return (
                    <Card key={trade} className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] overflow-hidden"
                      onClick={() => setSelectedTrade(trade)}>
                      <div className={`h-2 ${colorClass}`} />
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{trade}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{count} {count === 1 ? 'template' : 'templates'}</p>
                          </div>
                          <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20`}>
                            <FolderOpen className={`h-5 w-5 ${colorClass.replace('bg-', 'text-')}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <CreateTemplateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        {editingTemplate && (
          <EditTemplateModal open={!!editingTemplate} onOpenChange={(open) => { if (!open) setEditingTemplate(null); }} template={editingTemplate} />
        )}
        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{previewTemplate?.name}</DialogTitle>
              <DialogDescription>{previewTemplate?.trade} · {previewTemplate?.line_items?.length || 0} line items</DialogDescription>
            </DialogHeader>
            {previewTemplate && (
              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-3">
                  {previewTemplate.description && <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-muted"><th className="text-left p-2">#</th><th className="text-left p-2">Description</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Unit</th><th className="text-right p-2">Price</th><th className="text-right p-2">Total</th></tr></thead>
                      <tbody>
                        {previewTemplate.line_items?.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{item.itemNumber || i + 1}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{item.unit}</td>
                            <td className="p-2 text-right">${Number(item.unitPrice || 0).toFixed(2)}</td>
                            <td className="p-2 text-right font-medium">${Number(item.totalPrice || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <span className="font-semibold">Total: ${previewTemplate.line_items?.reduce((s, i) => s + (i.totalPrice || 0), 0).toFixed(2)}</span>
                  </div>
                </div>
              </ScrollArea>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MobileOptimizedWrapper>
    );
  }

  if (showPlumbingInvoiceCreator) {
    return (
      <MobileOptimizedWrapper title="Plumbing Invoice Creator" onBackClick={() => setShowPlumbingInvoiceCreator(false)}>
        <PlumbingInvoiceCreator />
      </MobileOptimizedWrapper>
    );
  }

  // Trade-specific view
  return (
    <MobileOptimizedWrapper
      title={selectedTrade}
      onBackClick={handleBackFromTrade}
      actions={
        <div className="flex gap-2">
          {isPlumbingTrade && (
            <Button variant="outline" onClick={() => setShowPlumbingInvoiceCreator(true)}>
              <Receipt className="h-4 w-4 mr-2" /> Invoice Creator
            </Button>
          )}
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Template
          </Button>
        </div>
      }
    >
      {isPlumbingTrade && (
        <div className="px-4 sm:px-0 mb-4">
          <Card className="cursor-pointer hover:shadow-lg transition-all border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 dark:border-blue-800"
            onClick={() => setShowPlumbingInvoiceCreator(true)}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-600 text-white"><Receipt className="h-6 w-6" /></div>
                <div className="flex-1">
                  <h3 className="font-semibold">Plumbing Invoice Creator</h3>
                  <p className="text-sm text-muted-foreground">Quickly create professional plumbing invoices with pre-built service items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-3 mb-4 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as 'all' | 'private' | 'account')}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Visibility" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="private">My Templates</SelectItem>
              <SelectItem value="account">Shared</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredTemplates.length > 0 ? (
        <MobileStack className="space-y-2">
          {filteredTemplates.map((template) => renderTemplateRow(template))}
        </MobileStack>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates in {selectedTrade}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first template for this trade'}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create Template</Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.trade} · {previewTemplate?.line_items?.length || 0} line items</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-3">
                {previewTemplate.description && <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted"><th className="text-left p-2">#</th><th className="text-left p-2">Description</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Unit</th><th className="text-right p-2">Price</th><th className="text-right p-2">Total</th></tr></thead>
                    <tbody>
                      {previewTemplate.line_items?.map((item, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{item.itemNumber || i + 1}</td>
                          <td className="p-2">{item.description}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{item.unit}</td>
                          <td className="p-2 text-right">${Number(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="p-2 text-right font-medium">${Number(item.totalPrice || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <span className="font-semibold">Total: ${previewTemplate.line_items?.reduce((s, i) => s + (i.totalPrice || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateTemplateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      {editingTemplate && (
        <EditTemplateModal open={!!editingTemplate} onOpenChange={(open) => { if (!open) setEditingTemplate(null); }} template={editingTemplate} />
      )}
    </MobileOptimizedWrapper>
  );
}