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
  signed_url?: string; // Temporary signed URL for display
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
      
      // Generate signed URLs for each photo (valid for 1 hour)
      const photosWithSignedUrls = await Promise.all(
        (data || []).map(async (photo: JobPhoto) => {
          try {
            // Extract file path from stored URL
            const urlParts = photo.photo_url.split('/job-photos/');
            const filePath = urlParts.length > 1 ? urlParts[1] : photo.photo_url;
            
            const { data: signedData, error: signedError } = await supabase.storage
              .from('job-photos')
              .createSignedUrl(filePath, 3600); // 1 hour expiry

            if (signedError) {
              console.error('Error creating signed URL:', signedError);
              return photo;
            }

            return {
              ...photo,
              signed_url: signedData.signedUrl,
            };
          } catch (err) {
            console.error('Error processing photo:', err);
            return photo;
          }
        })
      );
      
      setPhotos(photosWithSignedUrls as JobPhoto[]);
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
      // Upload file to storage with user-scoped path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${jobId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store the file path (not public URL since bucket is now private)
      const filePath = fileName;

      // Check if this is the first photo - auto-tag as "Front of Property"
      const isFirstPhoto = photos.length === 0;
      const photoCaption = isFirstPhoto && !caption ? 'Front of Property' : caption;

      // Save to database
      const { data, error } = await supabase
        .from('job_photos')
        .insert([{
          job_id: jobId,
          user_id: user.id,
          photo_url: filePath, // Store path, not public URL
          caption: photoCaption,
        }])
        .select()
        .single();

      if (error) throw error;

      // Generate signed URL for immediate display
      const { data: signedData } = await supabase.storage
        .from('job-photos')
        .createSignedUrl(filePath, 3600);

      const photoWithSignedUrl = {
        ...(data as JobPhoto),
        signed_url: signedData?.signedUrl,
      };

      setPhotos(prev => [photoWithSignedUrl, ...prev]);
      toast({
        title: 'Photo uploaded',
        description: isFirstPhoto ? 'Front of property photo added' : 'Photo has been added to the job successfully',
      });
      return photoWithSignedUrl as JobPhoto;
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

  // Special function for explicitly uploading the first photo with "Front of Property" caption
  const uploadPhotoAsFirst = async (file: File, caption: string = 'Front of Property') => {
    if (!user || !jobId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${jobId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const filePath = fileName;

      const { data, error } = await supabase
        .from('job_photos')
        .insert([{
          job_id: jobId,
          user_id: user.id,
          photo_url: filePath,
          caption: caption,
        }])
        .select()
        .single();

      if (error) throw error;

      const { data: signedData } = await supabase.storage
        .from('job-photos')
        .createSignedUrl(filePath, 3600);

      const photoWithSignedUrl = {
        ...(data as JobPhoto),
        signed_url: signedData?.signedUrl,
      };

      setPhotos(prev => [photoWithSignedUrl, ...prev]);
      toast({
        title: 'Front of property photo added',
        description: 'Photo has been tagged as "Front of Property"',
      });
      return photoWithSignedUrl as JobPhoto;
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
      // photoUrl now contains the file path, not a full URL
      const filePath = photoUrl.includes('/job-photos/') 
        ? photoUrl.split('/job-photos/')[1]
        : photoUrl;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('job-photos')
        .remove([filePath]);

      if (storageError) console.error('Storage deletion error:', storageError);

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

  const updatePhotoCaption = async (photoId: string, caption: string) => {
    try {
      const { error } = await supabase
        .from('job_photos')
        .update({ caption })
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(photos.map(photo => 
        photo.id === photoId ? { ...photo, caption } : photo
      ));
      
      toast({
        title: 'Notes updated',
        description: 'Photo notes have been saved',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating notes',
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
    uploadPhotoAsFirst,
    deletePhoto,
    updatePhotoCaption,
    refreshPhotos: fetchPhotos,
  };
};
