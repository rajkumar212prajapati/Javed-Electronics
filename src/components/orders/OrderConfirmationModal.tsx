import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { generateWhatsAppOrderMessage, getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import {
  CheckCircle2,
  Clock,
  Printer,
  Package,
  QrCode,
  MessageCircle,
  X,
  ArrowLeft,
} from 'lucide-react';
import { cleanCustomerName } from '../../utils/cleaners';

export const OrderConfirmationModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedOrderForModal,
    settings,
  } = useStore();

  if (activeModal !== 'order_confirmation' || !selectedOrderForModal) {
    return null;
  }

  const order = selectedOrderForModal;
  const isVerifying =
    order.paymentStatus === 'verifying' || order.orderStatus === 'payment_verifying';
  const isInProgress = order.orderStatus === 'in_progress';

  const whatsappMessage = generateWhatsAppOrderMessage(order);
  const whatsappUrl = getWhatsAppClickToChatUrl(settings.whatsappNumber, whatsappMessage);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 w-screen h-screen flex flex-col overflow-hidden">
      {/* Full-Screen Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Done</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">Order Confirmation</h1>
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

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 pb-24 sm:pb-12 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-center space-y-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                isVerifying
                  ? 'bg-amber-100 text-amber-600'
                  : isInProgress
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {isVerifying ? (
                <Clock className="w-7 h-7 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-7 h-7" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isVerifying
                  ? 'Verifying Payment'
                  : isInProgress
                  ? 'Order In Progress'
                  : 'Order Confirmed'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {isVerifying
                  ? 'Payment screenshot received. Your order will move to In Progress once approved.'
                  : 'Thank you for your order with Javed Electronics.'}
              </p>
            </div>

            {/* Order Summary Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-bold text-slate-900 ml-1.5 text-sm">
                    {order.id}
                  </span>
                </div>
                <span
                  className={`font-bold uppercase text-[10px] px-2.5 py-0.5 rounded-md border ${
                    isVerifying
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : isInProgress
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {isVerifying
                    ? 'Verifying Payment'
                    : isInProgress
                    ? 'In Progress'
                    : order.orderStatus.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span>Customer</span>
                <span className="font-semibold text-slate-900">
                  {cleanCustomerName(order.customer.name)}
                </span>
              </div>

              {order.prepaidDiscount && order.prepaidDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Prepaid Discount</span>
                  <span className="font-mono font-semibold">-{formatINR(order.prepaidDiscount)}</span>
                </div>
              )}

              {order.codExtraCharge && order.codExtraCharge > 0 && (
                <div className="flex items-center justify-between text-amber-800">
                  <span>COD Extra Charge</span>
                  <span className="font-mono font-semibold">+{formatINR(order.codExtraCharge)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="font-mono">{formatINR(order.finalTotal)}</span>
              </div>

              {order.paymentDetails?.screenshotUrl && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={order.paymentDetails.screenshotUrl}
                      alt="Payment Proof"
                      className="w-8 h-8 object-cover rounded border border-slate-200"
                    />
                    <span className="font-medium text-slate-700">
                      Payment Screenshot Submitted
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700">
                    Under Review
                  </span>
                </div>
              )}

              {order.isPartialPrepaidCod && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>Partial Prepaid</span>
                    <span className="font-mono">{formatINR(order.partialPrepaidAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Pay on Delivery (COD)</span>
                    <span className="font-mono">{formatINR(order.codBalanceOnDelivery || 0)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Order QR Code */}
            {order.qrCodeDataUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl inline-flex flex-col items-center">
                <img
                  src={order.qrCodeDataUrl}
                  alt="Order QR"
                  className="w-28 h-28 bg-white p-1 rounded-lg border border-slate-200"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1">{order.id}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal('order_tracking')}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Track Order</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('invoice')}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>

            <div className="pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Inform Hub for Faster Dispatch</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
