import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Package, FileText, Settings } from 'lucide-react';
import { useEstimateMacros, MacroGroup, TextMacro } from '@/hooks/useEstimateMacros';
import { toast } from 'sonner';

const TEXT_MACRO_CATEGORIES = [
  { value: 'scope_objective', label: 'Scope - Objective' },
  { value: 'scope_deliverables', label: 'Scope - Deliverables' },
  { value: 'scope_exclusions', label: 'Scope - Exclusions' },
  { value: 'scope_timeline', label: 'Scope - Timeline' },
  { value: 'terms_payment', label: 'Terms - Payment Schedule' },
  { value: 'terms_change_order', label: 'Terms - Change Orders' },
  { value: 'terms_insurance', label: 'Terms - Insurance' },
  { value: 'terms_warranty', label: 'Terms - Warranty' },
];

export default function MacroManager() {
  const { 
    macroGroups, 
    textMacros, 
    loading, 
    createMacroGroup, 
    addLineItemToGroup,
    createTextMacro,
    deleteMacroGroup,
    deleteTextMacro
  } = useEstimateMacros();

  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newTextMacroOpen, setNewTextMacroOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // New group form
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // New text macro form
  const [textMacroName, setTextMacroName] = useState('');
  const [textMacroCategory, setTextMacroCategory] = useState('');
  const [textMacroBody, setTextMacroBody] = useState('');

  // New line item form
  const [itemCode, setItemCode] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('Each');
  const [itemPrice, setItemPrice] = useState('0');

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a name');
      return;
    }
    await createMacroGroup(groupName, groupDesc);
    setGroupName('');
    setGroupDesc('');
    setNewGroupOpen(false);
  };

  const handleCreateTextMacro = async () => {
    if (!textMacroName.trim() || !textMacroCategory || !textMacroBody.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    await createTextMacro(textMacroName, textMacroCategory, textMacroBody);
    setTextMacroName('');
    setTextMacroCategory('');
    setTextMacroBody('');
    setNewTextMacroOpen(false);
  };

  const handleAddLineItem = async () => {
    if (!selectedGroupId || !itemDesc.trim()) {
      toast.error('Please enter a description');
      return;
    }
    await addLineItemToGroup(selectedGroupId, {
      item_code_template: itemCode || null,
      description_template: itemDesc,
      default_quantity: parseFloat(itemQty) || 1,
      default_unit: itemUnit,
      default_unit_price: parseFloat(itemPrice) || 0
    });
    setItemCode('');
    setItemDesc('');
    setItemQty('1');
    setItemUnit('Each');
    setItemPrice('0');
    setAddItemOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Estimate Macros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line-items">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="line-items" className="gap-2">
              <Package className="h-4 w-4" />
              Line Item Macros
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="h-4 w-4" />
              Text Macros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="line-items" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Macro Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Line Item Macro Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name *</Label>
                      <Input 
                        value={groupName} 
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g., Standard Flooring Package"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea 
                        value={groupDesc} 
                        onChange={(e) => setGroupDesc(e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewGroupOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateGroup}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[400px]">
              {macroGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No macro groups yet</p>
                  <p className="text-sm">Create groups to save reusable line items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {macroGroups.map((group) => (
                    <Card key={group.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{group.name}</h4>
                          {group.description && (
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {group.line_items?.length || 0} items
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedGroupId(group.id);
                              setAddItemOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteMacroGroup(group.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {group.line_items && group.line_items.length > 0 && (
                        <div className="mt-3 border-t pt-3 space-y-1">
                          {group.line_items.map((item) => (
                            <div key={item.id} className="text-sm flex justify-between">
                              <span className="truncate">
                                {item.item_code_template && `${item.item_code_template} - `}
                                {item.description_template}
                              </span>
                              <span className="text-muted-foreground">
                                {item.default_quantity} {item.default_unit} @ ${item.default_unit_price}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Add Line Item Dialog */}
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Line Item to Macro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label>Item Code</Label>
                      <Input value={itemCode} onChange={(e) => setItemCode(e.target.value)} placeholder="1.1" />
                    </div>
                    <div className="col-span-3">
                      <Label>Description *</Label>
                      <Input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Description" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>Quantity</Label>
                      <Input type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)} />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} placeholder="SF, LF, Each" />
                    </div>
                    <div>
                      <Label>Unit Price</Label>
                      <Input type="number" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddItemOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddLineItem}>Add Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={newTextMacroOpen} onOpenChange={setNewTextMacroOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Text Macro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Text Macro</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name *</Label>
                      <Input 
                        value={textMacroName} 
                        onChange={(e) => setTextMacroName(e.target.value)}
                        placeholder="e.g., Standard Water Damage SOW"
                      />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <Select value={textMacroCategory} onValueChange={setTextMacroCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEXT_MACRO_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Text *</Label>
                      <Textarea 
                        value={textMacroBody} 
                        onChange={(e) => setTextMacroBody(e.target.value)}
                        placeholder="Enter the macro text..."
                        rows={5}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewTextMacroOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTextMacro}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[400px]">
              {textMacros.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No text macros yet</p>
                  <p className="text-sm">Create macros for scope and terms sections</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {textMacros.map((macro) => (
                    <Card key={macro.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{macro.name}</h4>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {TEXT_MACRO_CATEGORIES.find(c => c.value === macro.category)?.label || macro.category}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {macro.body_text}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive shrink-0"
                          onClick={() => deleteTextMacro(macro.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
