import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InsuranceDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: string;
  uploaded_at: string;
  expires_at: string | null;
  notes: string | null;
}

export function useInsuranceDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ['insurance-documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('insurance_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as InsuranceDocument[];
    },
    enabled: !!user?.id,
  });

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      documentType,
      expiresAt,
      notes,
    }: {
      file: File;
      documentType: string;
      expiresAt?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('insurance-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error: dbError } = await supabase
        .from('insurance_documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          document_type: documentType,
          expires_at: expiresAt || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    },
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (document: InsuranceDocument) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('insurance-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('insurance_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    },
  });

  // Download document
  const downloadDocument = async (document: InsuranceDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('insurance-documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    isUploading: uploadDocument.isPending,
    isDeleting: deleteDocument.isPending,
  };
}
