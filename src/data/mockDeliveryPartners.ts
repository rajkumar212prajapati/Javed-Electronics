import { DeliveryPartnerAccount, RiderRemittanceSubmission, CarrierCodSettlement } from '../types';

export interface InHouseRider {
  id: string;
  name: string;
  phone: string;
  vehicleNo: string;
  outletId: string;
  outletName: string;
  status: 'available' | 'on_delivery' | 'off_duty';
  activeDeliveriesCount: number;
  codCashInHand: number;
}

export const INITIAL_DELIVERY_PARTNERS: DeliveryPartnerAccount[] = [
  {
    id: 'dp_shiprocket',
    partnerName: 'Shiprocket',
    status: 'connected',
    apiEmail: 'logistics@electromart.in',
    apiKey: 'sr_live_token_77a90f2bc3d4',
    channelId: 'CH_ELECTROMART_LKO_01',
    webhookUrl: 'https://electromart.in/api/webhooks/shiprocket/awb-updates',
    pickupLocation: 'Hazratganj Central Warehouse, 42 MG Road, Lucknow - 226001',
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
    pickupLocation: 'Gomti Nagar Tech Hub, Sector 4, Lucknow - 226010',
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
    pickupLocation: 'Hazratganj Central Warehouse, Lucknow - 226001',
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
    pickupLocation: 'Alambagh Hub, Phoenix Mall Road, Lucknow - 226005',
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
    vehicleNo: 'UP 32 BK 4421 (Hero Splendor)',
    outletId: 'out_hazratganj',
    outletName: 'Hazratganj Flagship Outlet',
    status: 'available',
    activeDeliveriesCount: 1,
    codCashInHand: 1599,
  },
  {
    id: 'rider-2',
    name: 'Amit Singh',
    phone: '+91 98390 12345',
    vehicleNo: 'UP 32 EF 8820 (Honda Activa)',
    outletId: 'out_gomti_nagar',
    outletName: 'Gomti Nagar Tech Hub',
    status: 'available',
    activeDeliveriesCount: 0,
    codCashInHand: 0,
  },
  {
    id: 'rider-3',
    name: 'Vikram Verma',
    phone: '+91 97920 67890',
    vehicleNo: 'UP 32 CZ 3319 (TVS Jupiter)',
    outletId: 'out_alambagh',
    outletName: 'Alambagh Express Store',
    status: 'available',
    activeDeliveriesCount: 2,
    codCashInHand: 3499,
  },
  {
    id: 'rider-4',
    name: 'Mohd Danish',
    phone: '+91 91250 44321',
    vehicleNo: 'UP 32 DL 9081 (Bajaj Pulsar)',
    outletId: 'out_chowk',
    outletName: 'Chowk Heritage Branch',
    status: 'available',
    activeDeliveriesCount: 0,
    codCashInHand: 0,
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
