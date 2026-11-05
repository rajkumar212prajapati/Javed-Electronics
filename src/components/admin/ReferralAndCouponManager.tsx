import React, { useState, useMemo } from 'react';
import {
  Gift,
  Tag,
  Ticket,
  Percent,
  Users,
  Award,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Coupon, ProductCategory, ReferralRecord } from '../../types';
import { formatINR } from '../../utils/currency';

export const ReferralAndCouponManager: React.FC = () => {
  const {
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    referralProgramConfig,
    updateReferralProgramConfig,
    referralRecords,
    awardReferralBonus,
    cancelReferralRecord,
    adjustCustomerWalletBalance,
    currentUser,
    categories,
    outlets,
    accounts,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'referral_config' | 'referral_ledger' | 'wallets'>('coupons');

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ==========================================
  // COUPONS STATE & LOGIC
  // ==========================================
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Add / Edit Coupon Modal State
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Form states
  const [codeForm, setCodeForm] = useState('');
  const [discountTypeForm, setDiscountTypeForm] = useState<'percentage' | 'fixed' | 'free_delivery'>('fixed');
  const [valueForm, setValueForm] = useState<number>(100);
  const [minOrderForm, setMinOrderForm] = useState<number>(499);
  const [maxDiscountForm, setMaxDiscountForm] = useState<number | undefined>(undefined);
  const [daysValidForm, setDaysValidForm] = useState<number>(30);
  const [usageLimitForm, setUsageLimitForm] = useState<number>(200);
  const [descForm, setDescForm] = useState('');
  const [categoryRestrictionForm, setCategoryRestrictionForm] = useState<ProductCategory | 'all'>('all');
  const [applicableOutletsForm, setApplicableOutletsForm] = useState<string>('all');
  const [isActiveForm, setIsActiveForm] = useState(true);

  const handleOpenCreateCoupon = () => {
    setModalMode('create');
    setEditingCoupon(null);
    setCodeForm('');
    setDiscountTypeForm('fixed');
    setValueForm(100);
    setMinOrderForm(499);
    setMaxDiscountForm(undefined);
    setDaysValidForm(30);
    setUsageLimitForm(200);
    setDescForm('');
    setCategoryRestrictionForm('all');
    setApplicableOutletsForm('all');
    setIsActiveForm(true);
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (coup: Coupon) => {
    setModalMode('edit');
    setEditingCoupon(coup);
    setCodeForm(coup.code);
    setDiscountTypeForm(coup.discountType);
    setValueForm(coup.value);
    setMinOrderForm(coup.minOrderValue);
    setMaxDiscountForm(coup.maxDiscount);
    const validUntilDate = new Date(coup.validUntil);
    const diffDays = Math.max(1, Math.round((validUntilDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    setDaysValidForm(diffDays);
    setUsageLimitForm(coup.usageLimit);
    setDescForm(coup.description);
    setCategoryRestrictionForm(coup.categoryRestriction || 'all');
    setApplicableOutletsForm(coup.applicableOutlets && Array.isArray(coup.applicableOutlets) ? coup.applicableOutlets[0] : 'all');
    setIsActiveForm(coup.isActive);
    setShowCouponModal(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codeForm.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      showFeedback('error', 'Please enter a valid coupon code.');
      return;
    }

    const validUntil = new Date(Date.now() + Number(daysValidForm) * 86400000).toISOString();
    const payload = {
      code: cleanCode,
      discountType: discountTypeForm,
      value: Number(valueForm) || 0,
      minOrderValue: Number(minOrderForm) || 0,
      maxDiscount: discountTypeForm === 'percentage' && maxDiscountForm ? Number(maxDiscountForm) : undefined,
      validUntil,
      usageLimit: Number(usageLimitForm) || 100,
      description: descForm.trim() || `Instant ${discountTypeForm === 'percentage' ? `${valueForm}%` : `₹${valueForm}`} discount`,
      isActive: isActiveForm,
      categoryRestriction: categoryRestrictionForm === 'all' ? undefined : categoryRestrictionForm,
      applicableOutlets: applicableOutletsForm === 'all' ? ('all' as const) : [applicableOutletsForm],
    };

    if (modalMode === 'create') {
      // Check duplicate code
      if (coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
        showFeedback('error', `A coupon with code "${cleanCode}" already exists.`);
        return;
      }
      addCoupon({
        ...payload,
        createdAt: new Date().toISOString(),
      });
      showFeedback('success', `Coupon code "${cleanCode}" created successfully!`);
    } else if (editingCoupon) {
      updateCoupon(editingCoupon.id, payload);
      showFeedback('success', `Coupon code "${cleanCode}" updated successfully!`);
    }

    setShowCouponModal(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCoupons = useMemo(() => {
    const search = couponSearch.trim().toLowerCase();
    const nowTime = Date.now();
    return coupons.filter((c) => {
      const isExpired = new Date(c.validUntil).getTime() < nowTime;
      if (couponFilter === 'active' && (!c.isActive || isExpired)) return false;
      if (couponFilter === 'inactive' && c.isActive) return false;
      if (couponFilter === 'expired' && !isExpired) return false;

      if (search) {
        return (
          c.code.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.discountType.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [coupons, couponSearch, couponFilter]);

  // ==========================================
  // REFERRAL PROGRAM CONFIG STATE & LOGIC
  // ==========================================
  const [configForm, setConfigForm] = useState(referralProgramConfig);
  const [configDirty, setConfigDirty] = useState(false);

  const handleConfigChange = <K extends keyof typeof referralProgramConfig>(field: K, val: typeof referralProgramConfig[K]) => {
    setConfigForm((prev) => ({ ...prev, [field]: val }));
    setConfigDirty(true);
  };

  const handleSaveProgramConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateReferralProgramConfig(configForm, currentUser.name || 'Super Admin');
    if (res.success) {
      setConfigDirty(false);
      showFeedback('success', 'Refer & Earn program structure saved successfully!');
    }
  };

  // ==========================================
  // REFERRAL AUDIT LEDGER STATE & LOGIC
  // ==========================================
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'all' | 'awarded' | 'pending_order' | 'cancelled'>('all');

  const filteredLedger = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    return referralRecords.filter((rec) => {
      if (ledgerStatusFilter !== 'all' && rec.status !== ledgerStatusFilter) return false;
      if (q) {
        return (
          rec.referrerName.toLowerCase().includes(q) ||
          rec.referrerCode.toLowerCase().includes(q) ||
          rec.referrerPhone.toLowerCase().includes(q) ||
          rec.refereeName.toLowerCase().includes(q) ||
          (rec.refereePhone && rec.refereePhone.includes(q)) ||
          (rec.qualifyingOrderId && rec.qualifyingOrderId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [referralRecords, ledgerSearch, ledgerStatusFilter]);

  // ==========================================
  // WALLET MANAGEMENT MODAL & LOGIC
  // ==========================================
  const [selectedWalletUser, setSelectedWalletUser] = useState<{ id: string; name: string; phone: string; balance: number } | null>(null);
  const [walletActionType, setWalletActionType] = useState<'credit' | 'debit'>('credit');
  const [walletAdjustmentAmount, setWalletAdjustmentAmount] = useState<number>(100);
  const [walletAdjustmentReason, setWalletAdjustmentReason] = useState<string>('Customer support loyalty credit');
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleOpenWalletAdjustment = (user: { id: string; name: string; phone: string; balance: number }) => {
    setSelectedWalletUser(user);
    setWalletAdjustmentAmount(100);
    setWalletActionType('credit');
    setWalletAdjustmentReason('Customer loyalty gesture');
    setShowWalletModal(true);
  };

  const handleCommitWalletAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletUser) return;
    const amount = Number(walletAdjustmentAmount) || 0;
    if (amount <= 0) {
      showFeedback('error', 'Please enter an amount greater than ₹0.');
      return;
    }
    const signedAmount = walletActionType === 'credit' ? amount : -amount;
    const res = adjustCustomerWalletBalance(
      selectedWalletUser.phone || selectedWalletUser.id,
      signedAmount,
      walletAdjustmentReason
    );
    if (res.success) {
      showFeedback('success', res.message);
      setShowWalletModal(false);
    }
  };

  // Metrics summary
  const totalCouponsCount = coupons.length;
  const activeCouponsCount = coupons.filter(
    (c) => c.isActive && new Date(c.validUntil).getTime() > Date.now()
  ).length;
  const totalReferralRedemptions = referralRecords.length;
  const totalAwardedBonus = referralRecords
    .filter((r) => r.status === 'awarded')
    .reduce((sum, r) => sum + r.rewardAmount, 0);
  const pendingReferralsCount = referralRecords.filter((r) => r.status === 'pending_order').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-linear-to-tr from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Coupons &amp; Refer &amp; Earn Control Hub
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    referralProgramConfig.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {referralProgramConfig.isEnabled ? 'Program Active' : 'Program Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure promotional discount codes, manage viral Refer &amp; Earn rewards, inspect referral ledgers, and manage customer credit wallets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreateCoupon}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Create New Coupon</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Total Coupons</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">{totalCouponsCount}</span>
              <span className="text-[10px] text-emerald-600 font-bold">{activeCouponsCount} Active &amp; Valid</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Refer &amp; Earn Rewards</span>
              <span className="text-lg font-black text-indigo-600 mt-0.5 block">
                ₹{referralProgramConfig.refereeRewardAmount} + ₹{referralProgramConfig.referrerRewardAmount}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Min Order: ₹{referralProgramConfig.minOrderValueToQualify}</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Referral Claims</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">{totalReferralRedemptions}</span>
              <span className="text-[10px] text-amber-600 font-bold">{pendingReferralsCount} Pending First Order</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Total Rewards Awarded</span>
              <span className="text-lg font-black text-emerald-700 mt-0.5 block">{formatINR(totalAwardedBonus)}</span>
              <span className="text-[10px] text-slate-500 font-medium">Auto-credited on delivery</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveSubTab('coupons')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'coupons'
              ? 'border-pink-600 text-pink-700 bg-pink-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Promo Coupons ({coupons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('referral_config')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'referral_config'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Refer &amp; Earn Program Structure</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('referral_ledger')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'referral_ledger'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Referral Audit Ledger ({referralRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('wallets')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'wallets'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Customer JE Cash &amp; Adjustments</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: PROMO COUPONS MANAGEMENT */}
      {/* ======================================================== */}
      {activeSubTab === 'coupons' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    placeholder="Search promo codes or descriptions..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                  {couponSearch && (
                    <button
                      onClick={() => setCouponSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-bold">
                  {(['all', 'active', 'inactive', 'expired'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setCouponFilter(mode)}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer capitalize ${
                        couponFilter === mode
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-900">{filteredCoupons.length}</strong> of {coupons.length} coupons
              </div>
            </div>

            {/* Coupons Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Coupon Code</th>
                    <th className="py-2.5 px-3">Discount Type &amp; Value</th>
                    <th className="py-2.5 px-3 font-mono">Min Order / Cap</th>
                    <th className="py-2.5 px-3">Usage Progress</th>
                    <th className="py-2.5 px-3">Expiry / Validity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No coupons found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coup) => {
                      const isExpired = new Date(coup.validUntil).getTime() < Date.now();
                      const usagePct = Math.min(100, Math.round(((coup.timesUsed || 0) / coup.usageLimit) * 100));

                      return (
                        <tr key={coup.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900 text-xs px-2 py-0.5 rounded bg-pink-50 border border-pink-200 text-pink-700 tracking-wider">
                                {coup.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(coup.code)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/60 cursor-pointer"
                                title="Copy code"
                              >
                                {copiedCode === coup.code ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 block">
                              {coup.description}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">
                              {coup.discountType === 'percentage'
                                ? `${coup.value}% Off`
                                : coup.discountType === 'fixed'
                                ? `₹${coup.value} Off`
                                : 'Free Shipping'}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                              {coup.discountType.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-mono">
                            <span className="font-semibold text-slate-800">
                              Min: ₹{coup.minOrderValue}
                            </span>
                            {coup.maxDiscount && (
                              <span className="text-[10px] text-slate-500 block">
                                Max Cap: ₹{coup.maxDiscount}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                                <span>{coup.timesUsed || 0} used</span>
                                <span className="text-slate-400">{coup.usageLimit} max</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    usagePct >= 90 ? 'bg-rose-500' : 'bg-pink-500'
                                  }`}
                                  style={{ width: `${usagePct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono text-[11px]">
                                {new Date(coup.validUntil).toLocaleDateString()}
                              </span>
                            </div>
                            {isExpired ? (
                              <span className="text-[10px] font-bold text-rose-600 block mt-0.5">Expired</span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">Valid &amp; Live</span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                toggleCouponStatus(coup.id);
                                showFeedback('success', `Coupon ${coup.code} toggled ${!coup.isActive ? 'Active' : 'Inactive'}.`);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                                coup.isActive && !isExpired
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {coup.isActive && !isExpired ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCoupon(coup)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                                title="Edit coupon parameters"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete coupon ${coup.code}?`)) {
                                    deleteCoupon(coup.id);
                                    showFeedback('success', `Coupon ${coup.code} deleted.`);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                                title="Delete coupon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: REFER & EARN PROGRAM STRUCTURE */}
      {/* ======================================================== */}
      {activeSubTab === 'referral_config' && (
        <form onSubmit={handleSaveProgramConfig} className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Refer &amp; Earn Incentive Program Rules</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure both sides of the referral loop: the new friend's instant shopping discount and the referrer's wallet cashback.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <span>Program Master Switch:</span>
                <input
                  type="checkbox"
                  checked={configForm.isEnabled}
                  onChange={(e) => handleConfigChange('isEnabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${configForm.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  {configForm.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>

              <button
                type="submit"
                disabled={!configDirty}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                  configDirty
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Save Program Rules</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Card: Customer & Referee Rewards */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
                <Gift className="w-4 h-4 text-pink-600" />
                <span>Reward Value Structure</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Referee Benefit (Instant Coupon Discount for Invited Friend):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={configForm.refereeRewardAmount}
                    onChange={(e) => handleConfigChange('refereeRewardAmount', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    min={0}
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  New user gets this as an instant discount coupon applied at checkout.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Referrer Cashback (Credited to Referrer&apos;s Reward Wallet):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={configForm.referrerRewardAmount}
                    onChange={(e) => handleConfigChange('referrerRewardAmount', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    min={0}
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Credited to the referring customer&apos;s in-app wallet balance once the referee&apos;s order is fulfilled.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Minimum Order Value to Qualify for Reward:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={configForm.minOrderValueToQualify}
                    onChange={(e) => handleConfigChange('minOrderValueToQualify', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    min={0}
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Prevents abuse on zero or negligible value orders.
                </span>
              </div>
            </div>

            {/* Right Card: Codes & Automation Settings */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Code Generation &amp; Auto-Credit</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Coupon Code Prefix:
                  </label>
                  <input
                    type="text"
                    value={configForm.referralCouponCodePrefix}
                    onChange={(e) => handleConfigChange('referralCouponCodePrefix', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    placeholder="REF"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Coupon Validity (Days):
                  </label>
                  <input
                    type="number"
                    value={configForm.referralCouponValidityDays}
                    onChange={(e) => handleConfigChange('referralCouponValidityDays', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Maximum Referrals Per User Cap:
                </label>
                <input
                  type="number"
                  value={configForm.maxReferralsPerUser}
                  onChange={(e) => handleConfigChange('maxReferralsPerUser', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  min={1}
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Limit maximum friends a single account can earn cashback from.
                </span>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.autoCreditWalletOnDelivery}
                    onChange={(e) => handleConfigChange('autoCreditWalletOnDelivery', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold block">Auto-Credit Wallet on Order Delivery</span>
                    <span className="text-[10px] text-slate-500 block">
                      When the invited customer receives their first order and delivery is completed by rider, automatically credit ₹{configForm.referrerRewardAmount} to the referrer&apos;s wallet without manual intervention.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Customer Facing Copy */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Customer Profile Headline &amp; Marketing Pitch
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Headline (Displayed prominently in Customer Refer &amp; Earn Tab):
              </label>
              <input
                type="text"
                value={configForm.programHeadline}
                onChange={(e) => handleConfigChange('programHeadline', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Program Description &amp; Terms:
              </label>
              <textarea
                value={configForm.programDescription}
                onChange={(e) => handleConfigChange('programDescription', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: REFERRAL AUDIT LEDGER */}
      {/* ======================================================== */}
      {activeSubTab === 'referral_ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder="Search by referrer, referee, phone or code..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {ledgerSearch && (
                  <button
                    onClick={() => setLedgerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-bold">
                {(['all', 'awarded', 'pending_order', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setLedgerStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer capitalize ${
                      ledgerStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{filteredLedger.length}</strong> redemptions
            </div>
          </div>

          {/* Audit Ledger Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Date &amp; ID</th>
                  <th className="py-2.5 px-3">Referrer</th>
                  <th className="py-2.5 px-3">Referee (New Customer)</th>
                  <th className="py-2.5 px-3 font-mono">Code / Bonus Coupon</th>
                  <th className="py-2.5 px-3 font-mono">Reward (₹)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No referral redemption records found.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] text-slate-500 block">{rec.id}</span>
                        <span className="text-[11px] font-semibold text-slate-700">
                          {new Date(rec.redeemedAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{rec.referrerName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{rec.referrerPhone}</span>
                        <span className="text-[10px] font-mono text-indigo-600 font-bold">Code: {rec.referrerCode}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{rec.refereeName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{rec.refereePhone || 'N/A'}</span>
                        {rec.refereeEmail && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{rec.refereeEmail}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-[11px]">
                          {rec.refereeCodeUsed}
                        </span>
                        {rec.bonusCouponCode && (
                          <span className="block text-[10px] text-pink-600 font-bold mt-0.5">
                            Coupon: {rec.bonusCouponCode}
                          </span>
                        )}
                        {rec.qualifyingOrderId && (
                          <span className="block text-[10px] text-blue-600 font-semibold mt-0.5">
                            Order: #{rec.qualifyingOrderId}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-black text-emerald-700 text-sm">
                        ₹{rec.rewardAmount}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            rec.status === 'awarded'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : rec.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {rec.status === 'awarded' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {rec.status === 'pending_order' && <Clock className="w-3 h-3 text-amber-600" />}
                          {rec.status === 'cancelled' && <XCircle className="w-3 h-3 text-rose-600" />}
                          <span>{rec.status.replace('_', ' ')}</span>
                        </span>
                        {rec.notes && (
                          <span className="text-[10px] text-slate-500 block mt-1 line-clamp-1" title={rec.notes}>
                            {rec.notes}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {rec.status === 'pending_order' ? (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const res = awardReferralBonus(rec.id, 'Manually approved from Admin Ledger');
                                if (res.success) showFeedback('success', res.message);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Award Bonus
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const reason = window.prompt('Reason for cancelling this referral record:');
                                if (reason !== null) {
                                  const res = cancelReferralRecord(rec.id, reason);
                                  if (res.success) showFeedback('success', res.message);
                                }
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-[10px] font-semibold cursor-pointer border border-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">
                            {rec.status === 'awarded' ? `Awarded ${rec.awardedAt ? new Date(rec.awardedAt).toLocaleDateString() : ''}` : 'No actions'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: CUSTOMER WALLETS & MANUAL ADJUSTMENT */}
      {/* ======================================================== */}
      {activeSubTab === 'wallets' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Customer JE Cash Balances &amp; Manual Adjustment</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect customer balances earned from refills and referrals, and manually credit or debit JE Cash promotional funds.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Contact Details</th>
                  <th className="py-2.5 px-3 font-mono">Referral Code</th>
                  <th className="py-2.5 px-3 font-mono">Current JE Cash Balance</th>
                  <th className="py-2.5 px-3 text-right">Adjustment Tool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Current logged-in active customer */}
                <tr className="bg-blue-50/40">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{currentUser.name} (Active Session)</span>
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Primary Customer Account</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    <div>{currentUser.phone}</div>
                    <div className="text-slate-400 text-[10px]">{currentUser.email}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                    {currentUser.referralCode}
                  </td>
                  <td className="py-3 px-3 font-mono font-black text-emerald-700 text-base">
                    ₹{currentUser.rewardBalance || 0}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenWalletAdjustment({
                          id: currentUser.id,
                          name: currentUser.name,
                          phone: currentUser.phone,
                          balance: currentUser.rewardBalance || 0,
                        })
                      }
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Credit / Debit
                    </button>
                  </td>
                </tr>

                {/* Additional Registered Accounts */}
                {accounts
                  .filter((acc) => acc.role === 'customer' && acc.phone !== currentUser.phone)
                  .map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{acc.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{acc.id}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        <div>{acc.phone}</div>
                        <div className="text-slate-400 text-[10px]">{acc.email}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                        {acc.referralCode || 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-emerald-700 text-base">
                        ₹{acc.rewardBalance || 0}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenWalletAdjustment({
                              id: acc.id,
                              name: acc.name,
                              phone: acc.phone,
                              balance: acc.rewardBalance || 0,
                            })
                          }
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Credit / Debit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT COUPON */}
      {/* ======================================================== */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-pink-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {modalMode === 'create' ? 'Create New Promo Coupon' : `Edit Coupon: ${editingCoupon?.code}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={codeForm}
                    onChange={(e) => setCodeForm(e.target.value.toUpperCase())}
                    placeholder="e.g. DIWALI500, SAVE15"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-black text-slate-900 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Type *</label>
                  <select
                    value={discountTypeForm}
                    onChange={(e) => setDiscountTypeForm(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="fixed">Fixed Amount Off (₹)</option>
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="free_delivery">Free Express Delivery</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {discountTypeForm === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Value (₹) *'}
                  </label>
                  <input
                    type="number"
                    value={valueForm}
                    onChange={(e) => setValueForm(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    min={1}
                    max={discountTypeForm === 'percentage' ? 100 : 50000}
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order Cart Total (₹) *</label>
                  <input
                    type="number"
                    value={minOrderForm}
                    onChange={(e) => setMinOrderForm(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono"
                    min={0}
                    required
                  />
                </div>
              </div>

              {discountTypeForm === 'percentage' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Discount Cap (₹) (Optional)</label>
                  <input
                    type="number"
                    value={maxDiscountForm || ''}
                    onChange={(e) => setMaxDiscountForm(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 1000"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Caps highest discount granted on expensive electronics.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Validity (Days from today) *</label>
                  <input
                    type="number"
                    value={daysValidForm}
                    onChange={(e) => setDaysValidForm(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono"
                    min={1}
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Usage Limit *</label>
                  <input
                    type="number"
                    value={usageLimitForm}
                    onChange={(e) => setUsageLimitForm(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Description / Banner *</label>
                <input
                  type="text"
                  value={descForm}
                  onChange={(e) => setDescForm(e.target.value)}
                  placeholder="e.g. Flat ₹500 off on festive orders above ₹2,999"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category Restriction</label>
                  <select
                    value={categoryRestrictionForm}
                    onChange={(e) => setCategoryRestrictionForm(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-medium capitalize"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Applicable Outlets</label>
                  <select
                    value={applicableOutletsForm}
                    onChange={(e) => setApplicableOutletsForm(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="all">All Store Outlets &amp; Online</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActiveForm}
                    onChange={(e) => setIsActiveForm(e.target.checked)}
                    className="w-4 h-4 text-pink-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Coupon is Active &amp; Redeemable Immediately</span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  {modalMode === 'create' ? 'Create Coupon' : 'Update Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MANUAL WALLET CREDIT / DEBIT */}
      {/* ======================================================== */}
      {showWalletModal && selectedWalletUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">Adjust Customer JE Cash</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-bold text-slate-900">{selectedWalletUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Phone:</span>
                <span className="font-mono text-slate-700">{selectedWalletUser.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Current Balance:</span>
                <span className="font-mono font-black text-emerald-700">₹{selectedWalletUser.balance}</span>
              </div>
            </div>

            <form onSubmit={handleCommitWalletAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalletActionType('credit')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      walletActionType === 'credit'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    <span>Credit (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletActionType('debit')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      walletActionType === 'debit'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    <span>Debit (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Adjustment Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={walletAdjustmentAmount}
                    onChange={(e) => setWalletAdjustmentAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Note for Customer *</label>
                <input
                  type="text"
                  value={walletAdjustmentReason}
                  onChange={(e) => setWalletAdjustmentReason(e.target.value)}
                  placeholder="e.g. Loyalty bonus, Offline campaign credit"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs ${
                    walletActionType === 'credit'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Commit {walletActionType === 'credit' ? 'Credit' : 'Debit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
