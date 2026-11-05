import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Order,
  OrderItem,
  Product,
  ReturnReasonCode,
} from '../../types';
import { formatINR } from '../../utils/currency';
import {
  X,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  ArrowLeftRight,
  AlertTriangle,
  Upload,
  Camera,
  Video,
  Trash2,
  Check,
} from 'lucide-react';

interface ProductReturnExchangeModalProps {
  order: Order;
  item: OrderItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProductReturnExchangeModal: React.FC<ProductReturnExchangeModalProps> = ({
  order,
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    products,
    getCategoryReturnPolicy,
    submitReturnExchangeRequest,
    currentUser,
  } = useStore();

  const product =
    products.find((p) => p.id === item.productId) ||
    ({
      id: item.productId,
      name: item.productName,
      categoryId: 'smartphones',
      sizeVariants: [],
      colorVariants: [],
    } as unknown as Product);

  const policy = useMemo(() => {
    return getCategoryReturnPolicy(product.categoryId);
  }, [getCategoryReturnPolicy, product.categoryId]);

  const deliveryTime = order.deliveryProof?.timestamp || order.createdAt;
  const delivMs = new Date(deliveryTime).getTime();
  const windowDurationMs =
    policy.windowDays > 0 ? policy.windowDays * 86400000 : (policy.windowHours || 48) * 3600000;
  const closingTimeMs = delivMs + windowDurationMs;
  const isWithinWindow = Date.now() <= closingTimeMs;

  const defaultAction = policy.allowReplacement
    ? 'replacement'
    : policy.allowRefund
    ? 'refund'
    : 'exchange';
  const [requestType, setRequestType] = useState<'refund' | 'replacement' | 'exchange'>(
    defaultAction
  );
  const [reason, setReason] = useState<ReturnReasonCode>('damaged_in_transit');
  const [reasonDescription, setReasonDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [unboxingVideoUrl, setUnboxingVideoUrl] = useState('');
  const [unboxingVideoName, setUnboxingVideoName] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [conditionConfirmed, setConditionConfirmed] = useState(true);

  const availableSizes = product.sizeVariants?.map((s) => s.size) || ['S', 'M', 'L', 'XL'];
  const availableColors = product.colorVariants?.map((c) => c.name) || ['Default'];
  const [requestedSize, setRequestedSize] = useState(availableSizes[0] || 'M');
  const [requestedColor, setRequestedColor] = useState(availableColors[0] || 'Default');

  const [refundMethod, setRefundMethod] = useState<
    'wallet_credits' | 'original_payment' | 'bank_transfer_upi'
  >('wallet_credits');
  const [upiId, setUpiId] = useState('');

  const defaultAddressStr = `${order.customer.address}, ${order.customer.area}, ${order.customer.city} - ${order.customer.pincode}`;
  const [pickupAddress, setPickupAddress] = useState(defaultAddressStr);
  const [pickupSlot, setPickupSlot] = useState('Tomorrow 10:00 AM - 01:00 PM');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const itemTotal = item.unitPrice * (item.activeQuantity ?? item.quantity);
  const walletBonus =
    refundMethod === 'wallet_credits'
      ? Math.round(itemTotal * (policy.walletBonusPercentage / 100))
      : 0;

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUnboxingVideoUrl(URL.createObjectURL(file));
    setUnboxingVideoName(file.name);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    Array.from(files)
      .slice(0, 3 - evidenceImages.length)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (!dataUrl) return;
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 700;
            let width = img.width;
            let height = img.height;
            if (width > height && width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.72);
              setEvidenceImages((prev) => (prev.length < 3 ? [...prev, compressed] : prev));
            } else {
              setEvidenceImages((prev) => (prev.length < 3 ? [...prev, dataUrl] : prev));
            }
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isWithinWindow && policy.windowDays > 0) {
      setErrorMsg('The return/replacement window for this product has closed.');
      return;
    }

    if (!unboxingVideoName && !unboxingVideoUrl && evidenceImages.length === 0) {
      setErrorMsg(
        'Please upload the unboxing video or photo proof of the damaged product / issue.'
      );
      return;
    }

