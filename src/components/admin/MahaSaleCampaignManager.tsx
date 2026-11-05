import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { MahaSaleParticipation, MahaSaleSlot, MahaSaleStatus, Product } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Timer,
  ShoppingBag,
  Store,
  Tag,
  TrendingDown,
  Info,
  ShieldCheck,
  Layers,
  Calendar,
  Percent,
  DollarSign,
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const MahaSaleCampaignManager: React.FC = () => {
  const {
    currentRole,
    currentUser,
    activeOutlet,
    outlets,
    products,
    mahaSaleSlots,
    createMahaSaleSlot,
    updateMahaSaleSlot,
    deleteMahaSaleSlot,
    participateInMahaSaleSlot,
    mahaSaleParticipations,
    endMahaSaleEarly,
    getProductJeAssuredHealth,
    setActiveModal,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  // Live timer tick state (updates every second for accurate countdown display)
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Main Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'slots' | 'live_deals' | 'je_assured'>('slots');

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | MahaSaleStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [outletFilter, setOutletFilter] = useState<string>('all');

  // Notifications
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showNotification = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // ==========================================
  // SLOT CREATION MODAL STATE (Super Admin Only)
  // ==========================================
  const [showCreateSlotModal, setShowCreateSlotModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotTitle, setSlotTitle] = useState('');
  const [slotTagline, setSlotTagline] = useState('');
  const [slotBadgeText, setSlotBadgeText] = useState('FLASH SALE');
  const [slotBannerGradient, setSlotBannerGradient] = useState('from-rose-600 via-rose-700 to-amber-600');
  const [slotStartTime, setSlotStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [slotDurationHours, setSlotDurationHours] = useState<number>(24);
  const [slotMinDiscountPct, setSlotMinDiscountPct] = useState<number>(10);
  const [slotDiscountTypeAllowed, setSlotDiscountTypeAllowed] = useState<'both' | 'percentage' | 'fixed_value'>('both');
  const [slotStatus, setSlotStatus] = useState<'active' | 'upcoming' | 'completed'>('active');

  const handleOpenCreateSlot = () => {
    setEditingSlotId(null);
    setSlotTitle('');
    setSlotTagline('');
    setSlotBadgeText('FLASH SALE');
    setSlotBannerGradient('from-rose-600 via-rose-700 to-amber-600');
    setSlotStartTime(new Date().toISOString().slice(0, 16));
    setSlotDurationHours(24);
    setSlotMinDiscountPct(10);
    setSlotDiscountTypeAllowed('both');
    setSlotStatus('active');
    setShowCreateSlotModal(true);
  };

  const handleOpenEditSlot = (slot: MahaSaleSlot) => {
    setEditingSlotId(slot.id);
    setSlotTitle(slot.title);
    setSlotTagline(slot.tagline);
    setSlotBadgeText(slot.badgeText || 'FLASH SALE');
    setSlotBannerGradient(slot.bannerGradient || 'from-rose-600 via-rose-700 to-amber-600');
    setSlotStartTime(new Date(slot.startTime).toISOString().slice(0, 16));
    setSlotDurationHours(slot.durationHours || 24);
    setSlotMinDiscountPct(slot.minDiscountPct || 10);
    setSlotDiscountTypeAllowed(slot.discountTypeAllowed || 'both');
    setSlotStatus(slot.status);
    setShowCreateSlotModal(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotTitle.trim()) {
      showNotification('error', 'Please enter a slot title');
      return;
    }

    const startIso = new Date(slotStartTime).toISOString();
    const endIso = new Date(new Date(slotStartTime).getTime() + slotDurationHours * 3600 * 1000).toISOString();

    if (editingSlotId) {
      updateMahaSaleSlot(editingSlotId, {
        title: slotTitle.trim(),
        tagline: slotTagline.trim(),
        badgeText: slotBadgeText.trim(),
        bannerGradient: slotBannerGradient,
        startTime: startIso,
        endTime: endIso,
        durationHours: slotDurationHours,
        minDiscountPct: slotMinDiscountPct,
        discountTypeAllowed: slotDiscountTypeAllowed,
        status: slotStatus,
      });
      showNotification('success', `Maha Sale slot "${slotTitle}" updated!`);
    } else {
      createMahaSaleSlot({
        title: slotTitle.trim(),
        tagline: slotTagline.trim(),
        badgeText: slotBadgeText.trim(),
        bannerGradient: slotBannerGradient,
        startTime: startIso,
        endTime: endIso,
        durationHours: slotDurationHours,
        minDiscountPct: slotMinDiscountPct,
        discountTypeAllowed: slotDiscountTypeAllowed,
        status: slotStatus,
      });
      showNotification('success', `New Maha Sale slot "${slotTitle}" created! Stores can now participate.`);
    }

    setShowCreateSlotModal(false);
  };

  // ==========================================
  // STORE PARTICIPATION MODAL (Single & Bulk with Auto-Approval)
  // ==========================================
  const [showParticipationModal, setShowParticipationModal] = useState(false);
  const [targetSlot, setTargetSlot] = useState<MahaSaleSlot | null>(null);
  const [participationMode, setParticipationMode] = useState<'single' | 'bulk'>('single');
  const [participationSearch, setParticipationSearch] = useState('');
  const [participationCategory, setParticipationCategory] = useState('all');

  // Single mode states
  const [singleProductId, setSingleProductId] = useState<string>('');
  const [singleDiscountType, setSingleDiscountType] = useState<'percentage' | 'fixed_value'>('percentage');
  const [singleDiscountValue, setSingleDiscountValue] = useState<number>(15);
  const [singleNotes, setSingleNotes] = useState('');

  // Bulk mode states
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkDiscountType, setBulkDiscountType] = useState<'percentage' | 'fixed_value'>('percentage');
  const [bulkDiscountValue, setBulkDiscountValue] = useState<number>(15);
  // Custom discount overrides per product (productId -> { type, value })
  const [customOverrides, setCustomOverrides] = useState<Record<string, { type: 'percentage' | 'fixed_value'; value: number }>>({});

  const handleOpenParticipate = (slot: MahaSaleSlot) => {
    setTargetSlot(slot);
    setParticipationMode('single');
    setSingleProductId('');
    setSingleDiscountType(slot.discountTypeAllowed === 'fixed_value' ? 'fixed_value' : 'percentage');
    setSingleDiscountValue(slot.minDiscountPct || 15);
    setSingleNotes('');
    setSelectedProductIds([]);
    setBulkDiscountType(slot.discountTypeAllowed === 'fixed_value' ? 'fixed_value' : 'percentage');
    setBulkDiscountValue(slot.minDiscountPct || 15);
    setCustomOverrides({});
    setParticipationSearch('');
    setParticipationCategory('all');
    setShowParticipationModal(true);
  };

  // Filter products for participation
  const availableStoreProducts = useMemo(() => {
    return products.filter((p) => {
      if (participationCategory !== 'all' && p.categoryId !== participationCategory) return false;
      if (participationSearch.trim()) {
        const q = participationSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, participationCategory, participationSearch]);

  // Single nominated product calculations
  const selectedSingleProduct = products.find((p) => p.id === singleProductId);
  const singleCalculatedDealPrice = useMemo(() => {
    if (!selectedSingleProduct) return 0;
    if (singleDiscountType === 'percentage') {
      const pct = Math.min(90, Math.max(1, singleDiscountValue));
      return Math.max(1, Math.round(selectedSingleProduct.regularPrice * (1 - pct / 100)));
    } else {
      const val = Math.max(1, singleDiscountValue);
      return Math.max(1, selectedSingleProduct.regularPrice - val);
    }
  }, [selectedSingleProduct, singleDiscountType, singleDiscountValue]);

  const singleCalculatedDiscountPct = useMemo(() => {
    if (!selectedSingleProduct || selectedSingleProduct.regularPrice <= 0) return 0;
    return Math.round(((selectedSingleProduct.regularPrice - singleCalculatedDealPrice) / selectedSingleProduct.regularPrice) * 100);
  }, [selectedSingleProduct, singleCalculatedDealPrice]);

  // Bulk toggle helper
  const handleToggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = availableStoreProducts.map((p) => p.id);
    setSelectedProductIds(ids);
  };

  const handleClearSelection = () => {
    setSelectedProductIds([]);
  };

  // Confirm and Submit Participation (AUTO-APPROVED)
  const handleSubmitParticipation = () => {
    if (!targetSlot) return;

    if (participationMode === 'single') {
      if (!selectedSingleProduct) {
        showNotification('error', 'Please select a product to participate');
        return;
      }

      const res = participateInMahaSaleSlot({
        slotId: targetSlot.id,
        items: [
          {
            productId: selectedSingleProduct.id,
            discountType: singleDiscountType,
            discountValue: singleDiscountValue,
          },
        ],
        storeNotes: singleNotes || `Single deal in ${targetSlot.title}`,
      });

      if (res.success) {
        showNotification('success', res.message);
        setShowParticipationModal(false);
      } else {
        showNotification('error', res.message);
      }
    } else {
      // Bulk Mode
      if (selectedProductIds.length === 0) {
        showNotification('error', 'Please select at least 1 product for bulk discount');
        return;
      }

      const itemsToSubmit = selectedProductIds.map((pId) => {
        const custom = customOverrides[pId];
        return {
          productId: pId,
          discountType: custom?.type || bulkDiscountType,
          discountValue: custom?.value || bulkDiscountValue,
        };
      });

      const res = participateInMahaSaleSlot({
        slotId: targetSlot.id,
        items: itemsToSubmit,
        storeNotes: `Bulk participation (${itemsToSubmit.length} products) in ${targetSlot.title}`,
      });

      if (res.success) {
        showNotification('success', res.message);
        setShowParticipationModal(false);
      } else {
        showNotification('error', res.message);
      }
    }
  };

  // Format countdown string from ISO timestamp
  const formatCountdown = (endTime?: string) => {
    if (!endTime) return '00h 00m 00s';
    const endMs = new Date(endTime).getTime();
    const diff = endMs - nowMs;
    if (diff <= 0) return 'Expired / Closed';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  // Scoped list of participations
  const scopedParticipations = isSuperAdmin
    ? mahaSaleParticipations.filter((p) => outletFilter === 'all' || p.storeId === outletFilter)
    : mahaSaleParticipations.filter(
        (p) => !currentUser.storeId || p.storeId === currentUser.storeId || p.storeId === activeOutlet?.id
      );

  const filteredParticipations = scopedParticipations.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.productName.toLowerCase().includes(q) ||
        p.storeName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // JE Assured Products List (Always included in Maha Sale)
  const jeAssuredProducts = useMemo(() => {
    return products.filter((p) => {
      const isJeAssured =
        p.isJeAssured === true ||
        p.badge === 'JE Assured' ||
        p.jeAssuredHealth?.isLiveWithBadge === true ||
        p.jeAssuredHealth?.eligibleForMahaSale === true;
      return isJeAssured;
    });
  }, [products]);

  return (
    <div className="space-y-6">
      {/* GLOBAL FEEDBACK TOAST */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP HEADER & STATS BAR */}
      <div className="bg-linear-to-r from-rose-900 via-rose-800 to-amber-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-amber-950" />
                <span>Restructured Maha Sale Engine</span>
              </span>
              <span className="text-xs text-rose-200">Auto-Approved Flash Deals · % or ₹ Discounts</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              Maha Sale Slots &amp; Store Participation Hub
            </h2>
            <p className="text-rose-100 text-xs mt-1 max-w-2xl">
              Store Admin creates high-visibility sale slots. Stores choose products one-by-one or in bulk with percentage or fixed-value discounts. Deals are <strong>auto-approved</strong> and go live instantly!
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateSlot}
                className="px-4 py-2.5 bg-white text-rose-900 hover:bg-rose-50 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-rose-700" />
                <span>Create Maha Sale Slot</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveModal('maha_sale')}
              className="px-4 py-2.5 bg-black/30 hover:bg-black/45 text-white border border-white/20 rounded-xl font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              <span>Preview Live Storefront</span>
            </button>
          </div>
        </div>

        {/* 4-KPI HIGHLIGHT STRIP */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">
              Maha Sale Slots
            </span>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {mahaSaleSlots.length}
            </div>
            <span className="text-[10px] text-emerald-300 font-semibold">
              {mahaSaleSlots.filter((s) => s.status === 'active').length} Active Now
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">
              Live Flash Deals
            </span>
            <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
              {scopedParticipations.filter((p) => p.status === 'store_accepted_live').length}
            </div>
            <span className="text-[10px] text-rose-200">⚡ Auto-approved & active</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">
              JE Assured in Sale
            </span>
            <div className="text-xl font-black text-cyan-300 font-mono mt-0.5">
              {jeAssuredProducts.length}
            </div>
            <span className="text-[10px] text-cyan-200">Always listed automatically</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">
              Participating Stores
            </span>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {outlets.length}
            </div>
            <span className="text-[10px] text-rose-200">Across Lucknow branches</span>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('slots')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'slots'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Maha Sale Slots ({mahaSaleSlots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('live_deals')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'live_deals'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>Live Store Deals ({scopedParticipations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('je_assured')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'je_assured'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>JE Assured Deals ({jeAssuredProducts.length})</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded">
            Always Listed
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: MAHA SALE SLOTS & EVENTS */}
      {/* ======================================================== */}
      {activeSubTab === 'slots' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Available Maha Sale Slots
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Stores can view available campaign slots and participate with single or bulk discounts.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateSlot}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Slot</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mahaSaleSlots.map((slot) => {
              const isSlotActive = slot.status === 'active';
              const countdown = formatCountdown(slot.endTime);

              return (
                <div
                  key={slot.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Slot Banner Gradient */}
                    <div className={`p-4 bg-linear-to-r ${slot.bannerGradient} text-white relative`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-black/25 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                          {slot.badgeText || 'SALE SLOT'}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            slot.status === 'active'
                              ? 'bg-emerald-400 text-emerald-950'
                              : slot.status === 'upcoming'
                              ? 'bg-cyan-200 text-cyan-950'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {slot.status === 'active' ? 'Active Now' : slot.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                        </span>
                      </div>

                      <h4 className="text-base font-black tracking-tight mt-2">{slot.title}</h4>
                      <p className="text-xs text-white/85 mt-0.5 line-clamp-1">{slot.tagline}</p>
                    </div>

                    {/* Slot Details Body */}
                    <div className="p-4 space-y-3 text-xs">
                      {/* Live Countdown & Duration */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-4 h-4 text-rose-600" />
                          <span className="font-semibold">Window:</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">{countdown}</span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {slot.durationHours}h slot duration
                          </span>
                        </div>
                      </div>

                      {/* Rules & Allowed Discounts */}
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Min Discount Required:</span>
                          <span className="font-bold text-slate-900">{slot.minDiscountPct}% OFF</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Discount Modes:</span>
                          <span className="font-semibold text-slate-800 capitalize">
                            {slot.discountTypeAllowed === 'both'
                              ? '% Percentage & ₹ Value'
                              : slot.discountTypeAllowed === 'percentage'
                              ? '% Percentage Only'
                              : '₹ Value Only'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Approval Workflow:</span>
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                            <span>Auto-Approved</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenParticipate(slot)}
                      className="flex-1 py-2 px-3 bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5 fill-white" />
                      <span>Participate in Slot</span>
                    </button>

                    {isSuperAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSlot(slot)}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Edit Slot"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete Maha Sale slot "${slot.title}"?`)) {
                              deleteMahaSaleSlot(slot.id);
                              showNotification('success', 'Slot deleted');
                            }
                          }}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: STORE LIVE DEALS & PARTICIPATIONS */}
      {/* ======================================================== */}
      {activeSubTab === 'live_deals' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search product, store, ID..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">All Deal Statuses</option>
                <option value="store_accepted_live">Live (Auto-Approved)</option>
                <option value="expired_completed">Completed / Expired</option>
              </select>

              {isSuperAdmin && (
                <select
                  value={outletFilter}
                  onChange={(e) => setOutletFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="all">All Outlets</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <span className="text-xs text-slate-500">
              Showing {filteredParticipations.length} deal(s)
            </span>
          </div>

          {/* Deals Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-3">Store Origin</th>
                    <th className="py-3 px-3">Regular Price</th>
                    <th className="py-3 px-3">Flash Deal Price</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-3">Campaign Slot</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Countdown</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <span className="font-semibold">No participating deals found.</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Click &ldquo;Maha Sale Slots&rdquo; tab above and participate with store products.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredParticipations.map((item) => {
                      const isLive = item.status === 'store_accepted_live';
                      const countdown = isLive ? formatCountdown(item.liveEndTime) : 'Ended';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-10 h-10 object-contain rounded-lg border border-slate-200 p-1 shrink-0 bg-white"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate max-w-xs">
                                  {item.productName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  ID: {item.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-700 truncate max-w-[150px]">
                            {item.storeName}
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-500">
                            {formatINR(item.regularPrice)}
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-emerald-700 text-sm">
                            {formatINR(item.finalDealPrice || item.proposedDealPrice)}
                          </td>

                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-mono text-[11px]">
                              {item.finalDiscountPct || item.requestedDiscountPct}% OFF
                            </span>
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-700">
                            {item.slotTitle || 'Festive Dhamaka Mega Slot'}
                          </td>

                          <td className="py-3 px-3">
                            {isLive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                                <Zap className="w-3 h-3 fill-emerald-600" />
                                <span>LIVE</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                                Completed
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-amber-700 text-xs">
                            {countdown}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isLive && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`End Maha Sale deal for "${item.productName}" early?`)) {
                                    endMahaSaleEarly(item.id);
                                    showNotification('success', `Deal ended early for ${item.productName}`);
                                  }
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                End Early
                              </button>
                            )}
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
      {/* SUB-TAB 3: JE ASSURED DEALS (Always Listed) */}
      {/* ======================================================== */}
      {activeSubTab === 'je_assured' && (
        <div className="space-y-4">
          {/* JE Assured Guarantee Notice */}
          <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-blue-950">
                  JE Assured Products Always List in Maha Sale
                </h4>
                <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Automatic Opt-In
                </span>
              </div>
              <p className="text-xs text-blue-900/80 mt-0.5">
                All products verified under the JE Assured 4-pillar quality benchmark (catalogue, inventory, SLA dispatch, and verified buyer reviews) are permanently listed on the Maha Sale storefront and modal with the verified JE Assured badge.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {jeAssuredProducts.map((p) => {
              const dealPrice = p.dealPrice || p.regularPrice;
              const discountPct = Math.round(((p.mrp - dealPrice) / p.mrp) * 100);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="relative aspect-[4/3] rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center mb-3">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3 h-3" />
                        <span>JE Assured</span>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">
                        {discountPct}% OFF
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
                      SKU: {p.sku} · {p.brand}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-2">
                      {p.name}
                    </h5>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-base font-bold font-mono text-slate-900">
                        {formatINR(dealPrice)}
                      </span>
                      <span className="text-xs text-slate-400 line-through font-mono">
                        {formatINR(p.mrp)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Stock: {p.stock.onHand} units</span>
                    </span>
                    <span className="text-blue-600 font-bold">Guaranteed in Sale</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREATE / EDIT MAHA SALE SLOT (Super Admin Only) */}
      {/* ======================================================== */}
      {showCreateSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingSlotId ? 'Edit Maha Sale Slot' : 'Create New Maha Sale Slot'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateSlotModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Slot / Campaign Title *</label>
                <input
                  type="text"
                  value={slotTitle}
                  onChange={(e) => setSlotTitle(e.target.value)}
                  placeholder="e.g. Grand Festive Dhamaka Mega Slot"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tagline / Subtitle *</label>
                <input
                  type="text"
                  value={slotTagline}
                  onChange={(e) => setSlotTagline(e.target.value)}
                  placeholder="e.g. Exclusive Storewide Flash Discounts on Audio & Mobiles"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={slotBadgeText}
                    onChange={(e) => setSlotBadgeText(e.target.value)}
                    placeholder="e.g. FLASH BLITZ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={slotStatus}
                    onChange={(e) => setSlotStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="active">Active Now</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Hours) *</label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={slotDurationHours}
                    onChange={(e) => setSlotDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Discount Required (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={slotMinDiscountPct}
                    onChange={(e) => setSlotMinDiscountPct(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Modes Allowed</label>
                  <select
                    value={slotDiscountTypeAllowed}
                    onChange={(e) => setSlotDiscountTypeAllowed(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="both">% Percentage &amp; ₹ Value</option>
                    <option value="percentage">% Percentage Only</option>
                    <option value="fixed_value">₹ Fixed Value Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Banner Color Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Rose Amber', val: 'from-rose-600 via-rose-700 to-amber-600' },
                    { label: 'Purple Indigo', val: 'from-purple-700 via-indigo-700 to-rose-600' },
                    { label: 'Blue Cyan', val: 'from-blue-700 via-cyan-600 to-indigo-700' },
                  ].map((theme) => (
                    <button
                      key={theme.val}
                      type="button"
                      onClick={() => setSlotBannerGradient(theme.val)}
                      className={`p-2 rounded-lg border text-center font-bold text-[11px] cursor-pointer transition-all ${
                        slotBannerGradient === theme.val
                          ? 'border-slate-900 bg-slate-100 text-slate-900 ring-2 ring-slate-900'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className={`h-3 rounded mb-1 bg-linear-to-r ${theme.val}`} />
                      <span>{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateSlotModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  {editingSlotId ? 'Save Changes' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: STORE PARTICIPATION & BULK DISCOUNT CREATOR */}
      {/* ======================================================== */}
      {showParticipationModal && targetSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded uppercase">
                    {targetSlot.badgeText || 'SALE SLOT'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Participate in &ldquo;{targetSlot.title}&rdquo;
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select products one-by-one or in bulk with % or ₹ discounts. <strong>Auto-approved instantly!</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowParticipationModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection Mode Switcher: Single vs Bulk */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setParticipationMode('single')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  participationMode === 'single'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>One-by-One Selection</span>
              </button>

              <button
                type="button"
                onClick={() => setParticipationMode('bulk')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  participationMode === 'bulk'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Bulk Create Discount</span>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-extrabold">
                  Recommended
                </span>
              </button>
            </div>

            {/* MODAL CONTENT: SINGLE MODE */}
            {participationMode === 'single' && (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Product from Store Catalogue *</label>
                  <select
                    value={singleProductId}
                    onChange={(e) => setSingleProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="">-- Choose a Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Regular: {formatINR(p.regularPrice)} (Stock: {p.stock.onHand})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSingleProduct && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <img
                      src={selectedSingleProduct.images[0]}
                      alt={selectedSingleProduct.name}
                      className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-white p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-900 block truncate">{selectedSingleProduct.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        MRP: {formatINR(selectedSingleProduct.mrp)} · Regular: {formatINR(selectedSingleProduct.regularPrice)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Discount Type: % or ₹ */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Discount Type *</label>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSingleDiscountType('percentage')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          singleDiscountType === 'percentage'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Percent className="w-3 h-3" />
                        <span>Percentage (%)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSingleDiscountType('fixed_value')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          singleDiscountType === 'fixed_value'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Fixed Value (₹)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {singleDiscountType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={singleDiscountType === 'percentage' ? 90 : (selectedSingleProduct?.regularPrice ? selectedSingleProduct.regularPrice - 1 : 100000)}
                      value={singleDiscountValue}
                      onChange={(e) => setSingleDiscountValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Calculated Deal Preview */}
                {selectedSingleProduct && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Live Deal Preview
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">Customer Pays:</span>
                      <span className="text-base font-extrabold font-mono text-emerald-800">
                        {formatINR(singleCalculatedDealPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Total Savings for Buyer:</span>
                      <span className="font-bold font-mono text-emerald-700">
                        {formatINR(selectedSingleProduct.regularPrice - singleCalculatedDealPrice)} ({singleCalculatedDiscountPct}% OFF)
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Store Notes (Optional)</label>
                  <input
                    type="text"
                    value={singleNotes}
                    onChange={(e) => setSingleNotes(e.target.value)}
                    placeholder="e.g. Flash volume deal for evening customer rush"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* MODAL CONTENT: BULK MODE */}
            {participationMode === 'bulk' && (
              <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 text-xs">
                {/* Universal Bulk Discount Controller */}
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-rose-600" />
                      <span>Bulk Discount Rule (Applies to all selected)</span>
                    </span>
                    <span className="text-[10px] text-rose-700 font-semibold">
                      {selectedProductIds.length} Products Selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-rose-200">
                      <button
                        type="button"
                        onClick={() => setBulkDiscountType('percentage')}
                        className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          bulkDiscountType === 'percentage'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Percent className="w-3 h-3" />
                        <span>Percentage (%)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkDiscountType('fixed_value')}
                        className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          bulkDiscountType === 'fixed_value'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Fixed Value (₹)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={bulkDiscountValue}
                        onChange={(e) => setBulkDiscountValue(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg font-mono font-bold text-slate-900"
                        placeholder={bulkDiscountType === 'percentage' ? 'e.g. 15% OFF' : 'e.g. ₹300 OFF'}
                      />
                      <span className="font-bold text-rose-900 shrink-0">
                        {bulkDiscountType === 'percentage' ? '% OFF' : '₹ OFF'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filter & Selection Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute ml-2.5" />
                    <input
                      type="text"
                      value={participationSearch}
                      onChange={(e) => setParticipationSearch(e.target.value)}
                      placeholder="Search store catalogue..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      Select All ({availableStoreProducts.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-[11px] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Products Multi-Selection List */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {availableStoreProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    const custom = customOverrides[p.id];
                    const discType = custom?.type || bulkDiscountType;
                    const discVal = custom?.value ?? bulkDiscountValue;

                    let dealPrice = p.regularPrice;
                    if (discType === 'percentage') {
                      dealPrice = Math.max(1, Math.round(p.regularPrice * (1 - discVal / 100)));
                    } else {
                      dealPrice = Math.max(1, p.regularPrice - discVal);
                    }
                    const discountPct = Math.round(((p.regularPrice - dealPrice) / p.regularPrice) * 100);

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleProductSelection(p.id)}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-rose-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 text-rose-600 rounded cursor-pointer shrink-0"
                          />
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-8 h-8 object-contain rounded border border-slate-200 bg-white p-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Reg: {formatINR(p.regularPrice)} · Stock: {p.stock.onHand}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-emerald-800 text-xs block">
                            Deal: {formatINR(dealPrice)}
                          </span>
                          <span className="text-[10px] text-rose-700 font-bold font-mono">
                            {discountPct}% OFF
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer CTAs (Auto-Approved) */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Auto-Approved upon launch</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowParticipationModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitParticipation}
                  className="px-5 py-2 bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>
                    {participationMode === 'single'
                      ? 'Launch Deal (Auto-Approved)'
                      : `Confirm & Launch ${selectedProductIds.length} Products (Auto-Approved)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
