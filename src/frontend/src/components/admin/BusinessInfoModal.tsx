import { useState, useRef } from 'react';
import { X, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateContactInfo, useUpdateCurrentLogo } from '../../hooks/useQueries';
import type { BusinessContactInfo } from '../../backend';
import { ExternalBlob } from '../../backend';
import { toast } from 'sonner';

interface BusinessInfoModalProps {
  contactInfo: BusinessContactInfo;
  logoUrl: string | null;
  onClose: () => void;
}

export default function BusinessInfoModal({ contactInfo, logoUrl, onClose }: BusinessInfoModalProps) {
  const [formData, setFormData] = useState<BusinessContactInfo>(contactInfo);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateContactInfo = useUpdateContactInfo();
  const updateCurrentLogo = useUpdateCurrentLogo();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, or SVG file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update contact info first
      await updateContactInfo.mutateAsync(formData);

      // If a new logo was uploaded, update it separately
      if (logoFile) {
        const arrayBuffer = await logoFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const logoBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
        
        await updateCurrentLogo.mutateAsync(logoBlob);
        
        // Update favicon dynamically
        if (logoPreview) {
          const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
          if (favicon) {
            favicon.href = logoPreview;
          }
        }
      }

      toast.success('Business information updated successfully', {
        className: 'border-gold/50 bg-gradient-to-r from-dark-maroon/90 to-gold/20',
      });
      onClose();
    } catch (error: any) {
      console.error('Error updating business info:', error);
      toast.error(error.message || 'Failed to update business information');
    } finally {
      setUploadProgress(0);
    }
  };

  const handleChange = (field: keyof BusinessContactInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-dark-maroon/95 to-pink-100/20 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gold/20">
        <div className="sticky top-0 bg-gradient-to-r from-dark-maroon/95 to-pink-100/20 border-b border-gold/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gold">Edit <span className="text-gold shimmer">Business Information</span></h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gold/10 rounded-md transition-colors text-gold"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Logo Upload Section */}
          <div className="space-y-2">
            <Label className="text-gold font-semibold">Store Logo</Label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative w-24 h-24 border-2 border-dashed border-gold/30 rounded-lg overflow-hidden bg-pink-100/20">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-gold/30 rounded-lg flex items-center justify-center bg-pink-100/20">
                    <ImageIcon className="h-8 w-8 text-gold/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-gold/30 hover:bg-gold/10 text-gold hover:text-gold-shimmer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-gold/70">
                  PNG, JPG, or SVG. Max 5MB. Recommended: 200x200px
                </p>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-dark-maroon/50 rounded-full h-2 border border-gold/30">
                    <div 
                      className="bg-gold h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-gold font-semibold">Store Name</Label>
              <Input
                id="storeName"
                value={formData.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                required
                className="bg-dark-maroon/50 border-gold text-gold placeholder:text-gold/60 focus:border-gold-shimmer focus:ring-gold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gold font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className="bg-dark-maroon/50 border-gold text-gold placeholder:text-gold/60 focus:border-gold-shimmer focus:ring-gold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gold font-semibold">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
                className="bg-dark-maroon/50 border-gold text-gold placeholder:text-gold/60 focus:border-gold-shimmer focus:ring-gold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstNumber" className="text-gold font-semibold">GST Number</Label>
              <Input
                id="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => handleChange('gstNumber', e.target.value)}
                required
                className="bg-dark-maroon/50 border-gold text-gold placeholder:text-gold/60 focus:border-gold-shimmer focus:ring-gold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount" className="text-gold font-semibold">Bank Account</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) => handleChange('bankAccount', e.target.value)}
                required
                className="bg-dark-maroon/50 border-gold text-gold placeholder:text-gold/60 focus:border-gold-shimmer focus:ring-gold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifscCode" className="text-gold font-semibold">IFSC Code</Label>
              <Input
                id="ifscCode"
                value={formData.ifscCode}
                onChange={(e) => handleChange('ifscCode', e.target.value)}
                required
                className="bg-dark-maroon/50 border-gold text-gold placeholder:text-gold/60 focus:border-gold-shimmer focus:ring-gold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeAddress" className="text-gold font-semibold">Store Address</Label>
            <Textarea
              id="storeAddress"
              value={formData.storeAddress}
              onChange={(e) => handleChange('storeAddress', e.target.value)}
              rows={3}
              required
              className="bg-dark-maroon/50 border-gold text-gold placeholder:text-gold/60 focus:border-gold-shimmer focus:ring-gold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gold font-semibold">Store Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              required
              className="bg-dark-maroon/50 border-gold text-gold placeholder:text-gold/60 focus:border-gold-shimmer focus:ring-gold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gold/20">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateContactInfo.isPending || updateCurrentLogo.isPending}
              className="border-gold/30 hover:bg-gold/10 text-gold hover:text-gold-shimmer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateContactInfo.isPending || updateCurrentLogo.isPending || (uploadProgress > 0 && uploadProgress < 100)}
              className="bg-gold hover:bg-gold-shimmer text-dark-maroon font-semibold shadow-gold-glow"
            >
              {(updateContactInfo.isPending || updateCurrentLogo.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
