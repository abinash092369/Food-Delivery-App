export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  restaurantName?: string;
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
  fssaiLicense?: string;
  gstNumber?: string;
}

export interface MenuCategoryResponse {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isAvailable: boolean;
}

export interface CustomizationOptionResponse {
  id: number;
  name: string;
  extraPrice: number;
}

export interface CustomizationGroupResponse {
  id: number;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  isRequired: boolean;
  options: CustomizationOptionResponse[];
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
  customizationGroups?: CustomizationGroupResponse[];
}


export interface CategoryWithItems {
  category: MenuCategoryResponse;
  items: MenuItemResponse[];
}

export interface MenuResponse {
  categories: CategoryWithItems[];
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

export interface DaySeries {
  date: string;
  gross: number;
  net: number;
  orders: number;
}

export interface TopDish {
  name: string;
  orders: number;
  revenue: number;
}

export interface VendorEarningsResponse {
  totalEarnings: number;
  commissionRate: number;
  commissionAmount: number;
  netEarnings: number;
  totalOrders: number;
  dailySeries: DaySeries[];
  topDishes: TopDish[];
}

export interface ReviewResponse {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  reviewText: string;
  images: string[];
  createdAt: string;
  replyText?: string;
}

export interface PromotionResponse {
  id: number;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrder: number;
  applicableTo: 'ALL' | 'CATEGORY' | 'ITEM';
  applicableId?: number;
  bannerUrl?: string;
  usageLimit?: number;
  currentUsage: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
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

export interface GoogleVendorAuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  restaurant: RestaurantDetailResponse;
}

