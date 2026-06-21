export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'DRIVER';
}


export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  logo_url?: string;
  coverImageUrl?: string;
  cover_image_url?: string;
  bannerUrl?: string;
  banner_url?: string;
  imageUrl?: string;
  image_url?: string;
  thumbnailUrl?: string;
  cuisineTypes: string[];
  avgRating: number;
  totalRatings: number;
  totalReviews?: number;
  isOpen: boolean;
  is_open?: boolean;
  deliveryFee: number;
  deliveryFeeBase?: number;
  deliveryTimeMin: number;
  estimatedDeliveryMinutes?: number;
  city?: string;
  minOrderAmount?: number;
  distance?: number;
  isApproved?: boolean;
  is_approved?: boolean;
  isActive?: boolean;
  is_active?: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  image?: string;
  isAvailable: boolean;
  is_available?: boolean;
  available?: boolean;
  inStock?: boolean;
  in_stock?: boolean;
  isFeatured: boolean;
  isVeg: boolean;
  is_veg?: boolean;
  categoryId?: number;
}

export interface MenuResponse {
  categories: {
    category: {
      id: number;
      name: string;
      description?: string;
      imageUrl?: string;
    };
    items: MenuItem[];
  }[];
}

export interface CartItem {
  id: number;
  menuItemId: number;
  name: string;
  price?: number;
  itemPrice: number;
  quantity: number;
  imageUrl: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount?: number;
  total: number;
  couponCode?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PACKED'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  price?: number;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
}


export interface DriverInfo {
  name: string;
  phone: string;
  vehicleNumber?: string;
  vehicleType?: string;
  avgRating?: number;
}

export interface DriverTrackingUpdate {
  lat: number;
  lng: number;
  eta?: string;
}

export interface Address {
  id: number;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  restaurantName: string;
  deliveryAddress: Address;
  items: OrderItem[];
  driver?: DriverInfo;
  estimatedDeliveryAt: string;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  description: string;
  expiryDate: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  orderUpdatesEmail: boolean;
  orderUpdatesSms: boolean;
  promotionsEmail: boolean;
  promotionsPush: boolean;
}
