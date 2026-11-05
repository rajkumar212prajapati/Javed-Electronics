export type PaymentGatewayProviderType =
  | 'razorpay'
  | 'phonepe'
  | 'paytm'
  | 'cashfree'
  | 'stripe'
  | 'upi_qr'
  | 'cod'
  | 'store_pickup_pay'
  | 'je_cash';

export type GatewayEnvironment = 'sandbox' | 'live';

export type GatewayFeeOrDiscountType =
  | 'none'
  | 'percentage_discount'
  | 'fixed_discount'
  | 'surcharge'
  | 'percentage_surcharge';

export interface PaymentGatewayConfig {
  id: string; // e.g. 'gw_razorpay', 'gw_phonepe', 'gw_upi_qr'
  name: string; // Display name e.g. 'Razorpay (Cards, UPI, Netbanking)'
  shortName: string; // e.g. 'Razorpay'
  provider: PaymentGatewayProviderType;
  description: string;
  iconType: PaymentGatewayProviderType;
  badgeText?: string; // e.g. 'POPULAR', 'RECOMMENDED', '0% FEE', 'INSTANT'
  badgeColor?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'indigo';
  isActive: boolean; // Main toggle: Admin can activate or deactivate
  environment: GatewayEnvironment;
  merchantId?: string; // Merchant / Store ID
  apiKey?: string; // Public / API Key
  secretKey?: string; // Secret Key (masked in UI)
  webhookSecret?: string;
  upiVpa?: string; // For UPI QR gateway e.g. 'javed.electronics@okhdfcbank'
  supportedMethods: string[]; // e.g. ['Google Pay', 'PhonePe', 'Credit Card', 'Debit Card', 'Netbanking']
  minOrderValue: number; // Minimum cart total to show this gateway
  maxOrderValue?: number; // Maximum cart total (e.g. COD limit)
  feeOrDiscountType: GatewayFeeOrDiscountType;
  feeOrDiscountValue: number; // e.g. 2 for 2% discount or ₹50
  customInstructions?: string; // Customer guidance shown at checkout
  displayPriority: number; // 1 = top
  applicableDeliveryTypes: ('delivery' | 'store_pickup')[];
  settlementCycle: string; // e.g. 'Instant', 'T+1 Working Day'
  updatedAt: string;
  updatedBy: string;
}

export interface PaymentGatewayAuditLog {
  id: string;
  gatewayId: string;
  gatewayName: string;
  action: 'activated' | 'deactivated' | 'configured' | 'reset';
  timestamp: string;
  performedBy: string;
  details: string;
}
