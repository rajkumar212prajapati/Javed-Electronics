import { Order, OrderItem, Product, ProductCategory, HsnMasterRecord, OrderHsnSummaryItem, StoreSettings } from '../types';

/**
 * Indian State Codes mapped to 2-digit GST State Code Prefix
 */
export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

/**
 * Reverse mapping from State Name to GST State Code
 */
export const STATE_NAME_TO_GST_CODE: Record<string, string> = Object.entries(GST_STATE_CODES).reduce(
  (acc, [code, name]) => {
    acc[name.toLowerCase()] = code;
    return acc;
  },
  {} as Record<string, string>
);

export function getGstCodeForState(stateName: string): string {
  if (!stateName) return '09'; // Default to Uttar Pradesh
  const clean = stateName.trim().toLowerCase();
  if (STATE_NAME_TO_GST_CODE[clean]) return STATE_NAME_TO_GST_CODE[clean];
  if (clean.includes('uttar pradesh') || clean.includes('up') || clean.includes('lucknow')) return '09';
  if (clean.includes('delhi')) return '07';
  if (clean.includes('maharashtra') || clean.includes('mumbai')) return '27';
  if (clean.includes('bihar')) return '10';
  if (clean.includes('karnataka') || clean.includes('bangalore')) return '29';
  if (clean.includes('haryana')) return '06';
  if (clean.includes('punjab')) return '03';
  return '09';
}

/**
 * Validate 15-character Indian GSTIN format
 * Format: 2-digit state code + 10-char PAN + 1-digit entity number + 'Z' + 1 checksum char
 * e.g. 09AABPJ1234F1Z5
 */
export function validateGSTIN(gstin: string): {
  isValid: boolean;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  error?: string;
} {
  const clean = gstin.trim().toUpperCase();
  if (!clean) {
    return { isValid: false, error: 'GSTIN is required.' };
  }
  if (clean.length !== 15) {
    return { isValid: false, error: `GSTIN must be exactly 15 characters (currently ${clean.length}).` };
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(clean)) {
    return {
      isValid: false,
      error: 'Invalid GSTIN structure. Expected format: 2-digit state code + 10-char PAN + 1 + Z + Checksum (e.g. 09AABPJ1234F1Z5).',
    };
  }

  const stateCode = clean.slice(0, 2);
  const stateName = GST_STATE_CODES[stateCode];
  if (!stateName) {
    return { isValid: false, error: `Invalid GST state code "${stateCode}". Must be a recognized Indian state/UT.` };
  }

  const pan = clean.slice(2, 12);

  return {
    isValid: true,
    stateCode,
    stateName,
    pan,
  };
}

/**
 * Master HSN / SAC Catalog for Electronics Retail
 */
export const STANDARD_HSN_CATALOG: HsnMasterRecord[] = [
  {
    hsnCode: '8517',
    description: 'Smartphones, Cellular Telephones, Mobile Transceivers & Network Equipment',
    category: 'smartphones',
    gstRate: 18,
    isService: false,
  },
  {
    hsnCode: '8518',
    description: 'Audio Devices, Microphones, Headphones, Bluetooth Neckbands & Soundbars',
    category: 'audio',
    gstRate: 18,
    isService: false,
  },
  {
    hsnCode: '8504',
    description: 'Electrical Transformers, Static Converters, Fast Wall Chargers & Power Banks',
    category: 'chargers_cables',
    gstRate: 18,
    isService: false,
  },
  {
    hsnCode: '8528',
    description: 'Monitors, Projectors, Smart TVs & Ultra-HD LED Displays (>32 Inch Slabs)',
    category: 'tvs_accessories',
    gstRate: 28,
    isService: false,
  },
  {
    hsnCode: '9102',
    description: 'Wrist Watches, Smartwatches, Fitness Trackers & Wearable Electronics',
    category: 'smartwatches',
    gstRate: 18,
    isService: false,
  },
  {
    hsnCode: '8471',
    description: 'Automatic Data Processing Units, Keyboards, Mice, Optical Drives & Computer Peripherals',
    category: 'computer_accessories',
    gstRate: 18,
    isService: false,
  },
  {
    hsnCode: '8516',
    description: 'Electro-thermic Appliances, Electric Kettles, Heating Elements & Small Domestic Appliances',
    category: 'small_appliances',
    gstRate: 18,
    isService: false,
  },
  {
    hsnCode: '8529',
    description: 'Parts Suitable For Use Solely with TV, Radio & Wireless Equipment',
    category: 'home_electronics',
    gstRate: 18,
    isService: false,
  },
  {
    hsnCode: '9968',
    description: 'Postal, Courier, Express Parcel Logistics & Doorstep Delivery Transport Services',
    category: 'shipping',
    gstRate: 18,
    isService: true,
  },
];

