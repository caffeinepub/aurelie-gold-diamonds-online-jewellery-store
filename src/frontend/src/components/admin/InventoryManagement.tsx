import { useState } from 'react';
import { Package, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetAllProducts, useUpdateInventory } from '../../hooks/useQueries';
import { toast } from 'sonner';

export default function InventoryManagement() {
  const { data: products = [], isLoading } = useGetAllProducts();
  const updateInventory = useUpdateInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStockChange = (productId: bigint, value: string) => {
    const numValue = parseInt(value) || 0;
    setStockUpdates(prev => ({
      ...prev,
      [productId.toString()]: numValue,
    }));
  };

  const handleSaveAll = async () => {
    const updates = Object.entries(stockUpdates).map(([productId, stock]) => ({
      productId: BigInt(productId),
      stock: BigInt(stock),
    }));

    if (updates.length === 0) {
      toast.error('No changes to save');
      return;
    }

    try {
      await updateInventory.mutateAsync(updates);
      toast.success('Inventory updated successfully');
      setStockUpdates({});
    } catch (error: any) {
      toast.error(error.message || 'Failed to update inventory');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gold-shimmer">Inventory Management</h2>
          <p className="text-gold">Update stock levels for your products</p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={Object.keys(stockUpdates).length === 0 || updateInventory.isPending}
          className="bg-gold hover:bg-gold/90 text-dark-maroon"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gold" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-gold/20 text-gold placeholder:text-gold/50"
        />
      </div>

      {isLoading ? (
        <Card className="border-gold/20">
          <CardContent className="p-8">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-gold/20">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gold/50 mx-auto mb-4" />
            <p className="text-gold">No products found</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gold/20">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gold/20">
                  <TableHead className="text-gold">Product</TableHead>
                  <TableHead className="text-gold">Category</TableHead>
                  <TableHead className="text-gold">Material</TableHead>
                  <TableHead className="text-gold">Current Stock</TableHead>
                  <TableHead className="text-gold">New Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const currentStock = Number(product.stock);
                  const newStock = stockUpdates[product.id.toString()] ?? currentStock;
                  const hasChanged = newStock !== currentStock;

                  return (
                    <TableRow key={product.id.toString()} className="border-gold/20">
                      <TableCell className="font-medium text-gold">
                        <div className="flex items-center gap-3">
                          {product.images.length > 0 && (
                            <img
                              src={product.images[0].getDirectURL()}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gold">{product.category}</TableCell>
                      <TableCell className="text-gold">{product.material}</TableCell>
                      <TableCell className="text-gold">
                        <span className={currentStock === 0 ? 'text-red-500' : ''}>
                          {currentStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={newStock}
                          onChange={(e) => handleStockChange(product.id, e.target.value)}
                          className={`w-24 border-gold/20 text-gold ${
                            hasChanged ? 'border-gold bg-gold/5' : ''
                          }`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
