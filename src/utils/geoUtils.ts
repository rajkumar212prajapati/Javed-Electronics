export interface Coordinates {
  lat: number;
  lng: number;
}

// Store Coordinates for Javed Electronics Flagship (Shop 09 Sai Dham Apt Vijaynagar Nalasopara East 401209)
export const DEFAULT_STORE_COORDINATES: Coordinates = {
  lat: 19.4180,
  lng: 72.8290, // Shop 09 Sai Dham Apt, Vijaynagar, Nalasopara East 401209, Palghar Mumbai Maharashtra
};

// All 45 Serviceable Delivery Areas across Nalasopara, Vasai, Virar, Palghar & Mumbai MMR
export const POPULAR_DELIVERY_LANDMARKS = [
  { id: 0, name: 'Shop 09 Sai Dham Apt, Vijaynagar', area: 'Nalasopara East', pincode: '401209', lat: 19.4180, lng: 72.8290, isStore: true },
  { id: 1, name: 'Nalasopara East', area: 'Nalasopara East', pincode: '401209', lat: 19.4180, lng: 72.8290 },
  { id: 2, name: 'Nalasopara West', area: 'Nalasopara West', pincode: '401203', lat: 19.4165, lng: 72.8050 },
  { id: 3, name: 'Tulinj', area: 'Tulinj, Nalasopara East', pincode: '401209', lat: 19.4210, lng: 72.8235 },
  { id: 4, name: 'Achole Road', area: 'Achole Road, Nalasopara East', pincode: '401209', lat: 19.4250, lng: 72.8260 },
  { id: 5, name: 'Moregaon', area: 'Moregaon, Nalasopara East', pincode: '401209', lat: 19.4120, lng: 72.8310 },
  { id: 6, name: 'Alkapuri', area: 'Alkapuri, Nalasopara East', pincode: '401209', lat: 19.4150, lng: 72.8270 },
  { id: 7, name: 'Nilemore', area: 'Nilemore, Nalasopara West', pincode: '401203', lat: 19.4230, lng: 72.8020 },
  { id: 8, name: 'Agarwal Nagar', area: 'Agarwal Nagar, Nalasopara East', pincode: '401209', lat: 19.4190, lng: 72.8340 },
  { id: 9, name: 'Pragati Nagar', area: 'Pragati Nagar, Nalasopara East', pincode: '401209', lat: 19.4225, lng: 72.8295 },
  { id: 10, name: 'Sopara Gaon', area: 'Sopara Gaon', pincode: '401304', lat: 19.4080, lng: 72.7980 },
  { id: 11, name: 'Pelhar', area: 'Pelhar, Vasai East', pincode: '401208', lat: 19.4150, lng: 72.8650 },
  { id: 12, name: 'Vasai West', area: 'Vasai West', pincode: '401201', lat: 19.3680, lng: 72.8120 },
  { id: 13, name: 'Vasai Road', area: 'Vasai Road', pincode: '401202', lat: 19.3820, lng: 72.8320 },
  { id: 14, name: 'Vasai East', area: 'Vasai East', pincode: '401208', lat: 19.3850, lng: 72.8550 },
  { id: 15, name: 'Naigaon', area: 'Naigaon', pincode: '401207', lat: 19.3510, lng: 72.8460 },
  { id: 16, name: 'Papdi', area: 'Papdi, Vasai', pincode: '401207', lat: 19.3620, lng: 72.8040 },
  { id: 17, name: 'Manickpur', area: 'Manickpur, Vasai', pincode: '401202', lat: 19.3780, lng: 72.8220 },
  { id: 18, name: 'Ambadi Road', area: 'Ambadi Road, Vasai', pincode: '401202', lat: 19.3795, lng: 72.8275 },
  { id: 19, name: 'Bhabola Naka', area: 'Bhabola Naka, Vasai', pincode: '401202', lat: 19.3720, lng: 72.8190 },
  { id: 20, name: 'Gokhivare', area: 'Gokhivare, Vasai East', pincode: '401208', lat: 19.3980, lng: 72.8620 },
  { id: 21, name: 'Valiv', area: 'Valiv, Vasai East', pincode: '401208', lat: 19.3920, lng: 72.8680 },
  { id: 22, name: 'Sativali', area: 'Sativali, Vasai East', pincode: '401208', lat: 19.4050, lng: 72.8720 },
  { id: 23, name: 'Kaman', area: 'Kaman, Vasai East', pincode: '401208', lat: 19.3620, lng: 72.9050 },
  { id: 24, name: 'Juchandra', area: 'Juchandra, Naigaon East', pincode: '401208', lat: 19.3540, lng: 72.8640 },
  { id: 25, name: 'Bhuigaon', area: 'Bhuigaon, Vasai West', pincode: '401201', lat: 19.3580, lng: 72.7840 },
  { id: 26, name: 'Giriz', area: 'Giriz, Vasai West', pincode: '401201', lat: 19.3650, lng: 72.7950 },
  { id: 27, name: 'Nirmal', area: 'Nirmal, Nalasopara West', pincode: '401304', lat: 19.4350, lng: 72.7820 },
  { id: 28, name: 'Rajodi', area: 'Rajodi Beach Road', pincode: '401304', lat: 19.4480, lng: 72.7720 },
  { id: 29, name: 'Virar West', area: 'Virar West', pincode: '401303', lat: 19.4680, lng: 72.8010 },
  { id: 30, name: 'Virar East', area: 'Virar East', pincode: '401305', lat: 19.4620, lng: 72.8250 },
  { id: 31, name: 'Bolinj', area: 'Bolinj, Virar West', pincode: '401303', lat: 19.4750, lng: 72.8090 },
  { id: 32, name: 'Chandansar', area: 'Chandansar, Virar East', pincode: '401303', lat: 19.4820, lng: 72.8280 },
  { id: 33, name: 'Vartak Ward', area: 'Vartak Ward, Virar West', pincode: '401303', lat: 19.4650, lng: 72.8120 },
  { id: 34, name: 'Global City', area: 'Global City, Virar West', pincode: '401303', lat: 19.4720, lng: 72.8050 },
  { id: 36, name: 'Agashi', area: 'Agashi, Virar', pincode: '401301', lat: 19.4850, lng: 72.7860 },
  { id: 37, name: 'Arnala', area: 'Arnala, Virar West', pincode: '401302', lat: 19.4520, lng: 72.7620 },
  { id: 38, name: 'Chikhal Dongre', area: 'Chikhal Dongre, Agashi', pincode: '401301', lat: 19.4920, lng: 72.7780 },
  { id: 39, name: 'Kophrad', area: 'Kophrad, Virar West', pincode: '401301', lat: 19.4780, lng: 72.7880 },
  { id: 40, name: 'Vatar', area: 'Vatar, Agashi Road', pincode: '401301', lat: 19.4880, lng: 72.7710 },
  { id: 41, name: 'Mandvi', area: 'Mandvi, Virar East', pincode: '401303', lat: 19.4580, lng: 72.9150 },
  { id: 42, name: 'Parol', area: 'Parol, Virar East', pincode: '401303', lat: 19.4420, lng: 72.9450 },
  { id: 43, name: 'Bhatane', area: 'Bhatane, Virar', pincode: '401303', lat: 19.4650, lng: 72.9750 },
  { id: 44, name: 'Kalamb', area: 'Kalamb Beach Road', pincode: '401304', lat: 19.4210, lng: 72.7740 },
  { id: 45, name: 'Virar East extended areas', area: 'Virar East Extended', pincode: '401309', lat: 19.4710, lng: 72.8420 },
];

