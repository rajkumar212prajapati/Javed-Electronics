/**
 * Format number as Indian Rupee (INR) currency representation
 * e.g., 14999 -> ₹14,999
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate savings and discount percentage between MRP and selling price
 */
export function calculateSavings(mrp: number, currentPrice: number) {
  if (mrp <= currentPrice) {
    return { savingsAmount: 0, discountPercentage: 0 };
  }
  const savingsAmount = mrp - currentPrice;
  const discountPercentage = Math.round((savingsAmount / mrp) * 100);
  return { savingsAmount, discountPercentage };
}

/**
 * Calculate GST component (CGST + SGST for intra-state Indian retail)
 */
export function calculateTaxBreakdown(taxInclusiveAmount: number, gstRatePercent: number) {
  // Amount = Base + (Base * Rate/100) => Base = Amount / (1 + Rate/100)
  const basePrice = Math.round((taxInclusiveAmount / (1 + gstRatePercent / 100)) * 100) / 100;
  const totalTax = Math.round((taxInclusiveAmount - basePrice) * 100) / 100;
  const cgst = Math.round((totalTax / 2) * 100) / 100;
  const sgst = Math.round((totalTax - cgst) * 100) / 100;

  return {
    basePrice,
    totalTax,
    cgst,
    sgst,
    rate: gstRatePercent,
  };
}

/**
 * Number to words conversion in Indian English for official tax invoices
 */
export function numberToIndianWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(num);
  if (n === 0) return 'Zero Rupees Only';

  function inWords(n: number): string {
    let str = '';
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) {
          str += ' ' + a[n % 10];
        } else {
          str += ' ';
        }
      }
    }
    return str;
  }

  return inWords(n).trim() + ' Rupees Only';
}
