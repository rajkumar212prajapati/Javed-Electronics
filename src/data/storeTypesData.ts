import { StoreType, StoreOrderAcceptanceConfig, StoreDeliverySlot } from '../types';

export interface StoreTypeMeta {
  type: StoreType;
  title: string;
  shortTitle: string;
  tagline: string;
  defaultDeliveryTime: string;
  defaultDeliveryMode: 'instant_express' | 'slot_scheduled' | 'hybrid_both';
  averagePrepTimeMinutes: number;
  iconName: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    linearBg: string;
  };
  keyFeatures: string[];
  licensingLabel?: string;
  suggestedPincodeRadiusKm: number;
}

export const STORE_TYPES_METADATA: Record<StoreType, StoreTypeMeta> = {
  grocery: {
    type: 'grocery',
    title: 'Grocery Store',
    shortTitle: 'Grocery',
    tagline: 'FMCG, packaged essentials, pantry staples & daily household needs',
    defaultDeliveryTime: '30 - 45 Mins Express Delivery',
    defaultDeliveryMode: 'hybrid_both',
    averagePrepTimeMinutes: 12,
    iconName: 'ShoppingBag',
    colorScheme: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-800',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-900',
      linearBg: 'from-emerald-500 to-teal-700',
    },
    keyFeatures: [
      '30-45 mins express order picking',
      'Morning & evening peak pantry grocery slots',
      'Bulk rice/flour/oil bag handling',
      'Barcode lookup & multi-pack discount support',
    ],
    licensingLabel: 'FSSAI License / Shop Act Registration',
    suggestedPincodeRadiusKm: 8,
  },
  pharma: {
    type: 'pharma',
    title: 'Pharma & Medical Store',
    shortTitle: 'Pharma',
    tagline: 'Prescription medicines, OTC drugs, first-aid & cold-storage medical essentials',
    defaultDeliveryTime: '15 - 30 Mins Urgent Healthcare',
    defaultDeliveryMode: 'instant_express',
    averagePrepTimeMinutes: 8,
    iconName: 'HeartPulse',
    colorScheme: {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-800',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-900',
      linearBg: 'from-rose-500 to-red-700',
    },
    keyFeatures: [
      '15-30 mins rapid emergency delivery',
      'Prescription upload & pharmacist verification',
      'Insulated cold-storage insulin packaging',
      '24x7 Night emergency dispatch slots',
    ],
    licensingLabel: 'Drug License (Form 20/21) & Registered Pharmacist ID',
    suggestedPincodeRadiusKm: 10,
  },
  cafe_kitchen: {
    type: 'cafe_kitchen',
    title: 'Cafe or Cloud Kitchen',
    shortTitle: 'Cafe / Kitchen',
    tagline: 'Freshly prepared food, artisanal beverages, bakery goods & meal box deliveries',
    defaultDeliveryTime: '20 - 35 Mins Hot Food Dispatch',
    defaultDeliveryMode: 'instant_express',
    averagePrepTimeMinutes: 22,
    iconName: 'Utensils',
    colorScheme: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-800',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900',
      linearBg: 'from-amber-500 to-orange-700',
    },
    keyFeatures: [
      'Live kitchen preparation time tracking (20-25 mins)',
      'Hot food thermal insulated bag dispatch',
      'Meal slots: Breakfast, Lunch, High-Tea & Dinner',
      'Custom addon instructions & cutlery preferences',
    ],
    licensingLabel: 'FSSAI Food Safety License (14-Digit)',
    suggestedPincodeRadiusKm: 7,
  },
  electronics_superstore: {
    type: 'electronics_superstore',
    title: 'Electronics or Super Store',
    shortTitle: 'Electronics / Super',
    tagline: 'Smartphones, TV appliances, computer gadgets, large consumer retail & audio gear',
    defaultDeliveryTime: '1 - 3 Hours Inspected Delivery',
    defaultDeliveryMode: 'hybrid_both',
    averagePrepTimeMinutes: 15,
    iconName: 'Tv',
    colorScheme: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-800',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-900',
      linearBg: 'from-blue-600 to-indigo-800',
    },
    keyFeatures: [
      '1-3 hour express or scheduled daytime slots',
      'Open-box inspection & IMEI verification check',
      '2-person rider crew for heavy appliances',
      'Serial number tracking & manufacturer warranty cards',
    ],
    licensingLabel: 'GSTIN Registration & Brand Authorized Dealership',
    suggestedPincodeRadiusKm: 15,
  },
  fruits_veg_dairy: {
    type: 'fruits_veg_dairy',
    title: 'Fruits, Vegetable & Dairy Store',
    shortTitle: 'Fruits & Dairy',
    tagline: 'Farm-fresh organic vegetables, seasonal fruits, fresh cow/buffalo milk & paneer',
    defaultDeliveryTime: '30 - 50 Mins Fresh Farm Run',
    defaultDeliveryMode: 'slot_scheduled',
    averagePrepTimeMinutes: 10,
    iconName: 'Leaf',
    colorScheme: {
      bg: 'bg-lime-50',
      border: 'border-lime-300',
      text: 'text-lime-800',
      badgeBg: 'bg-lime-100',
      badgeText: 'text-lime-900',
      linearBg: 'from-lime-600 to-emerald-800',
    },
    keyFeatures: [
      'Early morning fresh milk & produce run (06:00 AM - 08:30 AM)',
      'Zero-preservative perishables tracking',
      'Weighted produce scale integration (kg / gm)',
      'Evening kitchen fresh refill slot',
    ],
    licensingLabel: 'FSSAI Produce License / APMC Mandi Registration',
    suggestedPincodeRadiusKm: 6,
  },
  service_provider: {
    type: 'service_provider',
    title: 'Service Provider Store',
    shortTitle: 'Services Hub',
    tagline: 'Doorstep technician, AC repair, electricians, mobile fix & home appliance maintenance',
    defaultDeliveryTime: 'Doorstep Specialist Visit (Booked Slot)',
    defaultDeliveryMode: 'slot_scheduled',
    averagePrepTimeMinutes: 30,
    iconName: 'Wrench',
    colorScheme: {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      text: 'text-purple-800',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-900',
      linearBg: 'from-purple-600 to-indigo-900',
    },
    keyFeatures: [
      'Appointment slot-based order booking (2-hour windows)',
      'Background-verified certified technician dispatch',
      '30-Day post-service guarantee warranty',
      'Inspection fee deduction upon job confirmation',
    ],
    licensingLabel: 'MSME / Trade License & Technician Verification Records',
    suggestedPincodeRadiusKm: 12,
  },
};

