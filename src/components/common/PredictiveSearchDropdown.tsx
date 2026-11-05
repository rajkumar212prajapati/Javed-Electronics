import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  Search,
  ArrowRight,
  TrendingUp,
  Tag,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  buildPredictiveSuggestions,
  PredictiveSearchResult,
  CategorySuggestion,
} from '../../utils/searchUtils';
import { renderCategoryIconByName } from '../admin/CategoryMasterManager';
import { Product } from '../../types';

interface PredictiveSearchDropdownProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSuggestion: (text: string) => void;
  onSelectCategory: (categoryId: string, isSubCategory?: boolean) => void;
  onSelectBrand: (brand: string) => void;
}

const TRENDING_CATALOGUE_SEARCHES = [
  'FOXIN mobile charger',
  'Anker 65W GaN Charger',
  'boAt Airdopes Earbuds',
  'Samsung Galaxy 5G',
  'Redmi Note 13 Pro',
  'Xiaomi 43" 4K Smart TV',
  'AMOLED Smartwatch',
  'Type-C Fast Cable',
];

const RECENT_SEARCHES_STORAGE_KEY = 'je_recent_store_searches_v1';

export const saveRecentSearch = (term: string) => {
  if (!term || !term.trim()) return;
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((s) => s.toLowerCase() !== term.toLowerCase().trim());
    const updated = [term.trim(), ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
};

export const getRecentSearches = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
  } catch {}
};

/**
 * Highlights the matching query substring inside a suggestion string.
 */
const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query || !query.trim()) return <span>{text}</span>;

  const q = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const matchIndex = lowerText.indexOf(q);

  if (matchIndex === -1) {
    // Check individual tokens
    const tokens = q.split(/\s+/).filter(Boolean);
    const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          tokens.some((tok) => tok.toLowerCase() === part.toLowerCase()) ? (
            <span key={i} className="font-extrabold text-blue-600 bg-blue-50/80 px-0.5 rounded">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  }

  const before = text.slice(0, matchIndex);
  const matched = text.slice(matchIndex, matchIndex + q.length);
  const after = text.slice(matchIndex + q.length);

  return (
    <span>
      {before}
      <span className="font-extrabold text-blue-600 bg-blue-50/80 px-0.5 rounded">
        {matched}
      </span>
      {after}
    </span>
  );
};

