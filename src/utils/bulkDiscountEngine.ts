import { CartItem, Product, BulkDiscountRule, BulkDiscountTier } from '../types';

export interface EvaluatedBulkDiscount {
  rule: BulkDiscountRule | null;
  ruleId?: string;
  ruleName?: string;
  discountAmount: number;
  matchedTier?: BulkDiscountTier;
  discountPercentage?: number;
  fixedDiscountAmount?: number;
  eligibleItemCount: number;
  eligibleSubtotal: number;
  summaryMessage: string;
  nextTierHint?: {
    requiredQuantity: number;
    additionalUnitsNeeded: number;
    potentialDiscountPct: number;
    potentialSavings: number;
    targetName: string;
  };
}

/**
 * Evaluates the customer's cart against all active bulk discount rules
 * and finds the optimal volume discount for the shopper.
 */
export function evaluateCartBulkDiscount(params: {
  cart: CartItem[];
  rules: BulkDiscountRule[];
  isB2B?: boolean;
  activeOutletId?: string;
  cartSubtotal: number;
}): EvaluatedBulkDiscount {
  const { cart, rules, isB2B = false, activeOutletId = 'out_hazratganj', cartSubtotal } = params;

  if (!cart || cart.length === 0 || !rules || rules.length === 0) {
    return {
      rule: null,
      discountAmount: 0,
      eligibleItemCount: 0,
      eligibleSubtotal: 0,
      summaryMessage: '',
    };
  }

  const nowIso = new Date().toISOString();

  // 1. Filter eligible active rules
  const eligibleRules = rules.filter((r) => {
    if (!r.isActive) return false;
    if (r.startDate && r.startDate > nowIso) return false;
    if (r.endDate && r.endDate < nowIso) return false;

    // Customer type constraint
    if (r.applicableToCustomerType === 'b2b_only' && !isB2B) return false;
    if (r.applicableToCustomerType === 'retail_only' && isB2B) return false;

    // Outlet constraint
    if (r.applicableOutlets && r.applicableOutlets !== 'all') {
      if (Array.isArray(r.applicableOutlets) && !r.applicableOutlets.includes(activeOutletId)) {
        return false;
      }
    }

    return true;
  });

  if (eligibleRules.length === 0) {
    return {
      rule: null,
      discountAmount: 0,
      eligibleItemCount: 0,
      eligibleSubtotal: 0,
      summaryMessage: '',
    };
  }

  // 2. Evaluate each rule to see what discount it yields
  let bestEvaluation: EvaluatedBulkDiscount = {
    rule: null,
    discountAmount: 0,
    eligibleItemCount: 0,
    eligibleSubtotal: 0,
    summaryMessage: '',
  };

  let nearestNextTierHint: EvaluatedBulkDiscount['nextTierHint'] = undefined;

  for (const rule of eligibleRules) {
    let eligibleItems: CartItem[] = [];

    if (rule.targetType === 'entire_order') {
      eligibleItems = cart;
    } else if (rule.targetType === 'category') {
      eligibleItems = cart.filter(
        (it) => it.product.categoryId === rule.targetCategoryId || rule.targetCategoryId === 'all'
      );
    } else if (rule.targetType === 'product') {
      eligibleItems = cart.filter((it) => it.productId === rule.targetProductId);
    }

    const totalEligibleQty = eligibleItems.reduce((acc, it) => acc + it.quantity, 0);
    const eligibleValue = eligibleItems.reduce((acc, it) => {
      const price = it.product.dealPrice || it.product.regularPrice;
      return acc + price * it.quantity;
    }, 0);

    if (totalEligibleQty === 0 || eligibleValue === 0) continue;

    // Check minimum cart value threshold if specified
    if (rule.minOrderValue && cartSubtotal < rule.minOrderValue) {
      continue;
    }

    // Determine tier or base discount
    let appliedDiscountPct = 0;
    let appliedFixedDiscount = 0;
    let matchedTier: BulkDiscountTier | undefined = undefined;
    let qualifies = false;

    // If progressive tiers are configured (e.g. 3-5: 5%, 6-10: 10%, 11+: 15%)
    if (rule.tiers && rule.tiers.length > 0) {
      // Sort tiers descending by minQuantity
      const sortedTiers = [...rule.tiers].sort((a, b) => b.minQuantity - a.minQuantity);
      const activeTier = sortedTiers.find((t) => totalEligibleQty >= t.minQuantity);

      if (activeTier) {
        qualifies = true;
        matchedTier = activeTier;
        appliedDiscountPct = activeTier.discountPercentage || 0;
        appliedFixedDiscount = activeTier.fixedDiscountAmount || 0;
      }

      // Check next tier for upsell hint
      const nextTier = [...rule.tiers]
        .sort((a, b) => a.minQuantity - b.minQuantity)
        .find((t) => t.minQuantity > totalEligibleQty);

      if (nextTier) {
        const unitsNeeded = nextTier.minQuantity - totalEligibleQty;
        const potentialPct = nextTier.discountPercentage || rule.discountValue;
        const potentialSavings = Math.round((eligibleValue * potentialPct) / 100);

        if (!nearestNextTierHint || unitsNeeded < nearestNextTierHint.additionalUnitsNeeded) {
          nearestNextTierHint = {
            requiredQuantity: nextTier.minQuantity,
            additionalUnitsNeeded: unitsNeeded,
            potentialDiscountPct: potentialPct,
            potentialSavings,
            targetName: rule.name,
          };
        }
      }
    } else {
      // Base rule check
      if (totalEligibleQty >= rule.minQuantity) {
        qualifies = true;
        if (rule.discountType === 'percentage') {
          appliedDiscountPct = rule.discountValue;
        } else {
          appliedFixedDiscount = rule.discountValue;
        }
      } else {
        // Did not reach base minQuantity, but check if close for upsell hint
        const unitsNeeded = rule.minQuantity - totalEligibleQty;
        if (unitsNeeded <= 5) {
          const potentialSavings =
            rule.discountType === 'percentage'
              ? Math.round((eligibleValue * rule.discountValue) / 100)
              : rule.discountValue;

          if (!nearestNextTierHint || unitsNeeded < nearestNextTierHint.additionalUnitsNeeded) {
            nearestNextTierHint = {
              requiredQuantity: rule.minQuantity,
              additionalUnitsNeeded: unitsNeeded,
              potentialDiscountPct: rule.discountValue,
              potentialSavings,
              targetName: rule.name,
            };
          }
        }
      }
    }

    if (qualifies) {
      let calculatedDiscount = 0;
      if (appliedDiscountPct > 0) {
        calculatedDiscount = Math.round((eligibleValue * appliedDiscountPct) / 100);
      } else if (appliedFixedDiscount > 0) {
        calculatedDiscount = appliedFixedDiscount;
      }

      // Apply maximum discount cap if specified
      if (rule.maxDiscountAmount && calculatedDiscount > rule.maxDiscountAmount) {
        calculatedDiscount = rule.maxDiscountAmount;
      }

      // Cap discount to not exceed eligible value
      calculatedDiscount = Math.min(calculatedDiscount, eligibleValue);

      if (calculatedDiscount > bestEvaluation.discountAmount) {
        let msg = `${rule.name}: Save ₹${calculatedDiscount.toLocaleString('en-IN')}`;
        if (appliedDiscountPct > 0) {
          msg += ` (${appliedDiscountPct}% OFF on ${totalEligibleQty} units)`;
        } else {
          msg += ` (₹${appliedFixedDiscount} Flat OFF on ${totalEligibleQty} units)`;
        }

        bestEvaluation = {
          rule,
          ruleId: rule.id,
          ruleName: rule.name,
          discountAmount: calculatedDiscount,
          matchedTier,
          discountPercentage: appliedDiscountPct,
          fixedDiscountAmount: appliedFixedDiscount,
          eligibleItemCount: totalEligibleQty,
          eligibleSubtotal: eligibleValue,
          summaryMessage: msg,
        };
      }
    }
  }

  // Attach next tier hint
  if (nearestNextTierHint) {
    bestEvaluation.nextTierHint = nearestNextTierHint;
  }

  return bestEvaluation;
}

