import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR, calculateSavings, calculateTaxBreakdown } from '../../utils/currency';
import { getWhatsAppClickToChatUrl, generateProductInquiryMessage } from '../../utils/whatsapp';
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
} from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedProductForDetail,
    setSelectedProductForDetail,
    addToCart,
    settings,
    openQrModal,
  } = useStore();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  if (activeModal !== 'product_detail' || !selectedProductForDetail) {
    return null;
  }

  const product = selectedProductForDetail;
  const currentPrice = product.dealPrice || product.regularPrice;
  const availableStock = product.stock.onHand - product.stock.reserved;
  const isOutOfStock = availableStock <= 0;
  const { savingsAmount, discountPercentage } = calculateSavings(product.mrp, currentPrice);
  const tax = calculateTaxBreakdown(currentPrice, product.gstRate);

  const handleClose = () => {
    setActiveModal(null);
    setSelectedProductForDetail(null);
  };

  const handleAdd = () => {
    const res = addToCart(product, 1, selectedVariant || undefined);
    if (res.success) {
      setAddedMessage('Added to cart!');
      setTimeout(() => setAddedMessage(null), 1500);
    } else {
      setAddedMessage(res.message);
    }
  };

  const handleShowQr = () => {
    const productUrl = typeof window !== 'undefined'
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
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-auto sm:my-6 animate-in fade-in duration-200 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 p-2 text-slate-500 hover:text-slate-900 bg-white/90 hover:bg-white rounded-full shadow-md cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
          {/* Left Column: Image Gallery */}
          <div className="p-3.5 sm:p-6 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white border border-slate-200 shadow-inner max-w-sm mx-auto w-full">
              <img
                src={product.images[activeImageIdx] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discountPercentage > 0 && (
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-xs">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                      activeImageIdx === idx ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust highlights under gallery */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Same-day 4-hour local dispatch in Lucknow</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{product.warrantyMonths} Months Official Brand Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>{product.returnEligibleDays} Days Local Store Replacement</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Order CTA */}
          <div className="p-3.5 sm:p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Brand & SKU */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold text-blue-600 uppercase tracking-wider">{product.brand}</span>
                <span className="font-mono text-[11px]">SKU: {product.sku}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {product.name}
              </h2>

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

              {/* Variants Selector */}
              {product.variants && product.variants.length > 0 && (
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
                            onClick={() => setSelectedVariant(opt)}
                            className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                              selectedVariant === opt
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
              {addedMessage && (
                <div className="text-xs font-semibold text-center text-emerald-700 bg-emerald-50 py-1.5 rounded-md border border-emerald-200">
                  {addedMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[42px] ${
                    isOutOfStock
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all text-center min-h-[42px]"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                  <span>Order on WhatsApp</span>
                </a>
              </div>

              {/* Show Product QR code */}
              <button
                onClick={handleShowQr}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Show Dynamic QR Code for Mobile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