export const PredictiveSearchDropdown: React.FC<PredictiveSearchDropdownProps> = ({
  query,
  isOpen,
  onClose,
  onSelectSuggestion,
  onSelectCategory,
  onSelectBrand,
}) => {
  const { products, categories, setSelectedProductForDetail, setActiveModal } = useStore();

  const recentSearches = useMemo(() => getRecentSearches(), [isOpen]);

  const suggestions: PredictiveSearchResult = useMemo(() => {
    return buildPredictiveSuggestions(query, products, categories);
  }, [query, products, categories]);

  if (!isOpen) return null;

  const isQueryEmpty = !query.trim();

  const handleProductClick = (product: Product) => {
    saveRecentSearch(product.name);
    setSelectedProductForDetail(product);
    setActiveModal('product_detail');
    onClose();
  };

  const handleSuggestionClick = (text: string) => {
    saveRecentSearch(text);
    onSelectSuggestion(text);
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl border border-slate-200/95 shadow-2xl overflow-hidden max-h-[82vh] overflow-y-auto text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150"
      onMouseDown={(e) => {
        // Prevent search input from prematurely blurring before click triggers
        e.preventDefault();
      }}
    >
      {/* ========================================================================= */}
      {/* 1. EMPTY QUERY STATE: Recent Searches & Trending Searches & Top Categories */}
      {/* ========================================================================= */}
      {isQueryEmpty && (
        <div className="p-3.5 sm:p-4 space-y-4">
          {/* Recent Searches (if available) */}
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recent Searches</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearRecentSearches();
                    onClose();
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear history
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-950 border border-slate-200 hover:border-yellow-300 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-2xs"
                  >
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Catalogue Searches */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span>Trending in Lucknow Store Catalogue</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TRENDING_CATALOGUE_SEARCHES.map((term, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(term)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-950 border border-yellow-200/90 hover:border-yellow-400 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <Search className="w-3 h-3 text-sky-600" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Categories Shortcut Grid */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Browse Popular Departments
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.slice(0, 4).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id, false)}
                  className="p-2 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200 hover:border-yellow-300 text-left flex items-center gap-2 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 border border-yellow-300 flex items-center justify-center shrink-0">
                    {renderCategoryIconByName(cat.iconName, 'w-3.5 h-3.5')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-sky-950 truncate">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {cat.itemCount || 3}+ items
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACTIVE SEARCH QUERY STATE: Words, Categories, Brands & Instant Products */}
      {/* ========================================================================= */}
      {!isQueryEmpty && (
        <div className="divide-y divide-slate-100">
          {/* Header Feedback Bar */}
          <div className="px-3.5 py-2.5 bg-slate-50/80 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">
                Showing matching catalogue results for{' '}
                <strong className="text-slate-900 font-bold">&ldquo;{query}&rdquo;</strong>
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 shrink-0 font-bold">
              {suggestions.totalMatchesCount} found
            </span>
          </div>

          {/* Did You Mean (Typo Suggestion) */}
          {suggestions.didYouMean && (
            <div className="px-3.5 py-2 bg-amber-50/90 border-b border-amber-200/80 text-xs text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Did you mean:</span>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestions.didYouMean!)}
                  className="font-bold underline text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  {suggestions.didYouMean}
                </button>
              </div>
              <span className="text-[10px] text-amber-700 font-semibold">Catalogue match</span>
            </div>
          )}

          {/* Similar Words & Search Suggestions from Catalogue */}
          {suggestions.similarWords.length > 0 && (
            <div className="p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1 mb-1">
                Similar Words from Catalogue
              </span>
              <div className="space-y-0.5">
                {suggestions.similarWords.map((word, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(word)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-50 text-slate-800 hover:text-sky-950 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-700 shrink-0" />
                      <span className="truncate">
                        <HighlightMatch text={word} query={query} />
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-sky-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Categories & Subcategories */}
          {suggestions.matchingCategories.length > 0 && (
            <div className="p-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Matching Categories &amp; Departments
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {suggestions.matchingCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(cat.id, cat.isSubCategory)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/90 hover:border-yellow-300 text-left flex items-center justify-between gap-2 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-800 border border-yellow-300 flex items-center justify-center shrink-0">
                        {renderCategoryIconByName(cat.iconName, 'w-3 h-3')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-sky-950 truncate">
                          <HighlightMatch text={cat.name} query={query} />
                        </div>
                        {cat.parentName && (
                          <div className="text-[10px] text-slate-500 truncate">
                            in {cat.parentName}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                      {cat.itemCount || 1}+ items
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Brands */}
          {suggestions.matchingBrands.length > 0 && (
            <div className="p-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Matching Brands
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.matchingBrands.map((b) => (
                  <button
                    key={b.brand}
                    type="button"
                    onClick={() => onSelectBrand(b.brand)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-950 border-2 border-yellow-300 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs"
                  >
                    <Tag className="w-3 h-3 text-sky-800" />
                    <span>
                      <HighlightMatch text={b.brand} query={query} />
                    </span>
                    <span className="text-[10px] font-normal text-sky-800">
                      ({b.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Instant Product Cards (Matching Products) */}
          {suggestions.matchingProducts.length > 0 ? (
            <div className="p-3 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Products Matching &ldquo;{query}&rdquo;
              </span>
              <div className="space-y-1.5">
                {suggestions.matchingProducts.map((p) => {
                  const currentPrice = p.dealPrice || p.regularPrice;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductClick(p)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50/80 border border-slate-200 hover:border-yellow-300 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80'}
                          alt={p.name}
                          className="w-11 h-11 object-contain rounded-lg bg-white border border-slate-200 p-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-sky-900 bg-sky-100 px-1.5 py-0.2 rounded border border-yellow-200">
                              {p.brand}
                            </span>
                            {p.subCategoryName && (
                              <span className="text-[10px] text-slate-500 truncate">
                                {p.subCategoryName}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-sky-950 truncate mt-0.5">
                            <HighlightMatch text={p.name} query={query} />
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 truncate">
                            SKU: {p.sku}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-slate-900 font-mono text-xs sm:text-sm">
                          {formatINR(currentPrice)}
                        </div>
                        {p.mrp > currentPrice && (
                          <div className="text-[10px] text-slate-400 line-through font-mono">
                            {formatINR(p.mrp)}
                          </div>
                        )}
                        <span className="text-[10px] text-sky-800 font-bold group-hover:underline flex items-center justify-end gap-0.5 mt-0.5">
                          <span>View</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 space-y-1.5">
              <Search className="w-8 h-8 text-slate-300 mx-auto stroke-[1.5]" />
              <div className="text-xs font-bold text-slate-700">
                No direct product matches for &ldquo;{query}&rdquo;
              </div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Try searching for broader keywords like &ldquo;charger&rdquo;, &ldquo;mobile&rdquo;, &ldquo;earbuds&rdquo;, or &ldquo;TV&rdquo;.
              </p>
            </div>
          )}

          {/* Footer Action: View All Full Results */}
          <div className="p-2.5 bg-slate-50 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleSuggestionClick(query)}
              className="w-full py-2 px-3 bg-sky-200 hover:bg-sky-300 text-sky-950 border-2 border-yellow-400 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>
                Search &ldquo;{query}&rdquo; in All Catalogue ({suggestions.totalMatchesCount} items)
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
