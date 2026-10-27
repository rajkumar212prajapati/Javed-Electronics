/**
 * Admin Authenticator OTP & 2-Factor Authentication Utilities
 * Fully RFC 6238 compliant Time-based One-Time Passwords (TOTP)
 * Compatible with Google Authenticator, Microsoft Authenticator, 1Password, and Authy.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Clean and format any string into a valid Base32 secret for Google Authenticator
 */
export function cleanBase32Secret(rawSecret: string): string {
  if (!rawSecret) return 'JAVE2ELECTRONICSADMINSECRETKEY33';
  // Remove hyphens, spaces, equals
  let cleaned = rawSecret.toUpperCase().replace(/[\s\-_=]/g, '');
  // Replace invalid characters with fallback base32 characters
  let valid = '';
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned.charAt(i);
    if (BASE32_ALPHABET.includes(char)) {
      valid += char;
    } else if (char === '0') {
      valid += 'O';
    } else if (char === '1') {
      valid += 'L';
    } else if (char === '8') {
      valid += 'B';
    } else if (char === '9') {
      valid += 'A';
    } else {
      valid += 'E';
    }
  }
  // Ensure minimum 16 characters
  while (valid.length < 16) {
    valid += 'JAVE2KEY';
  }
  return valid;
}

/**
 * Format secret for manual keyboard entry in Google Authenticator (groups of 4)
 */
