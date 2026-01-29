import { useState } from 'react';
import { Plus, Building2, Mail, Phone, MapPin, Edit2, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useGCContacts, GCContact } from '@/hooks/useGCContacts';
import {
  BlueBackground,
  SectionHeader,
  InfoCard,
} from './ProvenJobsTheme';
import { CrmNavHeader } from '../CrmNavHeader';

interface GCSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function GCSection({ onSectionChange }: GCSectionProps) {
  const { gcContacts, loading, addGCContact, updateGCContact, deleteGCContact } = useGCContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingGC, setEditingGC] = useState<GCContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filteredContacts = gcContacts.filter(gc => {
    const query = searchQuery.toLowerCase();
    return (
      gc.name.toLowerCase().includes(query) ||
      gc.company?.toLowerCase().includes(query) ||
      gc.email?.toLowerCase().includes(query)
    );
  });

  const handleOpenDialog = (gc?: GCContact) => {
    if (gc) {
      setEditingGC(gc);
      setFormData({
        name: gc.name,
        company: gc.company || '',
        email: gc.email || '',
        phone: gc.phone || '',
        address: gc.address || '',
        notes: gc.notes || '',
      });
    } else {
      setEditingGC(null);
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingGC) {
        await updateGCContact(editingGC.id, formData);
        toast.success('GC contact updated');
      } else {
        await addGCContact(formData);
        toast.success('GC contact added');
      }
      setShowDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGCContact(id);
      toast.success('GC contact deleted');
      setShowDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  return (
    <BlueBackground className="min-h-full">
      {/* Navigation Header */}
      <div className="px-4 pt-4">
        <CrmNavHeader
          back
          dashboard
          onBack={() => onSectionChange?.('dashboard')}
          onDashboard={() => onSectionChange?.('dashboard')}
          sectionLabel="GC Contacts"
        />
      </div>
      
      {/* Header */}
      <div className="bg-sky-600 text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            <h1 className="text-xl font-bold">General Contractors</h1>
          </div>
          <Button
            size="sm"
            className="bg-white text-sky-600 hover:bg-sky-50"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add GC
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search GC contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-0">
        <SectionHeader>ALL GC CONTACTS ({filteredContacts.length})</SectionHeader>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredContacts.length === 0 ? (
          <InfoCard className="m-4">
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'No GC contacts match your search' : 'No GC contacts yet. Add your first one!'}
            </div>
          </InfoCard>
        ) : (
          filteredContacts.map((gc) => (
            <Card key={gc.id} className="mx-4 mb-2 p-4 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{gc.name}</h3>
                  {gc.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3" />
                      {gc.company}
                    </p>
                  )}
                  {gc.email && (
                    <p className="text-sm text-sky-600 flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      <a href={`mailto:${gc.email}`}>{gc.email}</a>
                    </p>
                  )}
                  {gc.phone && (
                    <p className="text-sm text-sky-600 flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${gc.phone}`}>{gc.phone}</a>
                    </p>
                  )}
                  {gc.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {gc.address}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(gc)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteConfirm(gc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingGC ? 'Edit GC Contact' : 'Add GC Contact'}
            </DialogTitle>
            <DialogDescription>
              {editingGC ? 'Update general contractor details' : 'Add a new general contractor contact'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Contact name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Company name"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Full address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingGC ? 'Update' : 'Add GC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete GC Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this GC contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BlueBackground>
  );
}
