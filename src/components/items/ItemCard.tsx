import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { Item, CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ItemCardProps {
  item: Item;
  className?: string;
}

export function ItemCard({ item, className }: ItemCardProps) {
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);
  const category = CATEGORIES.find((c) => c.value === item.category);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <Link
      to={`/item/${item.id}`}
      className={cn(
        'group block overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={item.images[0]}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur transition-all duration-200 hover:scale-110',
            isFavorite && 'bg-destructive text-destructive-foreground'
          )}
        >
          <Heart
            className={cn('h-4 w-4', isFavorite && 'fill-current')}
          />
        </button>

        {/* Category Badge */}
        <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
          {category?.icon} {category?.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <span className="shrink-0 font-bold text-primary">
            ${item.price}
          </span>
        </div>

        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {item.description}
        </p>

        {/* Seller Info */}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          {item.sellerAvatar ? (
            <img
              src={item.sellerAvatar}
              alt={item.sellerName}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {item.sellerName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {item.sellerName}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{item.sellerUniversity}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  );
}