/**
 * Resolve HSN code for a given product or category
 */
export function getHsnForProduct(product: Product): string {
  if (product.hsnCode && product.hsnCode.trim()) {
    return product.hsnCode.trim();
  }
  const match = STANDARD_HSN_CATALOG.find((h) => h.category === product.categoryId);
  return match ? match.hsnCode : '8517';
}

export function getHsnDescription(hsnCode: string): string {
  const match = STANDARD_HSN_CATALOG.find((h) => h.hsnCode === hsnCode);
  return match ? match.description : 'Electronic Equipment & Consumer Goods';
}

/**
 * Detailed Tax Breakdown for Cart or Order
 */
export interface DetailedTaxCalculation {
  taxableAmount: number;
  totalTax: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  isInterState: boolean;
  supplierGstCode: string; // e.g. "09"
  customerGstCode: string; // e.g. "09"
  placeOfSupply: string;
  itemsBreakdown: Array<{
    productId: string;
    productName: string;
    sku: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    grossTotal: number;
    taxableValue: number;
    gstRate: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalTax: number;
  }>;
  shippingTax: {
    sacCode: string;
    grossFee: number;
    taxableValue: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
  };
  hsnSummary: OrderHsnSummaryItem[];
}

/**
 * Core GST Calculation Algorithm for Tax-Inclusive Retail
 */