// Backward-compatible alias
export const LUCKNOW_POPULAR_LANDMARKS = POPULAR_DELIVERY_LANDMARKS;

/**
 * Checks if coordinates are missing, invalid, or pointing to legacy Lucknow seed coordinates
 */
export function isLegacyOrInvalidCoord(coords?: Coordinates | null): boolean {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return true;
  if (Number.isNaN(coords.lat) || Number.isNaN(coords.lng)) return true;
  // Legacy Lucknow coordinates are around lat 26.8, lng 80.9
  if (coords.lat > 23 && coords.lat < 28 && coords.lng > 78 && coords.lng < 83) return true;
  return false;
}

/**
 * Ensures coordinates are valid and within the active store region (falls back to Nalasopara East)
 */
export function sanitizeStoreCoordinates(
  coords?: Coordinates | null,
  fallback: Coordinates = DEFAULT_STORE_COORDINATES
): Coordinates {
  if (isLegacyOrInvalidCoord(coords)) {
    return { ...fallback };
  }
  return { lat: coords!.lat, lng: coords!.lng };
}

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula (km)
 */
export function calculateHaversineDistanceKm(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // 1 decimal place e.g. 3.4 km
}

/**
 * Finds the nearest serviceable landmark/locality to a given coordinate
 */
export function findNearestDeliveryLandmark(coords: Coordinates): {
  landmark: (typeof POPULAR_DELIVERY_LANDMARKS)[0];
  distanceKm: number;
  area: string;
  pincode: string;
  suggestedAddress: string;
} {
  let best = POPULAR_DELIVERY_LANDMARKS[1] || POPULAR_DELIVERY_LANDMARKS[0];
  let minDistance = Infinity;

  for (const item of POPULAR_DELIVERY_LANDMARKS) {
    const d = calculateHaversineDistanceKm(coords, { lat: item.lat, lng: item.lng });
    if (d < minDistance) {
      minDistance = d;
      best = item;
    }
  }

  const distRounded = Math.round(minDistance * 10) / 10;
  const suggestedAddress =
    distRounded <= 0.6
      ? `Near ${best.name}, ${best.area}`
      : `${best.area} (${distRounded} km from ${best.name})`;

  return {
    landmark: best,
    distanceKm: distRounded,
    area: best.area,
    pincode: best.pincode,
    suggestedAddress,
  };
}

/**
 * Estimates delivery time based on distance, packing/prep time, and average city speed (25 km/h)
 */
