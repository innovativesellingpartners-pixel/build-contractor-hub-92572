import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, FileText, Tag, Trash2, Plus, Lock, Globe, ArrowLeft, FolderOpen } from 'lucide-react';
import { useEstimateTemplates, TRADES, Trade, EstimateTemplate } from '@/hooks/useEstimateTemplates';
import { MobileOptimizedWrapper, MobileStack } from '../sections/MobileOptimizedWrapper';
import { HorizontalRowCard, RowAvatar, RowContent, RowTitleLine, RowMetaLine, RowActions } from '../sections/HorizontalRowCard';
import { useEstimates, EstimateLineItem } from '@/hooks/useEstimates';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreateTemplateDialog } from './CreateTemplateDialog';

interface TemplatesSectionProps {
  onBack: () => void;
  onAddToEstimate?: (lineItems: EstimateLineItem[], estimateId?: string) => void;
}

// Trade card colors for visual distinction
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
  const { templates, isLoading, deleteTemplate, filterTemplates } = useEstimateTemplates();
  const { createEstimateAsync } = useEstimates();
  const { jobs } = useJobs();
  const { user } = useAuth();
  
  // Two-level navigation: null = trade cards, string = specific trade view
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'private' | 'account'>('all');
  
  // For add to estimate dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EstimateTemplate | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  
  // For delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EstimateTemplate | null>(null);
  
  // For create template dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Count templates per trade
  const templateCountByTrade = useMemo(() => {
    const counts: Record<string, number> = {};
    (templates || []).forEach(t => {
      counts[t.trade] = (counts[t.trade] || 0) + 1;
    });
    return counts;
  }, [templates]);

  // Filter templates for selected trade
  const filteredTemplates = useMemo(() => {
    if (!selectedTrade) return [];
    return filterTemplates(selectedTrade, searchQuery, visibility);
  }, [templates, selectedTrade, searchQuery, visibility, filterTemplates]);

  const handleAddClick = (template: EstimateTemplate) => {
    setSelectedTemplate(template);
    setAddDialogOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedTemplate) return;
    
    if (!selectedJobId) {
      toast.error('Please select a job to link this estimate to');
      return;
    }

    const selectedJob = jobs.find(j => j.id === selectedJobId);
    
    try {
      await createEstimateAsync({
        title: `${selectedTemplate.name} - ${selectedJob?.name || 'New Estimate'}`,
        status: 'draft',
        total_amount: 0,
        line_items: selectedTemplate.line_items,
        job_id: selectedJobId,
        site_address: selectedJob?.address || '',
        project_address: [selectedJob?.address, selectedJob?.city, selectedJob?.state, selectedJob?.zip_code].filter(Boolean).join(', '),
      });
      toast.success('New estimate created from template and linked to job');
      onBack();
    } catch (error) {
      console.error('Error creating estimate:', error);
    }
    
    setAddDialogOpen(false);
    setSelectedTemplate(null);
    setSelectedJobId('');
  };

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

  const handleBackFromTrade = () => {
    setSelectedTrade(null);
    setSearchQuery('');
  };

  const activeJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled');

  // If no trade selected, show trade cards dashboard
  if (!selectedTrade) {
    return (
      <MobileOptimizedWrapper
        title="Templates"
        onBackClick={onBack}
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        }
      >
        <div className="px-4 sm:px-0">
          <p className="text-muted-foreground mb-6">
            Select a trade to view and manage templates
          </p>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRADES.map((trade) => {
                const count = templateCountByTrade[trade] || 0;
                const colorClass = tradeColors[trade] || 'bg-primary';
                
                return (
                  <Card
                    key={trade}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] overflow-hidden"
                    onClick={() => setSelectedTrade(trade)}
                  >
                    <div className={`h-2 ${colorClass}`} />
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{trade}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {count} {count === 1 ? 'template' : 'templates'}
                          </p>
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
          )}
        </div>

        <CreateTemplateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </MobileOptimizedWrapper>
    );
  }

  // Trade-specific templates view
  return (
    <MobileOptimizedWrapper
      title={selectedTrade}
      onBackClick={handleBackFromTrade}
      actions={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      }
    >
      {/* Filters */}
      <div className="space-y-3 mb-4 px-4 sm:px-0">
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
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredTemplates.length > 0 ? (
        <MobileStack className="space-y-2">
          {filteredTemplates.map((template) => (
            <HorizontalRowCard key={template.id} onClick={() => handleAddClick(template)}>
              <RowAvatar initials={template.name.substring(0, 2).toUpperCase()} />
              <RowContent>
                <RowTitleLine>
                  <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                </RowTitleLine>
                <RowMetaLine>
                  <Badge variant="outline" className="text-xs">
                    {template.line_items?.length || 0} items
                  </Badge>
                  {template.visibility === 'account' ? (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  )}
                </RowMetaLine>
                {template.tags && template.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {template.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </RowContent>
              <RowActions>
                <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAddClick(template); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Use
                </Button>
                {template.user_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleDeleteClick(template, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </RowActions>
            </HorizontalRowCard>
          ))}
        </MobileStack>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates in {selectedTrade}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first template for this trade'}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Template to Job Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Select a job to create a new estimate from this template. The original template will remain unchanged.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job-select">Select Job *</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job to link..." />
                </SelectTrigger>
                <SelectContent>
                  {activeJobs.length === 0 ? (
                    <SelectItem value="none" disabled>No active jobs available</SelectItem>
                  ) : (
                    activeJobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.job_number ? `${job.job_number} - ` : ''}{job.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A new estimate will be created and linked to this job.
              </p>
            </div>
            
            {selectedTemplate && (
              <div className="bg-muted rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium">Template Details:</p>
                <p className="text-xs text-muted-foreground">{selectedTemplate.line_items?.length || 0} line items</p>
                <p className="text-xs text-muted-foreground">Trade: {selectedTemplate.trade}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); setSelectedJobId(''); }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAdd} disabled={!selectedJobId}>
              Create Estimate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultTrade={selectedTrade}
      />
    </MobileOptimizedWrapper>
  );
}
