import {
  Order,
  OrderStatus,
  ExpressShipmentDetails,
  ShiprocketAuthResponse,
  ShiprocketCreateOrderPayload,
  ShiprocketCreateOrderResponse,
  ShiprocketGenerateAwbPayload,
  ShiprocketGenerateAwbResponse,
  ShiprocketTrackingData,
  ShiprocketSyncResult,
  ShiprocketTrackingActivity,
} from '../types';

const API_BASE = '/api/shipping/shiprocket';

/**
 * Status mapper from Shiprocket statuses to internal Javed Electronics OrderStatus
 */
export function mapShiprocketStatusToOrderStatus(srStatus: string): OrderStatus {
  const normalized = (srStatus || '').trim().toUpperCase();

  switch (normalized) {
    case 'NEW':
    case 'UNFULFILLED':
      return 'processing';
    case 'PICKUP SCHEDULED':
    case 'PICKUP QUEUED':
    case 'PICKUP GENERATED':
    case 'MANIFEST GENERATED':
      return 'packed';
    case 'PICKED UP':
    case 'SHIPPED':
    case 'IN TRANSIT':
    case 'REACHED AT DESTINATION HUB':
    case 'OUT FOR PICKUP':
      return 'assigned_to_delivery';
    case 'OUT FOR DELIVERY':
      return 'out_for_delivery';
    case 'DELIVERED':
      return 'delivered';
    case 'RTO INITIATED':
    case 'RTO IN TRANSIT':
    case 'RTO DELIVERED':
    case 'RETURNED':
      return 'returned';
    case 'CANCELED':
    case 'CANCELLED':
      return 'cancelled';
    case 'DELIVERY DELAYED':
    case 'FAILED':
    case 'UNDELIVERED':
      return 'delivery_failed';
    default:
      return 'out_for_delivery';
  }
}

/**
 * Visual badge config for Shiprocket tracking statuses
 */
export function getShiprocketStatusBadge(srStatus: string): {
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
} {
  const s = (srStatus || '').toUpperCase();
  if (s.includes('DELIVERED') && !s.includes('RTO')) {
    return {
      label: 'Delivered',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    };
  }
  if (s.includes('OUT FOR DELIVERY')) {
    return {
      label: 'Out for Delivery',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    };
  }
  if (s.includes('TRANSIT') || s.includes('SHIPPED') || s.includes('PICKED UP')) {
    return {
      label: 'In Transit',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  }
  if (s.includes('CANCEL') || s.includes('RTO') || s.includes('FAILED')) {
    return {
      label: s.includes('RTO') ? 'Return to Origin' : 'Cancelled / Issue',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    };
  }
  return {
    label: srStatus || 'Processing',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  };
}

/**
 * Converts an application Order into the Shiprocket Adhoc Order payload format
 */
export function convertOrderToShiprocketPayload(
  order: Order,
  customOptions?: {
    pickupLocation?: string;
    dimensions?: { length: number; breadth: number; height: number; weight: number };
  }
): ShiprocketCreateOrderPayload {
  const isCod = order.paymentMethod === 'cod';
  const pickup = customOptions?.pickupLocation || order.outletName || 'Hazratganj Flagship Store';

  // Format order date YYYY-MM-DD HH:mm
  const d = new Date(order.createdAt || Date.now());
  const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const orderItems = order.items.map((item) => ({
    name: item.productName || 'Electronic Accessory',
    sku: item.sku || `SKU-${item.productId.slice(0, 8)}`,
    units: item.activeQuantity !== undefined ? item.activeQuantity : item.quantity,
    selling_price: item.unitPrice,
    discount: 0,
    tax: item.gstRate || 18,
    hsn: item.hsnCode ? parseInt(item.hsnCode.replace(/\D/g, ''), 10) || 8517 : 8517,
  }));

  const dims = customOptions?.dimensions || {
    length: 18,
    breadth: 14,
    height: 8,
    weight: Math.max(0.4, Number((order.items.length * 0.35).toFixed(2))),
  };

  return {
    order_id: order.id,
    order_date: formattedDate,
    pickup_location: pickup,
    channel_id: '',
    comment: `Javed Electronics Express Dispatch (${order.outletName || 'Lucknow Store'})`,
    billing_customer_name: order.customer.name,
    billing_last_name: '',
    billing_address: order.customer.address,
    billing_address_2: order.customer.area || '',
    billing_city: order.customer.city || 'Lucknow',
    billing_pincode: order.customer.pincode || '226001',
    billing_state: order.customer.state || 'Uttar Pradesh',
    billing_country: 'India',
    billing_email: order.customer.email || 'customer@javed-electronics.in',
    billing_phone: order.customer.phone || '9839012345',
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: isCod ? 'COD' : 'Prepaid',
    sub_total: order.finalTotal,
    length: dims.length,
    breadth: dims.breadth,
    height: dims.height,
    weight: dims.weight,
  };
}

/**
 * 1. Test / Authenticate with Shiprocket API
 */
export async function authenticateShiprocket(credentials?: {
  email?: string;
  password?: string;
}): Promise<ShiprocketAuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials || {}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Auth failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn('Shiprocket API authenticate error, using client simulation:', error);
    return {
      token: `sim_token_${Date.now()}`,
      email: credentials?.email || 'admin@javed-electronics.in',
      first_name: 'Javed',
      last_name: 'Electronics',
      isSimulated: true,
      message: 'Simulated authenticated session (Live credentials not configured or offline)',
    };
  }
}

