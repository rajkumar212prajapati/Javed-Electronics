import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { DeliveryType, PaymentMethod, PaymentGatewayProviderType, PaymentGatewayConfig } from '../../types';
import { formatINR } from '../../utils/currency';
import { generateWhatsAppOrderMessage, getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import { buildUpiPaymentUri, generateQrDataUrl } from '../../utils/qrcode';
import { validateGSTIN } from '../../utils/gstTaxEngine';
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
  Building2,
  Receipt,
  FileText,
  Percent,
  Zap,
  Globe,
  Smartphone,
  Copy,
  ExternalLink,
  Shield,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { CustomerLocationPickerMap } from './CustomerLocationPickerMap';
import { Coordinates } from '../../utils/geoUtils';

export const CheckoutModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    cart,
    currentUser,
    settings,
    cartSubtotal,
    cartCouponDiscount,
    cartBulkDiscount,
    cartDeliveryFee,
    cartTaxAmount,
    cartGstCalculation,
    cartFinalTotal,
    createOrder,
    setSelectedOrderForModal,
    checkPincodeServiceable,
    paymentGateways,
    activePaymentGateways,
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

  // Map & Geospatial Location State
  const [customerCoords, setCustomerCoords] = useState<Coordinates>(() => {
    return (
      currentUser.savedAddresses[0]?.coordinates || {
        lat: 26.8482,
        lng: 80.9412,
      }
    );
  });
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number>(3.2);
  const [deliveryEstimatedMins, setDeliveryEstimatedMins] = useState<number>(25);
  const [addressTag, setAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home');

  // B2B GST Invoicing state
  const [isB2B, setIsB2B] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [gstinFeedback, setGstinFeedback] = useState<{ isValid: boolean; stateName?: string; stateCode?: string; pan?: string; error?: string } | null>(null);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [phonePeMobile, setPhonePeMobile] = useState('');
  const [paytmMobile, setPaytmMobile] = useState('');

  // Dynamic UPI QR code preview state
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');

  // Gateways active and eligible for current delivery type
  const availableGateways = useMemo(() => {
    return paymentGateways
      .filter((gw) => gw.isActive && gw.applicableDeliveryTypes.includes(deliveryType))
      .sort((a, b) => a.displayPriority - b.displayPriority);
  }, [paymentGateways, deliveryType]);

  // Selected gateway config object
  const activeGateway = useMemo(() => {
    return (
      availableGateways.find((gw) => gw.provider === paymentMethod || gw.id === paymentMethod) ||
      availableGateways[0] ||
      null
    );
  }, [availableGateways, paymentMethod]);

  // Auto-sync paymentMethod if currently selected gateway is deactivated by Admin
  useEffect(() => {
    if (availableGateways.length > 0) {
      const isStillAvailable = availableGateways.some(
        (gw) => gw.provider === paymentMethod || gw.id === paymentMethod
      );
      if (!isStillAvailable) {
        setPaymentMethod(availableGateways[0].provider as PaymentMethod);
      }
    }
  }, [availableGateways, paymentMethod]);

  // Base and discounted payable amounts
  const basePayable = deliveryType === 'store_pickup' ? cartSubtotal - cartCouponDiscount : cartFinalTotal;

  const gatewayDiscount = useMemo(() => {
    if (!activeGateway) return 0;
    if (activeGateway.feeOrDiscountType === 'percentage_discount' && activeGateway.feeOrDiscountValue > 0) {
      return Math.round((basePayable * activeGateway.feeOrDiscountValue) / 100);
    }
    if (activeGateway.feeOrDiscountType === 'fixed_discount' && activeGateway.feeOrDiscountValue > 0) {
      return Math.min(basePayable, activeGateway.feeOrDiscountValue);
    }
    return 0;
  }, [activeGateway, basePayable]);

  const payableAmount = Math.max(0, basePayable - gatewayDiscount);

  // Generate UPI QR code for upi_qr gateway
  useEffect(() => {
    if (paymentMethod === 'upi_qr') {
      const tempRef = `JE-TEMP-${Date.now().toString().slice(-6)}`;
      const targetUpiVpa = activeGateway?.upiVpa || settings.upiId;
      const upiString = buildUpiPaymentUri({
        upiId: targetUpiVpa,
        payeeName: settings.upiName || 'Javed Electronics',
        amount: payableAmount,
        transactionRef: tempRef,
        note: 'Javed Electronics Order',
      });
      generateQrDataUrl(upiString, { width: 220 }).then(setUpiQrDataUrl);
    }
  }, [paymentMethod, deliveryType, payableAmount, activeGateway, settings.upiId, settings.upiName]);

  const handleCopyUpi = (vpa: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(vpa);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  if (activeModal !== 'checkout' || cart.length === 0) return null;

  const isPincodeValid = checkPincodeServiceable(pincode);

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

    if (isB2B) {
      if (!businessName.trim()) {
        setErrorMessage('Please enter your Registered Business / Company Name for B2B GST Invoicing.');
        return;
      }
      const gstinVal = validateGSTIN(gstin);
      if (!gstinVal.isValid) {
        setErrorMessage(gstinVal.error || 'Please enter a valid 15-character Indian GSTIN.');
        return;
      }
    }

    if (availableGateways.length === 0 && !isWhatsApp) {
      setErrorMessage('Online payment gateways are currently paused. Please use "Order on WhatsApp" to confirm your order directly with the store.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const chosenPaymentMethod =
        deliveryType === 'store_pickup' && !activeGateway?.applicableDeliveryTypes.includes('store_pickup')
          ? 'store_pickup_pay'
          : (activeGateway?.provider as PaymentMethod) || paymentMethod;

      const order = await createOrder({
        customer: {
          id: currentUser.id,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: deliveryType === 'delivery' ? addressLine.trim() : `Store Pickup: ${settings.address}`,
          area: deliveryType === 'delivery' ? area.trim() : 'Hazratganj Store',
          city: 'Lucknow',
          state: state || 'Uttar Pradesh',
          pincode: deliveryType === 'delivery' ? pincode.trim() : settings.pincode,
          landmark: landmark.trim() || undefined,
          instructions: instructions.trim() || undefined,
          coordinates: deliveryType === 'delivery' ? customerCoords : undefined,
          tag: addressTag,
          isB2B,
          businessName: isB2B ? businessName.trim() : undefined,
          gstin: isB2B ? gstin.trim().toUpperCase() : undefined,
          panNumber: isB2B && gstin.trim().length >= 12 ? gstin.trim().slice(2, 12).toUpperCase() : undefined,
        },
        deliveryType,
        deliverySlot: deliveryType === 'delivery' ? deliverySlot : 'Store Counter Pickup',
        paymentMethod: chosenPaymentMethod,
        isWhatsAppCheckout: isWhatsApp,
      });

      setSelectedOrderForModal(order);
      setActiveModal('order_confirmation');

      // If WhatsApp checkout requested, open WhatsApp with prefilled message
      if (isWhatsApp) {
        const msg = generateWhatsAppOrderMessage(order);
        const url = getWhatsAppClickToChatUrl(settings.whatsappNumber, msg);
        try {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.click();
        } catch {}
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
                  {/* Interactive Map Location Selector */}
                  <div className="sm:col-span-2 pt-1">
                    <CustomerLocationPickerMap
                      initialCoordinates={customerCoords}
                      onLocationChange={(coords, meta) => {
                        setCustomerCoords(coords);
                        if (meta?.addressLine) setAddressLine(meta.addressLine);
                        if (meta?.area) setArea(meta.area);
                        if (meta?.pincode) setPincode(meta.pincode);
                        if (meta?.landmark) setLandmark(meta.landmark);
                        if (meta?.distanceKm !== undefined) setDeliveryDistanceKm(meta.distanceKm);
                        if (meta?.estimatedMinutes !== undefined) setDeliveryEstimatedMins(meta.estimatedMinutes);
                      }}
                      onSaveAddressRequest={(tag) => {
                        setAddressTag(tag);
                      }}
                    />
                  </div>

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

          {/* 3. B2B GST Invoicing & Tax Input Credit */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isB2B}
                  onChange={(e) => {
                    setIsB2B(e.target.checked);
                    if (!e.target.checked) setGstinFeedback(null);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Claim GST Input Tax Credit (B2B Tax Invoice)</span>
                </span>
              </label>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-blue-100 text-blue-800">
                GST ITC
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Enable this if you are ordering on behalf of a registered company or business to receive an official B2B GST invoice with Input Tax Credit (ITC) for your GSTR-2B filing.
            </p>

            {isB2B && (
              <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Registered Business / Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Acme Technologies Pvt Ltd"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      15-Digit Indian GSTIN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
                        setGstin(val);
                        if (val.length === 15) {
                          setGstinFeedback(validateGSTIN(val));
                        } else if (val.length > 0) {
                          setGstinFeedback({ isValid: false, error: `${val.length}/15 characters entered` });
                        } else {
                          setGstinFeedback(null);
                        }
                      }}
                      placeholder="e.g. 09AABPJ1234F1Z5"
                      maxLength={15}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {gstinFeedback && (
                  <div
                    className={`p-2.5 rounded-lg text-[11px] flex items-center justify-between ${
                      gstinFeedback.isValid
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {gstinFeedback.isValid ? (
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Valid GSTIN! State: <strong>{gstinFeedback.stateName} (Code: {gstinFeedback.stateCode})</strong> • PAN: <strong>{gstinFeedback.pan}</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{gstinFeedback.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Payment Method (Dynamic Admin Orchestrated Gateways) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Payment Method
              </label>
              <span className="text-[10px] font-semibold text-slate-500">
                {availableGateways.length} active option{availableGateways.length === 1 ? '' : 's'} available
              </span>
            </div>

            {availableGateways.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>All Online Payment Gateways Currently Paused</span>
                </div>
                <p className="text-amber-700 leading-relaxed text-[11px]">
                  Store administration has temporarily paused payment gateways for maintenance. You can complete your order directly via our Hazratganj WhatsApp direct concierge or pick up at the store.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleOrderSubmission(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Confirm Order on WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {availableGateways.map((gw) => {
                  const isSelected = paymentMethod === gw.provider || paymentMethod === gw.id;
                  const isExceedingMax = Boolean(gw.maxOrderValue && payableAmount > gw.maxOrderValue);
                  const isBelowMin = Boolean(gw.minOrderValue && payableAmount < gw.minOrderValue);
                  const isDisabled = Boolean(isExceedingMax || isBelowMin);

                  const getBadgeColorClass = (color?: string) => {
                    switch (color) {
                      case 'purple':
                        return 'bg-purple-100 text-purple-800 border-purple-200';
                      case 'blue':
                        return 'bg-blue-100 text-blue-800 border-blue-200';
                      case 'indigo':
                        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                      case 'emerald':
                        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      case 'amber':
                        return 'bg-amber-100 text-amber-800 border-amber-200';
                      case 'rose':
                        return 'bg-rose-100 text-rose-800 border-rose-200';
                      default:
                        return 'bg-slate-100 text-slate-700 border-slate-200';
                    }
                  };

                  const getGatewayIcon = (provider: PaymentGatewayProviderType) => {
                    switch (provider) {
                      case 'upi_qr':
                        return <QrCode className="w-4 h-4 text-purple-600 shrink-0" />;
                      case 'razorpay':
                        return <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />;
                      case 'phonepe':
                        return <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />;
                      case 'paytm':
                        return <Smartphone className="w-4 h-4 text-sky-600 shrink-0" />;
                      case 'cashfree':
                        return <Zap className="w-4 h-4 text-emerald-600 shrink-0" />;
                      case 'stripe':
                        return <Globe className="w-4 h-4 text-rose-600 shrink-0" />;
                      case 'cod':
                        return <Banknote className="w-4 h-4 text-amber-600 shrink-0" />;
                      case 'store_pickup_pay':
                        return <Store className="w-4 h-4 text-teal-600 shrink-0" />;
                      default:
                        return <CreditCard className="w-4 h-4 text-slate-600 shrink-0" />;
                    }
                  };

                  return (
                    <label
                      key={gw.id}
                      className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                        isDisabled
                          ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                          : isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_gateway"
                          disabled={isDisabled}
                          checked={isSelected}
                          onChange={() => setPaymentMethod(gw.provider as PaymentMethod)}
                          className="mt-1 text-blue-600 cursor-pointer shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                              {getGatewayIcon(gw.provider)}
                              <span>{gw.name}</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {gw.badgeText && (
                                <span
                                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getBadgeColorClass(
                                    gw.badgeColor
                                  )}`}
                                >
                                  {gw.badgeText}
                                </span>
                              )}

                              {gw.environment === 'sandbox' && (
                                <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                                  TEST MODE
                                </span>
                              )}

                              {gw.feeOrDiscountType === 'percentage_discount' && gw.feeOrDiscountValue > 0 && (
                                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>{gw.feeOrDiscountValue}% Instant Off</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {gw.description}
                          </p>

                          {/* Supported Rails Pills */}
                          {gw.supportedMethods && gw.supportedMethods.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              {gw.supportedMethods.slice(0, 5).map((method) => (
                                <span
                                  key={method}
                                  className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60"
                                >
                                  {method}
                                </span>
                              ))}
                              {gw.supportedMethods.length > 5 && (
                                <span className="text-[10px] text-slate-400">
                                  +{gw.supportedMethods.length - 5} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Limit validation warnings */}
                          {isExceedingMax && (
                            <div className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Maximum order limit for this method is {formatINR(gw.maxOrderValue || 0)}.</span>
                            </div>
                          )}
                          {isBelowMin && (
                            <div className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Minimum order limit is {formatINR(gw.minOrderValue)}.</span>
                            </div>
                          )}

                          {/* Interactive Drawer for Selected Gateway */}
                          {isSelected && !isDisabled && (
                            <div className="mt-3 pt-3 border-t border-blue-200/70 space-y-2.5">
                              {/* 1. Dynamic UPI QR */}
                              {gw.provider === 'upi_qr' && (
                                <div className="p-3 bg-white rounded-xl border border-purple-200 flex flex-col items-center max-w-full min-w-0 box-border text-center">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-2">
                                    <QrCode className="w-4 h-4 text-purple-600" />
                                    <span>Scan with Any UPI App to Pay</span>
                                  </div>

                                  {upiQrDataUrl ? (
                                    <img
                                      src={upiQrDataUrl}
                                      alt="UPI QR"
                                      className="w-32 h-32 sm:w-36 sm:h-36 max-w-full rounded-lg border border-purple-100 shadow-xs"
                                    />
                                  ) : (
                                    <div className="w-32 h-32 flex items-center justify-center text-xs text-slate-400">
                                      Generating QR...
                                    </div>
                                  )}

                                  <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
                                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                      {gw.upiVpa || settings.upiId}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleCopyUpi(gw.upiVpa || settings.upiId);
                                      }}
                                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      {copiedUpi ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span className="text-emerald-700">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy UPI ID</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="text-[11px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                                    <span>Exact Payable: {formatINR(payableAmount)}</span>
                                    {gatewayDiscount > 0 && (
                                      <span className="text-[10px] text-purple-600 font-normal">
                                        (Saved {formatINR(gatewayDiscount)} via 1% instant off)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 2. PhonePe PG */}
                              {gw.provider === 'phonepe' && (
                                <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                      <Smartphone className="w-4 h-4 text-indigo-600" />
                                      <span>PhonePe 1-Tap Mobile Intent</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                                      Instant Handshake
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Clicking <strong>Place Order</strong> will automatically trigger the PhonePe mobile intent on your device or show a 1-tap confirmation notification.
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="tel"
                                      placeholder="PhonePe registered mobile number"
                                      value={phonePeMobile || phone}
                                      onChange={(e) => setPhonePeMobile(e.target.value)}
                                      className="px-2.5 py-1.5 text-xs border border-indigo-200 rounded-lg flex-1 bg-indigo-50/20"
                                    />
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-1.5 rounded-lg shrink-0">
                                      Verified Rails
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* 3. Paytm Payment Gateway */}
                              {gw.provider === 'paytm' && (
                                <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                                      <Smartphone className="w-4 h-4 text-sky-600" />
                                      <span>Paytm Wallet & Postpaid BNPL</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded">
                                      Zero Convenience Fee
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Seamlessly checkout using your Paytm Wallet balance, linked Bank Account, or Paytm Postpaid BNPL credit.
                                  </p>
                                  <input
                                    type="tel"
                                    placeholder="Enter 10-digit Paytm mobile number"
                                    value={paytmMobile || phone}
                                    onChange={(e) => setPaytmMobile(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs border border-sky-200 rounded-lg bg-sky-50/20"
                                  />
                                </div>
                              )}

                              {/* 4. Cashfree Payments */}
                              {gw.provider === 'cashfree' && (
                                <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                      <Zap className="w-4 h-4 text-emerald-600" />
                                      <span>Cashfree Auto-Collect & Fast Refunds</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                      Instant Auto-Debit
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Direct UPI auto-collect with 5-minute automated instant refund guarantee on order returns or cancellations.
                                  </p>
                                </div>
                              )}

                              {/* 5. Razorpay Cards & Netbanking */}
                              {gw.provider === 'razorpay' && (
                                <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                      <CreditCard className="w-4 h-4 text-blue-600" />
                                      <span>Razorpay 256-Bit SSL Secure Checkout</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                      PCI-DSS Level 1
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Supports all major Credit & Debit Cards (Visa, MasterCard, RuPay), Netbanking across 50+ Indian banks, and cardless EMI.
                                  </p>
                                </div>
                              )}

                              {/* 6. Stripe International */}
                              {gw.provider === 'stripe' && (
                                <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                      <Globe className="w-4 h-4 text-rose-600" />
                                      <span>Global & NRI International Checkout</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                      USD / GBP / EUR / AED
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Pay securely from anywhere in the world using American Express, Visa, Mastercard, or Apple Pay for family gifting in Lucknow.
                                  </p>
                                </div>
                              )}

                              {/* 7. Cash on Delivery (COD) */}
                              {gw.provider === 'cod' && (
                                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                      <Banknote className="w-4 h-4 text-amber-600" />
                                      <span>Doorstep Physical Product Inspection</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                      Open-Box Delivery
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Inspect your brand-sealed electronics package in front of our verified delivery partner before making cash or rider UPI payment.
                                  </p>
                                </div>
                              )}

                              {/* 8. Store Counter Pickup Pay */}
                              {gw.provider === 'store_pickup_pay' && (
                                <div className="p-3 bg-white rounded-xl border border-teal-200 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                                      <Store className="w-4 h-4 text-teal-600" />
                                      <span>Pay at Hazratganj Store Counter</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                                      Ready in 30 Mins
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Collect your order directly from Javed Electronics showroom counter. Pay via Cash, POS Card Swipe, or Counter QR Code.
                                  </p>
                                </div>
                              )}

                              {/* Custom Instructions if provided */}
                              {gw.customInstructions && (
                                <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                                  ℹ️ {gw.customInstructions}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Summary Recap & Tax Breakdown */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
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
            {cartBulkDiscount.discountAmount > 0 && (
              <div className="flex justify-between text-indigo-700 font-bold bg-indigo-50/80 px-2 py-1 rounded border border-indigo-100">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bulk Volume Discount ({cartBulkDiscount.ruleName}):</span>
                </span>
                <span className="font-mono">-{formatINR(cartBulkDiscount.discountAmount)}</span>
              </div>
            )}
            {gatewayDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50/80 px-2 py-1 rounded border border-emerald-200">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Gateway Instant Benefit ({activeGateway?.shortName || 'Direct'}):</span>
                </span>
                <span className="font-mono">-{formatINR(gatewayDiscount)}</span>
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

            {/* GST Tax Breakdown Box */}
            <div className="mt-2 pt-2 border-t border-slate-200/80 bg-white/70 p-2.5 rounded-lg border text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <span className="flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  <span>GST & Tax Breakdown (Included)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                  className="text-blue-600 hover:text-blue-800 text-[10px] underline font-semibold cursor-pointer"
                >
                  {showTaxBreakdown ? 'Hide Slabs' : 'View Slabs'}
                </button>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Taxable Value (Base Amount):</span>
                <span className="font-mono">{formatINR(cartGstCalculation.taxableAmount)}</span>
              </div>

              {cartGstCalculation.isInterState ? (
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (IGST 18%):</span>
                  <span className="font-mono">{formatINR(cartGstCalculation.igstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (CGST 9%):</span>
                    <span className="font-mono">{formatINR(cartGstCalculation.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (SGST 9%):</span>
                    <span className="font-mono">{formatINR(cartGstCalculation.sgstAmount)}</span>
                  </div>
                </>
              )}

              {showTaxBreakdown && (
                <div className="pt-1.5 mt-1 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
                  <div className="font-semibold text-slate-700">HSN Summary:</div>
                  {cartGstCalculation.hsnSummary.map((hsn) => (
                    <div key={hsn.hsnCode} className="flex justify-between">
                      <span>HSN {hsn.hsnCode} ({hsn.gstRate}%):</span>
                      <span className="font-mono">Tax: {formatINR(hsn.totalTax)}</span>
                    </div>
                  ))}
                  <div className="text-[9px] text-slate-400 mt-1">
                    Place of Supply: {cartGstCalculation.placeOfSupply}
                  </div>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                <span>Total GST Included:</span>
                <span className="font-mono text-emerald-700">{formatINR(cartGstCalculation.totalTax)}</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
              <div>
                <span>Total Payable Amount:</span>
                <span className="block text-[10px] text-slate-400 font-normal">Inclusive of all applicable GST</span>
              </div>
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
