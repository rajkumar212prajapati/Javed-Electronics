import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { StockTransfer, StockTransferStatus } from '../../types';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  Building,
  Package,
  Layers,
  ArrowRight,
  FileText,
  XCircle,
} from 'lucide-react';

export const StockTransfersManager: React.FC = () => {
  const { stockTransfers, requestStockTransfer, processStockTransfer, outlets, products, currentRole } = useStore();
  const isSuperAdmin = currentRole === 'super_admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Form states
  const [sourceOutletId, setSourceOutletId] = useState(outlets[0]?.id || '');
  const [destinationOutletId, setDestinationOutletId] = useState(outlets[1]?.id || '');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(5);
  const [courierNote, setCourierNote] = useState('Urgent branch replenishment for weekend festive sale');

  // Action modal
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [actionStaffNote, setActionStaffNote] = useState('');

  const filteredTransfers = stockTransfers.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sourceOutletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destinationOutletName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: StockTransferStatus) => {
    switch (status) {
      case 'received':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Received & Stocked</span>;
      case 'dispatched':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1"><Truck className="w-3 h-3" /> In Transit</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved for Dispatch</span>;
      case 'requested':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Transfer Requested</span>;
      case 'discrepancy':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Audit Discrepancy</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Rejected</span>;
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceOutletId === destinationOutletId) {
      alert('Source and destination outlet cannot be identical.');
      return;
    }

    requestStockTransfer({
      sourceOutletId,
      destinationOutletId,
      productId,
      quantity: Number(quantity),
      requestedBy: isSuperAdmin ? 'Super Admin' : 'Store Manager',
      notes: courierNote,
    });

    setShowRequestModal(false);
  };

  const handleUpdateStatus = (newStatus: StockTransferStatus) => {
    if (!selectedTransfer) return;
    processStockTransfer(selectedTransfer.id, newStatus, actionStaffNote);
    setSelectedTransfer(null);
    setActionStaffNote('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Intro Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <span>Inter-Outlet Stock Transfers & Logistics Pipeline</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch inventory between Central Hub, Hazratganj, Gomti Nagar, and Alambagh outlets with chain-of-custody tracking.
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Request Transfer</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transfer ref, product, SKU, outlet..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
        >
          <option value="all">All Transfer Statuses</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="dispatched">In Transit (Dispatched)</option>
          <option value="received">Received & Stocked</option>
          <option value="discrepancy">Discrepancy / Damage</option>
        </select>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Transfer Ref</th>
              <th className="px-4 py-3">Route (From → To)</th>
              <th className="px-4 py-3">Item & SKU</th>
              <th className="px-4 py-3 text-center">Qty (Req / Disp / Rec)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransfers.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-blue-700">
                  {item.id}
                  <span className="block text-[10px] text-slate-400 font-sans font-normal">
                    {item.requestedAt.split('T')[0]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="text-slate-600">{item.sourceOutletName}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-blue-700 font-bold">{item.destinationOutletName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{item.productName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                </td>
                <td className="px-4 py-3 text-center font-mono">
                  <span className="font-bold text-slate-900">{item.requestedQuantity}</span>
                  <span className="text-slate-400"> / </span>
                  <span className="text-blue-700">{item.dispatchedQuantity ?? '-'}</span>
                  <span className="text-slate-400"> / </span>
                  <span className="text-emerald-700 font-bold">{item.receivedQuantity ?? '-'}</span>
                </td>
                <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => {
                      setSelectedTransfer(item);
                      setActionStaffNote(item.driverOrCourierNote || '');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MANAGE TRANSFER STATUS MODAL */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-700">{selectedTransfer.id}</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedTransfer.productName}</h3>
                <span className="text-xs text-slate-500">
                  {selectedTransfer.sourceOutletName} → {selectedTransfer.destinationOutletName}
                </span>
              </div>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Requested Quantity:</span>
                <span className="font-bold font-mono">{selectedTransfer.requestedQuantity} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Dispatched Quantity:</span>
                <span className="font-bold font-mono">{selectedTransfer.dispatchedQuantity || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Current Status:</span>
                <span>{getStatusBadge(selectedTransfer.status)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Courier Tracking or Delivery Partner Note
              </label>
              <textarea
                rows={2}
                value={actionStaffNote}
                onChange={(e) => setActionStaffNote(e.target.value)}
                placeholder="e.g. Courier: BlueDart / Van #UP32-AB-1234, Driver Rajesh, seal verified"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
              {selectedTransfer.status === 'requested' && (
                <button
                  onClick={() => handleUpdateStatus('approved')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Approve Transfer
                </button>
              )}

              {selectedTransfer.status === 'approved' && (
                <button
                  onClick={() => handleUpdateStatus('dispatched')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Mark Dispatched (In-Transit)
                </button>
              )}

              {selectedTransfer.status === 'dispatched' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus('discrepancy')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Flag Discrepancy
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('received')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Confirm Receipt & Restock
                  </button>
                </>
              )}

              <button
                onClick={() => setSelectedTransfer(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST TRANSFER MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Request Inter-Outlet Transfer</h3>
                <p className="text-xs text-slate-500">Initiate inventory movement between branches</p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source Outlet</label>
                  <select
                    value={sourceOutletId}
                    onChange={(e) => setSourceOutletId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Outlet</label>
                  <select
                    value={destinationOutletId}
                    onChange={(e) => setDestinationOutletId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand}) — On Hand: {p.stock.onHand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Note / Urgency</label>
                <input
                  type="text"
                  value={courierNote}
                  onChange={(e) => setCourierNote(e.target.value)}
                  placeholder="e.g. Urgent stock requisition for customer bookings"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
