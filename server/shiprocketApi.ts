import { Router, Request, Response } from 'express';

export const shiprocketRouter = Router();

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

interface CachedAuth {
  token: string;
  expiresAt: number;
  email: string;
}

let cachedAuth: CachedAuth | null = null;

/**
 * Obtain Shiprocket JWT token with caching and auto-refresh
 */
async function getShiprocketAuthToken(customCredentials?: { email?: string; password?: string }): Promise<string | null> {
  const email = customCredentials?.email || process.env.SHIPROCKET_EMAIL;
  const password = customCredentials?.password || process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    return null;
  }

  // Return cached token if valid for more than 5 minutes
  if (cachedAuth && cachedAuth.email === email && Date.now() < cachedAuth.expiresAt - 5 * 60 * 1000) {
    return cachedAuth.token;
  }

  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      console.warn(`Shiprocket auth login failed with HTTP status: ${res.status}`);
      return null;
    }

    const data: any = await res.json();
    if (data && data.token) {
      // Tokens are typically valid for 10 days; cache for 9 days
      cachedAuth = {
        token: data.token,
        email,
        expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
      };
      return data.token;
    }
  } catch (error) {
    console.error('Shiprocket auth request error:', error);
  }

  return null;
}

/**
 * Status mapping helper
 */
function mapCarrierStatusToInternal(srStatus: string): {
  orderStatus: string;
  label: string;
} {
  const s = (srStatus || '').trim().toUpperCase();

  if (s.includes('DELIVERED') && !s.includes('RTO')) {
    return { orderStatus: 'delivered', label: 'Delivered' };
  }
  if (s.includes('OUT FOR DELIVERY')) {
    return { orderStatus: 'out_for_delivery', label: 'Out for Delivery' };
  }
  if (s.includes('TRANSIT') || s.includes('SHIPPED') || s.includes('REACHED') || s.includes('HUB')) {
    return { orderStatus: 'assigned_to_delivery', label: 'In Transit' };
  }
  if (s.includes('PICKED UP') || s.includes('PICKUP')) {
    return { orderStatus: 'packed', label: 'Picked Up by Courier' };
  }
  if (s.includes('MANIFEST') || s.includes('NEW')) {
    return { orderStatus: 'processing', label: 'Shipment Created' };
  }
  if (s.includes('RTO') || s.includes('RETURN')) {
    return { orderStatus: 'returned', label: 'Returned to Origin' };
  }
  if (s.includes('CANCEL')) {
    return { orderStatus: 'cancelled', label: 'Cancelled' };
  }
  if (s.includes('FAIL') || s.includes('DELAY')) {
    return { orderStatus: 'delivery_failed', label: 'Delivery Delayed / Failed' };
  }

  return { orderStatus: 'out_for_delivery', label: srStatus || 'Dispatched' };
}

/**
 * Realistic simulated tracking generator for demo & fallback
 */
