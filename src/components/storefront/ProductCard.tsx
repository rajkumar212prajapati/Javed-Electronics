import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import { Star, Plus, Check, Share2, Flame, Clock } from 'lucide-react';
import { ProductShareAndBacklinkModal } from './ProductShareAndBacklinkModal';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const {
    addToCart,
    setSelectedProductForDetail,
    setActiveModal,
    settings,
    getProductJeAssuredHealth,
  } = useStore();

  const [addedAnimation, setAddedAnimation] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);

  // Live Maha Sale countdown timer
  const [timeRemaining, setTimeRemaining] = React.useState<string>('');

  React.useEffect(() => {
    if (!product.isMahaSaleActive || !product.mahaSaleEndTime) return;

    const updateTimer = () => {
      const end = new Date(product.mahaSaleEndTime!).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setTimeRemaining('00h 00m');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [product.isMahaSaleActive, product.mahaSaleEndTime]);

  const availableStock = product.stock.onHand - product.stock.reserved;
  const isOutOfStock = availableStock <= 0;

  const currentPrice = product.dealPrice || product.regularPrice;

  // JE Assured badge governed by 4-Pillar SOP Health (Score 4 & 5 Eligible to Go Live with Maha Sale & Normally)
  const jeHealth = getProductJeAssuredHealth(product);
  const isAssuredBadge =
    settings.assuredBadgeEnabled !== false &&
    jeHealth.isLiveWithBadge &&
    jeHealth.roundedScore >= 4;
  const assuredBadgeName = settings.assuredBadgeName || 'JE Assured';
  const assuredBadgeBg = settings.assuredBadgeColor || 'linear-gradient(90deg, #c2185b 0%, #e53935 100%)';

  // Calculate Bank / UPI offer price (~5% extra instant discount)
  const offerPrice = Math.max(1, Math.round(currentPrice * 0.95));
  const offerType = index % 2 === 0 ? 'with Bank offer' : 'with UPI offer';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div
      onClick={handleQuickView}
      className="group cursor-pointer flex flex-col w-full max-w-full min-w-0 select-none"
    >
      {/* Product Image Card (Tall Rounded Container matching screenshot) */}
      <div className="relative w-full aspect-[4/5] rounded-2xl bg-[#f3f4f6] overflow-hidden mb-2">
        <img
          src={
            product.images[0] ||
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'
          }
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top-Left Badges: Supports both MAHA SALE and JE Assured simultaneously or individually */}
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
          {product.isMahaSaleActive && (
            <div className="px-2 py-0.5 rounded-lg bg-linear-to-r from-rose-600 via-rose-500 to-amber-500 text-white text-[10px] sm:text-[11px] font-black tracking-tight shadow-md flex items-center gap-1 animate-pulse">
              <Flame className="w-3 h-3 fill-white" />
              <span>MAHA SALE</span>
            </div>
          )}
          {isAssuredBadge && (
            <div
              className="px-2.5 py-0.5 rounded-lg text-white text-[10px] sm:text-xs font-bold tracking-tight shadow-xs flex items-center gap-1"
              style={{
                background: assuredBadgeBg,
              }}
            >
              <span>{assuredBadgeName}</span>
            </div>
          )}
        </div>

        {/* Share Button (Top-Right next to Add) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowShareModal(true);
          }}
          aria-label={`Share ${product.name}`}
          className="absolute top-2 right-10 sm:right-11 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-xs transition-all bg-white/90 hover:bg-white text-slate-700 opacity-90 group-hover:opacity-100 cursor-pointer"
          title="Shareable Link"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600" />
        </button>

        {/* Subtle Quick-Add Button (Top-Right) */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm transition-all cursor-pointer ${
              addedAnimation
                ? 'bg-emerald-600 text-white scale-105'
                : 'bg-white/90 hover:bg-white text-slate-800 opacity-90 group-hover:opacity-100'
            }`}
          >
            {addedAnimation ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <Plus className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        )}

        {/* Bottom-Left Rating & Reviews Pill (Overlaid on image) */}
        <div className="absolute bottom-2 left-2 z-10 bg-white/95 backdrop-blur-xs rounded-lg px-2 py-0.5 shadow-xs flex items-center gap-1 text-[11px] sm:text-xs">
          <span className="font-bold text-slate-900 tabular-nums">
            {product.rating.toFixed(1)}
          </span>
          <Star className="w-3 h-3 fill-[#16a34a] text-[#16a34a] shrink-0" />
          <span className="text-slate-500 tabular-nums">({product.reviewsCount})</span>
        </div>

        {/* Bottom-Right Live Maha Sale Countdown Timer */}
        {product.isMahaSaleActive && timeRemaining && (
          <div className="absolute bottom-2 right-2 z-10 bg-slate-950/95 text-amber-300 font-mono text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-md border border-rose-500/50 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400 fill-rose-400 animate-pulse" />
            <span>{timeRemaining}</span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-20">
            <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details Below Image (Clean Unboxed Style) */}
      <div className="px-0.5 space-y-0.5 min-w-0">
        {/* Line 1: Bold Brand + Muted Title (No unwanted highlight pills) */}
        <div className="text-xs sm:text-sm truncate leading-snug">
          <span className="font-bold text-slate-900 mr-1.5">{product.brand}</span>
          <span className="font-normal text-slate-500">{product.name}</span>
        </div>

        {/* Line 2: Strikethrough MRP + Selling Price (Clean typography, no text highlight boxes) */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {product.mrp > currentPrice && (
            <span className="text-xs sm:text-sm text-slate-400 line-through tabular-nums">
              {formatINR(product.mrp)}
            </span>
          )}

          <span className="font-extrabold text-slate-900 text-xs sm:text-sm tabular-nums">
            {formatINR(currentPrice)}
          </span>
        </div>

        {/* Line 3: Bank / UPI Offer Price in Royal Blue */}
        <div className="text-[11px] sm:text-xs text-[#1d4ed8] truncate pt-0.5">
          <span className="font-extrabold tabular-nums">{formatINR(offerPrice)}</span>{' '}
          <span className="font-medium">{offerType}</span>
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
