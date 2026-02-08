import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  listing?: {
    title: string;
    images: string[] | null;
    condition: string;
    category: string;
  };
  buyer_profile?: {
    first_name: string | null;
    avatar_url: string | null;
    university: string | null;
  };
  seller_profile?: {
    first_name: string | null;
    avatar_url: string | null;
    university: string | null;
    account_number: string | null;
  };
}

export function useOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Manually fetch related data for each order
      const enriched = await Promise.all(
        (data || []).map(async (order) => {
          const [listingRes, buyerRes, sellerRes] = await Promise.all([
            supabase.from('listings').select('title, images, condition, category').eq('id', order.listing_id).maybeSingle(),
            supabase.from('profiles').select('first_name, avatar_url, university').eq('user_id', order.buyer_id).maybeSingle(),
            supabase.from('profiles').select('first_name, avatar_url, university, account_number').eq('user_id', order.seller_id).maybeSingle(),
          ]);
          return {
            ...order,
            listing: listingRes.data,
            buyer_profile: buyerRes.data,
            seller_profile: sellerRes.data,
          };
        })
      );
      return enriched as Order[];
    },
    enabled: !!user,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      sellerId,
      amount,
      buyerId,
    }: {
      listingId: string;
      sellerId: string;
      amount: number;
      buyerId: string;
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          listing_id: listingId,
          buyer_id: buyerId,
          seller_id: sellerId,
          amount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Order placed!', description: 'The seller has been notified.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create order.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      const messages: Record<string, string> = {
        confirmed: 'You confirmed receiving the item. Payment will be released to the seller.',
        cancelled: 'Order has been cancelled.',
      };
      toast({
        title: 'Order updated',
        description: messages[variables.status] || 'Order status updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order.',
        variant: 'destructive',
      });
    },
  });
}
