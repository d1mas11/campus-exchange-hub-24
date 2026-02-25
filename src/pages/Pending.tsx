import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Package,
  CheckCircle,
  CreditCard,
  MessageCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrders, useUpdateOrderStatus, type Order } from '@/hooks/useOrders';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CreditCard },
  confirmed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

function OrderCard({ order, currentUserId }: { order: Order; currentUserId: string }) {
  const updateStatus = useUpdateOrderStatus();
  const isBuyer = order.buyer_id === currentUserId;
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const handleConfirmReceived = () => {
    updateStatus.mutate({ orderId: order.id, status: 'confirmed' });
  };

  const handleCancel = () => {
    updateStatus.mutate({ orderId: order.id, status: 'cancelled' });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex gap-4">
        {/* Item image */}
        <img
          src={order.listing?.images?.[0] || 'https://via.placeholder.com/80'}
          alt={order.listing?.title || 'Item'}
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {order.listing?.title || 'Unknown Item'}
            </h3>
            <span className={cn('shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>

          <p className="text-lg font-bold text-primary mb-1">${order.amount}</p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>{isBuyer ? 'Seller' : 'Buyer'}:</span>
            <span className="font-medium text-foreground">
              {isBuyer
                ? order.seller_profile?.first_name || 'Anonymous'
                : order.buyer_profile?.first_name || 'Anonymous'}
            </span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
          </div>

          {/* Seller account info - shown to buyer when pending/paid */}
          {isBuyer && (order.status === 'pending' || order.status === 'paid') && order.seller_profile?.account_number && (
            <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50 mb-2">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground">Transfer to: </span>
                <span className="font-mono font-medium text-foreground break-all">
                  {order.seller_profile.account_number}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-2">
            {isBuyer && (order.status === 'pending' || order.status === 'paid') && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleConfirmReceived}
                  disabled={updateStatus.isPending}
                >
                  <Package className="h-4 w-4 mr-1" />
                  I Received It
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateStatus.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
            {!isBuyer && (order.status === 'pending' || order.status === 'paid') && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => updateStatus.mutate({ orderId: order.id, status: 'paid' })}
                  disabled={updateStatus.isPending || order.status === 'paid'}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  {order.status === 'paid' ? 'Payment Confirmed' : 'Payment Received'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateStatus.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
            <Link to={`/messages?sellerId=${isBuyer ? order.seller_id : order.buyer_id}&itemId=${order.listing_id}`}>
              <Button size="sm" variant="ghost">
                <MessageCircle className="h-4 w-4 mr-1" />
                Chat
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Pending() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useOrders();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </main>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status === 'pending' || o.status === 'paid');
  const completedOrders = orders.filter((o) => o.status === 'confirmed' || o.status === 'cancelled');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-4">Items you buy or sell will appear here</p>
            <Link to="/">
              <Button>Browse Items</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {activeOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Active ({activeOrders.length})
                </h2>
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} currentUserId={user.id} />
                  ))}
                </div>
              </div>
            )}

            {completedOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  History ({completedOrders.length})
                </h2>
                <div className="space-y-3">
                  {completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} currentUserId={user.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
