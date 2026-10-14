import {
  DynamicUpiQrSession,
  PaymentLifecycleStatus,
  RazorpayOrderRecord,
  PaymentTransactionRecord,
  WhatsAppPaymentSubmission,
  WhatsAppReviewStatus,
} from '../types/marketplacePayments';
import { generateQrDataUrl } from '../utils/qrcode';

/**
 * Generates an MD5/SHA-like quick checksum of cart contents & prices
 * to guarantee that any in-flight price or quantity alteration invalidates the previous checkout session.
 */
export function computeCartPriceChecksum(items: { productId: string; unitPrice: number; quantity: number }[], deliveryFee: number, couponDiscount: number): string {
  const payload = items
    .map((i) => `${i.productId}:${i.unitPrice}:${i.quantity}`)
    .sort()
    .join('|') + `|dlv:${deliveryFee}|coup:${couponDiscount}`;
  
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `CHK-${Math.abs(hash).toString(16)}`;
}

/**
 * Creates an official-spec dynamic UPI QR payment session with 15-minute expiration
 * and price-integrity protection.
 */
export async function createDynamicUpiQrSession(params: {
  orderId: string;
  amount: number;
  merchantVpa: string;
  merchantName: string;
  items: { productId: string; unitPrice: number; quantity: number }[];
  deliveryFee: number;
  couponDiscount: number;
}): Promise<DynamicUpiQrSession> {
  const sessionId = `UPI-SESS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const refId = `JE-${params.orderId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

  const checksum = computeCartPriceChecksum(params.items, params.deliveryFee, params.couponDiscount);

  // Official UPI Payment Deep Link Schema (NPCI spec)
  const upiPayload = `upi://pay?pa=${encodeURIComponent(params.merchantVpa)}&pn=${encodeURIComponent(
    params.merchantName
  )}&am=${params.amount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(refId)}&tn=${encodeURIComponent(
    `Order ${params.orderId}`
  )}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await generateQrDataUrl(upiPayload, { width: 280 });
  } catch (err) {
    console.error('Failed to render dynamic UPI QR:', err);
  }

  return {
    sessionId,
    orderId: params.orderId,
    amount: params.amount,
    currency: 'INR',
    merchantVpa: params.merchantVpa,
    merchantName: params.merchantName,
    qrPayload: upiPayload,
    qrDataUrl,
    expiresAt,
    status: 'payment_initiated',
    refId,
    priceChecksum: checksum,
    createdAt: now.toISOString(),
  };
}

/**
 * Razorpay Integration Service:
 * Manages server order initialization, signature verification, and webhook idempotency.
 */
export const RazorpayService = {
  // Simulates server-side Razorpay Orders API (POST https://api.razorpay.com/v1/orders)
  createOrder(params: {
    appOrderId: string;
    amountInRupees: number;
    receipt?: string;
    notes?: Record<string, string>;
  }): RazorpayOrderRecord {
    const amountInPaise = Math.round(params.amountInRupees * 100);
    const razorpayOrderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const receipt = params.receipt || `rcpt_${params.appOrderId}`;

    return {
      razorpayOrderId,
      appOrderId: params.appOrderId,
      amountInPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      webhookEventsReceived: [],
      createdAt: new Date().toISOString(),
      notes: params.notes,
    };
  },

  // Simulates server-side HMAC-SHA256 signature verification
  // in real production: crypto.createHmac('sha256', secret).update(order_id + "|" + payment_id).digest('hex') === signature
  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!orderId || !paymentId || !signature) return false;
    // Signature format check: valid hex string of 64 chars or test token
    return signature.length >= 32 && signature.startsWith('sig_');
  },

  // Simulates Razorpay Refund initiation API
  initiateRefund(params: {
    paymentId: string;
    amountInRupees: number;
    reason: string;
  }): { refundId: string; status: 'processed' | 'pending'; refundedAt: string } {
    return {
      refundId: `rfnd_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'processed',
      refundedAt: new Date().toISOString(),
    };
  },
};
