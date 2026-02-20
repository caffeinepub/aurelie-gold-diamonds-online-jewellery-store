import { useState } from 'react';
import { Package, ShoppingBag, TrendingUp, Users, Settings, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetAllProducts, useGetOrdersForPolling, useGetVisitCount, useGetDownloadCount, useGetContactInfo, useGetCurrentLogo } from '../hooks/useQueries';
import ProductManagement from '../components/admin/ProductManagement';
import OrderManagement from '../components/admin/OrderManagement';
import InventoryManagement from '../components/admin/InventoryManagement';
import CarouselManagement from '../components/admin/CarouselManagement';
import BusinessInfoModal from '../components/admin/BusinessInfoModal';
import AnalyticsSection from '../components/admin/AnalyticsSection';

interface AdminDashboardProps {
  onViewProduct: (productId: bigint) => void;
}

export default function AdminDashboard({ onViewProduct }: AdminDashboardProps) {
  const { data: products = [] } = useGetAllProducts();
  const { data: orders = [] } = useGetOrdersForPolling();
  const { data: visitCount = BigInt(0) } = useGetVisitCount();
  const { data: downloadCount = BigInt(0) } = useGetDownloadCount();
  const { data: contactInfo } = useGetContactInfo();
  const { data: currentLogo } = useGetCurrentLogo();
  const [showBusinessInfo, setShowBusinessInfo] = useState(false);

  const totalRevenue = orders.reduce((sum, orderWithDetails) => {
    return sum + Number(orderWithDetails.order.totalAmount);
  }, 0);

  const pendingOrders = orders.filter(o => o.order.status === 'pending').length;

  const logoUrl = currentLogo?.image?.getDirectURL() || null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gold">
          Admin <span className="text-gold-shimmer">Dashboard</span>
        </h1>
        <p className="text-gold">Manage your jewellery store</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gold/20 bg-gradient-to-br from-pink-100 to-dark-maroon">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gold">Total Products</CardTitle>
            <Package className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-shimmer">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-gradient-to-br from-dark-maroon to-pink-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gold">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-shimmer">{orders.length}</div>
            <p className="text-xs text-gold mt-1">{pendingOrders} pending</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-gradient-to-br from-pink-100 to-dark-maroon">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gold">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-shimmer">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/20 bg-gradient-to-br from-dark-maroon to-pink-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gold">Total Visits</CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-shimmer">{Number(visitCount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="bg-dark-maroon border border-gold/20">
          <TabsTrigger value="products" className="data-[state=active]:bg-gold data-[state=active]:text-dark-maroon text-gold">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-gold data-[state=active]:text-dark-maroon text-gold">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-gold data-[state=active]:text-dark-maroon text-gold">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="carousel" className="data-[state=active]:bg-gold data-[state=active]:text-dark-maroon text-gold">
            <Image className="h-4 w-4 mr-2" />
            Carousel
          </TabsTrigger>
          <TabsTrigger value="business" className="data-[state=active]:bg-gold data-[state=active]:text-dark-maroon text-gold">
            <Settings className="h-4 w-4 mr-2" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gold data-[state=active]:text-dark-maroon text-gold">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductManagement onViewProduct={onViewProduct} />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryManagement />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement onViewProduct={onViewProduct} />
        </TabsContent>

        <TabsContent value="carousel">
          <CarouselManagement />
        </TabsContent>

        <TabsContent value="business">
          <Card className="border-gold/20 bg-gradient-to-br from-pink-100 to-dark-maroon">
            <CardHeader>
              <CardTitle className="text-gold-shimmer">Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gold mb-4">
                Manage your store's contact information, logo, and business details.
              </p>
              <button
                onClick={() => setShowBusinessInfo(true)}
                className="px-4 py-2 bg-gold hover:bg-gold/90 text-dark-maroon rounded-md font-medium transition-colors"
              >
                Edit Business Info
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsSection />
        </TabsContent>
      </Tabs>

      {showBusinessInfo && contactInfo && (
        <BusinessInfoModal 
          contactInfo={contactInfo}
          logoUrl={logoUrl}
          onClose={() => setShowBusinessInfo(false)} 
        />
      )}
    </div>
  );
}
