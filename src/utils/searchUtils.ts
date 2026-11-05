import { Product, CategoryItem } from '../types';

/**
 * Normalizes text for clean search comparison.
 */
export const normalizeSearchText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Fast Levenshtein distance algorithm for typo tolerance.
 */
export const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Checks whether a single query token matches a target word (prefix, substring, or typo tolerant).
 */
export const isTokenMatch = (queryToken: string, targetWord: string): boolean => {
  if (!queryToken || !targetWord) return false;
  const q = queryToken.toLowerCase();
  const t = targetWord.toLowerCase();

  // 1. Direct equality, prefix or substring match
  if (t === q || t.startsWith(q) || t.includes(q)) return true;

  // 2. Short tokens (1-2 chars) must be exact prefix or substring to avoid false positives
  if (q.length < 3) return false;

  // 3. Typo tolerance / fuzzy matching
  const maxDistance = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  if (maxDistance > 0 && Math.abs(q.length - t.length) <= maxDistance) {
    if (levenshtein(q, t) <= maxDistance) return true;
  }

  // 4. Common colloquial abbreviation matching (e.g. "chrg" for "charger", "phon" for "phone", "sams" for "samsung")
  if (q.length >= 3 && t.length >= 4) {
    let qIdx = 0;
    for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
      if (t[tIdx] === q[qIdx]) qIdx++;
    }
    if (qIdx === q.length && q.length / t.length >= 0.5) {
      return true;
    }
  }

  return false;
};

export interface ProductMatchResult {
  matches: boolean;
  score: number;
}

/**
 * Multi-token smart fuzzy product matcher for catalogue searching.
 * Supports half-typed words, multiple tokens (e.g. "foxin charger"), brand, sku, categories, specs.
 */
export const matchProductSearch = (product: Product, rawQuery: string): ProductMatchResult => {
  const query = normalizeSearchText(rawQuery);
  if (!query) return { matches: true, score: 0 };

  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { matches: true, score: 0 };

  const nameNorm = normalizeSearchText(product.name);
  const brandNorm = normalizeSearchText(product.brand);
  const skuNorm = normalizeSearchText(product.sku);
  const categoryNorm = normalizeSearchText(product.categoryId);
  const subCategoryNorm = normalizeSearchText(product.subCategoryName || product.subCategoryId || '');
  const modelNorm = normalizeSearchText(product.modelNumber || '');
  const descNorm = normalizeSearchText(product.description || '');

  // Extract all individual words from the product fields
  const allProductWords = Array.from(
    new Set([
      ...nameNorm.split(' '),
      ...brandNorm.split(' '),
      ...subCategoryNorm.split(' '),
      ...categoryNorm.split(' '),
      ...skuNorm.split(' '),
      ...modelNorm.split(' '),
    ].filter(Boolean))
  );

  let totalScore = 0;

  // For multi-token query (e.g. "foxin charger"), EVERY token must match somewhere
  for (const token of tokens) {
    let tokenMatched = false;
    let tokenScore = 0;

    // Direct substring in product name gets highest priority
    if (nameNorm.includes(token)) {
      tokenMatched = true;
      tokenScore += nameNorm.startsWith(token) ? 80 : 50;
    }

    // Direct brand match
    if (brandNorm.includes(token)) {
      tokenMatched = true;
      tokenScore += brandNorm.startsWith(token) ? 60 : 40;
    }

    // Direct category / subcategory match
    if (subCategoryNorm.includes(token) || categoryNorm.includes(token)) {
      tokenMatched = true;
      tokenScore += 35;
    }

    // SKU / Model match
    if (skuNorm.includes(token) || modelNorm.includes(token)) {
      tokenMatched = true;
      tokenScore += 45;
    }

    // Description match
    if (descNorm.includes(token)) {
      tokenMatched = true;
      tokenScore += 15;
    }

    // Fuzzy word match if not matched directly
    if (!tokenMatched) {
      for (const word of allProductWords) {
        if (isTokenMatch(token, word)) {
          tokenMatched = true;
          tokenScore += 25;
          break;
        }
      }
    }

    if (!tokenMatched) {
      return { matches: false, score: 0 };
    }

    totalScore += tokenScore;
  }

  // Boost popular / trending / high rated products slightly
  if (product.isTrending) totalScore += 5;
  if (product.isBestSeller) totalScore += 5;
  if (product.rating >= 4.7) totalScore += 3;

  return { matches: true, score: totalScore };
};

export interface CategorySuggestion {
  id: string;
  name: string;
  parentName?: string;
  isSubCategory: boolean;
  itemCount?: number;
  iconName?: string;
  imageUrl?: string;
}

export interface PredictiveSearchResult {
  similarWords: string[];
  matchingCategories: CategorySuggestion[];
  matchingBrands: { brand: string; count: number }[];
  matchingProducts: Product[];
  didYouMean?: string;
  totalMatchesCount: number;
}

/**
 * Builds intelligent predictive search suggestions from catalogue:
 * - Similar words & phrases (e.g. "foxin charger", "gan wall charger", "fast charger")
 * - Matching categories & subcategories
 * - Matching brands
 * - Instant product cards
 * - Typo-corrected "Did you mean"
 */
