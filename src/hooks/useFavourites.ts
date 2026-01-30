import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { Listing } from './useListings';

export function useFavourites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favourites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('favourites')
        .select(`
          id,
          listing_id,
          created_at,
          listings:listing_id (
            *,
            profiles:user_id (
              first_name,
              avatar_url,
              university
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      return (data || []).map((fav: any) => ({
        ...fav.listings,
        seller_name: fav.listings?.profiles?.first_name || 'Anonymous',
        seller_avatar: fav.listings?.profiles?.avatar_url,
        seller_university: fav.listings?.profiles?.university || 'Unknown University',
      })) as Listing[];
    },
    enabled: !!user?.id,
  });
}

export function useFavouriteIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favourite-ids', user?.id],
    queryFn: async () => {
      if (!user?.id) return new Set<string>();

      const { data, error } = await supabase
        .from('favourites')
        .select('listing_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return new Set((data || []).map((f) => f.listing_id));
    },
    enabled: !!user?.id,
  });
}

export function useToggleFavourite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ listingId, isFavourite }: { listingId: string; isFavourite: boolean }) => {
      if (!user?.id) throw new Error('Must be logged in');

      if (isFavourite) {
        // Remove from favourites
        const { error } = await supabase
          .from('favourites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);

        if (error) throw error;
      } else {
        // Add to favourites
        const { error } = await supabase
          .from('favourites')
          .insert({
            user_id: user.id,
            listing_id: listingId,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, { isFavourite }) => {
      queryClient.invalidateQueries({ queryKey: ['favourites'] });
      queryClient.invalidateQueries({ queryKey: ['favourite-ids'] });
      toast({
        title: isFavourite ? 'Removed from favourites' : 'Added to favourites',
        description: isFavourite ? 'Item removed from your favourites.' : 'Item added to your favourites.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
