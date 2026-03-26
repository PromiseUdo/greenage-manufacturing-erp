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
}

export const navigation: { section: string; items: NavItem[] }[] = [
  {
    section: 'Main',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: DashboardIcon }],
  },
  {
    section: 'Production',
    items: [
      {
        label: 'Products',
        icon: Inventory2Icon,
        path: '/products',
      },
      {
        label: 'Production',
        icon: PrecisionManufacturingIcon,
        children: [
          { label: 'Orders', path: '/production/orders', icon: DescriptionIcon },
          { label: 'Requests', path: '/production/requests', icon: InventoryIcon },
          { label: 'Returns', path: '/production/returns', icon: AssignmentReturnIcon },
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
          { label: 'Overview', path: '/sales/overview', icon: DashboardIcon },
          { label: 'Quotes', path: '/sales/quotes', icon: DescriptionIcon },
          { label: 'Invoices', path: '/sales/invoices', icon: ReceiptIcon },
                    { label: 'Orders', path: '/sales/orders', icon: DescriptionIcon },
          { label: 'Backorders', path: '/sales/backorders', icon: WarningAmberIcon },
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
          },
          { label: 'Stock', path: '/sales/store', icon: Inventory2Icon },
          { label: 'Receipts', path: '/sales/store/receipts', icon: ReceiptIcon },
          {
            label: 'Pending Production',
            path: '/sales/store/pending-production',
            icon: PrecisionManufacturingIcon,
          },
          {
            label: 'Dispatches',
            path: '/sales/store/dispatches',
            icon: LocalShippingIcon,
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
          { label: 'Overview', path: '/inventory', icon: DashboardIcon },
          {
            label: 'Materials',
            path: '/inventory/materials',
            icon: CategoryIcon,
          },
          {
            label: 'Tools',
            path: '/inventory/tools',
            icon: HandymanIcon,
          },
          {
            label: 'Issuance',
            path: '/inventory/issuance',
            icon: AssignmentReturnIcon,
          },
          { label: 'GRN', path: '/inventory/grn', icon: LocalShippingIcon },
          {
            label: 'Production Requests',
            path: '/inventory/production-requests',
            icon: PrecisionManufacturingIcon,
          },
          { label: 'Returns', path: '/inventory/returns', icon: AssignmentReturnIcon },
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
      },
      {
        label: 'PO Groups',
        path: '/inventory/po-groups',
        icon: Inventory2Icon,
      },
      {
        label: 'Purchase Orders',
        path: '/inventory/purchase-orders',
        icon: DescriptionIcon,
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
          },
        ],
      },
      {
        label: 'Customers',
        icon: StorefrontIcon,
        path: '/customers', // Direct path instead of children
      },
      {
        label: 'Settings',
        icon: SettingsIcon,
        children: [
          {
            label: 'Roles & Permissions',
            path: '/settings/roles',
            icon: SecurityIcon,
          },
          {
            label: 'Departments',
            path: '/settings/departments',
            icon: BusinessIcon,
          },
          {
            label: 'Company Details',
            path: '/settings/company',
            icon: BusinessIcon,
          },
        ],
      },
    ],
  },
];
