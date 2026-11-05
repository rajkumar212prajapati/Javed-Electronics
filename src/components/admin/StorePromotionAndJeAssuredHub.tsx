import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Product,
  PromotionType,
  PromotionSlot,
  StoreSlotProductBanner,
} from '../../types';
import { formatINR } from '../../utils/currency';
import {
  ShieldCheck,
  Sparkles,
  Flame,
  Calendar,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Link,
  Edit3,
  Trash2,
  Plus,
  Search,
  Check,
  X,
  Tag,
  ArrowRight,
  ExternalLink,
  Zap,
  Layers,
  SlidersHorizontal,
  Eye,
  Maximize2,
  Minimize2,
  ArrowLeft,
} from 'lucide-react';

export interface StorePromotionAndJeAssuredHubProps {
  initialSubView?: 'slots_participation' | 'my_banners' | 'admin_governance' | 'je_assured_sop';
  initialOpenRequestModal?: boolean;
  preselectedProductId?: string | null;
  onClearPreselectedProduct?: () => void;
  externalShowModal?: boolean;
  onCloseExternalModal?: () => void;
}

const PRESET_BANNER_TEMPLATES = [
  {
    name: 'Festive Audio Mega Banner',
    url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Smartphones Flagship Banner',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'GaN Fast Chargers Banner',
    url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Smartwatches AMOLED Banner',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
  },
];

