export type OutletOwnershipModelType = 
  | 'COCO' // Company Owned, Company Operated
  | 'FOCO' // Franchise Owned, Company Operated
  | 'FOFO' // Franchise Owned, Franchise Operated
  | 'dealer'
  | 'distributor'
  | 'licensed'
  | 'joint_venture'
  | 'marketplace_seller'
  | 'custom';

export type OutletStatus = 'active' | 'inactive' | 'suspended' | 'pending_approval';

export type StoreType =
  | 'grocery' // Grocery Store (Quick FMCG & staples)
  | 'pharma' // Pharma Store (Medicines & healthcare, prescription)
  | 'cafe_kitchen' // Cafe or Cloud Kitchen (Prepared food & beverages)
  | 'electronics_superstore' // Electronics or Super Store (Tech & appliances)
  | 'fruits_veg_dairy' // Fruits Vegetable Dairy Store (Farm fresh produce & milk)
  | 'service_provider'; // Service Provider Store (Technician & doorstep services)

export interface StoreDeliverySlot {
  id: string; // e.g. "slot_morning_1"
  title: string; // e.g. "Early Morning Fresh Farm Run (06:00 AM - 08:30 AM)"
  startTime: string; // e.g. "06:00 AM"
  endTime: string; // e.g. "08:30 AM"
  maxOrders: number; // Order capacity cap
  currentOrders: number; // Active bookings count
  cutoffMinutes: number; // Order cutoff window before slot start (e.g. 30 mins)
  slotFee: number; // Slot handling or express fee (₹0 default)
  isActive: boolean; // Slot active or inactive toggle
  daysOfWeek?: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  specialBadge?: string; // e.g. "Fresh Farm Morning", "Emergency Night", "Peak Lunch"
}

export interface StoreOrderAcceptanceConfig {
  orderAcceptanceEnabled: boolean; // Master toggle to accept or pause incoming orders
  deliveryTimePromise: string; // e.g. "30 - 45 Mins Express", "15 - 30 Mins Urgent"
  deliveryMode: 'instant_express' | 'slot_scheduled' | 'hybrid_both';
  averagePrepTimeMinutes: number; // Prep time in minutes (e.g. 20m for cafe, 10m for grocery)
  autoAcceptOrders: boolean; // Auto-confirm incoming orders
  maxConcurrentOrders: number; // Capacity ceiling for simultaneous in-flight orders
  slots: StoreDeliverySlot[];
  // Category-specific parameters
  prescriptionRequired?: boolean; // For pharma
  drugLicenseNumber?: string; // For pharma
  fssaiNumber?: string; // For grocery / cafe / fruits & dairy
  serviceWarrantyDays?: number; // For service provider (e.g. 30 days job guarantee)
  specialistDispatched?: boolean; // For service provider (certified technician)
}

export interface OutletCoordinates {
  lat: number;
  lng: number;
}

export interface OutletOperatingHours {
  open: string; // e.g. "09:30 AM"
  close: string; // e.g. "09:30 PM"
  daysOpen: string; // e.g. "Mon - Sun"
}

export interface OutletOwnershipRules {
  modelType: OutletOwnershipModelType;
  title: string;
  description: string;
  ownership: 'company' | 'franchise' | 'partner';
  operationsResponsibility: 'company' | 'franchise' | 'joint';
  inventoryOwnership: 'company' | 'franchise' | 'consignment';
  pricingAuthority: 'central_company' | 'outlet_manager' | 'hybrid';
  staffManagement: 'company' | 'franchise';
  platformFeePercent: number;
  franchiseRoyaltyPercent: number;
  revenueSharePercent: number;
  payoutSchedule: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  agreementDurationMonths: number;
  customTerms?: string;
}

export interface Outlet {
  id: string;
  code: string; // e.g. "OUT-LKO-001"
  name: string;
  logo?: string;
  storeType?: StoreType;
  deliveryTimePromise?: string;
  orderAcceptanceConfig?: StoreOrderAcceptanceConfig;
  fssaiNumber?: string;
  drugLicenseNumber?: string;
  businessCategoryId: string;
  ownershipModel: OutletOwnershipModelType;
  parentCompany: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  managerName: string;
  managerPhone: string;
  gstin: string;
  pan?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: OutletCoordinates;
  operatingHours: OutletOperatingHours;
  holidays: string[];
  serviceablePincodes: string[];
  deliveryRadiusKm: number;
  staffCount: number;
  commissionRate: number; // base percentage
  status: OutletStatus;
  createdAt: string;
  monthlyRevenue?: number;
  activeOrdersCount?: number;
}

export type CategoryApprovalStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'published';

export interface CategoryAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface BusinessCategory {
  id: string;
  slug: string;
  code: string;
  name: string;
  parentCategoryId?: string;
  iconName: string;
  description: string;
  customAttributes: CategoryAttribute[];
  requiresBatchNumber: boolean;
  requiresExpiryDate: boolean;
  requiresPrescription: boolean;
  requiresEanBarcode: boolean;
  defaultGstRate: number;
  returnWindowDays: number;
  defaultCommissionPercent: number;
  approvalStatus: CategoryApprovalStatus;
  proposedBy?: string;
  approvedBy?: string;
  approvalNote?: string;
  isActive: boolean;
  itemCount: number;
  orderCount?: number;
}

export type ParticipantType = 
  | 'rider'
  | 'vendor'
  | 'supplier'
  | 'outlet_owner'
  | 'franchise_partner'
  | 'category_creator';

export type PayoutStatus = 
  | 'draft'
  | 'calculated'
  | 'pending_verification'
  | 'approved'
  | 'scheduled'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'on_hold'
  | 'reversed';

