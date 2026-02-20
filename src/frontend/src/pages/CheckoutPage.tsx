import { useState, useMemo } from 'react';
import { ArrowLeft, CreditCard, CheckCircle, Smartphone } from 'lucide-react';
import { SiGooglepay } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetCart, useGetAllProducts, usePlaceOrder, useGetCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Page } from '../types/navigation';

interface CheckoutPageProps {
  onNavigate: (page: Page) => void;
}

export default function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const { data: cart } = useGetCart();
  const { data: products = [] } = useGetAllProducts();
  const { data: userProfile } = useGetCallerUserProfile();
  const placeOrder = usePlaceOrder();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'order' | 'upi'>('order');

  const cartItems = useMemo(() => {
    if (!cart || !products.length) return [];
    
    return cart.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product,
      };
    }).filter(item => item.product);
  }, [cart, products]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (item.product) {
        return sum + (Number(item.product.price) * Number(item.quantity));
      }
      return sum;
    }, 0);
  }, [cartItems]);

  const handlePlaceOrder = async () => {
    try {
      await placeOrder.mutateAsync();
      setOrderPlaced(true);
      toast.success('Order placed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    }
  };

  const handleUPIPayment = () => {
    const upiId = 'aureliegolddiamondsjewellery@paytm';
    const payeeName = 'Aurelie Gold & Diamonds';
    const amount = total.toString();
    const transactionNote = `Payment for Order - Aurelie Gold & Diamonds`;
    
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    window.open(upiUrl, '_blank');
    
    toast.info('Opening UPI payment app... Complete the payment and then place your order.');
  };

  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gold">Order Placed Successfully!</h1>
          <p className="text-gold mb-8">
            Thank you for your purchase. Your order has been confirmed and will be processed shortly.
          </p>
          <div className="space-y-3">
            <Button className="w-full bg-gold hover:bg-gold/90 text-dark-maroon" onClick={() => onNavigate('orders')}>
              View My Orders
            </Button>
            <Button variant="outline" className="w-full border-gold/40 text-gold hover:bg-gold/10" onClick={() => onNavigate('products')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-gold">Your cart is empty</h2>
          <p className="text-gold mb-6">
            Add items to your cart before checking out
          </p>
          <Button onClick={() => onNavigate('products')} className="bg-gold hover:bg-gold/90 text-dark-maroon">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => onNavigate('cart')} className="mb-6 text-gold hover:text-gold-shimmer">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Cart
      </Button>

      <h1 className="text-3xl font-bold mb-8 text-gold">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Information */}
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-gold">Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userProfile ? (
                <>
                  <div>
                    <p className="text-sm text-gold">Name</p>
                    <p className="font-medium text-gold">{userProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gold">Email</p>
                    <p className="font-medium text-gold">{userProfile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gold">Phone</p>
                    <p className="font-medium text-gold">{userProfile.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gold">Delivery Address</p>
                    <p className="font-medium text-gold">{userProfile.address}</p>
                  </div>
                </>
              ) : (
                <p className="text-gold">Loading profile...</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-gold">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`w-full flex items-center gap-3 p-4 border rounded-lg transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-gold bg-gold/10'
                    : 'border-gold/20 hover:border-gold/40'
                }`}
              >
                <SiGooglepay className="h-8 w-8 text-gold" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gold">Google Pay UPI</p>
                  <p className="text-sm text-gold">
                    Pay securely using Google Pay or any UPI app
                  </p>
                </div>
              </button>
              
              <button
                onClick={() => setPaymentMethod('order')}
                className={`w-full flex items-center gap-3 p-4 border rounded-lg transition-all ${
                  paymentMethod === 'order'
                    ? 'border-gold bg-gold/10'
                    : 'border-gold/20 hover:border-gold/40'
                }`}
              >
                <CreditCard className="h-6 w-6 text-gold" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gold">Place Order First</p>
                  <p className="text-sm text-gold">
                    Place order now, pay later via bank transfer
                  </p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 border-gold/20">
            <CardHeader>
              <CardTitle className="text-gold">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const product = item.product!;
                  return (
                    <div key={product.id.toString()} className="flex justify-between text-sm">
                      <span className="text-gold">
                        {product.name} × {Number(item.quantity)}
                      </span>
                      <span className="font-medium text-gold">
                        ₹{(Number(product.price) * Number(item.quantity)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gold/30 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gold">Subtotal</span>
                  <span className="font-medium text-gold">₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gold">Shipping</span>
                  <span className="font-medium text-gold">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gold/30">
                  <span className="font-semibold text-gold">Total</span>
                  <span className="text-xl font-bold text-gold">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {paymentMethod === 'upi' ? (
                <>
                  <Button 
                    className="w-full bg-gold hover:bg-gold/90 text-dark-maroon shadow-gold-glow" 
                    size="lg"
                    onClick={handleUPIPayment}
                    disabled={placeOrder.isPending}
                  >
                    <SiGooglepay className="h-5 w-5 mr-2" />
                    Pay with UPI
                  </Button>
                  <p className="text-xs text-gold text-center">
                    After completing UPI payment, place your order below
                  </p>
                  <Button 
                    variant="outline"
                    className="w-full border-gold/40 text-gold hover:bg-gold/10" 
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={placeOrder.isPending}
                  >
                    {placeOrder.isPending ? 'Processing...' : 'Place Order'}
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full bg-gold hover:bg-gold/90 text-dark-maroon shadow-gold-glow" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={placeOrder.isPending}
                >
                  {placeOrder.isPending ? 'Processing...' : 'Place Order'}
                </Button>
              )}

              <p className="text-xs text-gold text-center">
                By placing your order, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
