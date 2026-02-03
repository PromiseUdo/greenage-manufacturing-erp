// lib/unitIdGenerator.ts - Unit ID Generation Service

import { prisma } from '@/lib/prisma';

/**
 * Generate unique 8-character unit IDs for production units
 *
 * Format: [PRODUCT_CODE][5-DIGIT_SERIAL]
 * Example: INV50001, UPS30015, BAT20234
 *
 * @param productId - The product ID
 * @param quantity - Number of unit IDs to generate
 * @returns Array of unique unit IDs
 */
export async function generateUnitIds(
  productId: string,
  quantity: number,
): Promise<string[]> {
  // Use transaction to ensure atomic counter increment
  const result = await prisma.$transaction(async (tx) => {
    // Get product with current counter
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: {
        productCode: true,
        lastUnitNumber: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.productCode) {
      throw new Error('Product must have a product code to generate unit IDs');
    }

    // Validate product code format (3-4 uppercase alphanumeric)
    if (!/^[A-Z0-9]{3,4}$/.test(product.productCode)) {
      throw new Error(
        'Product code must be 3-4 uppercase alphanumeric characters',
      );
    }

    // Generate sequential unit IDs
    const unitIds: string[] = [];
    let currentNumber = product.lastUnitNumber;

    for (let i = 0; i < quantity; i++) {
      currentNumber++;
      // Pad to 5 digits with leading zeros
      const serialNumber = currentNumber.toString().padStart(5, '0');
      const unitId = `${product.productCode}${serialNumber}`;
      unitIds.push(unitId);
    }

    // Update product counter
    await tx.product.update({
      where: { id: productId },
      data: { lastUnitNumber: currentNumber },
    });

    return unitIds;
  });

  return result;
}

/**
 * Validate unit ID format
 *
 * @param unitId - The unit ID to validate
 * @returns true if valid, false otherwise
 */
export function validateUnitId(unitId: string): boolean {
  // Format: 3-4 letter code + 5 digits = 8-9 characters
  return /^[A-Z0-9]{3,4}\d{5}$/.test(unitId);
}

/**
 * Parse unit ID to extract product code and serial number
 *
 * @param unitId - The unit ID to parse
 * @returns Object with productCode and serialNumber
 */
export function parseUnitId(unitId: string): {
  productCode: string;
  serialNumber: number;
} | null {
  const match = unitId.match(/^([A-Z0-9]{3,4})(\d{5})$/);

  if (!match) {
    return null;
  }

  return {
    productCode: match[1],
    serialNumber: parseInt(match[2], 10),
  };
}

/**
 * Generate QR code data for a unit
 * Can include additional information beyond just the unit ID
 *
 * @param unitId - The unit ID
 * @param additionalData - Optional additional data
 * @returns QR code data string
 */
export function generateQRCodeData(
  unitId: string,
  additionalData?: {
    orderNumber?: string;
    productName?: string;
    manufactureDate?: Date;
  },
): string {
  // Simple format: just the unit ID
  if (!additionalData) {
    return unitId;
  }

  // Extended format with additional info
  const data: any = {
    id: unitId,
    ...additionalData,
  };

  return JSON.stringify(data);
}

/**
 * Check if a unit ID already exists
 *
 * @param unitId - The unit ID to check
 * @returns true if exists, false otherwise
 */
export async function unitIdExists(unitId: string): Promise<boolean> {
  const unit = await prisma.productionUnit.findUnique({
    where: { unitId },
    select: { id: true },
  });

  return !!unit;
}