    if (refundMethod === 'bank_transfer_upi' && !upiId.trim()) {
      setErrorMsg('Please enter your UPI ID for the refund.');
      return;
    }

    setIsSubmitting(true);

    const res = submitReturnExchangeRequest({
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      outletId: order.outletId,
      outletName: order.outletName,
      customerId: order.customer.id || currentUser.id,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      customerEmail: order.customer.email,
      productId: item.productId,
      productName: item.productName,
      productSku: item.sku,
      productImage: item.image,
      categoryId: product.categoryId,
      categoryName: policy.categoryName,
      quantity: item.activeQuantity ?? item.quantity,
      itemUnitPrice: item.unitPrice,
      itemTotal,
      requestType,
      reason,
      reasonDescription:
        reasonDescription.trim() ||
        `Customer requested ${requestType} (${reason.replace(/_/g, ' ')})`,
      conditionChecklistConfirmed: conditionConfirmed,
      serialNumber: serialNumber.trim() || item.sku,
      unboxingVideoUrl: unboxingVideoUrl || undefined,
      unboxingVideoName: unboxingVideoName || undefined,
      evidenceImages: evidenceImages.length > 0 ? evidenceImages : undefined,
      exchangeOptions:
        requestType === 'exchange'
          ? {
              requestedSize,
              requestedColor,
              notes: `Exchange to Size: ${requestedSize}, Color: ${requestedColor}`,
            }
          : undefined,
      refundMethod,
      refundAmount: itemTotal,
      walletBonusAmount: walletBonus,
      bankUpiDetails:
        refundMethod === 'bank_transfer_upi'
          ? {
              upiId: upiId.trim(),
              accountHolderName: order.customer.name,
            }
          : undefined,
      deliveredAt: deliveryTime,
      pickupAddress: pickupAddress.trim(),
      pickupSlot,
    });

