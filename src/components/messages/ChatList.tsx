import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ConversationWithDetails } from '@/hooks/useMessages';
import { Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface ChatListProps {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  hidden?: boolean;
}

export function ChatList({ conversations, selectedId, onSelect, onDelete, hidden }: ChatListProps) {
  const navigate = useNavigate();

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

  const handleAvatarClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    navigate(`/user/${userId}`);
  };

  return (
    <div className={cn('border-r border-border bg-card overflow-y-auto', hidden && 'hidden lg:block')}>
      <div className="divide-y divide-border">
        {conversations.map((conv) => (
          <ContextMenu key={conv.id}>
            <ContextMenuTrigger asChild>
              <button
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
                    className="h-12 w-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={(e) => handleAvatarClick(e, conv.otherUserId)}
                  />
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    onClick={(e) => handleAvatarClick(e, conv.otherUserId)}
                  >
                    {conv.otherUserName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'font-semibold text-foreground truncate',
                        conv.hasUnread && 'font-bold'
                      )}>
                        {conv.otherUserName}
                      </p>
                      {conv.hasUnread && (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    {conv.lastMessageAt && (
                      <span className={cn(
                        'text-xs text-muted-foreground shrink-0 ml-2',
                        conv.hasUnread && 'text-primary font-medium'
                      )}>
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
                    <p className={cn(
                      'text-sm text-muted-foreground truncate',
                      conv.hasUnread && 'text-foreground font-medium'
                    )}>
                      {conv.lastMessage}
                    </p>
                  )}
                </div>
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                className="text-destructive focus:text-destructive gap-2"
                onClick={() => onDelete(conv.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete conversation
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  );
}
