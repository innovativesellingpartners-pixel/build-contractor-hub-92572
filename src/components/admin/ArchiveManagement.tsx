import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Archive, Undo2, Trash2, Users, FileText, Briefcase, Target } from 'lucide-react';
import { useArchive, ArchiveEntityType } from '@/hooks/useArchive';
import { format } from 'date-fns';

export default function ArchiveManagement() {
  const { loading, fetchAllArchivedItems, unarchiveItem, permanentlyDelete } = useArchive();
  const [archivedItems, setArchivedItems] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<ArchiveEntityType | 'all'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: ArchiveEntityType; name: string } | null>(null);

  const loadArchivedItems = async () => {
    const items = await fetchAllArchivedItems();
    setArchivedItems(items);
  };

  useEffect(() => {
    loadArchivedItems();
  }, []);

  const handleUnarchive = async (entityType: ArchiveEntityType, id: string) => {
    const success = await unarchiveItem(entityType, id);
    if (success) {
      setArchivedItems(archivedItems.filter(item => item.id !== id));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const success = await permanentlyDelete(deleteConfirm.type, deleteConfirm.id);
    if (success) {
      setArchivedItems(archivedItems.filter(item => item.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  const getEntityIcon = (type: ArchiveEntityType) => {
    switch (type) {
      case 'customers': return <Users className="h-4 w-4" />;
      case 'leads': return <Target className="h-4 w-4" />;
      case 'jobs': return <Briefcase className="h-4 w-4" />;
      case 'estimates': return <FileText className="h-4 w-4" />;
    }
  };

  const getEntityColor = (type: ArchiveEntityType) => {
    switch (type) {
      case 'customers': return 'bg-blue-500';
      case 'leads': return 'bg-purple-500';
      case 'jobs': return 'bg-green-500';
      case 'estimates': return 'bg-orange-500';
    }
  };

  const filteredItems = selectedTab === 'all' 
    ? archivedItems 
    : archivedItems.filter(item => item.entity_type === selectedTab);

  const getCounts = () => ({
    all: archivedItems.length,
    customers: archivedItems.filter(i => i.entity_type === 'customers').length,
    leads: archivedItems.filter(i => i.entity_type === 'leads').length,
    jobs: archivedItems.filter(i => i.entity_type === 'jobs').length,
    estimates: archivedItems.filter(i => i.entity_type === 'estimates').length,
  });

  const counts = getCounts();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Archive className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Archive Management</h1>
          <p className="text-muted-foreground">View and manage archived items across all entities</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({counts.leads})</TabsTrigger>
          <TabsTrigger value="customers">Customers ({counts.customers})</TabsTrigger>
          <TabsTrigger value="estimates">Estimates ({counts.estimates})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({counts.jobs})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No archived items</h3>
                <p className="text-muted-foreground text-center">
                  Items archived by swiping right will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <Card key={`${item.entity_type}-${item.id}`}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <Badge className={`${getEntityColor(item.entity_type)} text-white`}>
                        {getEntityIcon(item.entity_type)}
                        <span className="ml-1 capitalize">{item.entity_type.slice(0, -1)}</span>
                      </Badge>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Archived {format(new Date(item.archived_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnarchive(item.entity_type, item.id)}
                      >
                        <Undo2 className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirm({ id: item.id, type: item.entity_type, name: item.name })}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteConfirm?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
