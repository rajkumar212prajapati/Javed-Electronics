import React from 'react';
import { useStore } from '../../../context/StoreContext';
import { ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const BrandBaseSection: React.FC = () => {
  const {
    homepageSettings,
    selectedBrand,
    setSelectedBrand,
    products,
  } = useStore();

  const section = homepageSettings.sections.find((s) => s.id === 'brand_base');
  const brands = homepageSettings.brands.filter((b) => b.isActive);

  if (!section || !section.isEnabled) return null;

  const handleSelectBrand = (brandName: string) => {
    setSelectedBrand(selectedBrand === brandName ? 'all' : brandName);
    const target = document.getElementById('products-section-anchor');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-10 box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
              {section.badge || 'TOP BRANDS'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {section.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {section.subtitle}
          </p>
        </div>

        {selectedBrand !== 'all' && (
          <button
            onClick={() => setSelectedBrand('all')}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 self-start sm:self-auto cursor-pointer"
          >
            Clear Brand Filter ({selectedBrand}) ✕
          </button>
        )}
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {brands.map((brand) => {
          const isSelected = selectedBrand === brand.name;
          const matchingCount = products.filter((p) => p.brand.toLowerCase() === brand.name.toLowerCase()).length;

          return (
            <div
              key={brand.id}
              onClick={() => handleSelectBrand(brand.name)}
              className={`rounded-xl p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer border text-center select-none ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                  : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
              }`}
            >
              {/* Badge */}
              <div className="flex justify-center mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                  {brand.badge || 'BRAND'}
                </span>
              </div>

              {/* Brand Name / Logo Representation */}
              <div className="my-1.5">
                <span className="text-sm sm:text-base font-black text-slate-900 block truncate">
                  {brand.name}
                </span>
                {brand.discountTag && (
                  <span className="text-[10px] font-extrabold text-indigo-600 block truncate mt-0.5">
                    {brand.discountTag}
                  </span>
                )}
              </div>

              {/* Count & Status */}
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>{matchingCount || brand.productCount || 3} items</span>
                {isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <span className="text-slate-400 text-[9px]">Explore</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
