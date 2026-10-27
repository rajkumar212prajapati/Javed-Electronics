import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import { Star, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const {
    addToCart,
    setSelectedProductForDetail,
    setActiveModal,
  } = useStore();

  const [addedAnimation, setAddedAnimation] = React.useState(false);

  const availableStock = product.stock.onHand - product.stock.reserved;
  const isOutOfStock = availableStock <= 0;

  const currentPrice = product.dealPrice || product.regularPrice;

  // Value 365 badge shown on Festive/Value deals or alternating items like in the reference UI
  const isValue365 = product.isFestiveDeal || currentPrice <= 2000 || index % 2 === 1;

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

        {/* Top-Left "Value 365" Badge */}
        {isValue365 && (
          <div
            className="absolute top-2 left-2 z-10 px-2.5 py-0.5 rounded-lg text-white text-[11px] sm:text-xs font-bold tracking-tight shadow-xs"
            style={{
              background: 'linear-gradient(90deg, #c2185b 0%, #e53935 100%)',
            }}
          >
            Value 365
          </div>
        )}

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
        {/* Line 1: Bold Brand + Muted Title on Single Truncated Line */}
        <div className="text-xs sm:text-sm truncate leading-snug">
          <span className="font-bold text-slate-900 mr-1.5">{product.brand}</span>
          <span className="font-normal text-slate-500">{product.name}</span>
        </div>

        {/* Line 2: Strikethrough MRP + Selling Price (Plain or Red-Pink Highlight Pill) */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {product.mrp > currentPrice && (
            <span className="text-xs sm:text-sm text-slate-400 line-through tabular-nums">
              {formatINR(product.mrp)}
            </span>
          )}

          {isValue365 ? (
            <span
              className="px-1.5 py-0.5 rounded-md text-white font-extrabold text-xs sm:text-sm leading-none tabular-nums"
              style={{
                background: 'linear-gradient(90deg, #d81b60 0%, #e53935 100%)',
              }}
            >
              {formatINR(currentPrice)}
            </span>
          ) : (
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm tabular-nums">
              {formatINR(currentPrice)}
            </span>
          )}
        </div>

        {/* Line 3: Bank / UPI Offer Price in Royal Blue */}
        <div className="text-[11px] sm:text-xs text-[#1d4ed8] truncate pt-0.5">
          <span className="font-extrabold tabular-nums">{formatINR(offerPrice)}</span>{' '}
          <span className="font-medium">{offerType}</span>
        </div>

        {/* Color Swatches & Dimensions/Weight Tag */}
        <div className="flex items-center justify-between gap-1 pt-1 text-[10px]">
          {product.colorVariants && product.colorVariants.length > 0 ? (
            <div className="flex items-center gap-1">
              {product.colorVariants.slice(0, 4).map((c, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              {product.colorVariants.length > 4 && (
                <span className="text-[9px] text-slate-400 font-bold">
                  +{product.colorVariants.length - 4}
                </span>
              )}
            </div>
          ) : product.modelNumber ? (
            <span className="font-mono text-slate-500 font-semibold">{product.modelNumber}</span>
          ) : null}

          {(product.lengthCm || product.weightKg) && (
            <span className="text-slate-500 font-mono text-[9px] bg-slate-100 px-1.5 py-0.2 rounded">
              {product.weightKg ? `${product.weightKg}kg` : ''}
              {product.lengthCm ? ` • ${product.lengthCm}×${product.widthCm}cm` : ''}
            </span>
          )}
        </div>

        {/* Multi-Seller Store Availability Tag */}
        {product.sellerListings && product.sellerListings.length > 1 && (
          <div className="text-[10px] text-slate-500 font-medium truncate pt-0.5">
            <span>Sold by <strong className="text-slate-800">{product.sellerListings.length} Lucknow stores</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
