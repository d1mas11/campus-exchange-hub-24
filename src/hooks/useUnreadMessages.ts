import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasUnread(false);
      return;
    }

    const checkUnread = async () => {
      // Get the last time user visited messages (stored in localStorage)
      const lastSeen = localStorage.getItem(`lastSeenMessages_${user.id}`);
      
      if (!lastSeen) {
        // If never visited, check if there are any messages from others
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .neq('sender_id', user.id);
        
        setHasUnread((count || 0) > 0);
        return;
      }

      // Check for messages from others after lastSeen
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .neq('sender_id', user.id)
        .gt('created_at', lastSeen);

      setHasUnread((count || 0) > 0);
    };

    checkUnread();

    // Listen for new messages in realtime
    const channel = supabase
      .channel('unread-indicator')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as { sender_id: string };
          if (msg.sender_id !== user.id) {
            setHasUnread(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsSeen = () => {
    if (!user) return;
    localStorage.setItem(`lastSeenMessages_${user.id}`, new Date().toISOString());
    setHasUnread(false);
  };

  return { hasUnread, markAsSeen };
}
