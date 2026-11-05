import { DeliveryPartnerAccount, RiderRemittanceSubmission, CarrierCodSettlement } from '../types';

export interface InHouseRider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  vehicleNo: string;
  outletId: string;
  outletName: string;
  status: 'available' | 'on_delivery' | 'off_duty';
  isOnline: boolean;
  activeDeliveriesCount: number;
  codCashInHand: number;
  // KYC & Bank Details
  aadharNumber?: string;
  panNumber?: string;
  bankAccountNo?: string;
  ifscCode?: string;
  selfieUrl?: string;
  // Store Transfer Request Workflow
  pendingStoreTransfer?: {
    targetOutletId: string;
    targetOutletName: string;
    reason: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewNotes?: string;
  };
  // Multi-tier Granular Earnings Breakdown
  completedOrdersCount?: number;
  totalDistanceKm?: number;
  completedSlotsCount?: number;
  bookedSlotIds?: string[];
  earnings: {
    orderEarnings: number;     // Order-based pay (e.g. ₹50/order)
    distanceEarnings: number;  // Distance-based (₹8/km beyond 3km)
    slotEarnings: number;      // Slot/shift attendance bonus
    incentiveEarnings: number; // Order target incentive tier
    surgeEarnings: number;     // Monsoon/rush-hour surge bonus
    milestoneEarnings: number; // Milestone achievement bonus
    totalEarnings: number;
    // Optional aliases for flexible frontend consumption
    orderBased?: number;
    distanceBased?: number;
    slotBased?: number;
    incentiveBased?: number;
    surgeBased?: number;
    milestoneBased?: number;
    total?: number;
  };
}

export interface RiderIncentiveTier {
  id: string;
  minOrders: number;
  bonusAmount: number;
  label: string;
}

export interface RiderMilestoneTier {
  id: string;
  targetOrders: number;
  period: 'weekly' | 'monthly';
  rewardAmount: number;
  title: string;
}

export interface RiderEarningStructure {
  // 1. Order-Based Pay
  baseOrderFee: number;          // e.g. ₹50 per order
  bulkOrderExtraFee: number;     // e.g. ₹25 extra for heavy electronics/appliances
  // 2. Distance-Based Pay
  baseIncludedKm: number;        // e.g. 3 km included in base order fee
  perKmRate: number;             // e.g. ₹8 per extra km beyond baseIncludedKm
  returnRtoPerKmRate: number;    // e.g. ₹4 per km for approved RTO return trips
  // 3. Slot-Based Guarantee & Shift Pay
  defaultSlotBaseGuarantee: number; // e.g. ₹250 per completed shift slot
  peakSlotBonus: number;            // e.g. ₹100 extra for peak evening shifts
  minSlotLoginAdherencePct: number; // e.g. 90% login requirement
  // 4. Daily Order Target Incentives
  dailyIncentiveTiers: RiderIncentiveTier[];
  // 5. Surge-Based Multipliers
  surgeConfig: {
    isSurgeActive: boolean;
    activeSurgeType: 'none' | 'rain_monsoon' | 'peak_rush' | 'festival_mega';
    rainSurgePerOrder: number;      // e.g. ₹30/order
    peakHourSurgePerOrder: number;  // e.g. ₹20/order
    festivalSurgePerOrder: number;  // e.g. ₹40/order
  };
  // 6. Weekly / Monthly Milestone Rewards
  milestoneTiers: RiderMilestoneTier[];
  // Deductions & Tax Config
  tdsRatePct: number;               // e.g. 1% TDS u/s 194C
  updatedAt: string;
  updatedBy: string;
}

export interface RiderDeliverySlot {
  id: string;
  title: string;
  startTime: string;   // e.g. "08:00 AM"
  endTime: string;     // e.g. "12:00 PM"
  durationHours: number;
  outletId: string;    // 'all' or specific outlet ID
  outletName: string;
  slotType: 'standard' | 'peak' | 'super_peak' | 'late_night';
  slotBasePay: number;         // Guaranteed slot pay (₹)
  perOrderSurgeBonus: number;  // Extra per-order bonus during this slot (₹)
  minLoginHours: number;
  maxRiders: number;
  enrolledRiderIds: string[];
  daysActive: string;          // e.g. "Mon - Sun (Daily)"
  isActive: boolean;
  createdAt: string;
}

