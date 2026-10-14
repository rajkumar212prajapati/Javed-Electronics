import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR, calculateSavings } from '../../utils/currency';
import { getWhatsAppClickToChatUrl, generateProductInquiryMessage } from '../../utils/whatsapp';
import {
  ShoppingCart,
  MessageCircle,
  Star,
  QrCode,
  Shield,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    addToCart,
    settings,
    setSelectedProductForDetail,
    setActiveModal,
    openQrModal,
    currentRole,
  } = useStore();

  const [addedAnimation, setAddedAnimation] = React.useState(false);

  const availableStock = product.stock.onHand - product.stock.reserved;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= product.stock.minStockLevel;

  const currentPrice = product.dealPrice || product.regularPrice;
  const { savingsAmount, discountPercentage } = calculateSavings(product.mrp, currentPrice);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const res = addToCart(product, 1);
    if (res.success) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1200);
    }
  };

  const handleQuickView = () => {
    setSelectedProductForDetail(product);
    setActiveModal('product_detail');
  };

  const handleShowProductQr = () => {
    const productUrl = typeof window !== 'undefined'
      ? `${window.location.origin}?product=${product.id}`
      : `https://javed-electronics.in?product=${product.id}`;

    openQrModal({
      title: `${product.brand} - ${product.name}`,
      qrValue: productUrl,
      subtitle: `Scan with your phone to view specs or share this product (${formatINR(currentPrice)})`,
    });
  };

  const whatsappMessage = generateProductInquiryMessage(product.name, currentPrice, product.sku);
  const whatsappUrl = getWhatsAppClickToChatUrl(settings.whatsappNumber, whatsappMessage);

  // Internal gross margin calculation strictly for store manager or super admin
  const isInternalStaff = currentRole === 'store_manager' || currentRole === 'super_admin';
  const estimatedMargin = isInternalStaff && product.purchaseCost > 0
    ? currentPrice - product.purchaseCost
    : null;
  const marginPercentage = estimatedMargin
    ? Math.round((estimatedMargin / currentPrice) * 100)
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative w-full max-w-full min-w-0 box-border">
      {/* Top badges bar */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          {discountPercentage > 0 && (
            <span className="bg-rose-600 text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-xs">
              {discountPercentage}% OFF
            </span>
          )}
          {product.isFestiveDeal && (
            <span className="bg-amber-500 text-slate-950 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">
              Festive Deal
            </span>
          )}
        </div>

        {/* QR Code trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShowProductQr();
          }}
          title="Scan product QR"
          className="pointer-events-auto p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 rounded-md shadow-xs backdrop-blur-xs transition-colors cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product Image */}
      <div
        onClick={handleQuickView}
        className="relative pt-[75%] sm:pt-[80%] bg-slate-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Brand & Rating metadata */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1 gap-1">
            <span className="font-semibold text-blue-700 tracking-wide uppercase text-[10px] sm:text-[11px] truncate">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-slate-600 shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-semibold text-slate-900 text-[11px] sm:text-xs">{product.rating.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3
            onClick={handleQuickView}
            className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer leading-snug break-words"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Price Block */}
          <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
              {formatINR(currentPrice)}
            </span>
            {product.mrp > currentPrice && (
              <span className="text-[11px] sm:text-xs text-slate-400 line-through font-mono">
                {formatINR(product.mrp)}
              </span>
            )}
            {savingsAmount > 0 && (
              <span className="text-[10px] sm:text-[11px] font-medium text-emerald-600 whitespace-nowrap">
                Save {formatINR(savingsAmount)}
              </span>
            )}
          </div>

          {/* Stock availability indicator */}
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] flex-wrap">
            {isOutOfStock ? (
              <span className="text-rose-600 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Unavailable</span>
              </span>
            ) : isLowStock ? (
              <span className="text-amber-600 flex items-center gap-1 font-semibold animate-pulse">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Only {availableStock} left!</span>
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span>In Stock ({availableStock})</span>
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 text-[10px] flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              {product.warrantyMonths}m Warranty
            </span>
          </div>

          {/* Manager / Admin Internal Gross Margin */}
          {isInternalStaff && estimatedMargin !== null && (
            <div className="mt-2 p-1.5 bg-purple-50 border border-purple-200 rounded text-[10px] text-purple-900">
              <div className="flex justify-between font-mono">
                <span>Cost: {formatINR(product.purchaseCost)}</span>
                <span className="font-bold">Margin: {formatINR(estimatedMargin)} ({marginPercentage}%)</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-1.5 sm:gap-2">
          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Add to Cart</span>
              </>
            )}
          </button>

          {/* WhatsApp Direct Order / Inquiry */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors text-center min-h-[36px]"
            title="Inquire or Order via WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
