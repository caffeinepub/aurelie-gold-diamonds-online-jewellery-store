import { useState } from 'react';
import { Plus, Trash2, Edit, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetCarouselItems, useAddCarouselItem, useUpdateCarouselItem, useDeleteCarouselItem } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { toast } from 'sonner';

interface CarouselFormData {
  title: string;
  url: string;
  image: File | null;
}

export default function CarouselManagement() {
  const { data: carouselItems = [], isLoading } = useGetCarouselItems();
  const addCarouselItem = useAddCarouselItem();
  const updateCarouselItem = useUpdateCarouselItem();
  const deleteCarouselItem = useDeleteCarouselItem();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<CarouselFormData>({
    title: '',
    url: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.image && !editingItem) {
      toast.error('Please select an image');
      return;
    }

    if (!formData.url) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      let imageBlob: ExternalBlob;

      if (formData.image) {
        const arrayBuffer = await formData.image.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        imageBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      } else if (editingItem) {
        imageBlob = editingItem.image;
      } else {
        throw new Error('No image available');
      }

      if (editingItem) {
        await updateCarouselItem.mutateAsync({
          id: editingItem.id,
          title: formData.title,
          url: formData.url,
          image: imageBlob,
        });
        toast.success('Carousel item updated successfully');
      } else {
        await addCarouselItem.mutateAsync({
          title: formData.title,
          url: formData.url,
          image: imageBlob,
        });
        toast.success('Carousel item added successfully');
      }

      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save carousel item');
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm('Are you sure you want to delete this carousel item?')) return;

    try {
      await deleteCarouselItem.mutateAsync(id);
      toast.success('Carousel item deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete carousel item');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      url: item.url,
      image: null,
    });
    setImagePreview(item.image.getDirectURL());
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setFormData({ title: '', url: '', image: null });
    setImagePreview('');
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gold-shimmer">Carousel Management</h2>
          <p className="text-gold">Manage homepage carousel images and links</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gold hover:bg-gold/90 text-dark-maroon"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Carousel Item
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gold/20">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : carouselItems.length === 0 ? (
        <Card className="border-gold/20">
          <CardContent className="p-8 text-center">
            <p className="text-gold">No carousel items yet. Add your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carouselItems.map((item) => (
            <Card key={item.id.toString()} className="border-gold/20 overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={item.image.getDirectURL()}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gold mb-1">{item.title || 'Untitled'}</h3>
                <div className="flex items-center gap-2 text-sm text-gold mb-3">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{item.url}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1 border-gold/40 text-gold hover:bg-gold/10"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 border-red-500/40 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-dark-maroon border-gold/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gold-shimmer">
              {editingItem ? 'Edit Carousel Item' : 'Add Carousel Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gold">Title (Optional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter carousel title"
                className="border-gold/20 text-gold placeholder:text-gold/50"
              />
            </div>

            <div>
              <Label htmlFor="url" className="text-gold">URL Link *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                className="border-gold/20 text-gold placeholder:text-gold/50"
              />
            </div>

            <div>
              <Label htmlFor="image" className="text-gold">
                Carousel Image {!editingItem && '*'}
              </Label>
              <div className="mt-2">
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-gold/20 border-dashed rounded-lg cursor-pointer hover:bg-gold/5 transition-colors"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gold" />
                      <p className="mb-2 text-sm text-gold">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gold/70">PNG, JPG or WEBP (MAX. 10MB)</p>
                    </div>
                  )}
                  <input
                    id="image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gold/20 rounded-full h-2">
                    <div
                      className="bg-gold h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gold mt-1">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1 border-gold/40 text-gold hover:bg-gold/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={addCarouselItem.isPending || updateCarouselItem.isPending}
                className="flex-1 bg-gold hover:bg-gold/90 text-dark-maroon"
              >
                {(addCarouselItem.isPending || updateCarouselItem.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingItem ? 'Update' : 'Add'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
