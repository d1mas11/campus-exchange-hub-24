import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ConversationWithDetails } from '@/hooks/useMessages';

interface ChatListProps {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hidden?: boolean;
}

export function ChatList({ conversations, selectedId, onSelect, hidden }: ChatListProps) {
  if (conversations.length === 0) {
    return (
      <div className={cn('border-r border-border bg-card overflow-y-auto', hidden && 'hidden lg:block')}>
        <div className="flex h-full items-center justify-center p-6 text-center">
          <p className="text-muted-foreground">
            No conversations yet. Start chatting with sellers!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border-r border-border bg-card overflow-y-auto', hidden && 'hidden lg:block')}>
      <div className="divide-y divide-border">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted',
              selectedId === conv.id && 'bg-muted'
            )}
          >
            {conv.otherUserAvatar ? (
              <img
                src={conv.otherUserAvatar}
                alt={conv.otherUserName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
                {conv.otherUserName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-foreground truncate">
                  {conv.otherUserName}
                </p>
                {conv.lastMessageAt && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              {conv.listingTitle && (
                <p className="text-xs text-primary mb-1 truncate">
                  Re: {conv.listingTitle}
                </p>
              )}
              {conv.lastMessage && (
                <p className="text-sm text-muted-foreground truncate">
                  {conv.lastMessage}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
