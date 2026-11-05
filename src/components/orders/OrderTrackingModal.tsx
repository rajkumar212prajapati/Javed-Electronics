import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { generateWhatsAppOrderMessage, getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import {
  X,
  ArrowLeft,
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Printer,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  PhoneCall,
  Camera,
  CheckCircle2,
  Video,
  Upload,
  Trash2,
} from 'lucide-react';
import { OrderStatus, OrderItem } from '../../types';
import { LiveOrderTrackingMap } from './LiveOrderTrackingMap';
import { cleanCustomerName } from '../../utils/cleaners';
import { ProductReturnExchangeModal } from './ProductReturnExchangeModal';

export const OrderTrackingModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    orders,
    selectedOrderForModal,
    setSelectedOrderForModal,
    settings,
    requestOrderCancellation,
    requestOrderReturn,
    getCategoryReturnPolicy,
    returnExchangeRequests,
    products,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnIssueType, setReturnIssueType] = useState<string>('damaged_in_transit');
  const [returnProductId, setReturnProductId] = useState<string>('');
  const [returnSerialNumber, setReturnSerialNumber] = useState<string>('');
  const [unboxingVideoUrl, setUnboxingVideoUrl] = useState<string>('');
  const [unboxingVideoName, setUnboxingVideoName] = useState<string>('');
  const [damageProofImages, setDamageProofImages] = useState<string[]>([]);
  const [returnFormError, setReturnFormError] = useState<string | null>(null);
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [showReturnBox, setShowReturnBox] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [viewingPodModal, setViewingPodModal] = useState<string | null>(null);
  const [selectedItemForReturn, setSelectedItemForReturn] = useState<OrderItem | null>(null);

  if (activeModal !== 'order_tracking') return null;

  const activeOrder = selectedOrderForModal || orders[0];

  const selectedReturnItem =
    activeOrder?.items.find((i) => i.productId === returnProductId) || activeOrder?.items[0];

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objUrl = URL.createObjectURL(file);
    setUnboxingVideoUrl(objUrl);
    setUnboxingVideoName(file.name);
    setReturnFormError(null);
  };

  const handleDamagePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setReturnFormError(null);

    Array.from(files)
      .slice(0, 3 - damageProofImages.length)
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
              setDamageProofImages((prev) =>
                prev.length < 3 ? [...prev, compressed] : prev
              );
            } else {
              setDamageProofImages((prev) =>
                prev.length < 3 ? [...prev, dataUrl] : prev
              );
            }
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === query ||
        o.customer.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
    );

    if (found) {
      setSelectedOrderForModal(found);
      setShowCancelBox(false);
      setShowReturnBox(false);
    }
  };

  const getStepProgress = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
      case 'payment_verifying':
      case 'awaiting_whatsapp_confirmation':
        return 1;
      case 'confirmed':
      case 'in_progress':
      case 'paid':
        return 2;
      case 'processing':
      case 'packed':
      case 'ready_for_pickup':
        return 3;
      case 'assigned_to_delivery':
      case 'out_for_delivery':
        return 4;
      case 'delivered':
        return 5;
      case 'cancelled':
      case 'return_requested':
      case 'returned':
      case 'refunded':
      case 'delivery_failed':
        return -1;
      default:
        return 2;
    }
  };

  const currentStep = activeOrder ? getStepProgress(activeOrder.orderStatus) : 1;

  const canCancel =
    activeOrder &&
    [
      'pending',
      'payment_verifying',
      'awaiting_whatsapp_confirmation',
      'confirmed',
      'in_progress',
      'payment_pending',
    ].includes(activeOrder.orderStatus);

  const canReturn =
    activeOrder &&
    activeOrder.orderStatus === 'delivered' &&
    new Date().getTime() - new Date(activeOrder.createdAt).getTime() <= 7 * 86400000;

  const handleCancelSubmit = () => {
    if (!activeOrder || !cancelReason.trim()) return;
    requestOrderCancellation(activeOrder.id, cancelReason);
    setShowCancelBox(false);
    setCancelReason('');
  };

  const handleReturnSubmit = () => {
    if (!activeOrder) return;
    if (!returnReason.trim()) {
      setReturnFormError('Please describe the damage or issue for your return request.');
      return;
    }
    if (!unboxingVideoName && !unboxingVideoUrl && damageProofImages.length === 0) {
      setReturnFormError(
        'Please upload the unboxing video or photo proof of the damaged product / issue.'
      );
      return;
    }

    setReturnFormError(null);
    requestOrderReturn(activeOrder.id, returnReason.trim(), {
      issueType: returnIssueType,
      productId: selectedReturnItem?.productId,
      productName: selectedReturnItem?.productName,
      sku: selectedReturnItem?.sku,
      serialNumber: returnSerialNumber.trim() || selectedReturnItem?.sku,
      unboxingVideoUrl: unboxingVideoUrl || undefined,
      unboxingVideoName: unboxingVideoName || undefined,
      proofImages: damageProofImages.length > 0 ? damageProofImages : undefined,
      requestType: 'replacement',
    });

    setShowReturnBox(false);
    setReturnReason('');
    setReturnSerialNumber('');
    setUnboxingVideoUrl('');
    setUnboxingVideoName('');
    setDamageProofImages([]);
  };

  const whatsappMessage = activeOrder ? generateWhatsAppOrderMessage(activeOrder) : '';
  const whatsappUrl = activeOrder
    ? getWhatsAppClickToChatUrl(settings.whatsappNumber, whatsappMessage)
    : '#';

  const getStatusLabel = (orderStatus: OrderStatus, paymentStatus?: string) => {
    if (paymentStatus === 'verifying' || orderStatus === 'payment_verifying') {
      return 'Verifying Payment';
    }
    if (orderStatus === 'in_progress') {
      return 'In Progress';
    }
    return orderStatus.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 w-screen h-screen flex flex-col overflow-hidden">
      {/* Full-Screen Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">Track Order</h1>
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

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 pb-24 sm:pb-12 space-y-4">
          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="bg-white p-3 rounded-xl border border-slate-200 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Order ID or Mobile Number"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>

          {activeOrder ? (
            <div className="space-y-4">
              {/* Order Summary Header Card */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {activeOrder.id}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md border ${
                          activeOrder.orderStatus === 'delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : activeOrder.orderStatus === 'payment_verifying' ||
                              activeOrder.paymentStatus === 'verifying'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : activeOrder.orderStatus === 'cancelled'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {getStatusLabel(activeOrder.orderStatus, activeOrder.paymentStatus)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Placed on{' '}
                      {new Date(activeOrder.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-bold font-mono text-slate-900 block">
                      {formatINR(activeOrder.finalTotal)}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {activeOrder.paymentMethod.replace(/_/g, ' ').toUpperCase()} •{' '}
                      {activeOrder.orderStatus === 'delivered' ||
                      activeOrder.paymentStatus === 'verified_paid'
                        ? 'Paid'
                        : activeOrder.paymentStatus === 'verifying'
                        ? 'Verifying'
                        : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* 5-Step Progress Tracker */}
                {currentStep > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="relative flex items-center justify-between px-1">
                      <div className="absolute left-2 right-2 top-3.5 h-0.5 bg-slate-200 z-0" />
                      <div
                        className="absolute left-2 top-3.5 h-0.5 bg-blue-600 transition-all duration-500 z-0"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((currentStep - 1) / 4) * 100))}%`,
                        }}
                      />

                      {[
                        { step: 1, label: 'Placed' },
                        { step: 2, label: 'Confirmed' },
                        { step: 3, label: 'Packed' },
                        { step: 4, label: 'On the Way' },
                        { step: 5, label: 'Delivered' },
                      ].map((s) => {
                        const isPassed = currentStep >= s.step;
                        return (
                          <div key={s.step} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                isPassed
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-slate-300 text-slate-400'
                              }`}
                            >
                              {isPassed ? <CheckCircle className="w-3.5 h-3.5" /> : s.step}
                            </div>
                            <span className="text-[10px] font-medium text-slate-600 mt-1 text-center">
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Clean Delivery Information Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Truck className="w-4 h-4 text-slate-600" />
                    <span>Delivery Details</span>
                  </div>

                  {activeOrder.orderStatus !== 'delivered' &&
                    (activeOrder.deliveryCode || activeOrder.dispatchDetails?.riderOtp) && (
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        PIN: {activeOrder.deliveryCode || activeOrder.dispatchDetails?.riderOtp}
                      </span>
                    )}
                </div>

                {activeOrder.dispatchDetails ? (
                  activeOrder.dispatchDetails.fulfillmentType === 'express_partner' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Courier Partner</span>
                        <span className="font-semibold text-slate-900">
                          {activeOrder.dispatchDetails.carrier}
                        </span>
                      </div>

                      {activeOrder.dispatchDetails.awbNumber && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Tracking Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              {activeOrder.dispatchDetails.awbNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(
                                  activeOrder.dispatchDetails?.awbNumber || ''
                                );
                                setCopiedAwb(true);
                                setTimeout(() => setCopiedAwb(false), 2000);
                              }}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              {copiedAwb ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {activeOrder.dispatchDetails.trackingUrl && (
                        <div className="sm:col-span-2 pt-1">
                          <a
                            href={activeOrder.dispatchDetails.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Track on {activeOrder.dispatchDetails.carrier}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Delivery Executive</span>
                          <span className="font-semibold text-slate-900">
                            {activeOrder.dispatchDetails.riderName || 'Ramesh Kumar'}
                          </span>
                        </div>

                        {activeOrder.dispatchDetails.riderPhone && (
                          <div>
                            <span className="text-slate-500 block text-[11px]">Contact</span>
                            <a
                              href={`tel:${activeOrder.dispatchDetails.riderPhone}`}
                              className="font-mono font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>{activeOrder.dispatchDetails.riderPhone}</span>
                            </a>
                          </div>
                        )}

                        {activeOrder.dispatchDetails.riderVehicleNo && (
                          <div>
                            <span className="text-slate-500 block text-[11px]">Vehicle</span>
                            <span className="font-mono font-semibold text-slate-800 uppercase">
                              {activeOrder.dispatchDetails.riderVehicleNo.replace(/^UP\s*32/i, 'MH 48')}
                            </span>
                          </div>
                        )}
                      </div>

                      {activeOrder.orderStatus === 'delivered' && activeOrder.deliveryProof && (
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Delivered • Received by{' '}
                              <strong className="text-slate-900">
                                {cleanCustomerName(
                                  activeOrder.deliveryProof.receiverName || activeOrder.customer.name
                                )}
                              </strong>
                            </span>
                          </div>

                          {activeOrder.deliveryProof.podImageUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setViewingPodModal(activeOrder.deliveryProof?.podImageUrl || null)
                              }
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>View Delivery Photo</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      {activeOrder.deliveryType === 'store_pickup'
                        ? `Store Pickup: ${settings.address}`
                        : `Delivering to: ${activeOrder.customer.address}, ${activeOrder.customer.area} (${activeOrder.customer.pincode})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Live Map (Only when order is actively out for delivery or assigned) */}
              {activeOrder.deliveryType === 'delivery' &&
                ['assigned_to_delivery', 'out_for_delivery'].includes(activeOrder.orderStatus) && (
                  <LiveOrderTrackingMap
                    order={activeOrder}
                    onWhatsAppHelp={() => {
                      const msg = `Hi Javed Electronics, I need assistance with Order #${activeOrder.id}`;
                      window.open(getWhatsAppClickToChatUrl(settings.whatsappNumber, msg), '_blank');
                    }}
                  />
                )}

              {/* Clean Order Items Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Order Items ({activeOrder.items.length})
                </h2>

                <div className="divide-y divide-slate-100">
                  {activeOrder.items.map((item, idx) => {
                    const activeQty =
                      item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
                    const isZero = activeQty === 0;
                    const matchedProduct = products.find((p) => p.id === item.productId);
                    const categoryId = matchedProduct?.categoryId || 'clothing';
                    const policy = getCategoryReturnPolicy(categoryId);
                    const isDelivered = activeOrder.orderStatus === 'delivered';

                    const existingRequest = returnExchangeRequests.find(
                      (r) => r.orderId === activeOrder.id && r.productId === item.productId
                    );

                    return (
                      <div
                        key={idx}
                        className={`py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-3 ${
                          isZero ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-semibold text-slate-900 truncate ${
                                isZero ? 'line-through' : ''
                              }`}
                            >
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Qty: {activeQty} × {formatINR(item.unitPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {formatINR(activeQty * item.unitPrice)}
                          </span>

                          {existingRequest ? (
                            <button
                              type="button"
                              onClick={() => setSelectedItemForReturn(item)}
                              className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                            >
                              {existingRequest.status.replace(/_/g, ' ')}
                            </button>
                          ) : isDelivered && policy.policyType !== 'non_returnable' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedItemForReturn(item)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              Return / Exchange
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown Summary */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatINR(activeOrder.subtotal)}</span>
                  </div>
                  {activeOrder.prepaidDiscount && activeOrder.prepaidDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Prepaid Order Discount</span>
                      <span className="font-mono">-{formatINR(activeOrder.prepaidDiscount)}</span>
                    </div>
                  )}
                  {activeOrder.codExtraCharge && activeOrder.codExtraCharge > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>COD Extra Charge</span>
                      <span className="font-mono">+{formatINR(activeOrder.codExtraCharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-100 text-sm">
                    <span>Total</span>
                    <span className="font-mono">{formatINR(activeOrder.finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Clean Status History */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Status Timeline
                </h2>
                <div className="space-y-2.5 border-l-2 border-slate-200 ml-2 pl-4 text-xs">
                  {activeOrder.statusHistory.map((hist, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 uppercase text-[11px]">
                          {hist.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(hist.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {hist.note && <p className="text-slate-600 text-[11px] mt-0.5">{hist.note}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation Form */}
              {showCancelBox && (
                <div className="p-4 bg-white border border-rose-200 rounded-xl space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 block">
                    Cancel Order
                  </span>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowCancelBox(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCancelSubmit}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Confirm Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Submitted Return / Replacement Details */}
              {activeOrder.returnDetails && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      Return / Replacement Request Submitted
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase">
                      Under Review
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Issue / Reason</span>
                      <span className="font-semibold text-slate-900">
                        {activeOrder.returnDetails.reason}
                      </span>
                    </div>
                    {(activeOrder.returnDetails.sku || activeOrder.returnDetails.serialNumber) && (
                      <div>
                        <span className="text-[11px] text-slate-400 block">SKU / Serial Number</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {[activeOrder.returnDetails.sku, activeOrder.returnDetails.serialNumber]
                            .filter(Boolean)
                            .join(' • ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(activeOrder.returnDetails.unboxingVideoName ||
                      activeOrder.returnDetails.unboxingVideoUrl) && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium">
                        <Video className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Unboxing Video: {activeOrder.returnDetails.unboxingVideoName || 'Attached'}
                        </span>
                      </span>
                    )}

                    {activeOrder.returnDetails.proofImages &&
                      activeOrder.returnDetails.proofImages.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {activeOrder.returnDetails.proofImages.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Issue proof"
                              onClick={() => setViewingPodModal(img)}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 cursor-pointer"
                            />
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Clean Return / Replacement Form */}
              {showReturnBox && (
                <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">
                        Request Return / Replacement
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Upload unboxing video (showing SKU/Serial number) &amp; proof of damage or issue
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReturnBox(false);
                        setReturnFormError(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product & SKU / Serial Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Select Product
                      </label>
                      <select
                        value={selectedReturnItem?.productId || ''}
                        onChange={(e) => setReturnProductId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900"
                      >
                        {activeOrder.items.map((it) => (
                          <option key={it.productId} value={it.productId}>
                            {it.productName} ({it.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        SKU / Serial Number (if applicable)
                      </label>
                      <input
                        type="text"
                        value={returnSerialNumber}
                        onChange={(e) => setReturnSerialNumber(e.target.value)}
                        placeholder={`SKU: ${selectedReturnItem?.sku || 'Enter Serial / IMEI No.'}`}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  {/* Issue Type & Reason */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Issue Type
                      </label>
                      <select
                        value={returnIssueType}
                        onChange={(e) => setReturnIssueType(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900"
                      >
                        <option value="damaged_in_transit">Damaged Product / Packaging</option>
                        <option value="defective_not_working">Defective / Not Working</option>
                        <option value="wrong_item_received">Wrong Item / Model Received</option>
                        <option value="missing_accessories">Missing Parts / Accessories</option>
                        <option value="other">Other Issue</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Reason for Return *
                      </label>
                      <input
                        type="text"
                        value={returnReason}
                        onChange={(e) => {
                          setReturnReason(e.target.value);
                          setReturnFormError(null);
                        }}
                        placeholder="Describe the damage or issue"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  {/* Upload Unboxing Video & Damage / Issue Proof */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. Unboxing Video Upload */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Unboxing Video</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Show SKU / Serial No.
                        </span>
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
                          <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
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
                        <label className="flex flex-col items-center justify-center gap-1 py-3 px-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-pointer transition-colors text-center">
                          <Upload className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-800">
                            Upload Unboxing Video
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Clearly show label, SKU/Serial number &amp; product
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

                    {/* 2. Proof of Damaged or Other Issue (Photos) */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                          <span>Proof of Damage / Issue</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {damageProofImages.length}/3 Photos
                        </span>
                      </div>

                      {damageProofImages.length < 3 && (
                        <label className="flex flex-col items-center justify-center gap-1 py-3 px-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-pointer transition-colors text-center">
                          <Upload className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-800">
                            Upload Damage / Issue Photo
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Photo of damaged part, serial sticker or defect
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleDamagePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}

                      {damageProofImages.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          {damageProofImages.map((img, i) => (
                            <div
                              key={i}
                              className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0"
                            >
                              <img src={img} alt="Proof" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() =>
                                  setDamageProofImages((prev) =>
                                    prev.filter((_, idx) => idx !== i)
                                  )
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

                  {returnFormError && (
                    <p className="text-xs font-semibold text-rose-600">{returnFormError}</p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReturnBox(false);
                        setReturnFormError(null);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleReturnSubmit}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Submit Request
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <button
                    onClick={() => setActiveModal('invoice')}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Help / Support</span>
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  {canCancel && !showCancelBox && (
                    <button
                      onClick={() => setShowCancelBox(true)}
                      className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}

                  {canReturn && !showReturnBox && (
                    <button
                      onClick={() => setShowReturnBox(true)}
                      className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Return Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
              No order found matching your search. Please check the Order ID.
            </div>
          )}
        </div>
      </main>

      {/* Delivery Photo Preview Modal */}
      {viewingPodModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Delivery Photo</span>
              <button
                type="button"
                onClick={() => setViewingPodModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={viewingPodModal}
                alt="Proof of delivery"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Product Return / Exchange Modal */}
      {selectedItemForReturn && activeOrder && (
        <ProductReturnExchangeModal
          order={activeOrder}
          item={selectedItemForReturn}
          isOpen={!!selectedItemForReturn}
          onClose={() => setSelectedItemForReturn(null)}
        />
      )}
    </div>
  );
};