export function estimateDeliveryMinutes(
  distanceKm: number,
  basePrepMinutes = 15,
  avgSpeedKmh = 25
): { min: number; max: number; label: string } {
  const travelMinutes = (distanceKm / avgSpeedKmh) * 60;
  const totalMin = Math.round(basePrepMinutes + travelMinutes);
  const totalMax = Math.round(totalMin + 12);

  const roundedMin = Math.max(15, Math.ceil(totalMin / 5) * 5);
  const roundedMax = Math.max(roundedMin + 10, Math.ceil(totalMax / 5) * 5);

  return {
    min: roundedMin,
    max: roundedMax,
    label: `${roundedMin} - ${roundedMax} mins`,
  };
}

/**
 * Interpolates a coordinate between origin and destination by progress ratio (0.0 to 1.0)
 * If a multi-point route path is provided, interpolates smoothly along the polyline vertices!
 */
export function interpolateCoordinates(
  start: Coordinates,
  end: Coordinates,
  progress: number,
  routePath?: Coordinates[]
): Coordinates {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  if (routePath && routePath.length >= 2) {
    if (clampedProgress <= 0) return routePath[0];
    if (clampedProgress >= 1) return routePath[routePath.length - 1];
    const exactIdx = clampedProgress * (routePath.length - 1);
    const lowerIdx = Math.floor(exactIdx);
    const upperIdx = Math.min(routePath.length - 1, lowerIdx + 1);
    const segmentFraction = exactIdx - lowerIdx;
    const p1 = routePath[lowerIdx];
    const p2 = routePath[upperIdx];
    return {
      lat: p1.lat + (p2.lat - p1.lat) * segmentFraction,
      lng: p1.lng + (p2.lng - p1.lng) * segmentFraction,
    };
  }

  return {
    lat: start.lat + (end.lat - start.lat) * clampedProgress,
    lng: start.lng + (end.lng - start.lng) * clampedProgress,
  };
}

/**
 * Generates realistic intermediate arterial road waypoints between store and customer
 * when live Directions/Routes API polylines are still loading or unavailable.
 */
export function generateArterialRouteWaypoints(
  origin: Coordinates,
  destination: Coordinates
): Coordinates[] {
  const dLat = destination.lat - origin.lat;
  const dLng = destination.lng - origin.lng;
  const dist = calculateHaversineDistanceKm(origin, destination);

  if (dist < 0.3) {
    return [origin, destination];
  }

  // Create realistic road-grid dogleg waypoints simulating local arterial turns
  const wp1: Coordinates = {
    lat: origin.lat + dLat * 0.25 + dLng * 0.06,
    lng: origin.lng + dLng * 0.18 - dLat * 0.04,
  };
  const wp2: Coordinates = {
    lat: origin.lat + dLat * 0.55 - dLng * 0.04,
    lng: origin.lng + dLng * 0.52 + dLat * 0.05,
  };
  const wp3: Coordinates = {
    lat: origin.lat + dLat * 0.82 + dLng * 0.03,
    lng: origin.lng + dLng * 0.85 - dLat * 0.02,
  };

  return [origin, wp1, wp2, wp3, destination];
}

/**
 * Formats navigation direction URL for rider to open directly in Google Maps application
 */
export function getGoogleMapsNavigationUrl(
  origin: Coordinates,
  destination: Coordinates,
  label = 'Customer Delivery'
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

/**
 * Generates turn-by-turn routing steps for rider navigation in Nalasopara, Vasai & Virar
 */
export function generateSuggestedRouteSteps(
  originName: string,
  destinationArea: string,
  distanceKm: number
): string[] {
  const cleanOrigin = originName.includes('Hazratganj')
    ? 'Shop 09 Sai Dham Apt, Vijaynagar (Nalasopara East)'
    : originName;
  const cleanDest = destinationArea.includes('Hazratganj') || destinationArea.includes('Gomti')
    ? 'Nalasopara East'
    : destinationArea;

  if (distanceKm <= 2) {
    return [
      `Depart from ${cleanOrigin} onto Vijaynagar Main Road (350m)`,
      `Continue via Tulinj / Achole arterial road towards ${cleanDest}`,
      `Turn into customer society lane and arrive at pinned doorstep`,
    ];
  } else if (distanceKm <= 6) {
    return [
      `Depart from ${cleanOrigin} via Vijaynagar - Achole Link Road (750m)`,
      `Take the flyover / Vasai-Virar Link Road heading towards ${cleanDest}`,
      `Proceed for ${(distanceKm * 0.55).toFixed(1)} km along main sector road`,
      `Turn at ${cleanDest} landmark junction into residential lane`,
      `Arrive at customer delivery pin (Verify 4-digit OTP & POD)`,
    ];
  } else {
    return [
      `Depart from ${cleanOrigin} towards Pelhar / NH-48 Western Express Highway link (1.4 km)`,
      `Merge onto Vasai-Virar arterial corridor for ${(distanceKm * 0.6).toFixed(1)} km`,
      `Take exit towards ${cleanDest} main road`,
      `Continue past local station/market chowk towards customer building`,
      `Arrive at customer pinned coordinates (${distanceKm} km total)`,
    ];
  }
}
