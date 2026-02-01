import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockChats, mockMessages, mockUsers, mockItems, currentUser } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Send, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Chat } from '@/types';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const sellerIdParam = searchParams.get('sellerId');
  const itemIdParam = searchParams.get('itemId');
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [chats, setChats] = useState<Chat[]>(mockChats);

  // Handle creating a new chat when coming from a product page
  useEffect(() => {
    if (sellerIdParam) {
      // Check if chat with this seller already exists
      const existingChat = chats.find(chat => 
        chat.participantIds.includes(sellerIdParam) && 
        chat.participantIds.includes(currentUser.id) &&
        (itemIdParam ? chat.itemId === itemIdParam : true)
      );

      if (existingChat) {
        setSelectedChatId(existingChat.id);
      } else {
        // Create a new chat with this seller
        const seller = mockUsers.find(u => u.id === sellerIdParam);
        const item = itemIdParam ? mockItems.find(i => i.id === itemIdParam) : undefined;
        
        if (seller) {
          const newChat: Chat = {
            id: `new-${Date.now()}`,
            participantIds: [currentUser.id, sellerIdParam],
            participants: [currentUser, seller],
            itemId: itemIdParam || undefined,
            item: item,
            lastMessage: undefined,
          };
          
          setChats(prev => [newChat, ...prev]);
          setSelectedChatId(newChat.id);
        }
      }
    }
  }, [sellerIdParam, itemIdParam]);

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const otherParticipant = selectedChat?.participants.find(
    (p) => p.id !== currentUser.id
  );

  const chatMessages = messages.filter(
    (m) =>
      (m.senderId === currentUser.id &&
        m.receiverId === otherParticipant?.id) ||
      (m.senderId === otherParticipant?.id && m.receiverId === currentUser.id)
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherParticipant) return;

    const message = {
      id: `m${Date.now()}`,
      senderId: currentUser.id,
      receiverId: otherParticipant.id,
      content: newMessage.trim(),
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Messages</h1>

        <div className="grid h-[calc(100vh-12rem)] gap-4 lg:grid-cols-3 rounded-xl border border-border overflow-hidden">
          {/* Chat List */}
          <div
            className={cn(
              'border-r border-border bg-card overflow-y-auto',
              selectedChatId && 'hidden lg:block'
            )}
          >
          {chats.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <p className="text-muted-foreground">
                No conversations yet. Start chatting with sellers!
              </p>
            </div>
            ) : (
              <div className="divide-y divide-border">
                {chats.map((chat) => {
                  const other = chat.participants.find(
                    (p) => p.id !== currentUser.id
                  );
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={cn(
                        'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted',
                        selectedChatId === chat.id && 'bg-muted'
                      )}
                    >
                      {other?.profilePicture ? (
                        <img
                          src={other.profilePicture}
                          alt={other.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
                          {other?.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-foreground truncate">
                            {other?.name}
                          </p>
                          {chat.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(chat.lastMessage.timestamp, {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                        {chat.item && (
                          <p className="text-xs text-primary mb-1 truncate">
                            Re: {chat.item.title}
                          </p>
                        )}
                        {chat.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Window */}
          <div
            className={cn(
              'flex flex-col lg:col-span-2',
              !selectedChatId && 'hidden lg:flex'
            )}
          >
            {selectedChat && otherParticipant ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-border bg-card p-4">
                  <button
                    onClick={() => setSelectedChatId(null)}
                    className="lg:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  {otherParticipant.profilePicture ? (
                    <img
                      src={otherParticipant.profilePicture}
                      alt={otherParticipant.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {otherParticipant.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {otherParticipant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {otherParticipant.university}
                    </p>
                  </div>
                </div>

                {/* Item Reference */}
                {selectedChat.item && (
                  <div className="border-b border-border bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedChat.item.images[0]}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {selectedChat.item.title}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          ${selectedChat.item.price}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg) => {
                    const isOwn = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex',
                          isOwn ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2',
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          )}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={cn(
                              'mt-1 text-xs',
                              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}
                          >
                            {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-border bg-card p-4"
                >
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