/**
 * Returns volume pricing slabs for a specific product based on active bulk rules
 */
export function getProductBulkDiscountSlabs(
  product: Product,
  rules: BulkDiscountRule[]
): Array<{
  minQty: number;
  discountPercentage: number;
  fixedDiscount?: number;
  unitPrice: number;
  unitSavings: number;
  label: string;
}> {
  if (!rules || rules.length === 0 || !product) return [];

  const basePrice = product.dealPrice || product.regularPrice;

  // Find rules that apply to this product
  const applicableRules = rules.filter((r) => {
    if (!r.isActive) return false;
    if (r.targetType === 'product' && r.targetProductId === product.id) return true;
    if (r.targetType === 'category' && (r.targetCategoryId === product.categoryId || r.targetCategoryId === 'all')) {
      return true;
    }
    if (r.targetType === 'entire_order') return true;
    return false;
  });

  const slabsMap = new Map<number, { discountPct: number; fixedDiscount?: number; ruleName: string }>();

  for (const rule of applicableRules) {
    if (rule.tiers && rule.tiers.length > 0) {
      for (const tier of rule.tiers) {
        const existing = slabsMap.get(tier.minQuantity);
        const pct = tier.discountPercentage || 0;
        if (!existing || pct > existing.discountPct) {
          slabsMap.set(tier.minQuantity, {
            discountPct: pct,
            fixedDiscount: tier.fixedDiscountAmount,
            ruleName: rule.name,
          });
        }
      }
    } else {
      const existing = slabsMap.get(rule.minQuantity);
      const pct = rule.discountType === 'percentage' ? rule.discountValue : 0;
      if (!existing || pct > existing.discountPct) {
        slabsMap.set(rule.minQuantity, {
          discountPct: pct,
          fixedDiscount: rule.discountType === 'fixed_amount' ? rule.discountValue : undefined,
          ruleName: rule.name,
        });
      }
    }
  }

  const sortedQty = Array.from(slabsMap.keys()).sort((a, b) => a - b);

  return sortedQty.map((minQty) => {
    const info = slabsMap.get(minQty)!;
    const discountPct = info.discountPct;
    const unitDiscount = discountPct > 0 ? Math.round((basePrice * discountPct) / 100) : 0;
    const effectiveUnitPrice = Math.max(0, basePrice - unitDiscount);

    return {
      minQty,
      discountPercentage: discountPct,
      fixedDiscount: info.fixedDiscount,
      unitPrice: effectiveUnitPrice,
      unitSavings: unitDiscount,
      label: discountPct > 0 ? `${discountPct}% OFF` : `₹${info.fixedDiscount} OFF`,
    };
  });
}
