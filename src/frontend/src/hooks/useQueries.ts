import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Product, Cart, Order, UserProfile, OrderStatus, ProductId, OrderId, CustomerId, InventoryUpdate, ProductCategory, Material, BusinessContactInfo, Logo, Visit, Download, OrderWithCustomerDetails } from '../backend';
import { ExternalBlob } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();

  return useQuery<boolean>({
    queryKey: ['isAdmin', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      
      // Check if user email matches the dedicated admin email
      if (userProfile?.email?.toLowerCase() === 'arjun.tapse@gmail.com') {
        return true;
      }
      
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Business Contact Info Queries
export function useGetContactInfo() {
  const { actor, isFetching } = useActor();

  return useQuery<BusinessContactInfo>({
    queryKey: ['contactInfo'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getContactInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateContactInfo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactInfo: BusinessContactInfo) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateContactInfo(contactInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactInfo'] });
    },
  });
}

// Logo Management Queries
export function useGetCurrentLogo() {
  const { actor, isFetching } = useActor();

  return useQuery<Logo | null>({
    queryKey: ['currentLogo'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCurrentLogo();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateCurrentLogo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCurrentLogo(image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentLogo'] });
      queryClient.refetchQueries({ queryKey: ['currentLogo'] });
    },
  });
}

// Product Queries
export function useGetAllProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProduct(productId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Product | null>({
    queryKey: ['product', productId?.toString()],
    queryFn: async () => {
      if (!actor || !productId) return null;
      return actor.getProduct(productId);
    },
    enabled: !!actor && !isFetching && productId !== null,
  });
}

export function useFilterProductsByCategory(category: ProductCategory) {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products', 'category', category],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterProductsByCategory(category);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchProducts(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products', 'search', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      return actor.getProductsBySearch(searchTerm);
    },
    enabled: !!actor && !isFetching && !!searchTerm,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      price: bigint;
      category: ProductCategory;
      material: Material;
      stock: bigint;
      images: ExternalBlob[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addProduct(
        params.name,
        params.description,
        params.price,
        params.category,
        params.material,
        params.stock,
        params.images
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: ProductId;
      name: string;
      description: string;
      price: bigint;
      category: ProductCategory;
      material: Material;
      stock: bigint;
      images: ExternalBlob[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProduct(
        params.productId,
        params.name,
        params.description,
        params.price,
        params.category,
        params.material,
        params.stock,
        params.images
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useUpdateInventory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: InventoryUpdate[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateInventory(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Cart Queries
export function useGetCart() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Cart>({
    queryKey: ['cart', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return { items: [] };
      return actor.getCart();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAddToCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { productId: ProductId; quantity: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addToCart(params.productId, params.quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveFromCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: ProductId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeFromCart(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Order Queries
export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.placeOrder();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ordersForPolling'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useGetCustomerOrders() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Order[]>({
    queryKey: ['orders', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getCustomerOrders(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 15000,
  });
}

// Real-time order polling for admin dashboard
export function useGetOrdersForPolling() {
  const { actor, isFetching } = useActor();

  return useQuery<OrderWithCustomerDetails[]>({
    queryKey: ['ordersForPolling'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const orders = await actor.getOrdersForPolling();
        return orders.filter(order => order.customer && order.customer.name);
      } catch (error) {
        console.error('Error fetching orders for polling:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useGetAllOrdersAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<OrderWithCustomerDetails[]>({
    queryKey: ['allOrdersWithCustomerDetails'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const orders = await actor.getAllOrdersWithCustomerDetails();
        return orders.filter(order => order.customer && order.customer.name);
      } catch (error) {
        console.error('Error fetching orders with customer details:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { orderId: OrderId; status: OrderStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateOrderStatus(params.orderId, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ordersForPolling'] });
      queryClient.invalidateQueries({ queryKey: ['allOrdersWithCustomerDetails'] });
      queryClient.refetchQueries({ queryKey: ['ordersForPolling'] });
    },
  });
}

export function useCancelOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: OrderId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.cancelOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ordersForPolling'] });
      queryClient.invalidateQueries({ queryKey: ['allOrdersWithCustomerDetails'] });
    },
  });
}

// Customer Profile
export function useRegisterCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      email: string;
      address: string;
      phone: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerCustomer(params.name, params.email, params.address, params.phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
    },
  });
}

// Analytics Queries
export function useRecordVisit() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      page: string;
      browser: string;
      device: string;
      location: string;
      sessionId: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordVisit(
        params.page,
        params.browser,
        params.device,
        params.location,
        params.sessionId
      );
    },
  });
}

export function useRecordDownload() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      browser: string;
      device: string;
      platform: string;
      version: string;
      location: string;
      sessionId: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordDownload(
        params.browser,
        params.device,
        params.platform,
        params.version,
        params.location,
        params.sessionId
      );
    },
  });
}

export function useGetAllVisits() {
  const { actor, isFetching } = useActor();

  return useQuery<Visit[]>({
    queryKey: ['analytics', 'visits'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVisits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllDownloads() {
  const { actor, isFetching } = useActor();

  return useQuery<Download[]>({
    queryKey: ['analytics', 'downloads'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDownloads();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVisitCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['analytics', 'visitCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getVisitCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDownloadCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['analytics', 'downloadCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getDownloadCount();
    },
    enabled: !!actor && !isFetching,
  });
}

// Carousel Management Queries
export interface CarouselItem {
  id: bigint;
  title: string;
  url: string;
  image: ExternalBlob;
  createdAt: bigint;
}

export function useGetCarouselItems() {
  const { actor, isFetching } = useActor();

  return useQuery<CarouselItem[]>({
    queryKey: ['carouselItems'],
    queryFn: async () => {
      if (!actor) return [];
      // Note: Backend doesn't have carousel methods yet, returning empty array
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCarouselItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      url: string;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have carousel methods yet
      throw new Error('Carousel management not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carouselItems'] });
    },
  });
}

export function useUpdateCarouselItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      title: string;
      url: string;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have carousel methods yet
      throw new Error('Carousel management not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carouselItems'] });
    },
  });
}

export function useDeleteCarouselItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have carousel methods yet
      throw new Error('Carousel management not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carouselItems'] });
    },
  });
}
