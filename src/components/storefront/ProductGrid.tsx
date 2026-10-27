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
    activeBudgetFilter,
    setActiveBudgetFilter,
    activeActivityFilter,
    setActiveActivityFilter,
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

      // 4b. Budget filter from Price Sale Base
      if (activeBudgetFilter !== null && price > activeBudgetFilter) return false;

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

  const quickFilterTabs: {
    id: 'all' | 'trending' | 'bestsellers' | 'deals' | 'under2000' | 'new_arrivals';
    label: string;
  }[] = [
    { id: 'all', label: 'All Products' },
    { id: 'trending', label: 'Trending' },
    { id: 'bestsellers', label: 'Best Sellers' },
    { id: 'deals', label: 'Special Deals' },
    { id: 'under2000', label: 'Under ₹2,000' },
    { id: 'new_arrivals', label: 'New Arrivals' },
  ];

  return (
    <section
      id="products-section"
      className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-5 w-full max-w-full min-w-0 box-border"
    >
      {/* Store Catalog Tab-Based Menu & Filter Bar */}
      <div className="mb-4 bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {quickFilterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveQuickFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeQuickFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Brand & Sort Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Active Filter Status Bar (Only shown when search/brand/budget filter is active) */}
        {(searchQuery || selectedBrand !== 'all' || activeQuickFilter !== 'all' || activeBudgetFilter !== null) && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 truncate">
              <span>
                Showing <strong>{filteredProducts.length}</strong> items
                {searchQuery && <> for &ldquo;<strong>{searchQuery}</strong>&rdquo;</>}
                {selectedBrand !== 'all' && <> in <strong>{selectedBrand}</strong></>}
                {activeBudgetFilter !== null && <> in <strong>Value 365</strong></>}
              </span>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedBrand('all');
                setActiveQuickFilter('all');
                setActiveBudgetFilter(null);
              }}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold shrink-0 cursor-pointer ml-2"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Products Grid (2 columns on mobile matching reference screenshot) */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-7 w-full max-w-full min-w-0">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
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
