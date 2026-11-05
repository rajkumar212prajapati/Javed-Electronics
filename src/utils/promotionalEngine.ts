import { PromotionalPage, Product } from '../types';

/**
 * Checks if a promotional page is currently active based on its active state and schedule rules.
 */
export function isPromotionalPageCurrentlyActive(promo: PromotionalPage, now: Date = new Date()): boolean {
  if (!promo.isActive) return false;

  const nowTime = now.getTime();

  // 1. Always Active
  if (promo.scheduleType === 'always_active') {
    return true;
  }

  // 2. Specific Date Range
  if (promo.scheduleType === 'date_range') {
    if (promo.startDate && nowTime < new Date(promo.startDate).getTime()) return false;
    if (promo.endDate && nowTime > new Date(promo.endDate).getTime()) return false;
    return true;
  }

  // 3. Recurring Day & Time Slot (e.g. Happy Hours / Weekend Flash)
  if (promo.scheduleType === 'recurring_slot') {
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    if (promo.recurringDays && promo.recurringDays.length > 0 && !promo.recurringDays.includes(currentDay)) {
      return false;
    }

    if (promo.slotStartTime && promo.slotEndTime) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = promo.slotStartTime.split(':').map(Number);
      const [endH, endM] = promo.slotEndTime.split(':').map(Number);
      const startMinutes = (startH || 0) * 60 + (startM || 0);
      const endMinutes = (endH || 0) * 60 + (endM || 0);

      if (startMinutes <= endMinutes) {
        if (currentMinutes < startMinutes || currentMinutes > endMinutes) return false;
      } else {
        // Over-midnight slot (e.g. 22:00 to 02:00)
        if (currentMinutes < startMinutes && currentMinutes > endMinutes) return false;
      }
    }
    return true;
  }

  // 4. Month-End Sale (e.g. last 3 or 4 days of month)
  if (promo.scheduleType === 'month_end') {
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = lastDayOfMonth - currentDay + 1;
    const thresholdDays = promo.monthEndDays || 3;
    return daysRemaining <= thresholdDays;
  }

  // 5. Month-Start Sale (e.g. first 5 days of month)
  if (promo.scheduleType === 'month_start') {
    const currentDay = now.getDate();
    const thresholdDays = promo.monthStartDays || 5;
    return currentDay <= thresholdDays;
  }

  return true;
}

/**
 * Resolves the products visible on a promotional page according to its selection mode and rules.
 */
export function getPromotionalPageProducts(promo: PromotionalPage, allProducts: Product[]): Product[] {
  // Published products only
  const published = allProducts.filter((p) => p.status === 'published');

  if (promo.productSelectionMode === 'manual') {
    if (!promo.selectedProductIds || promo.selectedProductIds.length === 0) {
      // Fallback: If no manual IDs were picked, show products matching basis
      return getFilteredProductsByBasis(promo, published);
    }
    const idSet = new Set(promo.selectedProductIds);
    return published.filter((p) => idSet.has(p.id));
  }

  if (promo.productSelectionMode === 'filter_rule') {
    return getFilteredProductsByRule(promo, published);
  }

  // Hybrid: rule matching + manual IDs prioritized
  const ruleMatches = getFilteredProductsByRule(promo, published);
  const manualMatches = published.filter((p) => promo.selectedProductIds?.includes(p.id));
  const combined = Array.from(new Set([...manualMatches, ...ruleMatches]));
  return combined;
}

function getFilteredProductsByBasis(promo: PromotionalPage, products: Product[]): Product[] {
  if (promo.basisType === 'category' && promo.basisValue) {
    return products.filter((p) => p.categoryId === promo.basisValue);
  }
  if (promo.basisType === 'brand' && promo.basisValue) {
    const brandLower = promo.basisValue.toLowerCase();
    return products.filter((p) => p.brand.toLowerCase() === brandLower);
  }
  if (promo.basisType === 'shop' && promo.basisValue) {
    return products.filter((p) => {
      // If product has seller listing or is stocked in this outlet
      return p.stock.onHand > 0;
    });
  }
  return products;
}

