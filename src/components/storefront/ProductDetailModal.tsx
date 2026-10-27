import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR, calculateSavings, calculateTaxBreakdown } from '../../utils/currency';
import { getWhatsAppClickToChatUrl, generateProductInquiryMessage } from '../../utils/whatsapp';
import {
  calculateVolumetricMetrics,
  parseDimensionString,
} from '../../utils/volumetricWeight';
import { VolumetricWeightCalculatorModal } from '../common/VolumetricWeightCalculatorModal';
import {
  X,
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
} from 'lucide-react';
import { ProductReviews } from './ProductReviews';
import { getProductBulkDiscountSlabs } from '../../utils/bulkDiscountEngine';

export const ProductDetailModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedProductForDetail,
    setSelectedProductForDetail,
    addToCart,
    settings,
    openQrModal,
    bulkDiscountRules,
  } = useStore();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [showVolumetricModal, setShowVolumetricModal] = useState(false);

  // Fallback defaults for variants
  const product = selectedProductForDetail;

  const defaultColor = product?.colorVariants?.[0]?.name || 'Midnight Black';
  const defaultSize = product?.sizeVariants?.[0]?.size || (product?.variants?.[0]?.options?.[0]) || '';
  const defaultModule = product?.moduleVariants?.[0]?.moduleName || '';

  const [selectedColor, setSelectedColor] = useState<string>(defaultColor);
  const [selectedSize, setSelectedSize] = useState<string>(defaultSize);
  const [selectedModule, setSelectedModule] = useState<string>(defaultModule);
  const [selectedLegacyVariant, setSelectedLegacyVariant] = useState<string>('');

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

  // Physical Dimensions & Volumetric Weight
  const parsedDims = parseDimensionString(product.dimensions);
  const lengthCm = product.lengthCm || parsedDims.lengthCm;
  const widthCm = product.widthCm || parsedDims.widthCm;
  const heightCm = product.heightCm || parsedDims.heightCm;
  const deadWeightKg = product.deadWeightKg || product.weightKg || 0.35;

  const volumetric = calculateVolumetricMetrics({
    lengthCm,
    widthCm,
    heightCm,
    deadWeightKg,
  });

  const handleClose = () => {
    setActiveModal(null);
    setSelectedProductForDetail(null);
    setQuantity(1);
  };

  const handleAdd = () => {
    const variantParts = [
      selectedColor,
      selectedSize,
      selectedModule,
      selectedLegacyVariant,
    ].filter(Boolean);

    const chosenVariantLabel = variantParts.length > 0 ? variantParts.join(' • ') : undefined;

    const res = addToCart(product, quantity, chosenVariantLabel);
    if (res.success) {
      setAddedMessage(`Added ${quantity} unit${quantity > 1 ? 's' : ''} to cart!`);
      setTimeout(() => setAddedMessage(null), 1500);
    } else {
      setAddedMessage(res.message);
    }
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-auto sm:my-6 animate-in fade-in duration-200 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 p-2 text-slate-500 hover:text-slate-900 bg-white/90 hover:bg-white rounded-full shadow-md cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Column: Images & Shipping Badges */}
            <div className="p-4 sm:p-6 bg-slate-50 border-r border-slate-200 flex flex-col justify-between">
              <div>
                <div className="relative aspect-square rounded-2xl bg-white p-4 border border-slate-200/80 shadow-2xs overflow-hidden">
                  <img
                    src={product.images[activeImageIdx] || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  {product.dealPrice && (
                    <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                      {discountPercentage}% OFF
                    </div>
                  )}
                </div>

                {/* Thumbnail carousel */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-14 h-14 rounded-xl border p-1 bg-white shrink-0 cursor-pointer transition-all ${
                          activeImageIdx === idx
                            ? 'border-blue-600 ring-2 ring-blue-200 shadow-2xs'
                            : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Verified Trust Badges */}
              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-[11px] block">4-Hour Express</span>
                    <span className="text-[10px] text-slate-500">Lucknow Doorstep</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-[11px] block">Brand Warranty</span>
                    <span className="text-[10px] text-slate-500">{product.warrantyMonths} Months Official</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Details, Variation Selectors, Dimensions & Actions */}
            <div className="p-3.5 sm:p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Brand, SKU & Model Number */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 uppercase tracking-wider">{product.brand}</span>
                    {product.modelNumber && (
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {product.modelNumber}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px]">SKU: {product.sku}</span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {product.name}
                </h2>

                {product.moduleName && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hardware Series: {product.moduleName}</span>
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(product.rating) ? 'fill-amber-400' : 'fill-slate-200 text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-800">{product.rating}</span>
                  <span className="text-[11px] text-slate-400">({product.reviewsCount} reviews)</span>
                </div>

                {/* Price Calculation Box */}
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
                      {formatINR(currentPrice)}
                    </span>
                    {product.mrp > currentPrice && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        {formatINR(product.mrp)}
                      </span>
                    )}
                    {savingsAmount > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Save {formatINR(savingsAmount)}
                      </span>
                    )}
                  </div>

                  {/* GST Details */}
                  <div className="mt-2 text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200 pt-1.5">
                    <span>Price inclusive of {product.gstRate}% GST:</span>
                    <span className="font-mono">
                      Base: {formatINR(tax.basePrice)} + Tax: {formatINR(tax.totalTax)}
                    </span>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  {isOutOfStock ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Out of stock
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Available: {availableStock} units ready for delivery
                    </span>
                  )}
                </div>

                {/* Bulk Volume Discount Pricing Slabs */}
                {bulkSlabs.length > 0 && (
                  <div className="mt-3 p-3 bg-linear-to-br from-indigo-50/90 to-blue-50/80 border border-indigo-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Volume Order Pricing</span>
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                        Bulk Discount Slabs
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {bulkSlabs.map((slab, i) => {
                        const isTierActive =
                          quantity >= slab.minQty &&
                          (i === bulkSlabs.length - 1 || quantity < bulkSlabs[i + 1]?.minQty);

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setQuantity(slab.minQty)}
                            className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
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

                {/* 1. COLOR VARIATIONS SELECTOR */}
                {product.colorVariants && product.colorVariants.length > 0 && (
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-purple-600" />
                        <span>Color:</span>
                        <strong className="text-slate-950 font-bold">{selectedColor}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {product.colorVariants.map((c) => {
                        const isSelected = selectedColor === c.name;
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setSelectedColor(c.name)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-purple-300'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span>{c.name}</span>
                            {c.priceDiff ? <span className="font-mono text-[10px] text-amber-300">(+₹{c.priceDiff})</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. SIZE / CAPACITY / SPEC VARIATIONS SELECTOR */}
                {product.sizeVariants && product.sizeVariants.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Size / Storage / Spec:</span>
                        <strong className="text-slate-950 font-bold">{selectedSize}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.sizeVariants.map((s) => {
                        const isSelected = selectedSize === s.size;
                        return (
                          <button
                            key={s.size}
                            type="button"
                            onClick={() => setSelectedSize(s.size)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span>{s.size}</span>
                            {s.priceDiff ? <span className={`ml-1.5 text-[10px] font-mono ${isSelected ? 'text-emerald-100' : 'text-emerald-700 font-bold'}`}>+₹{s.priceDiff}</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. HARDWARE MODULE VARIATION SELECTOR */}
                {product.moduleVariants && product.moduleVariants.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Module Edition:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.moduleVariants.map((m) => {
                        const isSelected = selectedModule === m.moduleName;
                        return (
                          <button
                            key={m.moduleName}
                            type="button"
                            onClick={() => setSelectedModule(m.moduleName)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span>{m.moduleName}</span>
                            {m.priceDiff ? <span className="ml-1 text-[10px] font-mono">(+₹{m.priceDiff})</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Legacy Variants fallback */}
                {(!product.colorVariants && !product.sizeVariants && product.variants && product.variants.length > 0) && (
                  <div className="mt-3 space-y-2.5">
                    {product.variants.map((v) => (
                      <div key={v.id}>
                        <span className="text-xs font-semibold text-slate-700 block mb-1">
                          Select {v.name}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {v.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setSelectedLegacyVariant(opt)}
                              className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                                selectedLegacyVariant === opt
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* PHYSICAL DIMENSIONS & VOLUMETRIC WEIGHT BOX */}
                <div className="mt-3.5 p-3 bg-blue-50/70 border border-blue-200/90 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-blue-600" />
                      <span>Package Dimensions &amp; Volumetric Weight</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowVolumetricModal(true)}
                      className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-300 hover:bg-blue-50 cursor-pointer shadow-2xs"
                    >
                      📐 Volumetric Calculator
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <span className="text-[10px] text-slate-500 block">Length × Width × Height</span>
                      <strong className="font-mono text-slate-900 block text-xs">
                        {volumetric.lengthCm} × {volumetric.widthCm} × {volumetric.heightCm} cm
                      </strong>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <span className="text-[10px] text-slate-500 block">Dead Weight</span>
                      <strong className="font-mono text-slate-900 block text-xs">
                        {volumetric.deadWeightKg} kg
                      </strong>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <span className="text-[10px] text-slate-500 block">Volumetric Wt</span>
                      <strong className="font-mono text-blue-700 block text-xs">
                        {volumetric.volumetricWeightKg} kg
                      </strong>
                    </div>

                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-300">
                      <span className="text-[10px] text-emerald-800 font-bold block">Billable Weight</span>
                      <strong className="font-mono text-emerald-950 block text-xs font-black">
                        {volumetric.billableWeightKg} kg
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-blue-800/80 pt-1 border-t border-blue-200/60">
                    <span>Package Category: <strong>{volumetric.packageCategory}</strong></span>
                    <span>Carrier Divisor: 5000 (Shiprocket / Air Express)</span>
                  </div>
                </div>

                {/* BOX CONTENTS ("IN THE BOX") */}
                {product.boxContents && product.boxContents.length > 0 && (
                  <div className="mt-3.5 space-y-1.5">
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-600" />
                      <span>In The Box (Package Contents)</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {product.boxContents.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700"
                        >
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="mt-3.5">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Product Overview
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Specifications Table */}
                <div className="mt-3.5">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    Technical Specifications
                  </h4>
                  <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
                    {Object.entries(product.specifications).map(([key, value], idx) => (
                      <div
                        key={key}
                        className={`grid grid-cols-2 p-2 ${
                          idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                        }`}
                      >
                        <span className="font-medium text-slate-600 truncate mr-1">{key}</span>
                        <span className="text-slate-900 font-semibold break-words">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Order Quantity:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {activeSlab ? `${activeSlab.discountPercentage}% bulk tier applied` : 'Standard retail price'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-l cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 font-mono text-xs font-bold text-slate-900 min-w-[36px] text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        disabled={quantity >= availableStock || isOutOfStock}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-r cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add to Cart CTA */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className="flex-1 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isOutOfStock ? 'Currently Out of Stock' : `Add to Cart • ${formatINR(currentPrice * quantity)}`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShowQr}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
                    title="Generate QR code for this product"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl cursor-pointer transition-colors"
                      title="Chat on WhatsApp about this product"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {addedMessage && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold text-center animate-in fade-in">
                    {addedMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Proof & Verified Reviews */}
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50">
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </div>

      {/* Volumetric Weight Calculator Modal */}
      {showVolumetricModal && (
        <VolumetricWeightCalculatorModal
          isOpen={showVolumetricModal}
          onClose={() => setShowVolumetricModal(false)}
          initialValues={{
            lengthCm,
            widthCm,
            heightCm,
            deadWeightKg,
            productName: product.name,
          }}
        />
      )}
    </div>
  );
};
