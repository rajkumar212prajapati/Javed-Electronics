import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCategory } from '../../types';
import { renderCategoryIconByName } from '../admin/CategoryMasterManager';
import {
  LayoutGrid,
  Tag,
  Plus,
  Check,
  X,
  Maximize2,
} from 'lucide-react';

export const CategoryPills: React.FC = () => {
  const {
    categories,
    products,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    setFullScreenCategory,
    addCategory,
  } = useStore();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [customFeedback, setCustomFeedback] = useState<string | null>(null);

  const currentCatObj = categories.find((c) => c.id === selectedCategory);
  const currentSubCategories = currentCatObj?.subCategories || [];

  const handleCategoryClick = (catId: ProductCategory | 'all') => {
    setSelectedCategory(catId);
    setSelectedSubCategory('all');
    if (catId !== 'all') {
      setFullScreenCategory(catId);
    }
  };

  const handleApplyCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customCatInput.trim();
    if (!clean) return;

    const res = addCategory({
      name: clean,
      description: `${clean} products and custom collections`,
    });

    if (res.success && res.category) {
      setSelectedCategory(res.category.id);
      setCustomFeedback(`Category "${res.category.name}" active`);
      setTimeout(() => {
        setCustomFeedback(null);
        setShowCustomModal(false);
        setCustomCatInput('');
      }, 1000);
    }
  };

  return (
    <section
      id="categories-section"
      className="max-w-7xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6 w-full max-w-full min-w-0 box-border"
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-2xs space-y-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Shop by Category
            </h2>
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              All {categories.length} Categories
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFullScreenCategory(selectedCategory === 'all' ? 'all' : selectedCategory)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen View</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Category</span>
            </button>
          </div>
        </div>

        {/* All Categories Visual Grid (Shows ALL categories with Image or Icon) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const itemCount = products.filter(
              (p) => p.status === 'published' && p.categoryId === cat.id
            ).length;
            const subCount = (cat.subCategories || []).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`group rounded-2xl border p-2 sm:p-2.5 text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50/70 hover:bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-200/70 mb-2 relative flex items-center justify-center">
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
                  <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-white/90 backdrop-blur-xs text-indigo-600 shadow-2xs flex items-center justify-center">
                    {renderCategoryIconByName(cat.iconName, 'w-3.5 h-3.5')}
                  </span>
                </div>

                <div className="w-full min-w-0">
                  <h3
                    className={`text-xs font-extrabold truncate ${
                      isSelected ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'
                    }`}
                  >
                    {cat.name}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                    {subCount > 0 ? `${subCount} Subcategories` : `${itemCount} Items`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Filter Bar for All Categories & Active Subcategories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategoryClick('all')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Products</span>
          </button>

          {selectedCategory !== 'all' && currentSubCategories.length > 0 && (
            <>
              <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider ml-2 mr-1">
                {currentCatObj?.name} Subcategories:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubCategory('all')}
                className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All {currentCatObj?.name}
              </button>
              {currentSubCategories.map((sub) => {
                const isSubSelected = selectedSubCategory === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubCategory(sub.id);
                      setFullScreenCategory(selectedCategory);
                    }}
                    className={`shrink-0 flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSubSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    {sub.imageUrl && (
                      <img
                        src={sub.imageUrl}
                        alt={sub.name}
                        className="w-5 h-5 rounded-md object-cover shrink-0"
                      />
                    )}
                    <span>{sub.name}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Inline Modal for User to Write Their Category Name */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Custom Category Write-In</h3>
                  <p className="text-[11px] text-slate-500">Write your category name to view or list products</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomCatInput('');
                }}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCustomCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={customCatInput}
                  onChange={(e) => setCustomCatInput(e.target.value)}
                  placeholder="e.g. Footwear, Luggage, Sports &amp; Fitness, Handicrafts..."
                  autoFocus
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-semibold"
                />
              </div>

              {customFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{customFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customCatInput.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Create &amp; Filter Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
