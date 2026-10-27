/**
 * Volumetric (Dimensional) Weight Calculator for Logistics & Express Courier (Shiprocket, Delhivery, Blue Dart)
 * Standard Formula: Volumetric Weight (kg) = (Length (cm) * Width (cm) * Height (cm)) / Divisor
 */

export interface VolumetricCalculationResult {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeCubicCm: number;
  deadWeightKg: number;
  divisor: number;
  volumetricWeightKg: number;
  billableWeightKg: number;
  isVolumetricHigher: boolean;
  weightDifferenceKg: number;
  packageCategory: string;
  packagingRecommendation: string;
  estimatedFreightTier: string;
}

export type CourierDivisor = 5000 | 4000 | 6000 | 4500;

export const COURIER_DIVISORS: Array<{ value: CourierDivisor; label: string; description: string }> = [
  {
    value: 5000,
    label: 'Standard Express (5000) - Recommended',
    description: 'Shiprocket, Blue Dart, Delhivery Air & Surface Express standard',
  },
  {
    value: 4000,
    label: 'Surface Bulk Cargo (4000)',
    description: 'Heavy freight, road logistics, appliances & pallet transport',
  },
  {
    value: 6000,
    label: 'Economy / Hyperlocal (6000)',
    description: 'Select postal parcel networks & hyperlocal two-wheeler deliveries',
  },
];

/**
 * Calculates volumetric weight and determines chargeable billable weight
 */
export function calculateVolumetricMetrics(params: {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  deadWeightKg: number;
  divisor?: number;
}): VolumetricCalculationResult {
  const { lengthCm, widthCm, heightCm, deadWeightKg, divisor = 5000 } = params;

  const validLength = Math.max(0.1, Number(lengthCm) || 0.1);
  const validWidth = Math.max(0.1, Number(widthCm) || 0.1);
  const validHeight = Math.max(0.1, Number(heightCm) || 0.1);
  const validDeadWeight = Math.max(0.01, Number(deadWeightKg) || 0.01);
  const validDivisor = divisor > 0 ? divisor : 5000;

  const volumeCubicCm = validLength * validWidth * validHeight;
  const rawVolumetricWeight = volumeCubicCm / validDivisor;
  // Round to 3 decimal places
  const volumetricWeightKg = Number(rawVolumetricWeight.toFixed(3));
  const billableWeightKg = Number(Math.max(validDeadWeight, volumetricWeightKg).toFixed(3));
  const isVolumetricHigher = volumetricWeightKg > validDeadWeight;
  const weightDifferenceKg = Number(Math.abs(volumetricWeightKg - validDeadWeight).toFixed(3));

  // Determine packaging category
  let packageCategory = 'Standard Parcel';
  let packagingRecommendation = 'Corrugated cardboard carton with bubble wrap';
  let estimatedFreightTier = 'Tier 1 (Up to 0.5 kg)';

  const maxDimension = Math.max(validLength, validWidth, validHeight);

  if (maxDimension <= 18 && volumeCubicCm < 1500 && billableWeightKg <= 0.4) {
    packageCategory = 'Flyer / Padded Envelope';
    packagingRecommendation = 'Tamper-proof bubble poly mailer (Accessories, Smartwatches, Earbuds)';
    estimatedFreightTier = 'Tier 1 (Up to 0.5 kg Standard Local)';
  } else if (maxDimension <= 25 && volumeCubicCm < 6000 && billableWeightKg <= 1.0) {
    packageCategory = 'Small Parcel Box';
    packagingRecommendation = '3-ply rigid corrugated box (Smartphones, Small Chargers, Audio)';
    estimatedFreightTier = 'Tier 2 (0.5 kg - 1.0 kg Express)';
  } else if (maxDimension <= 45 && volumeCubicCm < 25000 && billableWeightKg <= 4.0) {
    packageCategory = 'Medium Carton';
    packagingRecommendation = '5-ply reinforced box with corner guards (Soundbars, Tablets, Monitors)';
    estimatedFreightTier = 'Tier 3 (1.0 kg - 5.0 kg Cargo)';
  } else if (maxDimension <= 120 || billableWeightKg <= 15.0) {
    packageCategory = 'Large Heavy Carton';
    packagingRecommendation = '7-ply heavy-duty shipping box with foam cushions (32"-55" Smart TVs, Sound Systems)';
    estimatedFreightTier = 'Tier 4 (5.0 kg - 15.0 kg Heavy Courier)';
  } else {
    packageCategory = 'Oversized Bulk Freight / Pallet';
    packagingRecommendation = 'Wooden reinforced crate with moisture barrier (Large Appliances, Refrigerator, Multi-Unit Pallet)';
    estimatedFreightTier = 'Tier 5 (Special Heavy Freight Cargo)';
  }

  return {
    lengthCm: validLength,
    widthCm: validWidth,
    heightCm: validHeight,
    volumeCubicCm: Math.round(volumeCubicCm),
    deadWeightKg: validDeadWeight,
    divisor: validDivisor,
    volumetricWeightKg,
    billableWeightKg,
    isVolumetricHigher,
    weightDifferenceKg,
    packageCategory,
    packagingRecommendation,
    estimatedFreightTier,
  };
}

/**
 * Parses dimension string like "161.2 x 74.2 x 8 mm" or "18 x 14 x 8 cm" into cm values
 */
export function parseDimensionString(dimStr: string): { lengthCm: number; widthCm: number; heightCm: number } {
  if (!dimStr) return { lengthCm: 15, widthCm: 10, heightCm: 5 };

  const isMm = dimStr.toLowerCase().includes('mm');
  const numbers = dimStr
    .replace(/[^\d.xX*]/g, ' ')
    .split(/[xX*]/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  if (numbers.length >= 3) {
    const factor = isMm ? 0.1 : 1; // Convert mm to cm
    return {
      lengthCm: Number((numbers[0] * factor).toFixed(1)),
      widthCm: Number((numbers[1] * factor).toFixed(1)),
      heightCm: Number((numbers[2] * factor).toFixed(1)),
    };
  }

  return { lengthCm: 18, widthCm: 14, heightCm: 8 };
}
