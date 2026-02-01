import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { mockItems } from '@/data/mockData';
import { CATEGORIES } from '@/types';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MapPin,
  Calendar,
  Languages,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToggleFavourite, useFavouriteIds } from '@/hooks/useFavourites';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { data: favouriteIds = new Set() } = useFavouriteIds();
  const toggleFavourite = useToggleFavourite();

  // Try to fetch from database first
  const { data: dbItem, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:user_id (
            first_name,
            avatar_url,
            university
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fall back to mock items if not found in DB
  const mockItem = mockItems.find((i) => i.id === id);
  
  // Determine which item to show
  const item = dbItem ? {
    id: dbItem.id,
    title: dbItem.title,
    description: dbItem.description || '',
    price: Number(dbItem.price),
    category: dbItem.category,
    condition: dbItem.condition,
    images: dbItem.images || [],
    sellerId: dbItem.user_id,
    sellerName: (dbItem.profiles as any)?.first_name || 'Anonymous',
    sellerUniversity: (dbItem.profiles as any)?.university || 'Unknown University',
    sellerLanguages: ['English'],
    sellerAvatar: (dbItem.profiles as any)?.avatar_url,
    createdAt: new Date(dbItem.created_at),
  } : mockItem;

  const category = CATEGORIES.find((c) => c.value === item?.category);
  const isFavourite = id ? favouriteIds.has(id) : false;
  
  // Check if listing ID is a valid UUID (real DB item vs mock item)
  const isRealListing = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

  const handleToggleFavourite = () => {
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
    
    if (id && dbItem) {
      toggleFavourite.mutate({ listingId: id, isFavourite });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Item not found</h1>
          <Link to="/">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === item.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? item.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="animate-fade-in">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              <img
                src={item.images[currentImageIndex] || 'https://via.placeholder.com/600'}
                alt={item.title}
                className="h-full w-full object-cover"
              />

              {item.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur transition-transform hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur transition-transform hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Image Dots */}
              {item.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {item.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'h-2 w-2 rounded-full transition-all',
                        index === currentImageIndex
                          ? 'bg-primary-foreground w-4'
                          : 'bg-primary-foreground/50'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {item.images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {item.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                      index === currentImageIndex
                        ? 'border-primary'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Category */}
            <Badge variant="secondary" className="mb-4">
              {category?.icon} {category?.label}
            </Badge>

            {/* Title & Price */}
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {item.title}
            </h1>
            <p className="text-3xl font-bold text-primary mb-6">${item.price}</p>

            {/* Description */}
            <div className="mb-6">
              <h2 className="font-semibold text-foreground mb-2">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Posted Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Posted {formatDistanceToNow(item.createdAt, { addSuffix: true })}</span>
              </div>
            </div>

            {/* Seller Card */}
            <div className="rounded-xl border border-border bg-card p-4 mb-6">
              <h2 className="font-semibold text-foreground mb-4">Seller</h2>
              <div className="flex items-start gap-4">
                {item.sellerAvatar ? (
                  <img
                    src={item.sellerAvatar}
                    alt={item.sellerName}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-medium text-primary-foreground">
                    {item.sellerName.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {item.sellerName}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{item.sellerUniversity}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Languages className="h-3.5 w-3.5" />
                    <span>Speaks: {item.sellerLanguages.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link to={`/messages?item=${item.id}`} className="flex-1">
                <Button variant="hero" size="lg" className="w-full">
                  <MessageCircle className="h-5 w-5" />
                  Message Seller
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={handleToggleFavourite}
                className={cn(isFavourite && 'text-destructive border-destructive')}
                disabled={!dbItem}
              >
                <Heart className={cn('h-5 w-5', isFavourite && 'fill-current')} />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
