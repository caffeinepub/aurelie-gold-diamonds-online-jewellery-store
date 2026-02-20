import { ShoppingCart, Menu, X, User, LogOut, Package, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCart, useGetCallerUserProfile, useGetCurrentLogo } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import type { Page } from '../types/navigation';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isAdmin: boolean;
  isCheckingAdmin?: boolean;
}

export default function Header({ currentPage, onNavigate, isAdmin, isCheckingAdmin }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: cart } = useGetCart();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: currentLogo, isLoading: isLoadingLogo } = useGetCurrentLogo();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const cartItemCount = cart?.items.length || 0;

  // Use dynamic logo from backend or fallback to new default logo
  const logoUrl = currentLogo?.image?.getDirectURL() || '/assets/1769006738240.jpg';

  // Update favicon when logo changes
  useEffect(() => {
    if (logoUrl) {
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = logoUrl;
      }
    }
  }, [logoUrl]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      onNavigate('home');
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
    setMobileMenuOpen(false);
  };

  const handleNavigation = (page: Page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold/30 bg-dark-maroon backdrop-blur supports-[backdrop-filter]:bg-dark-maroon/95 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => handleNavigation('home')}
            className="flex items-center space-x-3 hover:opacity-90 transition-all group"
          >
            <div className="relative">
              {isLoadingLogo ? (
                <div className="h-10 w-10 rounded-full bg-gold/20 animate-pulse" />
              ) : (
                <img 
                  src={logoUrl}
                  alt="Aurelie Logo" 
                  className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(218,165,32,0.5)]"
                />
              )}
              <div className="absolute inset-0 bg-gold/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gold-shimmer">Aurelie</span>
              <span className="text-xs text-gold-shimmer -mt-1 font-medium">Gold & Diamonds Jewellery</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => handleNavigation('home')}
              className={`text-sm font-medium transition-colors hover:text-gold-shimmer ${
                currentPage === 'home' ? 'text-gold' : 'text-gold'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavigation('products')}
              className={`text-sm font-medium transition-colors hover:text-gold-shimmer ${
                currentPage === 'products' || currentPage === 'product-detail' ? 'text-gold' : 'text-gold'
              }`}
            >
              Products
            </button>
            {isAuthenticated && (
              <button
                onClick={() => handleNavigation('orders')}
                className={`text-sm font-medium transition-colors hover:text-gold-shimmer ${
                  currentPage === 'orders' ? 'text-gold' : 'text-gold'
                }`}
              >
                My Orders
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => handleNavigation('admin')}
                className={`text-sm font-medium transition-colors hover:text-gold-shimmer flex items-center gap-2 ${
                  currentPage === 'admin' ? 'text-gold' : 'text-gold'
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin
                <Badge variant="secondary" className="text-xs bg-gold/20 text-gold border-gold/40">Admin</Badge>
              </button>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && userProfile && (
              <div className="flex items-center gap-2 text-sm text-gold">
                <User className="h-4 w-4" />
                <span>{userProfile.name}</span>
                {isAdmin && !isCheckingAdmin && (
                  <Badge variant="outline" className="text-xs border-gold/40 text-gold">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            )}
            <Button
              variant={isAuthenticated ? 'outline' : 'default'}
              size="sm"
              onClick={handleAuth}
              disabled={loginStatus === 'logging-in'}
              className={isAuthenticated ? 'border-gold/40 text-gold hover:bg-gold/10 hover:text-gold-shimmer' : 'bg-gold hover:bg-gold/90 text-dark-maroon shadow-gold-glow'}
            >
              {loginStatus === 'logging-in' ? (
                'Logging in...'
              ) : isAuthenticated ? (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              ) : (
                'Login'
              )}
            </Button>
            {isAuthenticated && (
              <button
                onClick={() => handleNavigation('cart')}
                className="relative p-2 hover:bg-gold/10 rounded-md transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-gold" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-dark-maroon text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-gold-glow">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => handleNavigation('cart')}
                className="relative p-2 hover:bg-gold/10 rounded-md transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-gold" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-dark-maroon text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-gold-glow">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gold/10 rounded-md transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-gold" /> : <Menu className="h-6 w-6 text-gold" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gold/30">
            <nav className="flex flex-col space-y-3">
              {isAuthenticated && userProfile && (
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-gold">
                  <User className="h-4 w-4" />
                  <span>{userProfile.name}</span>
                  {isAdmin && !isCheckingAdmin && (
                    <Badge variant="outline" className="text-xs ml-auto border-gold/40 text-gold">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              )}
              <button
                onClick={() => handleNavigation('home')}
                className={`text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-gold/10 rounded-md ${
                  currentPage === 'home' ? 'text-gold bg-gold/10' : 'text-gold'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => handleNavigation('products')}
                className={`text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-gold/10 rounded-md ${
                  currentPage === 'products' || currentPage === 'product-detail' ? 'text-gold bg-gold/10' : 'text-gold'
                }`}
              >
                Products
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => handleNavigation('orders')}
                  className={`text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-gold/10 rounded-md flex items-center gap-2 ${
                    currentPage === 'orders' ? 'text-gold bg-gold/10' : 'text-gold'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  My Orders
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleNavigation('admin')}
                  className={`text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-gold/10 rounded-md flex items-center gap-2 ${
                    currentPage === 'admin' ? 'text-gold bg-gold/10' : 'text-gold'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                  <Badge variant="secondary" className="text-xs ml-auto bg-gold/20 text-gold border-gold/40">Admin</Badge>
                </button>
              )}
              <div className="px-4 pt-2">
                <Button
                  variant={isAuthenticated ? 'outline' : 'default'}
                  className={`w-full ${isAuthenticated ? 'border-gold/40 text-gold hover:bg-gold/10 hover:text-gold-shimmer' : 'bg-gold hover:bg-gold/90 text-dark-maroon shadow-gold-glow'}`}
                  onClick={handleAuth}
                  disabled={loginStatus === 'logging-in'}
                >
                  {loginStatus === 'logging-in' ? (
                    'Logging in...'
                  ) : isAuthenticated ? (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

