import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, FileCheck, FileX, Save, Loader2 } from 'lucide-react';
import { useTrades, useAssumptionTemplates, useExclusionTemplates, useEstimateAssumptionsExclusions } from '@/hooks/useTrades';
import { toast } from 'sonner';

// Predefined exclusion options organized by category
const PREDEFINED_EXCLUSION_OPTIONS = [
  {
    category: 'Permits & Fees',
    options: [
      { title: 'Permit Fees', text: 'All permit fees, inspection fees, and governmental charges are excluded from this estimate.' },
      { title: 'Impact Fees', text: 'Impact fees, development fees, or any municipal charges are not included.' },
      { title: 'Tap Fees', text: 'Water, sewer, or utility tap fees are excluded from the scope of work.' },
    ]
  },
  {
    category: 'Hazardous Materials',
    options: [
      { title: 'Asbestos Abatement', text: 'Testing, removal, or abatement of asbestos-containing materials is excluded.' },
      { title: 'Lead Paint Removal', text: 'Lead paint testing, removal, or remediation is not included in this estimate.' },
      { title: 'Mold Remediation', text: 'Mold testing, removal, or remediation work is excluded from this scope.' },
    ]
  },
  {
    category: 'Design Services',
    options: [
      { title: 'Architectural Design', text: 'Architectural design, drawings, or engineering services are not included.' },
      { title: 'Structural Engineering', text: 'Structural engineering analysis, design, or stamped drawings are excluded.' },
      { title: 'MEP Engineering', text: 'Mechanical, electrical, or plumbing engineering services are not included.' },
    ]
  },
  {
    category: 'Existing Conditions',
    options: [
      { title: 'Concealed Damage', text: 'Repair of any concealed damage discovered during construction is excluded and will be addressed via change order.' },
      { title: 'Hidden Defects', text: 'Correction of hidden structural defects or code violations is not included.' },
      { title: 'Unknown Conditions', text: 'Work required due to unforeseen or unknown existing conditions is excluded.' },
    ]
  },
  {
    category: 'Finish Work',
    options: [
      { title: 'Painting', text: 'All painting, staining, or finish coating work is excluded from this estimate.' },
      { title: 'Drywall Repair', text: 'Drywall patching, finishing, or texture matching is not included.' },
      { title: 'Flooring', text: 'Flooring installation, repair, or replacement is excluded from the scope.' },
    ]
  },
  {
    category: 'Structural',
    options: [
      { title: 'Framing Repair', text: 'Structural framing repair or modifications are excluded unless specifically noted.' },
      { title: 'Foundation Work', text: 'Foundation repair, underpinning, or modification work is not included.' },
      { title: 'Load-Bearing Modifications', text: 'Modifications to load-bearing walls or structural elements are excluded.' },
    ]
  },
  {
    category: 'Utilities',
    options: [
      { title: 'Electrical Upgrades', text: 'Electrical panel upgrades, rewiring, or code compliance work is excluded.' },
      { title: 'Plumbing Upgrades', text: 'Plumbing system upgrades or modifications beyond the immediate work area are not included.' },
      { title: 'HVAC Work', text: 'HVAC system modifications, ductwork, or equipment installation is excluded.' },
    ]
  },
  {
    category: 'Site Work',
    options: [
      { title: 'Excavation', text: 'Excavation, grading, or earthwork beyond immediate project needs is excluded.' },
      { title: 'Landscaping', text: 'Landscaping, irrigation, or lawn restoration is not included in this estimate.' },
      { title: 'Tree Removal', text: 'Tree or stump removal is excluded from the scope of work.' },
    ]
  },
];

interface AssumptionRow {
  id?: string;
  templateId: string | null;
  title: string;
  text: string;
  category: string;
  priority: number;
  selected: boolean;
  isCustom: boolean;
  tradeName?: string;
}

interface AssumptionsExclusionsTabProps {
  estimateId: string;
  onSave?: () => void;
}

