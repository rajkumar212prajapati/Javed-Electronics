import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { BusinessCategory, CategoryApprovalStatus, CategoryAttribute } from '../../types';
import {
  FolderTree,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Tag,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  Check,
  X,
  Sliders,
} from 'lucide-react';

export const CategoryApprovalManager: React.FC = () => {
  const { businessCategories, createBusinessCategory, updateCategoryApprovalStatus, currentRole } = useStore();
  const isSuperAdmin = currentRole === 'super_admin';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewingCategory, setReviewingCategory] = useState<BusinessCategory | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  // Form states for creating a new business category
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [defaultGstRate, setDefaultGstRate] = useState(18);
  const [defaultCommission, setDefaultCommission] = useState(6.5);
  const [returnWindowDays, setReturnWindowDays] = useState(7);
  const [requiresEanBarcode, setRequiresEanBarcode] = useState(true);
  const [requiresBatchNumber, setRequiresBatchNumber] = useState(false);
  const [requiresExpiryDate, setRequiresExpiryDate] = useState(false);
  const [requiresPrescription, setRequiresPrescription] = useState(false);

  const filteredCategories = businessCategories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cat.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CategoryApprovalStatus) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Live & Published</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1"><FileCheck className="w-3 h-3" /> Approved</span>;
      case 'under_review':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Under Review</span>;
      case 'submitted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Submitted</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      case 'draft':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">Draft</span>;
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    createBusinessCategory({
      name,
      code,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      iconName: 'Package',
      description,
      customAttributes: [
        { id: 'attr_1', name: 'Brand Warranty Period', type: 'select', required: true, options: ['6 Months', '1 Year', '2 Years'] },
        { id: 'attr_2', name: 'Color Finish', type: 'text', required: false },
      ],
      requiresBatchNumber,
      requiresExpiryDate,
      requiresPrescription,
      requiresEanBarcode,
      defaultGstRate: Number(defaultGstRate),
      returnWindowDays: Number(returnWindowDays),
      defaultCommissionPercent: Number(defaultCommission),
      approvalStatus: isSuperAdmin ? 'approved' : 'submitted',
      proposedBy: isSuperAdmin ? 'Super Admin' : 'Store Manager',
      approvedBy: isSuperAdmin ? 'Super Admin' : undefined,
      isActive: true,
    });

    setShowCreateModal(false);
    setName('');
    setCode('');
    setSlug('');
    setDescription('');
  };

  const handleUpdateStatus = (status: CategoryApprovalStatus) => {
    if (!reviewingCategory) return;
    updateCategoryApprovalStatus(reviewingCategory.id, status, reviewNote);
    setReviewingCategory(null);
    setReviewNote('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-blue-600" />
            <span>Marketplace Catalog & Category Approval Governance</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enforce taxonomy, GTIN barcode requirements, tax rates (GST), and audit workflow before products go live.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Propose Category</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search category name, code, description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['all', 'published', 'approved', 'under_review', 'submitted', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {status === 'all' ? 'All Statuses' : status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    {category.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{category.name}</h3>
                </div>
                {getStatusBadge(category.approvalStatus)}
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 mb-3">{category.description}</p>

              {/* Tax & Commission specs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2.5 text-xs mb-3 border border-slate-100">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">GST Rate</span>
                  <span className="font-bold text-slate-800 font-mono">{category.defaultGstRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Commission</span>
                  <span className="font-bold text-blue-700 font-mono">{category.defaultCommissionPercent}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Return</span>
                  <span className="font-bold text-slate-800">{category.returnWindowDays} Days</span>
                </div>
              </div>

              {/* Regulatory flags */}
              <div className="space-y-1 text-xs text-slate-600 mb-3">
                <div className="flex items-center gap-1.5">
                  {category.requiresEanBarcode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Official EAN / GTIN Barcode mandatory</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {category.requiresBatchNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Batch / Lot traceability mandatory</span>
                </div>
              </div>

              {category.approvalNote && (
                <div className="text-[11px] bg-amber-50 text-amber-800 p-2 rounded border border-amber-200 mb-3">
                  <span className="font-semibold">Reviewer Note: </span>
                  {category.approvalNote}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                Proposed by: <strong className="text-slate-600">{category.proposedBy || 'Admin'}</strong>
              </span>

              {isSuperAdmin && (
                <div className="flex items-center gap-1">
                  {category.approvalStatus !== 'published' && (
                    <button
                      onClick={() => setReviewingCategory(category)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Review & Status</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* REVIEW & STATUS CHANGE MODAL */}
      {reviewingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Audit & Review: {reviewingCategory.name}
                </h3>
                <span className="text-xs text-slate-500 font-mono">{reviewingCategory.code}</span>
              </div>
              <button
                onClick={() => setReviewingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit / Approval Feedback Note
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Catalog nomenclature verified; GST HSN verified 8517; approved for marketplace vendors."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => handleUpdateStatus('rejected')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Reject Category
              </button>
              <button
                onClick={() => handleUpdateStatus('under_review')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Put Under Review
              </button>
              <button
                onClick={() => handleUpdateStatus('approved')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateStatus('published')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Approve & Publish Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Propose New Business Category</h3>
                <p className="text-xs text-slate-500">Configure taxonomy, commission, GST rate, and barcode rules</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder="e.g. Smart Wearables & Fitness"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CAT-WEAR-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Smartwatches, heart-rate bands, smart rings and biometric accessories..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Rate %</label>
                  <input
                    type="number"
                    value={defaultGstRate}
                    onChange={(e) => setDefaultGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Commission %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={defaultCommission}
                    onChange={(e) => setDefaultCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Window (Days)</label>
                  <input
                    type="number"
                    value={returnWindowDays}
                    onChange={(e) => setReturnWindowDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresEanBarcode}
                    onChange={(e) => setRequiresEanBarcode(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-800">Mandate Official GS1 / EAN-13 Barcode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresBatchNumber}
                    onChange={(e) => setRequiresBatchNumber(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-slate-700">Require Batch / Lot traceability</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Submit Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
