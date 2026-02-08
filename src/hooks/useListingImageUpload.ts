import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export function useListingImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImages = async (userId: string, files: File[]): Promise<string[]> => {
    try {
      setUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        // Validate
        if (!file.type.startsWith('image/')) {
          toast({ title: 'Invalid file', description: `${file.name} is not an image.`, variant: 'destructive' });
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: 'File too large', description: `${file.name} exceeds 10MB limit.`, variant: 'destructive' });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(filePath, file, { upsert: false });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return [];
    } finally {
      setUploading(false);
    }
  };

  return { uploadImages, uploading };
}
