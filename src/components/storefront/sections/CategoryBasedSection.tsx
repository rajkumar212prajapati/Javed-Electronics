import React from 'react';
import { useStore } from '../../../context/StoreContext';
import { HomepageSection, ProductCategory } from '../../../types';
import { renderCategoryIconByName } from '../../admin/CategoryMasterManager';
import { Check, LayoutGrid } from 'lucide-react';

export const CategoryBasedSection: React.FC<{ section?: HomepageSection }> = ({ section }) => {
  const {
    categories,
    products,
    selectedCategory,
    setSelectedCategory,
    setFullScreenCategory,
    homepageSettings,
  } = useStore();

  const resolvedSection =
    section ||
    homepageSettings.sections.find((s) => s.id === 'category_based') || {
      title: 'Shop by Category',
      subtitle: 'Browse all verified product categories and subcategories',
    };

  const handleSelectCategory = (catId: ProductCategory) => {
    const nextCat = selectedCategory === catId ? 'all' : catId;
    setSelectedCategory(nextCat);
    setFullScreenCategory(catId);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 pt-6 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
            All Categories ({categories.length})
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {resolvedSection.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{resolvedSection.subtitle}</p>
        </div>

        <button
          onClick={() => setFullScreenCategory('all')}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 self-start sm:self-auto cursor-pointer flex items-center gap-1"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Explore All in Full Screen</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const liveCount = products.filter(
            (p) => p.status === 'published' && p.categoryId === cat.id
          ).length;

          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`group relative rounded-2xl p-3 text-left transition-all cursor-pointer border overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-900 shadow-2xs hover:border-blue-300'
              }`}
            >
              <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 mb-2.5 relative flex items-center justify-center">
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-indigo-600">
                    {renderCategoryIconByName(cat.iconName, 'w-7 h-7')}
                  </div>
                )}
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div>
                <h3
                  className={`text-xs font-extrabold leading-snug line-clamp-1 ${
                    isSelected ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'
                  }`}
                >
                  {cat.name}
                </h3>
                <p
                  className={`text-[10px] mt-0.5 font-medium ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {liveCount} {liveCount === 1 ? 'Item' : 'Items'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
