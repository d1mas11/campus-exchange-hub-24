import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Send, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ConversationWithDetails, DbMessage } from '@/hooks/useMessages';

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  messages: DbMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onBack: () => void;
}

export function ChatWindow({ conversation, messages, currentUserId, onSendMessage, onBack }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <>
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card p-4">
        <button onClick={onBack} className="lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {conversation.otherUserAvatar ? (
          <img
            src={conversation.otherUserAvatar}
            alt={conversation.otherUserName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {conversation.otherUserName.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground">{conversation.otherUserName}</p>
          <p className="text-xs text-muted-foreground">{conversation.otherUserUniversity}</p>
        </div>
      </div>

      {/* Item Reference */}
      {conversation.listingTitle && (
        <div className="border-b border-border bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            {conversation.listingImage && (
              <img
                src={conversation.listingImage}
                alt=""
                className="h-12 w-12 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{conversation.listingTitle}</p>
              {conversation.listingPrice != null && (
                <p className="text-sm font-semibold text-primary">${conversation.listingPrice}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
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
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
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
  );
}
