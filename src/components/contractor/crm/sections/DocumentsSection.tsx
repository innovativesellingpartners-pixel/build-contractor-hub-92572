import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  FileText, Plus, Trash2, Download, Search, ArrowLeft, Upload,
  ShieldCheck, Award, File, Calendar, Paperclip, FolderOpen, Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface DocumentsSectionProps {
  onSectionChange?: (section: string) => void;
}

interface ContractorDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_category: string;
  document_label: string | null;
  estimate_id: string | null;
  job_id: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'warranty', label: 'Warranty', icon: Award },
  { value: 'certificate_of_insurance', label: 'Certificate of Insurance', icon: ShieldCheck },
  { value: 'license', label: 'License / Certification', icon: FileText },
  { value: 'contract', label: 'Contract / Agreement', icon: File },
  { value: 'permit', label: 'Permit', icon: FileText },
  { value: 'safety', label: 'Safety Document', icon: ShieldCheck },
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

// ===================== UPLOAD DIALOG =====================
function UploadDialog({
  open,
  onOpenChange,
  estimates,
  jobs,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  estimates: { id: string; title: string; estimate_number: string | null }[];
  jobs: { id: string; name: string; job_number: string | null }[];
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    document_category: 'other',
    document_label: '',
    estimate_id: '',
    job_id: '',
    expires_at: '',
    notes: '',
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!user?.id || !file) throw new Error('Missing file or auth');

      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: storageErr } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      if (storageErr) throw storageErr;

      const { error: dbErr } = await (supabase.from('contractor_documents') as any).insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        document_category: form.document_category,
        document_label: form.document_label.trim() || null,
        estimate_id: form.estimate_id || null,
        job_id: form.job_id || null,
        expires_at: form.expires_at || null,
        notes: form.notes.trim() || null,
      });
      if (dbErr) throw dbErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-documents'] });
      toast.success('Document uploaded');
      onOpenChange(false);
      setFile(null);
      setForm({ document_category: 'other', document_label: '', estimate_id: '', job_id: '', expires_at: '', notes: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <p className="text-xs text-muted-foreground mt-1">{formatFileSize(file.size)} · {file.type || 'unknown type'}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category *</Label>
              <Select value={form.document_category} onValueChange={(v) => setForm({ ...form, document_category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Label / Title</Label>
              <Input value={form.document_label} onChange={(e) => setForm({ ...form, document_label: e.target.value })} placeholder="e.g. GL Insurance 2026" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Attach to Estimate</Label>
              <Select value={form.estimate_id} onValueChange={(v) => setForm({ ...form, estimate_id: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {estimates.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.estimate_number || e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Attach to Job</Label>
              <Select value={form.job_id} onValueChange={(v) => setForm({ ...form, job_id: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.job_number || j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Expiration Date</Label>
            <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes..." />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
            {upload.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== MAIN SECTION =====================
export default function DocumentsSection({ onSectionChange }: DocumentsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['contractor-documents'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('contractor_documents') as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ContractorDocument[];
    },
    enabled: !!user?.id,
  });

  const { data: estimates = [] } = useQuery({
    queryKey: ['documents-estimates-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estimates')
        .select('id, title, estimate_number')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['documents-jobs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, name, job_number')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const deleteDoc = useMutation({
    mutationFn: async (doc: ContractorDocument) => {
      await supabase.storage.from('documents').remove([doc.file_path]);
      const { error } = await (supabase.from('contractor_documents') as any).delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-documents'] });
      toast.success('Document deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const downloadDoc = async (doc: ContractorDocument) => {
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

  const viewDoc = async (doc: ContractorDocument) => {
    try {
      const { data } = supabase.storage.from('documents').getPublicUrl(doc.file_path);
      window.open(data.publicUrl, '_blank');
    } catch {
      toast.error('Failed to open document');
    }
  };

  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      d.document_label?.toLowerCase().includes(search.toLowerCase()) ||
      d.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.document_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = documents.filter((d) => d.document_category === c.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full h-full overflow-y-auto pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-6 sm:max-w-5xl sm:mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => onSectionChange?.('dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
              <p className="text-sm text-muted-foreground">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button className="gap-1.5" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            Upload
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({documents.length})</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label} ({categoryCounts[c.value] || 0})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document List */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{documents.length === 0 ? 'No documents yet' : 'No matching documents'}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {documents.length === 0 ? 'Upload warranties, certificates of insurance, and more' : 'Try adjusting your search or filter'}
              </p>
              {documents.length === 0 && (
                <Button onClick={() => setUploadOpen(true)} className="gap-1.5">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => {
              const cat = getCategoryInfo(doc.document_category);
              const CatIcon = cat.icon;
              const isExpired = doc.expires_at && new Date(doc.expires_at) < new Date();
              const estimateInfo = doc.estimate_id ? estimates.find((e) => e.id === doc.estimate_id) : null;
              const jobInfo = doc.job_id ? jobs.find((j) => j.id === doc.job_id) : null;

              return (
                <Card key={doc.id} className={cn(isExpired && 'border-destructive/40')}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <CatIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm truncate">{doc.document_label || doc.file_name}</h3>
                            <Badge variant="secondary" className="text-[10px]">{cat.label}</Badge>
                            {isExpired && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
                          </div>
                          {doc.document_label && (
                            <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                            {doc.expires_at && (
                              <span className={cn('flex items-center gap-1', isExpired && 'text-destructive')}>
                                <Calendar className="h-3 w-3" />
                                Exp: {format(new Date(doc.expires_at), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {estimateInfo && (
                              <Badge variant="outline" className="text-[10px]">
                                <Paperclip className="h-2.5 w-2.5 mr-1" />
                                {estimateInfo.estimate_number || 'Estimate'}
                              </Badge>
                            )}
                            {jobInfo && (
                              <Badge variant="outline" className="text-[10px]">
                                <Paperclip className="h-2.5 w-2.5 mr-1" />
                                {jobInfo.job_number || 'Job'}
                              </Badge>
                            )}
                          </div>
                          {doc.notes && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{doc.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewDoc(doc)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadDoc(doc)} title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm(`Delete "${doc.file_name}"?`)) deleteDoc.mutate(doc); }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        estimates={estimates}
        jobs={jobs}
      />
    </div>
  );
}
