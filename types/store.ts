// types/store.ts

import { StoreItem, Product, StoreItemCondition, ProductCategory } from '@prisma/client';

// Extended type with product relation
export type StoreItemWithRelations = StoreItem & {
  product?: Product | null;
};

// Form data for create/edit
export interface StoreItemFormData {
  itemNumber: string;
  name: string;
  productId?: string;
  category: string;
  quantity: number;
  unit: string;
  location?: string;
  condition: string;
  unitPrice?: number;
  batchNumber?: string;
  productionDate?: string;
  warrantyExpiry?: string;
  notes?: string;
}

// Store Receipt (SRN) types
export interface StoreReceiptItemInput {
  storeItemId: string;
  quantity: number;
  batchNumber?: string;
  notes?: string;
}

export interface StoreReceiptFormData {
  source: string;
  referenceNumber?: string;
  items: StoreReceiptItemInput[];
  notes?: string;
}

// Store Dispatch types
export interface StoreDispatchItemInput {
  storeItemId: string;
  quantity: number;
  notes?: string;
}

export interface StoreDispatchFormData {
  customerId: string;
  invoiceId?: string;
  items: StoreDispatchItemInput[];
  deliveryMethod?: string;
  deliveryAddress?: string;
  notes?: string;
}
