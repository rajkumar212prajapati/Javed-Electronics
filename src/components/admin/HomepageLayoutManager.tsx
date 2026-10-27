import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  HomepageSectionType,
  HomepageSection,
  BrandBaseItem,
  PriceSlabItem,
  ComboBundleItem,
  BankOfferItem,
  ActivityItem,
} from '../../types';
import {
  LayoutTemplate,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  Flame,
  Layers,
  Tag,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  CreditCard,
  Activity,
  Heart,
  Save,
  Gift,
  Clock,
  Percent,
} from 'lucide-react';
import { formatINR } from '../../utils/currency';

export const HomepageLayoutManager: React.FC = () => {
  const {
    homepageSettings,
    updateHomepageSettings,
    updateHomepageSection,
    reorderHomepageSection,
    resetHomepageSettings,
    products,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<
    | 'sections_order'
    | 'festive'
    | 'sale'
    | 'category'
    | 'price_slabs'
    | 'brands'
    | 'combos'
    | 'offers'
    | 'activities'
    | 'likes'
  >('sections_order');

  const [savedNotification, setSavedNotification] = useState(false);

  // Quick helper to show save feedback
  const triggerSaveNotification = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  // Section sorted by order
  const sortedSections = [...homepageSettings.sections].sort((a, b) => a.order - b.order);

  // New combo state
  const [showAddCombo, setShowAddCombo] = useState(false);
  const [newComboTitle, setNewComboTitle] = useState('');
  const [newComboTagline, setNewComboTagline] = useState('');
  const [newComboBadge, setNewComboBadge] = useState('MEGA BUNDLE');
  const [newComboProd1, setNewComboProd1] = useState(products[0]?.id || '');
  const [newComboProd2, setNewComboProd2] = useState(products[1]?.id || '');
  const [newComboPrice, setNewComboPrice] = useState(0);

  // New price slab state
  const [showAddSlab, setShowAddSlab] = useState(false);
  const [newSlabLabel, setNewSlabLabel] = useState('');
  const [newSlabMax, setNewSlabMax] = useState(999);
  const [newSlabMin, setNewSlabMin] = useState(0);
  const [newSlabBadge, setNewSlabBadge] = useState('SPECIAL');
  const [newSlabTagline, setNewSlabTagline] = useState('');

  // New bank offer state
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newCardType, setNewCardType] = useState('Credit & Debit Cards');
  const [newDiscountText, setNewDiscountText] = useState('10% Instant Discount up to ₹1,000');
  const [newOfferCode, setNewOfferCode] = useState('');
  const [newOfferMinSpend, setNewOfferMinSpend] = useState(2999);
  const [newOfferTerms, setNewOfferTerms] = useState('Applicable on all eligible card transactions.');

  // New Brand state
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandTagline, setNewBrandTagline] = useState('');
  const [newBrandDiscount, setNewBrandDiscount] = useState('Up to 30% Off');
  const [newBrandBadge, setNewBrandBadge] = useState('PARTNER');

  // Handle combo submit
  const handleCreateCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComboTitle || !newComboProd1 || !newComboProd2) return;

    const p1 = products.find((p) => p.id === newComboProd1);
    const p2 = products.find((p) => p.id === newComboProd2);
    const regTotal = (p1?.dealPrice || p1?.regularPrice || 0) + (p2?.dealPrice || p2?.regularPrice || 0);
    const finalPrice = newComboPrice > 0 ? newComboPrice : Math.round(regTotal * 0.85);
    const savings = Math.max(0, regTotal - finalPrice);

    const newCombo: ComboBundleItem = {
      id: `combo-${Date.now()}`,
      title: newComboTitle,
      badge: newComboBadge,
      productIds: [newComboProd1, newComboProd2],
      productNames: [p1?.name || '', p2?.name || ''],
      regularTotal: regTotal,
      comboPrice: finalPrice,
      savings,
      tagline: newComboTagline || 'Exclusive bundle offer',
      description: `Includes ${p1?.name} and ${p2?.name}`,
      isPopular: true,
      isActive: true,
    };

    updateHomepageSettings({
      comboBundles: [newCombo, ...homepageSettings.comboBundles],
    });

    setShowAddCombo(false);
    setNewComboTitle('');
    setNewComboTagline('');
    setNewComboPrice(0);
    triggerSaveNotification();
  };

  // Handle slab submit
  const handleCreateSlab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlabLabel) return;

    const newSlab: PriceSlabItem = {
      id: `slab-${Date.now()}`,
      label: newSlabLabel,
      minPrice: Number(newSlabMin),
      maxPrice: Number(newSlabMax),
      badge: newSlabBadge,
      tagline: newSlabTagline || 'Pocket friendly tech accessories',
      isActive: true,
    };

    updateHomepageSettings({
      priceSlabs: [...homepageSettings.priceSlabs, newSlab],
    });

    setShowAddSlab(false);
    setNewSlabLabel('');
    setNewSlabTagline('');
    triggerSaveNotification();
  };

  // Handle offer submit
  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || !newDiscountText) return;

    const newOffer: BankOfferItem = {
      id: `offer-${Date.now()}`,
      bankName: newBankName,
      cardType: newCardType,
      discountText: newDiscountText,
      code: newOfferCode ? newOfferCode.toUpperCase() : undefined,
      minSpend: Number(newOfferMinSpend),
      badge: 'BANK OFFER',
      terms: newOfferTerms,
      bgColorClass: 'from-blue-900 to-indigo-950 text-white',
      isActive: true,
    };

    updateHomepageSettings({
      bankOffers: [newOffer, ...homepageSettings.bankOffers],
    });

    setShowAddOffer(false);
    setNewBankName('');
    setNewDiscountText('');
    setNewOfferCode('');
    triggerSaveNotification();
  };

  // Handle brand submit
  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;

    const newBrand: BrandBaseItem = {
      id: `brand-${Date.now()}`,
      name: newBrandName,
      tagline: newBrandTagline || 'Official products with brand warranty',
      discountTag: newBrandDiscount,
      badge: newBrandBadge,
      productCount: products.filter((p) => p.brand.toLowerCase() === newBrandName.toLowerCase()).length || 2,
      isActive: true,
    };

    updateHomepageSettings({
      brands: [...homepageSettings.brands, newBrand],
    });

    setShowAddBrand(false);
    setNewBrandName('');
    setNewBrandTagline('');
    triggerSaveNotification();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Feedback */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-blue-800/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white px-2.5 py-0.5 rounded">
              HOMEPAGE ARCHITECT & CMS
            </span>
            <span className="text-xs text-blue-200">
              100% Admin Configurable
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight text-white">
            Customise All 9 Homepage Sections & Layout
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Reorder sections, toggle visibility, customize festive campaigns, flash sales, budget slabs, companion combos, and bank offers with instant live reflection on the storefront.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {savedNotification && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-lg animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              Saved & Live!
            </span>
          )}

          <button
            onClick={() => {
              resetHomepageSettings();
              triggerSaveNotification();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'sections_order', label: '1. Master Order & Visibility', icon: <LayoutTemplate className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'festive', label: '2. Festive Base', icon: <Sparkles className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'sale', label: '3. Sale Base & Flash Timer', icon: <Flame className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'category', label: '4. Category Based', icon: <Layers className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'price_slabs', label: '5. Price Sale Base', icon: <Tag className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'brands', label: '6. Brand Base', icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'combos', label: '7. Combo Base', icon: <Plus className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'offers', label: '8. Offer Base', icon: <CreditCard className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'activities', label: '9. Activity Based', icon: <Activity className="w-3.5 h-3.5 shrink-0" /> },
          { id: 'likes', label: '10. Like Based', icon: <Heart className="w-3.5 h-3.5 shrink-0" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
              activeSubTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUBTAB 1: MASTER SECTIONS ORDER & VISIBILITY */}
      {activeSubTab === 'sections_order' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Homepage Layout Sequence & Visibility
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Use the Up / Down arrows to change the vertical display order on the storefront. Toggle the eye button to show or hide any section completely.
            </p>

            <div className="space-y-2.5">
              {sortedSections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    sec.isEnabled
                      ? 'bg-white border-slate-200 shadow-xs'
                      : 'bg-slate-50 border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                    {/* Position index badge */}
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{sec.order}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900">
                          {sec.title}
                        </span>
                        {sec.badge && (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded uppercase">
                            {sec.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          (id: {sec.id})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {sec.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Move Up / Down, Toggle Enable */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={() => {
                        reorderHomepageSection(sec.id, 'up');
                        triggerSaveNotification();
                      }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={idx === sortedSections.length - 1}
                      onClick={() => {
                        reorderHomepageSection(sec.id, 'down');
                        triggerSaveNotification();
                      }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        updateHomepageSection(sec.id, { isEnabled: !sec.isEnabled });
                        triggerSaveNotification();
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        sec.isEnabled
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {sec.isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{sec.isEnabled ? 'Active' : 'Hidden'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: FESTIVE BASE CONFIG */}
      {activeSubTab === 'festive' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Festive Dhamaka & Festival Campaign Settings
              </h3>
              <p className="text-xs text-slate-500">
                Change festival theme, headline, coupon discount and gift packaging.
              </p>
            </div>
            <button
              onClick={() => {
                triggerSaveNotification();
              }}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Active Festival Theme Style
              </label>
              <select
                value={homepageSettings.festiveConfig.themeStyle}
                onChange={(e) => {
                  updateHomepageSettings({
                    festiveConfig: {
                      ...homepageSettings.festiveConfig,
                      themeStyle: e.target.value as any,
                    },
                  });
                  triggerSaveNotification();
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="diwali">Diwali (Golden / Deep Maroon / Diya Glow)</option>
                <option value="eid">Eid Mubarak (Emerald Green / Gold / Crescent)</option>
                <option value="holi">Holi Color Fest (Vibrant Pink / Orange / Cyan)</option>
                <option value="navratri">Navratri Dhamaka (Fiery Red / Saffron / Gold)</option>
                <option value="new_year">New Year Grand Sale (Electric Sky Blue / Midnight)</option>
                <option value="royal_gold">Royal Gold Luxe (Universal Festive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Section Badge Label
              </label>
              <input
                type="text"
                value={homepageSettings.festiveConfig.badge}
                onChange={(e) => {
                  updateHomepageSettings({
                    festiveConfig: { ...homepageSettings.festiveConfig, badge: e.target.value },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Banner Headline
              </label>
              <input
                type="text"
                value={homepageSettings.festiveConfig.bannerHeadline}
                onChange={(e) => {
                  updateHomepageSettings({
                    festiveConfig: { ...homepageSettings.festiveConfig, bannerHeadline: e.target.value },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Banner Subtext
              </label>
              <textarea
                rows={2}
                value={homepageSettings.festiveConfig.bannerSubtext}
                onChange={(e) => {
                  updateHomepageSettings({
                    festiveConfig: { ...homepageSettings.festiveConfig, bannerSubtext: e.target.value },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Festive Coupon Code
              </label>
              <input
                type="text"
                value={homepageSettings.festiveConfig.couponCode || ''}
                onChange={(e) => {
                  updateHomepageSettings({
                    festiveConfig: { ...homepageSettings.festiveConfig, couponCode: e.target.value.toUpperCase() },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discount %
                </label>
                <input
                  type="number"
                  value={homepageSettings.festiveConfig.discountPercentage}
                  onChange={(e) => {
                    updateHomepageSettings({
                      festiveConfig: { ...homepageSettings.festiveConfig, discountPercentage: Number(e.target.value) },
                    });
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Min Spend (₹)
                </label>
                <input
                  type="number"
                  value={homepageSettings.festiveConfig.minSpend}
                  onChange={(e) => {
                    updateHomepageSettings({
                      festiveConfig: { ...homepageSettings.festiveConfig, minSpend: Number(e.target.value) },
                    });
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  Enable Complimentary Gift Packaging
                </span>
                <span className="text-[11px] text-amber-700">
                  Adds gift box checkbox to festive section for shoppers.
                </span>
              </div>
              <input
                type="checkbox"
                checked={homepageSettings.festiveConfig.giftPackagingAvailable}
                onChange={(e) => {
                  updateHomepageSettings({
                    festiveConfig: {
                      ...homepageSettings.festiveConfig,
                      giftPackagingAvailable: e.target.checked,
                    },
                  });
                  triggerSaveNotification();
                }}
                className="w-5 h-5 text-amber-600 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SALE BASE CONFIG */}
      {activeSubTab === 'sale' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Flash Sale & Countdown Timer Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure deal urgency headline, live countdown clock, and discount taglines.
              </p>
            </div>
            <button
              onClick={() => triggerSaveNotification()}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sale Headline
              </label>
              <input
                type="text"
                value={homepageSettings.saleConfig.headline}
                onChange={(e) => {
                  updateHomepageSettings({
                    saleConfig: { ...homepageSettings.saleConfig, headline: e.target.value },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Discount Tagline
              </label>
              <input
                type="text"
                value={homepageSettings.saleConfig.discountBadgeText}
                onChange={(e) => {
                  updateHomepageSettings({
                    saleConfig: { ...homepageSettings.saleConfig, discountBadgeText: e.target.value },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Urgency Ticker Text
              </label>
              <input
                type="text"
                value={homepageSettings.saleConfig.urgencyBannerText}
                onChange={(e) => {
                  updateHomepageSettings({
                    saleConfig: { ...homepageSettings.saleConfig, urgencyBannerText: e.target.value },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quick Extend Countdown Timer
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: '+6 Hours', ms: 1000 * 60 * 60 * 6 },
                  { label: '+12 Hours', ms: 1000 * 60 * 60 * 12 },
                  { label: '+24 Hours', ms: 1000 * 60 * 60 * 24 },
                  { label: '+3 Days', ms: 1000 * 60 * 60 * 72 },
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      updateHomepageSettings({
                        saleConfig: {
                          ...homepageSettings.saleConfig,
                          endTime: new Date(Date.now() + preset.ms).toISOString(),
                        },
                      });
                      triggerSaveNotification();
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
                <span className="text-xs text-slate-400 ml-2">
                  Current end: {new Date(homepageSettings.saleConfig.endTime).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: CATEGORY BASED CONFIG */}
      {activeSubTab === 'category' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Visual Category Cards Customizer
              </h3>
              <p className="text-xs text-slate-500">
                Edit display names, starting prices (e.g. Starting ₹299), and badges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {homepageSettings.categoryItems.map((cat, idx) => (
              <div key={cat.categoryId} className="p-3 border rounded-xl bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {cat.displayName}
                  </span>
                  <input
                    type="checkbox"
                    checked={cat.isActive}
                    onChange={(e) => {
                      const updated = [...homepageSettings.categoryItems];
                      updated[idx].isActive = e.target.checked;
                      updateHomepageSettings({ categoryItems: updated });
                      triggerSaveNotification();
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">
                      Starting Price (₹)
                    </label>
                    <input
                      type="number"
                      value={cat.startingPrice}
                      onChange={(e) => {
                        const updated = [...homepageSettings.categoryItems];
                        updated[idx].startingPrice = Number(e.target.value);
                        updateHomepageSettings({ categoryItems: updated });
                      }}
                      className="w-full text-xs p-1.5 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">
                      Card Badge
                    </label>
                    <input
                      type="text"
                      value={cat.badge || ''}
                      onChange={(e) => {
                        const updated = [...homepageSettings.categoryItems];
                        updated[idx].badge = e.target.value;
                        updateHomepageSettings({ categoryItems: updated });
                      }}
                      className="w-full text-xs p-1.5 border rounded bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={cat.tagline || ''}
                    onChange={(e) => {
                      const updated = [...homepageSettings.categoryItems];
                      updated[idx].tagline = e.target.value;
                      updateHomepageSettings({ categoryItems: updated });
                    }}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: PRICE SLABS CONFIG */}
      {activeSubTab === 'price_slabs' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Budget Corner Price Slabs
              </h3>
              <p className="text-xs text-slate-500">
                Configure price filter shelves (e.g. Under ₹499, Under ₹999, Under ₹1,999).
              </p>
            </div>
            <button
              onClick={() => setShowAddSlab(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Price Slab</span>
            </button>
          </div>

          {/* Add Slab Modal */}
          {showAddSlab && (
            <form onSubmit={handleCreateSlab} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-950 uppercase">
                Create New Budget Slab
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Slab Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Under ₹149"
                    value={newSlabLabel}
                    onChange={(e) => setNewSlabLabel(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Max Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newSlabMax}
                    onChange={(e) => setNewSlabMax(Number(e.target.value))}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Badge</label>
                  <input
                    type="text"
                    value={newSlabBadge}
                    onChange={(e) => setNewSlabBadge(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Tagline</label>
                  <input
                    type="text"
                    placeholder="Short description"
                    value={newSlabTagline}
                    onChange={(e) => setNewSlabTagline(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlab(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs bg-emerald-600 text-white font-bold rounded"
                >
                  Save Slab
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {homepageSettings.priceSlabs.map((slab, sIdx) => (
              <div key={slab.id} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                    ₹
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 mr-2">
                      {slab.label}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                      {slab.badge}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Max Price: {formatINR(slab.maxPrice)} • {slab.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated = [...homepageSettings.priceSlabs];
                      updated[sIdx].isActive = !updated[sIdx].isActive;
                      updateHomepageSettings({ priceSlabs: updated });
                      triggerSaveNotification();
                    }}
                    className={`text-xs px-2.5 py-1 rounded font-semibold ${
                      slab.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {slab.isActive ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => {
                      const updated = homepageSettings.priceSlabs.filter((s) => s.id !== slab.id);
                      updateHomepageSettings({ priceSlabs: updated });
                      triggerSaveNotification();
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 6: BRANDS CONFIG */}
      {activeSubTab === 'brands' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Brand Base & Top Brands Shelf
              </h3>
              <p className="text-xs text-slate-500">
                Add official brand partners, custom discount taglines, and badges.
              </p>
            </div>
            <button
              onClick={() => setShowAddBrand(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Brand</span>
            </button>
          </div>

          {/* Add Brand Form */}
          {showAddBrand && (
            <form onSubmit={handleCreateBrand} className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-950 uppercase">Add Featured Brand</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Discount Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Min 30% Off"
                    value={newBrandDiscount}
                    onChange={(e) => setNewBrandDiscount(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Badge</label>
                  <input
                    type="text"
                    value={newBrandBadge}
                    onChange={(e) => setNewBrandBadge(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Tagline</label>
                  <input
                    type="text"
                    value={newBrandTagline}
                    onChange={(e) => setNewBrandTagline(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBrand(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs bg-indigo-600 text-white font-bold rounded"
                >
                  Save Brand
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {homepageSettings.brands.map((brand, bIdx) => (
              <div key={brand.id} className="p-3 border rounded-xl bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-black text-slate-900">
                      {brand.name}
                    </span>
                    <input
                      type="checkbox"
                      checked={brand.isActive}
                      onChange={(e) => {
                        const updated = [...homepageSettings.brands];
                        updated[bIdx].isActive = e.target.checked;
                        updateHomepageSettings({ brands: updated });
                        triggerSaveNotification();
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 block">
                    {brand.discountTag}
                  </span>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                    {brand.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Badge: {brand.badge}</span>
                  <button
                    onClick={() => {
                      const updated = homepageSettings.brands.filter((b) => b.id !== brand.id);
                      updateHomepageSettings({ brands: updated });
                      triggerSaveNotification();
                    }}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 7: COMBOS CONFIG */}
      {activeSubTab === 'combos' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Combo Base & Value Bundles Manager
              </h3>
              <p className="text-xs text-slate-500">
                Curate bundled sets of companion gadgets with combined bundle pricing.
              </p>
            </div>
            <button
              onClick={() => setShowAddCombo(true)}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Combo Bundle</span>
            </button>
          </div>

          {/* Add Combo Form */}
          {showAddCombo && (
            <form onSubmit={handleCreateCombo} className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-purple-950 uppercase">Create New Bundle Deal</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Combo Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phone + Fast GaN Charger Bundle"
                    value={newComboTitle}
                    onChange={(e) => setNewComboTitle(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Badge Tag</label>
                  <input
                    type="text"
                    value={newComboBadge}
                    onChange={(e) => setNewComboBadge(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Product #1</label>
                  <select
                    value={newComboProd1}
                    onChange={(e) => setNewComboProd1(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatINR(p.dealPrice || p.regularPrice)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Product #2</label>
                  <select
                    value={newComboProd2}
                    onChange={(e) => setNewComboProd2(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatINR(p.dealPrice || p.regularPrice)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">
                    Special Combo Price (₹) (Leave 0 for automatic 15% discount)
                  </label>
                  <input
                    type="number"
                    value={newComboPrice}
                    onChange={(e) => setNewComboPrice(Number(e.target.value))}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Tagline</label>
                  <input
                    type="text"
                    placeholder="Short marketing pitch"
                    value={newComboTagline}
                    onChange={(e) => setNewComboTagline(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCombo(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs bg-purple-600 text-white font-bold rounded"
                >
                  Save Combo
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {homepageSettings.comboBundles.map((bundle, cIdx) => (
              <div key={bundle.id} className="p-3.5 border rounded-xl bg-slate-50 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      {bundle.title}
                    </span>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                      {bundle.badge}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      Saves {formatINR(bundle.savings)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {bundle.productNames?.join(' + ')}
                  </p>
                  <div className="text-xs font-mono font-bold text-purple-700 mt-1">
                    Combo Price: {formatINR(bundle.comboPrice)}{' '}
                    <span className="text-slate-400 line-through text-[10px]">
                      {formatINR(bundle.regularTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated = [...homepageSettings.comboBundles];
                      updated[cIdx].isActive = !updated[cIdx].isActive;
                      updateHomepageSettings({ comboBundles: updated });
                      triggerSaveNotification();
                    }}
                    className={`text-xs px-2.5 py-1 rounded font-semibold ${
                      bundle.isActive ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {bundle.isActive ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => {
                      const updated = homepageSettings.comboBundles.filter((b) => b.id !== bundle.id);
                      updateHomepageSettings({ comboBundles: updated });
                      triggerSaveNotification();
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 8: OFFERS CONFIG */}
      {activeSubTab === 'offers' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bank Offers, Cashbacks & Promo Cards
              </h3>
              <p className="text-xs text-slate-500">
                Manage instant bank discounts, UPI rewards, and promo cards.
              </p>
            </div>
            <button
              onClick={() => setShowAddOffer(true)}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bank Offer</span>
            </button>
          </div>

          {/* Add Offer Form */}
          {showAddOffer && (
            <form onSubmit={handleCreateOffer} className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-amber-950 uppercase">Create New Bank Offer</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Bank / Provider</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Axis Bank"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Card Type</label>
                  <input
                    type="text"
                    value={newCardType}
                    onChange={(e) => setNewCardType(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Discount Text</label>
                  <input
                    type="text"
                    required
                    placeholder="10% Instant Discount up to ₹1,000"
                    value={newDiscountText}
                    onChange={(e) => setNewDiscountText(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="AXIS1000"
                    value={newOfferCode}
                    onChange={(e) => setNewOfferCode(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Min Spend (₹)</label>
                  <input
                    type="number"
                    value={newOfferMinSpend}
                    onChange={(e) => setNewOfferMinSpend(Number(e.target.value))}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block">Terms</label>
                  <input
                    type="text"
                    value={newOfferTerms}
                    onChange={(e) => setNewOfferTerms(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOffer(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs bg-amber-600 text-white font-bold rounded"
                >
                  Save Offer
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {homepageSettings.bankOffers.map((offer, oIdx) => (
              <div key={offer.id} className="p-3.5 border rounded-xl bg-slate-50 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{offer.bankName}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                      {offer.cardType}
                    </span>
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">
                    {offer.discountText}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Code: <strong>{offer.code || 'Auto-applied'}</strong> • Min Spend: {formatINR(offer.minSpend)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated = [...homepageSettings.bankOffers];
                      updated[oIdx].isActive = !updated[oIdx].isActive;
                      updateHomepageSettings({ bankOffers: updated });
                      triggerSaveNotification();
                    }}
                    className={`text-xs px-2.5 py-1 rounded font-semibold ${
                      offer.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {offer.isActive ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => {
                      const updated = homepageSettings.bankOffers.filter((o) => o.id !== offer.id);
                      updateHomepageSettings({ bankOffers: updated });
                      triggerSaveNotification();
                    }}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 9: ACTIVITIES CONFIG */}
      {activeSubTab === 'activities' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Activity Based & Lifestyle Categories
              </h3>
              <p className="text-xs text-slate-500">
                Configure activity categories (Workout, Office, Gaming, Cinema, Travel).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {homepageSettings.activities.map((act, aIdx) => (
              <div key={act.id} className="p-3.5 border rounded-xl bg-slate-50 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">{act.name}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                      {act.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{act.tagline}</p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Filter Category: <strong>{act.categoryFilter || 'All'}</strong> • Keywords: {act.keywords?.join(', ')}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const updated = [...homepageSettings.activities];
                    updated[aIdx].isActive = !updated[aIdx].isActive;
                    updateHomepageSettings({ activities: updated });
                    triggerSaveNotification();
                  }}
                  className={`text-xs px-2.5 py-1 rounded font-semibold ${
                    act.isActive ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {act.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 10: LIKES CONFIG */}
      {activeSubTab === 'likes' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Like Based & Customer Favorites Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure minimum star rating threshold, customer quotes, and social proof.
              </p>
            </div>
            <button
              onClick={() => triggerSaveNotification()}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Section Headline
              </label>
              <input
                type="text"
                value={homepageSettings.likeConfig.headline}
                onChange={(e) => {
                  updateHomepageSettings({
                    likeConfig: { ...homepageSettings.likeConfig, headline: e.target.value },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Rating Threshold (Stars)
              </label>
              <input
                type="number"
                step="0.1"
                min="3.0"
                max="5.0"
                value={homepageSettings.likeConfig.minRating}
                onChange={(e) => {
                  updateHomepageSettings({
                    likeConfig: { ...homepageSettings.likeConfig, minRating: Number(e.target.value) },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subtext
              </label>
              <input
                type="text"
                value={homepageSettings.likeConfig.subtext}
                onChange={(e) => {
                  updateHomepageSettings({
                    likeConfig: { ...homepageSettings.likeConfig, subtext: e.target.value },
                  });
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
