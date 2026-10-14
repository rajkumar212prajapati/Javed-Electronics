import { Order } from '../types';
import { formatINR } from './currency';

/**
 * Format order into a clean, professional WhatsApp text message for local customer order confirmation
 */
export function generateWhatsAppOrderMessage(order: Order): string {
  const itemsList = order.items
    .map((item) => `• ${item.productName}${item.variant ? ` (${item.variant})` : ''} × ${item.quantity} - ${formatINR(item.total)}`)
    .join('\n');

  const paymentLabel = 
    order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' :
    order.paymentMethod === 'upi_qr' ? 'UPI / QR Code' :
    order.paymentMethod === 'online_razorpay' ? 'Online / Razorpay' : 'Store Pickup Pay';

  const deliveryTypeLabel = order.deliveryType === 'store_pickup' 
    ? '🏪 Store Pickup' 
    : `🚚 Home Delivery (${order.customer.area}, PIN: ${order.customer.pincode})`;

  return `Hello Javed Electronics,

I would like to confirm my order.

*Order ID:* ${order.id}
*Customer:* ${order.customer.name} (${order.customer.phone})

*Items:*
${itemsList}

*Subtotal:* ${formatINR(order.subtotal)}
${order.discountTotal > 0 ? `*Discount:* -${formatINR(order.discountTotal)}\n` : ''}*Delivery:* ${order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}
*Total Payable:* ${formatINR(order.finalTotal)}

*Payment Method:* ${paymentLabel} (${order.paymentStatus === 'verified_paid' ? 'Paid' : 'Pending'})
*Delivery Preference:* ${deliveryTypeLabel}
${order.customer.address ? `*Address:* ${order.customer.address}, ${order.customer.landmark ? `Near ${order.customer.landmark}, ` : ''}${order.customer.city} - ${order.customer.pincode}` : ''}

Please confirm product availability and expected delivery time. Thank you!`;
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
export function generateProductInquiryMessage(productName: string, price: number, sku: string): string {
  return `Hello Javed Electronics,

I am interested in buying:
*${productName}* (SKU: ${sku})
Price: ${formatINR(price)}

Is this currently available in stock for same-day delivery or store pickup?`;
}