export function calculateOrderGstBreakdown(params: {
  items: Array<{
    product: Product;
    quantity: number;
    unitPrice: number;
    variant?: string;
  }>;
  couponDiscount: number;
  deliveryFee: number;
  customerState?: string;
  supplierStateCode?: string;
}): DetailedTaxCalculation {
  const supplierGstCode = params.supplierStateCode || '09'; // Default: UP (09)
  const customerGstCode = getGstCodeForState(params.customerState || 'Uttar Pradesh');
  const isInterState = supplierGstCode !== customerGstCode;
  const placeOfSupply = `${customerGstCode} - ${GST_STATE_CODES[customerGstCode] || 'Uttar Pradesh'}`;

  const grossItemsSum = params.items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);

  // Pro-rate coupon discount across items proportionally
  const itemsBreakdown = params.items.map((it) => {
    const itemGross = it.unitPrice * it.quantity;
    const itemDiscount = grossItemsSum > 0 ? (itemGross / grossItemsSum) * params.couponDiscount : 0;
    const netGross = Math.max(0, itemGross - itemDiscount);

    const gstRate = it.product.gstRate || 18;
    const hsnCode = getHsnForProduct(it.product);

    // Taxable Value = NetGross / (1 + Rate / 100)
    const taxableValue = Math.round((netGross / (1 + gstRate / 100)) * 100) / 100;
    const itemTax = Math.round((netGross - taxableValue) * 100) / 100;

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isInterState) {
      igRate: igstRate = gstRate;
      igstAmount = itemTax;
    } else {
      cgstRate = gstRate / 2;
      sgstRate = gstRate / 2;
      cgstAmount = Math.round((itemTax / 2) * 100) / 100;
      sgstAmount = Math.round((itemTax - cgstAmount) * 100) / 100;
    }

    return {
      productId: it.product.id,
      productName: it.product.name,
      sku: it.product.sku,
      hsnCode,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      grossTotal: netGross,
      taxableValue,
      gstRate,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax: itemTax,
    };
  });

  // Calculate Shipping Service GST (SAC 9968, 18%)
  const shippingGross = params.deliveryFee || 0;
  const shippingGstRate = 18;
  const shippingTaxable = Math.round((shippingGross / (1 + shippingGstRate / 100)) * 100) / 100;
  const shippingTax = Math.round((shippingGross - shippingTaxable) * 100) / 100;

  let shippingCgst = 0;
  let shippingSgst = 0;
  let shippingIgst = 0;

  if (isInterState) {
    shippingIgst = shippingTax;
  } else {
    shippingCgst = Math.round((shippingTax / 2) * 100) / 100;
    shippingSgst = Math.round((shippingTax - shippingCgst) * 100) / 100;
  }

  const shippingTaxDetails = {
    sacCode: '9968',
    grossFee: shippingGross,
    taxableValue: shippingTaxable,
    gstRate: shippingGstRate,
    cgstAmount: shippingCgst,
    sgstAmount: shippingSgst,
    igstAmount: shippingIgst,
    totalTax: shippingTax,
  };

  // Group by HSN code for official HSN Summary Table
  const hsnMap = new Map<string, OrderHsnSummaryItem>();

  itemsBreakdown.forEach((item) => {
    const existing = hsnMap.get(item.hsnCode);
    if (existing) {
      existing.taxableValue = Math.round((existing.taxableValue + item.taxableValue) * 100) / 100;
      existing.cgstAmount = Math.round((existing.cgstAmount + item.cgstAmount) * 100) / 100;
      existing.sgstAmount = Math.round((existing.sgstAmount + item.sgstAmount) * 100) / 100;
      existing.igstAmount = Math.round((existing.igstAmount + item.igstAmount) * 100) / 100;
      existing.totalTax = Math.round((existing.totalTax + item.totalTax) * 100) / 100;
    } else {
      hsnMap.set(item.hsnCode, {
        hsnCode: item.hsnCode,
        description: getHsnDescription(item.hsnCode),
        taxableValue: item.taxableValue,
        gstRate: item.gstRate,
        cgstRate: item.cgstRate,
        cgstAmount: item.cgstAmount,
        sgstRate: item.sgstRate,
        sgstAmount: item.sgstAmount,
        igstRate: item.igstRate,
        igstAmount: item.igstAmount,
        totalTax: item.totalTax,
      });
    }
  });

  // Add shipping SAC to HSN summary if delivery fee > 0
  if (shippingGross > 0) {
    const sacCode = '9968';
    const existingSac = hsnMap.get(sacCode);
    if (existingSac) {
      existingSac.taxableValue = Math.round((existingSac.taxableValue + shippingTaxable) * 100) / 100;
      existingSac.cgstAmount = Math.round((existingSac.cgstAmount + shippingCgst) * 100) / 100;
      existingSac.sgstAmount = Math.round((existingSac.sgstAmount + shippingSgst) * 100) / 100;
      existingSac.igstAmount = Math.round((existingSac.igstAmount + shippingIgst) * 100) / 100;
      existingSac.totalTax = Math.round((existingSac.totalTax + shippingTax) * 100) / 100;
    } else {
      hsnMap.set(sacCode, {
        hsnCode: sacCode,
        description: 'Courier Express Delivery Transportation Services',
        taxableValue: shippingTaxable,
        gstRate: shippingGstRate,
        cgstRate: isInterState ? 0 : 9,
        cgstAmount: shippingCgst,
        sgstRate: isInterState ? 0 : 9,
        sgstAmount: shippingSgst,
        igstRate: isInterState ? 18 : 0,
        igstAmount: shippingIgst,
        totalTax: shippingTax,
      });
    }
  }

  const hsnSummary = Array.from(hsnMap.values());

  const totalTaxable = Math.round(
    (itemsBreakdown.reduce((sum, i) => sum + i.taxableValue, 0) + (shippingGross > 0 ? shippingTaxable : 0)) * 100
  ) / 100;

  const totalCgst = Math.round(
    (itemsBreakdown.reduce((sum, i) => sum + i.cgstAmount, 0) + shippingCgst) * 100
  ) / 100;

  const totalSgst = Math.round(
    (itemsBreakdown.reduce((sum, i) => sum + i.sgstAmount, 0) + shippingSgst) * 100
  ) / 100;

  const totalIgst = Math.round(
    (itemsBreakdown.reduce((sum, i) => sum + i.igstAmount, 0) + shippingIgst) * 100
  ) / 100;

  const totalTax = Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;

  return {
    taxableAmount: totalTaxable,
    totalTax,
    cgstAmount: totalCgst,
    sgstAmount: totalSgst,
    igstAmount: totalIgst,
    isInterState,
    supplierGstCode,
    customerGstCode,
    placeOfSupply,
    itemsBreakdown,
    shippingTax: shippingTaxDetails,
    hsnSummary,
  };
}

