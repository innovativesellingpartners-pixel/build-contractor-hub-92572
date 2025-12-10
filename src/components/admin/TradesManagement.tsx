import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, ArrowLeft, FileCheck, FileX } from 'lucide-react';
import { useTrades, useAssumptionTemplates, useExclusionTemplates, Trade, AssumptionTemplate, ExclusionTemplate } from '@/hooks/useTrades';

export function TradesManagement() {
  const { trades, isLoading, createTrade, updateTrade, deleteTrade } = useTrades();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Partial<Trade>>({});

  const handleCreateTrade = () => {
    setEditingTrade({});
    setTradeDialogOpen(true);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setTradeDialogOpen(true);
  };

  const handleSaveTrade = async () => {
    if (editingTrade.id) {
      await updateTrade.mutateAsync(editingTrade as Trade);
    } else {
      await createTrade.mutateAsync(editingTrade);
    }
    setTradeDialogOpen(false);
  };

  if (selectedTrade) {
    return (
      <TradeDetail
        trade={selectedTrade}
        onBack={() => setSelectedTrade(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trades & Templates</h1>
          <p className="text-muted-foreground">Manage assumption and exclusion templates by trade</p>
        </div>
        <Button onClick={handleCreateTrade}>
          <Plus className="h-4 w-4 mr-2" />
          Add Trade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trades</CardTitle>
          <CardDescription>Click a trade to manage its assumption and exclusion templates</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow 
                    key={trade.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTrade(trade)}
                  >
                    <TableCell className="font-medium">{trade.name}</TableCell>
                    <TableCell>
                      {trade.code && <Badge variant="outline">{trade.code}</Badge>}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{trade.description}</TableCell>
                    <TableCell>
                      <Badge variant={trade.is_active ? 'default' : 'secondary'}>
                        {trade.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleEditTrade(trade); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Trade Dialog */}
      <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTrade.id ? 'Edit Trade' : 'Add Trade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trade Name *</Label>
              <Input
                value={editingTrade.name || ''}
                onChange={(e) => setEditingTrade({ ...editingTrade, name: e.target.value })}
                placeholder="e.g., General Construction"
              />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={editingTrade.code || ''}
                onChange={(e) => setEditingTrade({ ...editingTrade, code: e.target.value })}
                placeholder="e.g., GC"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingTrade.description || ''}
                onChange={(e) => setEditingTrade({ ...editingTrade, description: e.target.value })}
                placeholder="Brief description of this trade..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editingTrade.is_active ?? true}
                onCheckedChange={(checked) => setEditingTrade({ ...editingTrade, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTradeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTrade} disabled={!editingTrade.name}>
              {editingTrade.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TradeDetailProps {
  trade: Trade;
  onBack: () => void;
}

function TradeDetail({ trade, onBack }: TradeDetailProps) {
  const { templates: assumptions, createTemplate: createAssumption, updateTemplate: updateAssumption, deleteTemplate: deleteAssumption } = useAssumptionTemplates(trade.id);
  const { templates: exclusions, createTemplate: createExclusion, updateTemplate: updateExclusion, deleteTemplate: deleteExclusion } = useExclusionTemplates(trade.id);
  
  const [activeTab, setActiveTab] = useState('assumptions');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateType, setTemplateType] = useState<'assumption' | 'exclusion'>('assumption');
  const [editingTemplate, setEditingTemplate] = useState<Partial<AssumptionTemplate | ExclusionTemplate>>({});

  const handleCreateTemplate = (type: 'assumption' | 'exclusion') => {
    setTemplateType(type);
    setEditingTemplate({ trade_id: trade.id, priority: 0, default_selected: true, is_active: true });
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: AssumptionTemplate | ExclusionTemplate, type: 'assumption' | 'exclusion') => {
    setTemplateType(type);
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (templateType === 'assumption') {
      if (editingTemplate.id) {
        await updateAssumption.mutateAsync(editingTemplate as AssumptionTemplate);
      } else {
        await createAssumption.mutateAsync(editingTemplate);
      }
    } else {
      if (editingTemplate.id) {
        await updateExclusion.mutateAsync(editingTemplate as ExclusionTemplate);
      } else {
        await createExclusion.mutateAsync(editingTemplate);
      }
    }
    setTemplateDialogOpen(false);
  };

  const handleArchiveTemplate = async (id: string, type: 'assumption' | 'exclusion') => {
    if (type === 'assumption') {
      await deleteAssumption.mutateAsync(id);
    } else {
      await deleteExclusion.mutateAsync(id);
    }
  };

  const activeAssumptions = assumptions.filter(t => t.is_active);
  const activeExclusions = exclusions.filter(t => t.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{trade.name}</h1>
          <p className="text-muted-foreground">{trade.description}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assumptions" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Assumptions ({activeAssumptions.length})
          </TabsTrigger>
          <TabsTrigger value="exclusions" className="flex items-center gap-2">
            <FileX className="h-4 w-4" />
            Exclusions ({activeExclusions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assumptions" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleCreateTemplate('assumption')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assumption
            </Button>
          </div>
          <TemplateTable
            templates={activeAssumptions}
            onEdit={(t) => handleEditTemplate(t, 'assumption')}
            onArchive={(id) => handleArchiveTemplate(id, 'assumption')}
          />
        </TabsContent>

        <TabsContent value="exclusions" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleCreateTemplate('exclusion')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exclusion
            </Button>
          </div>
          <TemplateTable
            templates={activeExclusions}
            onEdit={(t) => handleEditTemplate(t, 'exclusion')}
            onArchive={(id) => handleArchiveTemplate(id, 'exclusion')}
          />
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate.id ? 'Edit' : 'Add'} {templateType === 'assumption' ? 'Assumption' : 'Exclusion'} Template
            </DialogTitle>
            <DialogDescription>
              This template will be available when creating estimates for {trade.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={(editingTemplate as any).title || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  placeholder="Short label for this template"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input
                  value={(editingTemplate as any).category || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                  placeholder="e.g., Labor, Site conditions"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Body Text *</Label>
              <Textarea
                value={(editingTemplate as any).body || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                placeholder="Full text that will appear on the estimate..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority (sort order)</Label>
                <Input
                  type="number"
                  value={(editingTemplate as any).priority || 0}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={(editingTemplate as any).default_selected ?? true}
                    onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, default_selected: checked as boolean })}
                  />
                  <Label>Selected by default</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveTemplate} 
              disabled={!(editingTemplate as any).title || !(editingTemplate as any).body || !(editingTemplate as any).category}
            >
              {editingTemplate.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TemplateTableProps {
  templates: (AssumptionTemplate | ExclusionTemplate)[];
  onEdit: (template: AssumptionTemplate | ExclusionTemplate) => void;
  onArchive: (id: string) => void;
}

function TemplateTable({ templates, onEdit, onArchive }: TemplateTableProps) {
  // Group by category
  const grouped = templates.reduce((acc, t) => {
    const cat = t.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {} as Record<string, typeof templates>);

  const categories = Object.keys(grouped).sort();

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No templates yet. Click "Add" to create your first template.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <Card key={category}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">{category}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Body</TableHead>
                  <TableHead className="w-24">Default</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped[category]
                  .sort((a, b) => a.priority - b.priority)
                  .map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="text-muted-foreground">{template.priority}</TableCell>
                      <TableCell className="font-medium">{template.title}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-md truncate text-sm text-muted-foreground">
                        {template.body}
                      </TableCell>
                      <TableCell>
                        {template.default_selected && <Badge variant="secondary">Yes</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onArchive(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
