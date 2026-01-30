import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Heart, MapPin } from 'lucide-react';
import { useFavourites } from '@/hooks/useFavourites';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function Favourites() {
  const { user } = useAuth();
  const { data: favourites = [], isLoading } = useFavourites();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign in to see your favourites</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Favourites</h1>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            Loading your favourites...
          </div>
        ) : favourites.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favourites.map((listing) => {
              const category = CATEGORIES.find((c) => c.value === listing.category);
              return (
                <Link
                  key={listing.id}
                  to={`/item/${listing.id}`}
                  className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={listing.images[0] || 'https://via.placeholder.com/300'}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                      {category?.icon} {category?.label}
                    </div>
                    <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                      <Heart className="h-4 w-4 fill-current" />
                    </div>
                  </div>
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
                    <div className="flex items-center gap-2 border-t border-border pt-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {(listing.seller_name || 'A').charAt(0)}
                      </div>
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
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No favourites yet</h2>
            <p className="text-muted-foreground mb-4">Items you favourite will appear here</p>
            <Link to="/">
              <Button>Browse Listings</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
