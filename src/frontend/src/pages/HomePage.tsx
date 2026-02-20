import { ArrowRight, Sparkles, Shield, Truck, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetAllProducts } from '../hooks/useQueries';
import HomeCarousel from '../components/HomeCarousel';
import type { Page } from '../types/navigation';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  onViewProduct: (productId: bigint) => void;
}

export default function HomePage({ onNavigate, onViewProduct }: HomePageProps) {
  const { data: products = [], isLoading } = useGetAllProducts();
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dark-maroon via-maroon to-dark-maroon py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gold-shimmer">
            Exquisite Gold & Diamond Jewellery
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gold">
            Discover our stunning collection of handcrafted jewellery, featuring the finest gold and lab-grown diamonds
          </p>
          <Button
            size="lg"
            onClick={() => onNavigate('products')}
            className="bg-gold hover:bg-gold/90 text-dark-maroon shadow-gold-glow text-lg px-8"
          >
            Explore Collection
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="container mx-auto px-4 py-12">
        <HomeCarousel />
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-gold/20 bg-card hover:shadow-gold transition-shadow">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gold">Certified Quality</h3>
              <p className="text-gold">
                All our jewellery comes with authenticity certificates
              </p>
            </CardContent>
          </Card>
          <Card className="border-gold/20 bg-card hover:shadow-gold transition-shadow">
            <CardContent className="p-6 text-center">
              <Truck className="h-12 w-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gold">Free Shipping</h3>
              <p className="text-gold">
                Complimentary shipping on all orders across India
              </p>
            </CardContent>
          </Card>
          <Card className="border-gold/20 bg-card hover:shadow-gold transition-shadow">
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gold">Lifetime Warranty</h3>
              <p className="text-gold">
                Lifetime warranty on all gold and diamond jewellery
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
            Featured <span className="text-gold-shimmer">Collection</span>
          </h2>
          <p className="text-gold max-w-2xl mx-auto">
            Handpicked pieces from our exclusive collection
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden border-gold/20">
                <div className="aspect-square bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card
                key={product.id.toString()}
                className="overflow-hidden hover:shadow-gold transition-all cursor-pointer group border-gold/20 bg-card"
                onClick={() => onViewProduct(product.id)}
              >
                <div className="aspect-square overflow-hidden bg-secondary/30 relative">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0].getDirectURL()}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-gold/50" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1 text-gold">{product.name}</h3>
                  <p className="text-lg font-bold text-gold">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('products')}
            className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold-shimmer"
          >
            View All Products
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
