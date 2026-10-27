import { Product } from './index';

export interface POSCartItem {
  id: string; // unique line ID e.g. 'pos-item-1'
  productId: string;
  product: Product;
  quantity: number;
  selectedVariant?: string;
  unitPrice: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number; // e.g. 10% or ₹500
  serialNumberOrImei?: string; // Serial / IMEI for warranty tracking
  warrantyMonths: number;
  hsnCode: string;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  taxableValue: number;
  total: number;
}

export interface POSCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  rewardPoints: number;
  isB2B: boolean;
  businessName?: string;
  gstin?: string;
}

export interface POSHeldTicket {
  id: string;
  ticketNumber: string;
  customer: POSCustomer;
  note: string;
  items: POSCartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  finalTotal: number;
  heldAt: string;
  cashierName: string;
  registerId: string;
}

export type POSTenderMode = 'cash' | 'upi_qr' | 'card_pos' | 'split' | 'store_credit';

export interface POSTenderPayment {
  mode: POSTenderMode;
  cashTendered?: number;
  changeDue?: number;
  cardLast4?: string;
  cardAuthCode?: string;
  cardType?: 'Visa' | 'MasterCard' | 'RuPay';
  upiTxnRef?: string;
  splitDetails?: {
    cash: number;
    upi: number;
    card: number;
  };
  rewardPointsRedeemed?: number;
  rewardDiscount?: number;
}

export interface POSShiftSession {
  id: string;
  cashierName: string;
  outletId: string;
  outletName: string;
  registerId: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  totalDiscounts: number;
  totalTransactions: number;
  closingCashActual?: number;
  status: 'open' | 'closed';
}

export interface POSReceiptData {
  invoiceNumber: string;
  orderId: string;
  createdAt: string;
  outletName: string;
  outletAddress: string;
  outletPhone: string;
  outletGstin: string;
  cashierName: string;
  registerId: string;
  customer: POSCustomer;
  items: POSCartItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalTax: number;
  finalTotal: number;
  tender: POSTenderPayment;
  barcodeValue: string;
}

export interface POSPettyCashEntry {
  id: string;
  shiftId: string;
  type: 'cash_in' | 'cash_out' | 'expense';
  amount: number;
  category: 'tea_coffee' | 'courier' | 'stationery' | 'utility' | 'vendor_payout' | 'float_add' | 'other';
  reason: string;
  recordedBy: string;
  timestamp: string;
}

export interface POSReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  condition: 'resellable' | 'damaged' | 'defective';
  restockToInventory: boolean;
}

export interface POSReturnRecord {
  id: string;
  returnNumber: string;
  originalInvoiceNumber: string;
  returnDate: string;
  cashierName: string;
  customerName: string;
  customerPhone: string;
  items: POSReturnItem[];
  totalRefund: number;
  refundMethod: 'cash' | 'original_mode' | 'store_credit';
  reason: string;
  creditNoteNumber?: string;
}

export interface POSQuotation {
  id: string;
  quoteNumber: string;
  createdAt: string;
  validUntil: string;
  customer: POSCustomer;
  items: POSCartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  finalTotal: number;
  status: 'active' | 'converted' | 'expired';
}

export interface POSHardwareStatus {
  barcodeScanner: 'connected' | 'disconnected' | 'emulated';
  thermalPrinter: 'ready' | 'paper_low' | 'offline';
  cashDrawer: 'ready' | 'open' | 'locked';
  customerDisplay: 'online' | 'standby';
  weighingScale: 'connected' | 'idle';
}

export interface POSAuditLog {
  id: string;
  timestamp: string;
  cashierName: string;
  action: 'price_override' | 'clear_cart' | 'large_discount' | 'bill_held' | 'bill_recalled' | 'refund_approved' | 'petty_cash' | 'shift_reconciled';
  details: string;
  amount?: number;
}