/**
 * 2. Create Adhoc Order / Shipment on Shiprocket
 */
export async function createShiprocketOrder(
  order: Order,
  options?: {
    pickupLocation?: string;
    dimensions?: { length: number; breadth: number; height: number; weight: number };
  }
): Promise<ShiprocketCreateOrderResponse> {
  const payload = convertOrderToShiprocketPayload(order, options);

  try {
    const res = await fetch(`${API_BASE}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Create order failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn('Shiprocket API create-order error, using client simulation:', error);
    const mockShipmentId = Math.floor(10000000 + Math.random() * 90000000);
    const mockAwb = `SR${Math.floor(1000000 + Math.random() * 9000000)}IN`;

    return {
      order_id: order.id,
      shipment_id: mockShipmentId,
      status: 'NEW',
      status_code: 1,
      awb_code: mockAwb,
      courier_name: 'Shiprocket Surface Express',
      isSimulated: true,
      message: 'Order shipment created in simulated mode (Live API fallback)',
    };
  }
}

/**
 * 3. Generate AWB ID & Assign Express Courier
 */
export async function generateShiprocketAWB(
  shipmentId: number | string,
  courierId?: number | string
): Promise<ShiprocketGenerateAwbResponse> {
  const payload: ShiprocketGenerateAwbPayload = {
    shipment_id: shipmentId,
    courier_id: courierId,
  };

  try {
    const res = await fetch(`${API_BASE}/generate-awb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Generate AWB failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn('Shiprocket API generate-awb error, using client simulation:', error);
    const randomAwb = `SR${Math.floor(10000000 + Math.random() * 90000000)}IN`;
    return {
      success: true,
      awb_code: randomAwb,
      courier_name: 'Shiprocket Bluedart Air Express',
      courier_company_id: 1,
      shipment_id: shipmentId,
      applied_weight: 0.5,
      isSimulated: true,
      message: 'Simulated AWB generated successfully (Live API fallback)',
    };
  }
}

/**
 * 4. Track Shipment by AWB Code or Order ID
 */
export async function trackShiprocketShipment(
  identifier: string
): Promise<ShiprocketTrackingData> {
  try {
    const cleanId = encodeURIComponent(identifier.trim());
    const res = await fetch(`${API_BASE}/track/${cleanId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Tracking lookup failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn('Shiprocket API track error, using simulated timeline:', error);
    return getSimulatedTrackingTimeline(identifier);
  }
}

/**
 * 5. Full Status Synchronization with Store Order Record
 * Fetches latest Shiprocket milestones, determines mapped OrderStatus and COD collection status,
 * and returns ready-to-merge sync object.
 */
export async function syncShipmentStatus(
  order: Order,
  customAwb?: string
): Promise<ShiprocketSyncResult> {
  const targetAwb = customAwb || order.dispatchDetails?.awbNumber;

  if (!targetAwb) {
    throw new Error(`Order ${order.id} does not have an assigned AWB number for status sync.`);
  }

  try {
    const res = await fetch(`${API_BASE}/sync-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        awbCode: targetAwb,
        paymentMethod: order.paymentMethod,
        isCod: order.paymentMethod === 'cod',
      }),
    });

    if (res.ok) {
      const syncData: ShiprocketSyncResult = await res.json();
      return syncData;
    }
  } catch (e) {
    console.warn('Shiprocket server sync-status failed, synthesizing client-side sync:', e);
  }

  // Fallback client-side synchronization calculation
  const trackingData = await trackShiprocketShipment(targetAwb);
  const track = trackingData.shipment_track?.[0];
  const currentStatus = track?.current_status || 'IN TRANSIT';
  const mappedStatus = mapShiprocketStatusToOrderStatus(currentStatus);

  const isDelivered = mappedStatus === 'delivered';
  const isCod = order.paymentMethod === 'cod';

  const mappedCodStatus: 'pending' | 'collected' | 'remitted' | 'settled_to_admin' = isCod
    ? isDelivered
      ? 'collected'
      : (order.dispatchDetails?.codCollectedStatus || 'pending')
    : 'collected';

  const activities = trackingData.shipment_track_activities || track?.scans || [];
  const latestScan = activities[0];

  return {
    orderId: order.id,
    shipmentId: track?.id,
    awbCode: targetAwb,
    carrier: track?.courier_name || 'Shiprocket Express',
    carrierStatus: currentStatus,
    statusLabel: getShiprocketStatusBadge(currentStatus).label,
    mappedOrderStatus: mappedStatus,
    mappedCodStatus,
    estimatedDeliveryDate: track?.expected_delivery_date || track?.etd || 'Tomorrow by 2:00 PM',
    deliveredAt: isDelivered ? (track?.delivered_date || new Date().toISOString()) : undefined,
    trackingUrl: trackingData.track_url || `https://shiprocket.co/tracking/${targetAwb}`,
    latestActivity: latestScan?.activity || 'Shipment in transit to Lucknow sorting hub',
    latestLocation: latestScan?.location || 'Lucknow Hub, Uttar Pradesh',
    updatedAt: new Date().toISOString(),
    isSimulated: trackingData.isSimulated ?? true,
    activities,
  };
}

