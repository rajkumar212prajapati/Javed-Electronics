import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { Layers, Plus, ShoppingBag, Check, Sparkles, ArrowRight } from 'lucide-react';
import { formatINR } from '../../../utils/currency';
import { ComboBundleItem } from '../../../types';

export const ComboBaseSection: React.FC = () => {
  const {
    homepageSettings,
    products,
    addComboToCart,
  } = useStore();

  const [addedComboId, setAddedComboId] = useState<string | null>(null);

  const section = homepageSettings.sections.find((s) => s.id === 'combo_base');
  const bundles = homepageSettings.comboBundles.filter((b) => b.isActive);

  if (!section || !section.isEnabled) return null;

  const handleAddCombo = (combo: ComboBundleItem) => {
    addComboToCart(combo);
    setAddedComboId(combo.id);
    setTimeout(() => setAddedComboId(null), 2500);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-10 box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
              {section.badge || 'VALUE BUNDLES'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {section.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {section.subtitle}
          </p>
        </div>
      </div>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {bundles.map((bundle) => {
          const isAdded = addedComboId === bundle.id;

          // Find products in this bundle
          const bundleProds = bundle.productIds
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is typeof products[0] => !!p);

          return (
            <div
              key={bundle.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative group"
            >
              {/* Badge & Savings Tag */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                  {bundle.badge}
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  SAVE {formatINR(bundle.savings)}
                </span>
              </div>

              {/* Combo Title & Tagline */}
              <div className="mb-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                  {bundle.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {bundle.tagline}
                </p>
              </div>

              {/* Visual Bundled Products Showcase */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Items Included in this Combo:
                </div>
                <div className="space-y-2">
                  {bundleProds.map((prod, idx) => (
                    <div key={prod.id} className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                        <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatINR(prod.dealPrice || prod.regularPrice)}
                        </span>
                      </div>
                      {idx === 0 && bundleProds.length > 1 && (
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Plus className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Combo Deal Price
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-purple-700 font-mono">
                      {formatINR(bundle.comboPrice)}
                    </span>
                    <span className="text-xs text-slate-400 line-through font-mono">
                      {formatINR(bundle.regularTotal)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddCombo(bundle)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] shadow-sm ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                  <span>{isAdded ? 'Added Both!' : 'Add Combo'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
