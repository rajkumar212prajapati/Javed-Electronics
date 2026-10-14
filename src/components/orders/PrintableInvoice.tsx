import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR, numberToIndianWords, calculateTaxBreakdown } from '../../utils/currency';
import { Printer, X, Download } from 'lucide-react';

export const PrintableInvoice: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedOrderForModal,
    settings,
  } = useStore();

  if (activeModal !== 'invoice' || !selectedOrderForModal) {
    return null;
  }

  const order = selectedOrderForModal;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-300 relative my-6 print:shadow-none print:border-none print:my-0">
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Tax Invoice Preview • {order.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Page Canvas */}
        <div className="p-3.5 sm:p-6 md:p-8 text-slate-900 text-xs bg-white w-full max-w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-4 gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                {settings.storeName.toUpperCase()}
              </h1>
              <p className="text-[11px] text-slate-600 font-medium">{settings.tagline}</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-sm">
                {settings.address}, {settings.city}, {settings.state} - {settings.pincode}
              </p>
              <p className="text-[11px] text-slate-600">
                Helpline: {settings.phone} | WhatsApp: +{settings.whatsappNumber}
              </p>
              <p className="text-[11px] font-bold text-slate-900 mt-1">
                GSTIN: <span className="font-mono">{settings.gstin}</span>
              </p>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
              <div className="inline-block bg-slate-900 text-white font-bold text-[11px] sm:text-xs uppercase px-2.5 py-1 rounded">
                TAX INVOICE
              </div>
              <div className="mt-1.5 text-xs">
                <span className="text-slate-500">Invoice No: </span>
                <span className="font-mono font-bold text-slate-900">{order.invoiceNumber}</span>
              </div>
              <div className="text-xs">
                <span className="text-slate-500">Date: </span>
                <span className="font-medium">{invoiceDate}</span>
              </div>
              <div className="text-xs">
                <span className="text-slate-500">Order ID: </span>
                <span className="font-mono font-bold">{order.id}</span>
              </div>
            </div>
          </div>

          {/* Billed To / Shipped To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-4 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                Customer Details (Billed To)
              </h4>
              <p className="font-bold text-slate-900 text-xs sm:text-sm">{order.customer.name}</p>
              <p className="text-slate-600">Phone: {order.customer.phone}</p>
              {order.customer.email && <p className="text-slate-600">Email: {order.customer.email}</p>}
            </div>

            <div>
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                Delivery Address (Shipped To)
              </h4>
              <p className="text-slate-700 leading-snug">
                {order.customer.address}
                {order.customer.landmark && `, Near ${order.customer.landmark}`}
                <br />
                {order.customer.area}, {order.customer.city} - {order.customer.pincode}
              </p>
              <p className="text-slate-500 text-[10px] mt-1">
                Mode: {order.deliveryType === 'store_pickup' ? 'Store Pickup' : 'Local Courier'}
              </p>
            </div>
          </div>

          {/* Itemized Table - wrapped in horizontal scroll so it never breaks layout */}
          <div className="overflow-x-auto w-full max-w-full box-border mt-4">
            <table className="w-full border-collapse min-w-[460px]">
              <thead>
                <tr className="border-b-2 border-slate-800 bg-slate-50 text-[11px] font-bold uppercase text-slate-700">
                  <th className="py-2 px-2 text-left w-8">#</th>
                  <th className="py-2 px-2 text-left">Item Description & Brand</th>
                  <th className="py-2 px-2 text-left">SKU</th>
                  <th className="py-2 px-2 text-center w-12">Qty</th>
                  <th className="py-2 px-2 text-right">Unit Price</th>
                  <th className="py-2 px-2 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, index) => (
                  <tr key={index} className="text-xs">
                    <td className="py-2.5 px-2 text-slate-500">{index + 1}</td>
                    <td className="py-2.5 px-2">
                      <span className="font-bold text-slate-900">{item.productName}</span>
                      {item.variant && (
                        <span className="block text-[11px] text-slate-500">Variant: {item.variant}</span>
                      )}
                      <span className="text-[10px] text-slate-400 block">
                        Brand: {item.brand} | GST: {item.gstRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-slate-600">{item.sku}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{formatINR(item.unitPrice)}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Summary & Tax Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4 pt-4 border-t-2 border-slate-800">
            {/* Left: Tax Details & Amount in Words & QR */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Amount in Words:
                </span>
                <span className="font-semibold text-slate-900 italic">
                  {numberToIndianWords(order.finalTotal)}
                </span>
              </div>

              {/* Tax Breakup Table */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px]">
                <div className="font-bold text-slate-700 uppercase mb-1">
                  Tax Breakup (Intra-State Lucknow GST)
                </div>
                <div className="flex justify-between">
                  <span>CGST (9.0%):</span>
                  <span className="font-mono">{formatINR(order.taxAmount / 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (9.0%):</span>
                  <span className="font-mono">{formatINR(order.taxAmount / 2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-0.5 mt-0.5">
                  <span>Total Tax Included:</span>
                  <span className="font-mono">{formatINR(order.taxAmount)}</span>
                </div>
              </div>

              {/* Verification QR */}
              {order.qrCodeDataUrl && (
                <div className="flex items-center gap-3 pt-2">
                  <img src={order.qrCodeDataUrl} alt="QR" className="w-16 h-16 border border-slate-200 shrink-0" />
                  <div className="text-[10px] text-slate-500">
                    <span className="font-bold text-slate-800 block">Digitally Verified Invoice</span>
                    Scan QR code to verify authenticity or view warranty records.
                  </div>
                </div>
              )}
            </div>

            {/* Right: Totals */}
            <div className="space-y-1.5 text-xs text-left sm:text-right border-t sm:border-t-0 border-slate-200 pt-3 sm:pt-0">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatINR(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({order.couponCode || 'Promo'}):</span>
                  <span className="font-mono">-{formatINR(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges:</span>
                <span className="font-mono">
                  {order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t-2 border-slate-800 pt-2">
                <span>Final Payable:</span>
                <span className="font-mono text-blue-800">{formatINR(order.finalTotal)}</span>
              </div>

              <div className="pt-2 text-[11px] text-slate-600">
                <span>Payment Mode: </span>
                <span className="font-bold uppercase">{order.paymentMethod.replace(/_/g, ' ')}</span>
                <span className="ml-1 sm:ml-2">({order.paymentStatus === 'verified_paid' ? 'PAID' : 'PENDING'})</span>
              </div>
            </div>
          </div>

          {/* Terms & Warranty Note */}
          <div className="mt-6 sm:mt-8 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Terms & Conditions:</p>
              <p>1. Goods once sold carry official brand manufacturer warranty.</p>
              <p>2. Physical damage or water damage is not covered under warranty.</p>
              <p>3. 7-Day replacement valid with original packaging and invoice.</p>
            </div>

            <div className="text-right flex flex-col justify-end">
              <p className="font-bold text-slate-900">For JAVED ELECTRONICS</p>
              <div className="h-10"></div>
              <p className="border-t border-slate-400 inline-block ml-auto pt-1 font-semibold text-slate-700">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
