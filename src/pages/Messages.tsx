import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ChatList } from '@/components/messages/ChatList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const sellerIdParam = searchParams.get('sellerId');
  const itemIdParam = searchParams.get('itemId');
  const { user } = useAuth();

  const {
    conversations,
    messages,
    selectedConversationId,
    selectConversation,
    findOrCreateConversation,
    sendMessage,
    deleteConversation,
    loading,
  } = useMessages();

  // Handle creating/finding a conversation when coming from a product page
  useEffect(() => {
    const initConversation = async () => {
      if (!sellerIdParam || !user || sellerIdParam === user.id) return;

      const convId = await findOrCreateConversation(sellerIdParam, itemIdParam || undefined);
      if (convId) {
        selectConversation(convId);
      }
    };

    initConversation();
  }, [sellerIdParam, itemIdParam, user]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Messages</h1>

        <div className="grid h-[calc(100vh-12rem)] gap-4 lg:grid-cols-3 rounded-xl border border-border overflow-hidden">
          {/* Chat List */}
          <ChatList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={selectConversation}
            onDelete={deleteConversation}
            hidden={!!selectedConversationId}
          />

          {/* Chat Window */}
          <div
            className={cn(
              'flex flex-col lg:col-span-2',
              !selectedConversationId && 'hidden lg:flex'
            )}
          >
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              currentUserId={user?.id || ''}
              onSendMessage={sendMessage}
              onBack={() => selectConversation(null)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
