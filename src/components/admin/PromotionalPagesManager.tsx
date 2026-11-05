import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  PromotionalPage,
  PromoBasisType,
  PromoScheduleType,
  PromoHomepagePlacement,
  PromoPlacementDisplayType,
  ProductCategory,
  Product,
} from '../../types';
import { isPromotionalPageCurrentlyActive } from '../../utils/promotionalEngine';
import { formatINR } from '../../utils/currency';
import { StorePromotionAndJeAssuredHub } from './StorePromotionAndJeAssuredHub';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Clock,
  Layers,
  Search,
  Filter,
  Check,
  X,
  Zap,
  Flame,
  Tag,
  Gift,
  ShieldCheck,
  Building2,
  Store,
  ArrowUpRight,
  SlidersHorizontal,
  Palette,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

const PRESET_BANNERS = [
  {
    label: 'Tech Cyber Neon',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    theme: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%)',
  },
  {
    label: 'Smartphone Flagship',
    url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
    theme: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
  },
  {
    label: 'Payday Midnight Blue',
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    theme: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #0284c7 100%)',
  },
  {
    label: 'Bass & Audio Teal',
    url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    theme: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
  },
  {
    label: 'Festive Gold Red',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    theme: 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f59e0b 100%)',
  },
];

export interface PromotionalPagesManagerProps {
  preselectedProductId?: string | null;
  initialOpenRequestModal?: boolean;
  onClearPreselectedProduct?: () => void;
}

