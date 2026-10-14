import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { DeliveryType, PaymentMethod } from '../../types';
import { formatINR } from '../../utils/currency';
import { generateWhatsAppOrderMessage, getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import { buildUpiPaymentUri, generateQrDataUrl } from '../../utils/qrcode';
import {
  X,
  MapPin,
  Truck,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  Clock,
  ShieldCheck,
  Check,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    cart,
    currentUser,
    settings,
    cartSubtotal,
    cartCouponDiscount,
    cartDeliveryFee,
    cartTaxAmount,
    cartFinalTotal,
    createOrder,
    setSelectedOrderForModal,
    checkPincodeServiceable,
  } = useStore();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [deliverySlot, setDeliverySlot] = useState<string>('Today 4:00 PM - 7:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi_qr');

  // Customer info fields
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [addressLine, setAddressLine] = useState(currentUser.savedAddresses[0]?.addressLine || '');
  const [area, setArea] = useState(currentUser.savedAddresses[0]?.area || 'Hazratganj');
  const [city] = useState('Lucknow');
  const [state] = useState('Uttar Pradesh');
  const [pincode, setPincode] = useState(currentUser.savedAddresses[0]?.pincode || '226001');
  const [landmark, setLandmark] = useState(currentUser.savedAddresses[0]?.landmark || '');
  const [instructions, setInstructions] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic UPI QR code preview state
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (paymentMethod === 'upi_qr') {
      const tempRef = `JE-TEMP-${Date.now().toString().slice(-6)}`;
      const payableAmount = deliveryType === 'store_pickup' ? cartSubtotal - cartCouponDiscount : cartFinalTotal;
      const upiString = buildUpiPaymentUri({
        upiId: settings.upiId,
        payeeName: settings.upiName,
        amount: payableAmount,
        transactionRef: tempRef,
        note: 'Javed Electronics Order',
      });
      generateQrDataUrl(upiString, { width: 220 }).then(setUpiQrDataUrl);
    }
  }, [paymentMethod, deliveryType, cartSubtotal, cartCouponDiscount, cartFinalTotal, settings.upiId, settings.upiName]);

  if (activeModal !== 'checkout' || cart.length === 0) return null;

  const isPincodeValid = checkPincodeServiceable(pincode);
  const payableAmount = deliveryType === 'store_pickup' ? cartSubtotal - cartCouponDiscount : cartFinalTotal;

  const handleOrderSubmission = async (isWhatsApp: boolean) => {
    // Form validations
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (deliveryType === 'delivery') {
      if (!addressLine.trim()) {
        setErrorMessage('Please enter your street address / house number.');
        return;
      }
      if (!isPincodeValid) {
        setErrorMessage(`PIN code ${pincode} is outside our current local delivery area in Lucknow.`);
        return;
      }
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const order = await createOrder({
        customer: {
          id: currentUser.id,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: deliveryType === 'delivery' ? addressLine.trim() : `Store Pickup: ${settings.address}`,
          area: deliveryType === 'delivery' ? area.trim() : 'Hazratganj Store',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          pincode: deliveryType === 'delivery' ? pincode.trim() : settings.pincode,
          landmark: landmark.trim() || undefined,
          instructions: instructions.trim() || undefined,
        },
        deliveryType,
        deliverySlot: deliveryType === 'delivery' ? deliverySlot : 'Store Counter Pickup',
        paymentMethod: deliveryType === 'store_pickup' ? 'store_pickup_pay' : paymentMethod,
        isWhatsAppCheckout: isWhatsApp,
      });

      setSelectedOrderForModal(order);
      setActiveModal('order_confirmation');

      // If WhatsApp checkout requested, open WhatsApp with prefilled message
      if (isWhatsApp) {
        const msg = generateWhatsAppOrderMessage(order);
        const url = getWhatsAppClickToChatUrl(settings.whatsappNumber, msg);
        window.open(url, '_blank');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to place order. Please check stock availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-auto sm:my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Secure Checkout</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Javed Electronics • Express Dispatch & Store Pickup
            </p>
          </div>
          <button
            onClick={() => setActiveModal('cart')}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5">
          {errorMessage && (
            <div className="p-2.5 sm:p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Delivery vs Store Pickup Toggle */}
          <div>
            <label className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              1. Delivery Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                className={`p-2.5 sm:p-3.5 rounded-xl border text-left flex items-start gap-2.5 sm:gap-3 transition-all cursor-pointer ${
                  deliveryType === 'delivery'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Truck className={`w-5 h-5 shrink-0 ${deliveryType === 'delivery' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900">Local Home Delivery</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Same-day 4-hr dispatch in Lucknow
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('store_pickup')}
                className={`p-2.5 sm:p-3.5 rounded-xl border text-left flex items-start gap-2.5 sm:gap-3 transition-all cursor-pointer ${
                  deliveryType === 'store_pickup'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Store className={`w-5 h-5 shrink-0 ${deliveryType === 'store_pickup' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900">Store Pickup (FREE)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hazratganj Store • Ready in 30 mins
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Customer Contact & Address */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              2. Customer Details & {deliveryType === 'delivery' ? 'Delivery Address' : 'Contact'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohammad Rizwan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Mobile Number (for order & WhatsApp updates) *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9839012345"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              {deliveryType === 'delivery' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      House / Flat / Street Address *
                    </label>
                    <input
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="e.g. Flat 302, Royal Residency, Lane 3"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Locality / Area *
                    </label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Hazratganj / Mahanagar"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      PIN Code (Lucknow) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 226001"
                        maxLength={6}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                        required
                      />
                      {pincode.length === 6 && (
                        <span
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isPincodeValid
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isPincodeValid ? 'Serviceable' : 'Unavailable'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Nearby Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Behind Mayfair Cinema"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Preferred Delivery Slot
                    </label>
                    <select
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white cursor-pointer"
                    >
                      <option value="Today 4:00 PM - 7:00 PM">Today Evening (4:00 PM - 7:00 PM)</option>
                      <option value="Tomorrow 10:00 AM - 1:00 PM">Tomorrow Morning (10:00 AM - 1:00 PM)</option>
                      <option value="Tomorrow 4:00 PM - 7:00 PM">Tomorrow Evening (4:00 PM - 7:00 PM)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. Payment Method */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              3. Payment Method
            </label>

            {deliveryType === 'store_pickup' ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                <span>
                  <strong>Pay at Store Counter:</strong> Pay via Cash, UPI, or Card upon picking up your order at Hazratganj shop.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* UPI QR Option */}
                <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'upi_qr'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'upi_qr'}
                    onChange={() => setPaymentMethod('upi_qr')}
                    className="mt-1 text-blue-600 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <QrCode className="w-4 h-4 text-purple-600" />
                      <span>Instant UPI / QR Code Payment (Recommended)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pay instantly with GPay, PhonePe, Paytm, or BHIM. Zero convenience fee.
                    </p>

                    {paymentMethod === 'upi_qr' && upiQrDataUrl && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200 flex flex-col items-center max-w-full min-w-0 box-border">
                        <img src={upiQrDataUrl} alt="UPI QR" className="w-32 h-32 sm:w-36 sm:h-36 max-w-full" />
                        <span className="text-[11px] font-mono text-slate-600 mt-1 break-all text-center">
                          UPI ID: {settings.upiId}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold mt-0.5">
                          Amount: {formatINR(payableAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </label>

                {/* Cash on Delivery (COD) */}
                <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-blue-600 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pay cash to our verified delivery partner after physical product inspection.
                    </p>
                  </div>
                </label>

                {/* Online Payment Link / Razorpay */}
                <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'online_razorpay'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'online_razorpay'}
                    onChange={() => setPaymentMethod('online_razorpay')}
                    className="mt-1 text-blue-600 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>Online Cards & Netbanking (Razorpay Gateway)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      All major Credit/Debit cards (Visa, MasterCard, RuPay), EMI, and Netbanking.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Order Summary Recap */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Items Total ({cart.reduce((t, i) => t + i.quantity, 0)} items):</span>
              <span className="font-mono">{formatINR(cartSubtotal)}</span>
            </div>
            {cartCouponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount:</span>
                <span className="font-mono">-{formatINR(cartCouponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges:</span>
              <span className="font-mono">
                {deliveryType === 'store_pickup' || cartDeliveryFee === 0 ? (
                  <span className="text-emerald-600 font-semibold">FREE</span>
                ) : (
                  formatINR(cartDeliveryFee)
                )}
              </span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
              <span>Total Payable Amount:</span>
              <span className="font-mono text-blue-700">{formatINR(payableAmount)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action CTAs */}
        <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* WhatsApp Direct Checkout Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleOrderSubmission(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
            <span>Order on WhatsApp</span>
          </button>

          {/* Standard Place Order Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleOrderSubmission(false)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Placing Order...' : 'Place Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
