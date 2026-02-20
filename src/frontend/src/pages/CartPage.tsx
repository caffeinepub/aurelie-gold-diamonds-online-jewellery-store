import { Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetCart, useRemoveFromCart, useGetAllProducts } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { useMemo } from 'react';
import type { Page } from '../types/navigation';

interface CartPageProps {
  onNavigate: (page: Page) => void;
  onViewProduct: (productId: bigint) => void;
}

export default function CartPage({ onNavigate, onViewProduct }: CartPageProps) {
  const { identity } = useInternetIdentity();
  const { data: cart, isLoading: cartLoading } = useGetCart();
  const { data: products = [] } = useGetAllProducts();
  const removeFromCart = useRemoveFromCart();

  const isAuthenticated = !!identity;

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

  const handleRemove = async (productId: bigint) => {
    try {
      await removeFromCart.mutateAsync(productId);
      toast.success('Item removed from cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove item');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <ShoppingBag className="h-16 w-16 text-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gold">Login Required</h2>
          <p className="text-gold mb-6">
            Please login to view your shopping cart
          </p>
          <Button onClick={() => onNavigate('products')} className="bg-gold hover:bg-gold/90 text-dark-maroon">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gold">Shopping Cart</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-gold/20">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-muted animate-pulse rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                    <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <ShoppingBag className="h-16 w-16 text-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gold">Your cart is empty</h2>
          <p className="text-gold mb-6">
            Add some beautiful jewellery to your cart to get started
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
      <h1 className="text-3xl font-bold mb-8 text-gold">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const product = item.product!;
            return (
              <Card key={product.id.toString()} className="border-gold/20">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => onViewProduct(product.id)}
                      className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md bg-muted hover:opacity-80 transition-opacity"
                    >
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0].getDirectURL()}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-gold" />
                        </div>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => onViewProduct(product.id)}
                        className="text-left hover:text-gold-shimmer transition-colors"
                      >
                        <h3 className="font-semibold mb-1 text-gold">{product.name}</h3>
                      </button>
                      <p className="text-sm text-gold mb-2">
                        {product.category} • {product.material}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-gold">
                            ₹{Number(product.price).toLocaleString('en-IN')}
                          </p>
                          <p className="text-sm text-gold">
                            Quantity: {Number(item.quantity)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(product.id)}
                          disabled={removeFromCart.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 border-gold/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gold">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gold">Subtotal</span>
                  <span className="font-medium text-gold">₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gold">Shipping</span>
                  <span className="font-medium text-gold">Free</span>
                </div>
                <div className="border-t border-gold/30 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gold">Total</span>
                    <span className="text-xl font-bold text-gold">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-gold hover:bg-gold/90 text-dark-maroon" 
                size="lg"
                onClick={() => onNavigate('checkout')}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full mt-3 border-gold/40 text-gold hover:bg-gold/10"
                onClick={() => onNavigate('products')}
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

