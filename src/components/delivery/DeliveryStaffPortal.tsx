import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { Order } from '../../types';
import {
  Bike,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Clock,
  Package,
  Navigation,
} from 'lucide-react';

export const DeliveryStaffPortal: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    completeDelivery,
    reportDeliveryFailure,
    setSelectedOrderForModal,
    setActiveModal,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [deliveringOrder, setDeliveringOrder] = useState<Order | null>(null);
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [receiverName, setReceiverName] = useState<string>('');
  const [deliveryNote, setDeliveryNote] = useState<string>('');
  const [failureOrder, setFailureOrder] = useState<Order | null>(null);
  const [failReason, setFailReason] = useState<string>('');

  // Assigned deliveries
  const myAssignedOrders = orders.filter(
    (o) =>
      o.assignedDeliveryStaffId ||
      o.orderStatus === 'assigned_to_delivery' ||
      o.orderStatus === 'out_for_delivery' ||
      o.deliveryStaffName
  );

  const pendingDeliveries = myAssignedOrders.filter(
    (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  );

  const completedDeliveries = myAssignedOrders.filter(
    (o) => o.orderStatus === 'delivered'
  );

  const handleStartDelivery = (order: Order) => {
    updateOrderStatus(
      order.id,
      'out_for_delivery',
      'Rider picked up package and is out for local delivery in Lucknow',
      'Ramesh Kumar (Rider)'
    );
  };

  const handleOpenCompleteModal = (order: Order) => {
    setDeliveringOrder(order);
    setCollectedAmount(order.paymentMethod === 'cod' ? order.finalTotal : 0);
    setReceiverName(order.customer.name);
    setDeliveryNote('Delivered in person with genuine warranty card and invoice');
  };

  const handleConfirmDelivered = () => {
    if (!deliveringOrder) return;

    completeDelivery(deliveringOrder.id, {
      collectedAmount: Number(collectedAmount),
      receiverName: receiverName || deliveringOrder.customer.name,
      note: deliveryNote || 'Delivered successfully',
    });

    setDeliveringOrder(null);
  };

  const handleConfirmFailed = () => {
    if (!failureOrder || !failReason.trim()) return;

    reportDeliveryFailure(failureOrder.id, failReason);
    setFailureOrder(null);
    setFailReason('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 no-print">
      {/* Top Rider Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                LUCKNOW LOCAL FLEET
              </span>
              <h2 className="text-base font-bold text-white">Ramesh Kumar (Rider #104)</h2>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
            On Duty
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-center text-xs">
          <div className="bg-slate-800/60 p-2 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Pending Deliveries</span>
            <span className="text-lg font-bold font-mono text-white">
              {pendingDeliveries.length}
            </span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Completed Today</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {completedDeliveries.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Deliveries ({pendingDeliveries.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'completed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Completed History ({completedDeliveries.length})
        </button>
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {activeTab === 'pending' ? (
          pendingDeliveries.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No pending deliveries right now. You are all caught up!
            </div>
          ) : (
            pendingDeliveries.map((order) => {
              const isCod = order.paymentMethod === 'cod';
              const isOut = order.orderStatus === 'out_for_delivery';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900">{order.id}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {order.deliverySlot || 'Express'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isOut ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {order.customer.name}
                        </span>
                        <div className="flex items-start gap-1.5 text-slate-600 mt-1">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            {order.customer.address}
                            {order.customer.landmark && `, Near ${order.customer.landmark}`}
                            <br />
                            <strong>
                              {order.customer.area}, PIN: {order.customer.pincode}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Quick Call Button */}
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Banknote className={`w-4 h-4 ${isCod ? 'text-amber-600' : 'text-emerald-600'}`} />
                      <span className="font-semibold text-slate-800">
                        {isCod ? 'Cash on Delivery (COD)' : 'Prepaid / UPI'}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900">
                      {isCod ? (
                        <span className="text-amber-700">Collect: {formatINR(order.finalTotal)}</span>
                      ) : (
                        <span className="text-emerald-700">PAID (₹0 to collect)</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    {!isOut ? (
                      <button
                        onClick={() => handleStartDelivery(order)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Start Delivery (Out for Delivery)
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenCompleteModal(order)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Mark Delivered
                        </button>
                        <button
                          onClick={() => setFailureOrder(order)}
                          className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer"
                        >
                          Delivery Failed
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          completedDeliveries.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-2 opacity-90"
            >
              <div className="flex justify-between items-center font-bold">
                <span className="font-mono">{order.id}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded uppercase">
                  Delivered
                </span>
              </div>
              <p className="text-slate-700">Delivered to: <strong>{order.customer.name}</strong></p>
              {order.deliveryProof && (
                <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
                  <span>Proof note: {order.deliveryProof.note}</span>
                  {order.deliveryProof.collectedAmount ? (
                    <span className="block font-mono font-bold text-emerald-700">
                      Cash Collected: {formatINR(order.deliveryProof.collectedAmount)}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Proof of Delivery Modal */}
      {deliveringOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-3 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Confirm Delivery & Proof: {deliveringOrder.id}
            </h3>

            {deliveringOrder.paymentMethod === 'cod' && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900">
                <label className="font-bold block mb-1">Cash Collected Amount (₹):</label>
                <input
                  type="number"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(Number(e.target.value))}
                  className="w-full p-2 border border-amber-300 rounded font-mono font-bold text-sm bg-white"
                />
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Received by Name:</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Receiver full name"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Proof Note / Remarks:</label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Handed over with sealed box & invoice"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeliveringOrder(null)}
                className="px-3 py-1.5 text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivered}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded font-bold cursor-pointer"
              >
                Confirm Delivered
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Failed Modal */}
      {failureOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-3 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-rose-900">
              Report Delivery Failed: {failureOrder.id}
            </h3>
            <p className="text-slate-600 text-[11px]">
              Package will be marked as delivery failed and staged for customer callback or redelivery.
            </p>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reason for Failure *</label>
              <select
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">Select reason...</option>
                <option value="Customer phone switched off / unreachable">Customer phone unreachable</option>
                <option value="Customer requested redelivery tomorrow">Customer requested redelivery</option>
                <option value="Door locked / nobody at address">Door locked / premises unattended</option>
                <option value="Incorrect address provided">Incorrect address</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFailureOrder(null)}
                className="px-3 py-1.5 text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFailed}
                disabled={!failReason}
                className="px-4 py-1.5 bg-rose-600 disabled:opacity-50 text-white rounded font-bold cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