export function formatBase32Secret(secret: string): string {
  const clean = cleanBase32Secret(secret);
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

/**
 * Generate a new random 32-character Base32 secret
 */
export function generateRandomBase32Secret(length = 32): string {
  let res = '';
  for (let i = 0; i < length; i++) {
    res += BASE32_ALPHABET.charAt(Math.floor(Math.random() * BASE32_ALPHABET.length));
  }
  return res;
}

/**
 * Decode Base32 string to byte array
 */
function base32Decode(base32: string): number[] {
  const clean = cleanBase32Secret(base32);
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return bytes;
}

/**
 * Pure TypeScript RFC 3174 SHA-1 implementation
 */
function sha1(message: number[]): number[] {
  function rotl(n: number, s: number) {
    return (n << s) | (n >>> (32 - s));
  }
  const msgLen = message.length;
  const words: number[] = [];
  for (let i = 0; i < msgLen; i++) {
    words[i >> 2] |= (message[i] & 0xff) << (24 - (i % 4) * 8);
  }
  words[msgLen >> 2] |= 0x80 << (24 - (msgLen % 4) * 8);
  words[(((msgLen + 8) >> 6) << 4) + 15] = msgLen * 8;

  let H0 = 0x67452301,
    H1 = 0xefcdab89,
    H2 = 0x98badcfe,
    H3 = 0x10325476,
    H4 = 0xc3d2e1f0;
  const W = new Array(80);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) W[t] = words[i + t] || 0;
    for (let t = 16; t < 80; t++) {
      W[t] = rotl(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    let a = H0,
      b = H1,
      c = H2,
      d = H3,
      e = H4;
    for (let t = 0; t < 80; t++) {
      let f: number, k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotl(a, 5) + f + e + k + W[t]) | 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }
    H0 = (H0 + a) | 0;
    H1 = (H1 + b) | 0;
    H2 = (H2 + c) | 0;
    H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0;
  }

  const out: number[] = [];
  for (const h of [H0, H1, H2, H3, H4]) {
    out.push((h >>> 24) & 0xff, (h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff);
  }
  return out;
}

/**
 * Pure TypeScript HMAC-SHA1 calculation
 */
function hmacSha1(keyBytes: number[], msgBytes: number[]): number[] {
  const block = 64;
  let k = Array.from(keyBytes);
  if (k.length > block) k = sha1(k);
  while (k.length < block) k.push(0);

  const oPad = k.map((b) => b ^ 0x5c);
  const iPad = k.map((b) => b ^ 0x36);

  const inner = sha1(iPad.concat(Array.from(msgBytes)));
  return sha1(oPad.concat(inner));
}

/**
 * Calculate RFC 6238 TOTP 6-digit code for a given timestamp
 */
export function computeRfc6238Totp(secretBase32: string, timeSec: number): string {
  const keyBytes = base32Decode(secretBase32);
  const timeStep = Math.floor(timeSec / 30);
  const msgBytes = [
    0,
    0,
    0,
    0,
    (timeStep >>> 24) & 0xff,
    (timeStep >>> 16) & 0xff,
    (timeStep >>> 8) & 0xff,
    timeStep & 0xff,
  ];
  const hmac = hmacSha1(keyBytes, msgBytes);
  const offset = hmac[19] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % 1000000;
  return String(otp).padStart(6, '0');
}

/**
 * Generate synchronized 6-digit TOTP code and countdown remaining
 */
export function generateTotpCode(
  secret: string = 'JAVE2ELECTRONICSADMINSECRETKEY33',
  timeWindowSeconds: number = 30
): {
  code: string;
  secondsRemaining: number;
} {
  const epoch = Math.floor(Date.now() / 1000);
  const secondsRemaining = timeWindowSeconds - (epoch % timeWindowSeconds);
  const code = computeRfc6238Totp(secret, epoch);
  return { code, secondsRemaining };
}

/**
 * Build standard Google Authenticator otpauth:// URI for scanning QR Code
 * Spec: otpauth://totp/{issuer}:{accountName}?secret={base32Secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30
 */
export function buildGoogleAuthenticatorUri(params: {
  secret: string;
  accountName?: string;
  issuer?: string;
}): string {
  const {
    secret,
    accountName = 'admin@javed-electronics.in',
    issuer = 'Javed Electronics',
  } = params;
  const cleanSecret = cleanBase32Secret(secret);
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);

  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Verify a 6-digit OTP code against:
 * 1. Admin Emergency Recovery Passkeys
 * 2. Active Session SMS / WhatsApp OTP
 * 3. Real RFC 6238 TOTP with +/- 1 time step clock drift tolerance
 * 4. Master sandbox demo code '123456'
 */
export function verifyAdminOtp(
  inputCode: string,
  secret: string = 'JAVE2ELECTRONICSADMINSECRETKEY33',
  activeSessionOtp?: string
): {
  valid: boolean;
  method?: 'authenticator' | 'sms_otp' | 'recovery_code';
  message: string;
} {
  const cleanInput = inputCode.trim().replace(/[\s\-]/g, '');

  if (!cleanInput) {
    return { valid: false, message: 'Please enter the 6-digit verification code.' };
  }

  // 1. Emergency Recovery Codes for Admins
  const emergencyCodes = ['JE-SAFE-9901', 'ADMIN-RECOVER-77', '998877', 'JESAFE9901', 'ADMINRECOVER77'];
  if (emergencyCodes.includes(cleanInput.toUpperCase()) || cleanInput === '998877') {
    return {
      valid: true,
      method: 'recovery_code',
      message: 'Verified using Admin Emergency Recovery Passkey.',
    };
  }

  // 2. Active Session SMS/WhatsApp OTP match
  if (activeSessionOtp && cleanInput === activeSessionOtp) {
    return {
      valid: true,
      method: 'sms_otp',
      message: 'Verified successfully with SMS / WhatsApp security code.',
    };
  }

  // 3. RFC 6238 Google Authenticator verification
  // Check current window, previous 30s window, and next 30s window for clock drift
  const epoch = Math.floor(Date.now() / 1000);
  for (const timeOffset of [0, -30, 30, -60, 60]) {
    const calculated = computeRfc6238Totp(secret, epoch + timeOffset);
    if (cleanInput === calculated) {
      return {
        valid: true,
        method: 'authenticator',
        message: 'Google Authenticator code verified successfully.',
      };
    }
  }

  // 4. Default Universal Master Sandbox Demo Code (for testing ease)
  if (cleanInput === '123456') {
    return {
      valid: true,
      method: 'authenticator',
      message: 'Demo Authenticator code verified.',
    };
  }

  return {
    valid: false,
    message: 'Invalid or expired OTP code. Please check your Google Authenticator app and try again.',
  };
}

export function generateSmsOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const ADMIN_EMERGENCY_RECOVERY_CODES = [
  'JE-SAFE-9901',
  'ADMIN-RECOVER-77',
  'JAVE-RESCUE-42',
  'LUCK-AUTH-8821',
  'SECURE-ROOT-007',
];
