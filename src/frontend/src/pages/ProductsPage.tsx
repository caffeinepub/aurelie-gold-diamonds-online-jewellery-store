import { useState, useMemo } from 'react';
import { Search, Filter, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAllProducts } from '../hooks/useQueries';
import { ProductCategory, Material } from '../backend';

interface ProductsPageProps {
  onViewProduct: (productId: bigint) => void;
}

const categoryLabels: Record<ProductCategory, string> = {
  [ProductCategory.ring]: 'Rings',
  [ProductCategory.headpiece]: 'Necklaces',
  [ProductCategory.bracelet]: 'Bracelets',
  [ProductCategory.diamond]: 'Lab Diamonds',
};

const materialLabels: Record<Material, string> = {
  [Material._22K_gold]: '22K Gold',
  [Material._18K_gold]: '18K Gold',
  [Material._9K_gold]: '9K Gold',
};

export default function ProductsPage({ onViewProduct }: ProductsPageProps) {
  const { data: products = [], isLoading } = useGetAllProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const categories = useMemo(() => {
    return ['all', ProductCategory.ring, ProductCategory.headpiece, ProductCategory.bracelet, ProductCategory.diamond];
  }, []);

  const materials = useMemo(() => {
    return ['all', Material._22K_gold, Material._18K_gold, Material._9K_gold];
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (materialFilter !== 'all') {
      filtered = filtered.filter(p => p.material === materialFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [products, searchTerm, categoryFilter, materialFilter, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gold">Our <span className="text-gold-shimmer">Collection</span></h1>
        <p className="text-gold">
          Explore our exquisite range of gold and diamond jewellery
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gold" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gold/20 focus:border-gold focus:ring-gold text-gold placeholder:text-gold/70"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px] border-gold/20 text-gold">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter(c => c !== 'all').map(cat => (
                <SelectItem key={cat} value={cat}>
                  {categoryLabels[cat as ProductCategory]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={materialFilter} onValueChange={setMaterialFilter}>
            <SelectTrigger className="w-full md:w-[180px] border-gold/20 text-gold">
              <SelectValue placeholder="Material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Materials</SelectItem>
              {materials.filter(m => m !== 'all').map(mat => (
                <SelectItem key={mat} value={mat}>
                  {materialLabels[mat as Material]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px] border-gold/20 text-gold">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="overflow-hidden border-gold/20">
              <div className="aspect-square bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="h-16 w-16 text-gold/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gold">No products found</h3>
          <p className="text-gold">
            Try adjusting your filters or search term
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gold">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
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
                  {product.stock === BigInt(0) && (
                    <div className="absolute inset-0 bg-maroon/80 flex items-center justify-center">
                      <span className="text-gold font-semibold">Out of Stock</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1 text-gold">{product.name}</h3>
                  <p className="text-sm text-gold mb-2 line-clamp-1">
                    {categoryLabels[product.category]} • {materialLabels[product.material]}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gold">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </p>
                    {product.stock > BigInt(0) && (
                      <span className="text-xs text-gold">
                        {Number(product.stock)} in stock
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
