import QRCode from 'qrcode';

/**
 * Generate a dynamic QR code as a base64 Data URL
 */
export async function generateQrDataUrl(text: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options?.width || 280,
      margin: options?.margin || 1,
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
      ...options,
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}

/**
 * Generate Indian UPI QR specification string
 * Spec: upi://pay?pa={upiId}&pn={payeeName}&am={amount}&tr={transactionRef}&cu=INR
 */
export function buildUpiPaymentUri(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionRef: string;
  note?: string;
}): string {
  const { upiId, payeeName, amount, transactionRef, note = 'Javed Electronics Order' } = params;
  const encodedName = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(note);
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount.toFixed(2)}&tr=${transactionRef}&tn=${encodedNote}&cu=INR`;
}

/**
 * Build tracking / verification URL for an order
 */
export function buildOrderTrackingUrl(orderId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}?trackOrder=${encodeURIComponent(orderId)}`;
  }
  return `https://javed-electronics.in/track?orderId=${orderId}`;
}