export const getDefaultSlotsForStoreType = (type: StoreType): StoreDeliverySlot[] => {
  switch (type) {
    case 'grocery':
      return [
        {
          id: 'slot_groc_1',
          title: 'Early Morning Grocery Run (07:00 AM - 10:00 AM)',
          startTime: '07:00 AM',
          endTime: '10:00 AM',
          maxOrders: 35,
          currentOrders: 14,
          cutoffMinutes: 30,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Morning Staples',
        },
        {
          id: 'slot_groc_2',
          title: 'Midday Kitchen Essentials (11:00 AM - 02:00 PM)',
          startTime: '11:00 AM',
          endTime: '02:00 PM',
          maxOrders: 30,
          currentOrders: 8,
          cutoffMinutes: 30,
          slotFee: 0,
          isActive: true,
        },
        {
          id: 'slot_groc_3',
          title: 'Evening Pantry Refill (04:30 PM - 07:30 PM)',
          startTime: '04:30 PM',
          endTime: '07:30 PM',
          maxOrders: 45,
          currentOrders: 22,
          cutoffMinutes: 45,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Peak Hours',
        },
        {
          id: 'slot_groc_4',
          title: 'Night Express Delivery (08:00 PM - 10:30 PM)',
          startTime: '08:00 PM',
          endTime: '10:30 PM',
          maxOrders: 25,
          currentOrders: 5,
          cutoffMinutes: 30,
          slotFee: 15,
          isActive: true,
          specialBadge: 'Late Night',
        },
      ];

    case 'pharma':
      return [
        {
          id: 'slot_pharma_1',
          title: 'Morning Medication & Diagnostics (06:30 AM - 09:30 AM)',
          startTime: '06:30 AM',
          endTime: '09:30 AM',
          maxOrders: 25,
          currentOrders: 9,
          cutoffMinutes: 15,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Fasting Meds',
        },
        {
          id: 'slot_pharma_2',
          title: 'Afternoon Prescription Dispatch (12:00 PM - 03:00 PM)',
          startTime: '12:00 PM',
          endTime: '03:00 PM',
          maxOrders: 20,
          currentOrders: 6,
          cutoffMinutes: 15,
          slotFee: 0,
          isActive: true,
        },
        {
          id: 'slot_pharma_3',
          title: 'Evening Healthcare Rush (05:00 PM - 08:30 PM)',
          startTime: '05:00 PM',
          endTime: '08:30 PM',
          maxOrders: 35,
          currentOrders: 18,
          cutoffMinutes: 20,
          slotFee: 0,
          isActive: true,
        },
        {
          id: 'slot_pharma_4',
          title: '24x7 Night Emergency Care (09:00 PM - 06:00 AM)',
          startTime: '09:00 PM',
          endTime: '06:00 AM',
          maxOrders: 15,
          currentOrders: 3,
          cutoffMinutes: 10,
          slotFee: 30,
          isActive: true,
          specialBadge: 'Emergency Night Slot',
        },
      ];

    case 'cafe_kitchen':
      return [
        {
          id: 'slot_cafe_1',
          title: 'Breakfast & Morning Brews (07:30 AM - 11:00 AM)',
          startTime: '07:30 AM',
          endTime: '11:00 AM',
          maxOrders: 30,
          currentOrders: 12,
          cutoffMinutes: 20,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Breakfast Combos',
        },
        {
          id: 'slot_cafe_2',
          title: 'Lunch Rush & Meal Bowls (12:00 PM - 03:30 PM)',
          startTime: '12:00 PM',
          endTime: '03:30 PM',
          maxOrders: 60,
          currentOrders: 38,
          cutoffMinutes: 25,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Lunch Rush',
        },
        {
          id: 'slot_cafe_3',
          title: 'High-Tea, Bakery & Snacks (04:30 PM - 07:00 PM)',
          startTime: '04:30 PM',
          endTime: '07:00 PM',
          maxOrders: 40,
          currentOrders: 15,
          cutoffMinutes: 20,
          slotFee: 0,
          isActive: true,
          specialBadge: 'High Tea',
        },
        {
          id: 'slot_cafe_4',
          title: 'Dinner Feasts & Late Night (07:30 PM - 11:30 PM)',
          startTime: '07:30 PM',
          endTime: '11:30 PM',
          maxOrders: 70,
          currentOrders: 42,
          cutoffMinutes: 25,
          slotFee: 20,
          isActive: true,
          specialBadge: 'Dinner Rush',
        },
      ];

    case 'electronics_superstore':
      return [
        {
          id: 'slot_elec_1',
          title: 'Morning Tech Dispatch & Unboxing (10:00 AM - 01:00 PM)',
          startTime: '10:00 AM',
          endTime: '01:00 PM',
          maxOrders: 20,
          currentOrders: 7,
          cutoffMinutes: 60,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Express Tech',
        },
        {
          id: 'slot_elec_2',
          title: 'Afternoon Appliance Safe Transit (02:00 PM - 05:00 PM)',
          startTime: '02:00 PM',
          endTime: '05:00 PM',
          maxOrders: 25,
          currentOrders: 11,
          cutoffMinutes: 60,
          slotFee: 0,
          isActive: true,
        },
        {
          id: 'slot_elec_3',
          title: 'Prime Evening Home Demo & Setup (05:30 PM - 08:30 PM)',
          startTime: '05:30 PM',
          endTime: '08:30 PM',
          maxOrders: 30,
          currentOrders: 19,
          cutoffMinutes: 60,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Open-Box Demo',
        },
      ];

    case 'fruits_veg_dairy':
      return [
        {
          id: 'slot_fvd_1',
          title: '6 AM Farm Fresh Milk & Produce Run (06:00 AM - 08:30 AM)',
          startTime: '06:00 AM',
          endTime: '08:30 AM',
          maxOrders: 60,
          currentOrders: 41,
          cutoffMinutes: 60,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Farm Fresh Morning',
        },
        {
          id: 'slot_fvd_2',
          title: 'Midday Fresh Replenishment (11:00 AM - 01:30 PM)',
          startTime: '11:00 AM',
          endTime: '01:30 PM',
          maxOrders: 35,
          currentOrders: 12,
          cutoffMinutes: 45,
          slotFee: 0,
          isActive: true,
        },
        {
          id: 'slot_fvd_3',
          title: 'Evening Organic Farm Run (05:00 PM - 08:00 PM)',
          startTime: '05:00 PM',
          endTime: '08:00 PM',
          maxOrders: 50,
          currentOrders: 28,
          cutoffMinutes: 45,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Dinner Salad & Milk',
        },
      ];

    case 'service_provider':
      return [
        {
          id: 'slot_serv_1',
          title: 'Morning Technician Visit (09:00 AM - 12:00 PM)',
          startTime: '09:00 AM',
          endTime: '12:00 PM',
          maxOrders: 8,
          currentOrders: 4,
          cutoffMinutes: 60,
          slotFee: 0,
          isActive: true,
          specialBadge: 'Specialist Visit',
        },
        {
          id: 'slot_serv_2',
          title: 'Early Afternoon Repair Slot (12:30 PM - 03:30 PM)',
          startTime: '12:30 PM',
          endTime: '03:30 PM',
          maxOrders: 8,
          currentOrders: 6,
          cutoffMinutes: 60,
          slotFee: 0,
          isActive: true,
        },
        {
          id: 'slot_serv_3',
          title: 'Late Afternoon Maintenance (03:30 PM - 06:30 PM)',
          startTime: '03:30 PM',
          endTime: '06:30 PM',
          maxOrders: 8,
          currentOrders: 3,
          cutoffMinutes: 60,
          slotFee: 0,
          isActive: true,
        },
        {
          id: 'slot_serv_4',
          title: 'Evening Priority Callout (06:30 PM - 09:00 PM)',
          startTime: '06:30 PM',
          endTime: '09:00 PM',
          maxOrders: 6,
          currentOrders: 5,
          cutoffMinutes: 60,
          slotFee: 50,
          isActive: true,
          specialBadge: 'Priority Emergency',
        },
      ];

    default:
      return [
        {
          id: 'slot_gen_1',
          title: 'Morning Slot (10:00 AM - 01:00 PM)',
          startTime: '10:00 AM',
          endTime: '01:00 PM',
          maxOrders: 20,
          currentOrders: 5,
          cutoffMinutes: 30,
          slotFee: 0,
          isActive: true,
        },
        {
          id: 'slot_gen_2',
          title: 'Evening Slot (04:00 PM - 07:00 PM)',
          startTime: '04:00 PM',
          endTime: '07:00 PM',
          maxOrders: 25,
          currentOrders: 10,
          cutoffMinutes: 30,
          slotFee: 0,
          isActive: true,
        },
      ];
  }
};

export const getDefaultOrderAcceptanceConfig = (type: StoreType): StoreOrderAcceptanceConfig => {
  const meta = STORE_TYPES_METADATA[type];
  return {
    orderAcceptanceEnabled: true,
    deliveryTimePromise: meta.defaultDeliveryTime,
    deliveryMode: meta.defaultDeliveryMode,
    averagePrepTimeMinutes: meta.averagePrepTimeMinutes,
    autoAcceptOrders: true,
    maxConcurrentOrders: type === 'cafe_kitchen' ? 50 : type === 'service_provider' ? 12 : 35,
    slots: getDefaultSlotsForStoreType(type),
    prescriptionRequired: type === 'pharma',
    drugLicenseNumber: type === 'pharma' ? 'MH-TZ5-294821' : undefined,
    fssaiNumber: ['grocery', 'cafe_kitchen', 'fruits_veg_dairy'].includes(type) ? '11524999000123' : undefined,
    serviceWarrantyDays: type === 'service_provider' ? 30 : undefined,
    specialistDispatched: type === 'service_provider',
  };
};
