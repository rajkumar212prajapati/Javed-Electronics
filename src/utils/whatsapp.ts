import { Order } from '../types';
import { formatINR } from './currency';

/**
 * Format order into a Priority Hub Dispatch Notification message after payment processing
 */
export function generateWhatsAppOrderMessage(order: Order): string {
  const itemsList = order.items
    .map(
      (item) =>
        `• ${item.productName}${item.variant ? ` (${item.variant})` : ''} × ${item.quantity} - ${formatINR(item.total)}`
    )
    .join('\n');

  const paymentLabels: Record<string, string> = {
    je_cash: 'JE Cash (Store Credit)',
    upi_qr: 'Direct Dynamic UPI / QR Code',
    razorpay: 'Razorpay Gateway (Cards/Netbanking/UPI)',
    online_razorpay: 'Razorpay Gateway (Cards/Netbanking/UPI)',
    phonepe: 'PhonePe PG (1-Tap UPI Intent)',
    paytm: 'Paytm Gateway (Wallet & Postpaid)',
    cashfree: 'Cashfree Payments (Auto-Collect)',
    stripe: 'Stripe International (Global Cards)',
    cod: order.isPartialPrepaidCod
      ? 'Partial Prepaid + Cash on Delivery (Split COD)'
      : 'Cash on Delivery (COD)',
    store_pickup_pay: 'Store Counter Pickup Pay',
  };
  const paymentLabel =
    paymentLabels[order.paymentMethod] || order.paymentMethod.replace(/_/g, ' ');

  const deliveryTypeLabel =
    order.deliveryType === 'store_pickup'
      ? '🏪 Store Pickup'
      : `🚚 Express Home Delivery (${order.customer.area}, PIN: ${order.customer.pincode})`;

  const paymentBreakdownBlock = order.isPartialPrepaidCod
    ? `*Payment Method:* ${paymentLabel}\n*Partial Prepaid (Processed):* ${formatINR(order.partialPrepaidAmount || 0)} via ${(order.partialPrepaidMethod || 'UPI').toUpperCase()}\n*Upper / Balance Amount on Delivery (COD):* ${formatINR(order.codBalanceOnDelivery || 0)}`
    : `*Payment Method:* ${paymentLabel} (${order.paymentStatus === 'verified_paid' ? 'Payment Processed & Verified' : 'Processed / Confirmed'})`;

  return `⚡ *HUB FASTER DISPATCH NOTIFICATION (PAYMENT PROCESSED)*

Hello Javed Electronics Dispatch Hub,
My payment has been processed. Please prioritize packing and faster dispatch for my order:

*Order ID:* ${order.id}
*Invoice No:* ${order.invoiceNumber}
*Customer:* ${order.customer.name} (${order.customer.phone})

*Items for Dispatch:*
${itemsList}

*Subtotal:* ${formatINR(order.subtotal)}
${order.discountTotal > 0 ? `*Discount:* -${formatINR(order.discountTotal)}\n` : ''}*Delivery:* ${order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}
*Total Order Value:* ${formatINR(order.finalTotal)}

${paymentBreakdownBlock}
${order.paymentDetails?.transactionId ? `*Transaction Ref:* ${order.paymentDetails.transactionId}\n` : ''}*Delivery Preference:* ${deliveryTypeLabel}
${order.customer.address ? `*Dispatch Address:* ${order.customer.address}, ${order.customer.landmark ? `Near ${order.customer.landmark}, ` : ''}${order.customer.city} - ${order.customer.pincode}` : ''}

Please prioritize hub dispatch and share live tracking details. Thank you!`;
}

/**
 * Create WhatsApp click-to-chat URL
 */
export function getWhatsAppClickToChatUrl(phoneInternational: string, message: string): string {
  // Strip non-digit characters
  const cleanPhone = phoneInternational.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Quick product inquiry message on WhatsApp
 */
export function generateProductInquiryMessage(
  productName: string,
  price: number,
  sku: string
): string {
  return `Hello Javed Electronics,

I am interested in buying:
*${productName}* (SKU: ${sku})
Price: ${formatINR(price)}

Is this currently available in stock for same-day delivery or store pickup?`;
}
