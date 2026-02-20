import { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateProduct } from '../../hooks/useQueries';
import { ExternalBlob, Product, ProductCategory, Material } from '../../backend';
import { toast } from 'sonner';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
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

export default function EditProductModal({ product, onClose }: EditProductModalProps) {
  const updateProduct = useUpdateProduct();
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    price: product.price.toString(),
    category: product.category,
    material: product.material,
    stock: product.stock.toString(),
  });
  const [existingImages, setExistingImages] = useState<ExternalBlob[]>(product.images);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return;
      }
    });

    setNewImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (existingImages.length + newImages.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    try {
      const newImageBlobs = await Promise.all(
        newImages.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          return ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
            setUploadProgress(percentage);
          });
        })
      );

      const allImages = [...existingImages, ...newImageBlobs];

      await updateProduct.mutateAsync({
        productId: product.id,
        name: formData.name,
        description: formData.description,
        price: BigInt(formData.price),
        category: formData.category,
        material: formData.material,
        stock: BigInt(formData.stock),
        images: allImages,
      });

      toast.success('Product updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-dark-maroon border-gold/30 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gold-shimmer">Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gold">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                className="border-gold/20 text-gold placeholder:text-gold/50"
              />
            </div>

            <div>
              <Label htmlFor="price" className="text-gold">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Enter price"
                className="border-gold/20 text-gold placeholder:text-gold/50"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-gold">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
              >
                <SelectTrigger className="border-gold/20 text-gold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="material" className="text-gold">Material *</Label>
              <Select
                value={formData.material}
                onValueChange={(value) => setFormData({ ...formData, material: value as Material })}
              >
                <SelectTrigger className="border-gold/20 text-gold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(materialLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stock" className="text-gold">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="Enter stock quantity"
                className="border-gold/20 text-gold placeholder:text-gold/50"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-gold">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              rows={3}
              className="border-gold/20 text-gold placeholder:text-gold/50"
            />
          </div>

          <div>
            <Label className="text-gold">Product Images * (Max 5)</Label>
            <div className="mt-2 space-y-4">
              {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={image.getDirectURL()}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gold/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {newImagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gold/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {existingImages.length + newImages.length < 5 && (
                <label
                  htmlFor="images"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gold/20 border-dashed rounded-lg cursor-pointer hover:bg-gold/5 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gold" />
                    <p className="text-sm text-gold">
                      <span className="font-semibold">Click to upload</span> more images
                    </p>
                    <p className="text-xs text-gold/70">PNG, JPG or WEBP (MAX. 5MB each)</p>
                  </div>
                  <input
                    id="images"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleNewImageChange}
                  />
                </label>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gold/20 rounded-full h-2">
                  <div
                    className="bg-gold h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gold/40 text-gold hover:bg-gold/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProduct.isPending}
              className="flex-1 bg-gold hover:bg-gold/90 text-dark-maroon"
            >
              {updateProduct.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
