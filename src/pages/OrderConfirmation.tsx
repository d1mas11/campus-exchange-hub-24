import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle,
  CreditCard,
  MessageCircle,
  Clock,
  ArrowRight,
  Copy,
  Package,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-confirmation', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      // Fetch related data
      const [listingRes, sellerRes] = await Promise.all([
        supabase.from('listings').select('title, images, condition, price').eq('id', data.listing_id).single(),
        supabase.from('profiles').select('first_name, avatar_url, account_number, university').eq('user_id', data.seller_id).single(),
      ]);

      return {
        ...data,
        listing: listingRes.data,
        seller: sellerRes.data,
      };
    },
    enabled: !!orderId,
  });

  const handleCopyAccount = () => {
    if (order?.seller?.account_number) {
      navigator.clipboard.writeText(order.seller.account_number);
      toast({ title: 'Copied!', description: 'Account number copied to clipboard.' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Link to="/pending">
            <Button>View My Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-2xl mx-auto">
        <div className="animate-fade-in space-y-6">
          {/* Success Banner */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed!</h1>
            <p className="text-muted-foreground">
              Your order has been created. The seller has been notified.
            </p>
          </div>

          {/* Item Summary */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex gap-4">
              <img
                src={order.listing?.images?.[0] || 'https://via.placeholder.com/80'}
                alt={order.listing?.title || 'Item'}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">{order.listing?.title}</h2>
                <p className="text-sm text-muted-foreground">Condition: {order.listing?.condition}</p>
                <p className="text-xl font-bold text-primary mt-1">${order.amount}</p>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Payment Instructions</h3>
            </div>

            {order.seller?.account_number ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Transfer <span className="font-bold text-foreground">${order.amount}</span> to the seller's account:
                </p>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Seller: {order.seller.first_name}</p>
                    <p className="font-mono text-sm font-medium text-foreground break-all">
                      {order.seller.account_number}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleCopyAccount}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  After transferring, coordinate with the seller via chat to arrange pickup or delivery.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  The seller hasn't added their bank account yet. Contact them via chat to arrange payment.
                </p>
              </div>
            )}
          </div>

          {/* What's Next Steps */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">What happens next?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Order placed</p>
                  <p className="text-sm text-muted-foreground">The seller has been notified about your purchase</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Transfer payment</p>
                  <p className="text-sm text-muted-foreground">Send the money to the seller's bank account shown above</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Arrange pickup/delivery</p>
                  <p className="text-sm text-muted-foreground">Chat with the seller to coordinate how you'll get the item</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/messages?sellerId=${order.seller_id}&itemId=${order.listing_id}`)}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat with Seller
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate('/pending')}
            >
              View My Orders
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