export const StorePromotionAndJeAssuredHub: React.FC<StorePromotionAndJeAssuredHubProps> = ({
  initialSubView,
  initialOpenRequestModal = false,
  preselectedProductId,
  onClearPreselectedProduct,
  externalShowModal,
  onCloseExternalModal,
}) => {
  const {
    products,
    currentRole,
    currentUser,
    outlets,
    activeOutletId,
    promotionTypes,
    createPromotionType,
    updatePromotionType,
    deletePromotionType,
    promotionSlots,
    createPromotionSlot,
    updatePromotionSlot,
    deletePromotionSlot,
    storeSlotProductBanners,
    addStoreSlotBanner,
    updateStoreSlotBanner,
    deleteStoreSlotBanner,
    setSelectedProductForDetail,
    setActiveModal,
  } = useStore();

  const isSuperAdmin = currentRole === 'super_admin';
  const currentOutlet = outlets.find((o) => o.id === activeOutletId) || outlets[0];

  // Active navigation sub-view
  const [activeSubView, setActiveSubView] = useState<'slots_participation' | 'my_banners' | 'admin_governance' | 'je_assured_sop'>(
    initialSubView || 'slots_participation'
  );

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Filter scoped banners for current store
  const scopedBanners = useMemo(() => {
    if (isSuperAdmin) return storeSlotProductBanners;
    return storeSlotProductBanners.filter(
      (b) => !currentUser.storeId || b.storeId === currentUser.storeId || b.storeId === currentOutlet?.id
    );
  }, [storeSlotProductBanners, isSuperAdmin, currentUser.storeId, currentOutlet?.id]);

  // ============================================================================
  // STORE: ONE-BY-ONE PARTICIPATION & BANNER UPLOAD MODAL (Add & Edit)
  // ============================================================================
  const [showBannerModal, setShowBannerModal] = useState<boolean>(initialOpenRequestModal);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [isModalFullscreen, setIsModalFullscreen] = useState<boolean>(true);

  useEffect(() => {
    if (externalShowModal !== undefined) {
      setShowBannerModal(externalShowModal);
    }
  }, [externalShowModal]);

  const [formSlotId, setFormSlotId] = useState<string>(promotionSlots[0]?.id || '');
  const [formProductId, setFormProductId] = useState<string>(preselectedProductId || products[0]?.id || '');
  const [formSalePrice, setFormSalePrice] = useState<number>(0);
  const [formBannerUrl, setFormBannerUrl] = useState<string>('');
  const [formHeadline, setFormHeadline] = useState<string>('');
  const [formSubheadline, setFormSubheadline] = useState<string>('');
  const [formCtaText, setFormCtaText] = useState<string>('Shop Deal');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Selected product helper
  const selectedProduct = products.find((p) => p.id === formProductId);
  const selectedSlot = promotionSlots.find((s) => s.id === formSlotId);

  // Sync default sale price when product changes
  useEffect(() => {
    if (selectedProduct && !editingBannerId) {
      setFormSalePrice(selectedProduct.dealPrice || Math.round(selectedProduct.regularPrice * 0.85));
      if (!formHeadline) {
        setFormHeadline(`Festive Spotlight — ${selectedProduct.name}`);
      }
      if (!formBannerUrl) {
        setFormBannerUrl(selectedProduct.images[0] || PRESET_BANNER_TEMPLATES[0].url);
      }
    }
  }, [selectedProduct, editingBannerId]);

  const handleOpenAddBanner = (slotId?: string) => {
    setEditingBannerId(null);
    setFormSlotId(slotId || promotionSlots[0]?.id || '');
    const firstProd = products[0];
    if (firstProd) {
      setFormProductId(firstProd.id);
      setFormSalePrice(firstProd.dealPrice || Math.round(firstProd.regularPrice * 0.85));
      setFormHeadline(`Festive Spotlight — ${firstProd.name}`);
      setFormBannerUrl(firstProd.images[0] || PRESET_BANNER_TEMPLATES[0].url);
    }
    setFormSubheadline('Fast Doorstep Dispatch in Lucknow with 1-Year Brand Warranty');
    setFormCtaText('Claim Deal');
    setShowBannerModal(true);
  };

  const handleOpenEditBanner = (item: StoreSlotProductBanner) => {
    setEditingBannerId(item.id);
    setFormSlotId(item.slotId);
    setFormProductId(item.productId);
    setFormSalePrice(item.salePrice);
    setFormBannerUrl(item.bannerImageUrl);
    setFormHeadline(item.headline);
    setFormSubheadline(item.subheadline || '');
    setFormCtaText(item.ctaText || 'Shop Deal');
    setShowBannerModal(true);
  };

  // Image File Upload Handler
  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Banner file size exceeds 2MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormBannerUrl(reader.result);
        showToast('success', 'Banner image uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedSlot) {
      showToast('error', 'Please select both a valid product and promotion slot.');
      return;
    }

    if (!formBannerUrl.trim()) {
      showToast('error', 'Please upload or provide a banner image URL.');
      return;
    }

    const discountPct = Math.round(
      ((selectedProduct.regularPrice - formSalePrice) / selectedProduct.regularPrice) * 100
    );

    if (editingBannerId) {
      // Edit existing
      updateStoreSlotBanner(editingBannerId, {
        slotId: selectedSlot.id,
        slotName: selectedSlot.slotName,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productSku: selectedProduct.sku,
        productImage: selectedProduct.images[0] || '',
        category: selectedProduct.categoryId,
        regularPrice: selectedProduct.regularPrice,
        mrp: selectedProduct.mrp,
        salePrice: Number(formSalePrice),
        discountPct: Math.max(1, discountPct),
        bannerImageUrl: formBannerUrl.trim(),
        headline: formHeadline.trim() || selectedProduct.name,
        subheadline: formSubheadline.trim(),
        ctaText: formCtaText.trim() || 'Shop Deal',
      });
      showToast('success', `Product banner for "${selectedProduct.name}" updated!`);
    } else {
      // Add new
      addStoreSlotBanner({
        slotId: selectedSlot.id,
        slotName: selectedSlot.slotName,
        storeId: currentOutlet.id,
        storeName: currentOutlet.name,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productSku: selectedProduct.sku,
        productImage: selectedProduct.images[0] || '',
        category: selectedProduct.categoryId,
        regularPrice: selectedProduct.regularPrice,
        mrp: selectedProduct.mrp,
        salePrice: Number(formSalePrice),
        discountPct: Math.max(1, discountPct),
        bannerImageUrl: formBannerUrl.trim(),
        headline: formHeadline.trim() || selectedProduct.name,
        subheadline: formSubheadline.trim(),
        ctaText: formCtaText.trim() || 'Shop Deal',
      });
      showToast('success', `🎉 Product "${selectedProduct.name}" linked with banner in "${selectedSlot.slotName}"!`);
    }

    setShowBannerModal(false);
    onCloseExternalModal?.();
    onClearPreselectedProduct?.();
  };

  const handleDeleteBanner = (bannerId: string, name: string) => {
    if (window.confirm(`Delete promotion banner for "${name}" from this slot?`)) {
      deleteStoreSlotBanner(bannerId);
      showToast('success', `Banner for "${name}" deleted.`);
    }
  };

  // ============================================================================
  // ADMIN: CREATE / EDIT PROMOTION TYPE MODAL
  // ============================================================================
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [typeColor, setTypeColor] = useState<'rose' | 'amber' | 'purple' | 'blue' | 'emerald' | 'indigo'>('rose');

  const handleOpenCreateType = () => {
    setEditingTypeId(null);
    setTypeName('');
    setTypeDesc('');
    setTypeColor('rose');
    setShowTypeModal(true);
  };

  const handleOpenEditType = (t: PromotionType) => {
    setEditingTypeId(t.id);
    setTypeName(t.name);
    setTypeDesc(t.description);
    setTypeColor(t.colorScheme);
    setShowTypeModal(true);
  };

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return;

    if (editingTypeId) {
      updatePromotionType(editingTypeId, {
        name: typeName.trim(),
        description: typeDesc.trim(),
        colorScheme: typeColor,
      });
      showToast('success', `Promotion type "${typeName}" updated!`);
    } else {
      createPromotionType({
        name: typeName.trim(),
        description: typeDesc.trim(),
        colorScheme: typeColor,
      });
      showToast('success', `Promotion type "${typeName}" created!`);
    }
    setShowTypeModal(false);
  };

  // ============================================================================
  // ADMIN: CREATE / EDIT PROMOTION SLOT MODAL
  // ============================================================================
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotName, setSlotName] = useState('');
  const [slotTypeId, setSlotTypeId] = useState(promotionTypes[0]?.id || '');
  const [slotPlacement, setSlotPlacement] = useState<'top' | 'middle' | 'bottom'>('top');
  const [slotStartTime, setSlotStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [slotEndTime, setSlotEndTime] = useState(new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 16));
  const [slotStatus, setSlotStatus] = useState<'active' | 'upcoming' | 'completed'>('active');
  const [slotMaxBanners, setSlotMaxBanners] = useState<number>(5);

  const handleOpenCreateSlot = () => {
    setEditingSlotId(null);
    setSlotName('');
    setSlotTypeId(promotionTypes[0]?.id || '');
    setSlotPlacement('top');
    setSlotStartTime(new Date().toISOString().slice(0, 16));
    setSlotEndTime(new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 16));
    setSlotStatus('active');
    setSlotMaxBanners(5);
    setShowSlotModal(true);
  };

  const handleOpenEditSlot = (slot: PromotionSlot) => {
    setEditingSlotId(slot.id);
    setSlotName(slot.slotName);
    setSlotTypeId(slot.promotionTypeId);
    setSlotPlacement(slot.placement);
    setSlotStartTime(new Date(slot.startTime).toISOString().slice(0, 16));
    setSlotEndTime(new Date(slot.endTime).toISOString().slice(0, 16));
    setSlotStatus(slot.status);
    setSlotMaxBanners(slot.maxBannersAllowed || 5);
    setShowSlotModal(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotName.trim()) return;

    const matchedType = promotionTypes.find((t) => t.id === slotTypeId) || promotionTypes[0];

    if (editingSlotId) {
      updatePromotionSlot(editingSlotId, {
        slotName: slotName.trim(),
        promotionTypeId: matchedType?.id || '',
        promotionTypeName: matchedType?.name || 'Promotion Sale',
        placement: slotPlacement,
        startTime: new Date(slotStartTime).toISOString(),
        endTime: new Date(slotEndTime).toISOString(),
        status: slotStatus,
        maxBannersAllowed: slotMaxBanners,
      });
      showToast('success', `Promotion slot "${slotName}" updated!`);
    } else {
      createPromotionSlot({
        slotName: slotName.trim(),
        promotionTypeId: matchedType?.id || '',
        promotionTypeName: matchedType?.name || 'Promotion Sale',
        placement: slotPlacement,
        startTime: new Date(slotStartTime).toISOString(),
        endTime: new Date(slotEndTime).toISOString(),
        status: slotStatus,
        maxBannersAllowed: slotMaxBanners,
      });
      showToast('success', `Promotion slot "${slotName}" created! Stores can now link product banners.`);
    }
    setShowSlotModal(false);
  };

  return (
    <div className="space-y-5">
      {/* GLOBAL TOAST */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
              <span>Promotion Sale Architecture</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Admin manages types &amp; slots · Store uploads banner &amp; links product
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
            Promotion Slots &amp; Store Banner Hub
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAddBanner()}
            className="px-4 py-2 bg-linear-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Product Banner</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveSubView('admin_governance')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'admin_governance'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              <span>Admin: Types &amp; Slots</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubView('slots_participation')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'slots_participation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Active Promotion Slots ({promotionSlots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('my_banners')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubView === 'my_banners'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
          <span>Linked Product Banners ({scopedBanners.length})</span>
          <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-1.5 py-0.2 rounded">
            Add/Edit/Delete
          </span>
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveSubView('admin_governance')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSubView === 'admin_governance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Admin Types &amp; Slots Governance</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* SUB-VIEW 1: AVAILABLE PROMOTION SLOTS (Store Participation) */}
      {/* ======================================================== */}
      {activeSubView === 'slots_participation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Available Promotion Slots for Store Participation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose an active slot, select a product from your catalogue, and upload your custom promotional banner.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotionSlots.map((slot) => {
              const matchedType = promotionTypes.find((t) => t.id === slot.promotionTypeId);
              const bannersInSlot = storeSlotProductBanners.filter((b) => b.slotId === slot.id);

              return (
                <div
                  key={slot.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700">
                        {slot.placement.toUpperCase()} POSITION
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          slot.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : slot.status === 'upcoming'
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {slot.status === 'active' ? 'Active Now' : slot.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 tracking-tight">
                        {slot.slotName}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                        Type: {slot.promotionTypeName}
                      </span>
                    </div>

                    {/* Slot Details */}
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Placement:</span>
                        <span className="font-bold text-slate-800 capitalize">{slot.placement} Marquee/Hero</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Linked Banners:</span>
                        <span className="font-bold font-mono text-emerald-700">
                          {bannersInSlot.length} / {slot.maxBannersAllowed} active
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Timing:</span>
                        <span className="text-[11px] font-mono text-slate-700">
                          {new Date(slot.startTime).toLocaleDateString()} – {new Date(slot.endTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenAddBanner(slot.id)}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Participate &amp; Upload Banner</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-VIEW 2: LINKED PRODUCT BANNERS (Store Add/Edit/Delete) */}
      {/* ======================================================== */}
      {activeSubView === 'my_banners' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Store Linked Product Banners ({scopedBanners.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every banner is linked with a specific product from your catalogue. Stores have full Add, Edit, and Delete access.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddBanner()}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product Banner</span>
            </button>
          </div>

          {scopedBanners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No Product Banners Created Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Participate in an active slot, select a product from your catalogue, and upload a promotional banner.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddBanner()}
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Create First Product Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopedBanners.map((item) => {
                const prod = products.find((p) => p.id === item.productId);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Banner Image Preview Stage */}
                      <div className="relative aspect-[21/9] bg-slate-900 overflow-hidden group">
                        <img
                          src={item.bannerImageUrl}
                          alt={item.headline}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 text-white">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                            {item.slotName}
                          </span>
                          <h4 className="text-sm sm:text-base font-extrabold leading-tight mt-0.5 drop-shadow-sm">
                            {item.headline}
                          </h4>
                          {item.subheadline && (
                            <p className="text-[11px] text-slate-200 line-clamp-1 mt-0.5">
                              {item.subheadline}
                            </p>
                          )}
                        </div>

                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono font-black text-[10px] shadow-sm">
                          {item.discountPct}% OFF
                        </div>
                      </div>

                      {/* Linked Product Bar */}
                      <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-1 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link className="w-3 h-3 text-blue-600 shrink-0" />
                              <span className="font-bold text-slate-900 truncate">
                                {item.productName}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              SKU: {item.productSku} · {item.storeName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-emerald-800 text-sm block">
                            {formatINR(item.salePrice)}
                          </span>
                          <span className="text-[10px] text-slate-400 line-through font-mono">
                            {formatINR(item.regularPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: View, Edit, Delete */}
                    <div className="p-3 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (prod) {
                            setSelectedProductForDetail(prod);
                            setActiveModal('product_detail');
                          }
                        }}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Product</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditBanner(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(item.id, item.productName)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-VIEW 3: ADMIN TYPES & SLOTS GOVERNANCE (Super Admin Only) */}
      {/* ======================================================== */}
      {activeSubView === 'admin_governance' && isSuperAdmin && (
        <div className="space-y-6">
          {/* SECTION A: PROMOTION TYPES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-600" />
                  <span>Promotion Types (Admin Only)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define official campaign genres (e.g. Festival Special, Brand Spotlight, Category Blitz).
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateType}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Create Promotion Type</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {promotionTypes.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-slate-200 text-slate-800">
                        {t.colorScheme}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditType(t)}
                      className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 rounded-md font-semibold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete promotion type "${t.name}"?`)) {
                          deletePromotionType(t.id);
                          showToast('success', 'Promotion type deleted.');
                        }
                      }}
                      className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-md font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION B: PROMOTION SLOTS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Promotion Slots (Admin Only)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure storefront placement slots (Top, Middle, Bottom) and active schedules for store participation.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateSlot}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                <span>Create Promotion Slot</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Slot Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Placement</th>
                    <th className="py-2.5 px-3">Schedule</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {promotionSlots.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.slotName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{s.promotionTypeName}</td>
                      <td className="py-2.5 px-3 font-semibold uppercase text-[10px] text-indigo-700">
                        {s.placement}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {new Date(s.startTime).toLocaleDateString()} – {new Date(s.endTime).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSlot(s)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 rounded font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete promotion slot "${s.slotName}"?`)) {
                              deletePromotionSlot(s.id);
                              showToast('success', 'Promotion slot deleted.');
                            }
                          }}
                          className="px-2 py-1 text-rose-600 hover:text-rose-800 rounded font-semibold cursor-pointer ml-1"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: STORE PARTICIPATE & UPLOAD BANNER (Add/Edit) */}
      {/* ======================================================== */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-white sm:bg-black/70 sm:backdrop-blur-xs flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-200">
          <div
            className={`bg-white w-full h-full flex flex-col overflow-hidden transition-all duration-200 ${
              isModalFullscreen
                ? 'sm:w-full sm:h-full sm:rounded-none'
                : 'sm:max-w-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200'
            }`}
          >
            {/* Fullscreen Sticky Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowBannerModal(false);
                    onCloseExternalModal?.();
                    onClearPreselectedProduct?.();
                  }}
                  className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                    {editingBannerId ? 'Edit Product Banner' : 'Participate in Slot with Product Banner'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Select product from catalogue &amp; upload promotional banner
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalFullscreen(!isModalFullscreen)}
                  className="hidden sm:inline-flex p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                  title={isModalFullscreen ? 'Compact Window' : 'Full Screen'}
                >
                  {isModalFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBannerModal(false);
                    onCloseExternalModal?.();
                    onClearPreselectedProduct?.();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form Body - Full Screen Scrollable */}
            <form onSubmit={handleSaveBanner} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
                {/* Target Promotion Slot */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Target Promotion Slot *</label>
                  <select
                    value={formSlotId}
                    onChange={(e) => setFormSlotId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 cursor-pointer focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-xs"
                    required
                  >
                    {promotionSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.slotName} ({s.placement.toUpperCase()} placement)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1-by-1 Product Selection */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Select Product from Catalogue *</label>
                  <select
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 cursor-pointer focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-xs"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Regular: {formatINR(p.regularPrice)} (SKU: {p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-12 h-12 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate text-xs sm:text-sm">{selectedProduct.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                          Regular: {formatINR(selectedProduct.regularPrice)} · SKU: {selectedProduct.sku}
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:w-36 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">Promo Price (₹) *</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedProduct.regularPrice}
                        value={formSalePrice}
                        onChange={(e) => setFormSalePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-black text-slate-900 text-sm focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Banner Image Upload & Preset Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700">Upload Promotional Banner Image *</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileUpload}
                      className="hidden"
                    />
                  </div>

                  <input
                    type="text"
                    value={formBannerUrl}
                    onChange={(e) => setFormBannerUrl(e.target.value)}
                    placeholder="Paste banner image URL or upload above..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    required
                  />

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Or pick template:</span>
                    {PRESET_BANNER_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.name}
                        type="button"
                        onClick={() => setFormBannerUrl(tmpl.url)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Live Preview */}
                {formBannerUrl && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">Live Banner Preview</span>
                      <span className="text-slate-400 font-mono text-[10px]">21:9 Widescreen Aspect</span>
                    </div>
                    <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 shadow-md">
                      <img
                        src={formBannerUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                          {selectedSlot?.slotName || 'Live Preview'}
                        </span>
                        <h5 className="font-black text-sm sm:text-base drop-shadow-sm truncate mt-0.5">
                          {formHeadline || selectedProduct?.name}
                        </h5>
                        {formSubheadline && (
                          <p className="text-[11px] text-slate-200 truncate mt-0.5">{formSubheadline}</p>
                        )}
                      </div>
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-black text-xs shadow-md">
                        {selectedProduct
                          ? `${Math.round(((selectedProduct.regularPrice - formSalePrice) / selectedProduct.regularPrice) * 100)}% OFF`
                          : 'SPECIAL'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Headline & Subheadline */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Banner Headline *</label>
                  <input
                    type="text"
                    value={formHeadline}
                    onChange={(e) => setFormHeadline(e.target.value)}
                    placeholder="e.g. Festive Audio Mega Drop — Up to 35% OFF"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Subheadline / Delivery Perks</label>
                  <input
                    type="text"
                    value={formSubheadline}
                    onChange={(e) => setFormSubheadline(e.target.value)}
                    placeholder="e.g. Fast Doorstep Dispatch in Lucknow with 1-Year Brand Warranty"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Button Call-to-Action Text</label>
                  <input
                    type="text"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    placeholder="e.g. Claim Deal, Shop Now, Buy Deal"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Sticky Safe Footer */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-end gap-3 pb-safe">
                <button
                  type="button"
                  onClick={() => {
                    setShowBannerModal(false);
                    onCloseExternalModal?.();
                    onClearPreselectedProduct?.();
                  }}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-white transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white rounded-xl font-black cursor-pointer shadow-md transition-all text-xs"
                >
                  {editingBannerId ? 'Save Changes' : 'Save & Link Product Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADMIN CREATE / EDIT PROMOTION TYPE */}
      {/* ======================================================== */}
      {showTypeModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-white sm:bg-black/60 sm:backdrop-blur-xs flex flex-col sm:items-center sm:justify-center sm:p-4 overflow-hidden">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {editingTypeId ? 'Edit Promotion Type' : 'Create Promotion Type'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTypeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type Name *</label>
                  <input
                    type="text"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    placeholder="e.g. Festival Special, Clearance Sale"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    value={typeDesc}
                    onChange={(e) => setTypeDesc(e.target.value)}
                    placeholder="Short description of this promotional campaign type..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg resize-none h-24"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color Theme</label>
                  <select
                    value={typeColor}
                    onChange={(e) => setTypeColor(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold capitalize"
                  >
                    <option value="rose">Rose</option>
                    <option value="amber">Amber</option>
                    <option value="purple">Purple</option>
                    <option value="blue">Blue</option>
                    <option value="emerald">Emerald</option>
                    <option value="indigo">Indigo</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-end gap-2.5 pb-safe">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  {editingTypeId ? 'Save Type' : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADMIN CREATE / EDIT PROMOTION SLOT */}
      {/* ======================================================== */}
      {showSlotModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-white sm:bg-black/60 sm:backdrop-blur-xs flex flex-col sm:items-center sm:justify-center sm:p-4 overflow-hidden">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {editingSlotId ? 'Edit Promotion Slot' : 'Create Promotion Slot'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSlotModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Slot Name *</label>
                  <input
                    type="text"
                    value={slotName}
                    onChange={(e) => setSlotName(e.target.value)}
                    placeholder="e.g. Homepage Prime Top Hero Slot"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Promotion Type *</label>
                  <select
                    value={slotTypeId}
                    onChange={(e) => setSlotTypeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold cursor-pointer"
                    required
                  >
                    {promotionTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Placement Position *</label>
                    <select
                      value={slotPlacement}
                      onChange={(e) => setSlotPlacement(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="top">Top (Hero Marquee)</option>
                      <option value="middle">Middle (Section Spotlight)</option>
                      <option value="bottom">Bottom (Brand Strip)</option>
                    </select>
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
                    <label className="font-bold text-slate-700 block mb-1">End Date &amp; Time *</label>
                    <input
                      type="datetime-local"
                      value={slotEndTime}
                      onChange={(e) => setSlotEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-end gap-2.5 pb-safe">
                <button
                  type="button"
                  onClick={() => setShowSlotModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {editingSlotId ? 'Save Changes' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
