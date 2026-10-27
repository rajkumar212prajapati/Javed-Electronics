export * from './multiOutlet';
export * from './marketplacePayments';
export * from './homepageLayout';
export * from './festivalCampaign';
export * from './paymentGateways';
export * from './pos';
export * from './sopSla';
export * from './shiprocket';

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

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: Role;
  outletId?: string;
  outletName?: string;
  referralCode?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  createdBy?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

export interface DeliveryPincodeZone {
  id: string;
  pincode: string;
  areaName: string;
  city: string;
  state: string;
  outletId: string; // 'all' for Any Store / Global, or specific outlet ID
  outletName?: string;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  estimatedHours: number;
  cutoffTime?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
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
  coordinates?: { lat: number; lng: number };
  tag?: 'Home' | 'Work' | 'Other';
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

export interface ColorVariantOption {
  name: string;
  hex: string;
  image?: string;
  priceDiff?: number;
}

export interface SizeVariantOption {
  size: string; // e.g. "128GB", "256GB", "55 Inch", "65W GaN"
  priceDiff?: number;
  sku?: string;
  stock?: number;
}

export interface ModuleVariantOption {
  moduleName: string; // e.g. "WiFi 6E + BT 5.3 Module", "Base Edition", "Turbo Edition"
  moduleCode?: string;
  priceDiff?: number;
  description?: string;
}

export interface ProductDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  deadWeightKg: number;
  volumetricWeightKg: number;
  billableWeightKg: number;
  packageType?: 'flyer_pouch' | 'small_box' | 'medium_carton' | 'large_crate' | 'wooden_case';
  packageLengthCm?: number;
  packageWidthCm?: number;
  packageHeightCm?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  priceDiff: number;
  type?: 'color' | 'size' | 'module' | 'general';
  colorOptions?: ColorVariantOption[];
  sizeOptions?: SizeVariantOption[];
  moduleOptions?: ModuleVariantOption[];
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  modelNumber?: string;
  moduleName?: string;
  categoryId: ProductCategory;
  images: string[];
  description: string;
  specifications: Record<string, string>;
  boxContents?: string[];
  mrp: number;
  regularPrice: number;
  dealPrice?: number;
  dealEndsAt?: string;
  purchaseCost: number; // strictly internal
  gstRate: number; // e.g. 18, 12, 28
  hsnCode?: string; // HSN Code e.g. "8517", "8518", "8504"
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
  // Structured physical dimensions & volumetric weight
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  deadWeightKg?: number;
  volumetricWeightKg?: number;
  billableWeightKg?: number;
  packageDimensions?: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    packageType?: string;
  };
  colorVariants?: ColorVariantOption[];
  sizeVariants?: SizeVariantOption[];
  moduleVariants?: ModuleVariantOption[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFestiveDeal?: boolean;
  status: 'published' | 'draft';
  rating: number;
  reviewsCount: number;
  seoTitle?: string;
  seoDescription?: string;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  approvalFeedback?: string;
  submittedBy?: {
    userId: string;
    userName: string;
    role: string;
    storeName?: string;
    submittedAt: string;
  };
  sellerListings?: SellerListing[];
}

