import { useState } from 'react';
import { Edit, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useGetAllProducts } from '../../hooks/useQueries';
import { ProductCategory, Material } from '../../backend';
import EditProductModal from './EditProductModal';
import type { Product } from '../../backend';

interface ProductManagementProps {
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

export default function ProductManagement({ onViewProduct }: ProductManagementProps) {
  const { data: products = [], isLoading } = useGetAllProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoryLabels[p.category].toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-gold/20 bg-gradient-to-r from-pink-100/20 to-dark-maroon/20">
            <CardContent className="p-4">
              <div className="h-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-gold/30 text-gold placeholder:text-gold/50 bg-pink-100/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id.toString()} className="border-gold/20 bg-gradient-to-r from-pink-100/30 to-dark-maroon/20 hover:shadow-gold-glow transition-shadow">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <button
                  onClick={() => onViewProduct(product.id)}
                  className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-pink-100/20 hover:opacity-80 transition-opacity border border-gold/20"
                >
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0].getDirectURL()}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-gold/50" />
                    </div>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-gold">{product.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-gold/20 text-gold border-gold/30">{categoryLabels[product.category]}</Badge>
                        <Badge variant="outline" className="border-gold/30 text-gold">{materialLabels[product.material]}</Badge>
                        {product.stock === BigInt(0) ? (
                          <Badge variant="destructive" className="text-gold">Out of Stock</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {Number(product.stock)} in stock
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gold/70 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-lg font-bold text-gold shimmer whitespace-nowrap">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                          className="border-gold/30 hover:bg-gold/10 text-gold"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gold/70">No products found</p>
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}