export interface RiderPayoutRecord {
  id: string; // e.g. RPAY-2026-1001
  riderId: string;
  riderName: string;
  riderPhone: string;
  outletId: string;
  outletName: string;
  bankAccountNo: string;
  ifscCode: string;
  panNumber: string;
  periodLabel: string;
  breakdown: {
    slotEarnings: number;
    orderEarnings: number;
    distanceEarnings: number;
    incentiveEarnings: number;
    surgeEarnings: number;
    milestoneEarnings: number;
    grossEarnings: number;
    codDeductionsOrPenalties: number;
    tdsDeduction: number;
    netPayableAmount: number;
  };
  paymentMethod: 'IMPS' | 'NEFT' | 'UPI_INSTANT';
  status: 'pending_approval' | 'processing' | 'paid' | 'on_hold';
  utrReference?: string;
  createdAt: string;
  paidAt?: string;
  approvedBy?: string;
  notes?: string;
}

export const INITIAL_RIDER_EARNING_STRUCTURE: RiderEarningStructure = {
  baseOrderFee: 50,
  bulkOrderExtraFee: 25,
  baseIncludedKm: 3,
  perKmRate: 8,
  returnRtoPerKmRate: 4,
  defaultSlotBaseGuarantee: 250,
  peakSlotBonus: 100,
  minSlotLoginAdherencePct: 90,
  dailyIncentiveTiers: [
    { id: 'inc-tier-1', minOrders: 8, bonusAmount: 150, label: 'Silver Daily Target (8+ Orders)' },
    { id: 'inc-tier-2', minOrders: 12, bonusAmount: 300, label: 'Gold Daily Target (12+ Orders)' },
    { id: 'inc-tier-3', minOrders: 16, bonusAmount: 500, label: 'Platinum Hyperlocal Champion (16+ Orders)' },
  ],
  surgeConfig: {
    isSurgeActive: true,
    activeSurgeType: 'peak_rush',
    rainSurgePerOrder: 30,
    peakHourSurgePerOrder: 20,
    festivalSurgePerOrder: 40,
  },
  milestoneTiers: [
    { id: 'ms-tier-1', targetOrders: 35, period: 'weekly', rewardAmount: 500, title: 'Weekly 35-Order Consistency Bonus' },
    { id: 'ms-tier-2', targetOrders: 60, period: 'weekly', rewardAmount: 1000, title: 'Weekly 60-Order Fleet Star Milestone' },
    { id: 'ms-tier-3', targetOrders: 200, period: 'monthly', rewardAmount: 3000, title: 'Monthly 200-Order Super Rider Award' },
  ],
  tdsRatePct: 1,
  updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  updatedBy: 'Javed Akhtar (Super Admin)',
};

