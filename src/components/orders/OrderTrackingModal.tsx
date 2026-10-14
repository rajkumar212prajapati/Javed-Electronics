import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { generateWhatsAppOrderMessage, getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Printer,
  RotateCcw,
  AlertTriangle,
  MessageCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { OrderStatus } from '../../types';

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
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [showReturnBox, setShowReturnBox] = useState(false);

  if (activeModal !== 'order_tracking') return null;

  // Active tracked order: either passed in selectedOrderForModal or searched
  const activeOrder = selectedOrderForModal || orders[0];

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
      case 'awaiting_whatsapp_confirmation':
        return 1;
      case 'confirmed':
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
    ['pending', 'awaiting_whatsapp_confirmation', 'confirmed', 'payment_pending'].includes(
      activeOrder.orderStatus
    );

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
    if (!activeOrder || !returnReason.trim()) return;
    requestOrderReturn(activeOrder.id, returnReason);
    setShowReturnBox(false);
    setReturnReason('');
  };

  const whatsappMessage = activeOrder ? generateWhatsAppOrderMessage(activeOrder) : '';
  const whatsappUrl = activeOrder
    ? getWhatsAppClickToChatUrl(settings.whatsappNumber, whatsappMessage)
    : '#';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-auto sm:my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Track Local Order</h2>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-white shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Order ID (e.g. JE-2026-000101) or Mobile"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
            >
              Lookup
            </button>
          </form>
        </div>

        {/* Content */}
        {activeOrder ? (
          <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 sm:space-y-6">
            {/* Top Order Summary Card */}
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">{activeOrder.id}</span>
                  <span
                    className={`text-[9px] sm:text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      activeOrder.orderStatus === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeOrder.orderStatus === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {activeOrder.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Placed on {new Date(activeOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="text-left sm:text-right pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <span className="text-sm sm:text-base font-bold font-mono text-slate-900">
                  {formatINR(activeOrder.finalTotal)}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 block">
                  {activeOrder.paymentMethod.replace(/_/g, ' ').toUpperCase()} (
                  {activeOrder.paymentStatus === 'verified_paid' ? 'Paid' : 'Pending'})
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            {currentStep > 0 && (
              <div className="py-2">
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 sm:mb-4">
                  Order Status Progression
                </h4>

                <div className="relative flex items-center justify-between px-1">
                  {/* Background progress track */}
                  <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
                  <div
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 z-0"
                    style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / 4) * 100))}%` }}
                  />

                  {/* Step dots */}
                  {[
                    { step: 1, label: 'Placed', shortLabel: 'Placed' },
                    { step: 2, label: 'Confirmed', shortLabel: 'Conf.' },
                    { step: 3, label: 'Packed', shortLabel: 'Packed' },
                    { step: 4, label: 'Out for Delivery', shortLabel: 'Dispatched' },
                    { step: 5, label: 'Delivered', shortLabel: 'Delivered' },
                  ].map((s) => {
                    const isPassed = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;

                    return (
                      <div key={s.step} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white ring-3 ring-blue-100 shadow-sm'
                              : isPassed
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isPassed ? <CheckCircle className="w-3.5 h-3.5" /> : s.step}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 mt-1 text-center max-w-[48px] sm:max-w-none leading-tight">
                          <span className="sm:hidden">{s.shortLabel}</span>
                          <span className="hidden sm:inline whitespace-nowrap">{s.label}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Assignment Detail */}
            {activeOrder.deliveryStaffName && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-700" />
                  <span>
                    Assigned Local Delivery Rider: <strong>{activeOrder.deliveryStaffName}</strong>
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-blue-800">Lucknow Express Dispatch</span>
              </div>
            )}

            {/* Items Summary */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Order Items ({activeOrder.items.length})
              </h4>
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 divide-y divide-slate-100">
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between gap-3 ${idx > 0 ? 'pt-2' : ''}`}>
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.productName} className="w-10 h-10 object-cover rounded bg-slate-100" />
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">{item.productName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">Qty: {item.quantity} × {formatINR(item.unitPrice)}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900">{formatINR(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Audit Trail & Status History
              </h4>
              <div className="space-y-2 border-l-2 border-blue-200 ml-2 pl-4 text-xs">
                {activeOrder.statusHistory.map((hist, idx) => (
                  <div key={idx} className="relative pb-2">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 uppercase text-[11px]">
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
                    <span className="text-[10px] text-slate-400">By: {hist.updatedBy}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancellation Form */}
            {showCancelBox && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-rose-900 block">
                  Confirm Order Cancellation
                </span>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation (e.g. Ordered by mistake)"
                  className="w-full p-2 text-xs border border-rose-300 rounded bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCancelBox(false)}
                    className="px-3 py-1 text-xs text-slate-600 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCancelSubmit}
                    className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    Confirm Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Return Request Form */}
            {showReturnBox && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-900 block">
                  Request 7-Day Replacement / Return
                </span>
                <p className="text-[11px] text-amber-800">
                  Item must include original brand box, charger, warranty card and invoice.
                </p>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Reason for return / defect description"
                  className="w-full p-2 text-xs border border-amber-300 rounded bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowReturnBox(false)}
                    className="px-3 py-1 text-xs text-slate-600 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleReturnSubmit}
                    className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    Submit Return Request
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-200 w-full min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Store</span>
                </a>

                <button
                  onClick={() => setActiveModal('invoice')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canCancel && !showCancelBox && (
                  <button
                    onClick={() => setShowCancelBox(true)}
                    className="w-full sm:w-auto px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer text-center"
                  >
                    Cancel Order
                  </button>
                )}

                {canReturn && !showReturnBox && (
                  <button
                    onClick={() => setShowReturnBox(true)}
                    className="w-full sm:w-auto px-3 py-1.5 text-amber-700 hover:bg-amber-50 border border-amber-300 rounded-lg text-xs font-semibold cursor-pointer text-center"
                  >
                    Request Replacement
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No order found matching your search. Please check the Order ID.
          </div>
        )}
      </div>
    </div>
  );
};
