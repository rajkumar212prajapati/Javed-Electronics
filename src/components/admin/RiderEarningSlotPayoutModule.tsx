import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  InHouseRider,
  RiderDeliverySlot,
  RiderEarningStructure,
  RiderPayoutRecord,
} from '../../data/mockDeliveryPartners';
import { formatINR } from '../../utils/currency';
import {
  Banknote,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  TrendingUp,
  Navigation,
  ShieldCheck,
  Building2,
  UserCheck,
  UserPlus,
  CreditCard,
  Save,
  RefreshCw,
  X,
  Calendar,
  Award,
  Sliders,
  Check,
  Copy,
  FileText,
  ArrowRight,
  Bike,
} from 'lucide-react';

interface RiderEarningSlotPayoutModuleProps {
  initialSection?: 'structure' | 'slots' | 'payouts';
}

export const RiderEarningSlotPayoutModule: React.FC<RiderEarningSlotPayoutModuleProps> = ({
  initialSection = 'structure',
}) => {
  const {
    ridersList,
    outlets,
    riderEarningStructure,
    updateRiderEarningStructure,
    recalculateAllRidersEarningsFromStructure,
    updateIndividualRiderEarnings,
    riderSlots,
    createRiderSlot,
    updateRiderSlot,
    deleteRiderSlot,
    toggleRiderSlotEnrollment,
    riderPayouts,
    createRiderPayout,
    createBatchRiderPayouts,
    processRiderPayoutStatus,
  } = useStore();

  const [activeSection, setActiveSection] = useState<'structure' | 'slots' | 'payouts'>(
    initialSection
  );
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ============================================================================
  // 1. EARNING STRUCTURE STATE
  // ============================================================================
  const [draftStructure, setDraftStructure] = useState<RiderEarningStructure>(riderEarningStructure);
  const [newTierMinOrders, setNewTierMinOrders] = useState<number>(20);
  const [newTierBonus, setNewTierBonus] = useState<number>(700);
  const [newTierLabel, setNewTierLabel] = useState<string>('Super 20+ Daily Target');

  const [newMsTargetOrders, setNewMsTargetOrders] = useState<number>(100);
  const [newMsPeriod, setNewMsPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [newMsReward, setNewMsReward] = useState<number>(1800);
  const [newMsTitle, setNewMsTitle] = useState<string>('Weekly 100-Order Century Bonus');

  // Individual Rider Earning Override Modal
  const [editingRiderEarnings, setEditingRiderEarnings] = useState<InHouseRider | null>(null);
  const [riderEditForm, setRiderEditForm] = useState({
    slotEarnings: 0,
    orderEarnings: 0,
    distanceEarnings: 0,
    incentiveEarnings: 0,
    surgeEarnings: 0,
    milestoneEarnings: 0,
  });

  const handleOpenEditRiderEarnings = (rider: InHouseRider) => {
    setEditingRiderEarnings(rider);
    setRiderEditForm({
      slotEarnings: rider.earnings?.slotEarnings ?? rider.earnings?.slotBased ?? 0,
      orderEarnings: rider.earnings?.orderEarnings ?? rider.earnings?.orderBased ?? 0,
      distanceEarnings: rider.earnings?.distanceEarnings ?? rider.earnings?.distanceBased ?? 0,
      incentiveEarnings: rider.earnings?.incentiveEarnings ?? rider.earnings?.incentiveBased ?? 0,
      surgeEarnings: rider.earnings?.surgeEarnings ?? rider.earnings?.surgeBased ?? 0,
      milestoneEarnings: rider.earnings?.milestoneEarnings ?? rider.earnings?.milestoneBased ?? 0,
    });
  };

  const handleSaveRiderEarningsOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRiderEarnings) return;
    const res = updateIndividualRiderEarnings(editingRiderEarnings.id, riderEditForm);
    notify(res.message, res.success ? 'success' : 'error');
    setEditingRiderEarnings(null);
  };

  const handleSaveStructure = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateRiderEarningStructure(draftStructure);
    notify(res.message, 'success');
  };

  const handleAddIncentiveTier = () => {
    if (!newTierLabel.trim() || newTierMinOrders <= 0 || newTierBonus <= 0) {
      notify('Please enter valid target orders, bonus amount, and label.', 'error');
      return;
    }
    const nextTiers = [
      ...draftStructure.dailyIncentiveTiers,
      {
        id: `inc-${Date.now().toString().slice(-4)}`,
        minOrders: Number(newTierMinOrders),
        bonusAmount: Number(newTierBonus),
        label: newTierLabel.trim(),
      },
    ].sort((a, b) => a.minOrders - b.minOrders);

    setDraftStructure({ ...draftStructure, dailyIncentiveTiers: nextTiers });
    updateRiderEarningStructure({ dailyIncentiveTiers: nextTiers });
    setNewTierLabel('');
    notify('Daily incentive tier added to Earning Structure!', 'success');
  };

  const handleRemoveIncentiveTier = (id: string) => {
    const nextTiers = draftStructure.dailyIncentiveTiers.filter((t) => t.id !== id);
    setDraftStructure({ ...draftStructure, dailyIncentiveTiers: nextTiers });
    updateRiderEarningStructure({ dailyIncentiveTiers: nextTiers });
    notify('Incentive tier removed.', 'success');
  };

  const handleAddMilestoneTier = () => {
    if (!newMsTitle.trim() || newMsTargetOrders <= 0 || newMsReward <= 0) {
      notify('Please enter valid milestone target orders, reward, and title.', 'error');
      return;
    }
    const nextMs = [
      ...draftStructure.milestoneTiers,
      {
        id: `ms-${Date.now().toString().slice(-4)}`,
        targetOrders: Number(newMsTargetOrders),
        period: newMsPeriod,
        rewardAmount: Number(newMsReward),
        title: newMsTitle.trim(),
      },
    ];
    setDraftStructure({ ...draftStructure, milestoneTiers: nextMs });
    updateRiderEarningStructure({ milestoneTiers: nextMs });
    setNewMsTitle('');
    notify('Milestone tier added to Earning Structure!', 'success');
  };

  const handleRemoveMilestoneTier = (id: string) => {
    const nextMs = draftStructure.milestoneTiers.filter((m) => m.id !== id);
    setDraftStructure({ ...draftStructure, milestoneTiers: nextMs });
    updateRiderEarningStructure({ milestoneTiers: nextMs });
    notify('Milestone reward tier removed.', 'success');
  };

  // ============================================================================
  // 2. SLOT MANAGEMENT (CREATE / EDIT / DELETE) STATE
  // ============================================================================
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<RiderDeliverySlot | null>(null);
  const [slotForm, setSlotForm] = useState<{
    title: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    outletId: string;
    slotType: 'standard' | 'peak' | 'super_peak' | 'late_night';
    slotBasePay: number;
    perOrderSurgeBonus: number;
    minLoginHours: number;
    maxRiders: number;
    daysActive: string;
    isActive: boolean;
  }>({
    title: '',
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    durationHours: 4,
    outletId: 'out_nalasopara_01',
    slotType: 'standard',
    slotBasePay: 250,
    perOrderSurgeBonus: 15,
    minLoginHours: 3.5,
    maxRiders: 10,
    daysActive: 'Mon - Sun (Daily)',
    isActive: true,
  });

  const handleOpenCreateSlot = () => {
    setEditingSlot(null);
    setSlotForm({
      title: '',
      startTime: '09:00 AM',
      endTime: '01:00 PM',
      durationHours: 4,
      outletId: outlets[0]?.id || 'out_nalasopara_01',
      slotType: 'standard',
      slotBasePay: riderEarningStructure.defaultSlotBaseGuarantee || 250,
      perOrderSurgeBonus: 15,
      minLoginHours: 3.5,
      maxRiders: 10,
      daysActive: 'Mon - Sun (Daily)',
      isActive: true,
    });
    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot: RiderDeliverySlot) => {
    setEditingSlot(slot);
    setSlotForm({
      title: slot.title,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationHours: slot.durationHours,
      outletId: slot.outletId,
      slotType: slot.slotType,
      slotBasePay: slot.slotBasePay,
      perOrderSurgeBonus: slot.perOrderSurgeBonus,
      minLoginHours: slot.minLoginHours,
      maxRiders: slot.maxRiders,
      daysActive: slot.daysActive,
      isActive: slot.isActive,
    });
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForm.title.trim()) {
      notify('Please enter a Slot Title.', 'error');
      return;
    }

    const matchedOutlet = outlets.find((o) => o.id === slotForm.outletId);
    const outletName =
      slotForm.outletId === 'all'
        ? 'All Mumbai Nalasopara, Vasai & Virar Hubs'
        : matchedOutlet?.name || 'Shop 09 Sai Dham Apt Vijaynagar Nalasopara East 401209';

    if (editingSlot) {
      const res = updateRiderSlot(editingSlot.id, {
        ...slotForm,
        outletName,
      });
      notify(res.message, 'success');
    } else {
      const res = createRiderSlot({
        ...slotForm,
        outletName,
      });
      notify(res.message, 'success');
    }
    setIsSlotModalOpen(false);
  };

  const handleDeleteSlot = (slot: RiderDeliverySlot) => {
    const res = deleteRiderSlot(slot.id);
    notify(res.message, 'success');
  };

  // ============================================================================
  // 3. RIDER PAYOUT MODULE STATE
  // ============================================================================
  const [payoutModalRider, setPayoutModalRider] = useState<InHouseRider | null>(null);
  const [payoutPeriodLabel, setPayoutPeriodLabel] = useState(
    '23 Oct 2026 – 29 Oct 2026 (Weekly Cycle)'
  );
  const [payoutMethod, setPayoutMethod] = useState<'IMPS' | 'NEFT' | 'UPI_INSTANT'>('IMPS');
  const [payoutDeductions, setPayoutDeductions] = useState<number>(0);
  const [payoutUtr, setPayoutUtr] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [markPaidImmediately, setMarkPaidImmediately] = useState<boolean>(true);

  // Approve existing payout modal
  const [approvingPayout, setApprovingPayout] = useState<RiderPayoutRecord | null>(null);
  const [approveUtrInput, setApproveUtrInput] = useState<string>('');
  const [approveNotesInput, setApproveNotesInput] = useState<string>('');
  const [viewingPayoutSlip, setViewingPayoutSlip] = useState<RiderPayoutRecord | null>(null);

  const handleOpenCreatePayoutForRider = (rider: InHouseRider) => {
    setPayoutModalRider(rider);
    setPayoutDeductions(0);
    setPayoutUtr(`HDFC${Date.now().toString().slice(-8)}`);
    setPayoutNotes(`Weekly fleet earnings settlement for ${rider.name}`);
    setMarkPaidImmediately(true);
  };

  const handleCreateSinglePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalRider) return;
    const res = createRiderPayout({
      riderId: payoutModalRider.id,
      periodLabel: payoutPeriodLabel,
      paymentMethod: payoutMethod,
      codDeductionsOrPenalties: payoutDeductions,
      utrReference: payoutUtr,
      notes: payoutNotes,
      markPaidImmediately,
    });
    notify(res.message, res.success ? 'success' : 'error');
    if (res.success) {
      setPayoutModalRider(null);
    }
  };

  const handleApprovePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingPayout) return;
    const res = processRiderPayoutStatus(
      approvingPayout.id,
      'paid',
      approveUtrInput.trim() || `IMPS${Date.now().toString().slice(-8)}`,
      undefined,
      approveNotesInput.trim() || 'Verified bank transfer to rider account.'
    );
    notify(res.message, res.success ? 'success' : 'error');
    setApprovingPayout(null);
  };

  // KPI calculations
  const totalFleetGrossEarnings = ridersList.reduce(
    (sum, r) => sum + (r.earnings?.totalEarnings ?? r.earnings?.total ?? 0),
    0
  );
  const totalDisbursedAmount = riderPayouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.breakdown.netPayableAmount, 0);
  const pendingPayoutRecords = riderPayouts.filter((p) => p.status === 'pending_approval' || p.status === 'processing');

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between shadow-md text-xs font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 1: RIDER EARNING STRUCTURE & RATE CARD                       */}
      {/* ==================================================================== */}
      {activeSection === 'structure' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveStructure} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                  Master Fleet Rate Card
                </span>
                <h4 className="text-base font-black text-slate-900 mt-1.5">
                  Configure 6-Tier Rider Earning Structure
                </h4>
                <p className="text-xs text-slate-500">
                  Last updated by {riderEarningStructure.updatedBy} on{' '}
                  {new Date(riderEarningStructure.updatedAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    updateRiderEarningStructure(draftStructure);
                    const res = recalculateAllRidersEarningsFromStructure();
                    notify(res.message, 'success');
                  }}
                  className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Apply &amp; Recalculate All Riders</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Earning Structure</span>
                </button>
              </div>
            </div>

            {/* 3 Core Rate Cards Grid: Order-Based, Distance-Based, Slot-Based */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* 1. Order-Based Pay */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-950 flex items-center gap-1.5 text-sm">
                    <Bike className="w-4 h-4 text-blue-600" />
                    1. Order-Based Rate
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Per Delivery
                  </span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Base Pay Per Order Delivered (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftStructure.baseOrderFee}
                    onChange={(e) =>
                      setDraftStructure({ ...draftStructure, baseOrderFee: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-white border border-blue-300 rounded-xl font-mono font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bulky / Large Appliance Extra Bonus (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftStructure.bulkOrderExtraFee}
                    onChange={(e) =>
                      setDraftStructure({ ...draftStructure, bulkOrderExtraFee: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-white border border-blue-300 rounded-xl font-mono font-black text-slate-900"
                  />
                </div>
              </div>

              {/* 2. Distance-Based Pay */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-950 flex items-center gap-1.5 text-sm">
                    <Navigation className="w-4 h-4 text-indigo-600" />
                    2. Distance-Based Rate
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                    Per KM Fuel Pay
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Base Included (KM)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={draftStructure.baseIncludedKm}
                      onChange={(e) =>
                        setDraftStructure({ ...draftStructure, baseIncludedKm: Number(e.target.value) })
                      }
                      className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl font-mono font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Rate / Extra KM (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={draftStructure.perKmRate}
                      onChange={(e) =>
                        setDraftStructure({ ...draftStructure, perKmRate: Number(e.target.value) })
                      }
                      className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl font-mono font-black text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Approved RTO Return Distance Pay (₹/KM)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftStructure.returnRtoPerKmRate}
                    onChange={(e) =>
                      setDraftStructure({ ...draftStructure, returnRtoPerKmRate: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl font-mono font-black text-slate-900"
                  />
                </div>
              </div>

              {/* 3. Slot-Based Guarantee */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-950 flex items-center gap-1.5 text-sm">
                    <Clock className="w-4 h-4 text-purple-600" />
                    3. Slot-Based Guarantee
                  </span>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    Shift Attendance
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Base Slot Pay (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={draftStructure.defaultSlotBaseGuarantee}
                      onChange={(e) =>
                        setDraftStructure({
                          ...draftStructure,
                          defaultSlotBaseGuarantee: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-mono font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Peak Slot Bonus (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={draftStructure.peakSlotBonus}
                      onChange={(e) =>
                        setDraftStructure({ ...draftStructure, peakSlotBonus: Number(e.target.value) })
                      }
                      className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-mono font-black text-slate-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Min Login Adherence (%)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={draftStructure.minSlotLoginAdherencePct}
                      onChange={(e) =>
                        setDraftStructure({
                          ...draftStructure,
                          minSlotLoginAdherencePct: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-mono font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Payout TDS Rate (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step="0.5"
                      value={draftStructure.tdsRatePct}
                      onChange={(e) =>
                        setDraftStructure({ ...draftStructure, tdsRatePct: Number(e.target.value) })
                      }
                      className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-mono font-black text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Surge-Based Multiplier Config */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="font-black text-amber-950 text-sm">
                    4. Surge-Based Dynamic Multiplier (Monsoon / Rush / Festival)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-black text-amber-950">
                    <input
                      type="checkbox"
                      checked={draftStructure.surgeConfig.isSurgeActive}
                      onChange={(e) =>
                        setDraftStructure({
                          ...draftStructure,
                          surgeConfig: {
                            ...draftStructure.surgeConfig,
                            isSurgeActive: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <span>
                      {draftStructure.surgeConfig.isSurgeActive
                        ? '🟢 Live Surge Pay ACTIVE'
                        : '⚪ Surge Pay Inactive'}
                    </span>
                  </label>

                  <select
                    value={draftStructure.surgeConfig.activeSurgeType}
                    onChange={(e) =>
                      setDraftStructure({
                        ...draftStructure,
                        surgeConfig: {
                          ...draftStructure.surgeConfig,
                          activeSurgeType: e.target.value as any,
                        },
                      })
                    }
                    className="p-2 bg-white border border-amber-300 rounded-xl font-bold text-amber-950"
                  >
                    <option value="peak_rush">Peak Hour Rush Surge</option>
                    <option value="rain_monsoon">Rain / Monsoon Weather Surge</option>
                    <option value="festival_mega">Festival Mega Sale Surge</option>
                    <option value="none">No Active Surge</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-amber-200">
                  <label className="block font-bold text-slate-700 mb-1">
                    Peak Hour Rush Bonus (₹ / Order)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftStructure.surgeConfig.peakHourSurgePerOrder}
                    onChange={(e) =>
                      setDraftStructure({
                        ...draftStructure,
                        surgeConfig: {
                          ...draftStructure.surgeConfig,
                          peakHourSurgePerOrder: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-black text-slate-900"
                  />
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200">
                  <label className="block font-bold text-slate-700 mb-1">
                    Rain / Monsoon Surge (₹ / Order)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftStructure.surgeConfig.rainSurgePerOrder}
                    onChange={(e) =>
                      setDraftStructure({
                        ...draftStructure,
                        surgeConfig: {
                          ...draftStructure.surgeConfig,
                          rainSurgePerOrder: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-black text-slate-900"
                  />
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200">
                  <label className="block font-bold text-slate-700 mb-1">
                    Festival Mega Surge (₹ / Order)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftStructure.surgeConfig.festivalSurgePerOrder}
                    onChange={(e) =>
                      setDraftStructure({
                        ...draftStructure,
                        surgeConfig: {
                          ...draftStructure.surgeConfig,
                          festivalSurgePerOrder: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-black text-slate-900"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* 5. Daily Order Target Incentive Tiers & 6. Weekly/Monthly Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Incentive Tiers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-black text-slate-900 text-sm">
                    5. Incentive-Based Daily Order Target Slabs
                  </h4>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Daily Targets
                </span>
              </div>

              <div className="space-y-2">
                {draftStructure.dailyIncentiveTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-black text-slate-900">{tier.label}</div>
                      <div className="text-[11px] text-slate-600">
                        Complete minimum <strong>{tier.minOrders} orders/day</strong> → Earn{' '}
                        <strong className="text-emerald-700 font-mono">
                          +{formatINR(tier.bonusAmount)}
                        </strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIncentiveTier(tier.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Incentive Slab"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Daily Incentive Slab */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 block">Add New Daily Incentive Slab</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Tier Label"
                    value={newTierLabel}
                    onChange={(e) => setNewTierLabel(e.target.value)}
                    className="col-span-3 sm:col-span-1 p-2 bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Min Orders"
                    value={newTierMinOrders}
                    onChange={(e) => setNewTierMinOrders(Number(e.target.value))}
                    className="p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Bonus (₹)"
                    value={newTierBonus}
                    onChange={(e) => setNewTierBonus(Number(e.target.value))}
                    className="p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddIncentiveTier}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Daily Incentive Tier</span>
                </button>
              </div>
            </div>

            {/* Milestone-Based Rewards */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <h4 className="font-black text-slate-900 text-sm">
                    6. Milestone-Based Weekly &amp; Monthly Rewards
                  </h4>
                </div>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Long-Term Loyalty
                </span>
              </div>

              <div className="space-y-2">
                {draftStructure.milestoneTiers.map((ms) => (
                  <div
                    key={ms.id}
                    className="p-3 rounded-xl bg-purple-50/50 border border-purple-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-black text-slate-900 flex items-center gap-2">
                        <span>{ms.title}</span>
                        <span className="text-[10px] uppercase bg-purple-200/70 text-purple-900 px-1.5 py-0.2 rounded">
                          {ms.period}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Target: <strong>{ms.targetOrders} orders</strong> ({ms.period}) → Milestone Bonus:{' '}
                        <strong className="text-purple-700 font-mono">
                          +{formatINR(ms.rewardAmount)}
                        </strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestoneTier(ms.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Milestone Tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Milestone Tier */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 block">Add New Milestone Reward Tier</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Milestone Title"
                    value={newMsTitle}
                    onChange={(e) => setNewMsTitle(e.target.value)}
                    className="col-span-2 p-2 bg-white border border-slate-300 rounded-lg"
                  />
                  <select
                    value={newMsPeriod}
                    onChange={(e) => setNewMsPeriod(e.target.value as 'weekly' | 'monthly')}
                    className="p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Reward (₹)"
                    value={newMsReward}
                    onChange={(e) => setNewMsReward(Number(e.target.value))}
                    className="p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMilestoneTier}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Milestone Tier</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Fleet Rider Earnings Matrix & Direct Adjustment Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Fleet Rider 6-Tier Earning Ledgers (Admin Override &amp; Audit)
                </h4>
                <p className="text-xs text-slate-500">
                  Inspect or manually adjust any rider's Slot, Order, Distance, Incentive, Surge, or Milestone earnings.
                </p>
              </div>
              <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                Total Fleet Earnings: {formatINR(totalFleetGrossEarnings)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80 uppercase text-[10px]">
                    <th className="py-2.5 px-3 font-bold">Rider &amp; Hub</th>
                    <th className="py-2.5 px-3 font-bold text-right">Slot Pay</th>
                    <th className="py-2.5 px-3 font-bold text-right">Order Pay</th>
                    <th className="py-2.5 px-3 font-bold text-right">Distance</th>
                    <th className="py-2.5 px-3 font-bold text-right">Incentive</th>
                    <th className="py-2.5 px-3 font-bold text-right">Surge</th>
                    <th className="py-2.5 px-3 font-bold text-right">Milestone</th>
                    <th className="py-2.5 px-3 font-bold text-right">Gross Total</th>
                    <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ridersList.map((r) => {
                    const slotPay = r.earnings?.slotEarnings ?? r.earnings?.slotBased ?? 0;
                    const orderPay = r.earnings?.orderEarnings ?? r.earnings?.orderBased ?? 0;
                    const distPay = r.earnings?.distanceEarnings ?? r.earnings?.distanceBased ?? 0;
                    const incPay = r.earnings?.incentiveEarnings ?? r.earnings?.incentiveBased ?? 0;
                    const surgePay = r.earnings?.surgeEarnings ?? r.earnings?.surgeBased ?? 0;
                    const msPay = r.earnings?.milestoneEarnings ?? r.earnings?.milestoneBased ?? 0;
                    const total = r.earnings?.totalEarnings ?? r.earnings?.total ?? 0;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{r.name}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                            {r.outletName}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">
                          {formatINR(slotPay)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">
                          {formatINR(orderPay)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-blue-700">
                          {formatINR(distPay)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                          {formatINR(incPay)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-amber-700">
                          {formatINR(surgePay)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-purple-700">
                          {formatINR(msPay)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-indigo-700 text-sm">
                          {formatINR(total)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRiderEarnings(r)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-slate-200 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSection('payouts');
                                handleOpenCreatePayoutForRider(r);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              Pay Out
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: SLOT MANAGEMENT (CREATE / EDIT / DELETE SLOTS IN ADMIN)   */}
      {/* ==================================================================== */}
      {activeSection === 'slots' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                Admin Shift &amp; Slot Scheduler
              </span>
              <h4 className="text-base font-black text-slate-900 mt-1.5">
                Delivery Shift Slots Management (Create, Edit, Delete &amp; Rider Roster)
              </h4>
              <p className="text-xs text-slate-500">
                Create shift slots with base pay guarantees and peak order bonuses. Assign riders or let riders book slots from their portal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateSlot}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Delivery Slot</span>
            </button>
          </div>

          {riderSlots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-black text-slate-800">No Delivery Slots Configured</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click "Create New Delivery Slot" to set up morning, afternoon, evening peak, or late-night rider shifts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riderSlots.map((slot) => {
                const fillPct = Math.min(
                  100,
                  Math.round((slot.enrolledRiderIds.length / Math.max(1, slot.maxRiders)) * 100)
                );

                return (
                  <div
                    key={slot.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                      slot.isActive ? 'border-slate-200' : 'border-slate-200 opacity-75 bg-slate-50'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header & Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                slot.slotType === 'super_peak'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : slot.slotType === 'peak'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : slot.slotType === 'late_night'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {slot.slotType.replace('_', ' ')}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                slot.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {slot.isActive ? 'ACTIVE' : 'PAUSED'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">{slot.id}</span>
                          </div>
                          <h5 className="text-sm font-black text-slate-900 mt-1">{slot.title}</h5>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSlot(slot)}
                            className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl border border-slate-200 cursor-pointer"
                            title="Edit Slot"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 cursor-pointer"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Timing & Store Info */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Shift Timing
                          </span>
                          <span className="font-mono font-black text-slate-900">
                            {slot.startTime} – {slot.endTime}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {slot.durationHours} hrs ({slot.daysActive})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Assigned Hub / Store
                          </span>
                          <span className="font-bold text-slate-800 line-clamp-2">
                            {slot.outletName}
                          </span>
                        </div>
                      </div>

                      {/* Slot Earnings & Guarantee Pills */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                          <span className="text-[10px] text-indigo-700 font-bold block">
                            Slot Base Pay
                          </span>
                          <span className="font-mono text-sm font-black text-indigo-950">
                            {formatINR(slot.slotBasePay)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                          <span className="text-[10px] text-amber-800 font-bold block">
                            Order Surge Add-on
                          </span>
                          <span className="font-mono text-sm font-black text-amber-950">
                            +{formatINR(slot.perOrderSurgeBonus)}/ord
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                          <span className="text-[10px] text-emerald-800 font-bold block">
                            Min Login Req.
                          </span>
                          <span className="font-mono text-sm font-black text-emerald-950">
                            {slot.minLoginHours} hrs
                          </span>
                        </div>
                      </div>

                      {/* Capacity & Enrolled Riders */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">
                            Enrolled Riders ({slot.enrolledRiderIds.length} / {slot.maxRiders})
                          </span>
                          <span className="text-[11px] font-mono font-bold text-indigo-600">
                            {fillPct}% Booked
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>

                        {/* Interactive Rider Roster Assignment Chips */}
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                            Click Rider to Assign / Unassign from Slot:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {ridersList.map((r) => {
                              const isEnrolled = slot.enrolledRiderIds.includes(r.id);
                              return (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => {
                                    const res = toggleRiderSlotEnrollment(slot.id, r.id);
                                    notify(res.message, res.success ? 'success' : 'error');
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                                    isEnrolled
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                                  }`}
                                >
                                  {isEnrolled ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Plus className="w-3 h-3" />
                                  )}
                                  <span>{r.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: RIDER PAYOUT & BANK SETTLEMENT MODULE                     */}
      {/* ==================================================================== */}
      {activeSection === 'payouts' && (
        <div className="space-y-6">
          {/* Payout Summary Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Current Fleet Gross Earnings
              </span>
              <span className="font-mono text-2xl font-black text-indigo-700 mt-1 block">
                {formatINR(totalFleetGrossEarnings)}
              </span>
              <span className="text-[11px] text-slate-500">
                Across {ridersList.length} active Mumbai Nalasopara / Vasai-Virar riders
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Pending Payout Vouchers
              </span>
              <span className="font-mono text-2xl font-black text-amber-600 mt-1 block">
                {pendingPayoutRecords.length} Vouchers
              </span>
              <span className="text-[11px] text-slate-500">
                Awaiting bank UTR release
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Total Disbursed to Rider Banks
              </span>
              <span className="font-mono text-2xl font-black text-emerald-700 mt-1 block">
                {formatINR(totalDisbursedAmount)}
              </span>
              <span className="text-[11px] text-slate-500">
                Settled via IMPS / NEFT / Instant UPI
              </span>
            </div>
          </div>

          {/* Batch Payout Bar */}
          <div className="bg-linear-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                Automated Weekly Fleet Payroll
              </span>
              <h4 className="text-base font-black">
                Generate Batch Payout Vouchers for All Riders
              </h4>
              <p className="text-xs text-slate-300">
                Automatically computes Slot + Order + Distance + Incentive + Surge + Milestone earnings minus {riderEarningStructure.tdsRatePct}% TDS for all riders.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const res = createBatchRiderPayouts(
                    '23 Oct 2026 – 29 Oct 2026 (Weekly Fleet Batch)',
                    'IMPS'
                  );
                  notify(res.message, res.success ? 'success' : 'error');
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Generate Batch Payouts ({ridersList.length} Riders)</span>
              </button>
            </div>
          </div>

          {/* Individual Rider Bank Disbursal Trigger Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-slate-900">
              Initiate Individual Rider Bank Payout
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ridersList.map((r) => {
                const gross = r.earnings?.totalEarnings ?? r.earnings?.total ?? 0;
                const tds = Math.round((gross * (riderEarningStructure.tdsRatePct || 1)) / 100);
                const net = Math.max(0, gross - tds);

                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-black text-slate-900 text-sm">{r.name}</div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        A/C: <strong>{r.bankAccountNo || '50100452391024'}</strong> • IFSC:{' '}
                        <strong>{r.ifscCode || 'HDFC0000241'}</strong> • PAN:{' '}
                        <strong>{r.panNumber || 'ABCDE1234F'}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Gross: <strong className="font-mono">{formatINR(gross)}</strong> | TDS ({riderEarningStructure.tdsRatePct}%):{' '}
                        <strong className="font-mono text-rose-600">-{formatINR(tds)}</strong> | Net Payable:{' '}
                        <strong className="font-mono text-emerald-700">{formatINR(net)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCreatePayoutForRider(r)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Disburse {formatINR(net)}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payout Vouchers & Settlement Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Rider Payout Vouchers &amp; Bank UTR Settlement Ledger ({riderPayouts.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Approve pending payouts with Bank UTR / NEFT / IMPS reference numbers or inspect itemized payout slips.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {riderPayouts.map((payout) => {
                const isPaid = payout.status === 'paid';
                return (
                  <div
                    key={payout.id}
                    className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs ${
                      isPaid
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : 'bg-amber-50/40 border-amber-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200">
                          {payout.id}
                        </span>
                        <span className="font-black text-slate-900 text-sm">
                          {payout.riderName}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : payout.status === 'on_hold'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {payout.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                          {payout.paymentMethod}
                        </span>
                      </div>

                      <div className="text-slate-600 flex items-center gap-2 flex-wrap">
                        <span>Period: <strong>{payout.periodLabel}</strong></span>
                        <span>•</span>
                        <span className="font-mono">
                          Bank A/C: <strong>{payout.bankAccountNo}</strong> ({payout.ifscCode})
                        </span>
                        <span>•</span>
                        <span className="font-mono">PAN: {payout.panNumber}</span>
                      </div>

                      {/* Mini 6-Tier Pill Strip */}
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          Slot: <strong>{formatINR(payout.breakdown.slotEarnings)}</strong>
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          Orders: <strong>{formatINR(payout.breakdown.orderEarnings)}</strong>
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          Distance: <strong>{formatINR(payout.breakdown.distanceEarnings)}</strong>
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          Incentive: <strong>{formatINR(payout.breakdown.incentiveEarnings)}</strong>
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          Surge: <strong>{formatINR(payout.breakdown.surgeEarnings)}</strong>
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          Milestone: <strong>{formatINR(payout.breakdown.milestoneEarnings)}</strong>
                        </span>
                        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                          TDS/Ded.: <strong>-{formatINR(payout.breakdown.tdsDeduction + payout.breakdown.codDeductionsOrPenalties)}</strong>
                        </span>
                      </div>

                      {payout.utrReference && (
                        <div className="text-[11px] text-emerald-800 font-bold pt-0.5">
                          ✓ Bank UTR Reference: <span className="font-mono">{payout.utrReference}</span>
                          {payout.approvedBy && ` • Approved by ${payout.approvedBy}`}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2 shrink-0">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Net Bank Disbursal
                        </span>
                        <span className="font-mono text-xl font-black text-slate-900">
                          {formatINR(payout.breakdown.netPayableAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingPayoutSlip(payout)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Payout Slip</span>
                        </button>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => {
                              setApprovingPayout(payout);
                              setApproveUtrInput(`UTR${Date.now().toString().slice(-9)}`);
                              setApproveNotesInput(`Settled via ${payout.paymentMethod} to A/C ${payout.bankAccountNo}`);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve &amp; Pay</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: CREATE / EDIT DELIVERY SLOT MODAL                           */}
      {/* ==================================================================== */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingSlot ? `Edit Delivery Slot: ${editingSlot.title}` : 'Create New Delivery Shift Slot'}
                </h3>
                <p className="text-xs text-slate-500">
                  Set slot timing, store hub, guaranteed base pay, and rider capacity
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Slot Title / Shift Name *</label>
                <input
                  type="text"
                  required
                  value={slotForm.title}
                  onChange={(e) => setSlotForm({ ...slotForm, title: e.target.value })}
                  placeholder="e.g. Morning Express Rush Slot"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Start Time *</label>
                  <input
                    type="text"
                    required
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    placeholder="08:00 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">End Time *</label>
                  <input
                    type="text"
                    required
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    placeholder="12:00 PM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Duration (Hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    value={slotForm.durationHours}
                    onChange={(e) => setSlotForm({ ...slotForm, durationHours: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Assigned Store / Hub *</label>
                  <select
                    value={slotForm.outletId}
                    onChange={(e) => setSlotForm({ ...slotForm, outletId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="all">All Mumbai Nalasopara, Vasai &amp; Virar Hubs</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Slot Type *</label>
                  <select
                    value={slotForm.slotType}
                    onChange={(e) => setSlotForm({ ...slotForm, slotType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="standard">Standard Shift</option>
                    <option value="peak">Peak Rush Shift</option>
                    <option value="super_peak">Super-Peak / Prime Shift</option>
                    <option value="late_night">Late Night Express Shift</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Slot Base Guarantee Pay (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={slotForm.slotBasePay}
                    onChange={(e) => setSlotForm({ ...slotForm, slotBasePay: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Per-Order Surge Bonus (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={slotForm.perOrderSurgeBonus}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, perOrderSurgeBonus: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-amber-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Min Login (Hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={slotForm.minLoginHours}
                    onChange={(e) => setSlotForm({ ...slotForm, minLoginHours: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Max Riders</label>
                  <input
                    type="number"
                    min={1}
                    value={slotForm.maxRiders}
                    onChange={(e) => setSlotForm({ ...slotForm, maxRiders: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Active Days</label>
                  <input
                    type="text"
                    value={slotForm.daysActive}
                    onChange={(e) => setSlotForm({ ...slotForm, daysActive: e.target.value })}
                    placeholder="Mon - Sun"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={slotForm.isActive}
                  onChange={(e) => setSlotForm({ ...slotForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Slot is Active &amp; Open for Rider Enrollment</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black cursor-pointer"
                >
                  {editingSlot ? 'Save Slot Changes' : 'Create Delivery Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: EDIT INDIVIDUAL RIDER EARNINGS MODAL                        */}
      {/* ==================================================================== */}
      {editingRiderEarnings && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Adjust Rider Earnings: {editingRiderEarnings.name}
                </h3>
                <p className="text-xs text-slate-500">{editingRiderEarnings.outletName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRiderEarnings(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRiderEarningsOverride} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slot-Based Pay (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={riderEditForm.slotEarnings}
                    onChange={(e) =>
                      setRiderEditForm({ ...riderEditForm, slotEarnings: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order-Based Pay (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={riderEditForm.orderEarnings}
                    onChange={(e) =>
                      setRiderEditForm({ ...riderEditForm, orderEarnings: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Distance-Based Pay (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={riderEditForm.distanceEarnings}
                    onChange={(e) =>
                      setRiderEditForm({ ...riderEditForm, distanceEarnings: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incentive Bonus (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={riderEditForm.incentiveEarnings}
                    onChange={(e) =>
                      setRiderEditForm({
                        ...riderEditForm,
                        incentiveEarnings: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Surge Bonus (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={riderEditForm.surgeEarnings}
                    onChange={(e) =>
                      setRiderEditForm({ ...riderEditForm, surgeEarnings: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Milestone Bonus (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={riderEditForm.milestoneEarnings}
                    onChange={(e) =>
                      setRiderEditForm({
                        ...riderEditForm,
                        milestoneEarnings: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between">
                <span className="font-bold text-indigo-950">Updated Gross Total:</span>
                <span className="font-mono text-lg font-black text-indigo-700">
                  {formatINR(
                    riderEditForm.slotEarnings +
                      riderEditForm.orderEarnings +
                      riderEditForm.distanceEarnings +
                      riderEditForm.incentiveEarnings +
                      riderEditForm.surgeEarnings +
                      riderEditForm.milestoneEarnings
                  )}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRiderEarnings(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black cursor-pointer"
                >
                  Save Earnings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: DISBURSE SINGLE RIDER PAYOUT MODAL                          */}
      {/* ==================================================================== */}
      {payoutModalRider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Disburse Bank Payout: {payoutModalRider.name}
                </h3>
                <p className="text-xs text-slate-500">
                  A/C: {payoutModalRider.bankAccountNo || '50100452391024'} ({payoutModalRider.ifscCode || 'HDFC0000241'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayoutModalRider(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSinglePayoutSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Settlement Period Label</label>
                <input
                  type="text"
                  required
                  value={payoutPeriodLabel}
                  onChange={(e) => setPayoutPeriodLabel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Payment Mode</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="IMPS">IMPS Instant Bank Transfer</option>
                    <option value="NEFT">NEFT Bank Settlement</option>
                    <option value="UPI_INSTANT">UPI Instant Payout</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    COD / Penalty Deduction (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={payoutDeductions}
                    onChange={(e) => setPayoutDeductions(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Bank UTR / Reference Number
                </label>
                <input
                  type="text"
                  value={payoutUtr}
                  onChange={(e) => setPayoutUtr(e.target.value)}
                  placeholder="e.g. HDFC262910884120"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={markPaidImmediately}
                  onChange={(e) => setMarkPaidImmediately(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span>Mark as PAID immediately &amp; post to Financial Ledger</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayoutModalRider(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black cursor-pointer"
                >
                  Confirm &amp; Disburse Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: APPROVE PENDING PAYOUT VOUCHER                              */}
      {/* ==================================================================== */}
      {approvingPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 block">
                  {approvingPayout.id}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Approve Rider Payout: {approvingPayout.riderName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingPayout(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross 6-Tier Earnings:</span>
                <span className="font-mono font-bold">{formatINR(approvingPayout.breakdown.grossEarnings)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>TDS &amp; Deductions:</span>
                <span className="font-mono font-bold">
                  -{formatINR(approvingPayout.breakdown.tdsDeduction + approvingPayout.breakdown.codDeductionsOrPenalties)}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-black text-indigo-700">
                <span>Net Payable Disbursal:</span>
                <span className="font-mono">{formatINR(approvingPayout.breakdown.netPayableAmount)}</span>
              </div>
            </div>

            <form onSubmit={handleApprovePayoutSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Bank UTR / NEFT / IMPS Reference Number *
                </label>
                <input
                  type="text"
                  required
                  value={approveUtrInput}
                  onChange={(e) => setApproveUtrInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Settlement Notes</label>
                <input
                  type="text"
                  value={approveNotesInput}
                  onChange={(e) => setApproveNotesInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setApprovingPayout(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black cursor-pointer"
                >
                  Approve for Bank Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: VIEW ITEMIZED RIDER PAYOUT SLIP                             */}
      {/* ==================================================================== */}
      {viewingPayoutSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono text-[11px] font-black text-indigo-600">
                  {viewingPayoutSlip.id}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Rider Earning &amp; Payout Statement
                </h3>
                <p className="text-[11px] text-slate-500">{viewingPayoutSlip.periodLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPayoutSlip(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-black text-slate-900 text-sm">{viewingPayoutSlip.riderName}</div>
              <div className="text-slate-600">Store Hub: {viewingPayoutSlip.outletName}</div>
              <div className="font-mono text-slate-700">
                Bank A/C: {viewingPayoutSlip.bankAccountNo} • IFSC: {viewingPayoutSlip.ifscCode} • PAN:{' '}
                {viewingPayoutSlip.panNumber}
              </div>
            </div>

            <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">1. Slot-Based Shift Guarantee:</span>
                <span className="font-mono font-bold">{formatINR(viewingPayoutSlip.breakdown.slotEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">2. Order-Based Deliveries:</span>
                <span className="font-mono font-bold">{formatINR(viewingPayoutSlip.breakdown.orderEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">3. Distance-Based Pay (KM):</span>
                <span className="font-mono font-bold">{formatINR(viewingPayoutSlip.breakdown.distanceEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">4. Daily Target Incentives:</span>
                <span className="font-mono font-bold text-emerald-700">
                  +{formatINR(viewingPayoutSlip.breakdown.incentiveEarnings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">5. Surge Multiplier Bonus:</span>
                <span className="font-mono font-bold text-amber-700">
                  +{formatINR(viewingPayoutSlip.breakdown.surgeEarnings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">6. Milestone Achievement Bonus:</span>
                <span className="font-mono font-bold text-purple-700">
                  +{formatINR(viewingPayoutSlip.breakdown.milestoneEarnings)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                <span>Gross Total Earnings:</span>
                <span className="font-mono">{formatINR(viewingPayoutSlip.breakdown.grossEarnings)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>TDS &amp; Penalties Deducted:</span>
                <span className="font-mono">
                  -{formatINR(viewingPayoutSlip.breakdown.tdsDeduction + viewingPayoutSlip.breakdown.codDeductionsOrPenalties)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-indigo-700">
                <span>Net Disbursed Amount:</span>
                <span className="font-mono">{formatINR(viewingPayoutSlip.breakdown.netPayableAmount)}</span>
              </div>
            </div>

            {viewingPayoutSlip.utrReference && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-mono text-[11px]">
                Bank UTR: <strong>{viewingPayoutSlip.utrReference}</strong> ({viewingPayoutSlip.paymentMethod})
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingPayoutSlip(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
