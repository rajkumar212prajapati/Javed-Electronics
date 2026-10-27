import React from 'react';
import { useStore } from '../../../context/StoreContext';
import { FestivalCampaignRecord } from '../../../types/festivalCampaign';
import { ProductCategory } from '../../../types';
import {
  Smartphone,
  Headphones,
  Zap,
  Watch,
  Tv,
  Laptop,
  Home,
  Coffee,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface Props {
  campaign: FestivalCampaignRecord;
}

export const FestivalFeaturedCategories: React.FC<Props> = ({ campaign }) => {
  const { categories, selectedCategory, setSelectedCategory } = useStore();

  const featuredIds = campaign.featured_category_ids || [];
  const displayCategories = categories.filter((c) =>
    featuredIds.length > 0 ? featuredIds.includes(c.id) : true
  );

  if (displayCategories.length === 0) return null;

  const getCategoryIcon = (catId: ProductCategory) => {
    switch (catId) {
      case 'smartphones':
        return <Smartphone className="w-5 h-5 text-amber-600" />;
      case 'audio':
        return <Headphones className="w-5 h-5 text-purple-600" />;
      case 'chargers_cables':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'smartwatches':
        return <Watch className="w-5 h-5 text-emerald-600" />;
      case 'tvs_accessories':
        return <Tv className="w-5 h-5 text-rose-600" />;
      case 'computer_accessories':
        return <Laptop className="w-5 h-5 text-blue-600" />;
      case 'home_electronics':
        return <Home className="w-5 h-5 text-indigo-600" />;
      case 'small_appliances':
        return <Coffee className="w-5 h-5 text-orange-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-600" />;
    }
  };

  const handleCategoryClick = (catId: ProductCategory) => {
    setSelectedCategory(selectedCategory === catId ? 'all' : catId);
    const target = document.getElementById('products-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-8 box-border">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {campaign.festival_name} HIGHLIGHTS
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Featured Festival Categories
          </h2>
          <p className="text-xs text-slate-500">
            Specially discounted categories with official warranty & festive gifts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {displayCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-2">
                {getCategoryIcon(cat.id)}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {cat.description}
                </p>
              </div>
              <div className="mt-2 text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                <span>Explore Deals</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