/**
 * Generates realistic mock milestones for demonstration & offline resilience
 */
export function getSimulatedTrackingTimeline(identifier: string): ShiprocketTrackingData {
  const now = new Date();
  const formatTime = (hoursAgo: number) => {
    const d = new Date(now.getTime() - hoursAgo * 3600 * 1000);
    return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
  };

  const activities: ShiprocketTrackingActivity[] = [
    {
      date: formatTime(1),
      status: 'OUT FOR DELIVERY',
      activity: 'Shipment out for delivery with executive in Lucknow Central',
      location: 'Lucknow Delivery Station, UP',
      sr_status: 'OUT FOR DELIVERY',
      sr_status_label: 'Out for Delivery',
    },
    {
      date: formatTime(5),
      status: 'REACHED HUB',
      activity: 'Package arrived at regional sorting facility (Hazratganj Hub)',
      location: 'Hazratganj Sorting Hub, Lucknow',
      sr_status: 'IN TRANSIT',
      sr_status_label: 'In Transit',
    },
    {
      date: formatTime(12),
      status: 'IN TRANSIT',
      activity: 'Bag departed from Lucknow North Mother Hub',
      location: 'Amausi Logistics Center, Lucknow',
      sr_status: 'IN TRANSIT',
      sr_status_label: 'In Transit',
    },
    {
      date: formatTime(20),
      status: 'PICKED UP',
      activity: 'Consignment collected from Javed Electronics Flagship Store',
      location: 'Janpath Market, Hazratganj, Lucknow',
      sr_status: 'PICKED UP',
      sr_status_label: 'Picked Up',
    },
    {
      date: formatTime(24),
      status: 'MANIFESTED',
      activity: 'Order Manifest and AWB generated on Shiprocket system',
      location: 'Javed Electronics Dispatch Desk, Lucknow',
      sr_status: 'MANIFEST GENERATED',
      sr_status_label: 'Manifest Created',
    },
  ];

  return {
    track_status: 1,
    shipment_status: 17,
    shipment_track: [
      {
        id: 98451201,
        awb_code: identifier,
        courier_name: 'Shiprocket Express',
        current_status: 'OUT FOR DELIVERY',
        origin: 'Lucknow, UP',
        destination: 'Lucknow, UP',
        pickup_date: formatTime(20),
        expected_delivery_date: 'Today by 6:00 PM',
        etd: 'Today by 6:00 PM',
        scans: activities,
      },
    ],
    shipment_track_activities: activities,
    track_url: `https://shiprocket.co/tracking/${identifier}`,
    isSimulated: true,
  };
}
