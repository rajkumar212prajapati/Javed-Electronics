import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { renderCategoryIconByName } from '../admin/CategoryMasterManager';
import {
  ArrowLeft,
  X,
  Search,
  LayoutGrid,
  Tag,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react';
import { matchProductSearch } from '../../utils/searchUtils';

export const FullScreenCategoryModal: React.FC = () => {
  const {
    categories,
    products,
    fullScreenCategory,
    setFullScreenCategory,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    cart,
    setActiveModal,
  } = useStore();

  const [localSearch, setLocalSearch] = useState('');
  const [localSort, setLocalSort] = useState<
    'featured' | 'price_low' | 'price_high' | 'discount' | 'rating'
  >('featured');

  const activeCatId = fullScreenCategory || selectedCategory;
  const activeCatObj = useMemo(
    () => categories.find((c) => c.id === activeCatId),
    [categories, activeCatId]
  );

  const subCategories = activeCatObj?.subCategories || [];

  const matchingProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.status !== 'published') return false;
        if (activeCatId && activeCatId !== 'all' && p.categoryId !== activeCatId) {
          return false;
        }
        if (
          selectedSubCategory !== 'all' &&
          p.subCategoryId &&
          p.subCategoryId !== selectedSubCategory
        ) {
          return false;
        }
        if (localSearch.trim()) {
          const matchResult = matchProductSearch(p, localSearch);
          if (!matchResult.matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priceA = a.dealPrice || a.regularPrice;
        const priceB = b.dealPrice || b.regularPrice;
        if (localSort === 'price_low') return priceA - priceB;
        if (localSort === 'price_high') return priceB - priceA;
        if (localSort === 'rating') return b.rating - a.rating;
        if (localSort === 'discount') {
          const discA = a.mrp > priceA ? (a.mrp - priceA) / a.mrp : 0;
          const discB = b.mrp > priceB ? (b.mrp - priceB) / b.mrp : 0;
          return discB - discA;
        }

        if (localSearch.trim()) {
          const scoreA = matchProductSearch(a, localSearch).score;
          const scoreB = matchProductSearch(b, localSearch).score;
          if (scoreB !== scoreA) return scoreB - scoreA;
        }

        return 0;
      });
  }, [products, activeCatId, selectedSubCategory, localSearch, localSort]);

  if (!fullScreenCategory) return null;

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setFullScreenCategory(catId);
    setSelectedSubCategory('all');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-150">
      {/* Top Sticky Full-Screen Header */}
      <div className="bg-white border-b border-slate-200 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col gap-3">
          {/* Row 1: Back Button + Category Banner Info + Search + Cart + Close */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setFullScreenCategory(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Store</span>
              </button>

              {activeCatObj ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  {activeCatObj.imageUrl ? (
                    <img
                      src={activeCatObj.imageUrl}
                      alt={activeCatObj.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      {renderCategoryIconByName(activeCatObj.iconName, 'w-5 h-5')}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                        {activeCatObj.name}
                      </h1>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {matchingProducts.length} Items
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                      {activeCatObj.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-sm sm:text-lg font-black text-slate-900">
                        All Store Categories ({categories.length})
                      </h1>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        {matchingProducts.length} Items
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 hidden sm:block">
                      Select any category or subcategory to browse all available items in full screen
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Controls: Search + Sort + Cart + Close */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative hidden md:block w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={`Search in ${activeCatObj ? activeCatObj.name : 'all categories'}...`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <select
                value={localSort}
                onChange={(e) => setLocalSort(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
                <option value="rating">Top Rated</option>
              </select>

              <button
                type="button"
                onClick={() => setActiveModal('cart')}
                className="relative p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFullScreenCategory(null)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                title="Close Full Screen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Search Input */}
          <div className="relative md:hidden">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={`Search in ${activeCatObj ? activeCatObj.name : 'all categories'}...`}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Row 2: Horizontal All Categories Switcher with Category Images / Icons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeCatId === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Categories ({categories.length})</span>
            </button>

            {categories.map((cat) => {
              const isSelected = activeCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`shrink-0 flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-6 h-6 rounded-lg object-cover shrink-0 bg-slate-100"
                    />
                  ) : (
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {renderCategoryIconByName(cat.iconName, 'w-3.5 h-3.5')}
                    </span>
                  )}
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Row 3: Linked Subcategories Visual Cards Strip (with Subcategory Images!) */}
          {activeCatId !== 'all' && subCategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 border-t border-slate-100 scrollbar-none">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">
                Subcategories:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubCategory('all')}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  selectedSubCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All {activeCatObj?.name}
              </button>

              {subCategories.map((sub) => {
                const isSubSelected = selectedSubCategory === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubCategory(sub.id)}
                    className={`shrink-0 flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                      isSubSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40'
                    }`}
                  >
                    {sub.imageUrl ? (
                      <img
                        src={sub.imageUrl}
                        alt={sub.name}
                        className="w-6 h-6 rounded-lg object-cover shrink-0 bg-slate-100"
                      />
                    ) : (
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isSubSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                        }`}
                      >
                        {renderCategoryIconByName(
                          sub.iconName || activeCatObj?.iconName,
                          'w-3.5 h-3.5'
                        )}
                      </span>
                    )}
                    <span className="whitespace-nowrap">{sub.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Full-Screen Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-6">
          {/* When viewing 'all', show All Categories Visual Cards Grid so user can tap any category */}
          {activeCatId === 'all' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Shop by Category ({categories.length})
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Tap a category to view all its items &amp; subcategories
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {categories.map((cat) => {
                  const count = products.filter(
                    (p) => p.status === 'published' && p.categoryId === cat.id
                  ).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className="group bg-white hover:bg-indigo-50/40 rounded-2xl border border-slate-200 hover:border-indigo-300 p-2.5 text-left transition-all shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between"
                    >
                      <div className="w-full h-24 rounded-xl bg-slate-100 overflow-hidden mb-2 relative">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-600 bg-indigo-50">
                            {renderCategoryIconByName(cat.iconName, 'w-8 h-8')}
                          </div>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold">
                          {count} items
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-700 truncate">
                          {cat.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 truncate">
                          {(cat.subCategories || []).length} Subcategories
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full-Screen Products Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                {activeCatObj ? `${activeCatObj.name} Products` : 'All Available Products'} (
                {matchingProducts.length})
              </h2>
              {selectedSubCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedSubCategory('all')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Clear Subcategory Filter
                </button>
              )}
            </div>

            {matchingProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 pb-12">
                {matchingProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-4">
                <Tag className="w-10 h-10 text-slate-400 mx-auto mb-2.5" />
                <h3 className="text-base font-extrabold text-slate-900">
                  No items found in {activeCatObj ? activeCatObj.name : 'this selection'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Try clearing the subcategory or search filter, or switch to another category above.
                </p>
                <div className="flex items-center justify-center gap-2.5 mt-4">
                  {(selectedSubCategory !== 'all' || localSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubCategory('all');
                        setLocalSearch('');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Show All in {activeCatObj?.name || 'Category'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('all')}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Browse All Categories
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
