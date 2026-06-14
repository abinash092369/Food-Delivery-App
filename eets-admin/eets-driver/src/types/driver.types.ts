export type VehicleType = 'BIKE' | 'SCOOTER' | 'BICYCLE' | 'CAR';

export type AssignmentStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  profileImageUrl: string | null;
  role: 'CUSTOMER' | 'DRIVER' | 'VENDOR' | 'ADMIN';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface DriverProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  profileImageUrl: string | null;
  vehicleType: VehicleType;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleRegNumber: string;
  bankAccountNumber: string;
  bankIfsc: string;
  upiId: string | null;
  isVerified: boolean;
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
  totalDeliveries: number;
  avgRating: number;
}

export interface DeliveryAssignment {
  id: number;
  orderId: number;
  orderNumber: string | null;
  status: AssignmentStatus;
  assignedAt: string | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  pickupOtp: string;
  deliveryOtp: string;
  distanceKm: number;
  earnings: number;
  earningsAmount?: number;
  routePolyline: string | null;
  estimatedDurationMin: number;
  routeDistanceKm: number;
  routeGeneratedAt: string | null;
}

export interface DaySeries {
  date: string;
  deliveries: number;
  earnings: number;
}

export interface IncentiveProgress {
  target: number;
  current: number;
  bonusAmount: number;
}

export interface DriverEarnings {
  deliveriesToday: number;
  earningsToday: number;
  deliveriesThisWeek: number;
  earningsThisWeek: number;
  dailySeries: DaySeries[];
  incentiveProgress: IncentiveProgress;
}

export interface DriverReview {
  id: number;
  orderId: number;
  driverId: number;
  driverName: string;
  customerId: number;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  isNewUser?: boolean;
}