export function AssumptionsExclusionsTab({ estimateId, onSave }: AssumptionsExclusionsTabProps) {
  const { trades } = useTrades();
  const { templates: allAssumptionTemplates } = useAssumptionTemplates();
  const { templates: allExclusionTemplates } = useExclusionTemplates();
  const { 
    assumptions: savedAssumptions, 
    exclusions: savedExclusions, 
    estimateTrades,
    isLoading,
    saveAssumptions,
    saveExclusions,
    updateEstimateTrades,
  } = useEstimateAssumptionsExclusions(estimateId);

  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [assumptionRows, setAssumptionRows] = useState<AssumptionRow[]>([]);
  const [exclusionRows, setExclusionRows] = useState<AssumptionRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showExclusionPicker, setShowExclusionPicker] = useState(false);

  // Initialize from saved data or templates
  useEffect(() => {
    if (isLoading || initialized) return;

    // Load selected trades
    const tradeIds = estimateTrades.map((et: any) => et.trade_id);
    setSelectedTradeIds(tradeIds);

    // If we have saved assumptions, use them
    if (savedAssumptions.length > 0) {
      setAssumptionRows(savedAssumptions.map(a => ({
        id: a.id,
        templateId: a.template_id,
        title: '',
        text: a.text,
        category: a.category || 'General',
        priority: a.priority || 0,
        selected: true,
        isCustom: a.is_custom,
      })));
    }

    // If we have saved exclusions, use them
    if (savedExclusions.length > 0) {
      setExclusionRows(savedExclusions.map(e => ({
        id: e.id,
        templateId: e.template_id,
        title: '',
        text: e.text,
        category: e.category || 'General',
        priority: e.priority || 0,
        selected: true,
        isCustom: e.is_custom,
      })));
    }

    setInitialized(true);
  }, [isLoading, savedAssumptions, savedExclusions, estimateTrades, initialized]);

  // When trades change, update available templates
  useEffect(() => {
    if (!initialized || selectedTradeIds.length === 0) return;

    // Get templates for selected trades
    const relevantAssumptions = allAssumptionTemplates.filter(
      t => selectedTradeIds.includes(t.trade_id) && t.is_active
    );
    const relevantExclusions = allExclusionTemplates.filter(
      t => selectedTradeIds.includes(t.trade_id) && t.is_active
    );

    // Only add new templates if we don't already have saved data for them
    const existingTemplateIds = assumptionRows.map(r => r.templateId).filter(Boolean);
    const newAssumptions = relevantAssumptions
      .filter(t => !existingTemplateIds.includes(t.id))
      .map(t => ({
        templateId: t.id,
        title: t.title,
        text: t.body,
        category: t.category,
        priority: t.priority,
        selected: t.default_selected,
        isCustom: false,
        tradeName: t.trade?.name,
      }));

    const existingExclusionIds = exclusionRows.map(r => r.templateId).filter(Boolean);
    const newExclusions = relevantExclusions
      .filter(t => !existingExclusionIds.includes(t.id))
      .map(t => ({
        templateId: t.id,
        title: t.title,
        text: t.body,
        category: t.category,
        priority: t.priority,
        selected: t.default_selected,
        isCustom: false,
        tradeName: t.trade?.name,
      }));

    if (newAssumptions.length > 0) {
      setAssumptionRows(prev => [...prev, ...newAssumptions]);
    }
    if (newExclusions.length > 0) {
      setExclusionRows(prev => [...prev, ...newExclusions]);
    }
  }, [selectedTradeIds, allAssumptionTemplates, allExclusionTemplates, initialized]);

  const handleTradeToggle = (tradeId: string) => {
    setSelectedTradeIds(prev => {
      if (prev.includes(tradeId)) {
        // Remove trade - also remove non-custom items for this trade
        const tradesToRemove = allAssumptionTemplates
          .filter(t => t.trade_id === tradeId)
          .map(t => t.id);
        setAssumptionRows(rows => rows.filter(r => 
          r.isCustom || !tradesToRemove.includes(r.templateId || '')
        ));
        
        const exclusionsToRemove = allExclusionTemplates
          .filter(t => t.trade_id === tradeId)
          .map(t => t.id);
        setExclusionRows(rows => rows.filter(r => 
          r.isCustom || !exclusionsToRemove.includes(r.templateId || '')
        ));

        return prev.filter(id => id !== tradeId);
      } else {
        return [...prev, tradeId];
      }
    });
  };

  const handleAddCustomAssumption = () => {
    setAssumptionRows(prev => [...prev, {
      templateId: null,
      title: 'Custom Assumption',
      text: '',
      category: 'Custom',
      priority: 999,
      selected: true,
      isCustom: true,
    }]);
  };

  const handleAddCustomExclusion = () => {
    setExclusionRows(prev => [...prev, {
      templateId: null,
      title: 'Custom Exclusion',
      text: '',
      category: 'Custom',
      priority: 999,
      selected: true,
      isCustom: true,
    }]);
    setShowExclusionPicker(false);
  };

  const handleAddPredefinedExclusion = (option: { title: string; text: string }, category: string) => {
    setExclusionRows(prev => [...prev, {
      templateId: null,
      title: option.title,
      text: option.text,
      category: category,
      priority: 999,
      selected: true,
      isCustom: true,
    }]);
    setShowExclusionPicker(false);
    toast.success(`Added: ${option.title}`);
  };

  const handleRemoveRow = (type: 'assumption' | 'exclusion', index: number) => {
    if (type === 'assumption') {
      setAssumptionRows(prev => prev.filter((_, i) => i !== index));
    } else {
      setExclusionRows(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save trades
      await updateEstimateTrades.mutateAsync(selectedTradeIds);

      // Save selected assumptions
      const assumptionsToSave = assumptionRows
        .filter(r => r.selected && r.text.trim())
        .map(r => ({
          template_id: r.templateId,
          text: r.text,
          category: r.category,
          priority: r.priority,
          is_custom: r.isCustom,
        }));
      await saveAssumptions.mutateAsync(assumptionsToSave);

      // Save selected exclusions
      const exclusionsToSave = exclusionRows
        .filter(r => r.selected && r.text.trim())
        .map(r => ({
          template_id: r.templateId,
          text: r.text,
          category: r.category,
          priority: r.priority,
          is_custom: r.isCustom,
        }));
      await saveExclusions.mutateAsync(exclusionsToSave);

      toast.success('Assumptions & exclusions saved');
      onSave?.();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Group rows by category
  const groupedAssumptions = useMemo(() => {
    const grouped: Record<string, AssumptionRow[]> = {};
    assumptionRows.forEach(row => {
      const key = row.category || 'General';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });
    return grouped;
  }, [assumptionRows]);

  const groupedExclusions = useMemo(() => {
    const grouped: Record<string, AssumptionRow[]> = {};
    exclusionRows.forEach(row => {
      const key = row.category || 'General';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });
    return grouped;
  }, [exclusionRows]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trade Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Trades</CardTitle>
          <CardDescription>
            Choose the trades relevant to this estimate. Templates will be loaded for each selected trade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {trades.filter(t => t.is_active).map(trade => (
              <Button
                key={trade.id}
                variant={selectedTradeIds.includes(trade.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTradeToggle(trade.id)}
              >
                {trade.name}
                {trade.code && <Badge variant="secondary" className="ml-2">{trade.code}</Badge>}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Assumptions Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <CardTitle>Assumptions</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddCustomAssumption}>
                <Plus className="h-4 w-4 mr-1" />
                Add Custom
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {Object.keys(groupedAssumptions).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Select a trade to load assumption templates
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedAssumptions).map(([category, rows]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h4>
                      <div className="space-y-2">
                        {rows.map((row, idx) => {
                          const globalIdx = assumptionRows.indexOf(row);
                          return (
                            <div key={globalIdx} className="border rounded-lg p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={row.selected}
                                  onCheckedChange={(checked) => {
                                    setAssumptionRows(prev => prev.map((r, i) => 
                                      i === globalIdx ? { ...r, selected: !!checked } : r
                                    ));
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{row.title || 'Assumption'}</p>
                                  {row.tradeName && (
                                    <Badge variant="outline" className="text-xs">{row.tradeName}</Badge>
                                  )}
                                </div>
                                {row.isCustom && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleRemoveRow('assumption', globalIdx)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <Textarea
                                value={row.text}
                                onChange={(e) => {
                                  setAssumptionRows(prev => prev.map((r, i) => 
                                    i === globalIdx ? { ...r, text: e.target.value } : r
                                  ));
                                }}
                                rows={2}
                                className="text-sm"
                                disabled={!row.selected}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Exclusions Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileX className="h-5 w-5 text-destructive" />
                <CardTitle>Exclusions</CardTitle>
              </div>
              <Dialog open={showExclusionPicker} onOpenChange={setShowExclusionPicker}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Add Exclusion</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[50vh] pr-4">
                    <div className="space-y-4">
                      {PREDEFINED_EXCLUSION_OPTIONS.map((group) => (
                        <div key={group.category}>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{group.category}</h4>
                          <div className="space-y-1">
                            {group.options.map((option) => (
                              <Button
                                key={option.title}
                                variant="ghost"
                                className="w-full justify-start text-left h-auto py-2 px-3"
                                onClick={() => handleAddPredefinedExclusion(option, group.category)}
                              >
                                <span className="text-sm">{option.title}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleAddCustomExclusion}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Exclusion
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {Object.keys(groupedExclusions).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Select a trade to load exclusion templates
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedExclusions).map(([category, rows]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h4>
                      <div className="space-y-2">
                        {rows.map((row, idx) => {
                          const globalIdx = exclusionRows.indexOf(row);
                          return (
                            <div key={globalIdx} className="border rounded-lg p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={row.selected}
                                  onCheckedChange={(checked) => {
                                    setExclusionRows(prev => prev.map((r, i) => 
                                      i === globalIdx ? { ...r, selected: !!checked } : r
                                    ));
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{row.title || 'Exclusion'}</p>
                                  {row.tradeName && (
                                    <Badge variant="outline" className="text-xs">{row.tradeName}</Badge>
                                  )}
                                </div>
                                {row.isCustom && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleRemoveRow('exclusion', globalIdx)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <Textarea
                                value={row.text}
                                onChange={(e) => {
                                  setExclusionRows(prev => prev.map((r, i) => 
                                    i === globalIdx ? { ...r, text: e.target.value } : r
                                  ));
                                }}
                                rows={2}
                                className="text-sm"
                                disabled={!row.selected}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Assumptions & Exclusions
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