function generateSimulatedTracking(identifier: string) {
  const now = Date.now();
  const formatTime = (hoursAgo: number) => {
    const d = new Date(now - hoursAgo * 3600 * 1000);
    return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
  };

  const activities = [
    {
      date: formatTime(1),
      status: 'OUT FOR DELIVERY',
      activity: 'Shipment is out for doorstep delivery with courier executive in Lucknow',
      location: 'Lucknow Central Delivery Hub, UP',
      sr_status: 'OUT FOR DELIVERY',
      sr_status_label: 'Out for Delivery',
    },
    {
      date: formatTime(4),
      status: 'REACHED HUB',
      activity: 'Consignment arrived at Hazratganj Hub and scanned for route dispatch',
      location: 'Hazratganj Sorting Center, Lucknow',
      sr_status: 'IN TRANSIT',
      sr_status_label: 'In Transit',
    },
    {
      date: formatTime(10),
      status: 'IN TRANSIT',
      activity: 'Shipment departed from Lucknow Amausi Mother Hub',
      location: 'Amausi Logistics Park, Lucknow',
      sr_status: 'IN TRANSIT',
      sr_status_label: 'In Transit',
    },
    {
      date: formatTime(18),
      status: 'PICKED UP',
      activity: 'Order collected from Javed Electronics Flagship Store desk',
      location: 'Janpath Market, Hazratganj, Lucknow',
      sr_status: 'PICKED UP',
      sr_status_label: 'Picked Up',
    },
    {
      date: formatTime(22),
      status: 'MANIFEST GENERATED',
      activity: 'Shipment manifest registered and AWB assigned electronically',
      location: 'Javed Electronics Dispatch Desk, Lucknow',
      sr_status: 'MANIFEST GENERATED',
      sr_status_label: 'Manifest Generated',
    },
  ];

  return {
    track_status: 1,
    shipment_status: 17,
    shipment_track: [
      {
        id: Math.floor(10000000 + Math.random() * 90000000),
        awb_code: identifier,
        courier_name: 'Shiprocket Express',
        current_status: 'OUT FOR DELIVERY',
        origin: 'Lucknow, UP',
        destination: 'Lucknow, UP',
        pickup_date: formatTime(18),
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

// 1. Authenticate / Check Shiprocket Status
shiprocketRouter.post('/auth', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const token = await getShiprocketAuthToken({ email, password });

    if (token) {
      return res.json({
        success: true,
        token,
        email: email || process.env.SHIPROCKET_EMAIL,
        isSimulated: false,
        message: 'Successfully authenticated with Shiprocket API.',
      });
    }

    // Fallback simulated session
    return res.json({
      success: true,
      token: `sr_token_demo_${Date.now()}`,
      email: email || 'admin@javed-electronics.in',
      isSimulated: true,
      message: 'Running in simulated demonstration mode (Shiprocket credentials not provided in env).',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Authentication error' });
  }
});

// 2. Create Adhoc Order Shipment on Shiprocket
shiprocketRouter.post('/create-order', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.order_id) {
      return res.status(400).json({ error: 'Order details and order_id are required.' });
    }

    const token = await getShiprocketAuthToken();

    if (token) {
      try {
        const srRes = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data: any = await srRes.json();
        if (srRes.ok && data) {
          return res.json({
            ...data,
            isSimulated: false,
          });
        }
        console.warn('Shiprocket create order API responded with error:', data);
      } catch (err) {
        console.warn('Shiprocket API create order call failed, falling back to simulated response:', err);
      }
    }

    // High-fidelity fallback simulated response
    const mockShipmentId = Math.floor(10000000 + Math.random() * 90000000);
    const mockAwb = `SR${Math.floor(10000000 + Math.random() * 90000000)}IN`;

    return res.json({
      order_id: payload.order_id,
      shipment_id: mockShipmentId,
      status: 'NEW',
      status_code: 1,
      awb_code: mockAwb,
      courier_name: 'Shiprocket Surface Express',
      isSimulated: true,
      message: 'Order created in simulated mode (Shiprocket demo fallback)',
    });
  } catch (error: any) {
    console.error('Create shipment error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create shipment' });
  }
});

// 3. Generate AWB ID & Assign Courier
shiprocketRouter.post('/generate-awb', async (req: Request, res: Response) => {
  try {
    const { shipment_id, courier_id } = req.body;
    if (!shipment_id) {
      return res.status(400).json({ error: 'shipment_id is required to assign AWB.' });
    }

    const token = await getShiprocketAuthToken();

    if (token) {
      try {
        const srRes = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            shipment_id,
            courier_id: courier_id || undefined,
          }),
        });

        const data: any = await srRes.json();
        if (srRes.ok && data?.response?.data?.awb_code) {
          const awbData = data.response.data;
          return res.json({
            success: true,
            awb_code: awbData.awb_code,
            courier_name: awbData.courier_name || 'Shiprocket Express',
            courier_company_id: awbData.courier_company_id,
            shipment_id,
            applied_weight: awbData.applied_weight || 0.5,
            isSimulated: false,
          });
        }
        console.warn('Shiprocket assign AWB responded with:', data);
      } catch (err) {
        console.warn('Shiprocket API assign AWB failed, falling back:', err);
      }
    }

    // High-fidelity fallback simulated AWB
    const generatedAwb = `SR${Math.floor(10000000 + Math.random() * 90000000)}IN`;
    return res.json({
      success: true,
      awb_code: generatedAwb,
      courier_name: 'Shiprocket Bluedart Air Express',
      courier_company_id: 1,
      shipment_id,
      applied_weight: 0.5,
      isSimulated: true,
      message: 'Simulated AWB generated successfully (Demo Mode)',
    });
  } catch (error: any) {
    console.error('Generate AWB error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate AWB' });
  }
});

