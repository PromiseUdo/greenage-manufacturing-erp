// lib/serialNumber.ts - Serial Number Generation Utility

/**
 * Generates a unique 8-character serial number
 * Format: XXXX-XXXX (alphanumeric)
 * Example: A3B7-K2M9
 */
export function generateSerialNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars (0,O,1,I)
  let serial = '';

  for (let i = 0; i < 8; i++) {
    if (i === 4) {
      serial += '-'; // Add dash in middle
    }
    const randomIndex = Math.floor(Math.random() * chars.length);
    serial += chars[randomIndex];
  }

  return serial;
}

/**
 * Generates multiple unique serial numbers
 * Ensures no duplicates within the batch
 */
export async function generateUniqueSerialNumbers(
  count: number,
  prisma: any,
): Promise<string[]> {
  const serials: string[] = [];
  const maxAttempts = count * 10; // Prevent infinite loops
  let attempts = 0;

  while (serials.length < count && attempts < maxAttempts) {
    attempts++;
    const serial = generateSerialNumber();

    // Check if already in current batch
    if (serials.includes(serial)) continue;

    // Check if exists in database
    const existing = await prisma.productionUnit.findUnique({
      where: { serialNumber: serial },
    });

    if (!existing) {
      serials.push(serial);
    }
  }

  if (serials.length < count) {
    throw new Error('Failed to generate enough unique serial numbers');
  }

  return serials;
}

/**
 * Format serial number for display
 */
export function formatSerialNumber(serial: string): string {
  return serial.toUpperCase();
}

/**
 * Validate serial number format
 */
export function isValidSerialNumber(serial: string): boolean {
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(serial);
}
