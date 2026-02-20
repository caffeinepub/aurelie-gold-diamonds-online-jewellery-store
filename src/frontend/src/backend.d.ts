import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UserProfile {
    name: string;
    email: string;
    address: string;
    phone: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface OrderItem {
    productId: ProductId;
    quantity: bigint;
    price: bigint;
}
export interface BusinessContactInfo {
    bankAccount: string;
    ifscCode: string;
    storeAddress: string;
    gstNumber: string;
    description: string;
    email: string;
    storeName: string;
    phone: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Cart {
    items: Array<CartItem>;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Visit {
    id: VisitId;
    page: string;
    device: string;
    timestamp: bigint;
    browser: string;
    sessionId: string;
    location: string;
}
export type VisitId = bigint;
export interface OrderWithCustomerDetails {
    customer: CustomerProfile;
    order: Order;
    lastStatusUpdate: bigint;
    isNew: boolean;
}
export type Principal = Principal;
export interface CustomerProfile {
    id: Principal;
    name: string;
    email: string;
    address: string;
    phone: string;
}
export interface Order {
    id: OrderId;
    status: OrderStatus;
    createdAt: bigint;
    totalAmount: bigint;
    customerId: CustomerId;
    items: Array<OrderItem>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Logo {
    id: bigint;
    uploadTimestamp: bigint;
    version: bigint;
    image: ExternalBlob;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export type CustomerId = Principal;
export interface Download {
    id: DownloadId;
    platform: string;
    device: string;
    version: string;
    timestamp: bigint;
    browser: string;
    sessionId: string;
    location: string;
}
export interface InventoryUpdate {
    productId: ProductId;
    stock: bigint;
}
export type DownloadId = bigint;
export type ProductId = bigint;
export interface CartItem {
    productId: bigint;
    quantity: bigint;
}
export interface Product {
    id: bigint;
    name: string;
    description: string;
    stock: bigint;
    category: ProductCategory;
    price: bigint;
    material: Material;
    images: Array<ExternalBlob>;
}
export type OrderId = bigint;
export enum Material {
    _18K_gold = "_18K_gold",
    _9K_gold = "_9K_gold",
    _22K_gold = "_22K_gold"
}
export enum OrderStatus {
    shipped = "shipped",
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    delivered = "delivered"
}
export enum ProductCategory {
    ring = "ring",
    diamond = "diamond",
    bracelet = "bracelet",
    headpiece = "headpiece"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(name: string, description: string, price: bigint, category: ProductCategory, material: Material, stock: bigint, images: Array<ExternalBlob>): Promise<ProductId>;
    addToCart(productId: ProductId, quantity: bigint): Promise<void>;
    assignAdminWithEmail(user: Principal, _email: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelOrder(orderId: OrderId): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteProduct(productId: ProductId): Promise<void>;
    filterProductsByCategory(category: ProductCategory): Promise<Array<Product>>;
    filterProductsByMaterial(material: Material): Promise<Array<Product>>;
    filterProductsByPriceRange(min: bigint, max: bigint): Promise<Array<Product>>;
    getAllDownloads(): Promise<Array<Download>>;
    getAllOrdersWithCustomerDetails(): Promise<Array<OrderWithCustomerDetails>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllVisits(): Promise<Array<Visit>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Cart>;
    getContactInfo(): Promise<BusinessContactInfo>;
    getCurrentLogo(): Promise<Logo | null>;
    getCurrentSystemTime(): Promise<bigint>;
    getCustomerOrders(customerId: CustomerId): Promise<Array<Order>>;
    getCustomerProfile(customerId: CustomerId): Promise<CustomerProfile>;
    getDownloadCount(): Promise<bigint>;
    getFilteredDownloads(platform: string): Promise<Array<Download>>;
    getFilteredVisits(page: string): Promise<Array<Visit>>;
    getNewAndUpdatedOrders(sinceTimestamp: bigint): Promise<Array<OrderWithCustomerDetails>>;
    getNewAndUpdatedOrdersWithCustomerDetails(lastFetchTimestamp: bigint): Promise<Array<OrderWithCustomerDetails>>;
    getOrder(orderId: OrderId): Promise<Order>;
    getOrderWithCustomerDetails(orderId: OrderId): Promise<OrderWithCustomerDetails>;
    getOrdersForPolling(): Promise<Array<OrderWithCustomerDetails>>;
    getPendingOrdersWithCustomerDetails(): Promise<Array<OrderWithCustomerDetails>>;
    getProduct(productId: ProductId): Promise<Product>;
    getProductsBySearch(searchTerm: string): Promise<Array<Product>>;
    getRecentOrdersForPolling(timestamp: bigint): Promise<Array<OrderWithCustomerDetails>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVisitCount(): Promise<bigint>;
    isAdminEmailLookup(principal: Principal): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    placeOrder(): Promise<OrderId>;
    recordDownload(browser: string, device: string, platform: string, version: string, location: string, sessionId: string): Promise<void>;
    recordVisit(page: string, browser: string, device: string, location: string, sessionId: string): Promise<void>;
    registerCustomer(name: string, email: string, address: string, phone: string): Promise<void>;
    removeFromCart(productId: ProductId): Promise<void>;
    revertToPreviousLogo(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateContactInfo(newContactInfo: BusinessContactInfo): Promise<void>;
    updateCurrentLogo(image: ExternalBlob): Promise<void>;
    updateCustomerProfile(name: string, email: string, address: string, phone: string): Promise<void>;
    updateInventory(updates: Array<InventoryUpdate>): Promise<void>;
    updateOrderStatus(orderId: OrderId, status: OrderStatus): Promise<void>;
    updateProduct(productId: ProductId, name: string, description: string, price: bigint, category: ProductCategory, material: Material, stock: bigint, images: Array<ExternalBlob>): Promise<void>;
}