/**
 * GSTR-1 Metrics & Return Summary
 */
export function generateGstr1Summary(orders: Order[], settings: StoreSettings) {
  const validOrders = orders.filter((o) => o.orderStatus !== 'cancelled');

  let b2bInvoicesCount = 0;
  let b2bTaxableValue = 0;
  let b2bTotalTax = 0;

  let b2cInvoicesCount = 0;
  let b2cTaxableValue = 0;
  let b2cTotalTax = 0;

  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTaxable = 0;
  let totalGross = 0;

  const hsnAggregates = new Map<string, {
    hsnCode: string;
    description: string;
    uqc: string;
    totalQuantity: number;
    totalValue: number;
    taxableValue: number;
    integratedTax: number;
    centralTax: number;
    stateTax: number;
    cessAmount: number;
  }>();

  validOrders.forEach((order) => {
    totalGross += order.finalTotal;
    const isB2B = !!order.isB2BOrder || !!order.customer.gstin;

    const orderTaxable = order.taxableAmount || (order.finalTotal - order.taxAmount);
    const cgst = order.cgstAmount ?? (order.taxAmount / 2);
    const sgst = order.sgstAmount ?? (order.taxAmount / 2);
    const igst = order.igstAmount ?? 0;

    totalTaxable += orderTaxable;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    if (isB2B) {
      b2bInvoicesCount++;
      b2bTaxableValue += orderTaxable;
      b2bTotalTax += order.taxAmount;
    } else {
      b2cInvoicesCount++;
      b2cTaxableValue += orderTaxable;
      b2cTotalTax += order.taxAmount;
    }

    // Accumulate items for HSN Table 12
    order.items.forEach((it) => {
      const hsn = it.hsnCode || '8517';
      const existing = hsnAggregates.get(hsn);
      const itemTaxable = it.taxableValue || (it.total / (1 + (it.gstRate || 18) / 100));
      const itemCgst = it.cgstAmount ?? ((it.total - itemTaxable) / 2);
      const itemSgst = it.sgstAmount ?? ((it.total - itemTaxable) / 2);
      const itemIgst = it.igstAmount ?? 0;

      if (existing) {
        existing.totalQuantity += it.quantity;
        existing.totalValue += it.total;
        existing.taxableValue += itemTaxable;
        existing.centralTax += itemCgst;
        existing.stateTax += itemSgst;
        existing.integratedTax += itemIgst;
      } else {
        hsnAggregates.set(hsn, {
          hsnCode: hsn,
          description: getHsnDescription(hsn),
          uqc: 'NOS (Numbers / Pieces)',
          totalQuantity: it.quantity,
          totalValue: it.total,
          taxableValue: itemTaxable,
          centralTax: itemCgst,
          stateTax: itemSgst,
          integratedTax: itemIgst,
          cessAmount: 0,
        });
      }
    });

    // Add shipping SAC 9968
    if (order.deliveryFee > 0) {
      const sac = '9968';
      const existing = hsnAggregates.get(sac);
      const shipTaxable = order.deliveryFee / 1.18;
      const shipTax = order.deliveryFee - shipTaxable;

      if (existing) {
        existing.totalQuantity += 1;
        existing.totalValue += order.deliveryFee;
        existing.taxableValue += shipTaxable;
        existing.centralTax += shipTax / 2;
        existing.stateTax += shipTax / 2;
      } else {
        hsnAggregates.set(sac, {
          hsnCode: sac,
          description: 'Courier Express Delivery Transportation Services',
          uqc: 'SER (Services)',
          totalQuantity: 1,
          totalValue: order.deliveryFee,
          taxableValue: shipTaxable,
          centralTax: shipTax / 2,
          stateTax: shipTax / 2,
          integratedTax: 0,
          cessAmount: 0,
        });
      }
    }
  });

  return {
    period: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    gstin: settings.gstin,
    legalName: settings.gstLegalBusinessName || 'JAVED ELECTRONICS PRIVATE LIMITED',
    stateCode: '09 (Uttar Pradesh)',
    totalGrossSales: Math.round(totalGross),
    totalTaxableSales: Math.round(totalTaxable),
    totalTaxCollected: Math.round(totalCgst + totalSgst + totalIgst),
    totalCgst: Math.round(totalCgst),
    totalSgst: Math.round(totalSgst),
    totalIgst: Math.round(totalIgst),
    b2bSummary: {
      count: b2bInvoicesCount,
      taxableValue: Math.round(b2bTaxableValue),
      totalTax: Math.round(b2bTotalTax),
    },
    b2cSummary: {
      count: b2cInvoicesCount,
      taxableValue: Math.round(b2cTaxableValue),
      totalTax: Math.round(b2cTotalTax),
    },
    hsnTable12: Array.from(hsnAggregates.values()).map((h) => ({
      ...h,
      totalValue: Math.round(h.totalValue),
      taxableValue: Math.round(h.taxableValue),
      centralTax: Math.round(h.centralTax),
      stateTax: Math.round(h.stateTax),
      integratedTax: Math.round(h.integratedTax),
    })),
  };
}

