export type SlaHealthStatus = 'green' | 'yellow' | 'red';

export interface SlaThresholdRange {
  idealGreenMax: number;       // Values <= this are IDEAL (Green) (or >= if higherIsBetter)
  warningYellowMax: number;    // Values <= this are WARNING (Yellow)
  criticalRedAbove: number;    // Values > this are CRITICAL (Red)
  unit: string;
  description: string;
  sopInstruction: string;
}

export interface OrderLifecycleSlaConfig {
  packingTimeMinutes: SlaThresholdRange;
  riderAssignmentMinutes: SlaThresholdRange;
  dispatchTimeMinutes: SlaThresholdRange;
  totalDeliveryMinutes: SlaThresholdRange;
  paymentVerificationMinutes: SlaThresholdRange;
  returnInspectionHours: SlaThresholdRange;
}

export type MetricCategory =
  | 'inventory_health'
  | 'order_stress'
  | 'inventory_stress'
  | 'outlet_demand'
  | 'product_demand'
  | 'location_stress'
  | 'seller_stress';

export interface StressMetricDefinition {
  id: string;
  name: string;
  category: MetricCategory;
  categoryLabel: string;
  unit: string;
  higherIsBetter: boolean;     // e.g. Stock Availability Rate: higher is better; Backlog: lower is better
  idealGreen: number;          // Green threshold
  warningYellow: number;       // Yellow threshold
  criticalRed: number;         // Red threshold
  currentLiveValue: number;
  currentStatus: SlaHealthStatus;
  description: string;
  sopGuidelines: string;
  automatedRemedy: string;
}

export interface CustomerTagSlaRule {
  id: string;
  tagName: string;
  badgeColor: string;
  criteria: string;
  slaTargetMinutes: number;
  assignedSlaStatus: SlaHealthStatus;
  dispatchPriority: 'Express Expedited' | 'Standard Queue' | 'OTP / Anti-Fraud Lock' | 'Manager Sign-off';
  autoInspectionRequired: boolean;
  notes: string;
}

export interface SellerTagSlaRule {
  id: string;
  tagName: string;
  badgeColor: string;
  qualification: string;
  slaTargetScorePct: number;
  assignedSlaStatus: SlaHealthStatus;
  maxFulfillmentLatencyMin: number;
  penaltiesOrActions: string;
  activeSellerCount: number;
}

export interface OutletSlaCompliance {
  outletId: string;
  outletName: string;
  overallStatus: SlaHealthStatus;
  complianceRatePct: number;
  activeOrdersInQueue: number;
  avgPackTimeMin: number;
  avgDispatchTimeMin: number;
  avgDeliveryTimeMin: number;
  stockHealthPct: number;
  inventoryStressPct: number;
  activeRidersCount: number;
  criticalViolations: string[];
}

export interface SopSlaMasterConfig {
  presetName: 'express_2h' | 'same_day_standard' | 'relaxed_b2b' | 'custom';
  presetLabel: string;
  lastUpdated: string;
  updatedBy: string;
  orderLifecycle: OrderLifecycleSlaConfig;
  metrics: StressMetricDefinition[];
  customerTags: CustomerTagSlaRule[];
  sellerTags: SellerTagSlaRule[];
}
