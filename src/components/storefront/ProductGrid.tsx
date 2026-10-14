import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { Product } from '../../types';
import { SlidersHorizontal, ArrowUpDown, X, Tag } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const {
    products,
    selectedCategory,
    searchQuery,
    setSearchQuery,
    selectedBrand,
    setSelectedBrand,
    sortBy,
    setSortBy,
  } = useStore();

  const [activeQuickFilter, setActiveQuickFilter] = useState<
    'all' | 'trending' | 'bestsellers' | 'deals' | 'under2000' | 'new_arrivals'
  >('all');

  // Extract all distinct brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.brand));
    return Array.from(set).sort();
  }, [products]);

  // Filtering & Sorting pipeline
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Published only
      if (p.status !== 'published') return false;

      // 2. Category
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }

      // 3. Brand
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
        return false;
      }

      // 4. Quick filter
      const price = p.dealPrice || p.regularPrice;
      if (activeQuickFilter === 'trending' && !p.isTrending) return false;
      if (activeQuickFilter === 'bestsellers' && !p.isBestSeller) return false;
      if (activeQuickFilter === 'deals' && (!p.dealPrice || p.mrp <= price)) return false;
      if (activeQuickFilter === 'under2000' && price > 2000) return false;
      if (activeQuickFilter === 'new_arrivals' && !p.isNewArrival) return false;

      // 5. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchBrand = p.brand.toLowerCase().includes(query);
        const matchSku = p.sku.toLowerCase().includes(query);
        const matchDesc = p.description.toLowerCase().includes(query);
        if (!matchName && !matchBrand && !matchSku && !matchDesc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.dealPrice || a.regularPrice;
      const priceB = b.dealPrice || b.regularPrice;

      if (sortBy === 'price_low') return priceA - priceB;
      if (sortBy === 'price_high') return priceB - priceA;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'discount') {
        const discA = a.mrp > priceA ? (a.mrp - priceA) / a.mrp : 0;
        const discB = b.mrp > priceB ? (b.mrp - priceB) / b.mrp : 0;
        return discB - discA;
      }
      return 0; // featured default
    });
  }, [products, selectedCategory, selectedBrand, activeQuickFilter, searchQuery, sortBy]);

  return (
    <section id="products-section" className="max-w-7xl mx-auto px-2.5 sm:px-4 mt-5 sm:mt-8 w-full max-w-full min-w-0 box-border">
      {/* Controls Bar: Quick filter tabs & Sort selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200 w-full min-w-0 box-border">
        {/* Quick Filter Buttons (anti-pill interactive controls) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none w-full max-w-full min-w-0">
          <button
            onClick={() => setActiveQuickFilter('all')}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors cursor-pointer min-h-[32px] ${
              activeQuickFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setActiveQuickFilter('deals')}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors cursor-pointer min-h-[32px] ${
              activeQuickFilter === 'deals'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            🔥 Today's Deals
          </button>
          <button
            onClick={() => setActiveQuickFilter('trending')}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors cursor-pointer min-h-[32px] ${
              activeQuickFilter === 'trending'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveQuickFilter('bestsellers')}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors cursor-pointer min-h-[32px] ${
              activeQuickFilter === 'bestsellers'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Best Sellers
          </button>
          <button
            onClick={() => setActiveQuickFilter('under2000')}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors cursor-pointer min-h-[32px] ${
              activeQuickFilter === 'under2000'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Under ₹2,000
          </button>
        </div>

        {/* Right side controls: Brand dropdown & Sort selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
          {/* Brand select */}
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 flex-1 sm:flex-initial">
            <span className="hidden sm:inline">Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full sm:w-auto bg-white border border-slate-200 rounded-md px-2 py-1.5 text-[11px] sm:text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer min-h-[32px]"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 flex-1 sm:flex-initial">
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-white border border-slate-200 rounded-md px-2 py-1.5 text-[11px] sm:text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer min-h-[32px]"
            >
              <option value="featured">Featured First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search feedback banner */}
      {(searchQuery || selectedBrand !== 'all' || activeQuickFilter !== 'all') && (
        <div className="mt-3 flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong>{filteredProducts.length}</strong> matching products
              {searchQuery && <> for "<strong>{searchQuery}</strong>"</>}
              {selectedBrand !== 'all' && <> from <strong>{selectedBrand}</strong></>}
            </span>
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBrand('all');
              setActiveQuickFilter('all');
            }}
            className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 mt-4 sm:mt-6 w-full max-w-full min-w-0">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 mt-6">
          <Tag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or clearing selected brand/category filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBrand('all');
              setActiveQuickFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            View All Products
          </button>
        </div>
      )}
    </section>
  );
};