function getFilteredProductsByRule(promo: PromotionalPage, products: Product[]): Product[] {
  let list = getFilteredProductsByBasis(promo, products);

  if (promo.filterRule) {
    const { categoryIds, brands, maxPrice, minDiscountPercentage, onlyInStock } = promo.filterRule;

    if (categoryIds && categoryIds.length > 0) {
      list = list.filter((p) => categoryIds.includes(p.categoryId));
    }

    if (brands && brands.length > 0) {
      const lowerBrands = brands.map((b) => b.toLowerCase());
      list = list.filter((p) => lowerBrands.includes(p.brand.toLowerCase()));
    }

    if (maxPrice !== undefined && maxPrice > 0) {
      list = list.filter((p) => (p.dealPrice || p.regularPrice) <= maxPrice);
    }

    if (minDiscountPercentage !== undefined && minDiscountPercentage > 0) {
      list = list.filter((p) => {
        const price = p.dealPrice || p.regularPrice;
        if (p.mrp <= price) return false;
        const discountPct = Math.round(((p.mrp - price) / p.mrp) * 100);
        return discountPct >= minDiscountPercentage;
      });
    }

    if (onlyInStock) {
      list = list.filter((p) => p.stock.onHand - p.stock.reserved > 0);
    }
  }

  return list;
}

/**
 * Initial sample promotional pages covering all requested bases:
 * Category, Brand, Shop, Festival, Day/Slot, Sale, Month-End, Month-Start.
 */
