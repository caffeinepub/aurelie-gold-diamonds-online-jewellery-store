import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAllProducts, useUpdateOrderStatus, useGetOrdersForPolling } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { OrderStatus } from '../../backend';
import { Clock, CheckCircle, XCircle, Truck, RefreshCw, Sparkles, User, Mail, Phone, MapPin, Bell } from 'lucide-react';

interface OrderManagementProps {
  onViewProduct: (productId: bigint) => void;
}

const statusConfig: Record<OrderStatus, { label: string; icon: any; variant: any }> = {
  [OrderStatus.pending]: { label: 'Pending', icon: Clock, variant: 'secondary' },
  [OrderStatus.completed]: { label: 'Completed', icon: CheckCircle, variant: 'default' },
  [OrderStatus.cancelled]: { label: 'Cancelled', icon: XCircle, variant: 'destructive' },
  [OrderStatus.shipped]: { label: 'Shipped', icon: Truck, variant: 'default' },
  [OrderStatus.delivered]: { label: 'Delivered', icon: CheckCircle, variant: 'default' },
};

export default function OrderManagement({ onViewProduct }: OrderManagementProps) {
  const { data: products = [] } = useGetAllProducts();
  const { data: allOrdersWithDetails = [], isLoading, isFetching, refetch, dataUpdatedAt } = useGetOrdersForPolling();
  const updateStatus = useUpdateOrderStatus();
  
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const previousOrdersRef = useRef<string[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Update last refresh time whenever data is fetched
  useEffect(() => {
    if (!isFetching && allOrdersWithDetails.length >= 0) {
      setLastRefreshTime(new Date());
    }
  }, [isFetching, allOrdersWithDetails, dataUpdatedAt]);

  // Detect new orders by comparing with previous order list
  useEffect(() => {
    if (allOrdersWithDetails.length > 0) {
      const currentOrderIds = allOrdersWithDetails.map(o => o.order.id.toString());
      
      if (previousOrdersRef.current.length > 0) {
        const newIds = currentOrderIds.filter(id => !previousOrdersRef.current.includes(id));
        if (newIds.length > 0) {
          setNewOrderIds(new Set(newIds));
          setHasNewOrders(true);
          
          toast.success(`🎉 ${newIds.length} new order${newIds.length > 1 ? 's' : ''} received!`, {
            icon: <Sparkles className="h-5 w-5 text-gold animate-pulse" />,
            duration: 5000,
            className: 'border-gold/50 bg-gradient-to-r from-dark-maroon/90 to-gold/20',
          });
          
          // Clear new order highlights after 15 seconds
          setTimeout(() => {
            setNewOrderIds(new Set());
            setHasNewOrders(false);
          }, 15000);
        }
      }
      
      previousOrdersRef.current = currentOrderIds;
    }
  }, [allOrdersWithDetails]);

  // Handle backend-marked new orders
  useEffect(() => {
    const backendNewOrders = allOrdersWithDetails
      .filter(o => o.isNew)
      .map(o => o.order.id.toString());
    
    if (backendNewOrders.length > 0) {
      setNewOrderIds(prev => {
        const updated = new Set(prev);
        backendNewOrders.forEach(id => updated.add(id));
        return updated;
      });
      setHasNewOrders(true);
      
      setTimeout(() => {
        setNewOrderIds(new Set());
        setHasNewOrders(false);
      }, 15000);
    }
  }, [allOrdersWithDetails]);

  // Visual refresh indicator
  useEffect(() => {
    if (isFetching) {
      setIsRefreshing(true);
      const timer = setTimeout(() => setIsRefreshing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isFetching]);

  const handleStatusChange = async (orderId: bigint, newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({
        orderId,
        status: newStatus,
      });
      toast.success('Order status updated successfully', {
        className: 'border-gold/50 bg-gradient-to-r from-dark-maroon/90 to-gold/20',
      });
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleAcceptOrder = async (orderId: bigint) => {
    try {
      await updateStatus.mutateAsync({
        orderId,
        status: OrderStatus.shipped,
      });
      toast.success('Order accepted and marked as shipped', {
        icon: <CheckCircle className="h-5 w-5 text-gold" />,
        className: 'border-gold/50 bg-gradient-to-r from-dark-maroon/90 to-gold/20',
      });
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept order');
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    toast.success('Orders refreshed successfully', {
      className: 'border-gold/50 bg-gradient-to-r from-dark-maroon/90 to-gold/20',
    });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
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
    );
  }

  if (allOrdersWithDetails.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <RefreshCw className={`h-12 w-12 text-gold ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-gold"></span>
              </span>
            )}
          </div>
          <div>
            <p className="text-gold text-lg font-medium">No orders to display</p>
            <p className="text-sm text-gold/70 mt-2">
              Orders will appear here automatically when customers place them
            </p>
            <p className="text-xs text-gold/60 mt-1">
              Auto-refreshing every 3 seconds • Last refresh: {lastRefreshTime.toLocaleTimeString()}
            </p>
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="mt-4 border-gold/30 hover:bg-gold/10 text-gold"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>
    );
  }

  const sortedOrders = [...allOrdersWithDetails].sort((a, b) => Number(b.order.createdAt) - Number(a.order.createdAt));

  return (
    <div className="space-y-6">
      <div className={`flex items-center justify-between rounded-lg p-4 transition-all duration-500 ${
        hasNewOrders 
          ? 'bg-gradient-to-r from-gold/20 to-dark-maroon/20 border-2 border-gold shadow-lg shadow-gold/30' 
          : 'bg-dark-maroon/10 border border-gold/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin text-gold' : 'text-gold/70'}`} />
            {hasNewOrders && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
              </span>
            )}
          </div>
          <div>
            <span className={`text-sm font-medium ${hasNewOrders ? 'text-gold shimmer' : 'text-gold/70'}`}>
              {hasNewOrders ? '🔔 New orders received!' : 'Auto-refreshing every 3 seconds'}
            </span>
            <p className="text-xs text-gold/60 mt-0.5">
              {hasNewOrders ? 'Check the highlighted orders below' : `Last refresh: ${lastRefreshTime.toLocaleTimeString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {hasNewOrders && (
            <Badge className="bg-gold text-dark-maroon font-semibold animate-pulse shadow-gold-glow">
              <Bell className="h-3 w-3 mr-1" />
              {newOrderIds.size} New
            </Badge>
          )}
          <div className="text-sm font-medium text-gold">
            Total Orders: <span className="text-gold shimmer">{allOrdersWithDetails.length}</span>
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
            className="border-gold/30 hover:bg-gold/10 text-gold"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {sortedOrders.map(({ order, customer, isNew }) => {
        const statusInfo = statusConfig[order.status] || statusConfig[OrderStatus.pending];
        const StatusIcon = statusInfo.icon;
        const orderDate = new Date(Number(order.createdAt) / 1000000);
        const isNewOrder = newOrderIds.has(order.id.toString()) || isNew;
        const isPending = order.status === OrderStatus.pending;

        return (
          <Card 
            key={order.id.toString()} 
            className={`transition-all duration-700 border-gold/20 ${
              isNewOrder 
                ? 'ring-4 ring-gold shadow-2xl shadow-gold/40 bg-gradient-to-br from-background via-gold/5 to-background' 
                : 'bg-gradient-to-br from-dark-maroon/5 to-gold/5'
            }`}
          >
            <CardHeader className={isNewOrder ? 'relative overflow-hidden' : ''}>
              {isNewOrder && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent animate-shimmer" />
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg text-gold">Order #{order.id.toString()}</CardTitle>
                      {isNewOrder && (
                        <Badge className="bg-gradient-to-r from-gold to-yellow-500 text-dark-maroon font-bold animate-pulse shadow-lg shadow-gold/50">
                          <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                          NEW ORDER
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gold/70 mt-1">
                      {orderDate.toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={statusInfo.variant} className={order.status === OrderStatus.cancelled ? 'bg-gold text-dark-maroon' : ''}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                  
                  {isPending && (
                    <Button
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={updateStatus.isPending}
                      size="sm"
                      className="bg-gold hover:bg-gold/90 text-dark-maroon font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      {updateStatus.isPending ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accept Order
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                    disabled={updateStatus.isPending}
                  >
                    <SelectTrigger className="w-[140px] border-gold/30 text-gold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OrderStatus.pending}>Pending</SelectItem>
                      <SelectItem value={OrderStatus.shipped}>Shipped</SelectItem>
                      <SelectItem value={OrderStatus.delivered}>Delivered</SelectItem>
                      <SelectItem value={OrderStatus.completed}>Completed</SelectItem>
                      <SelectItem value={OrderStatus.cancelled}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`mb-6 p-4 rounded-lg border transition-all duration-500 ${
                isNewOrder 
                  ? 'bg-gradient-to-r from-gold/15 via-dark-maroon/10 to-gold/15 border-gold/40 shadow-md' 
                  : 'bg-gradient-to-r from-dark-maroon/10 to-gold/5 border-gold/20'
              }`}>
                <h3 className="text-sm font-semibold text-gold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Details
                  {isNewOrder && (
                    <Sparkles className="h-3 w-3 text-gold animate-pulse" />
                  )}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gold/60 text-xs">Name</p>
                      <p className="font-medium text-gold break-words">{customer?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gold/60 text-xs">Email</p>
                      <p className="font-medium text-gold break-all">{customer?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gold/60 text-xs">Phone</p>
                      <p className="font-medium text-gold">{customer?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gold/60 text-xs">Address</p>
                      <p className="font-medium text-gold break-words">{customer?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <h3 className="text-sm font-semibold text-gold/70">Order Items</h3>
                {order.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <button
                        onClick={() => product && onViewProduct(product.id)}
                        className="text-left hover:text-gold transition-colors"
                      >
                        <p className="font-medium text-gold">
                          {product?.name || `Product #${item.productId.toString()}`}
                        </p>
                        <p className="text-sm text-gold/60">
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
              <div className="border-t border-gold/20 pt-3 flex justify-between items-center">
                <span className="font-semibold text-gold">Total Amount</span>
                <span className="text-xl font-bold text-gold shimmer">
                  ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
