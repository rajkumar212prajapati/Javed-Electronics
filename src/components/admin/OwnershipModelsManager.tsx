import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { OutletOwnershipRules, OutletOwnershipModelType } from '../../types';
import {
  Briefcase,
  Percent,
  Calendar,
  Shield,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Building,
  Store,
  Layers,
  Sparkles,
  Edit2,
  Save,
  XCircle,
} from 'lucide-react';

export const OwnershipModelsManager: React.FC = () => {
  const { ownershipModels, updateOwnershipModel, currentRole } = useStore();
  const isSuperAdmin = currentRole === 'super_admin';

  const [editingModel, setEditingModel] = useState<OutletOwnershipRules | null>(null);

  // Form states for editing a model's terms
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [franchiseRoyalty, setFranchiseRoyalty] = useState<number>(0);
  const [revenueShare, setRevenueShare] = useState<number>(0);
  const [payoutSchedule, setPayoutSchedule] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [agreementDurationMonths, setAgreementDurationMonths] = useState<number>(36);
  const [customTerms, setCustomTerms] = useState<string>('');

  const handleEdit = (model: OutletOwnershipRules) => {
    setEditingModel(model);
    setPlatformFee(model.platformFeePercent);
    setFranchiseRoyalty(model.franchiseRoyaltyPercent);
    setRevenueShare(model.revenueSharePercent);
    setPayoutSchedule(model.payoutSchedule);
    setAgreementDurationMonths(model.agreementDurationMonths);
    setCustomTerms(model.customTerms || '');
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;

    updateOwnershipModel({
      ...editingModel,
      platformFeePercent: Number(platformFee),
      franchiseRoyaltyPercent: Number(franchiseRoyalty),
      revenueSharePercent: Number(revenueShare),
      payoutSchedule,
      agreementDurationMonths: Number(agreementDurationMonths),
      customTerms,
    });

    setEditingModel(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Intro Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Multi-Outlet Business & Ownership Frameworks</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure contractual agreements, revenue shares, inventory liability, and royalty payouts across COCO, FOCO, FOFO, and Dealer models.
            </p>
          </div>
          <span className="self-start sm:self-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
            {ownershipModels.length} Active Enterprise Models
          </span>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {ownershipModels.map((model) => (
          <div
            key={model.modelType}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {model.modelType}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5">{model.title}</h3>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleEdit(model)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Configure Model Rules"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-600 mb-4">{model.description}</p>

              {/* Responsibilities Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Ownership & Asset</span>
                  <span className="font-semibold text-slate-800 capitalize">{model.ownership}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Operations</span>
                  <span className="font-semibold text-slate-800 capitalize">{model.operationsResponsibility}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Inventory Risk</span>
                  <span className="font-semibold text-slate-800 capitalize">{model.inventoryOwnership}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Pricing Control</span>
                  <span className="font-semibold text-slate-800 capitalize">{model.pricingAuthority.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Financial percentages */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Platform Technology Fee:</span>
                  <span className="font-bold font-mono text-blue-900">{model.platformFeePercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Brand Royalty:</span>
                  <span className="font-bold font-mono text-purple-900">{model.franchiseRoyaltyPercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Outlet Revenue Share:</span>
                  <span className="font-bold font-mono text-emerald-900">{model.revenueSharePercent}%</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-blue-200/60">
                  <span className="text-slate-600">Payout Settlement:</span>
                  <span className="font-semibold capitalize text-slate-900">{model.payoutSchedule}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Standard Agreement Duration:</span>
                  <span className="font-semibold text-slate-900">{model.agreementDurationMonths} Months</span>
                </div>
              </div>

              {model.customTerms && (
                <div className="mt-3 text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                  Note: {model.customTerms}
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => handleEdit(model)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Adjust Percentages & Terms</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* EDIT MODEL MODAL */}
      {editingModel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Configure {editingModel.title}
                </h3>
                <p className="text-xs text-slate-500">Update financial distribution and contract parameters</p>
              </div>
              <button
                onClick={() => setEditingModel(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Platform Fee %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Franchise Royalty %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={franchiseRoyalty}
                    onChange={(e) => setFranchiseRoyalty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Revenue Share %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={revenueShare}
                    onChange={(e) => setRevenueShare(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payout Schedule</label>
                  <select
                    value={payoutSchedule}
                    onChange={(e) => setPayoutSchedule(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  >
                    <option value="daily">Daily Settlement</option>
                    <option value="weekly">Weekly Reconciliation</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly by 5th</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Agreement Duration (Months)</label>
                  <input
                    type="number"
                    value={agreementDurationMonths}
                    onChange={(e) => setAgreementDurationMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contractual Terms & Clauses</label>
                <textarea
                  rows={3}
                  value={customTerms}
                  onChange={(e) => setCustomTerms(e.target.value)}
                  placeholder="e.g. Weekly stock audit, minimum floor guarantee, standard SLA..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingModel(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