export const buildPredictiveSuggestions = (
  rawQuery: string,
  products: Product[],
  categories: CategoryItem[]
): PredictiveSearchResult => {
  const query = normalizeSearchText(rawQuery);
  if (!query) {
    return {
      similarWords: [],
      matchingCategories: [],
      matchingBrands: [],
      matchingProducts: [],
      totalMatchesCount: 0,
    };
  }

  const queryTokens = query.split(/\s+/).filter(Boolean);

  // 1. Gather all published products and score them
  const scoredProducts: { product: Product; score: number }[] = [];
  for (const product of products) {
    if (product.status && product.status !== 'published') continue;
    const match = matchProductSearch(product, query);
    if (match.matches) {
      scoredProducts.push({ product, score: match.score });
    }
  }

  scoredProducts.sort((a, b) => b.score - a.score);
  const matchingProducts = scoredProducts.slice(0, 5).map((x) => x.product);
  const totalMatchesCount = scoredProducts.length;

  // 2. Discover matching Categories & Subcategories
  const matchedCategories: CategorySuggestion[] = [];
  const addedCatIds = new Set<string>();

  for (const cat of categories) {
    const catNameNorm = normalizeSearchText(cat.name);
    const catDescNorm = normalizeSearchText(cat.description || '');

    // Check parent category match
    const catMatches = queryTokens.some((t) => isTokenMatch(t, catNameNorm) || catDescNorm.includes(t));
    if (catMatches && !addedCatIds.has(cat.id)) {
      matchedCategories.push({
        id: cat.id,
        name: cat.name,
        isSubCategory: false,
        itemCount: cat.itemCount || products.filter((p) => p.categoryId === cat.id).length,
        iconName: cat.iconName,
        imageUrl: cat.imageUrl,
      });
      addedCatIds.add(cat.id);
    }

    // Check subcategories
    if (cat.subCategories && cat.subCategories.length > 0) {
      for (const sub of cat.subCategories) {
        const subNameNorm = normalizeSearchText(sub.name);
        if (queryTokens.some((t) => isTokenMatch(t, subNameNorm)) && !addedCatIds.has(sub.id)) {
          matchedCategories.push({
            id: sub.id,
            name: sub.name,
            parentName: cat.name,
            isSubCategory: true,
            itemCount: products.filter((p) => p.subCategoryId === sub.id).length,
            iconName: sub.iconName || cat.iconName,
            imageUrl: sub.imageUrl || cat.imageUrl,
          });
          addedCatIds.add(sub.id);
        }
      }
    }
  }

  // 3. Discover matching Brands
  const brandCountMap = new Map<string, number>();
  for (const p of products) {
    brandCountMap.set(p.brand, (brandCountMap.get(p.brand) || 0) + 1);
  }

  const matchingBrands: { brand: string; count: number }[] = [];
  for (const [brand, count] of brandCountMap.entries()) {
    const brandNorm = normalizeSearchText(brand);
    if (queryTokens.some((t) => isTokenMatch(t, brandNorm))) {
      matchingBrands.push({ brand, count });
    }
  }
  matchingBrands.sort((a, b) => b.count - a.count);

  // 4. Generate high-relevance "Similar Words & Queries" from Catalogue
  const wordCandidateSet = new Set<string>();

  // Add matching product brand + key terms
  for (const p of scoredProducts.slice(0, 10).map((x) => x.product)) {
    // Exact short phrase
    const pTitle = p.name.trim();
    wordCandidateSet.add(pTitle);

    // Brand + generic term (e.g. "FOXIN charger", "Anker charger", "boAt earbuds")
    if (p.subCategoryName) {
      wordCandidateSet.add(`${p.brand} ${p.subCategoryName}`);
    }
    wordCandidateSet.add(`${p.brand} ${p.name.split(' ').slice(1, 4).join(' ')}`);
  }

  // Add matching categories / subcategories names
  for (const c of matchedCategories.slice(0, 4)) {
    wordCandidateSet.add(c.name);
  }

  // Filter and sort candidates by closeness to query
  const similarWords = Array.from(wordCandidateSet)
    .map((phrase) => phrase.replace(/\s+/g, ' ').trim())
    .filter((phrase) => {
      if (!phrase) return false;
      const pNorm = normalizeSearchText(phrase);
      // Ensure the phrase is actually relevant to at least one token
      return queryTokens.some((t) => pNorm.includes(t) || isTokenMatch(t, pNorm));
    })
    .sort((a, b) => {
      const aNorm = normalizeSearchText(a);
      const bNorm = normalizeSearchText(b);
      // Prioritize phrases starting with query
      const aStarts = aNorm.startsWith(query);
      const bStarts = bNorm.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.length - b.length;
    })
    .slice(0, 6);

  // 5. "Did you mean" suggestion if no direct matches found or typo detected
  let didYouMean: string | undefined;
  if (totalMatchesCount === 0 || similarWords.length === 0) {
    const allKnownWords = Array.from(
      new Set([
        'foxin', 'foxin charger', 'charger', 'wall charger', 'fast charger',
        'anker', 'anker charger', 'samsung', 'samsung galaxy', 'redmi',
        'earbuds', 'headphones', 'smartwatch', 'smart tv', 'power bank',
        'cables', 'wireless mouse', 'keyboard', 'adapter', 'bluetooth'
      ])
    );

    let closestWord = '';
    let minDistance = 99;

    for (const kw of allKnownWords) {
      const dist = levenshtein(query, kw);
      if (dist < minDistance && dist <= 3) {
        minDistance = dist;
        closestWord = kw;
      }
    }

    if (closestWord && closestWord !== query) {
      didYouMean = closestWord;
    }
  }

  return {
    similarWords,
    matchingCategories: matchedCategories.slice(0, 4),
    matchingBrands: matchingBrands.slice(0, 4),
    matchingProducts,
    didYouMean,
    totalMatchesCount,
  };
};
