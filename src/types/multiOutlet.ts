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

export interface FranchiseAgreement {
  id: string;
  outletId: string;
  outletName: string;
  franchisePartnerName: string;
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
