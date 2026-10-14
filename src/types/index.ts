export * from './multiOutlet';
export * from './marketplacePayments';

export type Role = 
  | 'customer'
  | 'store_manager'
  | 'super_admin'
  | 'delivery_staff'
  | 'outlet_owner'
  | 'franchise_manager'
  | 'vendor'
  | 'supplier'
  | 'finance_manager'
  | 'category_manager'
  | 'inventory_manager';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
  storeId?: string;
  referralCode: string;
  savedAddresses: Address[];
  rewardBalance: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export type ProductCategory = 
  | 'smartphones'
  | 'audio'
  | 'chargers_cables'
  | 'smartwatches'
  | 'tvs_accessories'
  | 'computer_accessories'
  | 'home_electronics'
  | 'small_appliances';

export interface CategoryItem {
  id: ProductCategory;
  name: string;
  iconName: string;
  description: string;
  itemCount?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  priceDiff: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  categoryId: ProductCategory;
  images: string[];
  description: string;
  specifications: Record<string, string>;
  mrp: number;
  regularPrice: number;
  dealPrice?: number;
  dealEndsAt?: string;
  purchaseCost: number; // strictly internal
  gstRate: number; // e.g. 18, 12, 28
  isTaxInclusive: boolean;
  stock: {
    onHand: number;
    reserved: number;
    minStockLevel: number;
  };
  warrantyMonths: number;
  returnEligibleDays: number;
  variants?: ProductVariant[];
  weightKg: number;
  dimensions: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFestiveDeal?: boolean;
  status: 'published' | 'draft';
  rating: number;
  reviewsCount: number;
}

export type StockMovementType = 
  | 'received'
  | 'sold'
  | 'reserved'
  | 'reservation_released'
  | 'returned'
  | 'damaged'
  | 'adjustment';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  note?: string;
  timestamp: string;
  staffName: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedVariant?: string;
  product: Product;
}

export type OrderStatus =
  | 'pending'
  | 'awaiting_whatsapp_confirmation'
  | 'confirmed'
  | 'payment_pending'
  | 'paid'
  | 'processing'
  | 'packed'
  | 'ready_for_pickup'
  | 'assigned_to_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancellation_requested'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refund_pending'
  | 'refunded'
  | 'delivery_failed';

export type PaymentMethod = 'cod' | 'upi_qr' | 'online_razorpay' | 'store_pickup_pay';
export type PaymentStatus = 'pending' | 'verified_paid' | 'failed' | 'refunded';
export type DeliveryType = 'delivery' | 'store_pickup';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  brand: string;
  image: string;
  variant?: string;
  quantity: number;
  mrp: number;
  unitPrice: number;
  purchaseCost: number;
  gstRate: number;
  total: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy: string;
}

export interface Order {
  id: string; // e.g. JE-2026-000123
  invoiceNumber: string;
  createdAt: string;
  customer: {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    instructions?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  couponCode?: string;
  couponDiscount: number;
  deliveryFee: number;
  taxAmount: number;
  finalTotal: number;
  deliveryType: DeliveryType;
  deliverySlot?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    transactionId?: string;
    paidAt?: string;
    verifiedBy?: string;
  };
  orderStatus: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  assignedDeliveryStaffId?: string;
  deliveryStaffName?: string;
  deliveryProof?: {
    note?: string;
    collectedAmount?: number;
    receiverName?: string;
    timestamp?: string;
  };
  failureReason?: string;
  cancellationReason?: string;
  returnReason?: string;
  qrCodeDataUrl?: string;
  whatsappMessageSent?: boolean;
}

export interface FestiveCampaign {
  id: string;
  name: string;
  slug: string;
  badge: string;
  theme: 'diwali' | 'eid' | 'holi' | 'independence' | 'new_year' | 'anniversary' | 'custom';
  bannerHeadline: string;
  bannerSubtext: string;
  startDate: string;
  endDate: string;
  couponCode?: string;
  discountPercentage?: number;
  minCartValue?: number;
  isActive: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'free_delivery';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  validUntil: string;
  usageLimit: number;
  timesUsed: number;
  description: string;
  isActive: boolean;
}

export interface ReferralReward {
  id: string;
  referrerPhone: string;
  referredName: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'awarded';
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  invoicePrefix: string;
  serviceablePincodes: string[];
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  codEnabled: boolean;
  upiId: string;
  upiName: string;
  sameDayCutoffTime: string;
  returnWindowDays: number;
  warrantySupportPhone: string;
}
