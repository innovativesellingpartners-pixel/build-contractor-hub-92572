import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { FileText, Search, Plus } from 'lucide-react';
import { TextMacro } from '@/hooks/useEstimateMacros';

interface TextMacroSelectorProps {
  macros: TextMacro[];
  onSelect: (text: string) => void;
  triggerLabel?: string;
  triggerVariant?: 'outline' | 'ghost' | 'secondary';
  triggerSize?: 'sm' | 'default' | 'icon';
}

export default function TextMacroSelector({ 
  macros, 
  onSelect,
  triggerLabel = "Insert from Macro",
  triggerVariant = "outline",
  triggerSize = "sm"
}: TextMacroSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredMacros = macros.filter(macro =>
    macro.name.toLowerCase().includes(search.toLowerCase()) ||
    macro.body_text.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (macro: TextMacro) => {
    onSelect(macro.body_text);
    setOpen(false);
    setSearch('');
  };

  if (macros.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className="gap-2">
          <FileText className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[70vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Text Macro
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

        <ScrollArea className="h-[350px] pr-4">
          {filteredMacros.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No macros found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMacros.map((macro) => (
                <Card 
                  key={macro.id} 
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelect(macro)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{macro.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {macro.body_text}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="shrink-0">
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
