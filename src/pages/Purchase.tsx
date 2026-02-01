import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { mockItems } from '@/data/mockData';
import { ArrowLeft, ShoppingBag, MessageCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function Purchase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
            university,
            user_id
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
    sellerAvatar: (dbItem.profiles as any)?.avatar_url,
  } : mockItem;

  const handleConfirmPurchase = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to make a purchase.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    toast({
      title: 'Purchase Request Sent!',
      description: 'The seller has been notified. They will contact you shortly.',
    });
    
    // Navigate to messages with seller
    navigate(`/messages?sellerId=${item?.sellerId}&itemId=${item?.id}`);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="rounded-2xl border border-border bg-card p-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Confirm Purchase</h1>
              <p className="text-sm text-muted-foreground">Review your order details</p>
            </div>
          </div>

          {/* Item Summary */}
          <div className="flex gap-4 p-4 rounded-xl bg-muted/50 mb-6">
            <img
              src={item.images[0] || 'https://via.placeholder.com/100'}
              alt={item.title}
              className="h-24 w-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-foreground mb-1">{item.title}</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Condition: {item.condition}
              </p>
              <p className="text-xl font-bold text-primary">${item.price}</p>
            </div>
          </div>

          {/* Seller Info */}
          <div className="p-4 rounded-xl border border-border mb-6">
            <h3 className="font-semibold text-foreground mb-3">Seller</h3>
            <div className="flex items-center gap-3">
              {item.sellerAvatar ? (
                <img
                  src={item.sellerAvatar}
                  alt={item.sellerName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {item.sellerName.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">{item.sellerName}</p>
                <p className="text-sm text-muted-foreground">{item.sellerUniversity}</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="p-4 rounded-xl bg-accent/50 mb-6">
            <h3 className="font-semibold text-foreground mb-3">How it works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                  1
                </div>
                <p className="text-sm text-muted-foreground">
                  Click "Confirm Purchase" to notify the seller
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                  2
                </div>
                <p className="text-sm text-muted-foreground">
                  Chat with the seller to arrange pickup/payment
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                  3
                </div>
                <p className="text-sm text-muted-foreground">
                  Meet up and complete the transaction safely
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => navigate(`/messages?sellerId=${item.sellerId}&itemId=${item.id}`)}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Message First
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmPurchase}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Confirm Purchase
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