export interface SellerListing {
  id: string;
  sellerId: string;
  sellerName: string;
  outletId?: string;
  outletName?: string;
  sellingPrice: number;
  mrp: number;
  purchaseCost?: number;
  stock: number;
  isAvailable: boolean;
  deliveryPromiseHours: number;
  isFeaturedSeller?: boolean;
  lastUpdated: string;
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
  outletId?: string;
  outletName?: string;
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
  | 'partially_cancelled'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refund_pending'
  | 'refunded'
  | 'delivery_failed';

export type PaymentMethod =
  | 'cod'
  | 'upi_qr'
  | 'online_razorpay'
  | 'razorpay'
  | 'phonepe'
  | 'paytm'
  | 'cashfree'
  | 'stripe'
  | 'store_pickup_pay'
  | string;
export type PaymentStatus = 'pending' | 'verified_paid' | 'failed' | 'refunded';
export type DeliveryType = 'delivery' | 'store_pickup';

export type ItemCancellationReason =
  | 'short_stock'
  | 'damaged'
  | 'expired'
  | 'customer_request'
  | 'pricing_discrepancy'
  | 'other';

export type ItemCancellationDisposition =
  | 'scrap_damaged'
  | 'write_off_expired'
  | 'stock_discrepancy'
  | 'restocked';

export interface CancelItemRequest {
  productId: string;
  cancelQuantity: number;
  reason: ItemCancellationReason;
  disposition: ItemCancellationDisposition;
  note?: string;
}

export interface OrderCancellationDetails {
  type: 'full' | 'partial';
  cancelledAt: string;
  cancelledBy: string;
  primaryReason: ItemCancellationReason;
  generalNotes?: string;
  itemsCancelledCount: number;
  totalRefundAmount: number;
  refundStatus: 'none' | 'pending' | 'processed' | 'cod_adjusted';
  refundMethod?: string;
  refundReference?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  brand: string;
  image: string;
  variant?: string;
  quantity: number;
  cancelledQuantity?: number;
  activeQuantity?: number;
  cancellationReason?: ItemCancellationReason;
  cancellationNote?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  disposition?: ItemCancellationDisposition;
  mrp: number;
  unitPrice: number;
  purchaseCost: number;
  gstRate: number;
  hsnCode?: string;
  taxableValue?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  total: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy: string;
}

export interface OrderHsnSummaryItem {
  hsnCode: string;
  description: string;
  taxableValue: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

export interface HsnMasterRecord {
  hsnCode: string;
  description: string;
  category: ProductCategory | 'shipping' | 'general';
  gstRate: number; // 0, 5, 12, 18, 28
  cessRate?: number;
  isService?: boolean;
}

export interface Order {
  id: string; // e.g. JE-2026-000123
  invoiceNumber: string;
  createdAt: string;
  outletId?: string;
  outletName?: string;
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
    coordinates?: { lat: number; lng: number };
    tag?: 'Home' | 'Work' | 'Other';
    isB2B?: boolean;
    businessName?: string;
    gstin?: string;
    panNumber?: string;
    placeOfSupply?: string;
    stateCode?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  couponCode?: string;
  couponDiscount: number;
  bulkDiscountAmount?: number;
  appliedBulkRuleId?: string;
  appliedBulkRuleName?: string;
  deliveryFee: number;
  taxAmount: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  placeOfSupply?: string;
  isB2BOrder?: boolean;
  b2bGstin?: string;
  b2bBusinessName?: string;
  eWayBillNumber?: string;
  hsnSummary?: OrderHsnSummaryItem[];
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
  deliveryCoordinates?: { lat: number; lng: number };
  outletCoordinates?: { lat: number; lng: number };
  distanceKm?: number;
  estimatedDeliveryMinutes?: number;
  riderCurrentLocation?: { lat: number; lng: number };
  suggestedRoute?: {
    distanceText: string;
    durationText: string;
    steps?: string[];
    navigationUrl?: string;
  };
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
  originalSubtotal?: number;
  originalTotal?: number;
  refundedAmount?: number;
  refundStatus?: 'none' | 'pending' | 'processed' | 'cod_adjusted';
  cancellationDetails?: OrderCancellationDetails;
  dispatchDetails?: ExpressShipmentDetails;
}

export type DispatchFulfillmentType = 'rider' | 'express_partner';

export type ExpressCarrierName =
  | 'Shiprocket'
  | 'Delhivery'
  | 'Blue Dart'
  | 'Shadowfax'
  | 'DTDC'
  | 'Porter'
  | 'Other';

export interface ExpressShipmentDetails {
  fulfillmentType: DispatchFulfillmentType;
  carrier: ExpressCarrierName;
  awbNumber?: string;
  trackingUrl?: string;
  assignedAt?: string;
  dispatchedAt?: string;
  estimatedDeliveryDate?: string;
  serviceType?: 'surface_express' | 'air_express' | 'same_day_hyperlocal';
  shipmentWeightKg?: number;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderVehicleNo?: string;
  riderOtp?: string;
  isCod: boolean;
  codAmountToCollect: number;
  codCollectedStatus: 'pending' | 'collected' | 'remitted' | 'settled_to_admin';
  codCollectedAt?: string;
  codCollectedMethod?: 'cash' | 'doorstep_upi_qr';
  codCollectorName?: string;
  codReferenceNotes?: string;
  carrierSettlementId?: string;
  carrierSettlementUtr?: string;
  carrierSettledAt?: string;
  riderRemittanceId?: string;
  riderRemittedAt?: string;
}

export interface RiderRemittanceSubmission {
  id: string; // e.g. REMIT-2026-101
  riderId: string;
  riderName: string;
  riderPhone: string;
  amount: number;
  submissionMethod: 'cash_deposit' | 'upi_qr';
  status: 'pending_approval' | 'approved' | 'rejected';
  remittanceCode: string; // 8-digit cash deposit verification code
  notes?: string;
  qrPayload?: string;
  qrDataUrl?: string;
  orderIds: string[];
  outletId: string;
  outletName: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  approvalNotes?: string;
  receiptNumber?: string;
}

export interface CarrierCodSettlement {
  id: string; // e.g. SETTLE-SR-2026-001
  carrier: ExpressCarrierName;
  bankUtrNumber: string; // Bank UTR / NEFT Reference
  settlementDate: string;
  grossCodCollected: number;
  carrierDeductions: number; // Shipping freight & COD handling fee
  netAmountCredited: number;
  orderIds: string[];
  awbNumbers: string[];
  status: 'verified_settled';
  settledBy: string; // Admin who recorded & verified
  reconciliationNotes?: string;
  createdAt: string;
}

export interface DeliveryPartnerAccount {
  id: string;
  partnerName: ExpressCarrierName;
  status: 'connected' | 'disconnected' | 'testing';
  apiEmail?: string;
  apiKey?: string;
  channelId?: string;
  webhookUrl?: string;
  pickupLocation: string;
  isDefault: boolean;
  autoGenerateAwb: boolean;
  totalShipmentsDispatched: number;
  lastConnectedAt: string;
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

export type BulkDiscountTargetType = 'entire_order' | 'category' | 'product';
export type BulkDiscountCalculationType = 'percentage' | 'fixed_amount';

export interface BulkDiscountTier {
  minQuantity: number;
  maxQuantity?: number;
  discountPercentage?: number;
  fixedDiscountAmount?: number;
}

export interface BulkDiscountRule {
  id: string;
  name: string;
  description: string;
  targetType: BulkDiscountTargetType;
  targetCategoryId?: ProductCategory | 'all';
  targetProductId?: string;
  targetProductName?: string;
  minQuantity: number;
  minOrderValue?: number;
  discountType: BulkDiscountCalculationType;
  discountValue: number;
  maxDiscountAmount?: number;
  tiers?: BulkDiscountTier[];
  applicableToCustomerType: 'all' | 'b2b_only' | 'retail_only';
  applicableOutlets: 'all' | string[];
  stackWithCoupons: boolean;
  priority: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  timesApplied?: number;
  totalSavingsGranted?: number;
  createdAt: string;
  updatedAt: string;
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
  gstLegalBusinessName?: string;
  gstTradeName?: string;
  gstState?: string;
  gstStateCode?: string;
  gstPanNumber?: string;
  isCompositionScheme?: boolean;
  eWayBillThreshold?: number;
  shippingGstRate?: number;
  shippingSacCode?: string;
}
