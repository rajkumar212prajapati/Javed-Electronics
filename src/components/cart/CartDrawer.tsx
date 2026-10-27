import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Tag,
  Truck,
  MessageCircle,
  Percent,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartCouponDiscount,
    cartBulkDiscount,
    cartDeliveryFee,
    cartTaxAmount,
    cartFinalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    settings,
    isFreeDeliveryEligible,
    amountNeededForFreeDelivery,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  if (activeModal !== 'cart') return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError(null);
      setCouponInput('');
    }
  };

  const handleProceedCheckout = () => {
    setActiveModal('checkout');
  };

  // Free delivery progress percentage
  const freeDeliveryProgress = Math.min(100, (cartSubtotal / settings.freeDeliveryThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Your Shopping Cart</h2>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((t, i) => t + i.quantity, 0)} items
            </span>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Bar */}
        {cart.length > 0 && (
          <div className="bg-blue-50/80 px-4 py-2.5 border-b border-blue-100">
            <div className="flex items-center justify-between text-xs font-medium text-blue-900 mb-1">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                {isFreeDeliveryEligible ? (
                  <span className="text-emerald-700 font-bold">You unlocked FREE local delivery!</span>
                ) : (
                  <span>Add {formatINR(amountNeededForFreeDelivery)} more for FREE Delivery</span>
                )}
              </span>
              <span className="font-semibold">{Math.round(freeDeliveryProgress)}%</span>
            </div>
            <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isFreeDeliveryEligible ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Bulk Volume Discount Status & Upsell Banner */}
        {cart.length > 0 && cartBulkDiscount.discountAmount > 0 && (
          <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-indigo-900 block truncate">
                  Bulk Tier: {cartBulkDiscount.ruleName}
                </span>
                <span className="text-[10px] text-indigo-700">
                  {cartBulkDiscount.eligibleItemCount} eligible items in cart
                </span>
              </div>
            </div>
            <span className="font-mono font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 shrink-0">
              -{formatINR(cartBulkDiscount.discountAmount)}
            </span>
          </div>
        )}

        {/* Next Tier Upsell Hint */}
        {cart.length > 0 && cartBulkDiscount.nextTierHint && (
          <div className="bg-amber-50 px-4 py-1.5 border-b border-amber-200/80 flex items-center justify-between text-[11px] text-amber-900">
            <span className="flex items-center gap-1 font-semibold truncate">
              <span>🔥 Add <strong>{cartBulkDiscount.nextTierHint.additionalUnitsNeeded} more item{cartBulkDiscount.nextTierHint.additionalUnitsNeeded > 1 ? 's' : ''}</strong> to unlock {cartBulkDiscount.nextTierHint.potentialDiscountPct}% Bulk Savings!</span>
            </span>
            <span className="font-bold text-amber-800 shrink-0 font-mono">
              Save +{formatINR(cartBulkDiscount.nextTierHint.potentialSavings)}
            </span>
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-16 h-16 stroke-1 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Explore our festive electronics deals and discover top smartphones, soundbars, and chargers.
              </p>
              <button
                onClick={() => setActiveModal(null)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const currentPrice = item.product.dealPrice || item.product.regularPrice;
              const maxAvailable = item.product.stock.onHand - item.product.stock.reserved;

              return (
                <div
                  key={`${item.productId}-${item.selectedVariant || ''}`}
                  className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-18 h-18 object-cover rounded-lg bg-white border border-slate-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.selectedVariant && (
                        <span className="text-[11px] text-slate-500 block">
                          Variant: {item.selectedVariant}
                        </span>
                      )}

                      <div className="mt-1 flex items-baseline gap-1.5 font-mono">
                        <span className="text-sm font-bold text-slate-900">
                          {formatINR(currentPrice * item.quantity)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({formatINR(currentPrice)} ea)
                        </span>
                      </div>
                    </div>

                    {/* Quantity modifier */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-300 rounded-md bg-white">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded-l cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-semibold font-mono text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= maxAvailable}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded-r cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {item.quantity >= maxAvailable && (
                        <span className="text-[10px] text-amber-600 font-semibold">
                          Max available: {maxAvailable}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Calculations */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-3">
            {/* Coupon Code Section */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-800 font-mono">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-emerald-700 ml-1.5">
                        (-{formatINR(cartCouponDiscount)})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-emerald-700 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter promo coupon (e.g. FESTIVE500)"
                      className="w-full pl-3 pr-2 py-1.5 text-xs uppercase font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{couponError}</p>
              )}
            </div>

            {/* Financial Totals Breakdown */}
            <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono text-slate-900">{formatINR(cartSubtotal)}</span>
              </div>

              {cartCouponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">-{formatINR(cartCouponDiscount)}</span>
                </div>
              )}

              {cartBulkDiscount.discountAmount > 0 && (
                <div className="flex justify-between text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3 text-indigo-600" />
                    <span>Bulk Order Discount:</span>
                  </span>
                  <span className="font-mono">-{formatINR(cartBulkDiscount.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Estimated Local Delivery:</span>
                <span className="font-mono">
                  {cartDeliveryFee === 0 ? (
                    <span className="text-emerald-600 font-semibold">FREE</span>
                  ) : (
                    formatINR(cartDeliveryFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Estimated GST Included (18%):</span>
                <span className="font-mono">{formatINR(cartTaxAmount)}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Amount:</span>
                <span className="font-mono text-blue-700">{formatINR(cartFinalTotal)}</span>
              </div>
            </div>

            {/* Express Delivery & COD Guarantee Info */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2.5 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Express Shiprocket & Local Rider Delivery</span>
              </div>
              <p className="text-[10px] text-indigo-800 leading-tight">
                Live AWB tracking on order confirmation. Both <strong>Prepaid</strong> &amp; <strong>Cash on Delivery (COD)</strong> supported with OTP verification.
              </p>
            </div>

            {/* Proceed Actions */}
            <div className="pt-2">
              <button
                onClick={handleProceedCheckout}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