    setIsSubmitting(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] bg-slate-50 w-screen h-screen flex flex-col overflow-hidden"
    >
      {/* Clean Full-Screen Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900">Return / Replacement</h2>
              <p className="text-[11px] text-slate-500 font-mono">{order.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-5 pb-24 space-y-4 text-xs"
        >
          {/* Product Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <img
              src={item.image}
              alt={item.productName}
              className="w-14 h-14 object-contain rounded-lg bg-slate-50 border border-slate-200 shrink-0 p-1"
            />
            <div className="min-w-0 flex-1">
              <span className="font-mono text-[10px] text-slate-500 font-semibold block">
                SKU: {item.sku}
              </span>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate mt-0.5">
                {item.productName}
              </h3>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                Qty: {item.activeQuantity ?? item.quantity} • Total: {formatINR(itemTotal)}
              </p>
            </div>
          </div>

          {/* Step 1: Request Type */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <label className="font-bold text-slate-900 block">1. Select Request Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {policy.allowReplacement && (
                <button
                  type="button"
                  onClick={() => setRequestType('replacement')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                    requestType === 'replacement'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Replacement</span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      requestType === 'replacement' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    New sealed replacement unit
                  </p>
                </button>
              )}

              {policy.allowRefund && (
                <button
                  type="button"
                  onClick={() => setRequestType('refund')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                    requestType === 'refund'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return &amp; Refund</span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      requestType === 'refund' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Pickup &amp; refund payment
                  </p>
                </button>
              )}

              {policy.allowExchange && (
                <button
                  type="button"
                  onClick={() => setRequestType('exchange')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                    requestType === 'exchange'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Exchange</span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      requestType === 'exchange' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Swap size or color variant
                  </p>
                </button>
              )}
            </div>

            {requestType === 'exchange' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Replacement Size
                  </label>
                  <select
                    value={requestedSize}
                    onChange={(e) => setRequestedSize(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Replacement Color
                  </label>
                  <select
                    value={requestedColor}
                    onChange={(e) => setRequestedColor(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {availableColors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {requestType === 'refund' && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Refund Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('wallet_credits')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                      refundMethod === 'wallet_credits'
                        ? 'border-blue-600 bg-blue-50/50 text-slate-900 font-semibold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    JE Cash Wallet (+{formatINR(walletBonus)} Bonus)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMethod('bank_transfer_upi')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                      refundMethod === 'bank_transfer_upi'
                        ? 'border-blue-600 bg-blue-50/50 text-slate-900 font-semibold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    UPI / Bank Transfer
                  </button>
                </div>
                {refundMethod === 'bank_transfer_upi' && (
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Enter your UPI ID (e.g. name@upi)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                )}
              </div>
            )}
          </div>

          {/* Step 2: SKU / Serial Number & Issue Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <label className="font-bold text-slate-900 block">
              2. SKU / Serial Number &amp; Issue Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  SKU / Serial Number (if applicable)
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder={`SKU: ${item.sku} / Enter Serial or IMEI No.`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Issue Category *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReturnReasonCode)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-slate-900"
                >
                  <option value="damaged_in_transit">Damaged Product / Packaging</option>
                  <option value="defective_not_working">Defective / Item Not Working</option>
                  <option value="wrong_item_received">Wrong Item / Model Received</option>
                  <option value="missing_accessories">Missing Accessories / Parts</option>
                  <option value="size_fit_issue">Size / Fit Issue</option>
                  <option value="quality_not_as_expected">Quality Not as Expected</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Describe the Damage or Issue
              </label>
              <input
                type="text"
                value={reasonDescription}
                onChange={(e) => setReasonDescription(e.target.value)}
                placeholder="Briefly describe the issue..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Step 3: Upload Unboxing Video & Proof of Damage / Issue */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <label className="font-bold text-slate-900 block">
                3. Upload Unboxing Video &amp; Proof of Issue *
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Please upload the unboxing video showing the SKU / Serial number and photos of the damaged product or issue.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Unboxing Video */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    <span>Unboxing Video</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Show SKU / Serial No.</span>
                </div>

                {unboxingVideoName ? (
                  <div className="space-y-2">
                    {unboxingVideoUrl && (
                      <video
                        src={unboxingVideoUrl}
                        controls
                        className="w-full h-24 rounded-lg bg-slate-900 object-cover"
                      />
                    )}
                    <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="truncate font-medium text-slate-700">
                        {unboxingVideoName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUnboxingVideoUrl('');
                          setUnboxingVideoName('');
                        }}
                        className="text-rose-600 hover:text-rose-700 p-0.5 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 py-3.5 px-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-pointer transition-colors text-center">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-800">Upload Unboxing Video</span>
                    <span className="text-[10px] text-slate-400">
                      Show box label, SKU/Serial number &amp; product
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Proof of Damaged / Other Issue Photos */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-700" />
                    <span>Proof of Damage / Issue</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {evidenceImages.length}/3 Photos
                  </span>
                </div>

                {evidenceImages.length < 3 && (
                  <label className="flex flex-col items-center justify-center gap-1 py-3.5 px-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-pointer transition-colors text-center">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-800">Upload Damage / Issue Photo</span>
                    <span className="text-[10px] text-slate-400">
                      Clear photo of damage, serial sticker or issue
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {evidenceImages.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {evidenceImages.map((img, i) => (
                      <div
                        key={i}
                        className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0"
                      >
                        <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setEvidenceImages((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-slate-900/80 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Pickup Address & Slot */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <label className="font-bold text-slate-900 block">4. Pickup Address &amp; Time Slot</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Pickup Address
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Preferred Pickup Slot
                </label>
                <select
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Today 04:00 PM - 07:00 PM">Today (04:00 PM - 07:00 PM)</option>
                  <option value="Tomorrow 10:00 AM - 01:00 PM">
                    Tomorrow (10:00 AM - 01:00 PM)
                  </option>
                  <option value="Tomorrow 02:00 PM - 06:00 PM">
                    Tomorrow (02:00 PM - 06:00 PM)
                  </option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={conditionConfirmed}
                onChange={(e) => setConditionConfirmed(e.target.checked)}
                className="rounded text-slate-900 cursor-pointer"
                required
              />
              <span className="text-slate-600">
                Original box, tags, and accessories are kept ready for pickup verification.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isWithinWindow}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