export interface Participant {
  id: string;
  type: ParticipantType;
  name: string;
  phone: string;
  email: string;
  linkedOutletId?: string;
  outletName?: string;
  bankAccount: {
    accountHolder: string;
    accountNumber: string; // masked for display e.g. "••••4321"
    ifscCode: string;
    bankName: string;
    upiId?: string;
  };
  commissionPlan: {
    type: 'fixed_per_order' | 'percent_sales' | 'distance_km' | 'tiered' | 'monthly_fixed';
    rate: number; // e.g. 45 INR per delivery, or 8%
    perKmRate?: number;
    peakHourBonus?: number;
    minimumThreshold: number;
  };
  payoutFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  status: 'active' | 'suspended' | 'pending_verification';
  pendingBalance: number;
  paidTotal: number;
  lastPayoutDate?: string;
}

export interface PayoutItem {
  id: string;
  payoutId: string;
  participantId: string;
  participantName: string;
  participantType: ParticipantType;
  outletId?: string;
  outletName?: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  deductions: number; // COD collected, commission, platform fees, tax withholding
  incentives: number; // peak hour, distance, volume bonus
  netPayable: number;
  calculationBreakdown: {
    baseAmount: number;
    ordersCount: number;
    distanceBonus?: number;
    peakBonus?: number;
    vendorDiscounts?: number;
    marketplaceCommission?: number;
    royalties?: number;
    codReconciled?: number;
    notes: string;
  };
  status: PayoutStatus;
  paymentMethod: 'bank_neft' | 'bank_rtgs' | 'bank_imps' | 'upi' | 'manual_cheque';
  transactionReference?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface FinancialLedgerEntry {
  id: string;
  entryDate: string;
  referenceId: string; // Order ID, Payout ID, PO ID
  outletId?: string;
  outletName?: string;
  participantId?: string;
  participantName?: string;
  accountDebit: string; // e.g. "Delivery Expense", "Vendor Settlement Payable"
  accountCredit: string; // e.g. "Cash / Bank", "Platform Revenue"
  amount: number;
  description: string;
  category: 'rider_payout' | 'vendor_settlement' | 'franchise_royalty' | 'supplier_payment' | 'cod_collection' | 'order_commission';
  isReversed?: boolean;
  reversalReason?: string;
}

export type BarcodeType = 'EAN-13' | 'EAN-8' | 'UPC-A' | 'GTIN-14' | 'INTERNAL-SKU' | 'QR-LOOKUP';

export interface ProductBarcodeRecord {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcodeType: BarcodeType;
  barcodeValue: string;
  isOfficialGtin: boolean; // true if verified GS1 manufacturer barcode
  brand: string;
  category: string;
  outletAvailability: string[]; // outlet IDs
  unit: string;
  packSize: string;
  verified: boolean;
  lastScannedAt?: string;
}

export type StockTransferStatus = 'requested' | 'approved' | 'dispatched' | 'received' | 'rejected' | 'discrepancy';

export interface StockTransfer {
  id: string; // e.g. "TRF-2026-0042"
  sourceOutletId: string;
  sourceOutletName: string;
  destinationOutletId: string;
  destinationOutletName: string;
  productId: string;
  productName: string;
  sku: string;
  requestedQuantity: number;
  dispatchedQuantity?: number;
  receivedQuantity?: number;
  damagedQuantity?: number;
  status: StockTransferStatus;
  requestedBy: string;
  approvedBy?: string;
  driverOrCourierNote?: string;
  discrepancyNote?: string;
  requestedAt: string;
  dispatchedAt?: string;
  receivedAt?: string;
}

export interface FranchiseFinancialDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'current' | 'escrow' | 'savings';
  upiId?: string;
  panNumber: string;
  securityDepositAmount?: number;
  bankGuaranteeAmount?: number;
}

export interface FranchiseSettlementStructure {
  settlementCycle: 'daily_t1' | 'weekly_monday' | 'biweekly' | 'monthly_1st';
  settlementMode: 'imps_neft' | 'escrow_auto_split' | 'upi_transfer';
  payoutCutoffTime: string; // e.g. "23:59"
  minPayoutThreshold: number; // e.g. 1000
  rollingReservePercent: number; // e.g. 5%
  orderCommissionPercent: number; // e.g. 8%
  deliveryFeeSharePercent: number; // e.g. 70%
  marketingLevyPercent: number; // e.g. 2%
  tdsRatePercent: number; // e.g. 1%
  gstOnFeesPercent: number; // 18%
}

export interface FranchiseAgreement {
  id: string;
  outletId: string;
  outletCode?: string;
  outletName: string;
  outletType?: OutletOwnershipModelType;
  outletCategory?: StoreType;
  franchisePartnerName: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  gstin?: string;
  shopEstablishmentNumber?: string;
  pan?: string;
  fssaiNumber?: string;
  drugLicenseNumber?: string;
  stateName?: string;
  districtName?: string;
  zonalOrAreaName?: string;
  pincode?: string;
  serviceablePincodes?: string[];
  geofenceLatitude?: number;
  geofenceLongitude?: number;
  geofenceRadiusKm?: number;
  completeAddress?: string;
  financialDetails?: FranchiseFinancialDetails;
  paymentSettlement?: FranchiseSettlementStructure;
  modelType: OutletOwnershipModelType;
  startDate: string;
  endDate: string;
  renewalDate: string;
  revenueSharePercent: number;
  royaltyPercent: number;
  platformFeeMonthly: number;
  minimumMonthlyGuarantee: number;
  inventoryOwnership: 'company' | 'franchise';
  pricingAuthority: 'central' | 'franchise' | 'hybrid';
  complianceScore: number; // 0 - 100
  status: 'active' | 'renewal_due' | 'expired' | 'under_audit' | 'terminated';
  documentNumber: string;
}
