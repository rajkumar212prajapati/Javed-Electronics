export interface ShiprocketCredentials {
  email?: string;
  password?: string;
  token?: string;
  pickupLocation?: string;
}

export interface ShiprocketAuthResponse {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  token: string;
  expiresAt?: number;
  isSimulated?: boolean;
  message?: string;
}

export interface ShiprocketOrderItemPayload {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number | string;
}

export interface ShiprocketCreateOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string | number;
  billing_state: string;
  billing_country: string;
  billing_email?: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: ShiprocketOrderItemPayload[];
  payment_method: 'COD' | 'Prepaid';
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
}

export interface ShiprocketCreateOrderResponse {
  order_id: number | string;
  shipment_id: number | string;
  status: string;
  status_code: number;
  onboarding_completed_now?: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
  isSimulated?: boolean;
  message?: string;
}

export interface ShiprocketGenerateAwbPayload {
  shipment_id: number | string;
  courier_id?: number | string;
  status?: string;
}

export interface ShiprocketGenerateAwbResponse {
  success: boolean;
  awb_code: string;
  courier_name: string;
  courier_company_id?: number;
  shipment_id: number | string;
  applied_weight?: number;
  routing_code?: string;
  isSimulated?: boolean;
  message?: string;
}

export interface ShiprocketTrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  sr_status?: string;
  sr_status_label?: string;
}

export interface ShiprocketTrackingData {
  track_status: number;
  shipment_status: number;
  shipment_track?: Array<{
    id: number;
    awb_code: string;
    courier_name: string;
    current_status: string;
    origin: string;
    destination: string;
    pickup_date?: string;
    delivered_date?: string;
    expected_delivery_date?: string;
    etd?: string;
    scans?: ShiprocketTrackingActivity[];
  }>;
  shipment_track_activities?: ShiprocketTrackingActivity[];
  track_url?: string;
  isSimulated?: boolean;
}

export interface ShiprocketSyncResult {
  orderId: string;
  shipmentId?: number | string;
  awbCode: string;
  carrier: string;
  carrierStatus: string;
  statusLabel: string;
  mappedOrderStatus: string; // OrderStatus
  mappedCodStatus?: 'pending' | 'collected' | 'remitted' | 'settled_to_admin';
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  trackingUrl: string;
  latestActivity?: string;
  latestLocation?: string;
  updatedAt: string;
  isSimulated?: boolean;
  activities: ShiprocketTrackingActivity[];
}
