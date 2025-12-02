import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Search, Plus, Package } from 'lucide-react';
import { MacroGroup, LineItemMacro } from '@/hooks/useEstimateMacros';

interface MacroSelectorProps {
  macroGroups: MacroGroup[];
  onSelectGroup: (lineItems: LineItemMacro[]) => void;
  triggerLabel?: string;
}

export default function MacroSelector({ 
  macroGroups, 
  onSelectGroup,
  triggerLabel = "Add from Macro"
}: MacroSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredGroups = macroGroups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    group.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (group: MacroGroup) => {
    if (group.line_items && group.line_items.length > 0) {
      onSelectGroup(group.line_items);
      setOpen(false);
      setSearch('');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Layers className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Line Item Macro
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search macros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No macros found</p>
              <p className="text-sm mt-1">Create macros in Settings to use them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => (
                <Card 
                  key={group.id} 
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelect(group)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{group.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {group.line_items?.length || 0} items
                        </Badge>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                      
                      {group.line_items && group.line_items.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {group.line_items.slice(0, 3).map((item, idx) => (
                            <div key={item.id} className="text-xs text-muted-foreground flex justify-between">
                              <span className="truncate max-w-[70%]">
                                {item.item_code_template && `${item.item_code_template} - `}
                                {item.description_template}
                              </span>
                              <span>{formatCurrency(item.default_unit_price)}/{item.default_unit}</span>
                            </div>
                          ))}
                          {group.line_items.length > 3 && (
                            <p className="text-xs text-muted-foreground italic">
                              +{group.line_items.length - 3} more items
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
