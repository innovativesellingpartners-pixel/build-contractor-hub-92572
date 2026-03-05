/**
 * AccountDocuments — Documents card for the Account section.
 * Shows recent documents, upload button, and quick-access to full document portal.
 */
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  FileText, Plus, Upload, Paperclip, FolderOpen, Download, Eye,
  Trash2, ShieldCheck, Award, File, Calendar, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'warranty', label: 'Warranty', icon: Award },
  { value: 'certificate_of_insurance', label: 'Certificate of Insurance', icon: ShieldCheck },
  { value: 'license', label: 'License / Certification', icon: FileText },
  { value: 'contract', label: 'Contract / Agreement', icon: File },
  { value: 'permit', label: 'Permit', icon: FileText },
  { value: 'safety', label: 'Safety Document', icon: ShieldCheck },
  { value: 'w9', label: 'W-9', icon: FileText },
  { value: 'bond', label: 'Surety Bond', icon: ShieldCheck },
  { value: 'proposal_template', label: 'Proposal Template', icon: File },
  { value: 'scope_of_work', label: 'Scope of Work Template', icon: FileText },
  { value: 'lien_waiver', label: 'Lien Waiver', icon: File },
  { value: 'change_order_template', label: 'Change Order Template', icon: FileText },
  { value: 'subcontractor_agreement', label: 'Subcontractor Agreement', icon: File },
  { value: 'other', label: 'Other', icon: FolderOpen },
];

function getCategoryInfo(value: string) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AccountDocumentsProps {
  onNavigateToDocuments?: () => void;
}

export function AccountDocuments({ onNavigateToDocuments }: AccountDocumentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    document_category: 'other',
    document_label: '',
    expires_at: '',
    notes: '',
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['account-documents'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('contractor_documents') as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!user?.id || !file) throw new Error('Missing file or auth');
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: storageErr } = await supabase.storage.from('documents').upload(filePath, file);
      if (storageErr) throw storageErr;

      const { error: dbErr } = await (supabase.from('contractor_documents') as any).insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        document_category: form.document_category,
        document_label: form.document_label.trim() || null,
        expires_at: form.expires_at || null,
        notes: form.notes.trim() || null,
      });
      if (dbErr) throw dbErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-documents'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-documents'] });
      toast.success('Document uploaded successfully');
      setUploadOpen(false);
      setFile(null);
      setForm({ document_category: 'other', document_label: '', expires_at: '', notes: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteDoc = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from('documents').remove([doc.file_path]);
      const { error } = await (supabase.from('contractor_documents') as any).delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-documents'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-documents'] });
      toast.success('Document deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const downloadDoc = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download');
    }
  };

  const viewDoc = async (doc: any) => {
    try {
      const { data } = supabase.storage.from('documents').getPublicUrl(doc.file_path);
      window.open(data.publicUrl, '_blank');
    } catch {
      toast.error('Failed to open document');
    }
  };

  const filtered = documents.filter((d: any) => {
    const matchesSearch =
      d.file_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.document_label?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.document_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = documents.filter((d: any) => d.document_category === c.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl shadow-md overflow-hidden">
      <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          My Documents
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </Badge>
          <Button size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Category quick filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({documents.length})</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label} ({categoryCounts[c.value] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document list */}
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading documents...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              {documents.length === 0 ? 'No documents uploaded yet' : 'No matching documents'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload warranties, COIs, licenses, W-9s, and more
            </p>
            {documents.length === 0 && (
              <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5" />
                Upload Your First Document
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filtered.map((doc: any) => {
              const cat = getCategoryInfo(doc.document_category);
              const CatIcon = cat.icon;
              const isExpired = doc.expires_at && new Date(doc.expires_at) < new Date();

              return (
                <div
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group",
                    isExpired && "border-destructive/40 bg-destructive/5"
                  )}
                >
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <CatIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{doc.document_label || doc.file_name}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{cat.label}</Badge>
                      {isExpired && <Badge variant="destructive" className="text-[10px] shrink-0">Expired</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>·</span>
                      <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                      {doc.expires_at && (
                        <>
                          <span>·</span>
                          <span className={cn(isExpired && 'text-destructive')}>
                            Exp: {format(new Date(doc.expires_at), 'MMM d, yyyy')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => viewDoc(doc)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => downloadDoc(doc)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (window.confirm('Delete this document?')) deleteDoc.mutate(doc);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Link to full documents portal */}
        {onNavigateToDocuments && (
          <Button
            variant="outline"
            className="w-full gap-2 text-sm"
            onClick={onNavigateToDocuments}
          >
            <FolderOpen className="h-4 w-4" />
            Open Full Documents Portal
          </Button>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* File picker */}
            <div>
              <Label>File *</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.csv"
              />
              <Button
                variant="outline"
                className="w-full justify-start gap-2 mt-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
                {file ? file.name : 'Choose file...'}
              </Button>
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(file.size)} · {file.type || 'unknown type'}
                </p>
              )}
            </div>

            {/* Document type dropdown */}
            <div>
              <Label>Document Type *</Label>
              <Select value={form.document_category} onValueChange={(v) => setForm({ ...form, document_category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Label / Title</Label>
              <Input
                value={form.document_label}
                onChange={(e) => setForm({ ...form, document_label: e.target.value })}
                placeholder="e.g. General Liability COI 2026"
              />
            </div>

            <div>
              <Label>Expiration Date</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Optional notes about this document..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
              {upload.isPending ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
