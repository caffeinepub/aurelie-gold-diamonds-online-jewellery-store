import { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from './hooks/useQueries';
import { useVisitTracking, usePWAInstallTracking } from './hooks/useAnalytics';
import Header from './components/Header';
import RunningBanner from './components/RunningBanner';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfileSetupModal from './components/ProfileSetupModal';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import type { Page } from './types/navigation';

function App() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProductId, setSelectedProductId] = useState<bigint | null>(null);
  
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsCallerAdmin();

  // Track visits and PWA installs
  useVisitTracking(currentPage);
  usePWAInstallTracking();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const navigateToProduct = (productId: bigint) => {
    setSelectedProductId(productId);
    setCurrentPage('product-detail');
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'product-detail') {
      setSelectedProductId(null);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen flex flex-col bg-background">
        <Header 
          currentPage={currentPage} 
          onNavigate={navigateTo}
          isAdmin={isAdmin || false}
          isCheckingAdmin={isCheckingAdmin}
        />
        <RunningBanner />
        
        <main className="flex-1">
          {currentPage === 'home' && (
            <HomePage onNavigate={navigateTo} onViewProduct={navigateToProduct} />
          )}
          {currentPage === 'products' && (
            <ProductsPage onViewProduct={navigateToProduct} />
          )}
          {currentPage === 'product-detail' && selectedProductId && (
            <ProductDetailPage 
              productId={selectedProductId} 
              onBack={() => navigateTo('products')}
              onNavigateToCart={() => navigateTo('cart')}
            />
          )}
          {currentPage === 'cart' && (
            <CartPage 
              onNavigate={navigateTo}
              onViewProduct={navigateToProduct}
            />
          )}
          {currentPage === 'checkout' && (
            <CheckoutPage onNavigate={navigateTo} />
          )}
          {currentPage === 'orders' && (
            <OrdersPage onViewProduct={navigateToProduct} />
          )}
          {currentPage === 'admin' && (
            <AdminDashboard onViewProduct={navigateToProduct} />
          )}
        </main>

        <Footer />
        
        {showProfileSetup && <ProfileSetupModal />}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;