export const PromotionalPagesManager: React.FC<PromotionalPagesManagerProps> = ({
  preselectedProductId,
  initialOpenRequestModal = false,
  onClearPreselectedProduct,
}) => {
  const {
    promotionalPages,
    addPromotionalPage,
    updatePromotionalPage,
    deletePromotionalPage,
    togglePromotionalPageStatus,
    setActivePromotionalPage,
    setActiveModal,
    products,
    categories,
    outlets,
    settings,
    updateSettings,
    currentUser,
    currentRole,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';

  const [showStoreRequestModal, setShowStoreRequestModal] = useState<boolean>(
    initialOpenRequestModal
  );

  useEffect(() => {
    if (initialOpenRequestModal) {
      setShowStoreRequestModal(true);
    }
  }, [initialOpenRequestModal, preselectedProductId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [basisFilter, setBasisFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionalPage | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Distinct Brands from products
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.brand));
    return Array.from(set).sort();
  }, [products]);

  // Form states
  const [titleForm, setTitleForm] = useState('');
  const [slugForm, setSlugForm] = useState('');
  const [basisTypeForm, setBasisTypeForm] = useState<PromoBasisType>('category');
  const [basisValueForm, setBasisValueForm] = useState<string>('smartphones');
  const [descriptionForm, setDescriptionForm] = useState('');

  // Timing & Schedule
  const [scheduleTypeForm, setScheduleTypeForm] = useState<PromoScheduleType>('always_active');
  const [startDateForm, setStartDateForm] = useState('');
  const [endDateForm, setEndDateForm] = useState('');
  const [recurringDaysForm, setRecurringDaysForm] = useState<number[]>([0, 6]); // weekends
  const [slotStartTimeForm, setSlotStartTimeForm] = useState('12:00');
  const [slotEndTimeForm, setSlotEndTimeForm] = useState('22:00');
  const [monthEndDaysForm, setMonthEndDaysForm] = useState<number>(3);
  const [monthStartDaysForm, setMonthStartDaysForm] = useState<number>(5);
  const [isActiveForm, setIsActiveForm] = useState(true);

  // Banner & Visuals
  const [bannerImageUrlForm, setBannerImageUrlForm] = useState(PRESET_BANNERS[0].url);
  const [bannerHeadlineForm, setBannerHeadlineForm] = useState('');
  const [bannerSubtextForm, setBannerSubtextForm] = useState('');
  const [bannerThemeForm, setBannerThemeForm] = useState(PRESET_BANNERS[0].theme);
  const [badgeTextForm, setBadgeTextForm] = useState('SPECIAL PROMOTION');
  const [tickerTextForm, setTickerTextForm] = useState('');

  // Homepage Linkage
  const [homepagePlacementsForm, setHomepagePlacementsForm] = useState<PromoHomepagePlacement[]>(['top', 'middle']);
  const [placementDisplayTypeForm, setPlacementDisplayTypeForm] = useState<PromoPlacementDisplayType>('strip_banner');
  const [placementIconForm, setPlacementIconForm] = useState('Sparkles');
  const [placementTextForm, setPlacementTextForm] = useState('');
  const [priorityForm, setPriorityForm] = useState<number>(1);

  // Product Selection
  const [productSelectionModeForm, setProductSelectionModeForm] = useState<'manual' | 'filter_rule' | 'hybrid'>('manual');
  const [selectedProductIdsForm, setSelectedProductIdsForm] = useState<string[]>([]);
  const [productSearchInModal, setProductSearchInModal] = useState('');

  // ==========================================
  // JE Assured Badge Settings Form
  // ==========================================
  const [assuredNameForm, setAssuredNameForm] = useState(settings.assuredBadgeName || 'JE Assured');
  const [assuredEnabledForm, setAssuredEnabledForm] = useState(settings.assuredBadgeEnabled !== false);
  const [assuredTaglineForm, setAssuredTaglineForm] = useState(settings.assuredTagline || '100% Genuine • Tested Quality & Brand Warranty');
  const [assuredColorForm, setAssuredColorForm] = useState(settings.assuredBadgeColor || 'linear-gradient(90deg, #c2185b 0%, #e53935 100%)');
  const [assuredSavedNotice, setAssuredSavedNotice] = useState(false);

  const handleSaveAssuredSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      assuredBadgeName: assuredNameForm.trim() || 'JE Assured',
      assuredBadgeEnabled: assuredEnabledForm,
      assuredTagline: assuredTaglineForm.trim() || '100% Genuine • Tested Quality',
      assuredBadgeColor: assuredColorForm.trim(),
    });
    setAssuredSavedNotice(true);
    setTimeout(() => setAssuredSavedNotice(false), 3000);
    showFeedback('success', 'JE Assured badge configuration saved across store!');
  };

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setTitleForm('');
    setSlugForm('');
    setBasisTypeForm('category');
    setBasisValueForm('smartphones');
    setDescriptionForm('');
    setScheduleTypeForm('always_active');
    setStartDateForm('');
    setEndDateForm('');
    setRecurringDaysForm([0, 6]);
    setSlotStartTimeForm('12:00');
    setSlotEndTimeForm('22:00');
    setMonthEndDaysForm(3);
    setMonthStartDaysForm(5);
    setIsActiveForm(true);

    setBannerImageUrlForm(PRESET_BANNERS[0].url);
    setBannerHeadlineForm('🔥 Special Promotion Deals');
    setBannerSubtextForm('Handpicked electronics with express same-day delivery & JE Assured warranty.');
    setBannerThemeForm(PRESET_BANNERS[0].theme);
    setBadgeTextForm('LIVE PROMO');
    setTickerTextForm('⚡ Limited time promotional offers — Genuine warranty + Free delivery in Nalasopara & Vasai!');

    setHomepagePlacementsForm(['top', 'middle']);
    setPlacementDisplayTypeForm('strip_banner');
    setPlacementIconForm('Sparkles');
    setPlacementTextForm('🔥 Live Promotion: Click to explore special pricing');
    setPriorityForm(1);

    setProductSelectionModeForm('manual');
    setSelectedProductIdsForm(products.slice(0, 4).map((p) => p.id));
    setProductSearchInModal('');
    setShowModal(true);
  };

  const handleOpenEdit = (promo: PromotionalPage) => {
    setEditingPromo(promo);
    setTitleForm(promo.title);
    setSlugForm(promo.slug);
    setBasisTypeForm(promo.basisType);
    setBasisValueForm(promo.basisValue || '');
    setDescriptionForm(promo.description || '');
    setScheduleTypeForm(promo.scheduleType);
    setStartDateForm(promo.startDate || '');
    setEndDateForm(promo.endDate || '');
    setRecurringDaysForm(promo.recurringDays || [0, 6]);
    setSlotStartTimeForm(promo.slotStartTime || '12:00');
    setSlotEndTimeForm(promo.slotEndTime || '22:00');
    setMonthEndDaysForm(promo.monthEndDays || 3);
    setMonthStartDaysForm(promo.monthStartDays || 5);
    setIsActiveForm(promo.isActive);

    setBannerImageUrlForm(promo.bannerImageUrl || PRESET_BANNERS[0].url);
    setBannerHeadlineForm(promo.bannerHeadline);
    setBannerSubtextForm(promo.bannerSubtext);
    setBannerThemeForm(promo.bannerTheme || PRESET_BANNERS[0].theme);
    setBadgeTextForm(promo.badgeText || 'SPECIAL');
    setTickerTextForm(promo.promotionalTickerText || '');

    setHomepagePlacementsForm(promo.homepagePlacements || ['top']);
    setPlacementDisplayTypeForm(promo.placementDisplayType || 'strip_banner');
    setPlacementIconForm(promo.placementIcon || 'Sparkles');
    setPlacementTextForm(promo.placementText || '');
    setPriorityForm(promo.priority || 1);

    setProductSelectionModeForm(promo.productSelectionMode || 'manual');
    setSelectedProductIdsForm(promo.selectedProductIds || []);
    setProductSearchInModal('');
    setShowModal(true);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleForm.trim() || !bannerHeadlineForm.trim()) {
      showFeedback('error', 'Please provide a title and banner headline.');
      return;
    }

    const cleanSlug = slugForm.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || titleForm.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const payload = {
      title: titleForm.trim(),
      slug: cleanSlug,
      basisType: basisTypeForm,
      basisValue: basisValueForm.trim(),
      description: descriptionForm.trim(),

      isActive: isActiveForm,
      scheduleType: scheduleTypeForm,
      startDate: startDateForm || undefined,
      endDate: endDateForm || undefined,
      recurringDays: recurringDaysForm,
      slotStartTime: slotStartTimeForm,
      slotEndTime: slotEndTimeForm,
      monthEndDays: Number(monthEndDaysForm),
      monthStartDays: Number(monthStartDaysForm),

      bannerImageUrl: bannerImageUrlForm.trim(),
      bannerHeadline: bannerHeadlineForm.trim(),
      bannerSubtext: bannerSubtextForm.trim(),
      bannerTheme: bannerThemeForm.trim(),
      badgeText: badgeTextForm.trim(),
      promotionalTickerText: tickerTextForm.trim(),

      homepagePlacements: homepagePlacementsForm,
      placementDisplayType: placementDisplayTypeForm,
      placementIcon: placementIconForm,
      placementText: placementTextForm.trim(),
      priority: Number(priorityForm) || 1,

      productSelectionMode: productSelectionModeForm,
      selectedProductIds: selectedProductIdsForm,
    };

    if (editingPromo) {
      const res = updatePromotionalPage(editingPromo.id, payload);
      if (res.success) {
        showFeedback('success', `Promotional page "${titleForm}" updated successfully!`);
        setShowModal(false);
      }
    } else {
      const res = addPromotionalPage(payload);
      if (res.success) {
        showFeedback('success', res.message);
        setShowModal(false);
      }
    }
  };

  const handlePreviewPage = (promo: PromotionalPage) => {
    setActivePromotionalPage(promo);
    setActiveModal('promotional_page');
  };

  const togglePlacement = (placement: PromoHomepagePlacement) => {
    setHomepagePlacementsForm((prev) =>
      prev.includes(placement) ? prev.filter((p) => p !== placement) : [...prev, placement]
    );
  };

  const toggleProductIdSelection = (prodId: string) => {
    setSelectedProductIdsForm((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const filteredPromos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return promotionalPages.filter((p) => {
      if (basisFilter !== 'all' && p.basisType !== basisFilter) return false;
      if (q) {
        return (
          p.title.toLowerCase().includes(q) ||
          p.bannerHeadline.toLowerCase().includes(q) ||
          (p.basisValue && p.basisValue.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [promotionalPages, searchQuery, basisFilter]);

  // Modal filtered products for product selection
  const modalProducts = useMemo(() => {
    const q = productSearchInModal.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [products, productSearchInModal]);

  return (
    <div className="space-y-6">
      {/* STORE PROMOTION & LANDING PAGE REQUESTS + JE ASSURED 4-PILLAR SOP HUB */}
      <StorePromotionAndJeAssuredHub
        preselectedProductId={preselectedProductId}
        initialOpenRequestModal={initialOpenRequestModal}
        onClearPreselectedProduct={onClearPreselectedProduct}
        externalShowModal={showStoreRequestModal}
        onCloseExternalModal={() => {
          setShowStoreRequestModal(false);
          onClearPreselectedProduct?.();
        }}
      />

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Flame className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Promotion Sale Campaigns
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  {promotionalPages.length} Active Sales
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Special promotional campaigns, flash slots, and themed landing sales — operates alongside Maha Sale.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowStoreRequestModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Flame className="w-4 h-4 fill-amber-200 text-amber-200" />
              <span>Request Promotion Sale</span>
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Create Promotion Sale Page</span>
              </button>
            )}
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
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback.message}</span>
            </div>
            <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Pages</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">{promotionalPages.length}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Currently Live</span>
            <span className="text-lg font-black text-emerald-600 mt-0.5 block">
              {promotionalPages.filter((p) => isPromotionalPageCurrentlyActive(p)).length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Top Space</span>
            <span className="text-lg font-black text-indigo-600 mt-0.5 block">
              {promotionalPages.filter((p) => p.homepagePlacements.includes('top') && p.isActive).length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Middle &amp; Bottom</span>
            <span className="text-lg font-black text-pink-600 mt-0.5 block">
              {promotionalPages.filter((p) => (p.homepagePlacements.includes('middle') || p.homepagePlacements.includes('bottom')) && p.isActive).length}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARD: JE ASSURED BADGE CONFIG (SUPER ADMIN) */}
      {/* ======================================================== */}
      {isSuperAdmin && (
      <form onSubmit={handleSaveAssuredSettings} className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              &ldquo;JE Assured&rdquo; Badge Settings
            </h3>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-center"
          >
            <Check className="w-4 h-4" />
            <span>Save Setting</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Badge Display Name *
            </label>
            <input
              type="text"
              value={assuredNameForm}
              onChange={(e) => setAssuredNameForm(e.target.value)}
              placeholder="e.g. JE Assured, JE Authentic"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              required
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Shown on top-left of eligible product cards &amp; prices.
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Quality Assurance Tagline *
            </label>
            <input
              type="text"
              value={assuredTaglineForm}
              onChange={(e) => setAssuredTaglineForm(e.target.value)}
              placeholder="100% Genuine • Tested Quality & Brand Warranty"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Displayed in product detail modals &amp; promotion footers.
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Badge Status &amp; Live Preview
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={assuredEnabledForm}
                  onChange={(e) => setAssuredEnabledForm(e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded"
                />
                <span>Active</span>
              </label>

              {/* Live Preview pill */}
              <div
                className="px-2.5 py-1 rounded-lg text-white text-[11px] font-bold shadow-xs flex items-center gap-1"
                style={{ background: assuredColorForm }}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>{assuredNameForm || 'JE Assured'}</span>
              </div>
            </div>
          </div>
        </div>

        {assuredSavedNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved! &ldquo;{assuredNameForm}&rdquo; badge is now active in storefront product cards.</span>
          </div>
        )}
      </form>
      )}

      {/* ======================================================== */}
      {/* LIST OF PROMOTIONAL PAGES */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search promotions by title, basis..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={basisFilter}
              onChange={(e) => setBasisFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 capitalize"
            >
              <option value="all">All Campaign Bases</option>
              <option value="category">Category Based</option>
              <option value="brand">Brand Spotlight</option>
              <option value="shop">Shop / Outlet Based</option>
              <option value="festival">Festival Special</option>
              <option value="day_slot">Day / Time Slot Based</option>
              <option value="month_end">Month-End Sale</option>
              <option value="month_start">Month-Start Sale</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredPromos.length}</strong> pages
          </div>
        </div>

        {/* Promotional Pages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPromos.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-400 text-xs">
              No promotional pages found. Click &ldquo;Create Promotional Page&rdquo; above to create one.
            </div>
          ) : (
            filteredPromos.map((promo) => {
              const isCurrentlyLive = isPromotionalPageCurrentlyActive(promo);

              return (
                <div
                  key={promo.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top pill bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                          {promo.basisType.replace('_', ' ')}
                        </span>
                        {promo.basisValue && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {promo.basisValue}
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCurrentlyLive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : promo.isActive
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-300'
                        }`}
                      >
                        {isCurrentlyLive ? 'Live Now' : promo.isActive ? 'Scheduled' : 'Deactivated'}
                      </span>
                    </div>

                    {/* Headline and Title */}
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                        {promo.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {promo.bannerHeadline}
                      </p>
                    </div>

                    {/* Banner Mini Preview */}
                    <div
                      className="rounded-xl p-3 text-white relative overflow-hidden flex items-center justify-between text-xs"
                      style={{ background: promo.bannerTheme || '#1e1b4b' }}
                    >
                      <div className="relative z-10 truncate pr-2">
                        <span className="text-[10px] uppercase font-bold text-amber-300 block">
                          {promo.badgeText || 'PROMO'}
                        </span>
                        <span className="font-bold truncate block">{promo.bannerSubtext || promo.bannerHeadline}</span>
                      </div>
                      <span className="relative z-10 shrink-0 font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded">
                        /{promo.slug}
                      </span>
                    </div>

                    {/* Placement and Timing tags */}
                    <div className="space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          <strong>Schedule:</strong> {promo.scheduleType.replace('_', ' ')}
                          {promo.scheduleType === 'recurring_slot' && ` (${promo.slotStartTime} - ${promo.slotEndTime})`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          <strong>Homepage Spaces:</strong>{' '}
                          {promo.homepagePlacements.map((p) => (
                            <span key={p} className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded mr-1 font-bold text-[10px] uppercase">
                              {p}
                            </span>
                          ))}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        <strong>Product Rule:</strong>{' '}
                        {promo.productSelectionMode === 'manual'
                          ? `${promo.selectedProductIds.length} Handpicked Products`
                          : 'Dynamic Filter Matching'}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreviewPage(promo)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Page</span>
                    </button>

                    {isSuperAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const res = togglePromotionalPageStatus(promo.id);
                            if (res.success) showFeedback('success', res.message);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                            promo.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {promo.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(promo)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                          title="Edit promo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const res = deletePromotionalPage(promo.id);
                            if (res.success) showFeedback('success', res.message);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Delete promo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT PROMOTIONAL PAGE */}
      {/* ======================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingPromo ? `Edit: ${editingPromo.title}` : 'Create New Promotional Landing Page'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              {/* Basic Information */}
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  1. Campaign Identity &amp; Target Basis
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Page Title *</label>
                    <input
                      type="text"
                      value={titleForm}
                      onChange={(e) => setTitleForm(e.target.value)}
                      placeholder="e.g. Weekend Tech Flash Hours"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">URL Slug (e.g. /promo-deals)</label>
                    <input
                      type="text"
                      value={slugForm}
                      onChange={(e) => setSlugForm(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="weekend-flash-hours"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Campaign Basis *</label>
                    <select
                      value={basisTypeForm}
                      onChange={(e) => {
                        const newType = e.target.value as PromoBasisType;
                        setBasisTypeForm(newType);
                        if (newType === 'category') setBasisValueForm('smartphones');
                        else if (newType === 'brand') setBasisValueForm(availableBrands[0] || 'Xiaomi');
                        else if (newType === 'shop') setBasisValueForm(outlets[0]?.id || 'out_hazratganj');
                        else if (newType === 'day_slot') setBasisValueForm('Saturday & Sunday 12-22');
                        else if (newType === 'month_end') setBasisValueForm('Month-End Payday');
                        else if (newType === 'month_start') setBasisValueForm('Salary Day Rush');
                        else setBasisValueForm('Festival Special');
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold capitalize"
                    >
                      <option value="category">Category-Based</option>
                      <option value="brand">Brand-Based (Spotlight)</option>
                      <option value="shop">Shop / Outlet Specific</option>
                      <option value="festival">Festival / Occasion</option>
                      <option value="day_slot">Day &amp; Time Slot Based</option>
                      <option value="month_end">Month-End Sale</option>
                      <option value="month_start">Month-Start (Salary Rush)</option>
                      <option value="sale">Special Clearance Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Target {basisTypeForm.replace('_', ' ').toUpperCase()} Value
                    </label>
                    {basisTypeForm === 'category' ? (
                      <select
                        value={basisValueForm}
                        onChange={(e) => setBasisValueForm(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : basisTypeForm === 'brand' ? (
                      <select
                        value={basisValueForm}
                        onChange={(e) => setBasisValueForm(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                      >
                        {availableBrands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    ) : basisTypeForm === 'shop' ? (
                      <select
                        value={basisValueForm}
                        onChange={(e) => setBasisValueForm(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                      >
                        {outlets.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.city})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={basisValueForm}
                        onChange={(e) => setBasisValueForm(e.target.value)}
                        placeholder="e.g. Diwali Super Deal, 4 PM-8 PM Slot"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Timing & Schedule Setting */}
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>2. Schedule &amp; Timing Rules</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isActiveForm}
                      onChange={(e) => setIsActiveForm(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Active Now</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Schedule Mode *</label>
                    <select
                      value={scheduleTypeForm}
                      onChange={(e) => setScheduleTypeForm(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="always_active">Always Active</option>
                      <option value="date_range">Specific Date Range</option>
                      <option value="recurring_slot">Recurring Day &amp; Time Slot</option>
                      <option value="month_end">Month-End Automated Window</option>
                      <option value="month_start">Month-Start Automated Window</option>
                    </select>
                  </div>

                  {scheduleTypeForm === 'recurring_slot' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Start Time</label>
                        <input
                          type="time"
                          value={slotStartTimeForm}
                          onChange={(e) => setSlotStartTimeForm(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">End Time</label>
                        <input
                          type="time"
                          value={slotEndTimeForm}
                          onChange={(e) => setSlotEndTimeForm(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {scheduleTypeForm === 'date_range' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={startDateForm}
                          onChange={(e) => setStartDateForm(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">End Date</label>
                        <input
                          type="date"
                          value={endDateForm}
                          onChange={(e) => setEndDateForm(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {scheduleTypeForm === 'month_end' && (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Trigger Days Before Month End</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={monthEndDaysForm}
                        onChange={(e) => setMonthEndDaysForm(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  )}

                  {scheduleTypeForm === 'month_start' && (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">First Days of Month Window</label>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={monthStartDaysForm}
                        onChange={(e) => setMonthStartDaysForm(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Visuals & Promotional Text */}
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  3. Promotional Banner &amp; Visual Theme
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Banner Image URL *</label>
                    <input
                      type="url"
                      value={bannerImageUrlForm}
                      onChange={(e) => setBannerImageUrlForm(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Banner Badge Text</label>
                    <input
                      type="text"
                      value={badgeTextForm}
                      onChange={(e) => setBadgeTextForm(e.target.value.toUpperCase())}
                      placeholder="e.g. FLASH SALE, PAYDAY SPECIAL"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold uppercase"
                    />
                  </div>
                </div>

                {/* Preset Banner Selector */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Quick Preset Banner Themes:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_BANNERS.map((pre) => (
                      <button
                        key={pre.label}
                        type="button"
                        onClick={() => {
                          setBannerImageUrlForm(pre.url);
                          setBannerThemeForm(pre.theme);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-2xs cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ background: pre.theme }}
                      >
                        {pre.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Banner Main Headline *</label>
                  <input
                    type="text"
                    value={bannerHeadlineForm}
                    onChange={(e) => setBannerHeadlineForm(e.target.value)}
                    placeholder="e.g. ⚡ 4-Hour Weekend Tech Flash — Up to 45% Off"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Banner Supporting Subtext</label>
                  <input
                    type="text"
                    value={bannerSubtextForm}
                    onChange={(e) => setBannerSubtextForm(e.target.value)}
                    placeholder="e.g. Genuine brand warranty, 0% EMI and free 60-min delivery."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Promotional Text Marquee / Announcement</label>
                  <input
                    type="text"
                    value={tickerTextForm}
                    onChange={(e) => setTickerTextForm(e.target.value)}
                    placeholder="Running announcement text banner shown on promo page..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Homepage Spaces Linkage */}
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  4. Homepage Spaces &amp; Redirect Linkage
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">
                    Select Homepage Display Positions:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['top', 'middle', 'bottom'] as const).map((pos) => {
                      const isChecked = homepagePlacementsForm.includes(pos);
                      return (
                        <label
                          key={pos}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-purple-50 border-purple-500 text-purple-900'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePlacement(pos)}
                            className="hidden"
                          />
                          <span className="uppercase block">{pos} Space</span>
                          <span className="text-[10px] opacity-75 font-normal block">
                            {pos === 'top' ? 'Top Marquee' : pos === 'middle' ? 'Mid Page Cards' : 'Bottom Showcase'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Teaser Icon</label>
                    <select
                      value={placementIconForm}
                      onChange={(e) => setPlacementIconForm(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="Sparkles">Sparkles ✨</option>
                      <option value="Zap">Zap ⚡</option>
                      <option value="Flame">Flame 🔥</option>
                      <option value="Gift">Gift 🎁</option>
                      <option value="Clock">Clock ⏰</option>
                      <option value="Tag">Tag 🏷️</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Teaser Text on Homepage</label>
                    <input
                      type="text"
                      value={placementTextForm}
                      onChange={(e) => setPlacementTextForm(e.target.value)}
                      placeholder="e.g. Flash Deals Live! Click to explore"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Product Selection Mode */}
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>5. Selected Product Visibility</span>
                  <span className="text-[10px] text-purple-700 font-bold font-mono">
                    {selectedProductIdsForm.length} Products Handpicked
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearchInModal}
                      onChange={(e) => setProductSearchInModal(e.target.value)}
                      placeholder="Search catalogue to select products..."
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedProductIdsForm.length === products.length) {
                        setSelectedProductIdsForm([]);
                      } else {
                        setSelectedProductIdsForm(products.map((p) => p.id));
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-[11px] font-bold text-slate-800 cursor-pointer"
                  >
                    {selectedProductIdsForm.length === products.length ? 'Clear All' : 'Select All'}
                  </button>
                </div>

                {/* Product checkboxes list */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl bg-white p-2">
                  {modalProducts.map((p) => {
                    const isChecked = selectedProductIdsForm.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-purple-50/70 border-purple-300 text-purple-950 font-bold'
                            : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProductIdSelection(p.id)}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({p.brand})</span>
                        </div>
                        <span className="font-mono font-bold shrink-0 ml-2">
                          {formatINR(p.dealPrice || p.regularPrice)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs"
                >
                  {editingPromo ? 'Update Promotion' : 'Publish Promotional Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
