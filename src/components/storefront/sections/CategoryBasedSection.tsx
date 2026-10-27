import React from 'react';
import { useStore } from '../../../context/StoreContext';
import {
  Smartphone,
  Headphones,
  Zap,
  Watch,
  Tv,
  Laptop,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ProductCategory } from '../../../types';
import { formatINR } from '../../../utils/currency';

export const CategoryBasedSection: React.FC = () => {
  const {
    homepageSettings,
    selectedCategory,
    setSelectedCategory,
  } = useStore();

  const section = homepageSettings.sections.find((s) => s.id === 'category_based');
  const items = homepageSettings.categoryItems.filter((c) => c.isActive);

  if (!section || !section.isEnabled) return null;

  const getCategoryIcon = (catId: ProductCategory) => {
    switch (catId) {
      case 'smartphones':
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'audio':
        return <Headphones className="w-5 h-5 text-purple-600" />;
      case 'chargers_cables':
        return <Zap className="w-5 h-5 text-amber-600" />;
      case 'smartwatches':
        return <Watch className="w-5 h-5 text-emerald-600" />;
      case 'tvs_accessories':
        return <Tv className="w-5 h-5 text-red-600" />;
      case 'computer_accessories':
        return <Laptop className="w-5 h-5 text-indigo-600" />;
      default:
        return <Layers className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleSelectCategory = (catId: ProductCategory) => {
    setSelectedCategory(selectedCategory === catId ? 'all' : catId);
    // Smooth scroll to product grid
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
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {section.badge || 'CATEGORIES'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {section.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {section.subtitle}
          </p>
        </div>

        <button
          onClick={() => setSelectedCategory('all')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visual Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {items.map((cat) => {
          const isSelected = selectedCategory === cat.categoryId;

          return (
            <div
              key={cat.categoryId}
              onClick={() => handleSelectCategory(cat.categoryId)}
              className={`group rounded-xl p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 cursor-pointer border relative select-none ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              {/* Top Badge */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  {getCategoryIcon(cat.categoryId)}
                </div>
                {cat.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 px-1.5 py-0.5 rounded transition-colors">
                    {cat.badge}
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {cat.displayName}
                </h3>
                <span className="text-[11px] font-extrabold text-blue-700 font-mono block mt-0.5">
                  From {formatINR(cat.startingPrice)}
                </span>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                  {cat.tagline}
                </p>
              </div>

              {/* Subcategories tags */}
              {cat.popularSubcategories && cat.popularSubcategories.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  {cat.popularSubcategories.slice(0, 2).map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
