export interface Coordinates {
  lat: number;
  lng: number;
}

// Store Coordinates for Lucknow Outlets
export const DEFAULT_STORE_COORDINATES: Coordinates = {
  lat: 26.8467,
  lng: 80.9462, // Hazratganj Flagship Outlet
};

// Popular Lucknow Landmarks with exact coordinates for easy customer pin selection
export const LUCKNOW_POPULAR_LANDMARKS = [
  { name: 'Hazratganj Main Market', lat: 26.8467, lng: 80.9462, pincode: '226001', area: 'Hazratganj' },
  { name: 'Patrakarpuram, Gomti Nagar', lat: 26.8524, lng: 80.9984, pincode: '226010', area: 'Gomti Nagar' },
  { name: 'Bhootnath Market, Indira Nagar', lat: 26.8742, lng: 80.9856, pincode: '226016', area: 'Indira Nagar' },
  { name: 'Alambagh Bus Station', lat: 26.8142, lng: 80.9023, pincode: '226005', area: 'Alambagh' },
  { name: 'Mahanagar Gol Chauraha', lat: 26.8721, lng: 80.9528, pincode: '226006', area: 'Mahanagar' },
  { name: 'Aminabad Market', lat: 26.8443, lng: 80.9261, pincode: '226018', area: 'Aminabad' },
  { name: 'Chowk Clock Tower', lat: 26.8687, lng: 80.9085, pincode: '226003', area: 'Chowk' },
  { name: 'Lulu Mall Lucknow, Amar Shaheed Path', lat: 26.7725, lng: 80.9998, pincode: '226030', area: 'Sushant Golf City' },
  { name: 'Charbagh Railway Station', lat: 26.8315, lng: 80.9221, pincode: '226004', area: 'Charbagh' },
  { name: 'Jankipuram Extension', lat: 26.9142, lng: 80.9482, pincode: '226021', area: 'Jankipuram' },
];

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
 */
export function interpolateCoordinates(
  start: Coordinates,
  end: Coordinates,
  progress: number
): Coordinates {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return {
    lat: start.lat + (end.lat - start.lat) * clampedProgress,
    lng: start.lng + (end.lng - start.lng) * clampedProgress,
  };
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
 * Generates turn-by-turn simulated routing steps for rider navigation
 */
export function generateSuggestedRouteSteps(
  originName: string,
  destinationArea: string,
  distanceKm: number
): string[] {
  if (distanceKm <= 2) {
    return [
      `Depart from ${originName} and proceed straight on main avenue (400m)`,
      `Turn towards ${destinationArea} service lane`,
      `Arrive at customer delivery pin (Destination on right)`,
    ];
  } else if (distanceKm <= 6) {
    return [
      `Depart from ${originName} via commercial arterial link (800m)`,
      `Take flyover / bypass heading towards ${destinationArea}`,
      `Exit onto ${destinationArea} sector main road (2.1 km)`,
      `Turn into customer colony / landmark gate`,
      `Arrive at customer delivery doorstep`,
    ];
  } else {
    return [
      `Depart from ${originName} towards Ring Road / Amar Shaheed Path expressway (1.5 km)`,
      `Merge onto expressway and proceed for ${(distanceKm * 0.6).toFixed(1)} km`,
      `Take exit towards ${destinationArea} junction`,
      `Continue through sector market road to customer colony`,
      `Arrive at destination coordinates`,
    ];
  }
}
