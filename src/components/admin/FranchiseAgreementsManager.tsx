import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { FranchiseAgreement, OutletOwnershipModelType } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Edit2,
  XCircle,
} from 'lucide-react';

export const FranchiseAgreementsManager: React.FC = () => {
  const { franchiseAgreements, createAgreement, updateAgreement, outlets, currentRole } = useStore();
  const isSuperAdmin = currentRole === 'super_admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<FranchiseAgreement | null>(null);

  // Form states
  const [outletId, setOutletId] = useState(outlets[0]?.id || '');
  const [partnerName, setPartnerName] = useState('');
  const [modelType, setModelType] = useState<OutletOwnershipModelType>('FOCO');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0]);
  const [renewalDate, setRenewalDate] = useState(new Date(Date.now() + 670 * 86400000).toISOString().split('T')[0]);
  const [revenueShare, setRevenueShare] = useState(18);
  const [royalty, setRoyalty] = useState(8);
  const [platformFee, setPlatformFee] = useState(15000);
  const [minimumGuarantee, setMinimumGuarantee] = useState(60000);
  const [complianceScore, setComplianceScore] = useState(94);
  const [status, setStatus] = useState<FranchiseAgreement['status']>('active');

  const filteredAgreements = franchiseAgreements.filter((agr) => {
    const matchesSearch =
      agr.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agr.franchisePartnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agr.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const expiringCount = franchiseAgreements.filter((a) => a.status === 'renewal_due').length;

  const getStatusBadge = (s: FranchiseAgreement['status']) => {
    switch (s) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active & Compliant</span>;
      case 'renewal_due':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Renewal Due (&lt;60d)</span>;
      case 'under_audit':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Under Annual Audit</span>;
      case 'expired':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Expired</span>;
      case 'terminated':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Terminated</span>;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const out = outlets.find((o) => o.id === outletId);

    if (editingAgreement) {
      updateAgreement({
        ...editingAgreement,
        outletId,
        outletName: out?.name || editingAgreement.outletName,
        franchisePartnerName: partnerName,
        modelType,
        startDate,
        endDate,
        renewalDate,
        revenueSharePercent: Number(revenueShare),
        royaltyPercent: Number(royalty),
        platformFeeMonthly: Number(platformFee),
        minimumMonthlyGuarantee: Number(minimumGuarantee),
        complianceScore: Number(complianceScore),
        status,
      });
    } else {
      createAgreement({
        outletId,
        outletName: out?.name || 'Franchise Branch',
        franchisePartnerName: partnerName || 'Regional Franchisee',
        modelType,
        startDate,
        endDate,
        renewalDate,
        revenueSharePercent: Number(revenueShare),
        royaltyPercent: Number(royalty),
        platformFeeMonthly: Number(platformFee),
        minimumMonthlyGuarantee: Number(minimumGuarantee),
        inventoryOwnership: modelType === 'FOCO' ? 'company' : 'franchise',
        pricingAuthority: 'central',
        complianceScore: Number(complianceScore),
        status,
        documentNumber: `JE-FRAN-2026-00${franchiseAgreements.length + 1}`,
      });
    }

    setShowCreateModal(false);
    setEditingAgreement(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Expiry Alert Banner if any */}
      {expiringCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Franchise Renewal Alert: </span>
              {expiringCount} franchise agreement(s) are due for renewal within the next 60 days. Initiate contract extensions or performance audits.
            </div>
          </div>
          <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded">
            {expiringCount} Due
          </span>
        </div>
      )}

      {/* Intro Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Franchise Partner Contracts & Compliance Governance</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track legal documentation, minimum floor guarantees, royalty schedules, and audit scores for all FOCO & FOFO partners.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditingAgreement(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>New Agreement</span>
          </button>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search agreement document number, partner, outlet..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
        >
          <option value="all">All Contract Statuses</option>
          <option value="active">Active & Compliant</option>
          <option value="renewal_due">Renewal Due</option>
          <option value="under_audit">Under Audit</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Agreements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgreements.map((agr) => (
          <div
            key={agr.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {agr.documentNumber}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5">{agr.outletName}</h3>
                  <span className="text-xs text-slate-600">Partner: <strong>{agr.franchisePartnerName}</strong></span>
                </div>
                {getStatusBadge(agr.status)}
              </div>

              {/* Compliance score progress */}
              <div className="my-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600 font-medium">Compliance & Audit Score:</span>
                  <span className="font-bold font-mono text-slate-900">{agr.complianceScore} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      agr.complianceScore >= 90
                        ? 'bg-emerald-500'
                        : agr.complianceScore >= 75
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${agr.complianceScore}%` }}
                  />
                </div>
              </div>

              {/* Terms breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Model</span>
                  <span className="font-bold text-slate-800">{agr.modelType}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Royalty</span>
                  <span className="font-bold font-mono text-purple-700">{agr.royaltyPercent}%</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Rev Share</span>
                  <span className="font-bold font-mono text-emerald-700">{agr.revenueSharePercent}%</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Min Guarantee</span>
                  <span className="font-bold font-mono text-slate-800">{formatINR(agr.minimumMonthlyGuarantee)}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Start: <strong className="text-slate-700 font-mono">{agr.startDate}</strong></span>
                <span>Renewal: <strong className="text-blue-700 font-mono">{agr.renewalDate}</strong></span>
                <span>End: <strong className="text-slate-700 font-mono">{agr.endDate}</strong></span>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setEditingAgreement(agr);
                    setOutletId(agr.outletId);
                    setPartnerName(agr.franchisePartnerName);
                    setModelType(agr.modelType);
                    setStartDate(agr.startDate);
                    setEndDate(agr.endDate);
                    setRenewalDate(agr.renewalDate);
                    setRevenueShare(agr.revenueSharePercent);
                    setRoyalty(agr.royaltyPercent);
                    setPlatformFee(agr.platformFeeMonthly);
                    setMinimumGuarantee(agr.minimumMonthlyGuarantee);
                    setComplianceScore(agr.complianceScore);
                    setStatus(agr.status);
                    setShowCreateModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modify Contract Terms</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingAgreement ? `Edit Agreement ${editingAgreement.documentNumber}` : 'Draft Franchise Agreement'}
                </h3>
                <p className="text-xs text-slate-500">Legal covenants, royalties, and compliance requirements</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Outlet</label>
                  <select
                    value={outletId}
                    onChange={(e) => setOutletId(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Franchise Model</label>
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="FOCO">FOCO (Franchise-Owned, Company-Operated)</option>
                    <option value="FOFO">FOFO (Franchise-Operated)</option>
                    <option value="dealer">Authorized Regional Dealer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Franchise Partner Name</label>
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. Tariq Ansari Enterprise"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Royalty %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={royalty}
                    onChange={(e) => setRoyalty(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rev Share %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={revenueShare}
                    onChange={(e) => setRevenueShare(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Min Guarantee (INR)</label>
                  <input
                    type="number"
                    value={minimumGuarantee}
                    onChange={(e) => setMinimumGuarantee(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Renewal Audit Date</label>
                  <input
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
