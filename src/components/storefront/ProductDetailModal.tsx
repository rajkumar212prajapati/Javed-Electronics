import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR, calculateSavings, calculateTaxBreakdown } from '../../utils/currency';
import { getWhatsAppClickToChatUrl, generateProductInquiryMessage } from '../../utils/whatsapp';
import {
  X,
  ArrowLeft,
  Star,
  ShieldCheck,
  RotateCcw,
  Truck,
  ShoppingCart,
  MessageCircle,
  QrCode,
  Check,
  AlertTriangle,
  Info,
  Percent,
  Sparkles,
  Plus,
  Minus,
  Tag,
  Box,
  Scale,
  Palette,
  Maximize2,
  Cpu,
  Package,
  Share2,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  BadgePercent,
  Compass,
  Flame,
  Clock,
} from 'lucide-react';
import { ProductReviews } from './ProductReviews';
import { getProductBulkDiscountSlabs } from '../../utils/bulkDiscountEngine';
import { ProductShareAndBacklinkModal } from './ProductShareAndBacklinkModal';

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1593998066526-65fcab3021a2?auto=format&fit=crop&w=800&q=80';

export const ProductDetailModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedProductForDetail,
    setSelectedProductForDetail,
    addToCart,
    cart,
    products,
    settings,
    openQrModal,
    bulkDiscountRules,
  } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Live timer for Maha Sale countdown
  const [detailNowMs, setDetailNowMs] = useState<number>(Date.now());
  useEffect(() => {
    if (activeModal !== 'product_detail') return;
    const timer = setInterval(() => setDetailNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeModal]);

  const formatMahaSaleCountdown = (endTimeStr?: string) => {
    if (!endTimeStr) return '00h 00m 00s';
    const end = new Date(endTimeStr).getTime();
    const diff = end - detailNowMs;
    if (diff <= 0) return '00h 00m 00s';

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  // Segregated recommendations tab state
  const [recTab, setRecTab] = useState<'upsell' | 'downsell' | 'similar' | 'bundle'>('upsell');

  const product = selectedProductForDetail;

  // Defaults for variants
  const defaultColor = product?.colorVariants?.[0]?.name || 'Midnight Black';
  const defaultSize = product?.sizeVariants?.[0]?.size || (product?.variants?.[0]?.options?.[0]) || '';
  const defaultModule = product?.moduleVariants?.[0]?.moduleName || '';

  const [selectedColor, setSelectedColor] = useState<string>(defaultColor);
  const [selectedSize, setSelectedSize] = useState<string>(defaultSize);
  const [selectedModule, setSelectedModule] = useState<string>(defaultModule);
  const [selectedLegacyVariant, setSelectedLegacyVariant] = useState<string>('');

  // Sync state when selected product changes
  useEffect(() => {
    if (product) {
      setActiveImageIdx(0);
      setQuantity(1);
      setSelectedColor(product.colorVariants?.[0]?.name || 'Midnight Black');
      setSelectedSize(product.sizeVariants?.[0]?.size || (product.variants?.[0]?.options?.[0]) || '');
      setSelectedModule(product.moduleVariants?.[0]?.moduleName || '');
      setSelectedLegacyVariant('');
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product?.id]);

  // Cart total item count
  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Segregated Recommendations: Upsell, Downsell, Similar, and Bundle Add-ons
  const { upsellProducts, downsellProducts, similarProducts, bundleProducts } = useMemo(() => {
    if (!product) return { upsellProducts: [], downsellProducts: [], similarProducts: [], bundleProducts: [] };

    const prodPrice = product.dealPrice || product.regularPrice;
    const otherProducts = products.filter((p) => p.id !== product.id && p.status === 'published');

    // 1. Same category vs other categories
    const sameCategory = otherProducts.filter((p) => p.categoryId === product.categoryId);
    const otherCategories = otherProducts.filter((p) => p.categoryId !== product.categoryId);

    // Upsell: Higher priced products offering superior performance / specs
    const higherSame = sameCategory
      .filter((p) => (p.dealPrice || p.regularPrice) > prodPrice)
      .sort((a, b) => (a.dealPrice || a.regularPrice) - (b.dealPrice || b.regularPrice));
    const higherOther = otherCategories
      .filter((p) => (p.dealPrice || p.regularPrice) > prodPrice)
      .sort((a, b) => (a.dealPrice || a.regularPrice) - (b.dealPrice || b.regularPrice));
    const upsells = [...higherSame, ...higherOther].slice(0, 4);

    // Downsell: Lower priced, value-for-money alternatives
    const lowerSame = sameCategory
      .filter((p) => (p.dealPrice || p.regularPrice) < prodPrice)
      .sort((a, b) => (b.dealPrice || b.regularPrice) - (a.dealPrice || a.regularPrice));
    const lowerOther = otherCategories
      .filter((p) => (p.dealPrice || p.regularPrice) < prodPrice)
      .sort((a, b) => (b.dealPrice || b.regularPrice) - (a.dealPrice || a.regularPrice));
    const downsells = [...lowerSame, ...lowerOther].slice(0, 4);

    // Similar: same category items
    const similars = (sameCategory.length > 0 ? sameCategory : otherProducts)
      .filter((p) => !upsells.some((u) => u.id === p.id) && !downsells.some((d) => d.id === p.id))
      .slice(0, 4);

    // Frequently bought together / compatible accessories
    const bundles = otherProducts
      .filter(
        (p) =>
          p.categoryId === 'chargers_cables' ||
          p.categoryId === 'computer_accessories' ||
          p.categoryId === 'audio_headphones'
      )
      .slice(0, 4);

    return {
      upsellProducts: upsells,
      downsellProducts: downsells,
      similarProducts: similars.length > 0 ? similars : otherProducts.slice(0, 4),
      bundleProducts: bundles,
    };
  }, [products, product]);

  if (activeModal !== 'product_detail' || !product) {
    return null;
  }

  // Calculate variant price difference
  const colorObj = product.colorVariants?.find((c) => c.name === selectedColor);
  const sizeObj = product.sizeVariants?.find((s) => s.size === selectedSize);
  const moduleObj = product.moduleVariants?.find((m) => m.moduleName === selectedModule);

  const variantDiff =
    (colorObj?.priceDiff || 0) +
    (sizeObj?.priceDiff || 0) +
    (moduleObj?.priceDiff || 0);

  const basePrice = product.dealPrice || product.regularPrice;
  const currentPrice = basePrice + variantDiff;

  const availableStock = product.stock.onHand - product.stock.reserved;
  const isOutOfStock = availableStock <= 0;
  const { savingsAmount, discountPercentage } = calculateSavings(product.mrp, currentPrice);
  const tax = calculateTaxBreakdown(currentPrice, product.gstRate);

  const bulkSlabs = getProductBulkDiscountSlabs(product, bulkDiscountRules);
  const activeSlab = [...bulkSlabs].reverse().find((s) => quantity >= s.minQty);

  const handleClose = () => {
    setActiveModal(null);
    setSelectedProductForDetail(null);
    setQuantity(1);
  };

  const getVariantLabel = () => {
    const variantParts = [
      selectedColor,
      selectedSize,
      selectedModule,
      selectedLegacyVariant,
    ].filter(Boolean);
    return variantParts.length > 0 ? variantParts.join(' • ') : undefined;
  };

  const handleAdd = () => {
    const chosenVariantLabel = getVariantLabel();
    const res = addToCart(product, quantity, chosenVariantLabel);
    if (res.success) {
      setAddedMessage(`Added ${quantity} unit${quantity > 1 ? 's' : ''} to cart!`);
      setTimeout(() => setAddedMessage(null), 2000);
    } else {
      setAddedMessage(res.message);
    }
  };

  // Direct Checkout from the Product Page
  const handleDirectCheckout = (targetProduct?: Product) => {
    const prodToBuy = targetProduct || product;
    const variantLabel = targetProduct ? undefined : getVariantLabel();
    const qty = targetProduct ? 1 : quantity;

    addToCart(prodToBuy, qty, variantLabel);
    setActiveModal('checkout');
  };

  const handleSelectRecommendation = (recProduct: Product) => {
    setSelectedProductForDetail(recProduct);
  };

  const handleShowQr = () => {
    const productUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}?product=${product.id}`
        : `https://javed-electronics.in?product=${product.id}`;

    openQrModal({
      title: `${product.brand} - ${product.name}`,
      qrValue: productUrl,
      subtitle: `Scan on mobile to purchase or share with friends (${formatINR(currentPrice)})`,
    });
  };

  const whatsappMessage = generateProductInquiryMessage(product.name, currentPrice, product.sku);
  const whatsappUrl = getWhatsAppClickToChatUrl(settings.whatsappNumber, whatsappMessage);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-white w-full h-full min-h-screen overflow-y-auto flex flex-col scroll-smooth"
    >
      {/* Top Full-Screen Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 sm:px-6 py-2.5 sm:py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleClose}
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Store</span>
            </button>

            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
              <span>Catalog</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{product.categoryId.replace(/_/g, ' ')}</span>
              {product.subCategoryName && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-indigo-600 font-semibold">{product.subCategoryName}</span>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900 truncate">{product.brand}</span>
            </div>
          </div>

          {/* Action icons & Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Share */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Share Product"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* WhatsApp Support */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl cursor-pointer transition-colors"
                title="Ask about product on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}

            {/* Cart Shortcut with Live Badge */}
            <button
              type="button"
              onClick={() => setActiveModal('cart')}
              className="relative p-2 sm:px-3 sm:py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="View Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Close Full Screen View"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Product Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8 pb-32">
        {/* Added Toast Notification */}
        {addedMessage && (
          <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-5 h-5" />
            <span>{addedMessage}</span>
          </div>
        )}

        {/* 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left Column: Interactive Product Gallery & Badges (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-20 space-y-4">
              {/* Main Image Stage */}
              <div className="relative aspect-square rounded-3xl bg-slate-50 border border-slate-200/90 p-6 flex items-center justify-center overflow-hidden shadow-xs group">
                <img
                  src={product.images[activeImageIdx] || product.images[0] || FALLBACK_PRODUCT_IMAGE}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                  }}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />

                {/* Deal Discount Badge */}
                {product.dealPrice && (
                  <div className="absolute top-4 left-4 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                    <span>{discountPercentage}% OFF</span>
                  </div>
                )}

                {/* Brand Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {product.brand}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-16 h-16 rounded-2xl border-2 p-1.5 bg-white shrink-0 cursor-pointer transition-all ${
                        activeImageIdx === idx
                          ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-xs'
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                        }}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Title, Price, Direct Checkout CTA & Specs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              {/* Brand & SKU Bar */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200 uppercase tracking-wider text-[11px]">
                    {product.brand}
                  </span>
                  {product.subCategoryName && (
                    <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                      {product.subCategoryName}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-slate-500">SKU: {product.sku}</span>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-snug tracking-tight">
                {product.name}
              </h1>

              {/* Rating & Social Proof */}
              <div className="flex items-center gap-2.5 mt-2.5">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) ? 'fill-amber-400' : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-black text-slate-900">{product.rating}</span>
                <span className="text-xs text-slate-500 font-medium">
                  ({product.reviewsCount} verified customer ratings)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ Verified Authentic
                </span>
              </div>
            </div>

            {/* Live Maha Sale Flash Banner with Countdown */}
            {product.isMahaSaleActive && product.mahaSaleEndTime && (
              <div className="p-4 sm:p-4.5 rounded-2xl bg-linear-to-r from-rose-900 via-rose-800 to-amber-900 text-white shadow-lg border-2 border-rose-400/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-amber-300 animate-pulse fill-amber-300" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      ⚡ Official Maha Flash Sale
                    </div>
                    <div className="text-sm sm:text-base font-black">
                      {product.mahaSaleDiscountPct || discountPercentage}% OFF Store Flash Deal
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 backdrop-blur-xs px-4 py-2 rounded-xl border border-rose-400/30 text-center sm:text-right shrink-0">
                  <div className="text-[10px] uppercase font-bold text-rose-300 flex items-center justify-center sm:justify-end gap-1">
                    <Clock className="w-3 h-3 text-rose-400 animate-spin" />
                    <span>Countdown Ends In</span>
                  </div>
                  <div className="font-mono text-base font-black text-amber-300 tracking-wider">
                    {formatMahaSaleCountdown(product.mahaSaleEndTime)}
                  </div>
                </div>
              </div>
            )}

            {/* Price Box with Savings & GST */}
            <div className="p-4 sm:p-5 bg-linear-to-br from-slate-50 via-white to-indigo-50/30 border border-slate-200 rounded-3xl shadow-xs space-y-3">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-mono tracking-tight">
                  {formatINR(currentPrice)}
                </span>
                {product.mrp > currentPrice && (
                  <span className="text-sm sm:text-base text-slate-400 line-through font-mono">
                    {formatINR(product.mrp)}
                  </span>
                )}
                {savingsAmount > 0 && (
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    Save {formatINR(savingsAmount)} ({discountPercentage}% Off)
                  </span>
                )}
              </div>

              {/* Inclusive of GST */}
              <div className="text-xs text-slate-600 flex items-center justify-between border-t border-slate-200/80 pt-2 flex-wrap gap-2">
                <span>Inclusive of all taxes ({product.gstRate}% GST included)</span>
                <span className="font-mono text-[11px] text-slate-500">
                  Base: {formatINR(tax.basePrice)} + Tax: {formatINR(tax.totalTax)}
                </span>
              </div>

              {/* Stock Status */}
              <div className="flex items-center justify-between text-xs pt-1">
                {isOutOfStock ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Out of stock in Lucknow warehouse
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In Stock: {availableStock} units ready for same-day dispatch</span>
                  </span>
                )}
                <span className="text-[11px] text-indigo-700 font-medium">Free Store Pickup available</span>
              </div>
            </div>

            {/* Volume Tier Discount Slabs */}
            {bulkSlabs.length > 0 && (
              <div className="p-4 bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-indigo-600" />
                    <span>Tiered Wholesale / Bulk Discounts</span>
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Auto-Applied at Checkout
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {bulkSlabs.map((slab, i) => {
                    const isTierActive =
                      quantity >= slab.minQty &&
                      (i === bulkSlabs.length - 1 || quantity < bulkSlabs[i + 1]?.minQty);

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setQuantity(slab.minQty)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isTierActive
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs ring-2 ring-indigo-300'
                            : 'bg-white hover:bg-indigo-50 text-slate-800 border-indigo-100 hover:border-indigo-200'
                        }`}
                      >
                        <div className={`text-[10px] font-semibold ${isTierActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {slab.minQty}+ Units
                        </div>
                        <div className="font-extrabold font-mono text-sm mt-0.5">
                          {formatINR(slab.unitPrice)}
                        </div>
                        <div className={`text-[10px] font-bold ${isTierActive ? 'text-indigo-100' : 'text-emerald-700'}`}>
                          {slab.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DIRECT ACTION SECTION: Quantity + Add to Cart + BUY NOW CHECKOUT! */}
            <div className="p-5 bg-slate-50 border-2 border-indigo-200/80 rounded-3xl space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-l-xl cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm font-mono text-slate-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                      disabled={quantity >= availableStock}
                      className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-r-xl cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Total Calculated Price */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Subtotal for {quantity} item{quantity > 1 ? 's' : ''}:
                  </span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    {formatINR(currentPrice * quantity)}
                  </span>
                </div>
              </div>

              {/* Dual CTA Buttons: Add to Cart + Buy Now */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Add to Cart */}
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className="py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  <span>Add to Cart</span>
                </button>

                {/* 2. Buy Now */}
                <button
                  type="button"
                  onClick={() => handleDirectCheckout()}
                  disabled={isOutOfStock}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>

            {/* Description Overview */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Product Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Technical Specifications
              </h4>
              <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                {Object.entries(product.specifications).map(([key, value], idx) => (
                  <div
                    key={key}
                    className={`grid grid-cols-2 p-2.5 ${
                      idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                    }`}
                  >
                    <span className="font-semibold text-slate-600 mr-2">{key}</span>
                    <span className="text-slate-900 font-bold break-words">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEGREGATED RECOMMENDATIONS: UPSELL, DOWNSELL, SIMILAR, BUNDLE ADD-ONS      */}
        {/* ========================================================================= */}
        <section className="pt-8 border-t-2 border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
                  AI Segregated Recommendations
                </span>
                <span className="text-xs font-bold text-slate-500">Smart Electronics Matching</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                Explore Upgrades, Value Picks &amp; Similar Devices
              </h3>
              <p className="text-xs text-slate-500">
                Segregated specifically for your requirements — compare higher-spec models, budget alternatives, or compatible accessories.
              </p>
            </div>
          </div>

          {/* Segregated Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setRecTab('upsell')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
                recTab === 'upsell'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Upgrade Models (Upsell)</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  recTab === 'upsell' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {upsellProducts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRecTab('downsell')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
                recTab === 'downsell'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 rotate-180" />
              <span>💰 Budget Value Picks (Downsell)</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  recTab === 'downsell' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {downsellProducts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRecTab('similar')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
                recTab === 'similar'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>🔍 Similar in Category</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  recTab === 'similar' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {similarProducts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRecTab('bundle')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
                recTab === 'bundle'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span>🎁 Frequently Paired Together</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  recTab === 'bundle' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {bundleProducts.length}
              </span>
            </button>
          </div>

          {/* Recommendation Info Banner */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            {recTab === 'upsell' && (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Upsell Upgrades:</strong> Higher performance, faster charging, and flagship features for an elevated electronics experience.
                </span>
              </span>
            )}
            {recTab === 'downsell' && (
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Budget Alternatives (Downsell):</strong> Practical, cost-effective options with great reliability and lower overall cost.
                </span>
              </span>
            )}
            {recTab === 'similar' && (
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Similar Category Matches:</strong> Comparable hardware in the same price tier with varied brand choices.
                </span>
              </span>
            )}
            {recTab === 'bundle' && (
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  <strong>Frequently Bought Together:</strong> Popular matching cables, wall chargers, and protective accessories.
                </span>
              </span>
            )}
          </div>

          {/* Segregated Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(recTab === 'upsell'
              ? upsellProducts
              : recTab === 'downsell'
              ? downsellProducts
              : recTab === 'similar'
              ? similarProducts
              : bundleProducts
            ).map((item) => {
              const itemPrice = item.dealPrice || item.regularPrice;
              const { savingsAmount: itemSavings, discountPercentage: itemDiscount } =
                calculateSavings(item.mrp, itemPrice);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Badge */}
                    <div className="flex items-center justify-between">
                      {recTab === 'upsell' && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-600" />
                          <span>Premium Upgrade</span>
                        </span>
                      )}
                      {recTab === 'downsell' && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>Budget Saver</span>
                        </span>
                      )}
                      {recTab === 'similar' && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-600" />
                          <span>Direct Alternative</span>
                        </span>
                      )}
                      {recTab === 'bundle' && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Package className="w-3 h-3 text-purple-600" />
                          <span>Pair Add-On</span>
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 font-bold uppercase">{item.brand}</span>
                    </div>

                    {/* Image */}
                    <div
                      onClick={() => handleSelectRecommendation(item)}
                      className="aspect-square rounded-xl bg-slate-50 p-3 flex items-center justify-center overflow-hidden cursor-pointer group-hover:bg-indigo-50/20 transition-colors"
                    >
                      <img
                        src={item.images[0] || FALLBACK_PRODUCT_IMAGE}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                        }}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Title & Rating */}
                    <div>
                      <h4
                        onClick={() => handleSelectRecommendation(item)}
                        className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors"
                        title={item.name}
                      >
                        {item.name}
                      </h4>

                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{item.rating}</span>
                        <span className="text-slate-400 font-normal">({item.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 flex-wrap pt-1">
                      <span className="text-base font-black font-mono text-slate-900">
                        {formatINR(itemPrice)}
                      </span>
                      {item.mrp > itemPrice && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {formatINR(item.mrp)}
                        </span>
                      )}
                      {itemDiscount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {itemDiscount}% Off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: View Product or Direct Buy Now */}
                  <div className="grid grid-cols-2 gap-1.5 pt-3 mt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSelectRecommendation(item)}
                      className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer transition-colors text-center"
                    >
                      View Product
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDirectCheckout(item)}
                      className="py-2 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Checkout directly with this product"
                    >
                      <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="pt-8 border-t-2 border-slate-200">
          <ProductReviews productId={product.id} />
        </section>
      </main>

      {/* Sticky Bottom Quick Checkout Bar (Stacked directly above Persistent Customer Bottom Menu) */}
      <div className="fixed bottom-[56px] inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Product Info summary */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 hidden sm:flex items-center justify-center overflow-hidden">
              <img
                src={product.images[0] || FALLBACK_PRODUCT_IMAGE}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
                {product.name}
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-black font-mono text-indigo-700 sm:text-base">
                  {formatINR(currentPrice * quantity)}
                </span>
                <span className="text-slate-500 hidden sm:inline">
                  (Qty: {quantity} • {selectedColor || selectedSize || 'Standard'})
                </span>
              </div>
            </div>
          </div>

          {/* Right: Dual CTAs (Add to Cart + Instant Buy Now Checkout) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Add to Cart */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="py-2.5 px-3 sm:px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Add to Cart</span>
            </button>

            {/* Instant Checkout */}
            <button
              type="button"
              onClick={() => handleDirectCheckout()}
              disabled={isOutOfStock}
              className="py-2.5 px-4 sm:px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Share & Backlink Modal */}
      {showShareModal && (
        <ProductShareAndBacklinkModal
          product={product}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