export const INITIAL_RIDER_SLOTS: RiderDeliverySlot[] = [
  {
    id: 'slot-morning-01',
    title: 'Morning Express Rush Slot',
    startTime: '08:00 AM',
    endTime: '12:00 PM',
    durationHours: 4,
    outletId: 'out_nalasopara_01',
    outletName: 'Shop 09 Sai Dham Apt Vijaynagar Nalasopara East 401209',
    slotType: 'standard',
    slotBasePay: 250,
    perOrderSurgeBonus: 10,
    minLoginHours: 3.5,
    maxRiders: 8,
    enrolledRiderIds: ['rider-1', 'rider-4'],
    daysActive: 'Mon - Sun (Daily)',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'slot-afternoon-02',
    title: 'Afternoon Hyperlocal Shift',
    startTime: '12:00 PM',
    endTime: '04:00 PM',
    durationHours: 4,
    outletId: 'all',
    outletName: 'All Mumbai Nalasopara, Vasai & Virar Hubs',
    slotType: 'standard',
    slotBasePay: 220,
    perOrderSurgeBonus: 0,
    minLoginHours: 3.5,
    maxRiders: 10,
    enrolledRiderIds: ['rider-2'],
    daysActive: 'Mon - Sun (Daily)',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: 'slot-evening-peak-03',
    title: 'Evening Prime Peak Slot',
    startTime: '04:00 PM',
    endTime: '08:30 PM',
    durationHours: 4.5,
    outletId: 'out_nalasopara_01',
    outletName: 'Shop 09 Sai Dham Apt Vijaynagar Nalasopara East 401209',
    slotType: 'peak',
    slotBasePay: 350,
    perOrderSurgeBonus: 20,
    minLoginHours: 4,
    maxRiders: 12,
    enrolledRiderIds: ['rider-1', 'rider-3'],
    daysActive: 'Mon - Sun (Daily)',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'slot-night-super-04',
    title: 'Night Super-Peak & Express Delivery Slot',
    startTime: '08:30 PM',
    endTime: '11:30 PM',
    durationHours: 3,
    outletId: 'out_virar_01',
    outletName: 'Global City Hub, Virar West 401303',
    slotType: 'super_peak',
    slotBasePay: 300,
    perOrderSurgeBonus: 30,
    minLoginHours: 2.5,
    maxRiders: 6,
    enrolledRiderIds: ['rider-3'],
    daysActive: 'Fri - Sun & Festival Days',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const INITIAL_DELIVERY_PARTNERS: DeliveryPartnerAccount[] = [
  {
    id: 'dp_shiprocket',
    partnerName: 'Shiprocket',
    status: 'connected',
    apiEmail: 'logistics@electromart.in',
    apiKey: 'sr_live_token_77a90f2bc3d4',
    channelId: 'CH_ELECTROMART_LKO_01',
    webhookUrl: 'https://electromart.in/api/webhooks/shiprocket/awb-updates',
    pickupLocation: 'Shop 09, Sai Dham Apt, Vijaynagar, Nalasopara East - 401209, Palghar Mumbai',
    isDefault: true,
    autoGenerateAwb: true,
    totalShipmentsDispatched: 148,
    lastConnectedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'dp_delhivery',
    partnerName: 'Delhivery',
    status: 'connected',
    apiEmail: 'delhivery.hub@electromart.in',
    apiKey: 'dlv_prod_key_990184a2',
    pickupLocation: 'Ambadi Road Branch, Stella, Vasai West - 401202',
    isDefault: false,
    autoGenerateAwb: false,
    totalShipmentsDispatched: 72,
    lastConnectedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'dp_bluedart',
    partnerName: 'Blue Dart',
    status: 'testing',
    apiEmail: 'bluedart.apex@electromart.in',
    pickupLocation: 'Shop 09 Sai Dham Apt, Vijaynagar, Nalasopara East - 401209',
    isDefault: false,
    autoGenerateAwb: false,
    totalShipmentsDispatched: 26,
    lastConnectedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'dp_shadowfax',
    partnerName: 'Shadowfax',
    status: 'connected',
    apiEmail: 'shadowfax.hyperlocal@electromart.in',
    pickupLocation: 'Global City Hub, Avenue 1, Virar West - 401303',
    isDefault: false,
    autoGenerateAwb: true,
    totalShipmentsDispatched: 95,
    lastConnectedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const INITIAL_RIDERS: InHouseRider[] = [
  {
    id: 'rider-1',
    name: 'Ramesh Kumar',
    phone: '+91 94150 99881',
    email: 'ramesh.rider@javed-electronics.in',
    password: 'rider123',
    vehicleNo: 'MH 48 BK 4421 (Hero Splendor)',
    outletId: 'out_nalasopara_01',
    outletName: 'Shop 09 Sai Dham Apt Vijaynagar Nalasopara East 401209',
    status: 'available',
    isOnline: true,
    activeDeliveriesCount: 1,
    codCashInHand: 1599,
    aadharNumber: '5412 8901 2345',
    panNumber: 'ABCDE1234F',
    bankAccountNo: '50100452391024',
    ifscCode: 'HDFC0000241',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    completedOrdersCount: 19,
    totalDistanceKm: 35,
    completedSlotsCount: 2,
    bookedSlotIds: ['slot-morning-01', 'slot-evening-peak-03'],
    earnings: {
      orderEarnings: 950,
      distanceEarnings: 280,
      slotEarnings: 600,
      incentiveEarnings: 300,
      surgeEarnings: 180,
      milestoneEarnings: 500,
      totalEarnings: 2810,
      orderBased: 950,
      distanceBased: 280,
      slotBased: 600,
      incentiveBased: 300,
      surgeBased: 180,
      milestoneBased: 500,
      total: 2810,
    },
  },
  {
    id: 'rider-2',
    name: 'Amit Singh',
    phone: '+91 98390 12345',
    email: 'amit.rider@javed-electronics.in',
    password: 'rider123',
    vehicleNo: 'MH 48 EF 8820 (Honda Activa)',
    outletId: 'out_vasai_01',
    outletName: 'Ambadi Road Branch, Vasai West 401202',
    status: 'available',
    isOnline: true,
    activeDeliveriesCount: 0,
    codCashInHand: 0,
    aadharNumber: '7821 3410 9982',
    panNumber: 'BKSPA9912K',
    bankAccountNo: '91802004512938',
    ifscCode: 'SBIN0001429',
    selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    completedOrdersCount: 14,
    totalDistanceKm: 22.5,
    completedSlotsCount: 1,
    bookedSlotIds: ['slot-afternoon-02'],
    earnings: {
      orderEarnings: 700,
      distanceEarnings: 180,
      slotEarnings: 220,
      incentiveEarnings: 150,
      surgeEarnings: 100,
      milestoneEarnings: 0,
      totalEarnings: 1350,
      orderBased: 700,
      distanceBased: 180,
      slotBased: 220,
      incentiveBased: 150,
      surgeBased: 100,
      milestoneBased: 0,
      total: 1350,
    },
  },
  {
    id: 'rider-3',
    name: 'Vikram Verma',
    phone: '+91 97920 67890',
    email: 'vikram.rider@javed-electronics.in',
    password: 'rider123',
    vehicleNo: 'MH 48 CZ 3319 (TVS Jupiter)',
    outletId: 'out_virar_01',
    outletName: 'Global City Hub, Virar West 401303',
    status: 'available',
    isOnline: true,
    activeDeliveriesCount: 2,
    codCashInHand: 3499,
    aadharNumber: '3341 9812 6654',
    panNumber: 'CPZPV7714M',
    bankAccountNo: '002901509124',
    ifscCode: 'ICIC0000029',
    selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    completedOrdersCount: 24,
    totalDistanceKm: 52.5,
    completedSlotsCount: 2,
    bookedSlotIds: ['slot-evening-peak-03', 'slot-night-super-04'],
    earnings: {
      orderEarnings: 1200,
      distanceEarnings: 420,
      slotEarnings: 650,
      incentiveEarnings: 500,
      surgeEarnings: 240,
      milestoneEarnings: 1000,
      totalEarnings: 4010,
      orderBased: 1200,
      distanceBased: 420,
      slotBased: 650,
      incentiveBased: 500,
      surgeBased: 240,
      milestoneBased: 1000,
      total: 4010,
    },
  },
  {
    id: 'rider-4',
    name: 'Mohd Danish',
    phone: '+91 91250 44321',
    email: 'danish.rider@javed-electronics.in',
    password: 'rider123',
    vehicleNo: 'MH 48 DL 9081 (Bajaj Pulsar)',
    outletId: 'out_nalasopara_01',
    outletName: 'Shop 09 Sai Dham Apt Vijaynagar Nalasopara East 401209',
    status: 'available',
    isOnline: false,
    activeDeliveriesCount: 0,
    codCashInHand: 0,
    aadharNumber: '9912 4512 8821',
    panNumber: 'AMZPD3321L',
    bankAccountNo: '60129841209',
    ifscCode: 'MAHB0001092',
    selfieUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    completedOrdersCount: 12,
    totalDistanceKm: 18.75,
    completedSlotsCount: 1,
    bookedSlotIds: ['slot-morning-01'],
    earnings: {
      orderEarnings: 600,
      distanceEarnings: 150,
      slotEarnings: 250,
      incentiveEarnings: 150,
      surgeEarnings: 80,
      milestoneEarnings: 0,
      totalEarnings: 1230,
      orderBased: 600,
      distanceBased: 150,
      slotBased: 250,
      incentiveBased: 150,
      surgeBased: 80,
      milestoneBased: 0,
      total: 1230,
    },
  },
];

export const INITIAL_RIDER_PAYOUTS: RiderPayoutRecord[] = [
  {
    id: 'RPAY-2026-1001',
    riderId: 'rider-3',
    riderName: 'Vikram Verma',
    riderPhone: '+91 97920 67890',
    outletId: 'out_virar_01',
    outletName: 'Global City Hub, Virar West 401303',
    bankAccountNo: '002901509124',
    ifscCode: 'ICIC0000029',
    panNumber: 'CPZPV7714M',
    periodLabel: '22 Oct 2026 – 28 Oct 2026 (Weekly Settlement)',
    breakdown: {
      slotEarnings: 650,
      orderEarnings: 1200,
      distanceEarnings: 420,
      incentiveEarnings: 500,
      surgeEarnings: 240,
      milestoneEarnings: 1000,
      grossEarnings: 4010,
      codDeductionsOrPenalties: 0,
      tdsDeduction: 40,
      netPayableAmount: 3970,
    },
    paymentMethod: 'IMPS',
    status: 'paid',
    utrReference: 'ICIC262910998412',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    paidAt: new Date(Date.now() - 86400000 * 1.8).toISOString(),
    approvedBy: 'Javed Akhtar (Super Admin)',
    notes: 'Weekly fleet settlement credited to ICICI Bank A/C 002901509124.',
  },
  {
    id: 'RPAY-2026-1002',
    riderId: 'rider-1',
    riderName: 'Ramesh Kumar',
    riderPhone: '+91 94150 99881',
    outletId: 'out_nalasopara_01',
    outletName: 'Shop 09 Sai Dham Apt Vijaynagar Nalasopara East 401209',
    bankAccountNo: '50100452391024',
    ifscCode: 'HDFC0000241',
    panNumber: 'ABCDE1234F',
    periodLabel: '23 Oct 2026 – 29 Oct 2026 (Weekly Settlement)',
    breakdown: {
      slotEarnings: 600,
      orderEarnings: 950,
      distanceEarnings: 280,
      incentiveEarnings: 300,
      surgeEarnings: 180,
      milestoneEarnings: 500,
      grossEarnings: 2810,
      codDeductionsOrPenalties: 0,
      tdsDeduction: 28,
      netPayableAmount: 2782,
    },
    paymentMethod: 'IMPS',
    status: 'pending_approval',
    utrReference: '',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: 'Pending weekly bank payout disbursal for Nalasopara East Rider.',
  },
  {
    id: 'RPAY-2026-1003',
    riderId: 'rider-2',
    riderName: 'Amit Singh',
    riderPhone: '+91 98390 12345',
    outletId: 'out_vasai_01',
    outletName: 'Ambadi Road Branch, Vasai West 401202',
    bankAccountNo: '91802004512938',
    ifscCode: 'SBIN0001429',
    panNumber: 'BKSPA9912K',
    periodLabel: '23 Oct 2026 – 29 Oct 2026 (Weekly Settlement)',
    breakdown: {
      slotEarnings: 220,
      orderEarnings: 700,
      distanceEarnings: 180,
      incentiveEarnings: 150,
      surgeEarnings: 100,
      milestoneEarnings: 0,
      grossEarnings: 1350,
      codDeductionsOrPenalties: 0,
      tdsDeduction: 14,
      netPayableAmount: 1336,
    },
    paymentMethod: 'UPI_INSTANT',
    status: 'pending_approval',
    utrReference: '',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notes: 'Vasai West shift & order payout ready for bank release.',
  },
];

export const INITIAL_RIDER_REMITTANCES: RiderRemittanceSubmission[] = [
  {
    id: 'REMIT-2026-089',
    riderId: 'rider-4',
    riderName: 'Mohd Danish',
    riderPhone: '+91 91250 44321',
    amount: 2899,
    submissionMethod: 'upi_qr',
    status: 'approved',
    remittanceCode: '74182904',
    notes: 'Evening shift COD collection deposited via counter UPI QR',
    orderIds: ['JE-2026-000095'],
    outletId: 'out_chowk',
    outletName: 'Chowk Heritage Branch',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    approvedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    approvedBy: 'Store Cashier (Imran)',
    approvalNotes: '8-digit code verified and cash/UPI transfer confirmed on store HDFC terminal.',
    receiptNumber: 'RCPT-CHW-9921',
  },
  {
    id: 'REMIT-2026-092',
    riderId: 'rider-1',
    riderName: 'Ramesh Kumar',
    riderPhone: '+91 94150 99881',
    amount: 1599,
    submissionMethod: 'cash_deposit',
    status: 'pending_approval',
    remittanceCode: '83921056',
    notes: 'Doorstep cash collected for Order JE-2026-000102',
    orderIds: ['JE-2026-000102'],
    outletId: 'out_hazratganj',
    outletName: 'Hazratganj Flagship Outlet',
    submittedAt: new Date(Date.now() - 1800000).toISOString(),
    receiptNumber: 'RCPT-HZG-0102',
  },
];

export const INITIAL_CARRIER_SETTLEMENTS: CarrierCodSettlement[] = [
  {
    id: 'SETTLE-SR-2026-001',
    carrier: 'Shiprocket',
    bankUtrNumber: 'CMS2026101900382910',
    settlementDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    grossCodCollected: 4999,
    carrierDeductions: 180,
    netAmountCredited: 4819,
    orderIds: ['JE-2026-000088'],
    awbNumbers: ['SR672819039IN'],
    status: 'verified_settled',
    settledBy: 'Javed Akhtar (Super Admin)',
    reconciliationNotes: 'HDFC Current A/c 50200088192 credited. Freight charge Rs 180 deducted.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];
