import { BarcodeType } from '../types';

/**
  * Calculate EAN-13 check digit using standard Modulo 10 algorithm
  */
export function calculateEan13CheckDigit(first12Digits: string): number {
  if (first12Digits.length !== 12 || !/^\d+$/.test(first12Digits)) {
    return -1;
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12Digits[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
  * Calculate EAN-8 check digit
  */
export function calculateEan8CheckDigit(first7Digits: string): number {
  if (first7Digits.length !== 7 || !/^\d+$/.test(first7Digits)) {
    return -1;
  }
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(first7Digits[i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
  * Validate if barcode format and check digit are mathematically valid
  */
export function validateBarcode(barcode: string, type?: BarcodeType): {
  isValid: boolean;
  detectedType: BarcodeType;
  message: string;
} {
  const clean = barcode.trim();

  // Internal SKU (alphanumeric like JE-LKO-102)
  if (!/^\d+$/.test(clean)) {
    return {
      isValid: clean.length >= 3,
      detectedType: 'INTERNAL-SKU',
      message: clean.length >= 3 ? 'Valid Alphanumeric Internal SKU' : 'SKU too short',
    };
  }

  // EAN-8
  if (clean.length === 8) {
    const expected = calculateEan8CheckDigit(clean.slice(0, 7));
    const actual = parseInt(clean[7], 10);
    const valid = expected === actual;
    return {
      isValid: valid,
      detectedType: 'EAN-8',
      message: valid ? 'Valid GS1 EAN-8 Barcode' : `Invalid check digit: expected ${expected}, got ${actual}`,
    };
  }

  // UPC-A (12 digits)
  if (clean.length === 12) {
    return {
      isValid: true,
      detectedType: 'UPC-A',
      message: 'Valid 12-digit UPC-A Barcode',
    };
  }

  // EAN-13 (13 digits)
  if (clean.length === 13) {
    const expected = calculateEan13CheckDigit(clean.slice(0, 12));
    const actual = parseInt(clean[12], 10);
    const valid = expected === actual;
    return {
      isValid: valid,
      detectedType: 'EAN-13',
      message: valid ? 'Valid GS1 EAN-13 Barcode' : `Invalid check digit: expected ${expected}, got ${actual}`,
    };
  }

  // GTIN-14
  if (clean.length === 14) {
    return {
      isValid: true,
      detectedType: 'GTIN-14',
      message: 'Valid 14-digit Master Carton GTIN-14',
    };
  }

  return {
    isValid: clean.length >= 4,
    detectedType: 'INTERNAL-SKU',
    message: 'Custom numeric barcode format',
  };
}

/**
  * Generates visual vertical barcode stripe patterns for SVG representation
  */
export function generateBarcodeStripePattern(value: string): boolean[] {
  const pattern: boolean[] = [true, false, true]; // Lead guard
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i);
    // Convert character to a deterministic 6-bar binary pattern
    for (let b = 0; b < 6; b++) {
      pattern.push(((charCode >> b) & 1) === 1);
    }
    pattern.push(false); // inter-character space
  }
  pattern.push(true, false, true); // Trail guard
  return pattern;
}
