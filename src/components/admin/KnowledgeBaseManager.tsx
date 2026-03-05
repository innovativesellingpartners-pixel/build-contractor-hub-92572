import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, BookOpen } from 'lucide-react';

const CATEGORIES = [
  { value: 'platform_howto', label: 'Platform How-To' },
  { value: 'sales_training', label: 'Sales Training' },
  { value: 'objection_handling', label: 'Objection Handling' },
  { value: 'scripts', label: 'Scripts' },
  { value: 'faq', label: 'FAQ' },
  { value: 'best_practices', label: 'Best Practices' },
];

interface KBEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function KnowledgeBaseManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KBEntry | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'faq',
    keywords: '',
    tags: '',
    is_active: true,
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['kb-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base_entries')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as KBEntry[];
    },
  });

  const filteredEntries = filterCategory === 'all'
    ? entries
    : entries.filter(e => e.category === filterCategory);

  const saveMutation = useMutation({
    mutationFn: async (entry: any) => {
      const payload = {
        title: entry.title,
        content: entry.content,
        category: entry.category,
        keywords: entry.keywords?.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean) || [],
        tags: entry.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
        is_active: entry.is_active,
      };

      if (entry.id) {
        const { error } = await supabase
          .from('knowledge_base_entries')
          .update(payload)
          .eq('id', entry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('knowledge_base_entries')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-entries'] });
      setIsDialogOpen(false);
      setEditing(null);
      toast({ title: 'Entry saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error saving entry', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_base_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-entries'] });
      toast({ title: 'Entry deleted' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('knowledge_base_entries')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-entries'] });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (text: string) => {
      const lines = text.trim().split('\n').filter(Boolean);
      const entries = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return {
          title: parts[0] || 'Untitled',
          category: CATEGORIES.find(c => c.value === parts[1])?.value || 'faq',
          content: parts[2] || parts[0] || '',
          keywords: parts[3]?.split(',').map(k => k.trim().toLowerCase()).filter(Boolean) || [],
          tags: [],
          is_active: true,
        };
      });

      const { error } = await supabase.from('knowledge_base_entries').insert(entries);
      if (error) throw error;
      return entries.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['kb-entries'] });
      setIsBulkDialogOpen(false);
      setBulkText('');
      toast({ title: `${count} entries imported successfully` });
    },
    onError: (error) => {
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({ title: '', content: '', category: 'faq', keywords: '', tags: '', is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (entry: KBEntry) => {
    setEditing(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      keywords: entry.keywords?.join(', ') || '',
      tags: entry.tags?.join(', ') || '',
      is_active: entry.is_active,
    });
    setIsDialogOpen(true);
  };

  const getCategoryLabel = (value: string) =>
    CATEGORIES.find(c => c.value === value)?.label || value;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">{filteredEntries.length} entries</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium max-w-[250px] truncate">{entry.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getCategoryLabel(entry.category)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {entry.keywords?.join(', ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.is_active ? 'default' : 'outline'}>
                      {entry.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActiveMutation.mutate({ id: entry.id, is_active: !entry.is_active })}
                      >
                        {entry.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(entry.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {isLoading ? 'Loading...' : 'No entries yet. Click "New Entry" to create one.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Entry' : 'New Knowledge Base Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. How to Send an Estimate"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content (Markdown supported)</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write the full content here..."
                rows={12}
              />
            </div>
            <div>
              <Label>Keywords (comma-separated)</Label>
              <Input
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="estimate, send, email, proposal"
              />
              <p className="text-xs text-muted-foreground mt-1">These improve search matching</p>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="estimates, getting-started"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active (included in AI responses)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate({ ...formData, id: editing?.id })}
              disabled={saveMutation.isPending || !formData.title || !formData.content}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Knowledge Base Entries</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste entries, one per line. Format: <code>Title | category | Content | keywords</code>
            </p>
            <p className="text-xs text-muted-foreground">
              Categories: platform_howto, sales_training, objection_handling, scripts, faq, best_practices
            </p>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`How to Create an Estimate | platform_howto | Go to Estimates in the sidebar, click "New Estimate"... | estimate,create,new`}
              rows={10}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => bulkImportMutation.mutate(bulkText)}
              disabled={bulkImportMutation.isPending || !bulkText.trim()}
            >
              {bulkImportMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
