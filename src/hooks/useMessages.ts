import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  listing_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface ConversationWithDetails {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserUniversity: string | null;
  listingId: string | null;
  listingTitle: string | null;
  listingImage: string | null;
  listingPrice: number | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: convos, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error || !convos) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
      return;
    }

    // Enrich conversations with profile and listing data
    const enriched: ConversationWithDetails[] = await Promise.all(
      convos.map(async (conv: Conversation) => {
        const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

        // Fetch other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, avatar_url, university')
          .eq('user_id', otherUserId)
          .single();

        // Fetch listing if exists
        let listingTitle = null;
        let listingImage = null;
        let listingPrice = null;
        if (conv.listing_id) {
          const { data: listing } = await supabase
            .from('listings')
            .select('title, images, price')
            .eq('id', conv.listing_id)
            .single();
          if (listing) {
            listingTitle = listing.title;
            listingImage = listing.images?.[0] || null;
            listingPrice = Number(listing.price);
          }
        }

        // Fetch last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: conv.id,
          otherUserId,
          otherUserName: profile?.first_name || 'User',
          otherUserAvatar: profile?.avatar_url || null,
          otherUserUniversity: profile?.university || null,
          listingId: conv.listing_id,
          listingTitle,
          listingImage,
          listingPrice,
          lastMessage: lastMsg?.content || null,
          lastMessageAt: lastMsg?.created_at || null,
          updatedAt: conv.updated_at,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  }, [user]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  }, []);

  // Select a conversation
  const selectConversation = useCallback((conversationId: string | null) => {
    setSelectedConversationId(conversationId);
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [fetchMessages]);

  // Find or create a conversation with a seller about a listing
  const findOrCreateConversation = useCallback(async (sellerId: string, listingId?: string): Promise<string | null> => {
    if (!user) return null;

    // Ensure participants are ordered consistently for the unique constraint
    const p1 = user.id < sellerId ? user.id : sellerId;
    const p2 = user.id < sellerId ? sellerId : user.id;

    // Try to find existing conversation
    let query = supabase
      .from('conversations')
      .select('id')
      .eq('participant_1', p1)
      .eq('participant_2', p2);

    if (listingId) {
      query = query.eq('listing_id', listingId);
    } else {
      query = query.is('listing_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        participant_1: p1,
        participant_2: p2,
        listing_id: listingId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    // Refresh conversations list
    await fetchConversations();
    return newConv.id;
  }, [user, fetchConversations]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !selectedConversationId || !content.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversationId,
        sender_id: user.id,
        content: content.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
    }
  }, [user, selectedConversationId]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as DbMessage;
          
          // If it's in the currently selected conversation, add it
          if (newMsg.conversation_id === selectedConversationId) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }

          // Refresh conversations to update last message and order
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversationId, fetchConversations]);

  return {
    conversations,
    messages,
    selectedConversationId,
    selectConversation,
    findOrCreateConversation,
    sendMessage,
    loading,
  };
}
