import { useState } from 'react';
import { ArrowLeft, ShoppingCart, Minus, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetProduct, useAddToCart } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ProductCategory, Material } from '../backend';
import { toast } from 'sonner';

interface ProductDetailPageProps {
  productId: bigint;
  onBack: () => void;
  onNavigateToCart: () => void;
}

const categoryLabels: Record<ProductCategory, string> = {
  [ProductCategory.ring]: 'Ring',
  [ProductCategory.headpiece]: 'Necklace',
  [ProductCategory.bracelet]: 'Bracelet',
  [ProductCategory.diamond]: 'Lab Diamond',
};

const materialLabels: Record<Material, string> = {
  [Material._22K_gold]: '22K Gold',
  [Material._18K_gold]: '18K Gold',
  [Material._9K_gold]: '9K Gold',
};

export default function ProductDetailPage({ productId, onBack, onNavigateToCart }: ProductDetailPageProps) {
  const { data: product, isLoading } = useGetProduct(productId);
  const addToCart = useAddToCart();
  const { identity } = useInternetIdentity();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isAuthenticated = !!identity;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart.mutateAsync({
        productId,
        quantity: BigInt(quantity),
      });
      toast.success('Added to cart successfully!');
      onNavigateToCart();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted animate-pulse rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gold">Product not found</h2>
        <Button onClick={onBack} className="bg-gold hover:bg-gold/90 text-dark-maroon">
          Go Back
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.stock === BigInt(0);
  const maxQuantity = Math.min(Number(product.stock), 10);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={onBack} className="mb-6 text-gold hover:text-gold-shimmer">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-secondary/30 border border-gold/20">
            {product.images.length > 0 ? (
              <img
                src={product.images[selectedImageIndex].getDirectURL()}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="h-24 w-24 text-gold/50" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    index === selectedImageIndex
                      ? 'border-gold shadow-gold-glow'
                      : 'border-gold/20 hover:border-gold/50'
                  }`}
                >
                  <img
                    src={image.getDirectURL()}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gold">{product.name}</h1>
            <p className="text-xl text-gold">
              {categoryLabels[product.category]} • {materialLabels[product.material]}
            </p>
          </div>

          <div className="text-3xl font-bold text-gold">
            ₹{Number(product.price).toLocaleString('en-IN')}
          </div>

          <Card className="border-gold/20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 text-gold">Description</h3>
              <p className="text-gold">{product.description}</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-gold">Specifications</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gold">Category:</span>
                  <span className="font-medium text-gold">{categoryLabels[product.category]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gold">Material:</span>
                  <span className="font-medium text-gold">{materialLabels[product.material]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gold">Stock:</span>
                  <span className={`font-medium ${isOutOfStock ? 'text-red-500' : 'text-gold'}`}>
                    {isOutOfStock ? 'Out of Stock' : `${Number(product.stock)} available`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isOutOfStock && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-gold font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="border-gold/40 text-gold hover:bg-gold/10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium text-gold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="border-gold/40 text-gold hover:bg-gold/10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-gold hover:bg-gold/90 text-dark-maroon shadow-gold-glow"
                onClick={handleAddToCart}
                disabled={addToCart.isPending || !isAuthenticated}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
              </Button>

              {!isAuthenticated && (
                <p className="text-sm text-gold text-center">
                  Please login to add items to cart
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
