export type Role = 'CUSTOMER' | 'VENDOR' | 'DRIVER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminUserResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminDashboardMetrics {
  revenueToday: number;
  ordersToday: number;
  newUsersToday: number;
  activeOrders: number;
  activeRestaurants: number;
  activeDrivers: number;
}

export interface DailyRevenue {
  date: string;
  gross: number;
  net: number;
  refunds: number;
}

export interface TopRestaurant {
  name: string;
  revenue: number;
}

export interface RevenueAnalyticsResponse {
  totalRevenue: number;
  netRevenue: number;
  totalRefunds: number;
  dailySeries: DailyRevenue[];
  topRestaurants: TopRestaurant[];
  avgOrderValue: number;
}

export interface DailyOrders {
  date: string;
  count: number;
  cancelled: number;
}

export interface PeakHour {
  hour: number;
  count: number;
}

export interface OrderAnalyticsResponse {
  totalOrders: number;
  byStatus: Record<string, number>;
  dailySeries: DailyOrders[];
  peakHours: PeakHour[];
  avgDeliveryTime: number;
}

export interface DailyUsers {
  date: string;
  count: number;
}

export interface UserAnalyticsResponse {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  dailyNewUsers: DailyUsers[];
  retentionRate: number;
}

export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  orderCount: number;
}

export interface RestaurantDetailResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  cuisineTypes: string[];
  coverImageUrl?: string;
  logoUrl?: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  isOpen: boolean;
  isActive: boolean;
  isApproved: boolean;
  avgRating: number;
  totalRatings: number;
  minOrderAmount: number;
  deliveryTimeMin: number;
  deliveryFee: number;
  openingTime: string;
  closingTime: string;
  daysOpen: number[];
  ownerId?: number;
  rejectionReason?: string;
}

export interface OrderItemResponse {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedOptions?: string;
}

export interface OrderStatusHistoryResponse {
  status: string;
  changedAt: string;
  notes?: string;
}

export interface DriverInfo {
  id: number;
  name: string;
  phone: string;
  vehicleType: string;
  avgRating: number;
}

export interface AddressResponse {
  id?: number;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  label?: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  specialInstructions?: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  createdAt: string;
  restaurantId: number;
  restaurantName: string;
  deliveryAddress?: AddressResponse;
  items: OrderItemResponse[];
  statusHistory: OrderStatusHistoryResponse[];
  driver?: DriverInfo;
  adminNotes?: string;
}

export interface DriverProfileResponse {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  profileImageUrl?: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleRegNumber: string;
  bankAccountNumber: string;
  bankIfsc: string;
  upiId: string;
  isVerified: boolean;
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  totalDeliveries: number;
  avgRating: number;
}

export interface FraudFlagResponse {
  id: number;
  userId: number;
  orderId?: number;
  flagType: string;
  riskScore: number;
  details: string;
  status: 'OPEN' | 'INVESTIGATED' | 'DISMISSED';
  flaggedAt: string;
}

export interface FraudAuditLog {
  id: number;
  action: string;
  performedBy: string;
  targetType: string;
  targetId: number;
  details: string;
  createdAt: string;
}

export interface CouponResponse {
  id: number;
  code: string;
  type: 'PERCENTAGE' | 'FLAT' | 'FREE_DELIVERY' | 'BOGO';
  value: number;
  maxDiscount?: number;
  minOrderAmount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableRestaurantId?: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface MenuCategoryResponse {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isAvailable: boolean;
}

export interface MenuItemResponse {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  avgRating: number;
}

export interface CategoryWithItems {
  category: MenuCategoryResponse;
  items: MenuItemResponse[];
}

export interface MenuResponse {
  categories: CategoryWithItems[];
}

