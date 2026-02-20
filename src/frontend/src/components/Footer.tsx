import { Heart, Mail, Phone, MapPin } from 'lucide-react';
import { useGetContactInfo, useGetCurrentLogo } from '../hooks/useQueries';

export default function Footer() {
  const { data: contactInfo, isLoading } = useGetContactInfo();
  const { data: currentLogo, isLoading: isLoadingLogo } = useGetCurrentLogo();

  // Use dynamic logo from backend or fallback to new default logo
  const logoUrl = currentLogo?.image?.getDirectURL() || '/assets/1769006738240.jpg';

  return (
    <footer className="border-t border-gold/30 bg-dark-maroon">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {isLoadingLogo ? (
                <div className="h-8 w-8 rounded-full bg-gold/20 animate-pulse" />
              ) : (
                <img 
                  src={logoUrl}
                  alt="Aurelie Logo" 
                  className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(218,165,32,0.5)]"
                />
              )}
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gold-shimmer">
                  {isLoading ? 'Aurelie' : contactInfo?.storeName || 'Aurelie'}
                </span>
                <span className="text-xs text-gold-shimmer -mt-1 font-medium">Gold & Diamonds Jewellery</span>
              </div>
            </div>
            <p className="text-sm text-gold-shimmer">
              {isLoading 
                ? 'Exquisite gold and diamond jewellery crafted with precision and passion.'
                : contactInfo?.description || 'Exquisite gold and diamond jewellery crafted with precision and passion.'
              }
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-gold-shimmer">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gold-shimmer">
              <li className="hover:text-gold transition-colors cursor-pointer">About Us</li>
              <li className="hover:text-gold transition-colors cursor-pointer">Contact</li>
              <li className="hover:text-gold transition-colors cursor-pointer">Shipping & Returns</li>
              <li className="hover:text-gold transition-colors cursor-pointer">Privacy Policy</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-gold-shimmer">Contact Us</h3>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted/20 rounded animate-pulse" />
                <div className="h-4 bg-muted/20 rounded animate-pulse" />
                <div className="h-4 bg-muted/20 rounded animate-pulse" />
              </div>
            ) : (
              <ul className="space-y-3 text-sm text-gold-shimmer">
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-gold" />
                  <a href={`mailto:${contactInfo?.email || 'aureliegolddiamondsjewellery@gmail.com'}`} className="hover:text-gold transition-colors">
                    {contactInfo?.email || 'aureliegolddiamondsjewellery@gmail.com'}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-gold" />
                  <a href={`tel:${contactInfo?.phone || '7353264007'}`} className="hover:text-gold transition-colors">
                    {contactInfo?.phone || '7353264007'}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gold" />
                  <span>{contactInfo?.storeAddress || 'Bengaluru, India'}</span>
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gold/30 text-center text-sm text-gold-shimmer">
          <p className="flex items-center justify-center gap-1">
            © 2025. Built with <Heart className="h-4 w-4 text-gold fill-gold" /> using{' '}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