// 4. Track Shipment by AWB Code or Order ID
shiprocketRouter.get('/track/:identifier', async (req: Request, res: Response) => {
  try {
    const identifier = req.params.identifier;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier (AWB code or Order ID) is required.' });
    }

    const token = await getShiprocketAuthToken();

    if (token) {
      try {
        const isAwb = /^SR|^DLV|^BD|\d{8,}/i.test(identifier);
        const trackUrl = isAwb
          ? `${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(identifier)}`
          : `${SHIPROCKET_BASE_URL}/courier/track?order_id=${encodeURIComponent(identifier)}`;

        const srRes = await fetch(trackUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data: any = await srRes.json();
        if (srRes.ok && data) {
          return res.json({
            ...data,
            isSimulated: false,
          });
        }
      } catch (err) {
        console.warn('Shiprocket tracking API failed, falling back to simulated:', err);
      }
    }

    // Fallback simulation
    return res.json(generateSimulatedTracking(identifier));
  } catch (error: any) {
    console.error('Tracking lookup error:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve tracking' });
  }
});

// 5. Status Synchronization Endpoint
shiprocketRouter.post('/sync-status', async (req: Request, res: Response) => {
  try {
    const { orderId, awbCode, paymentMethod, isCod } = req.body;
    if (!orderId || !awbCode) {
      return res.status(400).json({ error: 'orderId and awbCode are required for status synchronization.' });
    }

    const token = await getShiprocketAuthToken();
    let trackingData: any = null;
    let isSimulated = true;

    if (token) {
      try {
        const srRes = await fetch(`${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(awbCode)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (srRes.ok) {
          trackingData = await srRes.json();
          isSimulated = false;
        }
      } catch (err) {
        console.warn('Live track failed during sync, using simulated:', err);
      }
    }

    if (!trackingData) {
      trackingData = generateSimulatedTracking(awbCode);
    }

    const track = trackingData.shipment_track?.[0];
    const carrierStatus = track?.current_status || 'OUT FOR DELIVERY';
    const { orderStatus, label } = mapCarrierStatusToInternal(carrierStatus);

    const isDelivered = orderStatus === 'delivered';
    const mappedCodStatus = isCod
      ? isDelivered
        ? 'collected'
        : 'pending'
      : 'collected';

    const activities = trackingData.shipment_track_activities || track?.scans || [];
    const latestScan = activities[0];

    const result = {
      orderId,
      shipmentId: track?.id,
      awbCode,
      carrier: track?.courier_name || 'Shiprocket Express',
      carrierStatus,
      statusLabel: label,
      mappedOrderStatus: orderStatus,
      mappedCodStatus,
      estimatedDeliveryDate: track?.expected_delivery_date || track?.etd || 'Today by 6:00 PM',
      deliveredAt: isDelivered ? (track?.delivered_date || new Date().toISOString()) : undefined,
      trackingUrl: trackingData.track_url || `https://shiprocket.co/tracking/${awbCode}`,
      latestActivity: latestScan?.activity || 'In transit to Lucknow destination hub',
      latestLocation: latestScan?.location || 'Lucknow Hub, Uttar Pradesh',
      updatedAt: new Date().toISOString(),
      isSimulated,
      activities,
    };

    return res.json(result);
  } catch (error: any) {
    console.error('Status sync error:', error);
    return res.status(500).json({ error: error.message || 'Status sync failed' });
  }
});
