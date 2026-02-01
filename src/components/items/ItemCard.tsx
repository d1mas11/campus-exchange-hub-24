import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useToggleFavourite, useFavouriteIds } from '@/hooks/useFavourites';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { Listing } from '@/hooks/useListings';

interface ItemCardProps {
  listing: Listing;
  className?: string;
}

export function ItemCard({ listing, className }: ItemCardProps) {
  const { user } = useAuth();
  const { data: favouriteIds = new Set() } = useFavouriteIds();
  const toggleFavourite = useToggleFavourite();
  
  const isFavourite = favouriteIds.has(listing.id);
  const category = CATEGORIES.find((c) => c.value === listing.category);

  // Check if listing ID is a valid UUID (real DB item vs mock item)
  const isRealListing = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listing.id);

  const handleToggleFavourite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your favourites.',
        variant: 'destructive',
      });
      return;
    }

    if (!isRealListing) {
      toast({
        title: 'Demo item',
        description: 'This is a demo item and cannot be added to favourites.',
      });
      return;
    }
    
    toggleFavourite.mutate({ listingId: listing.id, isFavourite });
  };

  return (
    <Link
      to={`/item/${listing.id}`}
      className={cn(
        'group block overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={listing.images[0] || 'https://via.placeholder.com/300'}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Favorite Button */}
        <button
          onClick={handleToggleFavourite}
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur transition-all duration-200 hover:scale-110',
            isFavourite && 'bg-destructive text-destructive-foreground'
          )}
        >
          <Heart
            className={cn('h-4 w-4', isFavourite && 'fill-current')}
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
            {listing.title}
          </h3>
          <span className="shrink-0 font-bold text-primary">
            ${listing.price}
          </span>
        </div>

        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {listing.description}
        </p>

        {/* Seller Info */}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          {listing.seller_avatar ? (
            <img
              src={listing.seller_avatar}
              alt={listing.seller_name || 'Seller'}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {(listing.seller_name || 'A').charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {listing.seller_name || 'Anonymous'}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{listing.seller_university || 'Unknown'}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  );
}
