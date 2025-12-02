import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronDown, Plus, X, Target } from 'lucide-react';
import { TextMacro } from '@/hooks/useEstimateMacros';
import TextMacroSelector from './TextMacroSelector';

interface ScopeOfWorkSectionProps {
  objective: string;
  keyDeliverables: string[];
  exclusions: string[];
  timeline: string;
  onChange: (field: string, value: string | string[]) => void;
  textMacros?: TextMacro[];
}

export default function ScopeOfWorkSection({
  objective,
  keyDeliverables,
  exclusions,
  timeline,
  onChange,
  textMacros = [],
}: ScopeOfWorkSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const addDeliverable = () => {
    onChange('keyDeliverables', [...keyDeliverables, '']);
  };

  const updateDeliverable = (index: number, value: string) => {
    const updated = [...keyDeliverables];
    updated[index] = value;
    onChange('keyDeliverables', updated);
  };

  const removeDeliverable = (index: number) => {
    onChange('keyDeliverables', keyDeliverables.filter((_, i) => i !== index));
  };

  const addExclusion = () => {
    onChange('exclusions', [...exclusions, '']);
  };

  const updateExclusion = (index: number, value: string) => {
    const updated = [...exclusions];
    updated[index] = value;
    onChange('exclusions', updated);
  };

  const removeExclusion = (index: number) => {
    onChange('exclusions', exclusions.filter((_, i) => i !== index));
  };

  const objectiveMacros = textMacros.filter(m => m.category === 'scope_objective');
  const deliverableMacros = textMacros.filter(m => m.category === 'scope_deliverables');
  const exclusionMacros = textMacros.filter(m => m.category === 'scope_exclusions');
  const timelineMacros = textMacros.filter(m => m.category === 'scope_timeline');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 border-border/50">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Scope of Work
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Objective */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="scope_objective" className="text-sm font-semibold">
                  Project Objective
                </Label>
                {objectiveMacros.length > 0 && (
                  <TextMacroSelector
                    macros={objectiveMacros}
                    onSelect={(text) => onChange('objective', objective ? `${objective}\n\n${text}` : text)}
                    triggerLabel="Insert Macro"
                    triggerSize="sm"
                  />
                )}
              </div>
              <Textarea
                id="scope_objective"
                value={objective}
                onChange={(e) => onChange('objective', e.target.value)}
                placeholder="Describe the main objective and goals of this project..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Key Deliverables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Key Deliverables</Label>
                <div className="flex gap-2">
                  {deliverableMacros.length > 0 && (
                    <TextMacroSelector
                      macros={deliverableMacros}
                      onSelect={(text) => onChange('keyDeliverables', [...keyDeliverables, text])}
                      triggerLabel="From Macro"
                      triggerSize="sm"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDeliverable}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Deliverable
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {keyDeliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      value={deliverable}
                      onChange={(e) => updateDeliverable(index, e.target.value)}
                      placeholder="e.g., New flooring installation"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDeliverable(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {keyDeliverables.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No deliverables added yet. Click "Add Deliverable" to start.
                  </p>
                )}
              </div>
            </div>

            {/* Exclusions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Exclusions</Label>
                <div className="flex gap-2">
                  {exclusionMacros.length > 0 && (
                    <TextMacroSelector
                      macros={exclusionMacros}
                      onSelect={(text) => onChange('exclusions', [...exclusions, text])}
                      triggerLabel="From Macro"
                      triggerSize="sm"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addExclusion}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Exclusion
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {exclusions.map((exclusion, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">•</span>
                    <Input
                      value={exclusion}
                      onChange={(e) => updateExclusion(index, e.target.value)}
                      placeholder="e.g., Hazardous material testing unless explicitly listed"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExclusion(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {exclusions.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No exclusions added yet. Click "Add Exclusion" to specify what's not included.
                  </p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="scope_timeline" className="text-sm font-semibold">
                  Estimated Timeline
                </Label>
                {timelineMacros.length > 0 && (
                  <TextMacroSelector
                    macros={timelineMacros}
                    onSelect={(text) => onChange('timeline', text)}
                    triggerLabel="Insert Macro"
                    triggerSize="sm"
                  />
                )}
              </div>
              <Input
                id="scope_timeline"
                value={timeline}
                onChange={(e) => onChange('timeline', e.target.value)}
                placeholder="e.g., 6-8 weeks from contract signing and deposit receipt"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
