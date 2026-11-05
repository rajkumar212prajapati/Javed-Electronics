import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  CategoryReturnPolicy,
  ReturnExchangeRequest,
  ReturnPolicyType,
  ReturnRequestStatus,
  ProductCategory,
} from '../../types';
import { formatINR } from '../../utils/currency';
import {
  RotateCcw,
  RefreshCw,
  ArrowLeftRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit,
  Save,
  X,
  Truck,
  Wallet,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Info,
  DollarSign,
  Plus,
  ArrowRight,
  PackageCheck,
  Sliders,
  FileText,
  BadgeAlert,
} from 'lucide-react';

export const ReturnRefundManager: React.FC = () => {
  const {
    categoryReturnPolicies,
    updateCategoryReturnPolicy,
    resetCategoryReturnPolicies,
    returnExchangeRequests,
    updateReturnRequestStatus,
    processReturnRefund,
    dispatchReturnReplacement,
    ridersList,
    currentUser,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'policies' | 'requests' | 'terms_preview'>('requests');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Policy Editing State
  const [editingPolicy, setEditingPolicy] = useState<CategoryReturnPolicy | null>(null);
  const [newConditionTerm, setNewConditionTerm] = useState('');

  // Request Action Modals
  const [actionModal, setActionModal] = useState<{
    type: 'approve_pickup' | 'process_refund' | 'dispatch_replacement' | 'reject';
    request: ReturnExchangeRequest;
  } | null>(null);

  // Form states for actions
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [pickupSlot, setPickupSlot] = useState<string>('12:00 PM - 04:00 PM');
  const [assignedRiderId, setAssignedRiderId] = useState(ridersList[0]?.id || 'rider_01');
  const [refundMethod, setRefundMethod] = useState<'wallet_credits' | 'original_payment' | 'bank_transfer_upi'>('wallet_credits');
  const [refundNotes, setRefundNotes] = useState('');
  const [replacementTrackingNumber, setReplacementTrackingNumber] = useState('');
  const [replacementNotes, setReplacementNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter requests
  const filteredRequests = returnExchangeRequests.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || req.categoryId === categoryFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      req.id.toLowerCase().includes(query) ||
      req.orderId.toLowerCase().includes(query) ||
      req.productName.toLowerCase().includes(query) ||
      req.customerName.toLowerCase().includes(query) ||
      req.customerPhone.includes(query);
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Calculate metrics
  const totalPending = returnExchangeRequests.filter((r) => r.status === 'requested').length;
  const totalPickup = returnExchangeRequests.filter((r) => r.status === 'pickup_scheduled' || r.status === 'out_for_pickup').length;
  const totalRefunded = returnExchangeRequests.filter((r) => r.status === 'refund_processed').length;
  const totalReplacements = returnExchangeRequests.filter((r) => r.status === 'replacement_dispatched').length;
  const totalRefundAmount = returnExchangeRequests
    .filter((r) => r.status === 'refund_processed')
    .reduce((sum, r) => sum + r.refundAmount, 0);

  // Policy Save Handler
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    updateCategoryReturnPolicy(editingPolicy.categoryId, editingPolicy);
    setEditingPolicy(null);
    showToast(`Updated return & exchange policy for ${editingPolicy.categoryName}!`, 'success');
  };

  // Policy Add Condition Term
  const handleAddConditionTerm = () => {
    if (!newConditionTerm.trim() || !editingPolicy) return;
    setEditingPolicy({
      ...editingPolicy,
      termsAndConditions: [...editingPolicy.termsAndConditions, newConditionTerm.trim()],
    });
    setNewConditionTerm('');
  };

  // Policy Remove Condition Term
  const handleRemoveConditionTerm = (index: number) => {
    if (!editingPolicy) return;
    setEditingPolicy({
      ...editingPolicy,
      termsAndConditions: editingPolicy.termsAndConditions.filter((_, i) => i !== index),
    });
  };

  // Handle Approve Doorstep Pickup
  const handleApprovePickupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    const rider = ridersList.find((r) => r.id === assignedRiderId);
    updateReturnRequestStatus(
      actionModal.request.id,
      'pickup_scheduled',
      `Doorstep pickup approved. Rider ${rider?.name || 'Assigned Courier'} assigned for ${pickupDate} (${pickupSlot}).`,
      currentUser.name,
      rider ? { id: rider.id, name: rider.name } : undefined
    );
    setActionModal(null);
    showToast(`Doorstep pickup scheduled for request ${actionModal.request.id}!`, 'success');
  };

  // Handle Process Refund
  const handleProcessRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    const res = processReturnRefund(
      actionModal.request.id,
      refundMethod,
      undefined,
      currentUser.name
    );
    setActionModal(null);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle Dispatch Replacement
  const handleDispatchReplacementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    const res = dispatchReturnReplacement(
      actionModal.request.id,
      replacementTrackingNumber.trim() || `REPL-AWB-${Date.now().toString().slice(-8)}`,
      currentUser.name
    );
    setActionModal(null);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle Reject Request
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    if (!rejectReason.trim()) {
      showToast('Please specify reason for rejection.', 'error');
      return;
    }
    updateReturnRequestStatus(
      actionModal.request.id,
      'rejected',
      rejectReason.trim(),
      currentUser.name
    );
    setActionModal(null);
    setRejectReason('');
    showToast(`Request ${actionModal.request.id} marked as rejected.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30">
                <RotateCcw className="w-5 h-5 text-blue-300" />
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Category Return, Refund & Exchange Master
              </h2>
            </div>
            <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
              Define return window closing timers, terms & conditions per product category. Review customer return requests, inspect photo proof, schedule doorstep pickups, disburse wallet refunds with +5% bonus, or dispatch replacements.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                resetCategoryReturnPolicies();
                showToast('Reset all category return policies to factory standards.', 'success');
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 cursor-pointer transition-colors"
            >
              Reset Policies to Default
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-blue-800/60 font-mono text-xs">
          <div className="bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl">
            <span className="text-blue-300 text-[10px] uppercase font-sans font-bold block">
              Pending Review
            </span>
            <span className="text-lg font-black text-white">{totalPending}</span>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl">
            <span className="text-amber-300 text-[10px] uppercase font-sans font-bold block">
              Doorstep Pickup
            </span>
            <span className="text-lg font-black text-amber-300">{totalPickup}</span>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl">
            <span className="text-emerald-300 text-[10px] uppercase font-sans font-bold block">
              Refunds Settled
            </span>
            <span className="text-lg font-black text-emerald-300">{totalRefunded}</span>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl">
            <span className="text-purple-300 text-[10px] uppercase font-sans font-bold block">
              Replacements Sent
            </span>
            <span className="text-lg font-black text-purple-300">{totalReplacements}</span>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-emerald-300 text-[10px] uppercase font-sans font-bold block">
              Disbursed Value
            </span>
            <span className="text-sm font-black text-white truncate block">
              {formatINR(totalRefundAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Customer Return Requests ({returnExchangeRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'policies'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Category Policy Settings ({categoryReturnPolicies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terms_preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'terms_preview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Customer Terms & Window Rules</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CUSTOMER REQUESTS QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Request ID, Order ID, Customer, Phone..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Statuses ({returnExchangeRequests.length})</option>
                <option value="requested">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="pickup_scheduled">Pickup Scheduled</option>
                <option value="item_picked_up">Item Picked Up</option>
                <option value="inspected_passed">QC Inspection Passed</option>
                <option value="refund_processed">Refund Processed</option>
                <option value="replacement_dispatched">Replacement Dispatched</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categoryReturnPolicies.map((p) => (
                  <option key={p.categoryId} value={p.categoryId}>
                    {p.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredRequests.length}</strong> cases
            </div>
          </div>

          {/* Requests Grid / Table */}
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
              <RotateCcw className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No return or exchange requests found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No customer cases match the current filter criteria. Customers can initiate returns directly from their tracking screen.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const isRefund = req.requestType === 'refund';
                const isReplacement = req.requestType === 'replacement';
                const isExchange = req.requestType === 'exchange';

                return (
                  <div
                    key={req.id}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-2xs transition-all space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {req.id}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-600">
                          Order: <strong className="font-mono text-slate-800">{req.orderId}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(req.requestedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Resolution Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isRefund
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isReplacement
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {isRefund ? (
                            <Wallet className="w-3 h-3 text-emerald-600" />
                          ) : isReplacement ? (
                            <RefreshCw className="w-3 h-3 text-amber-600" />
                          ) : (
                            <ArrowLeftRight className="w-3 h-3 text-purple-600" />
                          )}
                          <span>
                            {isRefund
                              ? 'Refund Request'
                              : isReplacement
                              ? 'Replacement Request'
                              : 'Exchange Request'}
                          </span>
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono border ${
                            req.status === 'refund_processed' || req.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : req.status === 'pickup_scheduled'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-blue-100 text-blue-900 border-blue-300'
                          }`}
                        >
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Request Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Product & Category */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Product & Category
                        </span>
                        <div className="font-bold text-slate-900">{req.productName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-mono">Qty: {req.quantity}</span>
                          <span>•</span>
                          <span className="font-mono font-bold text-slate-700">
                            {formatINR(req.itemTotal)}
                          </span>
                          <span>•</span>
                          <span className="text-blue-700 font-semibold">{req.categoryName}</span>
                        </div>
                        {(req.productSku || req.serialNumber) && (
                          <div className="text-[11px] font-mono text-slate-600">
                            <strong>SKU / Serial:</strong>{' '}
                            {[req.productSku, req.serialNumber].filter(Boolean).join(' • ')}
                          </div>
                        )}
                        {req.exchangeOptions && (
                          <div className="text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded-md">
                            Requested Exchange:{' '}
                            <strong>
                              {req.exchangeOptions.requestedSize && `Size: ${req.exchangeOptions.requestedSize}`}
                              {req.exchangeOptions.requestedColor && ` Color: ${req.exchangeOptions.requestedColor}`}
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Customer & Reason */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Customer & Issue
                        </span>
                        <div className="font-bold text-slate-900">
                          {req.customerName} ({req.customerPhone})
                        </div>
                        <div className="text-[11px] text-slate-700">
                          <strong>Reason:</strong>{' '}
                          <span className="text-amber-800 font-semibold">
                            {req.reason.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic line-clamp-2">
                          "{req.reasonDescription || 'No notes entered'}"
                        </p>
                      </div>

                      {/* Doorstep Pickup & Settlement Info */}
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Doorstep Pickup & Fulfillment
                        </span>
                        <div className="text-[11px] text-slate-700 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              {req.pickupSlot || 'Pickup pending schedule'}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            Pickup Address: <span className="font-medium">{req.pickupAddress}</span>
                          </div>
                          {req.assignedPickupRiderName && (
                            <div className="text-emerald-700 font-semibold">
                              Courier: {req.assignedPickupRiderName}
                            </div>
                          )}
                        </div>

                        {req.status === 'refund_processed' && (
                          <div className="pt-1 mt-1 border-t border-slate-200 text-[11px] text-emerald-800 font-bold flex items-center justify-between">
                            <span>Refund Paid: {formatINR(req.refundAmount)}</span>
                            <span className="text-[10px] font-mono text-emerald-700 uppercase">
                              {req.refundMethod.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unboxing Video & Photos Preview if Uploaded */}
                    {(req.unboxingVideoName ||
                      req.unboxingVideoUrl ||
                      (req.evidenceImages && req.evidenceImages.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {(req.unboxingVideoName || req.unboxingVideoUrl) && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Unboxing Video:
                            </span>
                            {req.unboxingVideoUrl ? (
                              <a
                                href={req.unboxingVideoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold hover:bg-blue-100"
                              >
                                {req.unboxingVideoName || 'View Unboxing Video'}
                              </a>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                                {req.unboxingVideoName}
                              </span>
                            )}
                          </div>
                        )}

                        {req.evidenceImages && req.evidenceImages.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Issue Proof ({req.evidenceImages.length}):
                            </span>
                            <div className="flex items-center gap-1.5 overflow-x-auto">
                              {req.evidenceImages.map((imgUrl: string, i: number) => (
                                <a
                                  key={i}
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 shrink-0 block"
                                  title="Click to view full photo"
                                >
                                  <img
                                    src={imgUrl}
                                    alt="Proof"
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Admin Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500">
                        {req.adminNotes && (
                          <span className="text-slate-700">
                            <strong>Admin Note:</strong> {req.adminNotes}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Action 1: Approve Doorstep Pickup */}
                        {['requested', 'approved'].includes(req.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionModal({ type: 'approve_pickup', request: req });
                            }}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Schedule Pickup</span>
                          </button>
                        )}

                        {/* Action 2: Mark Quality Inspected */}
                        {['pickup_scheduled', 'out_for_pickup', 'item_picked_up'].includes(req.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              updateReturnRequestStatus(
                                req.id,
                                'inspected_passed',
                                'Quality inspection passed. Item in acceptable condition for resolution.',
                                currentUser.name
                              );
                              showToast(`Quality verification recorded for ${req.id}!`, 'success');
                            }}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Pass QC Inspection</span>
                          </button>
                        )}

                        {/* Action 3: Process Refund */}
                        {isRefund && ['inspected_passed', 'item_picked_up', 'pickup_scheduled', 'approved', 'requested'].includes(req.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionModal({ type: 'process_refund', request: req });
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Disburse Refund</span>
                          </button>
                        )}

                        {/* Action 4: Dispatch Replacement / Exchange */}
                        {(isReplacement || isExchange) && ['inspected_passed', 'item_picked_up', 'pickup_scheduled', 'approved', 'requested'].includes(req.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionModal({ type: 'dispatch_replacement', request: req });
                            }}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Dispatch {isExchange ? 'Exchange' : 'Replacement'}</span>
                          </button>
                        )}

                        {/* Action 5: Reject Request */}
                        {!['refund_processed', 'completed', 'rejected'].includes(req.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionModal({ type: 'reject', request: req });
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CATEGORY POLICY SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Category-Specific Return Windows & Eligibility Rules
              </h3>
              <p className="text-xs text-slate-500">
                Configure return window closing days, policy mode, refund bonus, and condition terms per category.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl self-start sm:self-center">
              {categoryReturnPolicies.length} Active Categories Configured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryReturnPolicies.map((policy) => {
              const isNonReturnable = policy.policyType === 'non_returnable';

              return (
                <div
                  key={policy.categoryId}
                  className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-2xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            isNonReturnable
                              ? 'bg-slate-100 text-slate-600'
                              : policy.policyType === 'exchange_only'
                              ? 'bg-purple-100 text-purple-700'
                              : policy.policyType === 'replacement_only'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isNonReturnable ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : policy.policyType === 'exchange_only' ? (
                            <ArrowLeftRight className="w-4 h-4" />
                          ) : policy.policyType === 'replacement_only' ? (
                            <RefreshCw className="w-4 h-4" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{policy.categoryName}</h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            Category ID: {policy.categoryId}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingPolicy(policy)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        title="Edit Category Policy"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Window Days & Mode */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>
                          {policy.windowDays > 0 ? `${policy.windowDays}-Day Return Window` : 'Non-Returnable (48h damage replacement)'}
                        </span>
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 uppercase font-mono">
                        {policy.policyType.replace(/_/g, ' ')}
                      </span>

                      {policy.walletBonusPercentage > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          +{policy.walletBonusPercentage}% Wallet Bonus
                        </span>
                      )}
                    </div>

                    {policy.exemptionsNote && (
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        {policy.exemptionsNote}
                      </p>
                    )}

                    {/* Feature Matrix Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          policy.allowRefund
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {policy.allowRefund ? '✓ Refund Allowed' : '✗ No Refund'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded ${
                          policy.allowReplacement
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {policy.allowReplacement ? '✓ Replacement Allowed' : '✗ No Replacement'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded ${
                          policy.allowExchange
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {policy.allowExchange ? '✓ Size/Color Exchange' : '✗ No Exchange'}
                      </span>
                      {policy.requiresOriginalPackaging && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Brand Box Req.
                        </span>
                      )}
                      {policy.requiresTagsIntact && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Tags Intact
                        </span>
                      )}
                      {policy.requiresPhotoProof && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Photos Req.
                        </span>
                      )}
                      {policy.requiresTechnicianInspection && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Tech Doorstep Check
                        </span>
                      )}
                    </div>

                    {/* Condition Terms Preview */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Condition Terms ({policy.termsAndConditions.length})
                      </span>
                      <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                        {policy.termsAndConditions.slice(0, 3).map((term: string, i: number) => (
                          <li key={i} className="truncate">
                            {term}
                          </li>
                        ))}
                        {policy.termsAndConditions.length > 3 && (
                          <li className="text-blue-600 font-semibold list-none">
                            +{policy.termsAndConditions.length - 3} more condition terms
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono">
                      Pickup Reverse Fee:{' '}
                      <strong className="text-slate-800 font-bold">
                        {policy.pickupFee > 0 ? formatINR(policy.pickupFee) : 'Free (₹0)'}
                      </strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => setEditingPolicy(policy)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Configure Terms
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUSTOMER TERMS & WINDOW RULES OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'terms_preview' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
            <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1">
              Customer Policy Disclosure & Standard Operating Procedures (SOP)
            </h3>
            <p className="text-xs text-slate-500">
              These guidelines are rendered dynamically on the order tracking screens and checkout guarantees to establish full transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                <Clock className="w-4 h-4" />
                <span>Return Window Countdown Timer</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The return window countdown begins precisely upon verified delivery (marked via OTP or rider delivery confirmation). Customers can view the exact closing date and real-time days/hours remaining in their tracking panel.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Wallet Refund +5% Bonus</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When customers opt for store wallet credits instead of bank/UPI transfer, an automated 5% extra bonus credit is disbursed immediately upon pickup verification to encourage reinvestment into your store.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase">
                <ArrowLeftRight className="w-4 h-4" />
                <span>Hassle-Free Apparel Exchange</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                For clothing, men's, women's, and kids apparel, customers can select new size and color variants with free reverse pickup. Tags and brand hangers must remain intact.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT CATEGORY POLICY */}
      {/* ========================================================================= */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col my-auto">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Edit Policy: {editingPolicy.categoryName}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    Category: {editingPolicy.categoryId}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPolicy(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSavePolicy} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Display Category Name *
                  </label>
                  <input
                    type="text"
                    value={editingPolicy.categoryName}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, categoryName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Policy Mode / Structure *
                  </label>
                  <select
                    value={editingPolicy.policyType}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        policyType: e.target.value as ReturnPolicyType,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="refund_and_replacement">Refund & Replacement & Exchange</option>
                    <option value="replacement_only">Replacement Only (Defects/DOA)</option>
                    <option value="exchange_only">Exchange Only (Size/Color)</option>
                    <option value="non_returnable">Non-Returnable (Hygiene / Perishable)</option>
                    <option value="inspection_required_return">Technician Doorstep Inspection Required</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Return Window (Days) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={editingPolicy.windowDays}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        windowDays: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Set 0 for non-returnable items</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Wallet Credit Bonus (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={editingPolicy.walletBonusPercentage}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        walletBonusPercentage: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Extra % given when refund to wallet</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Pickup Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingPolicy.pickupFee}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        pickupFee: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">0 for 100% free returns</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Exemption / Terms Note
                </label>
                <textarea
                  value={editingPolicy.exemptionsNote || ''}
                  onChange={(e) =>
                    setEditingPolicy({ ...editingPolicy, exemptionsNote: e.target.value })
                  }
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium"
                />
              </div>

              {/* Toggles */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Permitted Resolutions & Mandatory Requirements
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPolicy.allowRefund}
                      onChange={(e) =>
                        setEditingPolicy({ ...editingPolicy, allowRefund: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Allow Refund</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPolicy.allowReplacement}
                      onChange={(e) =>
                        setEditingPolicy({ ...editingPolicy, allowReplacement: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Allow Replacement</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPolicy.allowExchange}
                      onChange={(e) =>
                        setEditingPolicy({ ...editingPolicy, allowExchange: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Allow Size/Color Exchange</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPolicy.requiresOriginalPackaging}
                      onChange={(e) =>
                        setEditingPolicy({ ...editingPolicy, requiresOriginalPackaging: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Require Original Box</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPolicy.requiresTagsIntact}
                      onChange={(e) =>
                        setEditingPolicy({ ...editingPolicy, requiresTagsIntact: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Require Tags Intact</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPolicy.requiresPhotoProof}
                      onChange={(e) =>
                        setEditingPolicy({ ...editingPolicy, requiresPhotoProof: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Require Photo Proof</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={editingPolicy.requiresTechnicianInspection}
                      onChange={(e) =>
                        setEditingPolicy({
                          ...editingPolicy,
                          requiresTechnicianInspection: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">
                      Technician Doorstep Inspection Required
                    </span>
                  </label>
                </div>
              </div>

              {/* Conditions & Terms Checklist */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Conditions & Terms Checklist (Shown to customer before submitting)
                </label>
                <div className="space-y-1.5 mb-2">
                  {editingPolicy.termsAndConditions.map((term: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                    >
                      <span className="text-slate-700">{term}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveConditionTerm(idx)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newConditionTerm}
                    onChange={(e) => setNewConditionTerm(e.target.value)}
                    placeholder="Add a condition (e.g. Unworn with original price tags)"
                    className="flex-1 p-2 border border-slate-300 rounded-xl bg-white text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddConditionTerm();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddConditionTerm}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Add Term
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Save Policy Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ACTION MODALS (Approve Pickup / Process Refund / Dispatch / Reject) */}
      {/* ========================================================================= */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {actionModal.type === 'approve_pickup' ? (
                  <Truck className="w-5 h-5 text-blue-600" />
                ) : actionModal.type === 'process_refund' ? (
                  <Wallet className="w-5 h-5 text-emerald-600" />
                ) : actionModal.type === 'dispatch_replacement' ? (
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="text-sm font-black text-slate-900">
                  {actionModal.type === 'approve_pickup'
                    ? 'Schedule Doorstep Pickup'
                    : actionModal.type === 'process_refund'
                    ? 'Process Customer Refund'
                    : actionModal.type === 'dispatch_replacement'
                    ? 'Dispatch Replacement Item'
                    : 'Reject Return Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content based on type */}
            <div className="p-4 text-xs space-y-3">
              {/* Common request info */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="font-mono font-bold text-slate-800">{actionModal.request.id}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(actionModal.request.itemTotal)}
                  </span>
                </div>
                <div className="text-slate-700 font-medium">{actionModal.request.productName}</div>
                <div className="text-[11px] text-slate-500">
                  Customer: {actionModal.request.customerName} ({actionModal.request.customerPhone})
                </div>
              </div>

              {/* Form 1: Approve Pickup */}
              {actionModal.type === 'approve_pickup' && (
                <form onSubmit={handleApprovePickupSubmit} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pickup Date *</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Time Window *</label>
                    <select
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                      <option value="12:00 PM - 04:00 PM">Afternoon (12:00 PM - 04:00 PM)</option>
                      <option value="04:00 PM - 08:00 PM">Evening (04:00 PM - 08:00 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Assign In-House Delivery Rider *
                    </label>
                    <select
                      value={assignedRiderId}
                      onChange={(e) => setAssignedRiderId(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                    >
                      {ridersList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.phone}) - {r.outletName || 'Hub'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActionModal(null)}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                    >
                      Confirm Pickup
                    </button>
                  </div>
                </form>
              )}

              {/* Form 2: Process Refund */}
              {actionModal.type === 'process_refund' && (
                <form onSubmit={handleProcessRefundSubmit} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Disbursement Method *
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      <option value="wallet_credits">
                        JE Cash Credit (+5% bonus extra incentive)
                      </option>
                      <option value="bank_transfer_upi">Direct UPI Transfer to Linked Mobile</option>
                      <option value="original_payment">Original Payment Mode / Bank Account</option>
                    </select>
                  </div>

                  {refundMethod === 'wallet_credits' && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Includes 5% JE Cash Bonus Credit!</span>
                      </div>
                      <p>
                        Total to be credited to customer JE Cash balance:{' '}
                        <strong>
                          {formatINR(Math.round(actionModal.request.itemTotal * 1.05))}
                        </strong>{' '}
                        (Item {formatINR(actionModal.request.itemTotal)} + ₹
                        {Math.round(actionModal.request.itemTotal * 0.05)} bonus).
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Settlement Notes / Transaction Ref
                    </label>
                    <input
                      type="text"
                      value={refundNotes}
                      onChange={(e) => setRefundNotes(e.target.value)}
                      placeholder="e.g. Approved by QC inspector, UTR10294829"
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActionModal(null)}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                    >
                      Disburse Refund
                    </button>
                  </div>
                </form>
              )}

              {/* Form 3: Dispatch Replacement */}
              {actionModal.type === 'dispatch_replacement' && (
                <form onSubmit={handleDispatchReplacementSubmit} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Replacement Dispatch AWB / Tracking Code *
                    </label>
                    <input
                      type="text"
                      value={replacementTrackingNumber}
                      onChange={(e) => setReplacementTrackingNumber(e.target.value)}
                      placeholder="e.g. EXPR-DEL-984210"
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white font-mono"
                    />
                  </div>

                  {actionModal.request.exchangeOptions && (
                    <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-[11px]">
                      <strong>Fulfill Exchange Variant:</strong>{' '}
                      {actionModal.request.exchangeOptions.requestedSize &&
                        `Size: ${actionModal.request.exchangeOptions.requestedSize}`}
                      {actionModal.request.exchangeOptions.requestedColor &&
                        ` | Color: ${actionModal.request.exchangeOptions.requestedColor}`}
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Dispatch Notes
                    </label>
                    <input
                      type="text"
                      value={replacementNotes}
                      onChange={(e) => setReplacementNotes(e.target.value)}
                      placeholder="e.g. Fresh sealed unit packed with QC check"
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActionModal(null)}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
                    >
                      Confirm Dispatch
                    </button>
                  </div>
                </form>
              )}

              {/* Form 4: Reject Request */}
              {actionModal.type === 'reject' && (
                <form onSubmit={handleRejectSubmit} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Reason for Rejection *
                    </label>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Specify reason (e.g. Item returned without brand tags and shows heavy usage, exceeding policy terms)"
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                      required
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActionModal(null)}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
