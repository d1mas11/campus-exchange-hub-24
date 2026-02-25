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

      // Mark the listing as sold
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', listingId);

      // Send automatic message in the conversation between buyer and seller
      try {
        // Find or create conversation
        const p1 = buyerId < sellerId ? buyerId : sellerId;
        const p2 = buyerId < sellerId ? sellerId : buyerId;

        let conversationId: string | null = null;

        // Try to find existing conversation for this listing
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('participant_1', p1)
          .eq('participant_2', p2)
          .eq('listing_id', listingId)
          .maybeSingle();

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          // Create new conversation
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              participant_1: p1,
              participant_2: p2,
              listing_id: listingId,
            })
            .select('id')
            .single();
          conversationId = newConv?.id || null;
        }

        // Send system-like message from buyer
        if (conversationId) {
          // Fetch listing title for the message
          const { data: listing } = await supabase
            .from('listings')
            .select('title')
            .eq('id', listingId)
            .single();

          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: buyerId,
            content: `💰 I just placed an order for "${listing?.title || 'this item'}" ($${amount}). Let's arrange the payment and pickup!`,
          });
        }
      } catch (e) {
        // Don't fail the order if messaging fails
        console.error('Failed to send order notification message:', e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-listings'] });
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

      // Send notification message in chat
      try {
        const order = data;
        const p1 = order.buyer_id < order.seller_id ? order.buyer_id : order.seller_id;
        const p2 = order.buyer_id < order.seller_id ? order.seller_id : order.buyer_id;

        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('participant_1', p1)
          .eq('participant_2', p2)
          .eq('listing_id', order.listing_id)
          .maybeSingle();

        if (conv) {
          const { data: listing } = await supabase
            .from('listings')
            .select('title')
            .eq('id', order.listing_id)
            .single();

          let messageContent = '';
          // Determine who triggered the action based on status
          if (status === 'confirmed') {
            messageContent = `✅ I confirmed receiving "${listing?.title || 'the item'}". Transaction complete!`;
          } else if (status === 'cancelled') {
            messageContent = `❌ The order for "${listing?.title || 'the item'}" has been cancelled.`;
          }

          if (messageContent) {
            // Get the current user who triggered this
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
              await supabase.from('messages').insert({
                conversation_id: conv.id,
                sender_id: currentUser.id,
                content: messageContent,
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to send status update message:', e);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      const messages: Record<string, string> = {
        confirmed: 'You confirmed receiving the item. Transaction complete!',
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