export const INITIAL_PROMOTIONAL_PAGES: PromotionalPage[] = [
  {
    id: 'promo-day-slot-flash',
    title: 'Weekend 4-Hour Tech Flash Hours',
    slug: 'weekend-flash-hours',
    basisType: 'day_slot',
    basisValue: 'Weekend Slots',
    description: 'Exclusive 4-hour flash clearance with hourly price drops on true wireless audio, fast GaN chargers & flagship phones.',
    isActive: true,
    scheduleType: 'always_active', // active for testing & preview, with slot timing metadata
    recurringDays: [0, 5, 6], // Fri, Sat, Sun
    slotStartTime: '12:00',
    slotEndTime: '23:30',
    bannerImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    bannerHeadline: '⚡ 4-Hour Weekend Flash Hours — Up to 45% Off Tech',
    bannerSubtext: 'Super discounts, zero delivery fees in Nalasopara & Vasai, and ₹100 instant bonus coupon!',
    bannerTheme: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%)',
    badgeText: 'FLASH HOURS LIVE',
    promotionalTickerText: '⚡ Weekend Flash Rush: Use code FLASH500 for flat ₹500 off orders over ₹2,999 • Free delivery within 60 mins from Sai Dham Apt store!',
    homepagePlacements: ['top', 'middle'],
    placementDisplayType: 'strip_banner',
    placementIcon: 'Zap',
    placementText: '⚡ Weekend Flash Hours Live! Flat ₹500 off + Free Delivery in Nalasopara & Vasai',
    priority: 1,
    productSelectionMode: 'manual',
    selectedProductIds: ['prod-001', 'prod-002', 'prod-003', 'prod-004'],
    highlightTag: 'Flash Exclusive',
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-10-31T12:00:00.000Z',
    updatedBy: 'Super Admin',
  },
  {
    id: 'promo-month-end-rush',
    title: 'Month-End Payday Electronics Clearance',
    slug: 'month-end-payday-deals',
    basisType: 'month_end',
    basisValue: 'Month-End Payday',
    description: 'Payday special clearance on home entertainment, AMOLED smartwatches, and computer accessories.',
    isActive: true,
    scheduleType: 'always_active',
    monthEndDays: 4,
    bannerImageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    bannerHeadline: '💰 Month-End Payday Rush — Massive Price Meltdown',
    bannerSubtext: 'Spend your paycheck wisely with genuine brand warranty and JE Assured quality guarantee.',
    bannerTheme: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #0284c7 100%)',
    badgeText: 'PAYDAY SPECIAL',
    promotionalTickerText: '💰 Month-End Payday Rush is ON: Extra 10% instant UPI discount on audio & laptops • 7-day doorstep replacement',
    homepagePlacements: ['middle', 'bottom'],
    placementDisplayType: 'image_banner',
    placementIcon: 'Flame',
    placementText: '💰 Month-End Payday Electronics Deals — Save Up to ₹6,000 Today!',
    priority: 2,
    productSelectionMode: 'hybrid',
    selectedProductIds: ['prod-005', 'prod-006', 'prod-007'],
    filterRule: {
      minDiscountPercentage: 10,
      onlyInStock: true,
    },
    highlightTag: 'Payday Deal',
    createdAt: '2026-10-26T10:00:00.000Z',
    updatedAt: '2026-10-31T12:00:00.000Z',
    updatedBy: 'Super Admin',
  },
  {
    id: 'promo-brand-xiaomi',
    title: 'Official Xiaomi Brand Days Fest',
    slug: 'xiaomi-brand-days',
    basisType: 'brand',
    basisValue: 'Xiaomi',
    description: 'Official Xiaomi & Redmi brand showcase with genuine brand warranty, instant exchange bonus, and fast dispatch.',
    isActive: true,
    scheduleType: 'always_active',
    bannerImageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
    bannerHeadline: '🔥 Xiaomi Brand Days — 200MP Camera Phones & 4K TVs',
    bannerSubtext: 'Authorised retail distributor in Nalasopara & Mumbai MMR with 1-Year brand warranty.',
    bannerTheme: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    badgeText: 'BRAND SPOTLIGHT',
    promotionalTickerText: '🔥 Xiaomi Brand Days: Flat ₹2,000 off on Redmi Note 13 Pro 5G with Bank & UPI offer!',
    homepagePlacements: ['top', 'middle'],
    placementDisplayType: 'icon_text_card',
    placementIcon: 'Sparkles',
    placementText: '🔥 Xiaomi Official Brand Days Live — Lowest prices in Mumbai MMR + JE Assured',
    priority: 3,
    productSelectionMode: 'filter_rule',
    selectedProductIds: ['prod-001', 'prod-005'],
    filterRule: {
      brands: ['Xiaomi'],
      onlyInStock: true,
    },
    highlightTag: 'Brand Official',
    createdAt: '2026-10-27T10:00:00.000Z',
    updatedAt: '2026-10-31T12:00:00.000Z',
    updatedBy: 'Super Admin',
  },
  {
    id: 'promo-category-audio',
    title: 'Earphones, Soundbars & Audio Bonanza',
    slug: 'audio-soundbars-bonanza',
    basisType: 'category',
    basisValue: 'audio',
    description: 'Explore premium noise-canceling earbuds, wireless neckbands and Bluetooth party speakers.',
    isActive: true,
    scheduleType: 'always_active',
    bannerImageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    bannerHeadline: '🎧 Pure Bass & ANC Audio Festival — Starting at ₹899',
    bannerSubtext: 'boAt, Sony, Anker & Boult with 100% genuine JE Assured warranty.',
    bannerTheme: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    badgeText: 'CATEGORY SPECIAL',
    promotionalTickerText: '🎧 Use code AUDIO10 for 10% instant discount on premium soundbars and wireless earbuds!',
    homepagePlacements: ['bottom'],
    placementDisplayType: 'strip_banner',
    placementIcon: 'Gift',
    placementText: '🎧 Audio & Soundbar Bonanza — Starting ₹899 with 1-Hour Hyperlocal Delivery',
    priority: 4,
    productSelectionMode: 'filter_rule',
    selectedProductIds: ['prod-002'],
    filterRule: {
      categoryIds: ['audio'],
      onlyInStock: true,
    },
    highlightTag: 'Audio Fest',
    createdAt: '2026-10-28T10:00:00.000Z',
    updatedAt: '2026-10-31T12:00:00.000Z',
    updatedBy: 'Super Admin',
  },
];
