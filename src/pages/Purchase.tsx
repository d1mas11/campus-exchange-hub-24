import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { mockItems } from '@/data/mockData';
import {
  ArrowLeft,
  ShoppingBag,
  MessageCircle,
  CheckCircle,
  Shield,
  CreditCard,
  Package,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOrder } from '@/hooks/useOrders';
import { toast } from '@/hooks/use-toast';

export default function Purchase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createOrder = useCreateOrder();

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
            user_id,
            account_number
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const mockItem = mockItems.find((i) => i.id === id);
  
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
    sellerAccountNumber: (dbItem.profiles as any)?.account_number,
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

    if (!dbItem) {
      toast({
        title: 'Demo item',
        description: 'This is a demo item and cannot be purchased.',
      });
      return;
    }

    if (user.id === item?.sellerId) {
      toast({
        title: 'Cannot purchase',
        description: "You can't buy your own listing.",
        variant: 'destructive',
      });
      return;
    }

    createOrder.mutate(
      {
        listingId: dbItem.id,
        sellerId: dbItem.user_id,
        amount: Number(dbItem.price),
        buyerId: user.id,
      },
      {
        onSuccess: (data) => {
          navigate(`/order-confirmation/${data.id}`);
        },
      }
    );
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
            {'sellerAccountNumber' in item && item.sellerAccountNumber && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-muted/50">
                <CreditCard className="h-4 w-4" />
                <span>Seller has payment info set up ✓</span>
              </div>
            )}
          </div>

          {/* How it works - Escrow */}
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-foreground">Buyer Protection</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                  1
                </div>
                <p className="text-sm text-muted-foreground">
                  You place the order — the seller is notified
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                  2
                </div>
                <p className="text-sm text-muted-foreground">
                  Transfer the payment to the seller's account (shown after order)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                  3
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Money is held</strong> until you confirm you received the item
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                  4
                </div>
                <p className="text-sm text-muted-foreground">
                  Click "Received" in Pending — payment is released to the seller
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
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              Confirm Purchase
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
