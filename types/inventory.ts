// src/types/inventory.ts

import {
  Material,
  MaterialBatch,
  Supplier,
  MaterialIssuance,
  GRN,
} from '@prisma/client';

export interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

// Extended types with relations
export type MaterialWithRelations = Material & {
  supplier?: Supplier | null;
  batches?: MaterialBatch[];
  issuances?: MaterialIssuance[];
  _count?: {
    batches: number;
    issuances: number;
  };
};

export type BatchWithMaterial = MaterialBatch & {
  material: Material;
};

export type GRNWithSupplier = GRN & {
  supplier: Supplier;
  batches?: BatchWithMaterial[];
  attachments?: FileAttachment[]; // NEW: Add this line
};
// export type GRNWithSupplier = GRN & {
//   supplier: Supplier;
//   batches?: MaterialBatch[];
// };

export type IssuanceWithMaterial = MaterialIssuance & {
  material: Material;
};

// Form types
export interface MaterialFormData {
  name: string;
  partNumber: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  maxStockLevel?: number;
  unitCost?: number;
  supplierId?: string;
}

export interface SupplierFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: string;
  paymentTerms?: string;
}

export interface MaterialIssuanceFormData {
  materialId: string;
  quantity: number;
  batchNumber: string;
  issuedTo: string;
  purpose?: string;
  orderId?: string;
}

export interface GRNFormData {
  supplierId: string;
  invoiceNumber?: string;
  items: GRNItemInput[];
  notes?: string;
  attachments?: FileAttachment[]; // NEW: Add this line
}

export interface GRNItemInput {
  materialId: string;
  quantity: number;
  batchNumber: string;
  expiryDate?: Date;
  supplierBatchNo?: string;
}

// Filter types
export interface MaterialFilters {
  category?: string;
  lowStock?: boolean;
  search?: string;
  supplierId?: string;
}

// Statistics types
export interface InventoryStats {
  totalMaterials: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalSuppliers: number;
  recentIssuances: number;
  categories: {
    category: string;
    count: number;
    value: number;
  }[];
  lowStockAlerts: StockAlert[];
}

// Stock movement types
export interface StockMovement {
  type: 'IN' | 'OUT';
  materialId: string;
  quantity: number;
  reference: string;
  date: Date;
  notes?: string;
}

// Alert types
export interface StockAlert {
  materialId: string;
  materialName: string;
  partNumber: string;
  currentStock: number;
  reorderLevel: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NEAR_EXPIRY';
  severity: 'warning' | 'error' | 'info';
}
