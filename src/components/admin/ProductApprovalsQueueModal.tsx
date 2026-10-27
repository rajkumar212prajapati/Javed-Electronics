import React, { useState } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  Sparkles,
  TrendingUp,
  Tag,
  Eye,
  Edit2,
  AlertCircle,
  X,
  Check,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface ProductApprovalsQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProduct: (p: Product) => void;
}

export const ProductApprovalsQueueModal: React.FC<ProductApprovalsQueueModalProps> = ({
  isOpen,
  onClose,
  onEditProduct,
}) => {
  const { products, approveProduct, rejectProduct } = useStore();
  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return p.approvalStatus === 'pending';
    if (activeFilter === 'approved') return p.approvalStatus === 'approved' || (!p.approvalStatus && p.status === 'published');
    if (activeFilter === 'rejected') return p.approvalStatus === 'rejected';
    return true;
  });

  const pendingCount = products.filter((p) => p.approvalStatus === 'pending').length;

  const handleApprove = (productId: string) => {
    const res = approveProduct(productId);
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
    }
  };

  const handleRejectConfirm = (productId: string) => {
    if (!rejectFeedback.trim()) {
      alert('Please enter feedback explaining why the product was rejected.');
      return;
    }
    const res = rejectProduct(productId, rejectFeedback);
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      setRejectingId(null);
      setRejectFeedback('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Product Catalogue Approvals Queue</h3>
                {pendingCount > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                    {pendingCount} Pending Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Review, approve, or reject products and pricing submitted by store managers and sellers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {statusMsg && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-5 pt-2 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'pending'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review ({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('approved')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'approved'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Live</span>
          </button>
          <button
            onClick={() => setActiveFilter('rejected')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'rejected'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            All Products ({products.length})
          </button>
        </div>

        {/* Approvals List */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="font-semibold text-slate-700 text-sm">No products currently in this queue</p>
              <p className="text-xs">
                All store submissions have been reviewed and published.
              </p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const margin = p.purchaseCost && p.regularPrice > p.purchaseCost
                ? Math.round(((p.regularPrice - p.purchaseCost) / p.regularPrice) * 1000) / 10
                : null;
              const isRejecting = rejectingId === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images[0] || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'}
                        alt={p.name}
                        className="w-14 h-14 object-contain rounded-xl bg-slate-50 border border-slate-200 p-1 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                          <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {p.brand}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              p.approvalStatus === 'pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : p.approvalStatus === 'approved' || p.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {p.approvalStatus || p.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <Store className="w-3.5 h-3.5 text-blue-600" />
                            <span>Submitted by: <strong>{p.submittedBy?.storeName || p.submittedBy?.userName || 'Store Manager'}</strong></span>
                          </span>
                          <span className="text-slate-400">
                            {p.submittedBy?.submittedAt
                              ? new Date(p.submittedBy.submittedAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Margin Pill */}
                    <div className="flex items-center gap-3 text-xs shrink-0 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">MRP</span>
                        <span className="font-mono line-through text-slate-600">{formatINR(p.mrp)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Sale Price</span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          {formatINR(p.dealPrice || p.regularPrice)}
                        </span>
                      </div>
                      {margin !== null && (
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Margin</span>
                          <span className="font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[11px]">
                            {margin}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEO & Description Preview */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Tag className="w-3 h-3 text-indigo-600" />
                      <span>SEO Title:</span>
                      <span className="font-mono text-slate-900 font-normal">{p.seoTitle || p.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{p.description}</p>
                  </div>

                  {/* Rejection Feedback Form */}
                  {isRejecting && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                      <label className="font-bold text-rose-900 block">
                        Reason for Rejection (Visible to submitting store):
                      </label>
                      <input
                        type="text"
                        value={rejectFeedback}
                        onChange={(e) => setRejectFeedback(e.target.value)}
                        placeholder="e.g. Selling price exceeds local market rates; please adjust closer to wholesale cost."
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-slate-900"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setRejectingId(null)}
                          className="px-3 py-1 bg-white text-slate-600 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRejectConfirm(p.id)}
                          className="px-4 py-1 bg-rose-600 text-white font-bold rounded cursor-pointer"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Row */}
                  {!isRejecting && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        HSN: {p.hsnCode || '8517'} | GST: {p.gstRate || 18}% | Stock: {p.stock.onHand}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onEditProduct(p);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit with AI</span>
                        </button>

                        {p.approvalStatus !== 'approved' && p.status !== 'published' && (
                          <button
                            onClick={() => {
                              setRejectingId(p.id);
                              setRejectFeedback('');
                            }}
                            className="px-3 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        {p.approvalStatus !== 'approved' && (
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Publish</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Approved products become instantly active in the public storefront and store registers.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
