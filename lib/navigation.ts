// lib/navigation.ts - UPDATED VERSION

import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import BadgeIcon from '@mui/icons-material/Badge';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HandymanIcon from '@mui/icons-material/Handyman';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';

import { SvgIconProps } from '@mui/material';

export interface NavItem {
  label: string;
  path?: string;
  icon: React.ComponentType<SvgIconProps>;
  children?: NavItem[];
  /** Permission key required to view this item. Omit for items visible to all. */
  permission?: string;
}

/**
 * Recursively filters nav items based on the user's permissions.
 * Items without a `permission` key are always visible.
 * Parent items are kept only if they have at least one visible child.
 */
export function filterNavItems(items: NavItem[], permissions: string[]): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    if (item.children?.length) {
      const filteredChildren = filterNavItems(item.children, permissions);
      if (filteredChildren.length > 0) {
        acc.push({ ...item, children: filteredChildren });
      }
      return acc;
    }
    if (!item.permission || permissions.includes(item.permission)) {
      acc.push(item);
    }
    return acc;
  }, []);
}

/**
 * Returns navigation groups filtered to what the user can see.
 * ADMIN role bypasses all permission checks.
 */
export function getFilteredNavigation(
  role: string | undefined,
  permissions: string[],
) {
  if (role === 'ADMIN') return navigation;
  return navigation
    .map((group) => ({ ...group, items: filterNavItems(group.items, permissions) }))
    .filter((group) => group.items.length > 0);
}

export const navigation: { section: string; items: NavItem[] }[] = [
  {
    section: 'Main',
    // Dashboard is visible to everyone — no permission required
    items: [{ label: 'Dashboard', path: '/dashboard', icon: DashboardIcon }],
  },
  {
    section: 'Production',
    items: [
      {
        label: 'Products',
        icon: Inventory2Icon,
        path: '/products',
        permission: 'products:read',
      },
      {
        label: 'Production',
        icon: PrecisionManufacturingIcon,
        children: [
          {
            label: 'Orders',
            path: '/production/orders',
            icon: DescriptionIcon,
            permission: 'production_orders:read',
          },
          {
            label: 'Backorders',
            path: '/production/requests',
            icon: InventoryIcon,
            permission: 'production_orders:read',
          },
          {
            label: 'Returns',
            path: '/production/returns',
            icon: AssignmentReturnIcon,
            permission: 'production_orders:read',
          },
        ],
      },
    ],
  },

  {
    section: 'Sales & Distribution',
    items: [
      {
        label: 'Sales',
        icon: ShoppingCartIcon,
        children: [
          { label: 'Overview', path: '/sales/overview', icon: DashboardIcon, permission: 'sales:read' },
          { label: 'Quotes', path: '/sales/quotes', icon: DescriptionIcon, permission: 'sales:read' },
          { label: 'Invoices', path: '/sales/invoices', icon: ReceiptIcon, permission: 'sales:read' },
          { label: 'Orders', path: '/sales/orders', icon: DescriptionIcon, permission: 'sales:read' },
          {
            label: 'Backorders',
            path: '/sales/backorders',
            icon: WarningAmberIcon,
            permission: 'sales:read',
          },
        ],
      },
      {
        label: 'Store',
        icon: StorefrontIcon,
        children: [
          {
            label: 'Overview',
            path: '/sales/store/overview',
            icon: DashboardIcon,
            permission: 'store:read',
          },
          { label: 'Stock', path: '/sales/store', icon: Inventory2Icon, permission: 'store:read' },
          {
            label: 'Receipts',
            path: '/sales/store/receipts',
            icon: ReceiptIcon,
            permission: 'store:read',
          },
          {
            label: 'Pending Production',
            path: '/sales/store/pending-production',
            icon: PrecisionManufacturingIcon,
            permission: 'store:read',
          },
          {
            label: 'Dispatches',
            path: '/sales/store/dispatches',
            icon: LocalShippingIcon,
            permission: 'store:read',
          },
          {
            label: 'Returns',
            path: '/inventory/returns',
            icon: AssignmentReturnIcon,
            permission: 'store:read',
          },
        ],
      },
    ],
  },

  {
    section: 'Management',
    items: [
      {
        label: 'Inventory',
        icon: InventoryIcon,
        children: [
          { label: 'Overview', path: '/inventory', icon: DashboardIcon, permission: 'inventory:read' },
          {
            label: 'Materials',
            path: '/inventory/materials',
            icon: CategoryIcon,
            permission: 'inventory:read',
          },
          {
            label: 'Tools',
            path: '/inventory/tools',
            icon: HandymanIcon,
            permission: 'inventory:read',
          },
          {
            label: 'Issuance',
            path: '/inventory/issuance',
            icon: AssignmentReturnIcon,
            permission: 'inventory:read',
          },
          { label: 'GRN', path: '/inventory/grn', icon: LocalShippingIcon, permission: 'inventory:read' },
          {
            label: 'Production Requests',
            path: '/inventory/production-requests',
            icon: PrecisionManufacturingIcon,
            permission: 'inventory:read',
          },
        ],
      },
    ],
  },
  {
    section: 'Procurement',
    items: [
      {
        label: 'Suppliers',
        path: '/inventory/suppliers',
        icon: PeopleIcon,
        permission: 'procurement:read',
      },
      {
        label: 'PO Groups',
        path: '/inventory/po-groups',
        icon: Inventory2Icon,
        permission: 'procurement:read',
      },
      {
        label: 'Purchase Orders',
        path: '/inventory/purchase-orders',
        icon: DescriptionIcon,
        permission: 'procurement:read',
      },
    ],
  },
  {
    section: 'Administration',
    items: [
      {
        label: 'Staff',
        icon: BadgeIcon,
        children: [
          {
            label: 'Employees',
            path: '/staff/employees',
            icon: PeopleIcon,
            permission: 'users:read',
          },
        ],
      },
      {
        label: 'Customers',
        icon: StorefrontIcon,
        path: '/customers',
        permission: 'customers:read',
      },
      {
        label: 'Settings',
        icon: SettingsIcon,
        children: [
          {
            label: 'Roles & Permissions',
            path: '/settings/roles',
            icon: SecurityIcon,
            permission: 'roles:read',
          },
          {
            label: 'Departments',
            path: '/settings/departments',
            icon: BusinessIcon,
            permission: 'roles:read',
          },
          {
            label: 'Company Details',
            path: '/settings/company',
            icon: BusinessIcon,
            permission: 'roles:read',
          },
        ],
      },
    ],
  },
];
