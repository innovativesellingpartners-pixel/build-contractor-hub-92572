import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { ShieldCheck, Award, FileText, Paperclip, X, ChevronsUpDown, Check, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentAttachment {
  document_id: string;
  include_in_body: boolean;
}

interface DocumentAttachmentSectionProps {
  estimateId?: string;
  attachments: DocumentAttachment[];
  onAttachmentsChange: (attachments: DocumentAttachment[]) => void;
}

interface ContractorDoc {
  id: string;
  file_name: string;
  document_category: string;
  document_label: string | null;
  notes: string | null;
}

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  warranty: Award,
  certificate_of_insurance: ShieldCheck,
};

const CATEGORY_LABELS: Record<string, string> = {
  warranty: 'Warranty',
  certificate_of_insurance: 'Certificate of Insurance',
  license: 'License / Certification',
  contract: 'Contract / Agreement',
  permit: 'Permit',
  safety: 'Safety Document',
  other: 'Other',
};

export function DocumentAttachmentSection({
  estimateId,
  attachments,
  onAttachmentsChange,
}: DocumentAttachmentSectionProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Fetch all contractor documents
  const { data: documents = [] } = useQuery({
    queryKey: ['contractor-documents-for-estimate'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('contractor_documents') as any)
        .select('id, file_name, document_category, document_label, notes')
        .order('document_category', { ascending: true });
      if (error) throw error;
      return (data || []) as ContractorDoc[];
    },
    enabled: !!user?.id,
  });

  // Load saved attachments when editing existing estimate
  useEffect(() => {
    if (estimateId && attachments.length === 0) {
      (async () => {
        const { data } = await (supabase.from('estimate_document_attachments') as any)
          .select('document_id, include_in_body')
          .eq('estimate_id', estimateId);
        if (data && data.length > 0) {
          onAttachmentsChange(data.map((d: any) => ({
            document_id: d.document_id,
            include_in_body: d.include_in_body,
          })));
        }
      })();
    }
  }, [estimateId]);

  const selectedIds = attachments.map((a) => a.document_id);

  const toggleDocument = (docId: string) => {
    if (selectedIds.includes(docId)) {
      onAttachmentsChange(attachments.filter((a) => a.document_id !== docId));
    } else {
      onAttachmentsChange([...attachments, { document_id: docId, include_in_body: false }]);
    }
  };

  const toggleIncludeInBody = (docId: string) => {
    onAttachmentsChange(
      attachments.map((a) =>
        a.document_id === docId ? { ...a, include_in_body: !a.include_in_body } : a
      )
    );
  };

  const removeDocument = (docId: string) => {
    onAttachmentsChange(attachments.filter((a) => a.document_id !== docId));
  };

  const getDoc = (id: string) => documents.find((d) => d.id === id);

  // Group documents by category for the dropdown
  const grouped = documents.reduce((acc, doc) => {
    const cat = doc.document_category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as Record<string, ContractorDoc[]>);

  if (documents.length === 0) {
    return null; // Don't show if no documents uploaded
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-primary" />
          Document Attachments
        </CardTitle>
        <CardDescription>
          Attach certificates of insurance, warranties, or other documents to this estimate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document selector */}
        <div className="space-y-2">
          <Label>Select Documents to Attach</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedIds.length > 0
                  ? `${selectedIds.length} document${selectedIds.length > 1 ? 's' : ''} selected`
                  : 'Select documents...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search documents..." />
                <CommandList>
                  <CommandEmpty>No documents found. Upload documents in the Documents section first.</CommandEmpty>
                  {Object.entries(grouped).map(([category, docs]) => (
                    <CommandGroup key={category} heading={CATEGORY_LABELS[category] || category}>
                      {docs.map((doc) => (
                        <CommandItem
                          key={doc.id}
                          value={`${doc.document_label || doc.file_name} ${doc.document_category}`}
                          onSelect={() => toggleDocument(doc.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedIds.includes(doc.id) ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">
                              {doc.document_label || doc.file_name}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected documents with include-in-body toggle */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Attached Documents</Label>
            <div className="divide-y rounded-md border">
              {attachments.map((att) => {
                const doc = getDoc(att.document_id);
                if (!doc) return null;
                const CatIcon = CATEGORY_ICONS[doc.document_category] || FileText;
                return (
                  <div key={att.document_id} className="flex items-center gap-3 px-3 py-2.5">
                    <CatIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.document_label || doc.file_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {CATEGORY_LABELS[doc.document_category] || doc.document_category}
                      </p>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Checkbox
                        checked={att.include_in_body}
                        onCheckedChange={() => toggleIncludeInBody(att.document_id)}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Include in body</span>
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeDocument(att.document_id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              ✓ Checked = document text included in estimate body & email. Unchecked = attached as file to email only.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
