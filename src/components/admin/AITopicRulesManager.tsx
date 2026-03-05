import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Brain, ToggleLeft, ToggleRight } from 'lucide-react';

interface AITopicRule {
  id: string;
  topic_name: string;
  category: string;
  description: string | null;
  custom_instructions: string | null;
  is_enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'trades', label: 'Trades / Technical' },
  { value: 'estimating', label: 'Estimating' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'sales', label: 'Sales' },
  { value: 'business', label: 'Business Operations' },
  { value: 'materials', label: 'Materials & Codes' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'compliance', label: 'Compliance & Safety' },
];

const categoryColors: Record<string, string> = {
  trades: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  estimating: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  project_management: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  sales: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  business: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  materials: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  customer_service: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  compliance: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function AITopicRulesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AITopicRule | null>(null);
  const [formData, setFormData] = useState({
    topic_name: '',
    category: 'trades',
    description: '',
    custom_instructions: '',
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['ai-topic-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_topic_rules')
        .select('*')
        .order('category', { ascending: true })
        .order('topic_name', { ascending: true });
      if (error) throw error;
      return data as AITopicRule[];
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('ai_topic_rules')
        .update({ is_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-topic-rules'] });
    },
  });

  const saveRule = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('ai_topic_rules')
          .update({
            topic_name: data.topic_name,
            category: data.category,
            description: data.description || null,
            custom_instructions: data.custom_instructions || null,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_topic_rules')
          .insert({
            topic_name: data.topic_name,
            category: data.category,
            description: data.description || null,
            custom_instructions: data.custom_instructions || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-topic-rules'] });
      setIsDialogOpen(false);
      setEditingRule(null);
      toast({ title: editingRule ? 'Topic updated' : 'Topic added' });
    },
    onError: (error) => {
      toast({ title: 'Error saving topic', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_topic_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-topic-rules'] });
      toast({ title: 'Topic deleted' });
    },
  });

  const bulkToggleCategory = useMutation({
    mutationFn: async ({ category, is_enabled }: { category: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('ai_topic_rules')
        .update({ is_enabled })
        .eq('category', category);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-topic-rules'] });
      toast({ title: 'Category updated' });
    },
  });

  const openDialog = (rule?: AITopicRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        topic_name: rule.topic_name,
        category: rule.category,
        description: rule.description || '',
        custom_instructions: rule.custom_instructions || '',
      });
    } else {
      setEditingRule(null);
      setFormData({ topic_name: '', category: 'trades', description: '', custom_instructions: '' });
    }
    setIsDialogOpen(true);
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.topic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const enabledCount = rules.filter((r) => r.is_enabled).length;
  const groupedByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    rules: filteredRules.filter((r) => r.category === cat.value),
    enabledCount: rules.filter((r) => r.category === cat.value && r.is_enabled).length,
    totalCount: rules.filter((r) => r.category === cat.value).length,
  })).filter((g) => g.rules.length > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{rules.length - enabledCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Topic
        </Button>
      </div>

      {/* Grouped Tables */}
      {isLoading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading topics...</CardContent></Card>
      ) : (
        groupedByCategory.map((group) => (
          <Card key={group.value}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{group.label}</CardTitle>
                    <CardDescription>{group.enabledCount}/{group.totalCount} topics enabled</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkToggleCategory.mutate({ category: group.value, is_enabled: true })}
                  >
                    <ToggleRight className="h-4 w-4 mr-1" />
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkToggleCategory.mutate({ category: group.value, is_enabled: false })}
                  >
                    <ToggleLeft className="h-4 w-4 mr-1" />
                    Disable All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Active</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden lg:table-cell">Restrictions</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.rules.map((rule) => (
                    <TableRow key={rule.id} className={!rule.is_enabled ? 'opacity-50' : ''}>
                      <TableCell>
                        <Switch
                          checked={rule.is_enabled}
                          onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, is_enabled: checked })}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{rule.topic_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[300px] truncate">
                        {rule.description || '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[250px] truncate">
                        {rule.custom_instructions || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(rule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteRule.mutate(rule.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit AI Topic Rule' : 'Add AI Topic Rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Topic Name</Label>
              <Input
                value={formData.topic_name}
                onChange={(e) => setFormData({ ...formData, topic_name: e.target.value })}
                placeholder="e.g. Roofing Techniques"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this topic cover?"
                rows={2}
              />
            </div>
            <div>
              <Label>Custom Instructions / Restrictions</Label>
              <Textarea
                value={formData.custom_instructions}
                onChange={(e) => setFormData({ ...formData, custom_instructions: e.target.value })}
                placeholder="e.g. Do not recommend specific brand names..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveRule.mutate({ ...formData, id: editingRule?.id })}
              disabled={!formData.topic_name.trim()}
            >
              {editingRule ? 'Update' : 'Add Topic'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
