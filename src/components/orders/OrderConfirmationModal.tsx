import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { generateWhatsAppOrderMessage, getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import {
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  Package,
  QrCode,
  MapPin,
  MessageCircle,
  X,
} from 'lucide-react';

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

  const isAwaitingWhatsApp = order.orderStatus === 'awaiting_whatsapp_confirmation';

  const whatsappMessage = generateWhatsAppOrderMessage(order);
  const whatsappUrl = getWhatsAppClickToChatUrl(settings.whatsappNumber, whatsappMessage);

  const handlePrint = () => {
    setActiveModal('invoice');
  };

  const handleTrack = () => {
    setActiveModal('order_tracking');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-auto sm:my-6 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Order Receipt
            </span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 text-center space-y-3.5 sm:space-y-4 overflow-y-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            {isAwaitingWhatsApp ? (
              <Clock className="w-8 h-8 animate-pulse text-amber-600" />
            ) : (
              <CheckCircle2 className="w-8 h-8" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {isAwaitingWhatsApp
                ? 'Order Initiated via WhatsApp!'
                : 'Order Confirmed Successfully!'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {isAwaitingWhatsApp
                ? 'Please send the WhatsApp message to Javed Electronics Hazratganj store. We will confirm item allocation immediately.'
                : 'Thank you for shopping locally with Javed Electronics. Our local dispatch team is preparing your package.'}
            </p>
          </div>

          {/* Unique Order ID and Status Pill */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block w-full text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-bold text-slate-900 ml-1.5 text-sm">{order.id}</span>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <span className={`ml-1.5 font-bold uppercase text-[11px] px-2 py-0.5 rounded ${
                  isAwaitingWhatsApp ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {order.orderStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
              <span className="truncate">Customer: <strong>{order.customer.name}</strong></span>
              <span className="font-mono font-bold text-blue-700">{formatINR(order.finalTotal)}</span>
            </div>
          </div>

          {/* Dynamic Order QR Code */}
          {order.qrCodeDataUrl && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                Scan to Verify / Track on Smartphone
              </span>
              <img
                src={order.qrCodeDataUrl}
                alt="Order QR Code"
                className="w-36 h-36 bg-white p-1 rounded-lg border border-slate-200 shadow-xs"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1">
                Ref: {order.id}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Share or confirm on WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>Share Order on WhatsApp</span>
            </a>

            {/* Print Official Invoice */}
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print GST Tax Invoice</span>
            </button>
          </div>

          {/* Track order link */}
          <div className="pt-2">
            <button
              onClick={handleTrack}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Track Order Live Status Timeline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
