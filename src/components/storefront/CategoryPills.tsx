import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCategory } from '../../types';
import {
  Smartphone,
  Headphones,
  Zap,
  Watch,
  Tv,
  Laptop,
  Home,
  Coffee,
  LayoutGrid,
} from 'lucide-react';

export const CategoryPills: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory } = useStore();

  const getCategoryIcon = (catId: ProductCategory | 'all') => {
    switch (catId) {
      case 'smartphones':
        return <Smartphone className="w-3.5 h-3.5 shrink-0" />;
      case 'audio':
        return <Headphones className="w-3.5 h-3.5 shrink-0" />;
      case 'chargers_cables':
        return <Zap className="w-3.5 h-3.5 shrink-0" />;
      case 'smartwatches':
        return <Watch className="w-3.5 h-3.5 shrink-0" />;
      case 'tvs_accessories':
        return <Tv className="w-3.5 h-3.5 shrink-0" />;
      case 'computer_accessories':
        return <Laptop className="w-3.5 h-3.5 shrink-0" />;
      case 'home_electronics':
        return <Home className="w-3.5 h-3.5 shrink-0" />;
      case 'small_appliances':
        return <Coffee className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <LayoutGrid className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-4 mt-5 sm:mt-8 w-full max-w-full min-w-0 box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          Browse by Category
        </h2>
        <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
          Genuine products with official Lucknow store warranty
        </span>
      </div>

      {/* Segmented Category Filter Buttons - smoothly contained horizontal scroll */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full max-w-full min-w-0">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          {getCategoryIcon('all')}
          <span>All Electronics</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
