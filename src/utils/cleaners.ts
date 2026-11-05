/**
 * Helper utilities for cleaning user-facing text, avoiding unwanted role tags,
 * duplicate locations, and verbose copy.
 */

export function cleanCustomerName(rawName?: string | null): string {
  if (!rawName) return 'Customer';
  let cleaned = rawName
    .replace(/\s*\((Super Admin|Admin|Store Manager|Branch Manager|Staff|Rider|Express Courier|Customer)\)/gi, '')
    .replace(/Platform Administrator/gi, 'Javed Akhtar')
    .trim();
  return cleaned || 'Customer';
}

export function cleanAddressDisplay(address?: {
  addressLine?: string;
  address?: string;
  area?: string;
  city?: string;
  pincode?: string;
  state?: string;
} | null): string {
  if (!address) return '';
  const street = (address.addressLine || address.address || '').trim();
  let area = (address.area || '').trim();
  let city = (address.city || '').trim();
  const pin = (address.pincode || '').trim();

  // If area contains Hazratganj and city is Nalasopara (or vice versa), standardize to Nalasopara
  if (area.toLowerCase().includes('hazratganj') && city.toLowerCase().includes('nalasopara')) {
    area = 'Nalasopara East';
  }

  const parts: string[] = [];
  if (street) parts.push(street);
  if (area && !street.toLowerCase().includes(area.toLowerCase())) parts.push(area);
  if (city && !street.toLowerCase().includes(city.toLowerCase()) && !area.toLowerCase().includes(city.toLowerCase())) {
    parts.push(city);
  }

  const base = parts.join(', ');
  return pin ? `${base} - ${pin}` : base;
}