/**
 * Generate CSV for GSTR-1 HSN Table 12
 */
export function exportHsnSummaryCsv(summary: ReturnType<typeof generateGstr1Summary>): string {
  const headers = [
    'HSN Code',
    'Description',
    'UQC',
    'Total Quantity',
    'Total Value (INR)',
    'Taxable Value (INR)',
    'Central Tax (CGST)',
    'State Tax (SGST)',
    'Integrated Tax (IGST)',
    'Cess',
  ];

  const rows = summary.hsnTable12.map((h) => [
    `"${h.hsnCode}"`,
    `"${h.description}"`,
    `"${h.uqc}"`,
    h.totalQuantity,
    h.totalValue,
    h.taxableValue,
    h.centralTax,
    h.stateTax,
    h.integratedTax,
    h.cessAmount,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate GSTR-1 B2B Invoices CSV
 */
export function exportB2bInvoicesCsv(orders: Order[], settings: StoreSettings): string {
  const b2bOrders = orders.filter((o) => (o.isB2BOrder || o.customer.gstin) && o.orderStatus !== 'cancelled');

  const headers = [
    'GSTIN/UIN of Recipient',
    'Receiver Legal Name',
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place Of Supply',
    'Reverse Charge',
    'Applicable % of Tax Rate',
    'Invoice Type',
    'E-Commerce GSTIN',
    'Rate',
    'Taxable Value',
    'Cess Amount',
  ];

  const rows = b2bOrders.map((o) => {
    const gstin = o.b2bGstin || o.customer.gstin || '';
    const name = o.b2bBusinessName || o.customer.businessName || o.customer.name;
    const invDate = new Date(o.createdAt).toLocaleDateString('en-GB'); // DD/MM/YYYY
    const pos = o.placeOfSupply || '09-Uttar Pradesh';
    const taxable = o.taxableAmount || (o.finalTotal - o.taxAmount);

    return [
      `"${gstin}"`,
      `"${name}"`,
      `"${o.invoiceNumber}"`,
      `"${invDate}"`,
      o.finalTotal,
      `"${pos}"`,
      '"N"',
      '100',
      '"Regular"',
      '""',
      '18',
      taxable,
      '0',
    ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
