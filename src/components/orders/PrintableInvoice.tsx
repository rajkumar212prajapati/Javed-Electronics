import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR, numberToIndianWords } from '../../utils/currency';
import { Printer, X, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';

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

  const isB2B = !!order.isB2BOrder || !!order.customer.gstin;
  const isInterState = order.placeOfSupply ? !order.placeOfSupply.includes('09') && !order.placeOfSupply.toLowerCase().includes('uttar pradesh') : false;

  const supplierGstin = settings.gstin || '09AAAFJ1234F1Z8';
  const supplierPan = settings.gstPanNumber || (supplierGstin.length >= 12 ? supplierGstin.slice(2, 12) : 'AAAFJ1234F');
  const supplierLegalName = settings.gstLegalBusinessName || 'JAVED ELECTRONICS PRIVATE LIMITED';
  const supplierTradeName = settings.gstTradeName || settings.storeName || 'Javed Electronics Lucknow Hub';

  const taxableAmount = order.taxableAmount || (order.finalTotal - order.taxAmount);
  const cgstAmount = order.cgstAmount ?? (isInterState ? 0 : Math.round((order.taxAmount / 2) * 100) / 100);
  const sgstAmount = order.sgstAmount ?? (isInterState ? 0 : Math.round((order.taxAmount / 2) * 100) / 100);
  const igstAmount = order.igstAmount ?? (isInterState ? order.taxAmount : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-300 relative my-6 print:shadow-none print:border-none print:my-0">
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2 min-w-0">
            <Printer className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider truncate">
              {isB2B ? 'B2B GST Tax Invoice' : 'Retail Tax Invoice'} • {order.invoiceNumber}
            </span>
            {isB2B && (
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] uppercase shrink-0">
                Input Tax Credit (ITC)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4" />
              <span>Close Preview</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Page Canvas */}
        <div className="p-4 sm:p-7 md:p-9 text-slate-900 text-xs bg-white w-full max-w-full overflow-hidden box-border font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {supplierTradeName.toUpperCase()}
                </h1>
              </div>
              <p className="text-[11px] font-bold text-slate-700 mt-0.5">{supplierLegalName}</p>
              <p className="text-[11px] text-slate-600 mt-0.5 max-w-md">
                {settings.address}, {settings.city}, {settings.state} - {settings.pincode}
              </p>
              <p className="text-[11px] text-slate-600">
                Helpline: {settings.phone} | Email: {settings.email}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-mono mt-1 pt-1 border-t border-slate-200">
                <span>
                  <strong>GSTIN:</strong> <span className="font-bold text-slate-900">{supplierGstin}</span>
                </span>
                <span>
                  <strong>PAN:</strong> {supplierPan}
                </span>
                <span>
                  <strong>State:</strong> 09 - Uttar Pradesh
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200 shrink-0">
              <div className="inline-block bg-slate-900 text-white font-extrabold text-[11px] sm:text-xs uppercase px-3 py-1 rounded shadow-xs">
                {isB2B ? 'B2B TAX INVOICE (ITC)' : 'TAX INVOICE'}
              </div>
              <div className="mt-2 text-xs space-y-0.5">
                <div>
                  <span className="text-slate-500">Invoice No: </span>
                  <span className="font-mono font-bold text-slate-900">{order.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">Invoice Date: </span>
                  <span className="font-semibold text-slate-800">{invoiceDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">Order ID: </span>
                  <span className="font-mono font-bold text-slate-700">{order.id}</span>
                </div>
                <div>
                  <span className="text-slate-500">Reverse Charge (RCM): </span>
                  <span className="font-bold text-slate-800">No</span>
                </div>
                {order.eWayBillNumber && (
                  <div className="text-blue-800 font-mono font-bold text-[11px]">
                    <span>E-Way Bill: </span>
                    <span>{order.eWayBillNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billed To / Shipped To Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-4 border-b border-slate-200 text-xs">
            {/* Customer Details */}
            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customer Details (Billed To)</span>
                </h4>
                {isB2B && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    B2B Registered
                  </span>
                )}
              </div>

              <p className="font-extrabold text-slate-900 text-sm">
                {order.b2bBusinessName || order.customer.businessName || order.customer.name}
              </p>
              {isB2B && order.customer.name !== order.customer.businessName && (
                <p className="text-slate-600 text-[11px]">Contact: {order.customer.name}</p>
              )}
              <p className="text-slate-600 text-[11px]">Phone: {order.customer.phone}</p>
              {order.customer.email && <p className="text-slate-600 text-[11px]">Email: {order.customer.email}</p>}

              {/* B2B GSTIN & POS */}
              {isB2B && (
                <div className="mt-2 pt-1.5 border-t border-slate-200 text-[11px] font-mono space-y-0.5 bg-white p-2 rounded border border-blue-200">
                  <div className="text-blue-900">
                    <strong>Recipient GSTIN: </strong>
                    <span className="font-bold">{order.b2bGstin || order.customer.gstin}</span>
                  </div>
                  <div className="text-slate-700">
                    <strong>Place of Supply (POS): </strong>
                    <span>{order.placeOfSupply || '09 - Uttar Pradesh'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Shipped To */}
            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 mb-1.5">
                Delivery Address (Shipped To)
              </h4>
              <p className="text-slate-800 leading-snug font-medium">
                {order.customer.address}
                {order.customer.landmark && `, Near ${order.customer.landmark}`}
                <br />
                {order.customer.area}, {order.customer.city} - {order.customer.pincode}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                <div>
                  State: <strong>{order.customer.state || 'Uttar Pradesh'}</strong>
                </div>
                <div>
                  Dispatch Mode: <strong>{order.deliveryType === 'store_pickup' ? 'Store Counter Pickup' : 'Express Doorstep Courier'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Goods & Services Table */}
          <div className="overflow-x-auto w-full max-w-full box-border mt-4">
            <table className="w-full border-collapse min-w-[560px] text-left">
              <thead>
                <tr className="border-b-2 border-slate-800 bg-slate-100 text-[10px] sm:text-[11px] font-bold uppercase text-slate-700">
                  <th className="py-2.5 px-2 w-8">#</th>
                  <th className="py-2.5 px-2">Description of Goods</th>
                  <th className="py-2.5 px-2">HSN / SAC</th>
                  <th className="py-2.5 px-2 text-center w-12">Qty</th>
                  <th className="py-2.5 px-2 text-right">Taxable Value</th>
                  <th className="py-2.5 px-2 text-center">GST Rate</th>
                  {isInterState ? (
                    <th className="py-2.5 px-2 text-right">IGST (₹)</th>
                  ) : (
                    <>
                      <th className="py-2.5 px-2 text-right">CGST (₹)</th>
                      <th className="py-2.5 px-2 text-right">SGST (₹)</th>
                    </>
                  )}
                  <th className="py-2.5 px-2 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {order.items.map((item, index) => {
                  const itemGst = item.gstRate || 18;
                  const itemTaxable = item.taxableValue || Math.round((item.total / (1 + itemGst / 100)) * 100) / 100;
                  const itemTax = Math.round((item.total - itemTaxable) * 100) / 100;
                  const cgst = item.cgstAmount ?? Math.round((itemTax / 2) * 100) / 100;
                  const sgst = item.sgstAmount ?? Math.round((itemTax - cgst) * 100) / 100;
                  const igst = item.igstAmount ?? itemTax;

                  const activeQty = item.activeQuantity !== undefined ? item.activeQuantity : item.quantity;
                  const hasCancelled = (item.cancelledQuantity || 0) > 0;
                  const isZero = activeQty === 0;

                  return (
                    <tr key={index} className={`hover:bg-slate-50/50 ${isZero ? 'opacity-60 bg-slate-50/40' : ''}`}>
                      <td className="py-2 px-2 text-slate-500 font-mono">{index + 1}</td>
                      <td className="py-2 px-2">
                        <span className={`font-bold block leading-tight ${isZero ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {item.productName}
                        </span>
                        {item.variant && (
                          <span className="text-[10px] text-slate-500 block">Variant: {item.variant}</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          SKU: {item.sku} | Brand: {item.brand}
                        </span>
                        {hasCancelled && (
                          <span className="text-[9px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-semibold inline-block mt-0.5 border border-rose-200">
                            {isZero ? 'Item Cancelled' : 'Partially Adjusted'}: {item.cancelledQuantity} unit(s) ({item.cancellationReason ? item.cancellationReason.replace('_', ' ') : 'Store Shortage/Damage'})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 font-mono text-[11px] font-bold text-slate-700">
                        {item.hsnCode || '8517'}
                      </td>
                      <td className="py-2 px-2 text-center font-mono">
                        <span className="font-bold text-slate-900 block">{activeQty}</span>
                        {hasCancelled && (
                          <span className="text-[9px] text-rose-600 block line-through">
                            (was {item.quantity})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">{formatINR(itemTaxable)}</td>
                      <td className="py-2 px-2 text-center font-mono font-semibold">{itemGst}%</td>
                      {isInterState ? (
                        <td className="py-2 px-2 text-right font-mono">{formatINR(igst)}</td>
                      ) : (
                        <>
                          <td className="py-2 px-2 text-right font-mono text-slate-600">{formatINR(cgst)}</td>
                          <td className="py-2 px-2 text-right font-mono text-slate-600">{formatINR(sgst)}</td>
                        </>
                      )}
                      <td className={`py-2 px-2 text-right font-mono font-bold ${isZero ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {formatINR(item.total)}
                      </td>
                    </tr>
                  );
                })}

                {/* Shipping Logistics Row if delivery fee applied */}
                {order.deliveryFee > 0 && (
                  <tr className="bg-slate-50/60 font-medium">
                    <td className="py-2 px-2 text-slate-500 font-mono">{order.items.length + 1}</td>
                    <td className="py-2 px-2">
                      <span className="font-bold text-slate-800">Express Courier & Logistics Transportation</span>
                      <span className="text-[10px] text-slate-500 block">Doorstep dispatch within Lucknow zone</span>
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] font-bold text-slate-700">9968</td>
                    <td className="py-2 px-2 text-center font-mono">1</td>
                    <td className="py-2 px-2 text-right font-mono">
                      {formatINR(Math.round((order.deliveryFee / 1.18) * 100) / 100)}
                    </td>
                    <td className="py-2 px-2 text-center font-mono">18%</td>
                    {isInterState ? (
                      <td className="py-2 px-2 text-right font-mono">
                        {formatINR(Math.round((order.deliveryFee - order.deliveryFee / 1.18) * 100) / 100)}
                      </td>
                    ) : (
                      <>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">
                          {formatINR(Math.round(((order.deliveryFee - order.deliveryFee / 1.18) / 2) * 100) / 100)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">
                          {formatINR(Math.round(((order.deliveryFee - order.deliveryFee / 1.18) / 2) * 100) / 100)}
                        </td>
                      </>
                    )}
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                      {formatINR(order.deliveryFee)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Grouped HSN / SAC Summary Table (Mandatory under GST rules) */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
              HSN / SAC Tax Liability Summary (GSTR-1 Table 12 Compliance)
            </h4>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-[10px] border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-700">
                    <th className="p-1.5 text-left">HSN / SAC</th>
                    <th className="p-1.5 text-right">Taxable Value (₹)</th>
                    {isInterState ? (
                      <th className="p-1.5 text-right">Integrated Tax (IGST)</th>
                    ) : (
                      <>
                        <th className="p-1.5 text-right">Central Tax (CGST)</th>
                        <th className="p-1.5 text-right">State Tax (SGST)</th>
                      </>
                    )}
                    <th className="p-1.5 text-right font-bold">Total Tax Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {order.hsnSummary && order.hsnSummary.length > 0 ? (
                    order.hsnSummary.map((hsn) => (
                      <tr key={hsn.hsnCode}>
                        <td className="p-1.5 font-bold text-slate-800">
                          {hsn.hsnCode} <span className="font-normal text-slate-500">({hsn.gstRate}%)</span>
                        </td>
                        <td className="p-1.5 text-right">{formatINR(hsn.taxableValue)}</td>
                        {isInterState ? (
                          <td className="p-1.5 text-right">{formatINR(hsn.igstAmount)}</td>
                        ) : (
                          <>
                            <td className="p-1.5 text-right">{formatINR(hsn.cgstAmount)}</td>
                            <td className="p-1.5 text-right">{formatINR(hsn.sgstAmount)}</td>
                          </>
                        )}
                        <td className="p-1.5 text-right font-bold text-slate-900">{formatINR(hsn.totalTax)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-1.5 font-bold text-slate-800">8517 (18%)</td>
                      <td className="p-1.5 text-right">{formatINR(taxableAmount)}</td>
                      {isInterState ? (
                        <td className="p-1.5 text-right">{formatINR(igstAmount)}</td>
                      ) : (
                        <>
                          <td className="p-1.5 text-right">{formatINR(cgstAmount)}</td>
                          <td className="p-1.5 text-right">{formatINR(sgstAmount)}</td>
                        </>
                      )}
                      <td className="p-1.5 text-right font-bold text-slate-900">{formatINR(order.taxAmount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculations Summary & Amounts in Words */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4 pt-4 border-t-2 border-slate-900">
            {/* Left: Words & Digital QR */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Invoice Amount in Words:
                </span>
                <span className="font-semibold text-slate-900 text-xs italic">
                  {numberToIndianWords(order.finalTotal)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Tax in Words:
                </span>
                <span className="font-semibold text-slate-700 text-xs italic">
                  {numberToIndianWords(order.taxAmount)}
                </span>
              </div>

              {/* Digital Authentication QR */}
              {order.qrCodeDataUrl && (
                <div className="flex items-center gap-3 pt-2">
                  <img src={order.qrCodeDataUrl} alt="QR" className="w-16 h-16 border border-slate-200 shrink-0 rounded" />
                  <div className="text-[10px] text-slate-500">
                    <span className="font-bold text-slate-800 block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Digitally Signed GST Invoice</span>
                    </span>
                    <span>IRN / QR verified under Section 31 of CGST Act.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Financial Totals */}
            <div className="space-y-1.5 text-xs text-left sm:text-right border-t sm:border-t-0 border-slate-200 pt-3 sm:pt-0">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value (Base):</span>
                <span className="font-mono">{formatINR(taxableAmount)}</span>
              </div>

              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({order.couponCode || 'Promo'}):</span>
                  <span className="font-mono">-{formatINR(order.couponDiscount)}</span>
                </div>
              )}

              {order.bulkDiscountAmount && order.bulkDiscountAmount > 0 && (
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>Bulk Volume Discount ({order.appliedBulkRuleName || 'Volume Tier'}):</span>
                  <span className="font-mono">-{formatINR(order.bulkDiscountAmount)}</span>
                </div>
              )}

              {isInterState ? (
                <div className="flex justify-between text-slate-700">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono">{formatINR(igstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-700">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono">{formatINR(cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>State GST (SGST):</span>
                    <span className="font-mono">{formatINR(sgstAmount)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges:</span>
                <span className="font-mono">
                  {order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}
                </span>
              </div>

              {order.originalTotal && order.originalTotal !== order.finalTotal && (
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Initial Order Value:</span>
                  <span className="font-mono">{formatINR(order.originalTotal)}</span>
                </div>
              )}

              {order.refundedAmount && order.refundedAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-semibold text-xs bg-rose-50/50 p-1 rounded">
                  <span>Less: Store Shortage / Damage Adjustment:</span>
                  <span className="font-mono">-{formatINR(order.refundedAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t-2 border-slate-900 pt-2">
                <span>Revised Total Invoice Value:</span>
                <span className="font-mono text-blue-900 text-lg">{formatINR(order.finalTotal)}</span>
              </div>

              <div className="pt-2 text-[11px] text-slate-600">
                <span>Payment Mode: </span>
                <span className="font-bold uppercase">{order.paymentMethod.replace(/_/g, ' ')}</span>
                <span className="ml-1.5 font-semibold text-emerald-700">
                  ({order.paymentStatus === 'verified_paid' ? 'PAID / VERIFIED' : 'PAYMENT PENDING'})
                </span>
              </div>
            </div>
          </div>

          {/* Statutory Declaration & Signatory */}
          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-slate-500">
            <div>
              <p className="font-bold text-slate-700 uppercase">Statutory Declaration:</p>
              <p>1. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
              <p>2. Goods once sold carry official brand manufacturer warranty support.</p>
              <p>3. Input Tax Credit (ITC) is subject to conditions under Section 16 of the CGST Act, 2017.</p>
            </div>

            <div className="text-right flex flex-col justify-end">
              <p className="font-bold text-slate-900">For {supplierLegalName.toUpperCase()}</p>
              <div className="h-10"></div>
              <p className="border-t border-slate-400 inline-block ml-auto pt-1 font-semibold text-slate-700">
                Authorized Signatory / E-Verification
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar (Hidden on print) */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-end gap-2 border-t border-slate-800 no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tax Invoice</span>
          </button>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
