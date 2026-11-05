/**
 * Resilient localStorage utility with automatic QuotaExceededError recovery.
 * Prevents application crashes when localStorage exceeds browser quotas (~5MB).
 */

import { CartItem, Product } from '../types';

const DISPOSABLE_STORAGE_KEYS = [
  'je_retail_store_stockMovements',
  'je_retail_store_stockTransfers',
  'je_retail_store_financialLedger',
  'je_retail_store_barcodeRecords',
  'je_retail_store_gatewayAuditLogs',
  'je_retail_store_brandingHistory',
  'je_retail_store_platformDocuments',
  'je_retail_store_productReviews',
  'je_pos_recent_receipts',
  'je_pos_quotations',
  'je_pos_held_tickets',
  'je_support_chat_history',
  'je_festival_campaigns_v2',
  'je_search_recent_searches_v1',
];

/**
 * Checks if an error is a QuotaExceededError across different browsers
 */
function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: number; number?: number; message?: string };
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014 ||
    e.number === -2147024882 ||
    (typeof e.message === 'string' && /quota/i.test(e.message))
  );
}

/**
 * Safely writes to localStorage. If a QuotaExceededError occurs,
 * it purges expendable/cache data and retries. Never throws an unhandled exception.
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (isQuotaExceededError(err)) {
      // Step 1: Evict disposable caches one by one and retry
      for (const purgeKey of DISPOSABLE_STORAGE_KEYS) {
        if (purgeKey !== key && localStorage.getItem(purgeKey) !== null) {
          try {
            localStorage.removeItem(purgeKey);
            localStorage.setItem(key, value);
            return true;
          } catch {
            // Keep purging candidates until write succeeds or candidates exhausted
          }
        }
      }

      // Step 2: If value is too big, try trimming whitespace/empty fields if JSON
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 30) {
          // Truncate bulky history/log array to most recent 30 items
          const truncated = JSON.stringify(parsed.slice(-30));
          localStorage.setItem(key, truncated);
          return true;
        }
      } catch {
        // Not a JSON array or unable to trim
      }

      console.warn(`[safeLocalStorageSetItem] Storage quota exceeded while saving key "${key}". Operation skipped safely in-memory.`);
      return false;
    }

    console.warn(`[safeLocalStorageSetItem] Error writing key "${key}":`, err);
    return false;
  }
}

/**
 * Safely reads and parses a JSON value from localStorage.
 */
export function safeLocalStorageGetItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[safeLocalStorageGetItem] Error reading/parsing key "${key}":`, err);
    return fallback;
  }
}

/**
 * Safely removes a key from localStorage without throwing.
 */
export function safeLocalStorageRemoveItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[safeLocalStorageRemoveItem] Error removing key "${key}":`, err);
  }
}

/**
 * Creates a lightweight representation of the cart for localStorage persistence,
 * stripping redundant large image arrays, long specs, and descriptions.
 */
export function serializeCartSafely(cart: CartItem[]): string {
  try {
    const slim = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant,
      product: item.product
        ? {
            id: item.product.id,
            sku: item.product.sku,
            name: item.product.name,
            brand: item.product.brand,
            mrp: item.product.mrp,
            regularPrice: item.product.regularPrice,
            dealPrice: item.product.dealPrice,
            gstRate: item.product.gstRate,
            images: item.product.images?.length ? [item.product.images[0]] : [],
            stock: item.product.stock,
            categoryId: item.product.categoryId,
            warrantyMonths: item.product.warrantyMonths,
            returnEligibleDays: item.product.returnEligibleDays,
          }
        : undefined,
    }));
    return JSON.stringify(slim);
  } catch {
    return '[]';
  }
}

/**
 * Rehydrates a slim cart from localStorage with full product references
 * from the app's current product catalog.
 */
export function rehydrateCartSafely(raw: unknown, allProducts: Product[] = []): CartItem[] {
  if (!Array.isArray(raw)) return [];

  const productMap = new Map<string, Product>();
  for (const prod of allProducts) {
    productMap.set(prod.id, prod);
  }

  const validCartItems: CartItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const pid = String(item.productId || item.product?.id || '');
    if (!pid) continue;

    const fullProduct = productMap.get(pid);
    const resolvedProduct: Product = fullProduct || (item.product as Product);

    if (resolvedProduct && resolvedProduct.id) {
      validCartItems.push({
        productId: pid,
        quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
        selectedVariant: item.selectedVariant,
        product: resolvedProduct,
      });
    }
  }

  return validCartItems;
}
