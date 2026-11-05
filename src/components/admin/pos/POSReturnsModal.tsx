import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { POSReceiptData, POSReturnRecord, POSReturnItem } from '../../../types/pos';
import { formatINR } from '../../../utils/currency';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
  CreditCard,
  Banknote,
  Receipt,
  FileText,
} from 'lucide-react';

interface POSReturnsModalProps {
  recentReceipts: POSReceiptData[];
  onCompleteReturn: (returnRecord: POSReturnRecord) => void;
  onClose: () => void;
}

export const POSReturnsModal: React.FC<POSReturnsModalProps> = ({
  recentReceipts,
  onCompleteReturn,
  onClose,
}) => {
  const { adjustStock, currentUser } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<POSReceiptData | null>(null);
  const [returnItems, setReturnItems] = useState<Record<string, { qty: number; condition: 'resellable' | 'damaged' | 'defective'; restock: boolean }>>({});
  const [refundMethod, setRefundMethod] = useState<'cash' | 'original_mode' | 'store_credit'>('cash');
  const [returnReason, setReturnReason] = useState('Customer changed mind / wrong model selected');
  const [completedCreditNote, setCompletedCreditNote] = useState<POSReturnRecord | null>(null);

  // Search invoice
  const matchingReceipts = recentReceipts.filter(
    (r) =>
      r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      r.customer.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (r.customer.phone && r.customer.phone.includes(searchQuery.trim()))
  );

  const handleSelectReceipt = (receipt: POSReceiptData) => {
    setSelectedReceipt(receipt);
    const initialMap: Record<string, { qty: number; condition: 'resellable' | 'damaged' | 'defective'; restock: boolean }> = {};
    receipt.items.forEach((item) => {
      initialMap[item.id] = { qty: 0, condition: 'resellable', restock: true };
    });
    setReturnItems(initialMap);
  };

  // Calculate total refund
  const totalRefundAmount = selectedReceipt
    ? selectedReceipt.items.reduce((sum, item) => {
        const itemState = returnItems[item.id];
        return sum + (itemState ? itemState.qty * item.unitPrice : 0);
      }, 0)
    : 0;

  const handleProcessRefund = () => {
    if (!selectedReceipt || totalRefundAmount <= 0) return;

    const returnNumber = `RET-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const creditNoteNum = `CN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const itemsReturned: POSReturnItem[] = [];

    selectedReceipt.items.forEach((item) => {
      const state = returnItems[item.id];
      if (state && state.qty > 0) {
        itemsReturned.push({
          productId: item.productId,
          productName: item.product.name,
          quantity: state.qty,
          unitPrice: item.unitPrice,
          refundAmount: state.qty * item.unitPrice,
          condition: state.condition,
          restockToInventory: state.restock,
        });

        // Restock to product onHand if condition is resellable
        if (state.restock) {
          adjustStock(
            item.productId,
            item.product.stock.onHand + state.qty,
            `POS Customer Return (${returnNumber} / ${selectedReceipt.invoiceNumber})`,
            currentUser.name || 'Store Cashier'
          );
        }
      }
    });

    const record: POSReturnRecord = {
      id: `ret-${Date.now()}`,
      returnNumber,
      originalInvoiceNumber: selectedReceipt.invoiceNumber,
      returnDate: new Date().toISOString(),
      cashierName: currentUser.name || 'Store Cashier',
      customerName: selectedReceipt.customer.name,
      customerPhone: selectedReceipt.customer.phone || '',
      items: itemsReturned,
      totalRefund: totalRefundAmount,
      refundMethod,
      reason: returnReason,
      creditNoteNumber: creditNoteNum,
    };

    onCompleteReturn(record);
    setCompletedCreditNote(record);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col my-auto text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 border border-yellow-300 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Returns, Exchanges & Credit Notes</h3>
              <p className="text-[11px] text-slate-500">Process partial or full order return against invoice</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          {completedCreditNote ? (
            /* Return Completed Credit Note Screen */
            <div className="p-4 bg-slate-50 rounded-2xl border border-emerald-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Return Successfully Processed</h4>
              <p className="text-xs text-slate-600">
                Credit Note <strong>{completedCreditNote.creditNoteNumber}</strong> generated for {completedCreditNote.customerName}.
              </p>
              <div className="p-3 bg-white rounded-xl text-left font-mono space-y-1 border border-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Return ID:</span>
                  <span className="text-slate-900 font-bold">{completedCreditNote.returnNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Original Invoice:</span>
                  <span className="text-slate-900">{completedCreditNote.originalInvoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Refund Tender:</span>
                  <span className="uppercase text-sky-800 font-bold">{completedCreditNote.refundMethod}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-700 border-t border-slate-200 pt-1 mt-1">
                  <span>Refund Disbursed:</span>
                  <span>{formatINR(completedCreditNote.totalRefund)}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-sky-200 hover:bg-sky-300 text-sky-950 border-2 border-yellow-400 rounded-xl font-black text-xs cursor-pointer shadow-xs"
              >
                Done / Close Return
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Invoice Lookup */}
              {!selectedReceipt ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Invoice Number (JE-POS-...) or Customer Phone..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {matchingReceipts.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        No invoices match search query. Ensure the sale was recorded in recent bills.
                      </div>
                    ) : (
                      matchingReceipts.map((r) => (
                        <div
                          key={r.invoiceNumber}
                          onClick={() => handleSelectReceipt(r)}
                          className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200 hover:border-yellow-300 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-mono font-bold text-sky-800">{r.invoiceNumber}</div>
                            <div className="text-slate-900 font-medium">{r.customer.name} ({r.customer.phone || 'Walk-in'})</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(r.createdAt).toLocaleString()} • {r.items.length} items
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-900">{formatINR(r.finalTotal)}</div>
                            <span className="text-[10px] uppercase font-mono text-sky-800 font-bold">Select →</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2: Select Items to Return */
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Selected Invoice</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{selectedReceipt.invoiceNumber}</span>
                      <span className="text-slate-600 text-[11px] block">{selectedReceipt.customer.name}</span>
                    </div>
                    <button
                      onClick={() => setSelectedReceipt(null)}
                      className="text-xs text-sky-800 hover:underline font-bold cursor-pointer"
                    >
                      Change Invoice
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                      Select Item Quantities & Condition to Return:
                    </span>
                    {selectedReceipt.items.map((item) => {
                      const state = returnItems[item.id] || { qty: 0, condition: 'resellable', restock: true };
                      return (
                        <div
                          key={item.id}
                          className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="font-bold text-slate-900">{item.product.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Original Qty: {item.quantity} • Unit Price: {formatINR(item.unitPrice)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-300">
                              <button
                                type="button"
                                onClick={() =>
                                  setReturnItems((prev) => ({
                                    ...prev,
                                    [item.id]: { ...state, qty: Math.max(0, state.qty - 1) },
                                  }))
                                }
                                className="w-6 h-6 rounded flex items-center justify-center bg-sky-100 hover:bg-sky-200 text-sky-950 border border-yellow-300 font-bold"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono font-bold text-slate-900">{state.qty}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setReturnItems((prev) => ({
                                    ...prev,
                                    [item.id]: { ...state, qty: Math.min(item.quantity, state.qty + 1) },
                                  }))
                                }
                                className="w-6 h-6 rounded flex items-center justify-center bg-sky-100 hover:bg-sky-200 text-sky-950 border border-yellow-300 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {state.qty > 0 && (
                            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">Condition:</span>
                                <select
                                  value={state.condition}
                                  onChange={(e) =>
                                    setReturnItems((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        ...state,
                                        condition: e.target.value as any,
                                        restock: e.target.value === 'resellable',
                                      },
                                    }))
                                  }
                                  className="bg-white text-slate-900 rounded px-2 py-0.5 border border-slate-300"
                                >
                                  <option value="resellable">Resellable / New (Restock)</option>
                                  <option value="defective">Defective / RMA (Do Not Restock)</option>
                                  <option value="damaged">Damaged in Transit (Scrap)</option>
                                </select>
                              </div>

                              <span className="font-mono font-bold text-slate-900">
                                Refund: {formatINR(state.qty * item.unitPrice)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Refund Tender Mode & Reason */}
                  {totalRefundAmount > 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">Total Refund Payable:</span>
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {formatINR(totalRefundAmount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'cash', label: 'Cash Out', icon: <Banknote className="w-3.5 h-3.5" /> },
                          { id: 'original_mode', label: 'Original Mode', icon: <CreditCard className="w-3.5 h-3.5" /> },
                          { id: 'store_credit', label: 'Store Credit', icon: <Receipt className="w-3.5 h-3.5" /> },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setRefundMethod(m.id as any)}
                            className={`p-2 rounded-lg border-2 text-center flex flex-col items-center justify-center gap-1 cursor-pointer font-bold ${
                              refundMethod === m.id
                                ? 'bg-sky-200 text-sky-950 border-yellow-400 font-black shadow-2xs'
                                : 'bg-sky-50 text-sky-900 border-yellow-200/80 hover:bg-sky-100'
                            }`}
                          >
                            {m.icon}
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-600 block mb-1">Return Reason / Notes:</label>
                        <input
                          type="text"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!completedCreditNote && (
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            {selectedReceipt && (
              <button
                disabled={totalRefundAmount <= 0}
                onClick={handleProcessRefund}
                className="px-5 py-2.5 bg-sky-200 hover:bg-sky-300 disabled:opacity-40 disabled:cursor-not-allowed text-sky-950 border-2 border-yellow-400 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Process Refund ({formatINR(totalRefundAmount)})</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
