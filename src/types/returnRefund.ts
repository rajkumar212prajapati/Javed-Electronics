import { ProductCategory } from './index';

export type ReturnPolicyType =
  | 'refund_and_replacement'
  | 'replacement_only'
  | 'exchange_only'
  | 'non_returnable'
  | 'inspection_required_return';

export type ReturnResolutionType =
  | 'refund_original_mode'
  | 'refund_wallet_credit'
  | 'replacement_same_item'
  | 'exchange_size_color';

export type ReturnRequestStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'pickup_scheduled'
  | 'out_for_pickup'
  | 'item_picked_up'
  | 'inspected_passed'
  | 'inspected_failed'
  | 'refund_processed'
  | 'replacement_dispatched'
  | 'completed';

export interface CategoryReturnPolicy {
  categoryId: ProductCategory;
  categoryName: string;
  policyType: ReturnPolicyType;
  windowDays: number;
  windowHours?: number;
  allowRefund: boolean;
  allowReplacement: boolean;
  allowExchange: boolean;
  requiresOriginalPackaging: boolean;
  requiresTagsIntact: boolean;
  requiresUnusedUnworn: boolean;
  requiresTechnicianInspection: boolean;
  requiresPhotoProof: boolean;
  pickupFee: number;
  walletBonusPercentage: number; // e.g. 5%
  termsAndConditions: string[];
  exemptionsNote?: string;
  isActive: boolean;
}

export type ReturnReasonCode =
  | 'defective_not_working'
  | 'damaged_in_transit'
  | 'size_fit_issue'
  | 'wrong_item_received'
  | 'quality_not_as_expected'
  | 'missing_accessories'
  | 'changed_mind'
  | 'other';

export interface ReturnExchangeRequest {
  id: string; // e.g. RET-2026-001
  orderId: string;
  invoiceNumber: string;
  outletId?: string;
  outletName?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  categoryId: ProductCategory;
  categoryName: string;
  quantity: number;
  itemUnitPrice: number;
  itemTotal: number;
  
  requestType: 'refund' | 'replacement' | 'exchange';
  reason: ReturnReasonCode;
  reasonDescription: string;
  conditionChecklistConfirmed: boolean;
  customerConditionNotes?: string;
  serialNumber?: string;
  unboxingVideoUrl?: string;
  unboxingVideoName?: string;
  evidenceImages?: string[];
  
  // Exchange specifics
  exchangeOptions?: {
    requestedSize?: string;
    requestedColor?: string;
    notes?: string;
  };
  
  // Refund specifics
  refundMethod: 'original_payment' | 'wallet_credits' | 'bank_transfer_upi';
  refundAmount: number;
  walletBonusAmount?: number;
  bankUpiDetails?: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  
  // Return window validation
  deliveredAt: string;
  requestedAt: string;
  windowClosingAt: string;
  isWithinWindow: boolean;
  daysRemaining?: number;
  
  // Admin workflow
  status: ReturnRequestStatus;
  statusHistory: Array<{
    status: ReturnRequestStatus;
    timestamp: string;
    note?: string;
    updatedBy: string;
  }>;
  assignedPickupRiderId?: string;
  assignedPickupRiderName?: string;
  pickupSlot?: string;
  pickupAddress: string;
  adminNotes?: string;
  rejectionReason?: string;
  replacementOrderId?: string;
  refundTransactionId?: string;
  processedAt?: string;
  processedBy?: string;
}
