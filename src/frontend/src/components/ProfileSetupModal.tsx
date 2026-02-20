import { useState, useEffect } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const saveProfile = useSaveCallerUserProfile();

  // Check if email matches dedicated admin
  const isDedicatedAdmin = email.toLowerCase() === 'arjun.tapse@gmail.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !phone || !address) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await saveProfile.mutateAsync({ name, email, phone, address });
      if (isDedicatedAdmin) {
        toast.success('Admin profile created successfully! You have full administrator privileges.');
      } else {
        toast.success('Profile created successfully!');
      }
    } catch (error) {
      toast.error('Failed to create profile');
      console.error(error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md border-gold/20" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-gold">Welcome to Aurelie!</DialogTitle>
          <DialogDescription className="text-gold">
            Please complete your profile to continue shopping.
          </DialogDescription>
        </DialogHeader>
        
        {isDedicatedAdmin && email && (
          <Alert className="border-gold/50 bg-gradient-to-r from-gold/10 to-dark-maroon/10">
            <Shield className="h-4 w-4 text-gold" />
            <AlertDescription className="text-gold text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span className="font-semibold">Admin Access Detected</span>
              </div>
              <p className="mt-1 text-xs text-gold/80">
                This email is registered as a dedicated administrator. You will have full access to all admin features.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gold">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="border-gold/20 text-gold placeholder:text-gold/70"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gold">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="border-gold/20 text-gold placeholder:text-gold/70"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gold">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 1234567890"
              required
              className="border-gold/20 text-gold placeholder:text-gold/70"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-gold">Address *</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your complete address"
              required
              rows={3}
              className="border-gold/20 text-gold placeholder:text-gold/70"
            />
          </div>
          <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-dark-maroon" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? 'Creating Profile...' : 'Complete Profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
