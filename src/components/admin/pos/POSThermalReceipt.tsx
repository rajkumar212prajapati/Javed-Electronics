import React, { useRef } from 'react';
import { POSReceiptData } from '../../../types/pos';
import { formatINR } from '../../../utils/currency';
import { getWhatsAppClickToChatUrl } from '../../../utils/whatsapp';
import { Printer, MessageCircle, CheckCircle2, RotateCcw, Copy, X } from 'lucide-react';

interface POSThermalReceiptProps {
  receipt: POSReceiptData;
  onNewSale: () => void;
  onClose: () => void;
}

export const POSThermalReceipt: React.FC<POSThermalReceiptProps> = ({
  receipt,
  onNewSale,
  onClose,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const tenderSummary = () => {
    switch (receipt.tender.mode) {
      case 'cash':
        return `Cash (Tendered: ${formatINR(receipt.tender.cashTendered || receipt.finalTotal)}${
          receipt.tender.changeDue ? `, Change: ${formatINR(receipt.tender.changeDue)}` : ''
        })`;
      case 'upi_qr':
        return `UPI QR (${receipt.tender.upiTxnRef || 'Instant Verified'})`;
      case 'card_pos':
        return `Card POS (${receipt.tender.cardType || 'Card'} •••• ${receipt.tender.cardLast4 || '****'}, Auth: ${
          receipt.tender.cardAuthCode || '92810'
        })`;
      case 'split':
        return `Split: Cash ${formatINR(receipt.tender.splitDetails?.cash || 0)} + UPI ${formatINR(
          receipt.tender.splitDetails?.upi || 0
        )} + Card ${formatINR(receipt.tender.splitDetails?.card || 0)}`;
      case 'store_credit':
        return 'Store Credit / Wallet';
      default:
        return 'Paid at Counter';
    }
  };

  const whatsappReceiptText = `*JAVED ELECTRONICS - RETAIL TAX INVOICE*
*Invoice No:* ${receipt.invoiceNumber}
*Date:* ${new Date(receipt.createdAt).toLocaleString()}
*Store Branch:* ${receipt.outletName}

*Customer:* ${receipt.customer.name} (${receipt.customer.phone})
${receipt.customer.gstin ? `*GSTIN:* ${receipt.customer.gstin}\n` : ''}
*Items:*
${receipt.items
  .map(
    (i) =>
      `• ${i.product.name}${i.selectedVariant ? ` (${i.selectedVariant})` : ''} × ${i.quantity} = ${formatINR(
        i.total
      )}${i.serialNumberOrImei ? ` [S/N: ${i.serialNumberOrImei}]` : ''}`
  )
  .join('\n')}

*Subtotal:* ${formatINR(receipt.subtotal)}
${receipt.totalDiscount > 0 ? `*Discount:* -${formatINR(receipt.totalDiscount)}\n` : ''}*Taxable Value:* ${formatINR(receipt.taxableAmount)}
*CGST (9%):* ${formatINR(receipt.cgstAmount)}
*SGST (9%):* ${formatINR(receipt.sgstAmount)}
*Total Payable:* ${formatINR(receipt.finalTotal)}
*Payment Mode:* ${tenderSummary()}

_All electronics include official 1-year brand warranty. Retain this digital receipt for claims at our Hazratganj showroom._
Thank you for shopping local with Javed Electronics!`;

  const whatsappUrl = getWhatsAppClickToChatUrl(receipt.customer.phone || '919876543210', whatsappReceiptText);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] my-auto">
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Sale Completed Successfully</h3>
              <p className="text-[11px] text-slate-400">Invoice: {receipt.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable 80mm Receipt Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1">
          <div
            ref={printAreaRef}
            id="pos-thermal-receipt"
            className="bg-white p-5 sm:p-6 mx-auto rounded-lg shadow-sm border border-slate-200 font-mono text-slate-900 max-w-sm text-xs leading-relaxed"
            style={{ width: '100%', maxWidth: '340px' }}
          >
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="text-sm font-black tracking-wider uppercase">JAVED ELECTRONICS</div>
              <div className="text-[11px] font-bold text-slate-700">{receipt.outletName}</div>
              <div className="text-[10px] text-slate-500">{receipt.outletAddress}</div>
              <div className="text-[10px] text-slate-500">Phone: {receipt.outletPhone}</div>
              <div className="text-[10px] font-bold text-slate-700 mt-1">GSTIN: {receipt.outletGstin}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5">
                TAX INVOICE / RETAIL CASH MEMO
              </div>
            </div>

            {/* Bill Meta */}
            <div className="border-b border-dashed border-slate-300 pb-2 mb-2 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-bold">{receipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date/Time:</span>
                <span>{new Date(receipt.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{receipt.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Register:</span>
                <span>{receipt.registerId}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold">{receipt.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span>{receipt.customer.phone || 'N/A'}</span>
              </div>
              {receipt.customer.isB2B && receipt.customer.gstin && (
                <div className="pt-1 mt-1 border-t border-slate-100 bg-slate-50 p-1 rounded text-[10px]">
                  <div>B2B Co: {receipt.customer.businessName}</div>
                  <div>Buyer GSTIN: {receipt.customer.gstin}</div>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200 pb-1 mb-1">
                <span className="flex-1">Item / Description</span>
                <span className="w-10 text-center">Qty</span>
                <span className="w-16 text-right">Amount</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span className="flex-1 truncate pr-1">
                        {item.product.name}
                        {item.selectedVariant ? ` (${item.selectedVariant})` : ''}
                      </span>
                      <span className="w-10 text-center font-normal">{item.quantity}</span>
                      <span className="w-16 text-right">{formatINR(item.total)}</span>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>HSN: {item.hsnCode} ({item.gstRate}%)</span>
                      <span>Rate: {formatINR(item.unitPrice)}</span>
                    </div>

                    {item.serialNumberOrImei && (
                      <div className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                        S/N: {item.serialNumberOrImei} (1-Yr Warranty)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="border-b border-dashed border-slate-300 pb-2 mb-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Total:</span>
                <span>{formatINR(receipt.subtotal)}</span>
              </div>

              {receipt.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Total Savings/Discount:</span>
                  <span>-{formatINR(receipt.totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Taxable Amount:</span>
                <span>{formatINR(receipt.taxableAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>CGST (9%):</span>
                <span>{formatINR(receipt.cgstAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>SGST (9%):</span>
                <span>{formatINR(receipt.sgstAmount)}</span>
              </div>

              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1 mt-1">
                <span>NET PAYABLE:</span>
                <span>{formatINR(receipt.finalTotal)}</span>
              </div>
            </div>

            {/* Tender Info */}
            <div className="border-b border-dashed border-slate-300 pb-2 mb-2 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Payment Tender:</span>
                <span className="uppercase text-blue-700">{tenderSummary()}</span>
              </div>
              {receipt.tender.cashTendered && (
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Cash Given:</span>
                  <span>{formatINR(receipt.tender.cashTendered)}</span>
                </div>
              )}
              {receipt.tender.changeDue !== undefined && receipt.tender.changeDue > 0 && (
                <div className="flex justify-between font-bold text-emerald-700 text-[11px]">
                  <span>Change Returned:</span>
                  <span>{formatINR(receipt.tender.changeDue)}</span>
                </div>
              )}
            </div>

            {/* Barcode & Store Policy Footer */}
            <div className="text-center pt-1 text-[10px] text-slate-500 space-y-1">
              <div className="font-mono text-[9px] tracking-widest text-slate-400">
                ||| || ||||| |||| ||| ||||||| |||
              </div>
              <div className="font-mono text-[9px] font-bold text-slate-700">
                *{receipt.invoiceNumber}*
              </div>
              <div className="text-slate-600 font-semibold pt-1">
                7 Days Easy Return • 1 Year Genuine Brand Warranty
              </div>
              <div className="text-[9px] text-slate-400 leading-tight">
                For warranty assistance or repair support, visit our Hazratganj showroom or WhatsApp customer care.
              </div>
              <div className="text-slate-800 font-bold uppercase text-[9px] pt-1">
                Thank You For Shopping Local!
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-200" />
            <span>Print 80mm Bill</span>
          </button>

          {/* WhatsApp Share Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
            <span>Send on WhatsApp</span>
          </a>

          {/* Next New Sale Button */}
          <button
            onClick={onNewSale}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Next Sale (F2)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
