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
        label: 'Production Requests',
        icon: PrecisionManufacturingIcon,
        path: '/production/requests',
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
            label: 'Suppliers',
            path: '/inventory/suppliers',
            icon: PeopleIcon,
          },
          {
            label: 'Purchase Orders',
            path: '/inventory/purchase-orders',
            icon: DescriptionIcon,
          },
          {
            label: 'Issuance',
            path: '/inventory/issuance',
            icon: AssignmentReturnIcon,
          },
          { label: 'GRN', path: '/inventory/grn', icon: LocalShippingIcon },
        ],
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
    ],
  },
];
