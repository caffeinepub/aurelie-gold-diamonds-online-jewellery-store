import { Package, Clock, CheckCircle, XCircle, Truck, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useGetCustomerOrders, useGetAllProducts, useCancelOrder } from '../hooks/useQueries';
import { useMemo, useEffect, useState } from 'react';
import { OrderStatus } from '../backend';
import { toast } from 'sonner';

interface OrdersPageProps {
  onViewProduct: (productId: bigint) => void;
}

const statusConfig: Record<OrderStatus, { label: string; icon: any; variant: any; className?: string }> = {
  [OrderStatus.pending]: { label: 'Pending', icon: Clock, variant: 'secondary', className: 'text-gold' },
  [OrderStatus.completed]: { label: 'Completed', icon: CheckCircle, variant: 'default', className: 'text-gold' },
  [OrderStatus.cancelled]: { 
    label: 'Cancelled', 
    icon: XCircle, 
    variant: 'destructive',
    className: 'bg-gold/20 text-gold border-gold hover:bg-gold/30'
  },
  [OrderStatus.shipped]: { label: 'Shipped', icon: Truck, variant: 'default', className: 'text-gold' },
  [OrderStatus.delivered]: { label: 'Delivered', icon: CheckCircle, variant: 'default', className: 'text-gold' },
};

export default function OrdersPage({ onViewProduct }: OrdersPageProps) {
  const { data: orders = [], isLoading, isFetching } = useGetCustomerOrders();
  const { data: products = [] } = useGetAllProducts();
  const cancelOrderMutation = useCancelOrder();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  }, [orders]);

  // Show refresh animation when fetching
  useEffect(() => {
    if (isFetching) {
      setIsRefreshing(true);
      const timer = setTimeout(() => setIsRefreshing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isFetching]);

  const handleCancelOrder = async (orderId: bigint) => {
    try {
      await cancelOrderMutation.mutateAsync(orderId);
      toast.success('Order cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order');
    }
  };

  // Check if order can be cancelled (completed or delivered status)
  const canCancelOrder = (status: OrderStatus) => {
    return status === OrderStatus.completed || status === OrderStatus.delivered;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gold">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-gold/20">
              <CardContent className="p-6">
                <div className="h-4 bg-muted animate-pulse rounded mb-4" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <Package className="h-16 w-16 text-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gold">No orders yet</h2>
          <p className="text-gold">
            Your order history will appear here once you make a purchase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gold">My Orders</h1>
        <div className="flex items-center gap-2 text-sm text-gold">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-gold' : ''}`} />
          <span>Auto-updating</span>
        </div>
      </div>

      <div className="space-y-6">
        {sortedOrders.map((order) => {
          const statusInfo = statusConfig[order.status] || statusConfig[OrderStatus.pending];
          const StatusIcon = statusInfo.icon;
          const orderDate = new Date(Number(order.createdAt) / 1000000);
          const showCancelButton = canCancelOrder(order.status);

          return (
            <Card key={order.id.toString()} className="border-gold/20">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-gold">Order #{order.id.toString()}</CardTitle>
                    <p className="text-sm text-gold mt-1">
                      Placed on {orderDate.toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <Badge 
                    variant={statusInfo.variant} 
                    className={`w-fit ${statusInfo.className || ''}`}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {order.items.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={index} className="flex justify-between items-center">
                        <button
                          onClick={() => product && onViewProduct(product.id)}
                          className="text-left hover:text-gold-shimmer transition-colors"
                        >
                          <p className="font-medium text-gold">
                            {product?.name || `Product #${item.productId.toString()}`}
                          </p>
                          <p className="text-sm text-gold">
                            Quantity: {Number(item.quantity)} × ₹{Number(item.price).toLocaleString('en-IN')}
                          </p>
                        </button>
                        <p className="font-semibold text-gold">
                          ₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-gold/30 pt-3">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-gold">Total Amount</span>
                    <span className="text-xl font-bold text-gold">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  {showCancelButton && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          disabled={cancelOrderMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gold">Are you sure you want to cancel this order?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gold">
                            This action cannot be undone. Your order #{order.id.toString()} will be cancelled.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-gold border-gold/40 hover:bg-gold/10">No, keep order</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelOrder(order.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, cancel order
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

