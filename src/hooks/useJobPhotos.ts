import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface JobPhoto {
  id: string;
  job_id: string;
  user_id: string;
  photo_url: string;
  caption?: string;
  created_at: string;
}

export const useJobPhotos = (jobId?: string) => {
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPhotos = async () => {
    if (!user || !jobId) return;

    try {
      const { data, error } = await supabase
        .from('job_photos')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos((data || []) as JobPhoto[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching photos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [jobId, user]);

  const uploadPhoto = async (file: File, caption?: string) => {
    if (!user || !jobId) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${jobId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(fileName);

      // Save to database
      const { data, error } = await supabase
        .from('job_photos')
        .insert([{
          job_id: jobId,
          user_id: user.id,
          photo_url: publicUrl,
          caption,
        }])
        .select()
        .single();

      if (error) throw error;

      setPhotos([data as JobPhoto, ...photos]);
      toast({
        title: 'Photo uploaded',
        description: 'Photo has been added to the job successfully',
      });
      return data as JobPhoto;
    } catch (error: any) {
      toast({
        title: 'Error uploading photo',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/job-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('job-photos')
          .remove([filePath]);

        if (storageError) console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error } = await supabase
        .from('job_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(photos.filter(photo => photo.id !== photoId));
      toast({
        title: 'Photo deleted',
        description: 'Photo has been removed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting photo',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    photos,
    loading,
    uploading,
    uploadPhoto,
    deletePhoto,
    refreshPhotos: fetchPhotos,
  };
};
