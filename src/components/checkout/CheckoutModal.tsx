import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { DeliveryType, PaymentMethod, PaymentGatewayProviderType } from '../../types';
import { formatINR } from '../../utils/currency';
import { generateWhatsAppOrderMessage, getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import { buildUpiPaymentUri, generateQrDataUrl } from '../../utils/qrcode';
import { validateGSTIN } from '../../utils/gstTaxEngine';
import {
  X,
  ArrowLeft,
  Truck,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  Check,
  AlertCircle,
  MessageCircle,
  Building2,
  Zap,
  Globe,
  Smartphone,
  Copy,
  Wallet,
  Upload,
  Image as ImageIcon,
  Camera,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { CustomerLocationPickerMap } from './CustomerLocationPickerMap';
import { Coordinates, POPULAR_DELIVERY_LANDMARKS } from '../../utils/geoUtils';
import { cleanCustomerName } from '../../utils/cleaners';

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
    cartGstCalculation,
    cartFinalTotal,
    createOrder,
    setSelectedOrderForModal,
    checkPincodeServiceable,
    paymentGateways,
  } = useStore();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [deliverySlot, setDeliverySlot] = useState<string>('Today 4:00 PM - 7:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('je_cash');

  // Customer info fields
  const [name, setName] = useState(() => cleanCustomerName(currentUser.name));
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [addressLine, setAddressLine] = useState(currentUser.savedAddresses[0]?.addressLine || '');
  const [area, setArea] = useState(currentUser.savedAddresses[0]?.area || 'Nalasopara East');
  const [state] = useState(currentUser.savedAddresses[0]?.state || 'Maharashtra');
  const [pincode, setPincode] = useState(currentUser.savedAddresses[0]?.pincode || '401209');
  const [landmark, setLandmark] = useState(currentUser.savedAddresses[0]?.landmark || '');
  const [instructions] = useState('');

  // Map & Geospatial Location State
  const [customerCoords, setCustomerCoords] = useState<Coordinates>(() => {
    return (
      currentUser.savedAddresses[0]?.coordinates || {
        lat: 19.4173,
        lng: 72.8205,
      }
    );
  });
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number>(3.2);
  const [addressTag, setAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home');

  // B2B GST Invoicing state
  const [isB2B, setIsB2B] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [gstinFeedback, setGstinFeedback] = useState<{
    isValid: boolean;
    stateName?: string;
    stateCode?: string;
    pan?: string;
    error?: string;
  } | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [phonePeMobile, setPhonePeMobile] = useState('');
  const [paytmMobile, setPaytmMobile] = useState('');

  // Partial Prepaid + COD Split State (when order value > COD limit)
  const [partialCodSplitMode, setPartialCodSplitMode] = useState<'token_20' | 'excess_above_limit'>('token_20');
  const [partialPrepaidMethod, setPartialPrepaidMethod] = useState<'upi_qr' | 'razorpay' | 'phonepe' | 'je_cash'>('upi_qr');
  const [partialUpiQrDataUrl, setPartialUpiQrDataUrl] = useState<string>('');
  const [informHubAfterPayment, setInformHubAfterPayment] = useState<boolean>(true);

  // Dynamic UPI QR code preview state & Customer Proof Upload
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  const [upiDeepLink, setUpiDeepLink] = useState<string>('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [upiUtrInput, setUpiUtrInput] = useState<string>('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState<boolean>(false);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);

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

  // Base payable amount before payment-method-specific discount or COD charge
  const basePayable =
    deliveryType === 'store_pickup'
      ? Math.max(0, cartSubtotal - cartCouponDiscount - cartBulkDiscount.discountAmount)
      : cartFinalTotal;

  const getGatewayPrepaidDiscount = (gw: (typeof availableGateways)[0] | null) => {
    if (!gw || gw.provider === 'cod' || gw.provider === 'store_pickup_pay') return 0;

    if (settings.prepaidDiscountEnabled !== false) {
      const discVal =
        settings.prepaidDiscountValue !== undefined
          ? settings.prepaidDiscountValue
          : gw.feeOrDiscountType === 'percentage_discount' || gw.feeOrDiscountType === 'fixed_discount'
          ? gw.feeOrDiscountValue
          : 2;
      const discType =
        settings.prepaidDiscountType ||
        (gw.feeOrDiscountType === 'fixed_discount' ? 'fixed' : 'percentage');

      if (discVal <= 0) return 0;
      const rawDiscount =
        discType === 'fixed'
          ? Math.min(basePayable, discVal)
          : Math.round((basePayable * discVal) / 100);
      const maxCap =
        settings.prepaidMaxDiscountAmount && settings.prepaidMaxDiscountAmount > 0
          ? settings.prepaidMaxDiscountAmount
          : Infinity;
      return Math.min(rawDiscount, maxCap);
    }

    if (gw.feeOrDiscountType === 'percentage_discount' && gw.feeOrDiscountValue > 0) {
      return Math.round((basePayable * gw.feeOrDiscountValue) / 100);
    }
    if (gw.feeOrDiscountType === 'fixed_discount' && gw.feeOrDiscountValue > 0) {
      return Math.min(basePayable, gw.feeOrDiscountValue);
    }
    return 0;
  };

  const getGatewayCodCharge = (gw: (typeof availableGateways)[0] | null) => {
    if (!gw || gw.provider !== 'cod') return 0;

    if (settings.codExtraChargeEnabled !== false) {
      const chargeVal =
        settings.codExtraChargeValue !== undefined
          ? settings.codExtraChargeValue
          : gw.feeOrDiscountType === 'surcharge' || gw.feeOrDiscountType === 'percentage_surcharge'
          ? gw.feeOrDiscountValue
          : 49;
      const chargeType =
        settings.codExtraChargeType ||
        (gw.feeOrDiscountType === 'percentage_surcharge' ? 'percentage' : 'fixed');

      if (chargeVal <= 0) return 0;
      return chargeType === 'percentage'
        ? Math.round((basePayable * chargeVal) / 100)
        : chargeVal;
    }

    if (gw.feeOrDiscountType === 'surcharge' && gw.feeOrDiscountValue > 0) {
      return gw.feeOrDiscountValue;
    }
    if (gw.feeOrDiscountType === 'percentage_surcharge' && gw.feeOrDiscountValue > 0) {
      return Math.round((basePayable * gw.feeOrDiscountValue) / 100);
    }
    return 0;
  };

  const gatewayDiscount = useMemo(
    () => getGatewayPrepaidDiscount(activeGateway),
    [
      activeGateway,
      basePayable,
      settings.prepaidDiscountEnabled,
      settings.prepaidDiscountType,
      settings.prepaidDiscountValue,
      settings.prepaidMaxDiscountAmount,
    ]
  );

  const codExtraCharge = useMemo(
    () => getGatewayCodCharge(activeGateway),
    [
      activeGateway,
      basePayable,
      settings.codExtraChargeEnabled,
      settings.codExtraChargeType,
      settings.codExtraChargeValue,
    ]
  );

  const payableAmount = Math.max(0, basePayable - gatewayDiscount + codExtraCharge);

  // COD Limit & Partial Prepaid Calculation
  const codGatewayConfig = useMemo(
    () => availableGateways.find((gw) => gw.provider === 'cod'),
    [availableGateways]
  );
  const codMaxLimit = codGatewayConfig?.maxOrderValue || 30000;
  const isOrderAboveCodLimit = payableAmount > codMaxLimit;
  const isPartialPrepaidCodActive = paymentMethod === 'cod' && isOrderAboveCodLimit;

  const { partialPrepaidAmount, codBalanceOnDelivery } = useMemo(() => {
    if (!isOrderAboveCodLimit) {
      return { partialPrepaidAmount: 0, codBalanceOnDelivery: payableAmount };
    }
    const excessAboveLimit = Math.max(1, payableAmount - codMaxLimit);
    const token20Pct = Math.max(1, Math.round(payableAmount * 0.2));

    if (partialCodSplitMode === 'excess_above_limit') {
      return {
        partialPrepaidAmount: excessAboveLimit,
        codBalanceOnDelivery: payableAmount - excessAboveLimit,
      };
    }
    return {
      partialPrepaidAmount: token20Pct,
      codBalanceOnDelivery: payableAmount - token20Pct,
    };
  }, [isOrderAboveCodLimit, payableAmount, codMaxLimit, partialCodSplitMode]);

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
      setUpiDeepLink(upiString);
      generateQrDataUrl(upiString, { width: 220 }).then(setUpiQrDataUrl);
    }
  }, [paymentMethod, deliveryType, payableAmount, activeGateway, settings.upiId, settings.upiName]);

  // Generate UPI QR code for Partial Prepaid COD when UPI QR is selected
  useEffect(() => {
    if (isPartialPrepaidCodActive && partialPrepaidMethod === 'upi_qr' && partialPrepaidAmount > 0) {
      const tempRef = `JE-PARTIAL-${Date.now().toString().slice(-6)}`;
      const upiGw = availableGateways.find((g) => g.provider === 'upi_qr');
      const targetUpiVpa = upiGw?.upiVpa || settings.upiId;
      const upiString = buildUpiPaymentUri({
        upiId: targetUpiVpa,
        payeeName: settings.upiName || 'Javed Electronics',
        amount: partialPrepaidAmount,
        transactionRef: tempRef,
        note: 'Partial Prepaid COD Order',
      });
      generateQrDataUrl(upiString, { width: 180 }).then(setPartialUpiQrDataUrl);
    }
  }, [
    isPartialPrepaidCodActive,
    partialPrepaidMethod,
    partialPrepaidAmount,
    availableGateways,
    settings.upiId,
    settings.upiName,
  ]);

  const handleCopyUpi = (vpa: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(vpa);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Screenshot image must be under 8MB.');
      return;
    }

    setScreenshotFileName(file.name);
    setIsUploadingScreenshot(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPaymentScreenshot(reader.result);
        setErrorMessage(null);
      }
      setIsUploadingScreenshot(false);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file.');
      setIsUploadingScreenshot(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotFileName('');
  };

  if (activeModal !== 'checkout' || cart.length === 0) return null;

  const isPincodeValid = checkPincodeServiceable(pincode);

  const handleOrderSubmission = async (shouldInformHubOnWhatsApp: boolean) => {
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
        setErrorMessage('Please enter your street address.');
        return;
      }
      if (!isPincodeValid && deliveryDistanceKm > 25) {
        setErrorMessage(`PIN code ${pincode} is outside our local delivery area.`);
        return;
      }
    }

    if (isB2B) {
      if (!businessName.trim()) {
        setErrorMessage('Please enter your Business Name for GST Invoice.');
        return;
      }
      const gstinVal = validateGSTIN(gstin);
      if (!gstinVal.isValid) {
        setErrorMessage(gstinVal.error || 'Please enter a valid 15-character GSTIN.');
        return;
      }
    }

    if (availableGateways.length === 0 && !shouldInformHubOnWhatsApp) {
      setErrorMessage('Payment gateways are currently paused.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const chosenPaymentMethod =
        deliveryType === 'store_pickup' &&
        !activeGateway?.applicableDeliveryTypes.includes('store_pickup')
          ? 'store_pickup_pay'
          : (activeGateway?.provider as PaymentMethod) || paymentMethod;

      if (chosenPaymentMethod === 'je_cash') {
        const userBal = currentUser.rewardBalance || currentUser.jeCashBalance || 0;
        if (userBal < payableAmount) {
          setErrorMessage(
            `Insufficient JE Cash balance (${formatINR(userBal)} available). Please select another payment method.`
          );
          setIsSubmitting(false);
          return;
        }
      }

      const isPartialCodOrder = chosenPaymentMethod === 'cod' && isOrderAboveCodLimit;
      if (isPartialCodOrder && partialPrepaidMethod === 'je_cash') {
        const userBal = currentUser.rewardBalance || currentUser.jeCashBalance || 0;
        if (userBal < partialPrepaidAmount) {
          setErrorMessage(
            `Insufficient JE Cash balance for Partial Prepaid (${formatINR(partialPrepaidAmount)}). Please select UPI or Cards.`
          );
          setIsSubmitting(false);
          return;
        }
      }

      if (chosenPaymentMethod === 'upi_qr' && !paymentScreenshot) {
        setErrorMessage('Please upload your UPI payment confirmation screenshot before placing the order.');
        setIsSubmitting(false);
        return;
      }

      const order = await createOrder({
        customer: {
          id: currentUser.id,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address:
            deliveryType === 'delivery'
              ? addressLine.trim()
              : `Store Pickup: ${settings.address}`,
          area: deliveryType === 'delivery' ? area.trim() : 'Nalasopara Flagship Store',
          city: 'Nalasopara',
          state: state || 'Maharashtra',
          pincode: deliveryType === 'delivery' ? pincode.trim() : settings.pincode,
          landmark: landmark.trim() || undefined,
          instructions: instructions.trim() || undefined,
          coordinates: deliveryType === 'delivery' ? customerCoords : undefined,
          tag: addressTag,
          isB2B,
          businessName: isB2B ? businessName.trim() : undefined,
          gstin: isB2B ? gstin.trim().toUpperCase() : undefined,
          panNumber:
            isB2B && gstin.trim().length >= 12
              ? gstin.trim().slice(2, 12).toUpperCase()
              : undefined,
        },
        deliveryType,
        deliverySlot: deliveryType === 'delivery' ? deliverySlot : 'Store Counter Pickup',
        paymentMethod: chosenPaymentMethod,
        informHubForDispatch: shouldInformHubOnWhatsApp,
        isPartialPrepaidCod: isPartialCodOrder,
        partialPrepaidAmount: isPartialCodOrder ? partialPrepaidAmount : undefined,
        codBalanceOnDelivery: isPartialCodOrder ? codBalanceOnDelivery : undefined,
        partialPrepaidMethod: isPartialCodOrder ? partialPrepaidMethod : undefined,
        prepaidDiscount: gatewayDiscount > 0 ? gatewayDiscount : undefined,
        codExtraCharge: codExtraCharge > 0 ? codExtraCharge : undefined,
        paymentProof: paymentScreenshot
          ? {
              screenshotUrl: paymentScreenshot,
              utrNumber: upiUtrInput.trim() || undefined,
            }
          : undefined,
      });

      setPaymentScreenshot(null);
      setScreenshotFileName('');
      setUpiUtrInput('');
      setSelectedOrderForModal(order);
      setActiveModal('order_confirmation');

      if (shouldInformHubOnWhatsApp) {
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
      setErrorMessage(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGatewayIcon = (provider: PaymentGatewayProviderType) => {
    switch (provider) {
      case 'upi_qr':
        return <QrCode className="w-4 h-4 text-slate-600 shrink-0" />;
      case 'razorpay':
        return <CreditCard className="w-4 h-4 text-slate-600 shrink-0" />;
      case 'phonepe':
        return <Smartphone className="w-4 h-4 text-slate-600 shrink-0" />;
      case 'paytm':
        return <Smartphone className="w-4 h-4 text-slate-600 shrink-0" />;
      case 'cashfree':
        return <Zap className="w-4 h-4 text-slate-600 shrink-0" />;
      case 'stripe':
        return <Globe className="w-4 h-4 text-slate-600 shrink-0" />;
      case 'cod':
        return <Banknote className="w-4 h-4 text-slate-600 shrink-0" />;
      case 'store_pickup_pay':
        return <Store className="w-4 h-4 text-slate-600 shrink-0" />;
      case 'je_cash':
        return <Wallet className="w-4 h-4 text-slate-600 shrink-0" />;
      default:
        return <CreditCard className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  const getCleanGatewayName = (gw: (typeof availableGateways)[0]) => {
    switch (gw.provider) {
      case 'je_cash':
        return 'JE Cash';
      case 'upi_qr':
        return 'UPI / QR Code';
      case 'razorpay':
        return 'Cards, UPI & NetBanking (Razorpay)';
      case 'phonepe':
        return 'PhonePe';
      case 'paytm':
        return 'Paytm';
      case 'cashfree':
        return 'Cashfree Payments';
      case 'cod':
        return 'Cash on Delivery';
      case 'store_pickup_pay':
        return 'Pay at Store Counter';
      case 'stripe':
        return 'International Cards (Stripe)';
      default:
        return gw.shortName || gw.name;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 w-screen h-screen flex flex-col overflow-hidden">
      {/* Full-Screen Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveModal('cart')}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">Checkout</h1>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Full-Screen Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 pb-24 sm:pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Delivery, Address, Payment */}
          <div className="lg:col-span-7 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-white border border-rose-300 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Delivery Mode */}
            <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Delivery Option
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    deliveryType === 'delivery'
                      ? 'border-blue-600 bg-white ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Truck
                    className={`w-4 h-4 shrink-0 ${
                      deliveryType === 'delivery' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-900">Home Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('store_pickup')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    deliveryType === 'store_pickup'
                      ? 'border-blue-600 bg-white ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Store
                    className={`w-4 h-4 shrink-0 ${
                      deliveryType === 'store_pickup' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-900">Store Pickup</span>
                </button>
              </div>
            </section>

            {/* Customer Details & Address */}
            <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {deliveryType === 'delivery' ? 'Delivery Address' : 'Contact Details'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                {deliveryType === 'delivery' && (
                  <>
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
                        }}
                        onSaveAddressRequest={(tag) => {
                          setAddressTag(tag);
                        }}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="House / Flat / Street"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Area
                      </label>
                      <input
                        type="text"
                        list="serviceable-localities"
                        value={area}
                        onChange={(e) => {
                          const val = e.target.value;
                          setArea(val);
                          const match = POPULAR_DELIVERY_LANDMARKS.find(
                            (l) =>
                              l.name.toLowerCase() === val.toLowerCase() ||
                              l.area.toLowerCase() === val.toLowerCase()
                          );
                          if (match) {
                            setPincode(match.pincode);
                            setCustomerCoords({ lat: match.lat, lng: match.lng });
                          }
                        }}
                        placeholder="Area / Locality"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        required
                      />
                      <datalist id="serviceable-localities">
                        {POPULAR_DELIVERY_LANDMARKS.map((item, idx) => (
                          <option key={`${item.name}-${idx}`} value={item.name}>
                            {item.area} ({item.pincode})
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="PIN Code"
                        maxLength={6}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Landmark"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Delivery Slot
                      </label>
                      <select
                        value={deliverySlot}
                        onChange={(e) => setDeliverySlot(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
                      >
                        <option value="Today 4:00 PM - 7:00 PM">Today (4:00 PM - 7:00 PM)</option>
                        <option value="Tomorrow 10:00 AM - 1:00 PM">Tomorrow (10:00 AM - 1:00 PM)</option>
                        <option value="Tomorrow 4:00 PM - 7:00 PM">Tomorrow (4:00 PM - 7:00 PM)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* B2B GST Option */}
              <div className="pt-2 border-t border-slate-100">
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
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Add GSTIN for B2B Invoice</span>
                  </span>
                </label>

                {isB2B && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                    <div>
                      <label className="font-medium text-slate-600 block mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Company Name"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="font-medium text-slate-600 block mb-1">
                        GSTIN
                      </label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => {
                          const val = e.target.value
                            .toUpperCase()
                            .replace(/[^0-9A-Z]/g, '')
                            .slice(0, 15);
                          setGstin(val);
                          if (val.length === 15) {
                            setGstinFeedback(validateGSTIN(val));
                          } else if (val.length > 0) {
                            setGstinFeedback({
                              isValid: false,
                              error: `${val.length}/15 characters`,
                            });
                          } else {
                            setGstinFeedback(null);
                          }
                        }}
                        placeholder="15-Digit GSTIN"
                        maxLength={15}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      {gstinFeedback && (
                        <p
                          className={`text-[11px] mt-1 ${
                            gstinFeedback.isValid ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {gstinFeedback.isValid
                            ? `${gstinFeedback.stateName} (${gstinFeedback.stateCode})`
                            : gstinFeedback.error}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Payment Method
              </h2>

              <div className="space-y-2">
                {availableGateways.map((gw) => {
                  const isSelected = paymentMethod === gw.provider || paymentMethod === gw.id;
                  const isCodGateway = gw.provider === 'cod';
                  const isExceedingMax = isCodGateway
                    ? false
                    : Boolean(gw.maxOrderValue && basePayable > gw.maxOrderValue);
                  const isBelowMin = Boolean(gw.minOrderValue && basePayable < gw.minOrderValue);
                  const isDisabled = Boolean(isExceedingMax || isBelowMin);
                  const gwPrepaidDisc = getGatewayPrepaidDiscount(gw);
                  const gwCodExtra = getGatewayCodCharge(gw);

                  return (
                    <label
                      key={gw.id}
                      className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                        isDisabled
                          ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed'
                          : isSelected
                          ? 'border-blue-600 bg-white ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_gateway"
                          disabled={isDisabled}
                          checked={isSelected}
                          onChange={() => setPaymentMethod(gw.provider as PaymentMethod)}
                          className="mt-0.5 text-blue-600 cursor-pointer shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 min-w-0">
                              {getGatewayIcon(gw.provider)}
                              <span className="truncate">{getCleanGatewayName(gw)}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {gw.provider === 'je_cash' && (
                                <span className="text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
                                  Bal: {formatINR(currentUser.rewardBalance || currentUser.jeCashBalance || 0)}
                                </span>
                              )}

                              {gwPrepaidDisc > 0 && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                                  Save {formatINR(gwPrepaidDisc)}
                                </span>
                              )}

                              {gwCodExtra > 0 && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                                  +{formatINR(gwCodExtra)} COD Fee
                                </span>
                              )}
                            </div>
                          </div>

                          {isExceedingMax && (
                            <p className="text-[11px] text-rose-600 mt-1">
                              Max limit: {formatINR(gw.maxOrderValue || 0)}
                            </p>
                          )}
                          {isBelowMin && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              Min limit: {formatINR(gw.minOrderValue)}
                            </p>
                          )}

                          {/* Selected Gateway Minimal Content */}
                          {isSelected && !isDisabled && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                              {/* JE Cash */}
                              {gw.provider === 'je_cash' && (() => {
                                const userJeCashBal =
                                  currentUser.rewardBalance || currentUser.jeCashBalance || 0;
                                const isSufficient = userJeCashBal >= payableAmount;

                                return isSufficient ? (
                                  <div className="text-xs text-slate-600 flex justify-between">
                                    <span>Remaining after payment:</span>
                                    <span className="font-mono font-bold text-slate-900">
                                      {formatINR(userJeCashBal - payableAmount)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-2 text-xs text-slate-600">
                                    <p className="text-rose-600 font-medium">
                                      Insufficient JE Cash balance (Non-refillable). Please select another payment method.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setPaymentMethod('upi_qr')}
                                      className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                    >
                                      Use UPI / QR
                                    </button>
                                  </div>
                                );
                              })()}

                              {/* Dynamic UPI QR with Live Amount & Screenshot Proof */}
                              {gw.provider === 'upi_qr' && (
                                <div className="space-y-3 pt-1">
                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
                                    {/* Top Row: Amount & Auto-Amount Indicator */}
                                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 text-xs">
                                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                        <QrCode className="w-4 h-4 text-blue-600" />
                                        <span>Dynamic QR</span>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          Exact Amount Pre-filled
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-mono font-bold text-sm text-slate-900">
                                          {formatINR(payableAmount)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Middle: QR Code + Payee Details */}
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 pt-3">
                                      <div className="flex flex-col items-center shrink-0">
                                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                                          {upiQrDataUrl ? (
                                            <img
                                              src={upiQrDataUrl}
                                              alt="Dynamic UPI QR"
                                              className="w-32 h-32 object-contain rounded"
                                            />
                                          ) : (
                                            <div className="w-32 h-32 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">
                                              Loading QR...
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-slate-500 mt-1 text-center">
                                          Scan with GPay, PhonePe, Paytm, or BHIM
                                        </span>
                                      </div>

                                      <div className="flex-1 space-y-2.5 text-xs w-full">
                                        <div>
                                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                            Payee UPI ID
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-xs select-all break-all">
                                              {gw.upiVpa || settings.upiId}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                handleCopyUpi(gw.upiVpa || settings.upiId);
                                              }}
                                              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                                            >
                                              <Copy className="w-3 h-3" />
                                              <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                                            </button>
                                          </div>
                                        </div>

                                        {upiDeepLink && (
                                          <a
                                            href={upiDeepLink}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            <span>Open UPI App on phone</span>
                                          </a>
                                        )}

                                        {/* Upload Screenshot Proof */}
                                        <div className="pt-2 border-t border-slate-200 space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800 flex items-center gap-1">
                                              <Camera className="w-3 h-3 text-slate-600" />
                                              <span>Upload Payment Screenshot</span>
                                              <span className="text-rose-600 font-bold">*</span>
                                            </span>
                                            {paymentScreenshot && (
                                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Attached
                                              </span>
                                            )}
                                          </div>

                                          {paymentScreenshot ? (
                                            <div className="p-2 bg-white rounded-lg border border-emerald-300 flex items-center justify-between gap-2 shadow-2xs">
                                              <div className="flex items-center gap-2 min-w-0">
                                                <img
                                                  src={paymentScreenshot}
                                                  alt="Proof Preview"
                                                  className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                  <p className="font-semibold text-slate-900 truncate text-[11px]">
                                                    {screenshotFileName || 'screenshot.jpg'}
                                                  </p>
                                                  <p className="text-[10px] text-emerald-700 font-medium">
                                                    ✓ Proof ready for verification
                                                  </p>
                                                </div>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={handleRemoveScreenshot}
                                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                                                title="Remove screenshot"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-white cursor-pointer transition-colors group text-center">
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleScreenshotUpload}
                                                className="hidden"
                                              />
                                              <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                              <span className="font-semibold text-slate-700 group-hover:text-blue-600 text-xs">
                                                {isUploadingScreenshot ? 'Reading...' : 'Tap to Upload Screenshot'}
                                              </span>
                                            </label>
                                          )}

                                          {/* Optional UTR input */}
                                          <input
                                            type="text"
                                            placeholder="UTR / UPI Ref Number (Optional)"
                                            value={upiUtrInput}
                                            onChange={(e) => setUpiUtrInput(e.target.value)}
                                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Process indicator */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-start gap-1">
                                      <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                                      <span>
                                        Order enters <strong>Verifying Payment</strong> status on submission. Admin will review proof and move order to <strong>In Progress</strong>.
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* PhonePe */}
                              {gw.provider === 'phonepe' && (
                                <input
                                  type="tel"
                                  placeholder="PhonePe mobile number"
                                  value={phonePeMobile || phone}
                                  onChange={(e) => setPhonePeMobile(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                                />
                              )}

                              {/* Paytm */}
                              {gw.provider === 'paytm' && (
                                <input
                                  type="tel"
                                  placeholder="Paytm mobile number"
                                  value={paytmMobile || phone}
                                  onChange={(e) => setPaytmMobile(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                                />
                              )}

                              {/* Cash on Delivery — Extra Charge notice & Partial Prepaid when > COD Limit */}
                              {gw.provider === 'cod' && (
                                <div className="space-y-3">
                                  {codExtraCharge > 0 && (
                                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-amber-900 font-medium">
                                        COD Handling Charge of <strong>{formatINR(codExtraCharge)}</strong> added.
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setPaymentMethod('upi_qr');
                                        }}
                                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                                      >
                                        Switch to Prepaid & Save
                                      </button>
                                    </div>
                                  )}

                                  {isOrderAboveCodLimit && (
                                    <div className="space-y-3">
                                      <p className="text-xs text-slate-600">
                                        Order exceeds COD limit ({formatINR(codMaxLimit)}). Pay partial prepaid now and the upper amount on delivery:
                                      </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setPartialCodSplitMode('token_20');
                                      }}
                                      className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                                        partialCodSplitMode === 'token_20'
                                          ? 'border-blue-600 bg-white ring-1 ring-blue-600'
                                          : 'border-slate-200 bg-slate-50'
                                      }`}
                                    >
                                      <div className="text-xs font-bold text-slate-900">
                                        Prepaid Now: {formatINR(Math.max(1, Math.round(payableAmount * 0.2)))}
                                      </div>
                                      <div className="text-[11px] text-slate-600">
                                        Pay on Delivery: {formatINR(payableAmount - Math.max(1, Math.round(payableAmount * 0.2)))}
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setPartialCodSplitMode('excess_above_limit');
                                      }}
                                      className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                                        partialCodSplitMode === 'excess_above_limit'
                                          ? 'border-blue-600 bg-white ring-1 ring-blue-600'
                                          : 'border-slate-200 bg-slate-50'
                                      }`}
                                    >
                                      <div className="text-xs font-bold text-slate-900">
                                        Prepaid Now: {formatINR(Math.max(1, payableAmount - codMaxLimit))}
                                      </div>
                                      <div className="text-[11px] text-slate-600">
                                        Pay on Delivery: {formatINR(codMaxLimit)}
                                      </div>
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    <span className="text-[11px] font-medium text-slate-600 block">
                                      Pay Partial Prepaid ({formatINR(partialPrepaidAmount)}) via:
                                    </span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                      {[
                                        { id: 'upi_qr', label: 'UPI / QR' },
                                        { id: 'razorpay', label: 'Cards / NetBanking' },
                                        { id: 'phonepe', label: 'PhonePe' },
                                        { id: 'je_cash', label: 'JE Cash' },
                                      ].map((m) => (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setPartialPrepaidMethod(m.id as any);
                                          }}
                                          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                                            partialPrepaidMethod === m.id
                                              ? 'bg-slate-900 text-white border-slate-900'
                                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                          }`}
                                        >
                                          {m.label}
                                        </button>
                                      ))}
                                    </div>

                                    {partialPrepaidMethod === 'upi_qr' && partialUpiQrDataUrl && (
                                      <div className="flex items-center gap-3 pt-1">
                                        <img
                                          src={partialUpiQrDataUrl}
                                          alt="Partial Prepaid UPI QR"
                                          className="w-20 h-20 rounded-lg border border-slate-200 bg-white shrink-0"
                                        />
                                        <div className="text-xs text-slate-600 space-y-0.5">
                                          <div className="font-bold text-slate-900">
                                            Pay Now: {formatINR(partialPrepaidAmount)}
                                          </div>
                                          <div>
                                            Pay on Delivery: {formatINR(codBalanceOnDelivery)}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  </div>
                                  )}
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
            </section>
          </div>

          {/* Right Column: Order Summary & Actions */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 lg:sticky lg:top-5">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Order Summary
              </h2>

              {/* Compact Item List */}
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const unitPrice = item.product.dealPrice || item.product.regularPrice;
                  return (
                    <div
                      key={`${item.productId}-${item.selectedVariant || ''}`}
                      className="py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="truncate text-slate-700">
                        <span className="font-medium text-slate-900">{item.product.name}</span>
                        <span className="text-slate-400 ml-1">× {item.quantity}</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900 shrink-0">
                        {formatINR(unitPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Totals */}
              <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatINR(cartSubtotal)}</span>
                </div>

                {cartCouponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-{formatINR(cartCouponDiscount)}</span>
                  </div>
                )}

                {cartBulkDiscount.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Bulk Discount</span>
                    <span className="font-mono">-{formatINR(cartBulkDiscount.discountAmount)}</span>
                  </div>
                )}

                {gatewayDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Prepaid Order Discount</span>
                    <span className="font-mono">-{formatINR(gatewayDiscount)}</span>
                  </div>
                )}

                {codExtraCharge > 0 && (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>COD Extra Charge</span>
                    <span className="font-mono">+{formatINR(codExtraCharge)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className="font-mono">
                    {deliveryType === 'store_pickup' || cartDeliveryFee === 0
                      ? 'FREE'
                      : formatINR(cartDeliveryFee)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>GST (Included)</span>
                  <span className="font-mono">{formatINR(cartGstCalculation.totalTax)}</span>
                </div>

                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2.5">
                  <span>Total Payable</span>
                  <span className="font-mono">{formatINR(payableAmount)}</span>
                </div>

                {isPartialPrepaidCodActive && (
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>Partial Prepaid Now</span>
                      <span className="font-mono">{formatINR(partialPrepaidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Pay on Delivery (COD)</span>
                      <span className="font-mono">{formatINR(codBalanceOnDelivery)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Post-Payment Hub Dispatch Notification Option & Primary Action */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                {/* Hidden file input for quick screenshot upload from bottom button */}
                <input
                  ref={screenshotInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />

                {errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {paymentMethod === 'upi_qr' && paymentScreenshot && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={paymentScreenshot}
                        alt="Payment Proof"
                        className="w-8 h-8 object-cover rounded border border-emerald-300 shrink-0"
                      />
                      <span className="font-semibold text-emerald-900 truncate">
                        ✓ Payment screenshot attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={informHubAfterPayment}
                    onChange={(e) => setInformHubAfterPayment(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-700">
                    After processing payment, inform Hub for faster dispatch
                  </span>
                </label>

                {(() => {
                  const isJeCash = paymentMethod === 'je_cash';
                  const userBal = currentUser.rewardBalance || currentUser.jeCashBalance || 0;
                  const hasSufficientJeCash = userBal >= payableAmount;
                  const needsScreenshot = paymentMethod === 'upi_qr' && !paymentScreenshot;

                  return (
                    <button
                      type="button"
                      disabled={isSubmitting || (isJeCash && !hasSufficientJeCash)}
                      onClick={() => {
                        if (needsScreenshot) {
                          screenshotInputRef.current?.click();
                          return;
                        }
                        handleOrderSubmission(informHubAfterPayment);
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer ${
                        isJeCash && !hasSufficientJeCash
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : paymentMethod === 'upi_qr' && paymentScreenshot
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {needsScreenshot ? (
                        <Upload className="w-4 h-4 shrink-0" />
                      ) : (
                        <Check className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {isSubmitting
                          ? 'Processing...'
                          : isJeCash
                          ? hasSufficientJeCash
                            ? `Pay ${formatINR(payableAmount)} with JE Cash`
                            : 'Insufficient JE Cash'
                          : paymentMethod === 'upi_qr'
                          ? paymentScreenshot
                            ? `Confirm Payment & Place Order (${formatINR(payableAmount)})`
                            : `Upload Screenshot & Confirm (${formatINR(payableAmount)})`
                          : isPartialPrepaidCodActive
                          ? `Pay ${formatINR(partialPrepaidAmount)} Now + ${formatINR(codBalanceOnDelivery)} on Delivery`
                          : `Place Order (${formatINR(payableAmount)})`}
                      </span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
