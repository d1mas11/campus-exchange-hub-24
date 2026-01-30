import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  images: string[];
  status: string;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  seller_name?: string;
  seller_avatar?: string;
  seller_university?: string;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
}

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:user_id (
            first_name,
            avatar_url,
            university
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((listing: any) => ({
        ...listing,
        seller_name: listing.profiles?.first_name || 'Anonymous',
        seller_avatar: listing.profiles?.avatar_url,
        seller_university: listing.profiles?.university || 'Unknown University',
      })) as Listing[];
    },
  });
}

export function useUserListings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-listings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Listing[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateListingData) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data: listing, error } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
          condition: data.condition,
          images: data.images,
        })
        .select()
        .single();

      if (error) throw error;
      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-listings'] });
      toast({
        title: 'Listing created!',
        description: 'Your item has been posted to the marketplace.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating listing',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-listings'] });
      toast({
        title: 'Listing deleted',
        description: 'Your listing has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting listing',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
