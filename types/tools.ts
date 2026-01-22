// src/types/tools.ts

import { Tool, ToolLending, ToolMaintenance } from '@prisma/client';

// Extended types with relations
export type ToolWithLendings = Tool & {
  lendings?: ToolLending[];
  maintenanceHistory?: ToolMaintenance[];
  _count?: {
    lendings: number;
  };
};

export type LendingWithTool = ToolLending & {
  tool: Tool;
};

// Form types
export interface ToolFormData {
  name: string;
  toolNumber: string;
  category: string;
  description?: string;
  serialNumber?: string;
  manufacturer?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  location?: string;
  condition: string;
}

export interface ToolLendingFormData {
  toolId: string;
  issuedTo: string;
  department?: string;
  purpose?: string;
  orderId?: string;
  projectName?: string;
  expectedReturn?: Date;
}

export interface ToolReturnFormData {
  returnCondition: string;
  returnNotes?: string;
}

// Statistics
export interface ToolStats {
  totalTools: number;
  availableTools: number;
  inUseTools: number;
  underMaintenanceTools: number;
  overdueReturns: number;
  categories: {
    category: string;
    count: number;
    available: number;
  }[];
}

// Filters
export interface ToolFilters {
  category?: string;
  status?: string;
  search?: string;
  condition?: string;
}
